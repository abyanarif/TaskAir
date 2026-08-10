import { Assignment, CourseSection, CourseResource, EnrolledCourse, MoodleSessionData } from "@/types";

const BASE_URL = process.env.MOODLE_BASE_URL || "https://hebat.elearning.unair.ac.id";

export const MOODLE_SESSION_EXPIRED = "MOODLE_SESSION_EXPIRED";

/**
 * Sanitize text to decode/strip HTML entities like &nbsp; and normalize whitespace
 */
export const sanitizeText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Helper to inspect response JSON & HTTP status for session expiration
 */
function checkSessionExpiration(res: Response, json?: any, html?: string): void {
  if (res.status === 401 || res.status === 403) {
    throw new Error(MOODLE_SESSION_EXPIRED);
  }

  if (html && (html.includes('id="login"') || html.includes("login/index.php") || html.includes("servicerequireslogin"))) {
    throw new Error(MOODLE_SESSION_EXPIRED);
  }

  if (json) {
    const item = Array.isArray(json) ? json[0] : json;
    if (item) {
      if (
        item.errorcode === "servicerequireslogin" ||
        item.exception?.errorcode === "servicerequireslogin" ||
        item.errorcode === "requireloginerror" ||
        (item.error && item.exception?.message?.includes("logged out"))
      ) {
        throw new Error(MOODLE_SESSION_EXPIRED);
      }
    }
  }
}

/**
 * Perform 2-step Moodle Login on HEBAT elearning site
 */
export async function loginToMoodle(
  username: string,
  password: string
): Promise<MoodleSessionData> {
  const loginUrl = `${BASE_URL}/login/index.php`;

  const stepA = await fetch(loginUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!stepA.ok) {
    const errMsg = `Unable to reach HEBAT portal. HTTP status ${stepA.status}`;
    console.error("[Moodle Auth] Step A Failed:", errMsg);
    throw new Error(errMsg);
  }

  const html = await stepA.text();

  const tokenMatch =
    html.match(/name="logintoken"\s+value="([^"]+)"/) ||
    html.match(/value="([^"]+)"\s+name="logintoken"/);

  if (!tokenMatch || !tokenMatch[1]) {
    console.error("[Moodle Auth] Step A Error: logintoken input field not found");
    throw new Error("Could not extract logintoken from HEBAT login page.");
  }

  const loginToken = tokenMatch[1];
  const initialCookies = extractCookies(stepA.headers);

  const params = new URLSearchParams();
  params.append("anchor", "");
  params.append("logintoken", loginToken);
  params.append("username", username);
  params.append("password", password);

  const stepB = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Cookie: initialCookies,
    },
    body: params.toString(),
    redirect: "manual",
    cache: "no-store",
  });

  const responseCookies = extractCookies(stepB.headers);
  const fullCookies = combineCookies(initialCookies, responseCookies);
  const moodleSessionMatch = fullCookies.match(/MoodleSession=([^;]+)/);

  if (!moodleSessionMatch || !moodleSessionMatch[1]) {
    console.error("[Moodle Auth] Step B Failed: MoodleSession cookie header missing");
    throw new Error("Login failed. Invalid username, password, or HEBAT session expired.");
  }

  const moodleSession = moodleSessionMatch[1];
  const userDetails = await fetchMoodleProfile(fullCookies);

  return {
    username,
    fullName: userDetails.fullName || username,
    moodleSession,
    sesskey: userDetails.sesskey,
    loggedInAt: Date.now(),
  };
}

/**
 * Fetch Moodle User Profile & Sesskey from /my/
 */
async function fetchMoodleProfile(cookieString: string): Promise<{ fullName: string; sesskey?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/my/`, {
      method: "GET",
      headers: {
        Cookie: cookieString,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      redirect: "manual",
      cache: "no-store",
    });

    if (res.status === 302 || res.status === 301 || res.status === 401) {
      throw new Error(MOODLE_SESSION_EXPIRED);
    }

    if (!res.ok) return { fullName: "" };

    const html = await res.text();
    checkSessionExpiration(res, null, html);

    const sesskeyMatch =
      html.match(/"sesskey":"([^"]+)"/) ||
      html.match(/M\.cfg\.sesskey\s*=\s*"([^"]+)"/) ||
      html.match(/sesskey=([^"&]+)/);
    const sesskey = sesskeyMatch ? sesskeyMatch[1] : undefined;

    const nameMatch =
      html.match(/class="userbutton"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) ||
      html.match(/class="usertext[^"]*"[^>]*>([^<]+)</i) ||
      html.match(/class="username"[^>]*>([^<]+)</i);
    
    const rawFullName = nameMatch ? nameMatch[1] : "";
    const fullName = sanitizeText(rawFullName);

    return { fullName, sesskey };
  } catch (err: any) {
    if (err.message === MOODLE_SESSION_EXPIRED) throw err;
    console.error("[Moodle Profile Error]:", err);
    return { fullName: "" };
  }
}

/**
 * Fetch all enrolled courses via Moodle WS API core_course_get_enrolled_courses_by_timeline_classification & core_enrol_get_users_courses
 */
export async function fetchMoodleEnrolledCourses(
  moodleSession: string,
  sesskey?: string
): Promise<EnrolledCourse[]> {
  const serviceUrl = `${BASE_URL}/lib/ajax/service.php?sesskey=${sesskey || ""}&info=core_course_get_enrolled_courses_by_timeline_classification,core_enrol_get_users_courses`;

  const payload = [
    {
      index: 0,
      methodname: "core_course_get_enrolled_courses_by_timeline_classification",
      args: {
        classification: "all",
        limit: 0,
        offset: 0,
      },
    },
    {
      index: 1,
      methodname: "core_enrol_get_users_courses",
      args: {
        userid: 0,
      },
    },
  ];

  try {
    const res = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `MoodleSession=${moodleSession}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      checkSessionExpiration(res, json);

      const collectedCourses: EnrolledCourse[] = [];
      const seenIds = new Set<number>();

      if (Array.isArray(json)) {
        for (const item of json) {
          const courseList = item.data?.courses || item.data;
          if (Array.isArray(courseList)) {
            for (const c of courseList) {
              const cId = Number(c.id);
              if (cId && !seenIds.has(cId)) {
                seenIds.add(cId);
                collectedCourses.push({
                  id: cId,
                  name: sanitizeText(c.fullname || c.shortname || "Mata Kuliah"),
                  shortname: sanitizeText(c.shortname || ""),
                });
              }
            }
          }
        }
      }

      console.log("[DEBUG Moodle Enrolled Courses API]", collectedCourses);

      if (collectedCourses.length > 0) {
        return collectedCourses;
      }
    }
  } catch (error: any) {
    if (error.message === MOODLE_SESSION_EXPIRED) throw error;
    console.warn("[Moodle Enrolled Courses WS Error]:", error);
  }

  // HTML Scraper Fallback across /my/courses.php and /my/
  try {
    for (const path of ["/my/courses.php", "/my/"]) {
      const pageRes = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: {
          Cookie: `MoodleSession=${moodleSession}`,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "manual",
        cache: "no-store",
      });

      if (pageRes.status === 302 || pageRes.status === 301 || pageRes.status === 401) {
        throw new Error(MOODLE_SESSION_EXPIRED);
      }

      if (pageRes.ok) {
        const html = await pageRes.text();
        checkSessionExpiration(pageRes, null, html);

        const matches = [
          ...html.matchAll(/href="[^"]*course\/view\.php\?id=(\d+)"[^>]*>[\s\S]*?class="[^\"]*multiline[^\"]*"[^>]*>([^<]+)/gi),
          ...html.matchAll(/href="[^"]*course\/view\.php\?id=(\d+)"[^>]*>[\s\S]*?class="[^\"]*coursename[^\"]*"[^>]*>([^<]+)/gi),
          ...html.matchAll(/href="[^"]*course\/view\.php\?id=(\d+)"[^>]*>[\s\S]*?class="[^\"]*card-title[^\"]*"[^>]*>([^<]+)/gi),
          ...html.matchAll(/data-course-id="(\d+)"[\s\S]*?class="[^\"]*multiline[^\"]*"[^>]*>([^<]+)/gi),
        ];

        const extracted: EnrolledCourse[] = [];
        const seenIds = new Set<number>();

        for (const m of matches) {
          const cId = Number(m[1]);
          const name = sanitizeText(m[2] || "");
          if (cId && name && !seenIds.has(cId)) {
            seenIds.add(cId);
            extracted.push({ id: cId, name });
          }
        }

        console.log(`[DEBUG Moodle HTML Scraper ${path}]`, extracted);

        if (extracted.length > 0) return extracted;
      }
    }
  } catch (htmlErr: any) {
    if (htmlErr.message === MOODLE_SESSION_EXPIRED) throw htmlErr;
    console.error("[Moodle Course Scraper Fallback Error]:", htmlErr);
  }

  return [];
}

/**
 * Fetch Course Contents via core_course_get_contents
 */
export async function fetchCourseContents(
  courseId: number,
  moodleSession: string,
  sesskey?: string
): Promise<CourseSection[]> {
  const serviceUrl = `${BASE_URL}/lib/ajax/service.php?sesskey=${sesskey || ""}&info=core_course_get_contents`;

  const payload = [
    {
      index: 0,
      methodname: "core_course_get_contents",
      args: {
        courseid: courseId,
      },
    },
  ];

  try {
    const res = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `MoodleSession=${moodleSession}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error(MOODLE_SESSION_EXPIRED);
      console.error(`[Moodle Course Contents Error] HTTP ${res.status} for courseId ${courseId}`);
      return [];
    }

    const json = await res.json();
    checkSessionExpiration(res, json);

    if (Array.isArray(json) && json[0] && json[0].data && Array.isArray(json[0].data)) {
      const sectionsRaw = json[0].data;

      return sectionsRaw.map((sec: any) => {
        const secName = sanitizeText(sec.name || "Materi Umum");
        const modules: CourseResource[] = (sec.modules || []).map((mod: any) => {
          const modName = sanitizeText(mod.name || "Resource");
          const modType = mod.modname || "resource";
          const mainUrl = mod.url || `${BASE_URL}/mod/${modType}/view.php?id=${mod.id}`;
          const contentFile = mod.contents?.[0];
          const fileurl = contentFile?.fileurl
            ? `${contentFile.fileurl}${contentFile.fileurl.includes("?") ? "&" : "?"}token=${sesskey || ""}`
            : undefined;

          return {
            id: String(mod.id),
            name: modName,
            modname: modType,
            url: mainUrl,
            fileurl,
            isExternal: modType === "url",
          };
        });

        return {
          id: String(sec.id),
          name: secName,
          summary: sanitizeText((sec.summary || "").replace(/<[^>]*>?/gm, "")),
          modules,
        };
      });
    }

    return [];
  } catch (error: any) {
    if (error.message === MOODLE_SESSION_EXPIRED) throw error;
    console.error(`[Moodle Course Contents Critical Error] courseId ${courseId}:`, error);
    return [];
  }
}

/**
 * Fetch Assignments from Moodle AJAX internal endpoint
 */
export async function fetchMoodleAssignments(
  moodleSession: string,
  sesskey?: string
): Promise<Assignment[]> {
  const serviceUrl = `${BASE_URL}/lib/ajax/service.php?sesskey=${sesskey || ""}&info=core_calendar_get_action_events_by_timesort`;

  const payload = [
    {
      index: 0,
      methodname: "core_calendar_get_action_events_by_timesort",
      args: {
        limitnum: 20,
      },
    },
  ];

  try {
    const res = await fetch(serviceUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `MoodleSession=${moodleSession}`,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error(MOODLE_SESSION_EXPIRED);
      throw new Error(`Moodle AJAX Service returned HTTP ${res.status}`);
    }

    const json = await res.json();
    checkSessionExpiration(res, json);

    if (Array.isArray(json) && json[0]) {
      const responseItem = json[0];

      if (responseItem.error) {
        const detail = responseItem.exception?.message || responseItem.errorcode || "Unknown Moodle WS Error";
        if (
          responseItem.errorcode === "servicerequireslogin" ||
          responseItem.exception?.errorcode === "servicerequireslogin" ||
          detail.includes("logged out") ||
          detail.includes("expired")
        ) {
          throw new Error(MOODLE_SESSION_EXPIRED);
        }
        console.error("[Moodle WS Error Payload]", detail, responseItem);
        throw new Error(`Moodle API Error: ${detail}`);
      }

      if (responseItem.data && responseItem.data.events) {
        return parseMoodleEvents(responseItem.data.events);
      }
    }

    return [];
  } catch (error: any) {
    if (error.message === MOODLE_SESSION_EXPIRED) throw error;
    console.error("[Moodle Fetch Critical Error] Failed to fetch events:", error);
    throw error;
  }
}

/**
 * Convert Moodle event items into clean Assignment models
 */
function parseMoodleEvents(events: any[]): Assignment[] {
  const now = Math.floor(Date.now() / 1000);

  return events.map((evt) => {
    const dueTs = evt.timesort || evt.timestart || now;
    const dateObj = new Date(dueTs * 1000);
    const formattedDate = dateObj.toLocaleString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const rawTitle = evt.name || "Tugas Tanpa Judul";
    const rawCourse = evt.course?.fullname || evt.course?.shortname || "Mata Kuliah";
    const rawDesc = evt.description || "";

    return {
      id: String(evt.id),
      title: sanitizeText(rawTitle),
      courseName: sanitizeText(rawCourse),
      dueDate: formattedDate,
      timestamp: dueTs * 1000,
      url: evt.url || `${BASE_URL}/mod/assign/view.php?id=${evt.instance || evt.id}`,
      status: evt.isactionrequired === false || evt.action?.actionable === false ? "completed" : "pending",
      category: evt.modulename || "assignment",
      description: sanitizeText(rawDesc.replace(/<[^>]*>?/gm, "")),
      isOverdue: dueTs < now,
    };
  });
}

function extractCookies(headers: Headers): string {
  const getSetCookie = (headers as any).getSetCookie?.bind(headers);
  let cookiesArr: string[] = [];

  if (typeof getSetCookie === "function") {
    cookiesArr = getSetCookie();
  } else {
    const raw = headers.get("set-cookie");
    if (raw) cookiesArr = [raw];
  }

  return cookiesArr
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

function combineCookies(c1: string, c2: string): string {
  const map = new Map<string, string>();
  [c1, c2].forEach((str) => {
    str.split(";").forEach((part) => {
      const [key, val] = part.trim().split("=");
      if (key && val) map.set(key, val);
    });
  });
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}
