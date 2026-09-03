type AppEnv = Env & {
  DB: D1Database;
  ASSETS: Fetcher;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};
type User = { id: string; name: string; email: string; avatarUrl?: string | null };
const SESSION_COOKIE = "smart_session";
const OAUTH_COOKIE = "smart_oauth_state";
const COURSE_SLUGS = new Set(["renewable-energy", "python-engineering", "bim", "mechatronics"]);
const LESSONS_PER_COURSE = 3;

export function isValidQuizInput(courseSlug: string, lessonIndex: number, score: number, total: number) {
  return COURSE_SLUGS.has(courseSlug) && Number.isInteger(lessonIndex) && lessonIndex >= 1 && lessonIndex <= LESSONS_PER_COURSE && Number.isInteger(score) && Number.isInteger(total) && total > 0 && score >= 0 && score <= total;
}

export function getNextProgress(completedLessons: number, lessonIndex: number, passed: boolean, totalLessons = LESSONS_PER_COURSE) {
  const completed = passed ? Math.max(completedLessons, lessonIndex) : completedLessons;
  return { completedLessons: completed, progress: Math.round((completed / totalLessons) * 100) };
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) { return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } }); }
function makeCookie(name: string, value: string, maxAge: number) { return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`; }
function readCookie(request: Request, name: string) { return (request.headers.get("Cookie") ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ? decodeURIComponent((request.headers.get("Cookie") ?? "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))!.slice(name.length + 1)) : null; }
function redirectWithCookies(location: string, cookies: string[]) { const headers = new Headers({ Location: location, "Cache-Control": "no-store, no-cache, must-revalidate", Vary: "Cookie" }); cookies.forEach((value) => headers.append("Set-Cookie", value)); return new Response(null, { status: 302, headers }); }
function htmlRedirectWithCookies(location: string, cookies: string[]) { const headers = new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate", Vary: "Cookie" }); cookies.forEach((value) => headers.append("Set-Cookie", value)); const safeLocation = JSON.stringify(location); return new Response(`<!doctype html><meta http-equiv="refresh" content="0;url=${location}"><script>location.replace(${safeLocation})</script><p>جارٍ تحويلك إلى Google...</p>`, { status: 200, headers }); }
function authError(message: string, stage: string) { const target = new URL("/login", "https://h1111.co"); target.searchParams.set("auth_error", message); target.searchParams.set("stage", stage); return redirectWithCookies(target.toString(), [makeCookie(OAUTH_COOKIE, "", 0)]); }
function randomId() { return crypto.randomUUID(); }

async function getCurrentUser(request: Request, env: AppEnv): Promise<User | null> {
  const sessionId = readCookie(request, SESSION_COOKIE);
  if (!sessionId) return null;
  const row = await env.DB.prepare("SELECT u.id, u.name, u.email, u.avatar_url AS avatarUrl FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?").bind(sessionId, Date.now()).first<User>();
  return row ?? null;
}
async function requireUser(request: Request, env: AppEnv) { const user = await getCurrentUser(request, env); if (!user) throw new Response(JSON.stringify({ error: "Login required" }), { status: 401, headers: { "Content-Type": "application/json" } }); return user; }

async function startGoogle(request: Request, env: AppEnv) {
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
  return htmlRedirectWithCookies(target.toString(), [makeCookie(OAUTH_COOKIE, state, 600)]);
}
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
  return json({ url: target.toString() }, 200, { "Set-Cookie": makeCookie(OAUTH_COOKIE, state, 600) });
}
async function finishGoogle(request: Request, env: AppEnv) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== readCookie(request, OAUTH_COOKIE)) return authError("تعذر التحقق من جلسة Google. امسح Cookies ثم حاول مرة أخرى.", "state");
  const callback = `${url.origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: callback, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) return authError("رفض Google إكمال تسجيل الدخول. تحقق من إعدادات OAuth.", "token_exchange");
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
  return redirectWithCookies(`${url.origin}/profile`, [makeCookie(SESSION_COOKIE, sessionId, 30 * 24 * 60 * 60), makeCookie(OAUTH_COOKIE, "", 0)]);
}

type ProgressRow = { userId: string; courseSlug: string; completedLessons: number; progress: number; lastActivity: number };
type ResultRow = { courseSlug: string; lessonIndex: number; quizScore: number; quizTotal: number; quizPassed: number; attempts: number; updatedAt: number };

async function api(request: Request, env: AppEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/auth/google" && request.method === "GET") return startGoogle(request, env);
  if (url.pathname === "/api/auth/google/url" && request.method === "GET") return startGoogleUrl(request, env);
  if (url.pathname === "/api/auth/google/callback" && request.method === "GET") return finishGoogle(request, env);
  if (url.pathname === "/api/auth/me" && request.method === "GET") return json({ user: await getCurrentUser(request, env) });
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    const sessionId = readCookie(request, SESSION_COOKIE);
    if (sessionId) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json", "Set-Cookie": makeCookie(SESSION_COOKIE, "", 0) } });
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
      await env.DB.prepare("INSERT INTO course_progress (user_id, course_slug, completed_lessons, progress, last_activity) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, course_slug) DO UPDATE SET completed_lessons = MAX(course_progress.completed_lessons, excluded.completed_lessons), progress = MAX(course_progress.progress, excluded.progress), last_activity = excluded.last_activity").bind(user.id, courseSlug, completed, Math.round((completed / LESSONS_PER_COURSE) * 100), now).run();
    }
    return json({ passed, score, total, ...getNextProgress(currentCompleted, lessonIndex, passed) });
  }
  return null;
}

export default { async fetch(request: Request, env: AppEnv) { try { const response = await api(request, env); return response ?? env.ASSETS.fetch(request); } catch (error) { if (error instanceof Response) return error; console.error(error); return json({ error: "Unexpected server error" }, 500); } } } satisfies ExportedHandler<AppEnv>;
