"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Assignment, UserProfile } from "@/types";
import { sanitizeText } from "@/lib/moodle";
import { AssignmentCard } from "./AssignmentCard";
import { CourseFilterModal } from "./CourseFilterModal";
import { TelegramModal } from "./TelegramModal";
import { getUserPreferencesAction, updateHiddenCoursesAction } from "@/app/actions/user";
import {
  BookCheck,
  Clock,
  CheckCircle2,
  ListTodo,
  Search,
  AlertCircle,
  Sparkles,
  Inbox,
  Filter,
  BookOpen,
  Send,
} from "lucide-react";

interface DashboardProps {
  user: UserProfile;
  assignments: Assignment[];
  enrolledCourses?: string[];
  onToggleStatus: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  message?: string;
}

type TabFilter = "pending" | "completed" | "all";

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  assignments,
  enrolledCourses = [],
  onToggleStatus,
  onRefresh,
  isRefreshing,
  message,
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Load saved course filter selection from localStorage and sync with Supabase
  useEffect(() => {
    let isMounted = true;
    try {
      const saved = localStorage.getItem("selected_courses");
      if (saved) {
        setSelectedCourses(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load selected_courses from localStorage:", e);
    }

    async function loadSupabasePrefs() {
      try {
        const res = await getUserPreferencesAction();
        if (isMounted && res.success && res.data?.hiddenCourses) {
          if (res.data.hiddenCourses.length > 0) {
            setSelectedCourses(res.data.hiddenCourses);
            localStorage.setItem("selected_courses", JSON.stringify(res.data.hiddenCourses));
          }
        }
      } catch (err) {
        console.error("Failed to load Supabase user preferences:", err);
      }
    }

    loadSupabasePrefs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save selected courses to localStorage and Supabase
  const handleSelectCourses = (courses: string[]) => {
    setSelectedCourses(courses);
    try {
      localStorage.setItem("selected_courses", JSON.stringify(courses));
    } catch (e) {
      console.error("Failed to save selected_courses to localStorage:", e);
    }

    // Sync directly to Supabase hidden_courses column
    updateHiddenCoursesAction(courses).catch((err) => {
      console.warn("[Supabase Sync Error] Failed to sync hidden courses:", err);
    });
  };

  // Combine Enrolled Courses from Moodle API with Courses from active Assignments
  const availableCourses = useMemo(() => {
    const countsMap = new Map<string, number>();

    // 1. Initialize enrolled courses with 0 tasks
    if (enrolledCourses && enrolledCourses.length > 0) {
      enrolledCourses.forEach((courseName) => {
        if (courseName) {
          countsMap.set(courseName, 0);
        }
      });
    }

    // 2. Add or increment task counts from assignments
    assignments.forEach((a) => {
      if (a.courseName) {
        countsMap.set(a.courseName, (countsMap.get(a.courseName) || 0) + 1);
      }
    });

    return Array.from(countsMap.entries()).map(([name, count]) => ({ name, count }));
  }, [assignments, enrolledCourses]);

  // Sanitize user greeting
  const rawGreeting = user?.fullName ? sanitizeText(user.fullName) : "";
  const displayName = rawGreeting && rawGreeting !== "&nbsp;" ? rawGreeting : "Mahasiswa";

  // Stats Calculations
  const now = Date.now();
  const stats = useMemo(() => {
    const total = assignments.length;
    const pending = assignments.filter((a) => a.status === "pending").length;
    const completed = assignments.filter((a) => a.status === "completed").length;
    const dueSoon = assignments.filter((a) => {
      if (a.status === "completed") return false;
      const hours = (a.timestamp - now) / (1000 * 60 * 60);
      return hours > 0 && hours <= 48;
    }).length;

    return { total, pending, completed, dueSoon };
  }, [assignments, now]);

  // Filtering logic incorporating Search, Status Tab, and Course Selection
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((item) => {
        const matchesSearch =
          !searchQuery.trim() ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = activeTab === "all" ? true : item.status === activeTab;

        const matchesCourse =
          selectedCourses.length === 0 ||
          (selectedCourses.includes("__NONE__")
            ? false
            : selectedCourses.includes(item.courseName));

        return matchesSearch && matchesStatus && matchesCourse;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [assignments, activeTab, searchQuery, selectedCourses]);

  const activeCourseCount =
    selectedCourses.length === 0 || selectedCourses.includes("__NONE__")
      ? selectedCourses.includes("__NONE__")
        ? 0
        : availableCourses.length
      : selectedCourses.length;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 text-white relative overflow-hidden border border-amber-500/20 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-yellow-400 border border-amber-500/30 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HEBAT Elearning Sync Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat datang, {displayName}!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Pantau seluruh tugas, kuis, dan deadline perkuliahan Universitas Airlangga dalam satu tempat yang bersih dan cepat.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center space-x-2"
            >
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filter Matkul</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-yellow-300 font-bold border border-amber-500/30">
                {activeCourseCount}/{availableCourses.length}
              </span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 flex-shrink-0"
            >
              <span>{isRefreshing ? "Memperbarui Data..." : "Perbarui Tugas"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start space-x-3 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
          <div>{message}</div>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <ListTodo className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tugas
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-yellow-400 flex items-center justify-center flex-shrink-0">
            <BookCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Belum Selesai
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.pending}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Segera (&lt;48j)
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.dueSoon}
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sudah Selesai
            </p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {stats.completed}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Tab Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tab Buttons */}
          <div className="flex items-center p-1.5 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs sm:text-sm font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab("pending")}
              className={`min-h-[40px] px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === "pending"
                  ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-yellow-400 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Belum Selesai</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-yellow-300">
                {stats.pending}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`min-h-[40px] px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === "completed"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Sudah Selesai</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                {stats.completed}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={`min-h-[40px] px-3 sm:px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Semua</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {stats.total}
              </span>
            </button>
          </div>

          {/* Search Bar & Filter Trigger */}
          <div className="flex items-center space-x-2 w-full sm:flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama mata kuliah atau judul tugas..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>

            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors space-x-1.5 text-xs font-semibold"
              title="Atur Filter Mata Kuliah"
            >
              <Filter className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Matkul</span>
            </button>

            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors space-x-1.5 text-xs font-semibold"
              title="Pengaturan Telegram Reminder"
            >
              <Send className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Telegram</span>
            </button>
          </div>
        </div>

        {/* Dynamic Course Pill Filter Bar */}
        {availableCourses.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1 flex-shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Matkul:</span>
            </span>

            <button
              onClick={() => handleSelectCourses([])}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                selectedCourses.length === 0
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              Semua ({availableCourses.length})
            </button>

            {availableCourses.map((c) => {
              const isSelected =
                selectedCourses.length === 0 || selectedCourses.includes(c.name);

              return (
                <button
                  key={c.name}
                  onClick={() => {
                    if (selectedCourses.length === 0) {
                      handleSelectCourses(
                        availableCourses
                          .map((item) => item.name)
                          .filter((n) => n !== c.name)
                      );
                    } else if (selectedCourses.includes(c.name)) {
                      const next = selectedCourses.filter((n) => n !== c.name);
                      handleSelectCourses(next.length === availableCourses.length ? [] : next);
                    } else {
                      const next = [...selectedCourses, c.name];
                      handleSelectCourses(next.length === availableCourses.length ? [] : next);
                    }
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 flex-shrink-0 border ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-yellow-300"
                      : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="max-w-[140px] truncate">{c.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      c.count > 0
                        ? "bg-amber-500/20 text-yellow-300 font-bold"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {c.count > 0 ? `${c.count} tugas` : "0 tugas"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Grid */}
      {filteredAssignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Tidak ada tugas ditemukan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            {searchQuery
              ? `Pencarian "${searchQuery}" tidak cocok dengan tugas apapun.`
              : selectedCourses.length > 0
              ? "Tidak ada tugas pada mata kuliah yang dipilih saat ini."
              : activeTab === "pending"
              ? "Hebat! Semua tugas Anda pada kategori ini sudah diselesaikan."
              : "Belum ada tugas yang ditandai selesai."}
          </p>
        </div>
      )}

      {/* Course Filter Manager Modal */}
      <CourseFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        availableCourses={availableCourses}
        selectedCourses={selectedCourses}
        onSelectCourses={handleSelectCourses}
      />

      {/* Telegram Reminder Settings Modal */}
      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </div>
  );
};
