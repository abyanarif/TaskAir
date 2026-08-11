import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify Vercel Cron authorization if CRON_SECRET is configured
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
    }
  }

  try {
    const supabase = createSupabaseServerClient();

    // 1. Fetch users who have linked their Telegram Chat ID
    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("username, full_name, telegram_chat_id")
      .not("telegram_chat_id", "is", null);

    if (userError) {
      console.error("[Cron Reminders Error] Failed to fetch user profiles:", userError);
      return NextResponse.json({ error: "Failed to fetch user profiles." }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: "No users with linked Telegram Chat ID found.",
        sentCount: 0,
      });
    }

    const now = Date.now();
    const h72Ms = 72 * 60 * 60 * 1000; // 72 hours in ms
    let sentNotifications = 0;

    for (const user of users) {
      if (!user.telegram_chat_id) continue;

      // 2. Fetch pending assignments for this user
      const { data: assignments, error: assignError } = await supabase
        .from("cached_assignments")
        .select("*")
        .eq("username", user.username)
        .eq("status", "pending");

      if (assignError || !assignments) continue;

      for (const task of assignments) {
        const taskDueTs = task.timestamp || (task.due_date ? new Date(task.due_date).getTime() : 0);
        if (!taskDueTs) continue;

        const diffMs = taskDueTs - now;

        // Target assignments due within the next 72 hours and not yet past due by more than 2 hours
        if (diffMs > 0 && diffMs <= h72Ms && !task.reminder_sent) {
          const hoursLeft = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
          const formattedDueDate = task.due_date || new Date(taskDueTs).toLocaleString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          const taskUrl = task.url || "https://hebat.elearning.unair.ac.id";

          const messageText = `🔔 *[AIRLANGGA TASKFLOW REMINDER]*

Halo ${user.full_name || "Mahasiswa"}! Ada tugas HEBAT yang mendekati deadline:

📌 *Mata Kuliah:* ${task.course_name || "Mata Kuliah"}
📝 *Tugas:* ${task.title || "Tugas Perkuliahan"}
⏰ *Deadline:* ${formattedDueDate}
⏳ *Sisa Waktu:* ~${hoursLeft} Jam lagi

🚀 _Buka HEBAT untuk mengumpulkan tugas:_
${taskUrl}`;

          const telegramRes = await sendTelegramMessage(user.telegram_chat_id, messageText, "Markdown");

          if (telegramRes.ok) {
            sentNotifications++;
            // Update reminder_sent flag in Supabase
            await supabase
              .from("cached_assignments")
              .update({ reminder_sent: true, updated_at: new Date().toISOString() })
              .match({ id: task.id, username: user.username });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed reminder scan successfully. Sent ${sentNotifications} Telegram notifications.`,
      sentNotifications,
    });
  } catch (err: any) {
    console.error("[Cron Reminders Critical Error]:", err);
    return NextResponse.json({ error: err.message || "Cron job failed." }, { status: 500 });
  }
}
