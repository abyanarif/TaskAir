import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function getTaskNumberEmoji(index: number): string {
  const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  return numberEmojis[index] || `${index + 1}.`;
}

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

    // Query active users with enable_daily_digest = true AND valid telegram_chat_id
    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("username, full_name, telegram_chat_id, notified_courses, reminder_time, enable_daily_digest")
      .eq("enable_daily_digest", true)
      .not("telegram_chat_id", "is", null);

    if (userError) {
      console.error("[Cron Daily Digest Error] Failed to fetch user profiles:", userError);
      return NextResponse.json({ error: "Failed to fetch user profiles." }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: "No active users with daily digest enabled found.",
        processedUsers: 0,
        sentNotifications: 0,
      });
    }

    const now = Date.now();
    let sentNotifications = 0;

    for (const user of users) {
      if (!user.telegram_chat_id || !user.telegram_chat_id.trim()) continue;

      // Fetch user's pending assignments from cached_assignments
      const { data: assignments, error: assignError } = await supabase
        .from("cached_assignments")
        .select("*")
        .eq("username", user.username)
        .eq("status", "pending");

      if (assignError || !assignments) continue;

      // Filter logic: Only include assignments belonging to courses listed in notified_courses
      // (or all courses if notified_courses is empty/null/default)
      const notifiedCourses: string[] = Array.isArray(user.notified_courses) ? user.notified_courses : [];

      const filteredAssignments = assignments.filter((task) => {
        if (!notifiedCourses || notifiedCourses.length === 0) {
          return true; // No filter specified, include all
        }
        return task.course_name && notifiedCourses.includes(task.course_name);
      });

      // Sort filtered assignments by timestamp / due date
      filteredAssignments.sort((a, b) => {
        const timeA = a.timestamp || (a.due_date ? new Date(a.due_date).getTime() : 0);
        const timeB = b.timestamp || (b.due_date ? new Date(b.due_date).getTime() : 0);
        return timeA - timeB;
      });

      const userName = user.full_name || "Mahasiswa";

      if (filteredAssignments.length === 0) {
        // Send lightweight message when 0 pending tasks match
        const emptyMessage = `🎉 Hore! Tidak ada tugas terpending untuk mata kuliah pilihanmu hari ini.`;
        const res = await sendTelegramMessage(user.telegram_chat_id, emptyMessage, "Markdown");
        if (res.ok) sentNotifications++;
      } else {
        // Construct formatted Telegram Daily Digest message
        const taskLines = filteredAssignments.map((task, idx) => {
          const numberEmoji = getTaskNumberEmoji(idx);
          const courseName = task.course_name || "Mata Kuliah";
          const title = task.title || "Tugas Perkuliahan";
          const taskDueTs = task.timestamp || (task.due_date ? new Date(task.due_date).getTime() : 0);
          const diffMs = taskDueTs ? taskDueTs - now : 0;
          const hoursLeft = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));

          const formattedDueDate = task.due_date || (taskDueTs ? new Date(taskDueTs).toLocaleString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }) : "TBA");

          const countdownText = diffMs > 0 ? ` (${hoursLeft} Jam lagi)` : "";

          return `${numberEmoji} *${courseName}*\n   📝 ${title}\n   ⏰ Deadline: ${formattedDueDate}${countdownText}`;
        });

        const digestMessage = `📑 *[AIRLANGGA TASKFLOW - LAPORAN TUGAS HARIAN]*

Halo ${userName}! Berikut daftar tugas terpending yang belum kamu selesaikan:

${taskLines.join("\n\n")}

📊 *Total Tugas Terpending:* ${filteredAssignments.length}
🚀 _Kerjakan sekarang di HEBAT:_ https://hebat.elearning.unair.ac.id/`;

        const res = await sendTelegramMessage(user.telegram_chat_id, digestMessage, "Markdown");
        if (res.ok) sentNotifications++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Daily Digest execution complete. Processed ${users.length} users and sent ${sentNotifications} messages.`,
      processedUsers: users.length,
      sentNotifications,
    });
  } catch (err: any) {
    console.error("[Cron Daily Digest Critical Error]:", err);
    return NextResponse.json({ error: err.message || "Daily Digest cron job failed." }, { status: 500 });
  }
}
