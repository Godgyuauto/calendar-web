import type { TelegramConfig, TelegramSendResult } from "@/modules/notifications/notification-types";

export function getTelegramConfigFromEnv(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
}

async function readSafeError(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 240);
  } catch {
    return "Telegram response body could not be read.";
  }
}

export async function sendTelegramMessage(
  config: TelegramConfig,
  text: string,
): Promise<TelegramSendResult> {
  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });

  if (response.ok) {
    return { ok: true, status: response.status };
  }

  const error = await readSafeError(response);
  return {
    ok: false,
    status: response.status,
    error: error.replace(config.botToken, "[redacted]"),
  };
}
