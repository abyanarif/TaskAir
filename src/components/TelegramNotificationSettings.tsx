"use client";

import React, { useState, useEffect } from "react";
import {
  getUserPreferencesAction,
  updateTelegramPreferencesAction,
  sendTestTelegramNotificationAction,
} from "@/app/actions/user";
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  BookOpen,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";

interface TelegramNotificationSettingsProps {
  enrolledCourses?: string[];
  onSaved?: () => void;
}

const TIME_OPTIONS = [
  "07:00 WIB",
  "12:00 WIB",
  "19:00 WIB",
  "21:00 WIB",
];

export const TelegramNotificationSettings: React.FC<TelegramNotificationSettingsProps> = ({
  enrolledCourses = [],
  onSaved,
}) => {
  const [chatId, setChatId] = useState("");
  const [enableDailyDigest, setEnableDailyDigest] = useState(true);
  const [reminderTime, setReminderTime] = useState("07:00 WIB");
  const [notifiedCourses, setNotifiedCourses] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPreferences() {
      setIsLoading(true);
      setMessage(null);
      try {
        const res = await getUserPreferencesAction();
        if (isMounted && res.success && res.data) {
          if (res.data.telegramChatId) setChatId(res.data.telegramChatId);
          if (res.data.enableDailyDigest !== undefined) setEnableDailyDigest(res.data.enableDailyDigest);
          if (res.data.reminderTime) setReminderTime(res.data.reminderTime);

          if (Array.isArray(res.data.notifiedCourses) && res.data.notifiedCourses.length > 0) {
            setNotifiedCourses(res.data.notifiedCourses);
          } else {
            // Default to all enrolled courses checked if not configured yet
            setNotifiedCourses(enrolledCourses);
          }
        }
      } catch (err) {
        console.error("Failed to load user notification preferences:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPreferences();
    return () => {
      isMounted = false;
    };
  }, [enrolledCourses]);

  const handleToggleCourse = (courseName: string) => {
    setNotifiedCourses((prev) => {
      if (prev.includes(courseName)) {
        return prev.filter((c) => c !== courseName);
      } else {
        return [...prev, courseName];
      }
    });
  };

  const handleSelectAll = () => {
    setNotifiedCourses([...enrolledCourses]);
  };

  const handleDeselectAll = () => {
    setNotifiedCourses([]);
  };

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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId.trim()) {
      setMessage({ type: "error", text: "Telegram Chat ID tidak boleh kosong." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await updateTelegramPreferencesAction({
        telegramChatId: chatId.trim(),
        notifiedCourses,
        reminderTime,
        enableDailyDigest,
      });

      if (res.success) {
        setMessage({ type: "success", text: res.message || "Pengaturan notifikasi berhasil disimpan!" });
        if (onSaved) {
          setTimeout(() => {
            onSaved();
          }, 1200);
        }
      } else {
        setMessage({ type: "error", text: res.error || "Gagal menyimpan pengaturan." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat menyimpan pengaturan." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Memuat preferensi notifikasi Telegram...
        </p>
      </div>
    );
  }

  const allSelected = enrolledCourses.length > 0 && notifiedCourses.length === enrolledCourses.length;

  return (
    <form onSubmit={handleSaveSettings} className="space-y-4">
      {/* Feedback Alert */}
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

      {/* 1. Telegram Chat ID Section */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <span>Telegram Chat ID</span>
          </label>
          <button
            type="button"
            onClick={handleTestNotification}
            disabled={isTesting || !chatId.trim()}
            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-yellow-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Test Notifikasi</span>
          </button>
        </div>

        <input
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Contoh: 123456789"
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        />
      </div>

      {/* 2. Master Toggle Switch: Pengingat Harian Otomatis */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
        <div className="space-y-0.5 pr-4">
          <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2 cursor-pointer" onClick={() => setEnableDailyDigest(!enableDailyDigest)}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Pengingat Harian Otomatis</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Kirim rangkuman tugas terpending setiap hari via bot Telegram
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEnableDailyDigest(!enableDailyDigest)}
          className="text-2xl text-blue-500 hover:text-blue-600 transition-colors focus:outline-none"
          title={enableDailyDigest ? "Nonaktifkan Pengingat Harian" : "Aktifkan Pengingat Harian"}
        >
          {enableDailyDigest ? (
            <ToggleRight className="w-9 h-9 text-blue-500" />
          ) : (
            <ToggleLeft className="w-9 h-9 text-slate-400 dark:text-slate-600" />
          )}
        </button>
      </div>

      {/* 3. Daily Digest Time Picker */}
      <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 transition-opacity ${!enableDailyDigest ? "opacity-50 pointer-events-none" : ""}`}>
        <label className="block text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>Waktu Pengiriman Digest Harian</span>
        </label>

        <select
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          disabled={!enableDailyDigest}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TIME_OPTIONS.map((timeOption) => (
            <option key={timeOption} value={timeOption}>
              {timeOption}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Jadwal Vercel Cron default berjalan pukul 07:00 WIB (00:00 UTC).
        </p>
      </div>

      {/* 4. Mata Kuliah Notifikasi Telegram Checklist */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Mata Kuliah Notifikasi Telegram</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih mata kuliah yang akan disertakan dalam pengingat Telegram
            </p>
          </div>

          {enrolledCourses.length > 0 && (
            <button
              type="button"
              onClick={allSelected ? handleDeselectAll : handleSelectAll}
              className="text-[11px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 whitespace-nowrap"
            >
              {allSelected ? "Hapus Semua" : "Pilih Semua"}
            </button>
          )}
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
            Tidak ada daftar mata kuliah Moodle ditemukan.
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
            {enrolledCourses.map((courseName) => {
              const isChecked = notifiedCourses.includes(courseName);
              return (
                <div
                  key={courseName}
                  onClick={() => handleToggleCourse(courseName)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white font-medium"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-75 hover:opacity-100"
                  }`}
                >
                  <span className="truncate pr-2">{courseName}</span>
                  <div className="flex-shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSaving || !chatId.trim()}
          className="w-full py-3 px-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>Simpan Pengaturan Telegram</span>
        </button>
      </div>
    </form>
  );
};
