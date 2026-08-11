"use server";

import { ActionResponse, CourseSection, EnrolledCourse } from "@/types";
import { getSession, destroySession } from "@/lib/session";
import { fetchCourseContents, fetchMoodleEnrolledCourses, MOODLE_SESSION_EXPIRED } from "@/lib/moodle";

export async function getEnrolledCoursesAction(): Promise<ActionResponse<EnrolledCourse[]>> {
  try {
    const session = await getSession();

    if (!session || !session.moodleSession) {
      await destroySession();
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
        data: [],
      };
    }

    try {
      const courses = await fetchMoodleEnrolledCourses(
        session.moodleSession,
        session.sesskey
      );

      return {
        success: true,
        data: courses,
      };
    } catch (apiErr: any) {
      if (apiErr.message === MOODLE_SESSION_EXPIRED || apiErr.message?.includes("MOODLE_SESSION_EXPIRED")) {
        await destroySession();
        return {
          success: false,
          sessionExpired: true,
          error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
          data: [],
        };
      }
      throw apiErr;
    }
  } catch (err: any) {
    if (err.message === MOODLE_SESSION_EXPIRED) {
      await destroySession();
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
        data: [],
      };
    }

    console.error("Error in getEnrolledCoursesAction:", err);
    return {
      success: false,
      error: "Gagal mengambil data mata kuliah.",
      data: [],
    };
  }
}

export async function getCourseContentsAction(
  courseId: number
): Promise<ActionResponse<CourseSection[]>> {
  console.log('[DEBUG Fetching Course Contents ID]:', courseId);
  try {
    const session = await getSession();

    if (!session || !session.moodleSession) {
      await destroySession();
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
        data: [],
      };
    }

    try {
      const sections = await fetchCourseContents(
        courseId,
        session.moodleSession,
        session.sesskey
      );

      return {
        success: true,
        data: sections,
      };
    } catch (apiErr: any) {
      if (apiErr.message === MOODLE_SESSION_EXPIRED || apiErr.message?.includes("MOODLE_SESSION_EXPIRED")) {
        await destroySession();
        return {
          success: false,
          sessionExpired: true,
          error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
          data: [],
        };
      }
      throw apiErr;
    }
  } catch (err: any) {
    if (err.message === MOODLE_SESSION_EXPIRED) {
      await destroySession();
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi.",
        data: [],
      };
    }

    console.error(`Error in getCourseContentsAction for courseId ${courseId}:`, err);
    return {
      success: false,
      error: err.message || "Gagal memuat materi dan modul perkuliahan.",
      data: [],
    };
  }
}
