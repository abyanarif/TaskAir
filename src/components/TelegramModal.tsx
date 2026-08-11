"use client";

import React from "react";
import { TelegramNotificationSettings } from "./TelegramNotificationSettings";
import {
  X,
  ExternalLink,
  Bot,
  Sparkles,
} from "lucide-react";

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrolledCourses?: string[];
}

export const TelegramModal: React.FC<TelegramModalProps> = ({
  isOpen,
  onClose,
  enrolledCourses = [],
}) => {
  if (!isOpen) return null;

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
                Pengaturan Telegram
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan bot dan atur pengingat harian otomatis
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
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
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

            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Buka Telegram & cari <span className="font-mono font-bold text-blue-600 dark:text-blue-400">@taskflowunair_bot</span>.
              </li>
              <li>
                Ketik <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">/start</code> di room chat bot.
              </li>
              <li>
                Dapatkan Chat ID Anda lalu simpan di form bawah ini.
              </li>
            </ol>
          </div>

          {/* Unified Telegram Settings Form */}
          <TelegramNotificationSettings
            enrolledCourses={enrolledCourses}
            onSaved={onClose}
          />
        </div>
      </div>
    </div>
  );
};
