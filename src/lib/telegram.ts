/**
 * Telegram Bot API Utility Helper
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export interface SendMessageResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

/**
 * Send a message to a Telegram chat using Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode: "Markdown" | "HTML" = "Markdown"
): Promise<SendMessageResponse> {
  if (!BOT_TOKEN) {
    console.error("[Telegram Helper Error] TELEGRAM_BOT_TOKEN is not set in environment variables.");
    return {
      ok: false,
      description: "TELEGRAM_BOT_TOKEN is not configured on the server.",
    };
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
      cache: "no-store",
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn(`[Telegram API Error] Failed to send message to chatId ${chatId}:`, data.description);
    }
    return data;
  } catch (err: any) {
    console.error(`[Telegram Network Error] Error sending message to ${chatId}:`, err);
    return {
      ok: false,
      description: err.message || "Failed to reach Telegram API.",
    };
  }
}
