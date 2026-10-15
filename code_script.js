const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.setAttribute('style', v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') {
      const evt = k.slice(2).toLowerCase();
      const opts = /^(touch|wheel|scroll)/.test(evt) ? { passive: true } : undefined;
      el.addEventListener(evt, v, opts);
    } else el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
};

const raw = (html) => {
  const t = document.createElement('template');
  t.innerHTML = String(html ?? '').trim();
  return t.content;
};

const shuffle = (arr) => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const loadJSON = async (path, signal) => {
  const res = await fetch(path, { signal, cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json();
};

const buzz = (ms = 8) => { if (navigator.vibrate) navigator.vibrate(ms); };

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const runTransition = (mutate) => {
  if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) {
    mutate();
    return;
  }
  document.startViewTransition(mutate);
};

const countUp = (el, target, duration = 800) => {
  if (prefersReducedMotion()) { el.textContent = String(target); return; }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = String(target);
  };
  requestAnimationFrame(tick);
};

/* ── store ─────────────────────────────────────────────── */
const createStore = (reducer, initial) => {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    dispatch: (a) => {
      const next = reducer(state, a);
      if (next === state) return;
      state = next;
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
};

/* ── reducer ───────────────────────────────────────────── */
const EMPTY_CONFIG = {
  app: { title: 'LogicDeck', tagline: '' },
  quiz: { questionsPerRound: 10, shuffleQuestions: true, shuffleOptions: true },
  features: { stepsDrawer: true, keyboardShortcuts: true },
  ui: { defaultCategory: 'all' },
  categories: [{ id: 'all', label: 'Everything' }],
};

const initialState = () => ({
  ready: false, error: null, view: 'home',
  config: EMPTY_CONFIG, bank: [], category: 'all',
  deck: [], index: 0, selectedId: null, revealed: false,
  answers: [], stepsOpen: false,
});

const buildRound = (s, category) => {
  const pool = category === 'all' ? s.bank : s.bank.filter((q) => q.category === category);
  if (!pool.length) return { ...s, error: `No questions in "${category}".` };
  const size = Math.min(s.config.quiz.questionsPerRound, pool.length);
  const ordered = s.config.quiz.shuffleQuestions ? shuffle(pool) : pool;
  const deck = ordered.slice(0, size).map((q) =>
    s.config.quiz.shuffleOptions ? { ...q, options: shuffle(q.options) } : q,
  );
  return { ...s, view: 'quiz', category, deck, index: 0, answers: [], selectedId: null, revealed: false, stepsOpen: false, error: null };
};

const applyPick = (s, optionId) => {
  if (s.revealed || s.view !== 'quiz') return s;
  const q = s.deck[s.index];
  return {
    ...s, selectedId: optionId, revealed: true,
    answers: [...s.answers, { questionId: q.id, selectedId: optionId, correct: optionId === q.correctId }],
  };
};

const applyNext = (s) => {
  if (!s.revealed) return s;
  const next = s.index + 1;
  if (next >= s.deck.length) return { ...s, view: 'results', stepsOpen: false };
  return { ...s, index: next, selectedId: null, revealed: false, stepsOpen: false };
};

const goHome = (s) => ({
  ...s, view: 'home', deck: [], index: 0, answers: [],
  selectedId: null, revealed: false, stepsOpen: false, error: null,
});

const reducer = (s, a) => {
  switch (a.type) {
    case 'BOOT':  return { ...s, ready: true, config: a.config, bank: a.questions, category: a.config.ui.defaultCategory };
    case 'ERROR': return { ...s, ready: true, error: a.message };
    case 'START': return buildRound(s, a.category ?? s.category);
    case 'PICK':  return applyPick(s, a.optionId);
    case 'NEXT':  return applyNext(s);
    case 'HOME':  return goHome(s);
    case 'TOGGLE_STEPS': return { ...s, stepsOpen: a.open ?? !s.stepsOpen };
    default: return s;
  }
};

/* ── views ─────────────────────────────────────────────── */
const bootView = () => h('main', { class: 'page boot' },
  h('div', { class: 'boot-inner' },
    h('div', { class: 'boot-pulse' }),
    h('p', { class: 'boot-text' }, 'Loading…'),
  ),
);

const errorView = (message) => h('main', { class: 'page error' },
  h('div', { class: 'error-card' },
    h('p', { class: 'error-title' }, "Couldn't load"),
    h('p', { class: 'error-msg' }, message),
    h('p', { class: 'error-hint' }, 'If this page was opened directly from disk, browsers block JSON reads over file://. Serve the folder over HTTP instead.'),
  ),
);

const chapterRow = (cat, i, active, bank) => {
  const count = cat.id === 'all' ? bank.length : bank.filter((q) => q.category === cat.id).length;
  return h('button', {
    class: 'chapter',
    type: 'button',
    'data-action': 'category',
    'data-category': cat.id,
    'aria-pressed': String(active),
    style: `--i:${i}`,
  },
    h('span', { class: 'chapter-num' }, String(i + 1).padStart(2, '0')),
    h('span', { class: 'chapter-label' }, cat.label),
    h('span', { class: 'chapter-count' }, String(count)),
  );
};

const shortcutHint = () => h('p', { class: 'shortcut-hint' },
  'Press ', h('kbd', {}, '1'), '–', h('kbd', {}, '5'), ' to answer · ',
  h('kbd', {}, 'Enter'), ' to continue · ',
  h('kbd', {}, 'S'), ' for steps',
);

const coverView = (s) => h('main', { class: 'page cover' },
  h('header', { class: 'cover-head' },
    h('p', { class: 'cover-kicker' }, 'Study companion'),
    h('h1', { class: 'cover-title' }, s.config.app.title),
    h('p', { class: 'cover-sub' }, s.config.app.tagline),
    h('p', { class: 'cover-meta' },
      h('span', {}, `${s.bank.length} questions`),
      h('span', { class: 'dot', 'aria-hidden': 'true' }, '·'),
      h('span', {}, '5 choices each'),
      h('span', { class: 'dot', 'aria-hidden': 'true' }, '·'),
      h('span', {}, 'steps on tap'),
    ),
  ),
  s.error ? h('p', { class: 'notice' }, s.error) : null,
  h('nav', { class: 'chapters', 'aria-label': 'Chapters' },
    s.config.categories.map((c, i) => chapterRow(c, i, s.category === c.id, s.bank)),
  ),
  h('button', { class: 'btn-start', type: 'button', 'data-action': 'start' }, 'Begin'),
  s.config.features.keyboardShortcuts ? shortcutHint() : null,
);

const choiceRow = (opt, i, q, s) => {
  const isCorrect = opt.id === q.correctId;
  const isPicked = opt.id === s.selectedId;
  const state = !s.revealed ? '' : isCorrect ? 'is-correct' : isPicked ? 'is-wrong' : 'is-dim';
  const mark = !s.revealed ? '' : isCorrect ? '✓' : isPicked ? '✕' : '';

  return h('button', {
    class: `choice ${state}`.trim(),
    type: 'button',
    'data-action': 'pick',
    'data-option': opt.id,
    disabled: s.revealed,
    style: `--i:${i}`,
  },
    h('span', { class: 'choice-key' }, String.fromCharCode(65 + i)),
    h('span', { class: 'choice-text' }, opt.text),
    h('span', { class: 'choice-mark', 'aria-hidden': 'true' }, mark || '\u00A0'),
  );
};

const verdictBlock = (s, q) => {
  const last = s.answers.at(-1);
  const answer = q.options.find((o) => o.id === q.correctId);
  const isLast = s.index + 1 >= s.deck.length;
  return h('div', { class: 'verdict' },
    h('p', { class: `verdict-head ${last.correct ? 'is-correct' : 'is-wrong'}` },
      last.correct ? 'Right.' : 'Not this one.',
    ),
    h('p', { class: 'verdict-body' },
      'The answer is ', h('strong', {}, answer.text), '.',
    ),
    h('button', { class: 'btn-next', type: 'button', 'data-action': 'next' },
      isLast ? 'See how you did' : 'Next',
    ),
  );
};

const examView = (s) => {
  const q = s.deck[s.index];
  const total = s.deck.length;
  const pct = ((s.index + (s.revealed ? 1 : 0)) / total) * 100;
  const showSteps = s.config.features.stepsDrawer;

  return h('main', { class: 'page exam' },
    h('div', { class: 'exam-head' },
      h('button', { class: 'exam-nav', type: 'button', 'data-action': 'home' }, '← Back'),
      h('span', { class: 'exam-pos' }, `${String(s.index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`),
      showSteps
        ? h('button', {
            class: 'exam-help', type: 'button', 'data-action': 'steps',
            'aria-haspopup': 'dialog', 'aria-label': 'Show step-by-step solution',
          }, 'Steps')
        : h('span', { class: 'exam-pos', 'aria-hidden': 'true' }),
    ),

    h('div', {
      class: 'exam-progress', role: 'progressbar',
      'aria-valuemin': '0', 'aria-valuemax': String(total),
      'aria-valuenow': String(s.index + (s.revealed ? 1 : 0)),
    }, h('div', { class: 'exam-progress-bar', style: `width:${pct}%` })),

    h('div', { class: 'exam-body', key: q.id },
      h('p', { class: 'exam-label' }, q.topic),
      h('h2', { class: 'exam-question' }, q.prompt),
    ),

    h('div', { class: 'choices', role: 'group', 'aria-label': 'Answer choices' },
      q.options.map((opt, i) => choiceRow(opt, i, q, s)),
    ),

    s.revealed ? verdictBlock(s, q) : null,
  );
};

const resultView = (s) => {
  const total = s.deck.length;
  const correct = s.answers.filter((a) => a.correct).length;
  const pct = Math.round((correct / total) * 100);
  const missed = s.answers
    .filter((a) => !a.correct)
    .map((a) => s.deck.find((q) => q.id === a.questionId));

  const scoreEl = h('span', { class: 'result-score-num' }, '0');

  const view = h('main', { class: 'page result' },
    h('header', { class: 'result-head' },
      h('p', { class: 'result-label' }, 'Round complete'),
      h('div', { class: 'result-score' },
        scoreEl,
        h('span', { class: 'result-score-of' }, `/${total}`),
        h('span', { class: 'result-score-pct' }, `${pct}%`),
      ),
    ),

    missed.length
      ? h('section', { class: 'result-review-block' },
          h('p', { class: 'result-label' }, 'Review'),
          h('div', { class: 'result-review' },
            ...missed.map((q, i) => h('div', { class: 'result-review-item', style: `--i:${i}` },
              h('p', { class: 'result-review-label' }, q.topic),
              h('p', { class: 'result-review-q' }, q.prompt),
              h('p', { class: 'result-review-a' },
                'Correct: ', h('strong', {}, q.options.find((o) => o.id === q.correctId).text),
              ),
            )),
          ),
        )
      : h('p', { class: 'result-perfect' }, 'All correct. Nothing to review.'),

    h('div', { class: 'result-actions' },
      h('button', { class: 'btn-start', type: 'button', 'data-action': 'again' }, 'Try another round'),
      h('button', { class: 'btn-plain', type: 'button', 'data-action': 'home' }, 'Back to chapters'),
    ),
  );

  requestAnimationFrame(() => countUp(scoreEl, correct));
  return view;
};

const drawerSheet = (s, q) => h('div', { class: 'drawer-sheet', role: 'document' },
  h('div', { class: 'drawer-grip', 'aria-hidden': 'true' }),
  h('header', { class: 'drawer-head' },
    h('div', {},
      h('p', { class: 'drawer-label' }, 'Step by step'),
      h('h3', { class: 'drawer-topic' }, q.topic),
    ),
    h('button', { class: 'drawer-close', type: 'button', 'data-action': 'close-steps', 'aria-label': 'Close' }, '✕'),
  ),
  h('div', { class: 'drawer-body' },
    q.formula ? h('div', { class: 'drawer-formula' }, q.formula) : null,
    ...q.steps.map((step, i) => h('div', { class: 'step', style: `--i:${i}` },
      h('span', { class: 'step-num' }, String(i + 1).padStart(2, '0')),
      h('div', {},
        h('h4', { class: 'step-title' }, step.title),
        h('p', { class: 'step-body' }, raw(step.body)),
      ),
    )),
  ),
);

/* ── render orchestration ──────────────────────────────── */
const app = $('#app');
const drawer = $('#stepsDrawer');
const live = $('#live');

const store = createStore(reducer, initialState());

const mainSignature = (s) => [
  s.ready, s.error, s.view, s.index, s.revealed, s.selectedId, s.answers.length, s.deck.length,
].join('|');

const viewFor = (s) => {
  if (s.error && !s.ready) return errorView(s.error);
  if (!s.ready) return bootView();
  if (s.view === 'quiz') return examView(s);
  if (s.view === 'results') return resultView(s);
  return coverView(s);
};

const renderDrawer = (s) => {
  const q = s.view === 'quiz' ? s.deck[s.index] : null;
  const enabled = s.config.features.stepsDrawer && q;

  if (!enabled) {
    if (drawer.open) drawer.close();
    if (drawer.childElementCount) drawer.replaceChildren();
    delete drawer.dataset.qid;
    return;
  }

  if (drawer.dataset.qid !== q.id) {
    drawer.dataset.qid = q.id;
    drawer.replaceChildren(drawerSheet(s, q));
  }

  if (s.stepsOpen && !drawer.open) drawer.showModal();
  if (!s.stepsOpen && drawer.open) drawer.close();
};

const announce = (s) => {
  if (s.view === 'quiz' && s.revealed) {
    const q = s.deck[s.index];
    const answer = q.options.find((o) => o.id === q.correctId).text;
    live.textContent = s.answers.at(-1).correct
      ? `Correct. The answer is ${answer}.`
      : `Incorrect. The answer is ${answer}.`;
  } else if (s.view === 'results') {
    const correct = s.answers.filter((a) => a.correct).length;
    live.textContent = `Round complete. ${correct} of ${s.deck.length} correct.`;
  } else {
    live.textContent = '';
  }
};

let lastSig = '';
let frameQueued = false;

const paint = () => {
  frameQueued = false;
  const s = store.get();
  const sig = mainSignature(s);

  if (sig !== lastSig) {
    lastSig = sig;
    const next = viewFor(s);
    runTransition(() => {
      app.dataset.view = s.view;
      app.replaceChildren(next);
    });
  }

  renderDrawer(s);
  announce(s);
};

const schedule = () => {
  if (frameQueued) return;
  frameQueued = true;
  requestAnimationFrame(paint);
};

/* ── delegated interaction ─────────────────────────────── */
const onAction = (action, target) => {
  const s = store.get();
  switch (action) {
    case 'start':       buzz(10); store.dispatch({ type: 'START', category: s.category }); return;
    case 'category':    buzz(6);  store.dispatch({ type: 'START', category: target.dataset.category }); return;
    case 'home':        store.dispatch({ type: 'HOME' }); return;
    case 'again':       buzz(10); store.dispatch({ type: 'START', category: s.category }); return;
    case 'pick':        if (s.revealed) return; buzz(10); store.dispatch({ type: 'PICK', optionId: target.dataset.option }); return;
    case 'next':        buzz(8);  store.dispatch({ type: 'NEXT' }); return;
    case 'steps':       buzz(6);  store.dispatch({ type: 'TOGGLE_STEPS', open: true }); return;
    case 'close-steps': store.dispatch({ type: 'TOGGLE_STEPS', open: false }); return;
  }
};

app.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target || target.disabled) return;
  onAction(target.dataset.action, target);
});

drawer.addEventListener('click', (e) => {
  if (e.target === drawer) return store.dispatch({ type: 'TOGGLE_STEPS', open: false });
  const target = e.target.closest('[data-action]');
  if (target) onAction(target.dataset.action, target);
});

drawer.addEventListener('close', () => {
  if (store.get().stepsOpen) store.dispatch({ type: 'TOGGLE_STEPS', open: false });
});

/* ── keyboard ──────────────────────────────────────────── */
document.addEventListener('keydown', (e) => {
  const s = store.get();
  if (!s.config.features.keyboardShortcuts || s.view !== 'quiz') return;
  if (e.target.matches('input, textarea, [contenteditable]')) return;

  if (e.key >= '1' && e.key <= '5') {
    if (s.revealed) return;
    const btn = $$('[data-option]', app)[Number(e.key) - 1];
    if (btn) { e.preventDefault(); btn.click(); }
    return;
  }

  if (e.key.toLowerCase() === 's' && s.config.features.stepsDrawer) {
    e.preventDefault();
    store.dispatch({ type: 'TOGGLE_STEPS', open: !s.stepsOpen });
    return;
  }

  if ((e.key === 'Enter' || e.key === ' ') && s.revealed) {
    e.preventDefault();
    store.dispatch({ type: 'NEXT' });
  }
});

/* ── boot ──────────────────────────────────────────────── */
store.subscribe(schedule);

const boot = async () => {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 12000);
  try {
    const [config, questions] = await Promise.all([
      loadJSON('config.json', ctrl.signal),
      loadJSON('questions.json', ctrl.signal),
    ]);
    clearTimeout(timeout);
    if (!Array.isArray(questions) || questions.length === 0) throw new Error('questions.json is empty or malformed.');
    store.dispatch({ type: 'BOOT', config, questions });
  } catch (err) {
    clearTimeout(timeout);
    const message = err.name === 'AbortError' ? 'Request timed out.' : err.message;
    store.dispatch({ type: 'ERROR', message });
  }
};

boot();