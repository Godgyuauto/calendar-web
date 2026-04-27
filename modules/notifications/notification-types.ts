export type NotificationStatus = "pending" | "sent" | "failed";
export type NotificationChannel = "telegram";

export interface NotificationJobDraft {
  familyId: string;
  eventId?: string | null;
  channel?: NotificationChannel;
  title: string;
  body?: string;
  remindAt: string;
  dedupeKey: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export interface TelegramSendResult {
  ok: boolean;
  status: number;
  error?: string;
}
