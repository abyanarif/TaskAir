"use server";

import { ActionResponse, AssignmentsData } from "@/types";
import { getSession, destroySession } from "@/lib/session";
import { fetchMoodleAssignments, fetchMoodleEnrolledCourses, MOODLE_SESSION_EXPIRED } from "@/lib/moodle";

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

      console.error("[Moodle API Error] Failed to fetch live data from HEBAT:", apiError);
      
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
