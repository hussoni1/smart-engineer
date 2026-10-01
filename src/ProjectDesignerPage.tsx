import { useState, type FormEvent } from "react";
import { buildProjectPlan, type EngineeringProjectPlan, type ProjectInputs } from "./projectDesigner";
import "./ProjectDesignerPage.css";

type SavedPlan = { id: string; savedAt: string; plan: EngineeringProjectPlan };

const STORAGE_KEY = "smart-engineer-project-plans";
const initialInputs: ProjectInputs = {
  domain: "agriculture",
  problem: "",
  level: "beginner",
  budget: "low",
  timeline: "two-weeks",
  availableMaterials: "",
};

function readSavedPlans(): SavedPlan[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed as SavedPlan[] : [];
  } catch {
    return [];
  }
}

function planAsMarkdown(plan: EngineeringProjectPlan) {
  return [
    `# ${plan.title}`,
    `\n**المجال:** ${plan.domainLabel}  `,
    `**المستوى:** ${plan.levelLabel}  `,
    `**المدة:** ${plan.timelineLabel}  `,
    `**الميزانية:** ${plan.budgetLabel}`,
    `\n## المشكلة`, plan.problem,
    `\n## الهدف`, plan.objective,
    `\n## المواد`, ...plan.materials.map((item) => `- [${item.available ? "x" : " "}] ${item.name}${item.essential ? " (أساسية)" : " (اختيارية)"}`),
    `\n## مراحل التنفيذ`, ...plan.phases.map((phase, index) => `${index + 1}. **${phase.title}**\n   ${phase.description}\n   - الناتج: ${phase.deliverable}`),
    `\n## معايير النجاح`, ...plan.successCriteria.map((item) => `- ${item}`),
    `\n## السلامة`, ...plan.safetyNotes.map((item) => `- ${item}`),
    `\n## توسعة مقترحة`, plan.extension,
    `\n> هذه خطة تعليمية أولية. راجع مختصًا وإرشادات السلامة قبل التنفيذ العملي.`,
  ].join("\n");
}

export function ProjectDesignerPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [inputs, setInputs] = useState<ProjectInputs>(initialInputs);
  const [plan, setPlan] = useState<EngineeringProjectPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(readSavedPlans);
  const [notice, setNotice] = useState("");

  const updateInput = <K extends keyof ProjectInputs>(key: K, value: ProjectInputs[K]) => {
    setInputs((current) => ({ ...current, [key]: value }));
  };

  const generate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlan(buildProjectPlan(inputs));
    setNotice("");
    window.setTimeout(() => document.getElementById("generated-project-plan")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  const savePlan = () => {
    if (!plan) return;
    const next = [{ id: crypto.randomUUID(), savedAt: new Date().toLocaleDateString("ar-IQ"), plan }, ...savedPlans].slice(0, 8);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSavedPlans(next);
      setNotice("انحفظت الخطة على هذا الجهاز.");
    } catch {
      setNotice("تعذر الحفظ في المتصفح. جرّب تصدير الخطة بدلًا من ذلك.");
    }
  };

  const deletePlan = (id: string) => {
    const next = savedPlans.filter((item) => item.id !== id);
    setSavedPlans(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* The current session list remains updated. */ }
  };

  const exportPlan = () => {
    if (!plan) return;
    const file = new Blob([planAsMarkdown(plan)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${plan.title.replace(/\s+/g, "-")}-خطة.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyPlan = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(planAsMarkdown(plan));
      setNotice("تم نسخ الخطة إلى الحافظة.");
    } catch {
      setNotice("ما قدرنا نوصل للحافظة من هذا المتصفح. استخدم زر التصدير.");
    }
  };

  const openSavedPlan = (saved: SavedPlan) => {
    setPlan(saved.plan);
    setNotice(`فتحت الخطة المحفوظة بتاريخ ${saved.savedAt}.`);
    window.setTimeout(() => document.getElementById("generated-project-plan")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  return (
    <section className="workspace-shell designer-shell">
      <div className="workspace-heading designer-heading">
        <div>
          <span className="eyebrow">Engineering Project Designer · أداة تخطيط هندسي</span>
          <h1>حوّل فكرتك إلى خطة مشروع قابلة للتنفيذ</h1>
          <p>جاوب عن كم سؤال، وخذ مسار عمل أولي يناسب مجالك ومستواك والمواد والوقت المتاح عندك.</p>
        </div>
        <button className="secondary-button" onClick={() => onNavigate("/projects")}>← ارجع للمشاريع التعليمية</button>
      </div>

      <div className="designer-value-strip" aria-label="مميزات المصمم">
        <div><span>01</span><strong>ابدأ بمشكلتك</strong><small>اكتب الفكرة اللي تهمّك</small></div>
        <div><span>02</span><strong>خطوات واقعية</strong><small>مهام ومخرجات لكل مرحلة</small></div>
        <div><span>03</span><strong>ملكية بياناتك</strong><small>الحفظ محلي على جهازك</small></div>
      </div>

      <div className="designer-layout">
        <form className="workspace-card designer-form" onSubmit={generate}>
          <div className="designer-form-heading"><span className="eyebrow">Project brief · ملخص المشروع</span><h2>خلّينا نرسم البداية</h2><p>ما تحتاج حساب. لا نرسل إجاباتك إلى خادم؛ الخطة تتكوّن داخل المتصفح.</p></div>

          <label className="designer-field">المجال الهندسي
            <select value={inputs.domain} onChange={(event) => updateInput("domain", event.target.value as ProjectInputs["domain"])}>
              <option value="agriculture">زراعة ذكية ومياه</option>
              <option value="energy">طاقة واستدامة</option>
              <option value="robotics">روبوتات وتحكم</option>
              <option value="ai-data">ذكاء اصطناعي وبيانات</option>
            </select>
          </label>

          <label className="designer-field">شنو المشكلة اللي تريد تحلها؟
            <textarea value={inputs.problem} onChange={(event) => updateInput("problem", event.target.value)} maxLength={240} placeholder="مثال: أريد أقلل هدر الماء في أصص البيت." />
            <small>اكتبها ببساطة؛ راح نستخدمها لتخصيص ملخص الخطة. ({inputs.problem.length}/240)</small>
          </label>

          <div className="designer-field-pair">
            <label className="designer-field">مستواك الحالي
              <select value={inputs.level} onChange={(event) => updateInput("level", event.target.value as ProjectInputs["level"])}>
                <option value="beginner">مبتدئ · أتعلم الأساسيات</option>
                <option value="intermediate">متوسط · نفذت تجارب بسيطة</option>
                <option value="advanced">متقدم · أريد تحليلًا أعمق</option>
              </select>
            </label>
            <label className="designer-field">الوقت المتاح
              <select value={inputs.timeline} onChange={(event) => updateInput("timeline", event.target.value as ProjectInputs["timeline"])}>
                <option value="one-week">أسبوع واحد</option>
                <option value="two-weeks">أسبوعان إلى ثلاثة</option>
                <option value="month">شهر تقريبًا</option>
              </select>
            </label>
          </div>

          <div className="designer-field-pair">
            <label className="designer-field">حدود الميزانية
              <select value={inputs.budget} onChange={(event) => updateInput("budget", event.target.value as ProjectInputs["budget"])}>
                <option value="low">أقل تكلفة ممكنة</option>
                <option value="standard">ميزانية طلابية معتدلة</option>
                <option value="flexible">مرونة لإضافات اختيارية</option>
              </select>
            </label>
            <label className="designer-field">شنو المواد الموجودة عندك؟
              <input value={inputs.availableMaterials} onChange={(event) => updateInput("availableMaterials", event.target.value)} placeholder="Arduino، أسلاك، حساس..." maxLength={180} />
            </label>
          </div>

          <button className="primary-button designer-submit" type="submit"><span aria-hidden="true">✦</span> كوّن خطة مشروعي</button>
          <p className="designer-disclaimer">المقترحات نقطة بداية تعليمية، مو بديل عن مراجعة المشرف أو تعليمات السلامة.</p>
        </form>

        <aside className="designer-side-panel">
          <div className="workspace-card designer-side-card">
            <span className="eyebrow">ماذا ستحصل؟</span>
            <h2>خطة شغل، مو مجرد عنوان</h2>
            <ul>
              <li><span>✓</span> هدف هندسي واضح</li>
              <li><span>✓</span> مواد أساسية واختيارية</li>
              <li><span>✓</span> أربع مراحل ومخرجات</li>
              <li><span>✓</span> معايير نجاح وتنبيهات سلامة</li>
            </ul>
          </div>
          <div className="workspace-card designer-side-card designer-tip"><span className="eyebrow">فكّر مثل المهندس</span><p>اختبر متغيرًا واحدًا كل مرة، وسجّل القياس قبل ما تقرر أن التصميم نجح.</p></div>
        </aside>
      </div>

      {plan && <section className="workspace-card generated-plan" id="generated-project-plan" aria-live="polite">
        <div className="generated-plan-header">
          <div><span className="eyebrow">Your project blueprint · مخطط مشروعك</span><h2>{plan.title}</h2><span className="course-chip cyan">{plan.domainLabel}</span></div>
          <div className="generated-plan-actions"><button className="secondary-button" onClick={savePlan}>احفظ على جهازي</button><button className="secondary-button" onClick={exportPlan}>نزّل كملف Markdown</button><button className="text-button" onClick={() => window.print()}>طباعة</button></div>
        </div>
        {notice && <p className="designer-notice" role="status">{notice}</p>}
        <div className="plan-meta-grid"><div><small>المستوى</small><strong>{plan.levelLabel}</strong></div><div><small>المدة</small><strong>{plan.timelineLabel}</strong></div><div><small>الميزانية</small><strong>{plan.budgetLabel}</strong></div></div>
        <div className="plan-overview"><div><span className="eyebrow">المشكلة</span><p>{plan.problem}</p></div><div><span className="eyebrow">الهدف الهندسي</span><p>{plan.objective}</p></div><div><span className="eyebrow">مراعاة الميزانية</span><p>{plan.budgetGuidance}</p></div></div>
        <div className="plan-section"><div className="section-heading"><div><span className="eyebrow">Materials · المواد</span><h3>شنو تحتاج؟</h3></div><span className="plan-key"><i className="available-dot" /> موجودة عندك <i className="missing-dot" /> تحتاج توفيرها</span></div>
          <div className="plan-materials">{plan.materials.map((item) => <div className={`plan-material ${item.available ? "is-available" : ""}`} key={item.name}><span>{item.available ? "✓" : "＋"}</span><strong>{item.name}</strong><small>{item.available ? "متوفر" : item.essential ? "أساسي" : "اختياري"}</small></div>)}</div>
        </div>
        <div className="plan-section"><div className="section-heading"><div><span className="eyebrow">Build sequence · تسلسل التنفيذ</span><h3>قسّم الشغل إلى مراحل</h3></div></div><div className="plan-phases">{plan.phases.map((phase, index) => <article className="plan-phase" key={phase.title}><span className="plan-phase-number">{String(index + 1).padStart(2, "0")}</span><div><h4>{phase.title}</h4><p>{phase.description}</p><small><b>الناتج:</b> {phase.deliverable}</small></div></article>)}</div></div>
        <div className="plan-bottom-grid"><section className="plan-checklist"><span className="eyebrow">Definition of done · النجاح</span><h3>شلون تعرف أن المشروع نجح؟</h3>{plan.successCriteria.map((criterion) => <label key={criterion}><input type="checkbox" />{criterion}</label>)}</section><section className="plan-safety"><span className="eyebrow">Safety first · السلامة</span><h3>قبل لا تبدي</h3>{plan.safetyNotes.map((note) => <p key={note}>{note}</p>)}</section></div>
        <div className="plan-extension"><span className="eyebrow">الخطوة التالية</span><p>{plan.extension}</p></div>
        <div className="generated-plan-footer"><span>الخطة أولية وتتطلب مراجعة مناسبة قبل شراء المواد أو بدء التجربة.</span><button className="text-button" onClick={copyPlan}>نسخ الخطة</button></div>
      </section>}

      {savedPlans.length > 0 && <section className="workspace-card saved-plans"><div className="section-heading"><div><span className="eyebrow">Saved on this device · محفوظ محليًا</span><h2>خططي السابقة</h2></div><span>{savedPlans.length}/8</span></div><div className="saved-plan-list">{savedPlans.map((saved) => <article className="saved-plan-item" key={saved.id}><button className="saved-plan-open" onClick={() => openSavedPlan(saved)}><span className="course-chip cyan">{saved.plan.domainLabel}</span><strong>{saved.plan.title}</strong><small>{saved.savedAt} · {saved.plan.timelineLabel}</small></button><button className="saved-plan-delete" aria-label={`حذف ${saved.plan.title}`} onClick={() => deletePlan(saved.id)}>حذف</button></article>)}</div></section>}
    </section>
  );
}
