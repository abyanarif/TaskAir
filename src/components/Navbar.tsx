"use client";

import React from "react";
import { UserProfile } from "@/types";
import { sanitizeText } from "@/lib/moodle";
import { LogOut, Sun, Moon, GraduationCap, RefreshCw } from "lucide-react";

interface NavbarProps {
  user: UserProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onRefresh,
  isRefreshing,
}) => {
  const rawName = user?.fullName ? sanitizeText(user.fullName) : "";
  const displayName = rawName && rawName !== "&nbsp;" ? rawName : "Mahasiswa";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-bold flex-shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-amber-600 to-slate-800 dark:from-white dark:via-yellow-400 dark:to-slate-200 bg-clip-text text-transparent truncate">
                TaskFlow
              </span>
              <span className="hidden sm:inline text-sm font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-amber-600 to-slate-800 dark:from-white dark:via-yellow-400 dark:to-slate-200 bg-clip-text text-transparent">
                Airlangga
              </span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-yellow-400 border border-amber-300 dark:border-amber-500/30 flex-shrink-0">
                HEBAT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              Universitas Airlangga Assignment Tracker
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {user && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Tugas"
              className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin text-amber-500" : ""}`}
              />
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
            className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* User Profile & Logout */}
          {user ? (
            <div className="flex items-center space-x-1.5 sm:space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
                  {displayName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {user.username}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center space-x-1.5 px-2 sm:px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
