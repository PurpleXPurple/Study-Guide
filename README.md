1. LogicDeck is a study app for digital logic that runs entirely in the browser.
2. It ships as five files with no build step and no framework.
3. FACT ONE — The five files are index.html, styles.css, code_script.js, config.json, and questions.json.
4. Opening it feels like opening a workbook, not launching software.
5. The cover has a kicker, a serif title, a subtitle, and a small metadata line.
6. Below the header sits a table of contents made of five chapter rows.
7. Each row shows a number, a label, and a count of how many questions it holds.
8. You tap a row and a round begins with ten shuffled questions.
9. Each question displays five choices stacked vertically.
10. You tap one and the app tells you instantly whether you were right.
11. Right answers pop and turn green, wrong answers shake and turn red.
12. A small "Steps" button sits in the top-right corner of every question.
13. Tapping it opens the full derivation as a bottom sheet on mobile.
14. On desktop the sheet becomes a centered modal with the same content.
15. Each derivation starts with a formula strip in amber monospace.
16. Then come three steps numbered 01, 02, 03, each with a title and a body.
17. The bodies use inline code spans for every variable and equation.
18. The result screen shows your score as a big serif fraction like 7/10.
19. A count-up animation rolls the score from zero to its final value.
20. Missed questions appear below as a review list with the right answers shown.
21. Every screen change crossfades via the View Transitions API when supported.
22. When that API isn't available, a CSS rise animation plays instead.
23. Dark mode follows your operating system automatically with no toggle.
24. Both themes are warm — cream paper in light, charcoal in dark.
25. Reduced-motion users get the same app with every animation disabled.
26. FACT TWO — The question bank contains exactly one hundred questions across five categories.
27. State is one reducer with seven actions, a pub/sub store, and a signature gate.
28. Views are plain functions that return DOM nodes, not templates or components.
29. Clicks route through one delegated listener per container, not one per button.
30. The whole project is small, quiet, and finishes what it starts.

---

١. LogicDeck هو تطبيق دراسي للمنطق الرقمي يعمل بالكامل في المتصفح.

٢. يأتي التطبيق على شكل خمسة ملفات، بدون أي خطوات بناء أو إطار عمل.

٣. معلومة مهمة: الملفات الخمسة هي: index.html، styles.css، code_script.js، config.json، وquestions.json.

٤. فتح التطبيق يشبه فتح كتاب تمارين، وليس تشغيل برنامج.

٥. يحتوي الغلاف على عنوان فرعي، وعنوان بخط serif، وعنوان فرعي، وسطر بيانات وصفية صغير.

٦. أسفل العنوان الرئيسي، يوجد جدول محتويات مكون من خمسة صفوف للفصول.

٧. يعرض كل صف رقمًا، وعنوانًا فرعيًا، وعدد الأسئلة فيه.

٨. عند النقر على صف، تبدأ جولة بعشرة أسئلة مرتبة عشوائيًا.

٩. يعرض كل سؤال خمسة خيارات مرتبة عموديًا.

١٠. عند النقر على أحد الخيارات، يخبرك التطبيق فورًا ما إذا كانت إجابتك صحيحة أم لا. ١١. تظهر الإجابات الصحيحة وتتحول إلى اللون الأخضر، بينما تهتز الإجابات الخاطئة وتتحول إلى اللون الأحمر.

١٢. يوجد زر صغير بعنوان "الخطوات" في الزاوية العلوية اليمنى من كل سؤال.

١٣. يؤدي النقر عليه إلى فتح الاشتقاق الكامل كنافذة سفلية على الهاتف المحمول.

١٤. على سطح المكتب، تصبح النافذة منبثقة مركزية بنفس المحتوى.

١٥. يبدأ كل اشتقاق بشريط صيغة بخط أحادي المسافة بلون كهرماني.

١٦. ثم تأتي ثلاث خطوات مرقمة ١، ٢، ٣، لكل منها عنوان ونص.

١٧. يستخدم النص علامات برمجية مضمنة لكل متغير ومعادلة.

١٨. تعرض شاشة النتائج درجتك ككسر كبير بخط serif مثل ٧/١٠.

١٩. يعرض عداد تصاعدي الدرجة من الصفر إلى قيمتها النهائية.

٢٠. تظهر الأسئلة التي لم تُجب عليها بشكل صحيح في الأسفل كقائمة مراجعة مع عرض الإجابات الصحيحة.

٢١. يتم الانتقال التدريجي بين الشاشات عند كل تغيير باستخدام واجهة برمجة تطبيقات انتقالات العرض (View Transitions API) عند دعمها.

٢٢. في حال عدم توفر واجهة برمجة التطبيقات هذه، يتم تشغيل تأثير CSS للارتفاع بدلاً من ذلك.

٢٣. الوضع الداكن متوافق مع نظام التشغيل الخاص بك تلقائيًا دون الحاجة إلى مفتاح تبديل.

٢٤. كلا النمطين دافئان - لون ورق كريمي في الوضع الفاتح، ولون فحمي في الوضع الداكن.

٢٥. يحصل مستخدمو وضع تقليل الحركة على نفس التطبيق مع تعطيل جميع تأثيرات الحركة.

٢٦. حقيقة ثانية: يحتوي بنك الأسئلة على مئة سؤال بالضبط موزعة على خمس فئات.

٢٧. الحالة عبارة عن مُختزل واحد بسبعة إجراءات، ومخزن نشر/اشتراك، وبوابة توقيع.

٢٨. طرق العرض عبارة عن دوال بسيطة تُرجع عناصر DOM، وليست قوالب أو مكونات.

٢٩. يتم توجيه النقرات عبر مُستمع مُفوض واحد لكل حاوية، وليس مُستمعًا لكل زر.

٣٠. المشروع بأكمله صغير وهادئ، ويُكمل ما بدأه.