"use server";

import { ActionResponse, AssignmentsData, Assignment } from "@/types";
import { getSession, destroySession } from "@/lib/session";
import { fetchMoodleAssignments, fetchMoodleEnrolledCourses, MOODLE_SESSION_EXPIRED } from "@/lib/moodle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAssignmentsAction(): Promise<ActionResponse<AssignmentsData>> {
  try {
    const session = await getSession();

    if (!session || !session.moodleSession) {
      await destroySession();
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
        data: { assignments: [], enrolledCourses: [] },
      };
    }

    try {
      const [assignments, enrolledCourses] = await Promise.all([
        fetchMoodleAssignments(session.moodleSession, session.sesskey),
        fetchMoodleEnrolledCourses(session.moodleSession, session.sesskey),
      ]);

      // Cache live assignments to Supabase
      try {
        const supabase = createSupabaseServerClient();
        if (assignments.length > 0) {
          const records = assignments.map((a) => ({
            id: a.id,
            username: session.username,
            title: a.title,
            course_name: a.courseName,
            due_date: a.dueDate,
            timestamp: a.timestamp,
            url: a.url,
            status: a.status,
            category: a.category,
            description: a.description,
            is_overdue: a.isOverdue,
            updated_at: new Date().toISOString(),
          }));

          await supabase.from("cached_assignments").upsert(records, { onConflict: "id,username" });
        }
      } catch (cacheErr) {
        console.warn("[Supabase Assignment Cache Warning]:", cacheErr);
      }

      return {
        success: true,
        data: {
          assignments,
          enrolledCourses,
        },
      };
    } catch (apiError: any) {
      if (apiError.message === MOODLE_SESSION_EXPIRED || apiError.message?.includes("MOODLE_SESSION_EXPIRED")) {
        await destroySession();
        return {
          success: false,
          sessionExpired: true,
          error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
          data: { assignments: [], enrolledCourses: [] },
        };
      }

      console.error("[Moodle API Error] Failed to fetch live data from HEBAT, attempting Supabase cache fallback:", apiError);

      // Fallback to reading cached assignments from Supabase
      try {
        const supabase = createSupabaseServerClient();
        const { data: cached, error: cacheErr } = await supabase
          .from("cached_assignments")
          .select("*")
          .eq("username", session.username);

        if (!cacheErr && cached && cached.length > 0) {
          const cachedAssignments = cached.map((item: any) => ({
            id: String(item.id),
            title: item.title,
            courseName: item.course_name,
            dueDate: item.due_date,
            timestamp: item.timestamp,
            url: item.url,
            status: item.status || "pending",
            category: item.category,
            description: item.description,
            isOverdue: item.timestamp ? item.timestamp < Date.now() : item.is_overdue,
          }));

          const distinctCourses = Array.from(new Set(cachedAssignments.map((a) => a.courseName)));
          const cachedCourses = distinctCourses.map((cName, idx) => ({
            id: idx + 1,
            name: cName,
          }));

          return {
            success: true,
            data: {
              assignments: cachedAssignments,
              enrolledCourses: cachedCourses,
            },
            message: "Menampilkan data tugas dari cache Supabase (Server HEBAT tidak dapat dijangkau).",
          };
        }
      } catch (fallbackErr) {
        console.error("[Supabase Cache Fallback Error]:", fallbackErr);
      }

      return {
        success: false,
        data: {
          assignments: [],
          enrolledCourses: [],
        },
        error: `Gagal mengambil data dari HEBAT: ${apiError.message || "Koneksi terputus."}`,
      };
    }
  } catch (err: any) {
    if (err.message === MOODLE_SESSION_EXPIRED) {
      await destroySession();
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
        data: { assignments: [], enrolledCourses: [] },
      };
    }

    console.error("Error in getAssignmentsAction:", err);
    return {
      success: false,
      data: { assignments: [], enrolledCourses: [] },
      error: err.message || "Gagal mengambil daftar tugas dari server HEBAT.",
    };
  }
}
