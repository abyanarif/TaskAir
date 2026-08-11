"use client";

import React, { useState, useEffect } from "react";
import {
  updateTelegramChatIdAction,
  sendTestTelegramNotificationAction,
  getUserPreferencesAction,
} from "@/app/actions/user";
import {
  Send,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bell,
  ExternalLink,
  Bot,
  HelpCircle,
  Sparkles,
} from "lucide-react";

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  const [chatId, setChatId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadPref() {
      setIsLoading(true);
      setMessage(null);
      try {
        const res = await getUserPreferencesAction();
        if (isMounted && res.success && res.data?.telegramChatId) {
          setChatId(res.data.telegramChatId);
        }
      } catch (err) {
        console.error("Failed to load telegram preference:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPref();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestNotification = async () => {
    if (!chatId.trim()) {
      setMessage({ type: "error", text: "Silakan masukkan Telegram Chat ID Anda terlebih dahulu." });
      return;
    }

    setIsTesting(true);
    setMessage(null);

    try {
      const res = await sendTestTelegramNotificationAction(chatId.trim());
      if (res.success) {
        setMessage({
          type: "success",
          text: res.message || "Test notifikasi berhasil terkirim ke Telegram Anda! Chat ID tersimpan.",
        });
      } else {
        setMessage({ type: "error", text: res.error || "Gagal mengirim test notifikasi." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat menguji notifikasi." });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId.trim()) {
      setMessage({ type: "error", text: "Chat ID tidak boleh kosong." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await updateTelegramChatIdAction(chatId.trim());
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Telegram Chat ID berhasil disimpan!" });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: "error", text: res.error || "Gagal menyimpan Telegram Chat ID." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Hubungkan Bot Telegram
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengingat deadline tugas otomatis langsung ke Telegram Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Step-by-Step Guide Card */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Langkah Hubungkan Bot</span>
              </span>

              <a
                href="https://t.me/taskflowunair_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>Buka Bot Telegram</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Buka Telegram dan cari <span className="font-mono font-bold text-blue-600 dark:text-blue-400">@taskflowunair_bot</span> (atau klik tombol di atas).
              </li>
              <li>
                Tekan tombol <span className="font-semibold">Start</span> atau ketik <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">/start</code> di room chat bot.
              </li>
              <li>
                Dapatkan Chat ID Anda dari bot atau bot <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">@userinfobot</code>.
              </li>
              <li>
                Masukkan Chat ID Anda di bawah ini dan tekan <span className="font-semibold">Kirim Test Notifikasi</span>.
              </li>
            </ol>
          </div>

          {/* Feedback Message Banner */}
          {message && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start space-x-2.5 text-xs font-semibold ${
                message.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Telegram Chat ID Anda
              </label>
              <div className="relative">
                <Bell className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Contoh: 123456789"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleTestNotification}
                disabled={isTesting || !chatId.trim()}
                className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-yellow-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Kirim Test Notifikasi</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !chatId.trim()}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Simpan Chat ID</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
