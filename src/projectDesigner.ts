export type ProjectDomain = "agriculture" | "energy" | "robotics" | "ai-data";
export type ProjectLevel = "beginner" | "intermediate" | "advanced";
export type ProjectBudget = "low" | "standard" | "flexible";
export type ProjectTimeline = "one-week" | "two-weeks" | "month";

export type ProjectInputs = {
  domain: ProjectDomain;
  problem: string;
  level: ProjectLevel;
  budget: ProjectBudget;
  timeline: ProjectTimeline;
  availableMaterials: string;
};

export type PlanMaterial = { name: string; available: boolean; essential: boolean };
export type PlanStep = { title: string; description: string; deliverable: string };
export type EngineeringProjectPlan = {
  title: string;
  domainLabel: string;
  problem: string;
  objective: string;
  levelLabel: string;
  timelineLabel: string;
  budgetLabel: string;
  budgetGuidance: string;
  materials: PlanMaterial[];
  phases: PlanStep[];
  successCriteria: string[];
  safetyNotes: string[];
  extension: string;
};

type Recipe = {
  label: string;
  title: string;
  objective: string;
  materials: Array<{ name: string; aliases: string[]; essential: boolean }>;
  phaseTwo: PlanStep;
  phaseThree: PlanStep;
  successCriteria: string[];
  safetyNotes: string[];
  extension: string;
};

const recipes: Record<ProjectDomain, Recipe> = {
  agriculture: {
    label: "زراعة ذكية ومياه",
    title: "مراقب ريّ ذكي للتربة",
    objective: "صمّم نموذجًا يقيس رطوبة التربة ويحوّل القراءة إلى قرار ريّ واضح يمكن اختباره.",
    materials: [
      { name: "لوحة Arduino أو متحكم مشابه", aliases: ["arduino", "esp32", "esp8266", "متحكم"], essential: true },
      { name: "حساس رطوبة تربة", aliases: ["رطوبة", "soil", "moisture"], essential: true },
      { name: "أسلاك توصيل ولوحة تجارب", aliases: ["أسلاك", "jumper", "breadboard"], essential: true },
      { name: "LED أو شاشة صغيرة لعرض الحالة", aliases: ["led", "شاشة", "display"], essential: false },
      { name: "مضخة صغيرة منخفضة الجهد (اختيارية) أو محاكاة LED", aliases: ["مضخة", "pump"], essential: false },
    ],
    phaseTwo: { title: "ابنِ نموذج القياس", description: "اربط حساس رطوبة التربة بالمتحكم، واعرض القراءة أو حالتها أولًا باستخدام LED. لا تبدأ بالمضخة؛ اختبر المنطق بإشارة ضوئية آمنة.", deliverable: "قراءة رطوبة ظاهرة واستجابة أولية يمكن تكرارها." },
    phaseThree: { title: "عاير واختبر قرار الري", description: "قِس القراءة في تربة جافة ورطبة، سجّل النتائج، ثم اختر عتبة معلنة وراقب عدد مرات التبديل الخاطئ.", deliverable: "جدول قراءات يوضح العتبة ودقة قرار الري." },
    successCriteria: ["تتغير القراءة بين عينة جافة وأخرى رطبة بشكل قابل للتكرار.", "يُظهر النظام حالة الجفاف والريّ بوضوح عند العتبة المحددة.", "تُسجّل خمس قراءات على الأقل مع وقتها وظروفها."],
    safetyNotes: ["اختبر بإشارات منخفضة الجهد فقط، وأبعد الماء عن اللوحة والأسلاك.", "إذا أضفت مضخة، استخدم وحدة قيادة مناسبة ومصدرًا منخفض الجهد وتحت إشراف مختص."],
    extension: "أضف سجلًا زمنيًا للقراءات وقارن استهلاك الماء بين تشغيل ثابت وتشغيل يعتمد على الحساس.",
  },
  energy: {
    label: "طاقة واستدامة",
    title: "محطة قياس أداء لوح شمسي مصغّر",
    objective: "ابنِ تجربة تقيس تغيّر خرج لوح شمسي تعليمي مع زاوية الإضاءة والظل، ثم استخدم البيانات لتحديد وضع أفضل.",
    materials: [
      { name: "لوح شمسي تعليمي منخفض الجهد", aliases: ["solar", "شمسي", "لوح"], essential: true },
      { name: "ملتيميتر رقمي", aliases: ["multimeter", "ملتيميتر", "فولتميتر"], essential: true },
      { name: "مقاومة حمل مناسبة أو حمل تعليمي", aliases: ["مقاومة", "resistor", "حمل"], essential: true },
      { name: "قاعدة زاوية قابلة للتعديل", aliases: ["قاعدة", "حامل", "stand"], essential: false },
      { name: "مقياس إضاءة أو تطبيق قياس تقريبي", aliases: ["lux", "إضاءة", "light"], essential: false },
    ],
    phaseTwo: { title: "جهّز منصة القياس", description: "ثبت اللوح التعليمي على قاعدة، واستخدم الملتيميتر والحمل المناسب لقياس الخرج عند زاويتين أو ثلاث زوايا محددة.", deliverable: "منصة قياس ثابتة وجدول لتسجيل الجهد والظروف." },
    phaseThree: { title: "اجمع البيانات وقارنها", description: "غيّر عاملًا واحدًا في كل مرة (الزاوية أو الظل)، كرر القياس ثلاث مرات، ثم اعرض النتائج في جدول أو رسم بياني.", deliverable: "مقارنة موثقة تبين أثر كل عامل على الخرج." },
    successCriteria: ["تُقاس ثلاث حالات على الأقل مع تثبيت بقية الظروف قدر الإمكان.", "تتضمن النتائج الوحدات وتكرار القياس وملاحظة عن الطقس أو الظل.", "يُشرح أفضل وضع بناءً على البيانات لا على التخمين."],
    safetyNotes: ["استخدم لوحًا تعليميًا منخفض الجهد فقط؛ لا توصل النموذج بشبكة المنزل.", "تجنب قصر أطراف اللوح، واتبع تعليمات الملتيميتر والحمل."],
    extension: "اجمع قراءات في أوقات مختلفة من اليوم، ثم قدّر العلاقة بين زاوية اللوح وشدة الإضاءة والخرج.",
  },
  robotics: {
    label: "روبوتات وتحكم",
    title: "عربة روبوتية تتجنب العوائق",
    objective: "صمّم نموذج عربة يكتشف جسمًا أمامه، ويتخذ قرار توقف أو انعطاف ضمن مسافة آمنة قابلة للقياس.",
    materials: [
      { name: "لوحة Arduino أو متحكم مشابه", aliases: ["arduino", "esp32", "متحكم"], essential: true },
      { name: "حساس مسافة بالموجات فوق الصوتية", aliases: ["ultrasonic", "مسافة", "distance"], essential: true },
      { name: "محركان صغيران مع هيكل عجلات", aliases: ["محرك", "motor", "عجلات", "chassis"], essential: true },
      { name: "درايفر محركات مناسب", aliases: ["driver", "l298", "محرك"], essential: true },
      { name: "بطارية منخفضة الجهد ومفتاح فصل", aliases: ["بطارية", "battery", "مفتاح"], essential: true },
    ],
    phaseTwo: { title: "ابنِ قاعدة الحركة والاستشعار", description: "اختبر قراءة حساس المسافة وحده، ثم اختبر دوران المحركات على قاعدة ثابتة قبل تركيب النظام كاملًا.", deliverable: "قراءات مسافة وحركة أساسية يمكن إيقافها فورًا." },
    phaseThree: { title: "اضبط منطق تجنب العائق", description: "حدد عتبة توقف، وجرّب أجسامًا ومسافات مختلفة بسرعة منخفضة، وسجّل نجاح الكشف وحالات عدم الاستجابة.", deliverable: "عربة تتوقف أو تنعطف عند العائق ضمن حالات اختبار موثقة." },
    successCriteria: ["تُختبر خمس مسافات مختلفة على الأقل مع تسجيل النتيجة.", "تتوقف العربة عند الاقتراب من العائق ضمن العتبة المحددة.", "يوجد مفتاح فصل سهل الوصول قبل اختبار الحركة."],
    safetyNotes: ["استخدم جهدًا منخفضًا، وثبّت البطارية والأسلاك بعيدًا عن العجلات.", "اختبر بسرعة بطيئة وعلى أرضية خالية؛ لا توجه العربة نحو الأشخاص أو الدرج."],
    extension: "قارن عتبتين مختلفتين، أو أضف حساسًا جانبيًا مع توثيق كيف أثر على دقة الحركة.",
  },
  "ai-data": {
    label: "ذكاء اصطناعي وبيانات",
    title: "مصنّف بيانات هندسية قابل للتفسير",
    objective: "حوّل قياسات هندسية صغيرة إلى مسألة تصنيف أو تنبؤ، وابنِ خط أساس يمكن تقييمه على بيانات لم يرها النموذج.",
    materials: [
      { name: "حاسوب مع Python", aliases: ["python", "حاسوب", "laptop"], essential: true },
      { name: "ملف CSV بقياسات تعليمية", aliases: ["csv", "بيانات", "dataset"], essential: true },
      { name: "مكتبة pandas وscikit-learn", aliases: ["pandas", "scikit", "مكتبة"], essential: true },
      { name: "دفتر Jupyter أو محرر Python", aliases: ["jupyter", "notebook", "محرر"], essential: false },
      { name: "مخطط لعرض النتائج", aliases: ["matplotlib", "رسم", "chart"], essential: false },
    ],
    phaseTwo: { title: "جهّز البيانات وخط الأساس", description: "افحص الأعمدة والقيم الناقصة، عرّف الهدف والسمات، ثم قسّم البيانات إلى تدريب واختبار قبل اختيار نموذج بسيط.", deliverable: "مجموعة بيانات موثقة وخط أساس قابل لإعادة التشغيل." },
    phaseThree: { title: "قيّم النموذج وافحص الأخطاء", description: "قارن النتيجة بخط أساس بسيط، واستخدم مقياسًا مناسبًا للمسألة، وافحص أمثلة أخطأ فيها النموذج.", deliverable: "مقياس تقييم موثق وملاحظات عن حدود النموذج." },
    successCriteria: ["يوجد فصل واضح بين بيانات التدريب والاختبار.", "تُذكر المقاييس وأسباب اختيارها، لا الدقة وحدها عند عدم توازن الفئات.", "تُراجع ثلاثة أمثلة خاطئة على الأقل وتُشرح حدود الحل."],
    safetyNotes: ["استخدم بيانات تعليمية أو مجهولة الهوية، ولا ترفع معلومات شخصية حساسة.", "قدّم النتائج كنموذج تعليمي لا كقرار طبي أو مالي أو سلامة حقيقي."],
    extension: "قارن نموذجين بسيطين أو افحص أثر تغيير سمة واحدة، ثم وثّق متى لا ينبغي الاعتماد على التنبؤ.",
  },
};

const levelLabels: Record<ProjectLevel, string> = {
  beginner: "مبتدئ · نموذج أولي مبسط",
  intermediate: "متوسط · تنفيذ وقياس",
  advanced: "متقدم · تحليل وتحسين",
};

const timelineLabels: Record<ProjectTimeline, string> = {
  "one-week": "أسبوع واحد",
  "two-weeks": "أسبوعان إلى ثلاثة",
  month: "شهر تقريبًا",
};

const budgetSettings: Record<ProjectBudget, { label: string; guidance: string }> = {
  low: { label: "أقل تكلفة ممكنة", guidance: "ابدأ بالقطع المتاحة أو المعاد استخدامها، واستعر ما ينقصك قبل الشراء. اكتفِ بالمؤشرات الأساسية وأجّل الإضافات الاختيارية." },
  standard: { label: "ميزانية طلابية معتدلة", guidance: "استخدم قطع الهواية القياسية، واحتفظ بخيار بديل للحساس أو الوصلة الأكثر أهمية قبل الشراء." },
  flexible: { label: "مرونة لإضافات اختيارية", guidance: "يمكن إضافة تسجيل بيانات أو هيكل أفضل، لكن قِس فائدة كل إضافة قبل اعتمادها في النسخة النهائية." },
};

const timePlan: Record<ProjectTimeline, string[]> = {
  "one-week": ["اليوم 1", "الأيام 2–3", "الأيام 4–5", "الأيام 6–7"],
  "two-weeks": ["الأيام 1–2", "الأيام 3–6", "الأيام 7–10", "الأيام 11–14"],
  month: ["الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع"],
};

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[أإآ]/g, "ا").trim();
}

export function buildProjectPlan(inputs: ProjectInputs): EngineeringProjectPlan {
  const recipe = recipes[inputs.domain];
  const supplied = inputs.availableMaterials.split(/[,،;؛\n]+/).map((item) => item.trim()).filter(Boolean);
  const normalizedSupplied = supplied.map(normalize);
  const matchedNames = new Set<string>();
  const materials: PlanMaterial[] = recipe.materials.map((material) => {
    const matchingIndex = normalizedSupplied.findIndex((item) => material.aliases.some((alias) => item.includes(normalize(alias)) || normalize(alias).includes(item)));
    if (matchingIndex >= 0) matchedNames.add(supplied[matchingIndex]);
    return { name: material.name, available: matchingIndex >= 0, essential: material.essential };
  });
  supplied.filter((item) => !matchedNames.has(item)).forEach((item) => materials.push({ name: item, available: true, essential: false }));

  const schedule = timePlan[inputs.timeline];
  const phases: PlanStep[] = [
    { title: "عرّف المشكلة ومعيار النجاح", description: `اكتب المشكلة التي تريد حلها: «${inputs.problem.trim() || recipe.objective}». حدّد من سيستفيد منها، وارسم مخططًا بسيطًا للمدخلات والمخرجات.`, deliverable: "ملخص مشكلة من سطرين ومعيار نجاح قابل للقياس." },
    recipe.phaseTwo,
    recipe.phaseThree,
    { title: "راجع النتيجة ووثّقها", description: inputs.level === "beginner" ? "التقط صورًا للنموذج، واكتب ما نجح وما ستغيره في المحاولة القادمة." : "حلّل القيود والأخطاء، ثم اقترح تحسينًا واحدًا واختبره قبل اعتماده.", deliverable: inputs.level === "advanced" ? "تقرير نتائج مع مقارنة قبل/بعد للتعديل." : "ملف مختصر بالصور والقراءات والدروس المستفادة." },
  ].map((phase, index) => ({ ...phase, title: `${schedule[index]} · ${phase.title}` }));

  if (inputs.level === "advanced") {
    phases[2] = { ...phases[2], description: `${phases[2].description} أضف مقارنة بخط أساس، وكرّر كل حالة ثلاث مرات لتقدير التباين.` };
  }
  if (inputs.level === "beginner") {
    phases[1] = { ...phases[1], description: `${phases[1].description} نفّذ جزءًا واحدًا فقط في البداية، واطلب مراجعة مشرف قبل تشغيل أي جزء متحرك أو كهربائي.` };
  }

  const availableCount = materials.filter((item) => item.available).length;
  const missingEssential = materials.filter((item) => item.essential && !item.available).length;
  const successCriteria = [...recipe.successCriteria];
  if (availableCount > 0) successCriteria.push(`ابدأ باستخدام ${availableCount} من المواد التي ذكرت أنها متوفرة لديك.`);
  if (missingEssential > 0) successCriteria.push(`تحقق من توفر ${missingEssential} من المواد الأساسية قبل بدء التنفيذ، أو استبدلها بمحاكاة آمنة مناسبة.`);

  return {
    title: recipe.title,
    domainLabel: recipe.label,
    problem: inputs.problem.trim() || "لم يُحدد وصف إضافي؛ ابدأ بتوضيح المشكلة التي تهمك قبل التنفيذ.",
    objective: recipe.objective,
    levelLabel: levelLabels[inputs.level],
    timelineLabel: timelineLabels[inputs.timeline],
    budgetLabel: budgetSettings[inputs.budget].label,
    budgetGuidance: budgetSettings[inputs.budget].guidance,
    materials,
    phases,
    successCriteria,
    safetyNotes: [...recipe.safetyNotes],
    extension: inputs.level === "beginner" ? "بعد إكمال النسخة الأساسية، اختر عنصرًا واحدًا من الإضافات المتقدمة وجربه." : recipe.extension,
  };
}
