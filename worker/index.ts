const authRateBuckets = new Map<string, { count: number; resetAt: number }>();
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};
function withSecurityHeaders(response: Response) {
  const headers = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => headers.set(key, value));
  if (!headers.has("Content-Security-Policy")) headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; frame-src https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https://cdn.jsdelivr.net https://accounts.google.com https://oauth2.googleapis.com https://openidconnect.googleapis.com");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function allowAuthAttempt(request: Request) {
  const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? "unknown";
  const now = Date.now();
  const current = authRateBuckets.get(ip);
  if (!current || current.resetAt <= now) { authRateBuckets.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); return true; }
  if (current.count >= 12) return false;
  current.count += 1;
  return true;
}
type AppEnv = Env & {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  APP_URL?: string;
};
type User = { id: string; name: string; email: string; avatarUrl?: string | null };
const SESSION_COOKIE = "smart_session";
const OAUTH_COOKIE = "smart_oauth_state";
const ADMIN_EMAIL = "altiahussoni@gmail.com";
const COURSE_SLUGS = new Set(["renewable-energy", "python-engineering", "bim", "mechatronics", "ai-engineering", "ai-technology-engineering", "ai-foundations", "machine-learning", "deep-learning", "nlp-generative-ai", "computer-vision", "mlops-ai-security", "python-from-zero", "engineering-projects", "mit-machine-learning", "stanford-ai-foundations", "cmu-ai-engineering", "berkeley-ai-ml", "toronto-ai"]);
const LESSONS_PER_COURSE = 3;
const COURSE_LESSON_COUNTS: Record<string, number> = { "ai-engineering": 8, "ai-technology-engineering": 8, "ai-foundations": 8, "machine-learning": 8, "deep-learning": 8, "nlp-generative-ai": 8, "computer-vision": 8, "mlops-ai-security": 8, "engineering-projects": 8, "mit-machine-learning": 8, "stanford-ai-foundations": 8, "cmu-ai-engineering": 8, "berkeley-ai-ml": 8, "toronto-ai": 8, "python-from-zero": 11 };
function lessonCount(courseSlug: string) { return COURSE_LESSON_COUNTS[courseSlug] ?? LESSONS_PER_COURSE; }

export function isValidQuizInput(courseSlug: string, lessonIndex: number, score: number, total: number) {
  return COURSE_SLUGS.has(courseSlug) && Number.isInteger(lessonIndex) && lessonIndex >= 1 && lessonIndex <= lessonCount(courseSlug) && Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total;
}

export function getNextProgress(completedLessons: number, lessonIndex: number, passed: boolean, totalLessons = LESSONS_PER_COURSE) {
  const completed = passed ? Math.max(completedLessons, lessonIndex) : completedLessons;
  return { completedLessons: completed, progress: Math.round((completed / totalLessons) * 100) };
}

async function sendEmail(env: AppEnv, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY) return false;
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.MAIL_FROM || "EngiMind <no-reply@mail.h1111.co>", to: [to], subject, html }) });
  if (!response.ok) { console.error("Resend email failed", response.status, await response.text()); return false; }
  return true;
}
async function hashToken(token: string) { const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token)); return toBase64(digest); }
function appUrl(env: AppEnv, request: Request) { return env.APP_URL || new URL(request.url).origin; }
function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) { return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } }); }
function makeCookie(name: string, value: string, maxAge: number) { return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`; }
function readCookie(request: Request, name: string) { return (request.headers.get("Cookie") ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ? decodeURIComponent((request.headers.get("Cookie") ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))!.slice(name.length + 1)) : null; }
function htmlRedirectWithCookies(location: string, cookies: string[]) { const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate" }); cookies.forEach((value) => headers.append("Set-Cookie", value)); const safeLocation = JSON.stringify(location); return new Response(`<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${location}"><script>window.location.replace(${safeLocation})</script><p>جارٍ فتح Google...</p>`, { status: 200, headers }); }
function authError(message: string, stage: string, status = 502) { const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); headers.append("Set-Cookie", makeCookie(OAUTH_COOKIE, "", 0)); return new Response(`<!doctype html><meta charset="utf-8"><title>تعذر تسجيل الدخول</title><main dir="rtl" style="font-family:system-ui;max-width:680px;margin:80px auto;padding:24px"><h1>تعذر إكمال تسجيل الدخول</h1><p>${message}</p><small>مرحلة الخطأ: ${stage}</small><p><a href="/login">العودة إلى تسجيل الدخول</a></p></main>`, { status, headers }); }
function randomId() { return crypto.randomUUID(); }
const encoder = new TextEncoder();
function toBase64(bytes: ArrayBuffer) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function fromBase64(value: string) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
async function passwordHash(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  return `100000:${toBase64(salt.buffer)}:${toBase64(bits)}`;
}
async function passwordMatches(password: string, stored: string) {
  const [iterations, saltValue, expected] = stored.split(":");
  if (!iterations || !saltValue || !expected) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromBase64(saltValue), iterations: Number(iterations), hash: "SHA-256" }, key, 256);
  return toBase64(bits) === expected;
}

async function getCurrentUser(request: Request, env: AppEnv): Promise<User | null> {
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) return null;
  const row = await env.DB.prepare("SELECT u.id, u.name, u.email, u.avatar_url AS avatarUrl FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?").bind(sessionId, Date.now()).first<User>();
  return row ?? null;
}
async function requireUser(request: Request, env: AppEnv) { const user = await getCurrentUser(request, env); if (!user) throw new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: { "Content-Type": "application/json" } }); return user; }
async function requireAdmin(request: Request, env: AppEnv) { const user = await requireUser(request, env); if (user.email.trim().toLowerCase() !== ADMIN_EMAIL) throw new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { "Content-Type": "application/json" } }); return user; }

async function startGoogleUrl(request: Request, env: AppEnv) {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: "Google OAuth is not configured" }, 503);
  const url = new URL(request.url);
  const state = randomId();
  const callback = `${url.origin}/api/auth/google/callback`;
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  target.searchParams.set("redirect_uri", callback);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("scope", "openid email profile");
  target.searchParams.set("state", state);
  target.searchParams.set("prompt", "select_account");
  return json({ url: target.toString() }, 200, { "Set-Cookie": makeCookie(OAUTH_COOKIE, state, 600) });
}
async function startGoogleLegacy(request: Request, env: AppEnv) {
  if (!env.GOOGLE_CLIENT_ID) return json({ error: "Google OAuth is not configured" }, 503);
  const url = new URL(request.url);
  const state = randomId();
  const callback = `${url.origin}/api/auth/google/callback`;
  const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  target.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  target.searchParams.set("redirect_uri", callback);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("scope", "openid email profile");
  target.searchParams.set("state", state);
  target.searchParams.set("prompt", "select_account");
  return htmlRedirectWithCookies(target.toString(), [makeCookie(OAUTH_COOKIE, state, 600)]);
}
async function finishGoogle(request: Request, env: AppEnv) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== readCookie(request, OAUTH_COOKIE)) return authError("تعذر التحقق من جلسة Google. امسح Cookies ثم حاول مرة أخرى.", "state");
  const callback = `${url.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) return authError("رفض Google إكمال تسجيل الدخول. تحقق من GOOGLE_CLIENT_SECRET ورابط callback.", "token_exchange");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) return json({ error: "Google token missing" }, 502);
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return authError("تعذر قراءة بيانات حساب Google.", "profile_request");
  const profile = await profileResponse.json() as { sub?: string; name?: string; email?: string; picture?: string };
  if (!profile.sub || !profile.email) return json({ error: "Google profile incomplete" }, 400);
  const now = Date.now();
  const newUserId = randomId();
  try {
    await env.DB.prepare("INSERT INTO users (id, google_id, name, email, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(google_id) DO UPDATE SET name = excluded.name, email = excluded.email, avatar_url = excluded.avatar_url, updated_at = excluded.updated_at").bind(newUserId, profile.sub, profile.name || profile.email.split("@")[0], profile.email, profile.picture || null, now, now).run();
  } catch (error) {
    console.error("auth user upsert failed", error);
    return authError("تعذر حفظ المستخدم في قاعدة البيانات.", "user_upsert");
  }
  const user = await env.DB.prepare("SELECT id FROM users WHERE google_id = ?").bind(profile.sub).first<{ id: string }>();
  if (!user) return authError("تعذر إنشاء المستخدم.", "user_lookup");
  const sessionId = randomId();
  try {
    await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(sessionId, user.id, now + 30 * 24 * 60 * 60 * 1000, now).run();
  } catch (error) {
    console.error("auth session insert failed", error);
    return authError("تعذر إنشاء جلسة الدخول.", "session_insert");
  }
  return htmlRedirectWithCookies(`${url.origin}/profile?auth=success`, [makeCookie(SESSION_COOKIE, sessionId, 30 * 24 * 60 * 60), makeCookie(OAUTH_COOKIE, "", 0)]);
}

type ProgressRow = { userId: string; courseSlug: string; completedLessons: number; progress: number; lastActivity: number };
type ResultRow = { courseSlug: string; lessonIndex: number; quizScore: number; quizTotal: number; quizPassed: number; attempts: number; updatedAt: number };

async function emailAuthUnsafe(request: Request, env: AppEnv, register: boolean) {
  const body = await request.json() as { name?: string; email?: string; password?: string };
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if ((!register || name.length >= 2) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8) {
    const existing = await env.DB.prepare("SELECT id, name, email, avatar_url AS avatarUrl, password_hash AS passwordHash FROM users WHERE email = ?").bind(email).first<User & { passwordHash?: string | null }>();
    if (register) {
      if (existing) return json({ error: "هذا البريد مستخدم مسبقًا" }, 409);
      const now = Date.now();
      const userId = randomId();
      await env.DB.prepare("INSERT INTO users (id, google_id, name, email, avatar_url, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(userId, `email:${email}`, name, email, null, await passwordHash(password), now, now).run();
      await sendEmail(env, email, "مرحباً بك في EngiMind", `<div dir="rtl"><h1>مرحباً ${name}</h1><p>تم إنشاء حسابك في EngiMind بنجاح.</p><p>ابدأ مسارك التعليمي الآن: <a href="${appUrl(env, request)}">فتح المنصة</a></p></div>`);
    } else {
      if (!existing?.passwordHash || !(await passwordMatches(password, existing.passwordHash))) return json({ error: "البريد أو كلمة المرور غير صحيحة" }, 401);
    }
    const user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<{ id: string }>();
    if (!user) return json({ error: "تعذر إنشاء الحساب" }, 500);
    const sessionId = randomId();
    await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(sessionId, user.id, Date.now() + 30 * 24 * 60 * 60 * 1000, Date.now()).run();
    return new Response(JSON.stringify({ user: { id: user.id, name: register ? name : existing?.name, email } }), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Set-Cookie": makeCookie(SESSION_COOKIE, sessionId, 30 * 24 * 60 * 60) } });
  }
  return json({ error: register ? "أدخل الاسم والبريد وكلمة مرور من 8 أحرف على الأقل" : "أدخل بريدًا صحيحًا وكلمة المرور" }, 400);
}
async function emailAuth(request: Request, env: AppEnv, register: boolean) {
  try { return await emailAuthUnsafe(request, env, register); }
  catch (error) { console.error("email auth failed", error); return json({ error: "تعذر إنشاء الحساب من الخادم", stage: register ? "register" : "login" }, 500); }
}
async function requestPasswordReset(request: Request, env: AppEnv) {
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const generic = json({ ok: true, message: "إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return generic;
  const user = await env.DB.prepare("SELECT id, name, email FROM users WHERE email = ?").bind(email).first<{ id: string; name: string; email: string }>();
  if (!user) return generic;
  const rawToken = `${randomId()}${randomId()}`;
  const tokenHash = await hashToken(rawToken);
  const now = Date.now();
  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("INSERT INTO password_reset_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(tokenHash, user.id, now + 30 * 60 * 1000, now).run();
  const link = `${appUrl(env, request)}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendEmail(env, user.email, "إعادة تعيين كلمة مرور EngiMind", `<div dir="rtl"><h1>إعادة تعيين كلمة المرور</h1><p>مرحباً ${user.name}، اضغط الرابط التالي خلال 30 دقيقة:</p><p><a href="${link}">تعيين كلمة مرور جديدة</a></p><p>إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p></div>`);
  return generic;
}
async function resetPassword(request: Request, env: AppEnv) {
  const body = await request.json() as { token?: string; newPassword?: string };
  if (!body.token || !body.newPassword || body.newPassword.length < 8) return json({ error: "الرابط أو كلمة المرور غير صالحين" }, 400);
  const tokenHash = await hashToken(body.token);
  const row = await env.DB.prepare("SELECT user_id AS userId FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?").bind(tokenHash, Date.now()).first<{ userId: string }>();
  if (!row) return json({ error: "الرابط منتهي أو غير صالح" }, 400);
  await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(await passwordHash(body.newPassword), Date.now(), row.userId).run();
  await env.DB.prepare("DELETE FROM password_reset_tokens WHERE token_hash = ?").bind(tokenHash).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.userId).run();
  return json({ ok: true });
}

async function changePassword(request: Request, env: AppEnv) {
  const user = await requireUser(request, env);
  const body = await request.json() as { currentPassword?: string; newPassword?: string };
  const row = await env.DB.prepare("SELECT password_hash AS passwordHash FROM users WHERE id = ?").bind(user.id).first<{ passwordHash?: string | null }>();
  if (!row?.passwordHash || !(await passwordMatches(body.currentPassword ?? "", row.passwordHash))) return json({ error: "كلمة المرور الحالية غير صحيحة" }, 401);
  if (!body.newPassword || body.newPassword.length < 8) return json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, 400);
  await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(await passwordHash(body.newPassword), Date.now(), user.id).run();
  return json({ ok: true });
}

async function api(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/auth/register" && request.method === "POST") return allowAuthAttempt(request) ? emailAuth(request, env, true) : json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, 429);
  if (url.pathname === "/api/auth/login" && request.method === "POST") return allowAuthAttempt(request) ? emailAuth(request, env, false) : json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, 429);
  if (url.pathname === "/api/auth/change-password" && request.method === "POST") return allowAuthAttempt(request) ? changePassword(request, env) : json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, 429);
  if (url.pathname === "/api/auth/request-reset" && request.method === "POST") return allowAuthAttempt(request) ? requestPasswordReset(request, env) : json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, 429);
  if (url.pathname === "/api/auth/reset-password" && request.method === "POST") return allowAuthAttempt(request) ? resetPassword(request, env) : json({ error: "محاولات كثيرة. حاول بعد 15 دقيقة." }, 429);
  if (url.pathname === "/api/auth/google" && request.method === "GET") return startGoogleLegacy(request, env);
  if (url.pathname === "/api/auth/google/url" && request.method === "GET") return startGoogleUrl(request, env);
  if (url.pathname.startsWith("/api/auth/google/callback") && request.method === "GET") return finishGoogle(request, env);
  if (url.pathname === "/api/auth/me" && request.method === "GET") return json({ user: await getCurrentUser(request, env) });
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    const sessionId = readCookie(request, SESSION_COOKIE);
    if (sessionId) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": makeCookie(SESSION_COOKIE, "", 0) } });
  }
  if (url.pathname === "/api/admin/users" && request.method === "GET") {
    await requireAdmin(request, env);
    const rows = await env.DB.prepare("SELECT u.id, u.name, u.email, u.created_at AS createdAt, COALESCE((SELECT SUM(p.progress) FROM course_progress p WHERE p.user_id = u.id), 0) AS progress, (SELECT COUNT(*) FROM quiz_results q WHERE q.user_id = u.id) AS quizCount FROM users u ORDER BY u.created_at DESC").all<{ id: string; name: string; email: string; createdAt: number; progress: number; quizCount: number }>();
    return json(rows.results);
  }
  if (url.pathname.startsWith("/api/admin/users/") && url.pathname.endsWith("/delete") && request.method === "POST") {
    await requireAdmin(request, env);
    const userId = url.pathname.split("/")[4];
    if (!userId) return json({ error: "Invalid user" }, 400);
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    return json({ ok: true });
  }
  if (url.pathname.startsWith("/api/admin/users/") && url.pathname.endsWith("/reset-password") && request.method === "POST") {
    await requireAdmin(request, env);
    const userId = url.pathname.split("/")[4];
    const body = await request.json() as { newPassword?: string };
    if (!userId || !body.newPassword || body.newPassword.length < 8) return json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, 400);
    const result = await env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(await passwordHash(body.newPassword), Date.now(), userId).run();
    if (!result.meta.changes) return json({ error: "العضو غير موجود" }, 404);
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    return json({ ok: true });
  }
  if (url.pathname === "/api/progress" && request.method === "GET") {
    const user = await requireUser(request, env);
    const rows = await env.DB.prepare("SELECT user_id AS userId, course_slug AS courseSlug, completed_lessons AS completedLessons, progress, last_activity AS lastActivity FROM course_progress WHERE user_id = ? ORDER BY last_activity DESC").bind(user.id).all<ProgressRow>();
    return json(rows.results ?? []);
  }
  if (url.pathname === "/api/quiz-results" && request.method === "GET") {
    const user = await requireUser(request, env);
    const rows = await env.DB.prepare("SELECT course_slug AS courseSlug, lesson_index AS lessonIndex, quiz_score AS quizScore, quiz_total AS quizTotal, quiz_passed AS quizPassed, attempts, updated_at AS updatedAt FROM quiz_results WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id).all<ResultRow>();
    return json(rows.results ?? []);
  }
  if (url.pathname === "/api/projects" && request.method === "GET") {
    const user = await requireUser(request, env);
    const rows = await env.DB.prepare("SELECT id, title, description, tools, url, status, updated_at AS updatedAt FROM student_projects WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id).all();
    return json(rows.results ?? []);
  }
  if (url.pathname === "/api/projects" && request.method === "POST") {
    const user = await requireUser(request, env);
    const body = await request.json() as { title?: string; description?: string; tools?: string; url?: string };
    const title = body.title?.trim() ?? "";
    if (title.length < 2 || title.length > 160) return json({ error: "Project title is required" }, 400);
    const id = randomId();
    await env.DB.prepare("INSERT INTO student_projects (id, user_id, title, description, tools, url, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, user.id, title, body.description?.trim() ?? "", body.tools?.trim() ?? "", body.url?.trim() ?? "", "In progress", Date.now()).run();
    return json({ id, title, description: body.description?.trim() ?? "", tools: body.tools?.trim() ?? "", url: body.url?.trim() ?? "", status: "In progress", updatedAt: Date.now() }, 201);
  }
  if (url.pathname.startsWith("/api/projects/") && request.method === "DELETE") {
    const user = await requireUser(request, env);
    const id = url.pathname.split("/")[3];
    if (!id) return json({ error: "Invalid project" }, 400);
    await env.DB.prepare("DELETE FROM student_projects WHERE id = ? AND user_id = ?").bind(id, user.id).run();
    return json({ ok: true });
  }
  if (url.pathname === "/api/preferences" && request.method === "GET") {
    const user = await requireUser(request, env);
    const row = await env.DB.prepare("SELECT language, selected_goal AS selectedGoal FROM user_preferences WHERE user_id = ?").bind(user.id).first();
    return json(row ?? { language: "ar", selectedGoal: null });
  }
  if (url.pathname === "/api/preferences" && request.method === "PUT") {
    const user = await requireUser(request, env);
    const body = await request.json() as { language?: string; selectedGoal?: string | null };
    const language = body.language === "en" ? "en" : "ar";
    await env.DB.prepare("INSERT INTO user_preferences (user_id, language, selected_goal, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET language = excluded.language, selected_goal = excluded.selected_goal, updated_at = excluded.updated_at").bind(user.id, language, body.selectedGoal ?? null, Date.now()).run();
    return json({ language, selectedGoal: body.selectedGoal ?? null });
  }
  if (url.pathname === "/api/quiz/complete" && request.method === "POST") {
    const user = await requireUser(request, env);
    const body = await request.json() as { courseSlug?: string; lessonIndex?: number; score?: number; total?: number };
    const courseSlug = body.courseSlug ?? "";
    const lessonIndex = Number(body.lessonIndex);
    const score = Number(body.score);
    const total = Number(body.total);
    if (!isValidQuizInput(courseSlug, lessonIndex, score, total)) return json({ error: "Invalid quiz data" }, 400);
    const existing = await env.DB.prepare("SELECT completed_lessons AS completedLessons FROM course_progress WHERE user_id = ? AND course_slug = ?").bind(user.id, courseSlug).first<{ completedLessons: number }>();
    const currentCompleted = existing?.completedLessons ?? 0;
    if (lessonIndex > currentCompleted + 1) return json({ error: "Complete the previous lesson first" }, 403);
    const passed = score / total >= 0.7;
    const now = Date.now();
    await env.DB.prepare("INSERT INTO quiz_results (user_id, course_slug, lesson_index, quiz_score, quiz_total, quiz_passed, attempts, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?) ON CONFLICT(user_id, course_slug, lesson_index) DO UPDATE SET quiz_score = excluded.quiz_score, quiz_total = excluded.quiz_total, quiz_passed = excluded.quiz_passed, attempts = quiz_results.attempts + 1, updated_at = excluded.updated_at").bind(user.id, courseSlug, lessonIndex, score, total, passed ? 1 : 0, now).run();
    if (passed) {
      const completed = Math.max(currentCompleted, lessonIndex);
      await env.DB.prepare("INSERT INTO course_progress (user_id, course_slug, completed_lessons, progress, last_activity) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, course_slug) DO UPDATE SET completed_lessons = MAX(course_progress.completed_lessons, excluded.completed_lessons), progress = MAX(course_progress.progress, excluded.progress), last_activity = excluded.last_activity").bind(user.id, courseSlug, completed, Math.round((completed / lessonCount(courseSlug)) * 100), now).run();
    }
    return json({ passed, score, total, ...getNextProgress(currentCompleted, lessonIndex, passed, lessonCount(courseSlug)) });
  }
  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/login" || url.pathname.endsWith(".html"))) {
    const freshUrl = new URL(request.url);
    freshUrl.searchParams.set("_v", "20260903");
    const response = await env.ASSETS.fetch(new Request(freshUrl, request));
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return new Response(response.body, { status: response.status, headers });
  }
  return null;
}

export default { async fetch(request: Request, env: AppEnv) { try { const response = await api(request, env); return withSecurityHeaders(response ?? await env.ASSETS.fetch(request)); } catch (error) { if (error instanceof Response) return error; console.error(error); return json({ error: "Unexpected server error" }, 500); } } } satisfies ExportedHandler<AppEnv>;
