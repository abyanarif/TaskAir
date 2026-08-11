"use server";

import { ActionResponse, UserPreferences } from "@/types";
import { getSession } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { sendTelegramMessage } from "@/lib/telegram";

export async function sendTestTelegramNotificationAction(
  chatId: string
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || !session.username) {
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi Anda telah habis. Silakan login kembali.",
      };
    }

    const cleanChatId = chatId.trim();
    if (!cleanChatId) {
      return {
        success: false,
        error: "Telegram Chat ID tidak boleh kosong.",
      };
    }

    const nowFormatted = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const messageText = `🔔 *[AIRLANGGA TASKFLOW TEST]*

Halo! Notifikasi Telegram Airlangga TaskFlow berhasil terhubung dengan akun HEBAT Anda! 🎉

📌 *NIM:* \`${session.username}\`
📝 *Nama:* ${session.fullName || "Mahasiswa"}
⏰ *Waktu Tes:* ${nowFormatted}

_Pengingat otomatis akan dikirimkan melalui bot ini ketika ada tugas baru atau deadline yang mendekati (H-1 / H-3)._ 🚀`;

    const res = await sendTelegramMessage(cleanChatId, messageText, "Markdown");

    if (!res.ok) {
      return {
        success: false,
        error: `Gagal mengirim pesan via Telegram API: ${res.description || "Pastikan Chat ID benar dan Anda telah menekan /start di @taskflowunair_bot."}`,
      };
    }

    // Save verified Telegram Chat ID to Supabase
    const supabase = createSupabaseServerClient();
    await supabase.from("user_profiles").upsert(
      {
        username: session.username,
        full_name: session.fullName,
        telegram_chat_id: cleanChatId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" }
    );

    return {
      success: true,
      message: "Test notifikasi berhasil terkirim ke Telegram Anda! Chat ID otomatis tersimpan.",
    };
  } catch (err: any) {
    console.error("Error in sendTestTelegramNotificationAction:", err);
    return {
      success: false,
      error: err.message || "Gagal mengirim test notifikasi Telegram.",
    };
  }
}

export async function updateTelegramChatIdAction(
  chatId: string
): Promise<ActionResponse<{ telegramChatId: string }>> {
  try {
    const session = await getSession();
    if (!session || !session.username) {
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi Anda telah habis. Silakan login kembali.",
      };
    }

    const supabase = createSupabaseServerClient();
    const cleanChatId = chatId.trim();

    const { error } = await supabase.from("user_profiles").upsert(
      {
        username: session.username,
        full_name: session.fullName,
        telegram_chat_id: cleanChatId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" }
    );

    if (error) {
      console.error("[Supabase Error] updateTelegramChatIdAction:", error);
      return {
        success: false,
        error: "Gagal menyimpan Telegram Chat ID ke database.",
      };
    }

    return {
      success: true,
      data: { telegramChatId: cleanChatId },
      message: "Telegram Chat ID berhasil diperbarui.",
    };
  } catch (err: any) {
    console.error("Error in updateTelegramChatIdAction:", err);
    return {
      success: false,
      error: err.message || "Gagal memperbarui Telegram Chat ID.",
    };
  }
}

export async function getUserPreferencesAction(): Promise<ActionResponse<UserPreferences>> {
  try {
    const session = await getSession();
    if (!session || !session.username) {
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi Anda telah habis.",
        data: { hiddenCourses: [] },
      };
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("hidden_courses, telegram_chat_id, notified_courses, reminder_time, enable_daily_digest")
      .eq("username", session.username)
      .maybeSingle();

    if (error) {
      console.warn("[Supabase Warning] getUserPreferencesAction:", error);
      return {
        success: true,
        data: { hiddenCourses: [] },
      };
    }

    return {
      success: true,
      data: {
        hiddenCourses: Array.isArray(data?.hidden_courses) ? data.hidden_courses : [],
        telegramChatId: data?.telegram_chat_id || "",
        notifiedCourses: Array.isArray(data?.notified_courses) ? data.notified_courses : [],
        reminderTime: data?.reminder_time || "07:00 WIB",
        enableDailyDigest: data?.enable_daily_digest ?? true,
      },
    };
  } catch (err: any) {
    console.error("Error in getUserPreferencesAction:", err);
    return {
      success: true,
      data: { hiddenCourses: [] },
    };
  }
}

export async function updateTelegramPreferencesAction(params: {
  telegramChatId: string;
  notifiedCourses: string[];
  reminderTime: string;
  enableDailyDigest: boolean;
}): Promise<ActionResponse<UserPreferences>> {
  try {
    const session = await getSession();
    if (!session || !session.username) {
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi Anda telah habis. Silakan login kembali.",
      };
    }

    const supabase = createSupabaseServerClient();
    const cleanChatId = params.telegramChatId.trim();

    const { error } = await supabase.from("user_profiles").upsert(
      {
        username: session.username,
        full_name: session.fullName,
        telegram_chat_id: cleanChatId,
        notified_courses: params.notifiedCourses,
        reminder_time: params.reminderTime,
        enable_daily_digest: params.enableDailyDigest,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" }
    );

    if (error) {
      console.error("[Supabase Error] updateTelegramPreferencesAction:", error);
      return {
        success: false,
        error: "Gagal menyimpan pengaturan notifikasi Telegram ke database.",
      };
    }

    return {
      success: true,
      data: {
        hiddenCourses: [],
        telegramChatId: cleanChatId,
        notifiedCourses: params.notifiedCourses,
        reminderTime: params.reminderTime,
        enableDailyDigest: params.enableDailyDigest,
      },
      message: "Pengaturan notifikasi Telegram berhasil disimpan.",
    };
  } catch (err: any) {
    console.error("Error in updateTelegramPreferencesAction:", err);
    return {
      success: false,
      error: err.message || "Gagal memperbarui pengaturan notifikasi Telegram.",
    };
  }
}

export async function updateHiddenCoursesAction(
  hiddenCourses: string[]
): Promise<ActionResponse<string[]>> {
  try {
    const session = await getSession();
    if (!session || !session.username) {
      return {
        success: false,
        sessionExpired: true,
        error: "Sesi Anda telah habis.",
      };
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("user_profiles").upsert(
      {
        username: session.username,
        full_name: session.fullName,
        hidden_courses: hiddenCourses,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "username" }
    );

    if (error) {
      console.error("[Supabase Error] updateHiddenCoursesAction:", error);
      return {
        success: false,
        error: "Gagal menyimpan filter mata kuliah.",
      };
    }

    return {
      success: true,
      data: hiddenCourses,
      message: "Filter mata kuliah tersimpan ke Supabase.",
    };
  } catch (err: any) {
    console.error("Error in updateHiddenCoursesAction:", err);
    return {
      success: false,
      error: err.message || "Gagal memperbarui filter mata kuliah.",
    };
  }
}
