import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Course = { slug: string; title: string; level: string; color: string; description: string; lessons: Lesson[] };
type Lesson = { title: string; duration: string; summary: string; body: string[]; quiz: { question: string; options: string[]; answer: number; explanation: string }[] };
type Progress = { userId: string; courseSlug: string; completedLessons: number; progress: number; lastActivity: number };
type QuizResult = { courseSlug: string; lessonIndex: number; quizScore: number; quizTotal: number; quizPassed: number; attempts: number; updatedAt: number };
type User = { id: string; name: string; email: string; avatarUrl?: string };

interface CustomCSSProperties extends CSSProperties {
  "--progress"?: string;
}

const courses: Course[] = [
  { slug: "renewable-energy", title: "الطاقة المتجددة", level: "مبتدئ", color: "cyan", description: "أساسيات الطاقة الشمسية وطاقة الرياح وتصميم الحلول المستدامة.", lessons: [
    { title: "مقدمة إلى الطاقة النظيفة", duration: "6 دقائق", summary: "لماذا أصبحت الطاقة المتجددة جزءًا أساسيًا من مستقبل الهندسة؟", body: ["تجمع الطاقة المتجددة بين مصادر طبيعية تتجدد باستمرار، مثل الشمس والرياح والمياه، وبين أنظمة هندسية تحولها إلى طاقة قابلة للاستخدام.", "يبدأ تصميم أي حل مستدام بفهم الطلب على الطاقة، ثم اختيار المصدر المناسب، وأخيرًا قياس الكفاءة والتكلفة والأثر البيئي."], quiz: [{ question: "ما السمة الأساسية لمصدر الطاقة المتجدد؟", options: ["ينفد بسرعة", "يتجدد طبيعيًا", "لا يحتاج إلى تصميم", "يعمل دون صيانة"], answer: 1, explanation: "المصدر المتجدد يتجدد طبيعيًا خلال دورة زمنية قصيرة نسبيًا." }, { question: "ما أول خطوة في تصميم حل مستدام؟", options: ["شراء المعدات", "تحديد الطلب على الطاقة", "اختيار لون اللوحة", "إلغاء القياس"], answer: 1, explanation: "فهم الطلب يساعد المهندس على اختيار التقنية والحجم المناسبين." }] },
    { title: "أساسيات الألواح الشمسية", duration: "8 دقائق", summary: "تعرف على الخلية الشمسية والعوامل المؤثرة في إنتاجها.", body: ["تحول الخلايا الكهروضوئية جزءًا من الإشعاع الشمسي إلى تيار كهربائي. وتتأثر الطاقة الناتجة بزاوية السقوط، ودرجة الحرارة، والظلال، ونظافة السطح.", "يستخدم المهندس بيانات الموقع لتحديد الاتجاه والميل وعدد الألواح، ثم يوازن بين المساحة المتاحة والطاقة المطلوبة."], quiz: [{ question: "ما العامل الذي يقلل إنتاج اللوح مباشرة؟", options: ["الظلال", "التهوية", "التنظيف", "الميل الصحيح"], answer: 0, explanation: "الظلال تحجب الإشعاع عن الخلايا وتخفض الإنتاج." }, { question: "لماذا ندرس موقع التركيب؟", options: ["لإنشاء شعار", "لتحديد الميل والاتجاه", "لتغيير نوع البطارية فقط", "لتجنب القياس"], answer: 1, explanation: "بيانات الموقع تحدد أفضل زاوية واتجاه للاستفادة من الشمس." }] },
    { title: "اختيار نظام التخزين", duration: "7 دقائق", summary: "قارن بين البطاريات واحتياج النظام إلى التخزين.", body: ["يسمح التخزين باستخدام الطاقة المنتجة في وقت لاحق، خصوصًا عندما لا يكون المصدر متاحًا. يعتمد حجم البطارية على الاستهلاك ومدة الاستقلال المطلوبة.", "يجب مراعاة عمق التفريغ، وعدد دورات الشحن، ودرجة الحرارة، وكفاءة الشاحن عند اختيار البطارية."], quiz: [{ question: "ما الغرض من البطارية في النظام الشمسي؟", options: ["تخزين الطاقة", "زيادة الظلال", "إلغاء العاكس", "تغيير اتجاه الشمس"], answer: 0, explanation: "البطارية تخزن الطاقة لاستخدامها عندما ينخفض الإنتاج." }, { question: "ماذا يعني عمق التفريغ؟", options: ["لون البطارية", "نسبة السعة المستخدمة", "وزن اللوح", "سرعة الرياح"], answer: 1, explanation: "عمق التفريغ يصف مقدار السعة التي تم سحبها من البطارية." }] },
  ] },
  { slug: "python-engineering", title: "برمجة بايثون للهندسة", level: "مبتدئ", color: "violet", description: "استخدم البرمجة لتحليل البيانات الهندسية وبناء أدواتك الذكية.", lessons: [
    { title: "لماذا بايثون للمهندس؟", duration: "6 دقائق", summary: "اكتشف كيف تختصر البرمجة العمل المتكرر وتدعم القرار الهندسي.", body: ["تتميز بايثون بسهولة القراءة وتنوع مكتباتها، لذلك يستخدمها المهندسون لتنظيف البيانات، وإجراء الحسابات، وبناء النماذج الأولية.", "الهدف ليس استبدال التفكير الهندسي، بل تحويل خطوات واضحة إلى أدوات قابلة لإعادة الاستخدام والتحقق."], quiz: [{ question: "ما فائدة الأتمتة في العمل الهندسي؟", options: ["زيادة العمل المتكرر", "تقليل التكرار والأخطاء", "إلغاء التحقق", "منع التوثيق"], answer: 1, explanation: "الأتمتة الجيدة تقلل العمل المتكرر وتترك وقتًا للتحليل." }, { question: "ما ميزة بايثون الأساسية للمبتدئ؟", options: ["صعوبة القراءة", "وضوح الصياغة", "غياب المكتبات", "عدم دعم البيانات"], answer: 1, explanation: "وضوح الصياغة يجعل فهم الكود وكتابته أسهل." }] },
    { title: "المتغيرات والحسابات", duration: "8 دقائق", summary: "ابنِ أول نموذج حسابي لقيمة هندسية.", body: ["المتغير اسم يشير إلى قيمة، ويمكن أن تمثل القيمة طولًا أو ضغطًا أو درجة حرارة. يساعدك اختيار أسماء واضحة على مراجعة النموذج لاحقًا.", "ابدأ بتحديد الوحدات، ثم اكتب المعادلة، ثم اختبرها بقيم بسيطة قبل استعمال بيانات حقيقية."], quiz: [{ question: "ما أفضل ممارسة قبل كتابة المعادلة؟", options: ["تجاهل الوحدات", "تحديد الوحدات", "حذف المتغيرات", "عدم الاختبار"], answer: 1, explanation: "تحديد الوحدات يمنع أخطاء التحويل والحساب." }, { question: "لماذا نختبر بقيم بسيطة؟", options: ["للتحقق من المنطق", "لإخفاء الخطأ", "لزيادة التعقيد", "لإلغاء النموذج"], answer: 0, explanation: "القيم البسيطة تكشف أخطاء المنطق بسرعة." }] },
    { title: "قراءة البيانات وتحليلها", duration: "9 دقائق", summary: "نظّم جدول قياسات وحوّله إلى مؤشرات مفيدة.", body: ["تبدأ عملية التحليل بفهم مصدر البيانات، ثم التحقق من القيم المفقودة والوحدات والقيم الشاذة.", "بعد التنظيف، يمكن حساب المتوسط والمدى ومقارنة القياسات مع الحد التصميمي لاتخاذ قرار قابل للتفسير."], quiz: [{ question: "ما الخطوة التي تسبق التحليل؟", options: ["تنظيف البيانات", "تجاهل المصدر", "حذف الأعمدة عشوائيًا", "نشر النتيجة"], answer: 0, explanation: "تنظيف البيانات والتحقق منها يرفع موثوقية التحليل." }, { question: "ماذا يصف المدى؟", options: ["الفارق بين أكبر وأصغر قيمة", "اسم الملف", "عدد الوحدات", "لون المخطط"], answer: 0, explanation: "المدى هو الفرق بين القيمة العظمى والقيمة الصغرى." }] },
  ] },
  { slug: "bim", title: "نمذجة معلومات البناء", level: "متقدم", color: "lime", description: "حوّل بيانات المشروع إلى نموذج منسق يساعد الفريق على البناء بثقة.", lessons: [
    { title: "مفهوم BIM", duration: "10 دقائق", summary: "افهم الفرق بين الرسم ثلاثي الأبعاد والنموذج المعلوماتي.", body: ["نموذج BIM لا يصف الشكل فقط؛ بل يربط العناصر ببياناتها مثل المادة، الكمية، المرحلة، والتكلفة.", "تزداد قيمة النموذج عندما يستخدمه التخصص المعماري والإنشائي والميكانيكي ضمن بيئة تنسيق واحدة."], quiz: [{ question: "ما الذي يميز نموذج BIM؟", options: ["الشكل فقط", "الشكل والبيانات", "الصورة النهائية فقط", "غياب التنسيق"], answer: 1, explanation: "النموذج المعلوماتي يجمع الهندسة والبيانات المرتبطة بالعناصر." }, { question: "من يستفيد من التنسيق؟", options: ["تخصص واحد فقط", "فريق المشروع", "الزائر فقط", "لا أحد"], answer: 1, explanation: "التنسيق يقلل التعارضات ويدعم قرارات فريق المشروع." }] },
    { title: "مستويات التطوير", duration: "8 دقائق", summary: "اربط مستوى تفاصيل النموذج بهدف المرحلة.", body: ["لا تحتاج كل مرحلة إلى نفس مستوى التفاصيل. يجب أن يعكس النموذج هدف الاستخدام، من التخطيط المبكر إلى التنفيذ والتشغيل.", "تجنب التفاصيل التي لا يمكن التحقق منها، وعرّف متطلبات المعلومات قبل بدء النمذجة."], quiz: [{ question: "بماذا يرتبط مستوى التفاصيل؟", options: ["بلون الواجهة", "هدف المرحلة", "عدد الاجتماعات فقط", "حجم الشاشة"], answer: 1, explanation: "مستوى التفاصيل يجب أن يخدم هدف المرحلة وقراراتها." }, { question: "ما الذي يسبق النمذجة المنظمة؟", options: ["تعريف متطلبات المعلومات", "حذف المعايير", "تجاهل الفريق", "تغيير النطاق"], answer: 0, explanation: "تعريف المتطلبات يوضح ما يجب أن يحتويه النموذج." }] },
    { title: "اكتشاف التعارضات", duration: "11 دقيقة", summary: "تعلّم كيف تحول التعارض إلى قرار موثق.", body: ["يظهر التعارض عندما تتداخل عناصر من تخصصات مختلفة أو تتعارض مع مساحة التشغيل والصيانة.", "تتضمن المعالجة تصنيف التعارض، تحديد المسؤول، اقتراح حل، ثم إغلاقه بعد التحقق من النموذج المحدث."], quiz: [{ question: "ما أول خطوة بعد اكتشاف التعارض؟", options: ["حذفه دون توثيق", "تصنيفه وتحديد المسؤول", "إخفاؤه", "تغيير كل النموذج"], answer: 1, explanation: "التصنيف وتحديد المسؤول يحولان التعارض إلى مهمة قابلة للمتابعة." }, { question: "متى يغلق التعارض؟", options: ["عند اقتراحه", "بعد التحقق من الحل", "قبل مراجعته", "عند حذف التقرير"], answer: 1, explanation: "الإغلاق يحتاج تحققًا من النموذج أو الموقع وفق الإجراء المتفق عليه." }] },
  ] },
  { slug: "mechatronics", title: "الميكاترونكس", level: "متوسط", color: "orange", description: "اربط الحساسات والمحركات والتحكم لبناء أنظمة ذكية.", lessons: [
    { title: "النظام الميكاتروني", duration: "7 دقائق", summary: "شاهد كيف تتكامل المكونات الميكانيكية والكهربائية والبرمجية.", body: ["الميكاترونكس تفكير تكاملي؛ فالقرار الميكانيكي يؤثر في الحساس، والقراءة تؤثر في التحكم، والتحكم يغير حركة النظام.", "ينجح التصميم عندما تُعرّف الواجهات بين المكونات وتختبرها مبكرًا."], quiz: [{ question: "ما جوهر الميكاترونكس؟", options: ["تخصص منفصل", "تكامل تخصصات", "إلغاء البرمجة", "الاعتماد على الحركة فقط"], answer: 1, explanation: "الميكاترونكس تدمج الميكانيكا والكهرباء والتحكم والبرمجيات." }, { question: "لماذا نحدد الواجهات؟", options: ["لتقليل التكامل", "لتوضيح تفاعل المكونات", "لمنع الاختبار", "لزيادة الغموض"], answer: 1, explanation: "الواجهات توضح الإشارات والقيود بين المكونات." }] },
    { title: "الحساسات والإشارات", duration: "9 دقائق", summary: "افهم كيف تتحول الظاهرة الفيزيائية إلى قراءة.", body: ["يقيس الحساس ظاهرة مثل الحرارة أو الموضع، ثم يحولها إلى إشارة يمكن لوحدة التحكم قراءتها.", "تحتاج الإشارة إلى معايرة وترشيح مناسبين، كما يجب تحديد نطاق القياس والدقة والضوضاء."], quiz: [{ question: "ما وظيفة الحساس؟", options: ["قياس ظاهرة", "تخزين المشروع", "تلوين الشاشة", "إلغاء الإشارة"], answer: 0, explanation: "الحساس يقيس ظاهرة فيزيائية ويحولها إلى إشارة." }, { question: "ما فائدة المعايرة؟", options: ["تحسين مطابقة القراءة", "زيادة الضوضاء", "إلغاء الدقة", "تغيير الميكانيكا"], answer: 0, explanation: "المعايرة تربط القراءة بالقيمة الفعلية المعروفة." }] },
    { title: "التحكم بالتغذية الراجعة", duration: "10 دقائق", summary: "استخدم القياس لتقريب النظام من القيمة المطلوبة.", body: ["تقارن حلقة التحكم بين القيمة المطلوبة والقيمة المقاسة، ثم تعدل الفعل المؤثر لتقليل الخطأ.", "يجب اختبار الاستقرار وزمن الاستجابة وحدود المشغل قبل تشغيل النظام في ظروفه الحقيقية."], quiz: [{ question: "ما الذي تقلله التغذية الراجعة؟", options: ["الخطأ", "المعلومات", "الاستقرار", "القياس"], answer: 0, explanation: "التغذية الراجعة تستخدم القياس لتقليل الفرق عن القيمة المطلوبة." }, { question: "ما الذي يجب اختباره؟", options: ["الاستقرار وزمن الاستجابة", "اسم المشروع", "لون الحساس", "حجم الشعار"], answer: 0, explanation: "الاستقرار وزمن الاستجابة من أهم مؤشرات سلوك حلقة التحكم." }] },
  ] },
];

const api = async <T = unknown>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { credentials: "include", ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "تعذر تنفيذ الطلب");
  return response.json();
};

function CourseCard({ course, progress, onOpen }: { course: Course; progress?: Progress; onOpen: () => void }) {
  const value = progress?.progress ?? 0;
  return (
    <button className={`course-card course-card--${course.color}`} onClick={onOpen}>
      <div className="course-card-art">
        <span className="course-art-glyph">{course.color === "cyan" ? "↗" : course.color === "violet" ? "⌘" : course.color === "lime" ? "▦" : "◈"}</span>
        <span className="course-level">{course.level}</span>
      </div>
      <div className="course-card-copy">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <span>{course.lessons.length} دروس · {course.lessons.reduce((sum, lesson) => sum + Number.parseInt(lesson.duration), 0)} دقيقة</span>
        <div className="progress-track"><i style={{ width: `${value}%` }} /></div>
        <div className="progress-caption"><span>التقدم</span><b>{value}%</b></div>
      </div>
    </button>
  );
}

function Topbar({ user, active, onNavigate, onLogout }: { user: User | null; active: string; onNavigate: (path: string) => void; onLogout: () => void }) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => onNavigate("/")}>
        <span className="brand-mark">M</span>
        <strong>بوابة المهندس الذكي</strong>
      </button>
      <nav>
        <button className={active === "learning" ? "active" : ""} onClick={() => onNavigate("/")}>مسارات التعلم</button>
        <button className={active === "community" ? "active" : ""} onClick={() => document.getElementById("community")?.scrollIntoView({ behavior: "smooth" })}>المجتمع</button>
        <button className={active === "challenges" ? "active" : ""} onClick={() => document.getElementById("challenges")?.scrollIntoView({ behavior: "smooth" })}>التحديات</button>
      </nav>
      <div className="topbar-actions">
        {user ? (
          <button className="user-pill" onClick={() => onNavigate("/profile")}>
            <span>{user.name.slice(0, 1)}</span>{user.name}
          </button>
        ) : (
          <button className="login-button" onClick={() => { window.location.href = "/api/auth/google"; }}>
            تسجيل الدخول
          </button>
        )}
        <button className="quiet-button" aria-label="البحث">⌕</button>
        <button className="quiet-button" aria-label="الإشعارات">◌</button>
        {user && <button className="quiet-button" onClick={onLogout} aria-label="تسجيل الخروج">↪</button>}
      </div>
    </header>
  );
}

function Home({ user, progress, onNavigate, onLogout }: { user: User | null; progress: Progress[]; onNavigate: (path: string) => void; onLogout: () => void }) {
  const saved = new Map(progress.map((item) => [item.courseSlug, item]));
  const calcProgress = user ? Math.round(progress.reduce((sum, item) => sum + item.progress, 0) / Math.max(progress.length, 1)) : 0;

  return (
    <main className="portal-shell">
      <Topbar user={user} active="learning" onNavigate={onNavigate} onLogout={onLogout} />
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">✦ مختبر المستقبل الهندسي</span>
          <h1>طوّر مهاراتك<br /><em>الهندسية</em></h1>
          <p>تعلّم، طبّق، وشارك أفكارك مع مجتمع يصنع حلول الغد.</p>
          <button className="primary-button" onClick={() => document.getElementById("learning")?.scrollIntoView({ behavior: "smooth" })}>
            ابدأ رحلتك <span>←</span>
          </button>
        </div>
        <div className="hero-figure">
          <div className="figure-grid" />
          <div className="figure-head">◉</div>
          <div className="figure-body">M</div>
        </div>
      </section>
      <section className="dashboard-grid" id="learning">
        <aside className="side-panel progress-panel">
          <div className="panel-label">تقدمك اليوم <span>↗</span></div>
          <div className="progress-ring" style={{ "--progress": `${calcProgress}%` } as CustomCSSProperties}>
            <strong>{calcProgress}%</strong>
            <span>مكتمل</span>
          </div>
          <div className="metric-list">
            <div><span>◫ دورات مكتملة</span><b>{progress.filter((item) => item.progress >= 100).length}</b></div>
            <div><span>◷ دروس منجزة</span><b>{progress.reduce((sum, item) => sum + item.completedLessons, 0)}</b></div>
            <div><span>✦ مسارات متاحة</span><b>{courses.length}</b></div>
          </div>
          <p className="panel-note">⌁ {user ? "تقدمك محفوظ في حسابك" : "سجّل دخولك لحفظ تقدمك"}</p>
        </aside>
        <div className="learning-panel">
          <div className="section-heading">
            <div><span className="eyebrow">اختر مهارتك التالية</span><h2>مسارات التعلم</h2></div>
            <button className="text-button">عرض الكل ←</button>
          </div>
          <div className="course-grid">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} progress={saved.get(course.slug)} onOpen={() => onNavigate(`/courses/${course.slug}/lessons/1`)} />
            ))}
          </div>
        </div>
        <aside className="side-panel streak-panel">
          <div className="panel-label">سلسلة التعلم <span className="lime">✦</span></div>
          <strong className="streak-number">{user ? "1" : "—"}</strong>
          <span>أيام متتالية</span>
          <svg viewBox="0 0 300 90" className="streak-line">
            <path d="M4 65 C32 72, 46 40, 72 53 S112 66, 134 36 S167 52, 198 43 S227 47, 260 28 S278 25, 296 8" fill="none" stroke="#b6f000" strokeWidth="3" />
            <path d="M4 65 C32 72, 46 40, 72 53 S112 66, 134 36 S167 52, 198 43 S227 47, 260 28 S278 25, 296 8 L296 90 L4 90Z" fill="rgba(182,240,0,.1)" />
          </svg>
        </aside>
      </section>
      <section className="community-grid" id="community">
        <div className="community-panel">
          <span className="eyebrow">أفكار تستحق العرض</span>
          <h2>مشاريع المهندسين</h2>
          <div className="project-grid">
            <article><span>⚡</span><strong>نظام منزل ذكي متكامل</strong><small>تجارب إنترنت الأشياء والتحكم</small></article>
            <article><span>⌁</span><strong>طائرة مسيرة ذكية</strong><small>تصميم وتحليل هندسي</small></article>
            <article><span>▥</span><strong>جسر منخفض التكلفة</strong><small>نمذجة وتحليل إنشائي</small></article>
          </div>
        </div>
        <aside className="community-panel community-stats" id="challenges">
          <span className="eyebrow">نحن نبني معًا</span>
          <h2>مجتمعك الهندسي</h2>
          <div><strong>12.5K</strong><span>مهندس مسجل</span></div>
          <div><strong>860</strong><span>مشروع مشترك</span></div>
          <button className="secondary-button">اكتشف المجتمع ←</button>
        </aside>
      </section>
      <footer>
        <span>© 2026 بوابة المهندس الذكي</span>
        <span>صُمّم للمهندسين الذين يبنون المستقبل</span>
      </footer>
    </main>
  );
}

function Login({ onBack }: { onBack: () => void }) {
  return (
    <main className="auth-shell">
      <button className="brand auth-brand" onClick={onBack}>
        <span className="brand-mark">M</span>
        <strong>بوابة المهندس الذكي</strong>
      </button>
      <section className="auth-card">
        <span className="hero-kicker">✦ ابدأ رحلتك الهندسية</span>
        <h1>مرحبًا بك من جديد</h1>
        <p>سجّل دخولك لحفظ تقدمك، نتائج اختباراتك، ومساراتك التعليمية.</p>
        <button className="google-button" onClick={() => { window.location.href = "/api/auth/google"; }}>
          <span>G</span> المتابعة باستخدام Google
        </button>
        <div className="auth-divider"><span>دخول آمن ومشفر</span></div>
        <button className="text-button" onClick={onBack}>العودة إلى الصفحة الرئيسية ←</button>
      </section>
    </main>
  );
}

function Profile({ user, progress, results, onNavigate, onLogout }: { user: User; progress: Progress[]; results: QuizResult[]; onNavigate: (path: string) => void; onLogout: () => void }) {
  const average = results.length ? Math.round(results.reduce((sum, result) => sum + Math.round((result.quizScore / result.quizTotal) * 100), 0) / results.length) : 0;
  const done = progress.reduce((sum, item) => sum + item.completedLessons, 0);

  return (
    <main className="profile-shell">
      <Topbar user={user} active="" onNavigate={onNavigate} onLogout={onLogout} />
      <section className="profile-header">
        <div className="avatar">{user.name.slice(0, 1)}</div>
        <div>
          <span className="eyebrow">ملفي الشخصي</span>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <button className="secondary-button" onClick={onLogout}>تسجيل الخروج ↪</button>
      </section>
      <section className="profile-metrics">
        <div><span>متوسط النتائج</span><strong>{average}%</strong></div>
        <div><span>دروس مكتملة</span><strong>{done}</strong></div>
        <div><span>اختبارات منجزة</span><strong>{results.filter((item) => item.quizPassed).length}</strong></div>
        <div><span>مسارات متقدمة</span><strong>{progress.filter((item) => item.progress >= 100).length}</strong></div>
      </section>
      <section className="profile-content">
        <div className="profile-panel">
          <div className="section-heading">
            <div><span className="eyebrow">تقدمك المحفوظ</span><h2>مساراتي التعليمية</h2></div>
          </div>
          {courses.map((course) => {
            const item = progress.find((entry) => entry.courseSlug === course.slug);
            const value = item?.progress ?? 0;
            return (
              <button className="profile-course" key={course.slug} onClick={() => onNavigate(`/courses/${course.slug}/lessons/${Math.min((item?.completedLessons ?? 0) + 1, course.lessons.length)}`)}>
                <span className={`mini-glyph ${course.color}`}>{course.title.slice(0, 1)}</span>
                <span className="profile-course-main">
                  <strong>{course.title}</strong>
                  <small>{item?.completedLessons ?? 0}/{course.lessons.length} دروس مكتملة</small>
                  <i><b style={{ width: `${value}%` }} /></i>
                </span>
                <b className="profile-percent">{value}%</b>
                <span>←</span>
              </button>
            );
          })}
        </div>
        <div className="profile-panel results-panel">
          <div className="section-heading">
            <div><span className="eyebrow">مراجعة الأداء</span><h2>سجل نتائج الاختبارات</h2></div>
            <span className="result-count">{results.length} نتائج</span>
          </div>
          {results.length ? (
            <div className="results-list">
              {results.map((result) => {
                const course = courses.find((item) => item.slug === result.courseSlug);
                const percent = Math.round((result.quizScore / result.quizTotal) * 100);
                return (
                  <article className={`result-row ${result.quizPassed ? "passed" : "failed"}`} key={`${result.courseSlug}-${result.lessonIndex}`}>
                    <span className="result-number">{result.lessonIndex}</span>
                    <div>
                      <strong>{course?.title ?? result.courseSlug}</strong>
                      <small>الدرس {result.lessonIndex} · {new Date(result.updatedAt).toLocaleDateString("ar-IQ")}</small>
                    </div>
                    <span className="result-score">{percent}%<small>{result.quizScore}/{result.quizTotal}</small></span>
                    <span className="result-state">{result.quizPassed ? "مجتاز" : "إعادة"}<small>{result.attempts} محاولات</small></span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">أكمل اختبارًا ليظهر سجل نتائجك هنا.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function LessonPage({ course, index, user, progress, results, onNavigate, onProgressRefresh }: { course: Course; index: number; user: User | null; progress: Progress[]; results: QuizResult[]; onNavigate: (path: string) => void; onProgressRefresh: () => Promise<void> }) {
  const lesson = course.lessons[index - 1] ?? course.lessons[0];
  const courseProgress = progress.find((item) => item.courseSlug === course.slug);
  const allowed = (courseProgress?.completedLessons ?? 0) + 1 >= index;
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number; passed: boolean } | null>(null);
  const previousResult = results.find((item) => item.courseSlug === course.slug && item.lessonIndex === index);

  useEffect(() => { setAnswers({}); setSubmitted(false); setFeedback(null); }, [course.slug, index]);

  if (!allowed) {
    return (
      <main className="lesson-shell">
        <Topbar user={user} active="learning" onNavigate={onNavigate} onLogout={() => undefined} />
        <section className="locked-card">
          <span>◈</span>
          <h1>هذا الدرس غير متاح بعد</h1>
          <p>أكمل الدرس السابق واجتز اختباره لفتح هذه الخطوة.</p>
          <button className="primary-button" onClick={() => onNavigate(`/courses/${course.slug}/lessons/${(courseProgress?.completedLessons ?? 0) + 1}`)}>
            العودة إلى الدرس المتاح ←
          </button>
        </section>
      </main>
    );
  }

  const submitQuiz = async () => {
    if (!user) {
      window.location.href = "/api/auth/google";
      return;
    }
    setSubmitted(true);
    const score = lesson.quiz.reduce((sum, item, quizIndex) => sum + (answers[quizIndex] === item.answer ? 1 : 0), 0);
    const passed = score / lesson.quiz.length >= 0.7;
    setSaving(true);
    try {
      await api("/api/quiz/complete", { method: "POST", body: JSON.stringify({ courseSlug: course.slug, lessonIndex: index, score, total: lesson.quiz.length }) });
      setFeedback({ score, passed });
      await onProgressRefresh();
    } catch {
      setFeedback({ score, passed: false });
    } finally {
      setSaving(false);
    }
  };

  const next = index < course.lessons.length ? `/courses/${course.slug}/lessons/${index + 1}` : "/profile";

  return (
    <main className="lesson-shell">
      <Topbar user={user} active="learning" onNavigate={onNavigate} onLogout={() => undefined} />
      <div className="lesson-layout">
        <aside className="lesson-sidebar">
          <button className="back-link" onClick={() => onNavigate("/")}>→ العودة للمسارات</button>
          <span className="eyebrow">{course.title}</span>
          <h2>خطة المسار</h2>
          {course.lessons.map((item, lessonIndex) => {
            const complete = (courseProgress?.completedLessons ?? 0) >= lessonIndex + 1;
            return (
              <button key={item.title} className={`lesson-nav ${lessonIndex + 1 === index ? "current" : ""} ${complete ? "complete" : ""}`} onClick={() => onNavigate(`/courses/${course.slug}/lessons/${lessonIndex + 1}`)}>
                <span>{complete ? "✓" : String(lessonIndex + 1).padStart(2, "0")}</span>
                <i>{item.title}<small>{item.duration}</small></i>
              </button>
            );
          })}
        </aside>
        <article className="lesson-content">
          <div className="lesson-heading">
            <span className={`course-chip ${course.color}`}>{course.level}</span>
            <span className="lesson-meta">الدرس {index} من {course.lessons.length} · {lesson.duration}</span>
            <h1>{lesson.title}</h1>
            <p>{lesson.summary}</p>
          </div>
          <div className="lesson-body">
            {lesson.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <section className="quiz-card">
            <div className="quiz-heading">
              <span className="eyebrow">اختبر فهمك</span>
              <h2>اختبار قصير قبل المتابعة</h2>
              <p>أجب عن الأسئلة واحصل على 70% على الأقل لفتح الدرس التالي.</p>
            </div>
            {lesson.quiz.map((item, quizIndex) => (
              <fieldset key={item.question}>
                <legend>{quizIndex + 1}. {item.question}</legend>
                <div className="quiz-options">
                  {item.options.map((option, optionIndex) => (
                    <label key={option}>
                      <input type="radio" name={`question-${quizIndex}`} checked={answers[quizIndex] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [quizIndex]: optionIndex }))} disabled={saving} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {submitted && <small className={answers[quizIndex] === item.answer ? "answer-hint good" : "answer-hint bad"}>{answers[quizIndex] === item.answer ? "إجابة صحيحة" : `الإجابة الصحيحة: ${item.options[item.answer]}`} — {item.explanation}</small>}
              </fieldset>
            ))}
            <div className="quiz-footer">
              <button className="primary-button" onClick={submitQuiz} disabled={saving || Object.keys(answers).length < lesson.quiz.length}>
                {saving ? "جارٍ الحفظ..." : feedback?.passed ? "تم الاجتياز ✓" : "تصحيح الاختبار"}
              </button>
              {feedback && <span className={feedback.passed ? "quiz-result success" : "quiz-result failure"}>{feedback.passed ? `أحسنت! نتيجتك ${feedback.score}/${lesson.quiz.length}` : `نتيجتك ${feedback.score}/${lesson.quiz.length}. أعد المحاولة للوصول إلى 70%.`}</span>}
            </div>
          </section>
          {feedback?.passed && <button className="next-lesson-button" onClick={() => onNavigate(next)}>{index < course.lessons.length ? "انتقل إلى الدرس التالي" : "عرض ملفي الشخصي"} <span>←</span></button>}
          {previousResult && !feedback && <p className="previous-attempt">آخر نتيجة محفوظة: {previousResult.quizScore}/{previousResult.quizTotal} · {previousResult.quizPassed ? "مجتاز" : "أعد المحاولة لتحسين النتيجة"}</p>}
        </article>
      </div>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const path = window.location.pathname;

  const navigate = (next: string) => {
    window.history.pushState({}, "", next);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [, setRouteTick] = useState(0);

  useEffect(() => {
    const handler = () => setRouteTick((tick) => tick + 1);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const refresh = async () => {
    try {
      const me = await api<{ user: User | null }>("/api/auth/me");
      setUser(me.user);
      if (me.user) {
        const [progressData, resultData] = await Promise.all([
          api<Progress[]>("/api/progress"),
          api<QuizResult[]>("/api/quiz-results")
        ]);
        setProgress(progressData);
        setResults(resultData);
      } else {
        setProgress([]);
        setResults([]);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    }
    setUser(null);
    setProgress([]);
    setResults([]);
    navigate("/");
  };

  const lessonMatch = path.match(/^\/courses\/([^/]+)\/lessons\/(\d+)$/);

  if (loading) return <div className="loading-screen"><span className="brand-mark">M</span><p>جارٍ تجهيز بوابتك...</p></div>;
  if (path === "/login") return <Login onBack={() => navigate("/")} />;
  if (path === "/profile") return user ? <Profile user={user} progress={progress} results={results} onNavigate={navigate} onLogout={logout} /> : <Login onBack={() => navigate("/")} />;
  if (lessonMatch) {
    const course = courses.find((item) => item.slug === lessonMatch[1]);
    if (course) return <LessonPage course={course} index={Number(lessonMatch[2])} user={user} progress={progress} results={results} onNavigate={navigate} onProgressRefresh={refresh} />;
  }

  return <Home user={user} progress={progress} onNavigate={navigate} onLogout={logout} />;
}
