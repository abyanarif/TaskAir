"use server";

import { ActionResponse, UserProfile } from "@/types";
import { loginToMoodle } from "@/lib/moodle";
import { createSession, destroySession, getSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  username: string,
  password: string
): Promise<ActionResponse<UserProfile>> {
  if (!username || !username.trim()) {
    return { success: false, error: "NIM / Username Cybercampus/HEBAT tidak boleh kosong." };
  }

  if (!password || !password.trim()) {
    return { success: false, error: "Password HEBAT tidak boleh kosong." };
  }

  try {
    const sessionData = await loginToMoodle(username.trim(), password.trim());
    await createSession(sessionData);

    try {
      const supabase = createSupabaseServerClient();
      await supabase.from("user_profiles").upsert(
        {
          username: sessionData.username,
          full_name: sessionData.fullName,
          last_login_at: new Date(sessionData.loggedInAt).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "username" }
      );
    } catch (dbErr) {
      console.warn("[Supabase Sync Warning] Failed to sync login profile:", dbErr);
    }

    return {
      success: true,
      data: {
        username: sessionData.username,
        fullName: sessionData.fullName,
        loggedInAt: sessionData.loggedInAt,
      },
    };
  } catch (err: any) {
    console.error("Login action error:", err);
    return {
      success: false,
      error: err.message || "Gagal masuk ke HEBAT Elearning. Silakan periksa kembali NIM dan password Anda.",
    };
  }
}

export async function logoutAction(): Promise<ActionResponse> {
  try {
    await destroySession();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal logout" };
  }
}

export async function getCurrentUserAction(): Promise<ActionResponse<UserProfile | null>> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        username: session.username,
        fullName: session.fullName,
        loggedInAt: session.loggedInAt,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
