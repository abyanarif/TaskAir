"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserProfile, Assignment, EnrolledCourse } from "@/types";
import { getCurrentUserAction, logoutAction } from "@/app/actions/auth";
import { getAssignmentsAction } from "@/app/actions/assignments";
import { Navbar } from "@/components/Navbar";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import { MaterialsExplorer } from "@/components/MaterialsExplorer";
import { Loader2, ListTodo, BookOpen } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [activeView, setActiveView] = useState<"assignments" | "materials">("assignments");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [fetchMessage, setFetchMessage] = useState<string | undefined>(undefined);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(null);

  // Initialize Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const triggerAutoLogout = useCallback((msg?: string) => {
    logoutAction();
    setUser(null);
    setAssignments([]);
    setEnrolledCourses([]);
    setSessionExpiredMsg(
      msg || "Sesi HEBAT kamu telah habis. Silakan masukan NIM dan Password untuk memperbarui sesi."
    );
  }, []);

  // Load Assignments & Enrolled Courses helper
  const loadAssignments = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await getAssignmentsAction();
      if (res.sessionExpired) {
        triggerAutoLogout(res.error);
        return;
      }

      if (res.success && res.data) {
        setAssignments(res.data.assignments);
        setEnrolledCourses(res.data.enrolledCourses || []);
        setFetchMessage(res.message);
        setSessionExpiredMsg(null);
      } else {
        setFetchMessage(res.error || "Gagal memuat daftar tugas.");
      }
    } catch (err) {
      console.error("Error loading assignments:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [triggerAutoLogout]);

  // Check initial active session
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const res = await getCurrentUserAction();
        if (isMounted && res.success && res.data) {
          setUser(res.data);
          const assignRes = await getAssignmentsAction();
          if (assignRes.sessionExpired) {
            triggerAutoLogout(assignRes.error);
            return;
          }
          if (assignRes.success && assignRes.data) {
            setAssignments(assignRes.data.assignments);
            setEnrolledCourses(assignRes.data.enrolledCourses || []);
            setFetchMessage(assignRes.message);
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, [triggerAutoLogout]);

  const handleLoginSuccess = async (userProfile: UserProfile) => {
    setUser(userProfile);
    setSessionExpiredMsg(null);
    await loadAssignments();
  };

  const handleLogout = async () => {
    await logoutAction();
    setUser(null);
    setAssignments([]);
    setEnrolledCourses([]);
    setFetchMessage(undefined);
    setSessionExpiredMsg(null);
  };

  const handleToggleStatus = (id: string) => {
    setAssignments((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "completed" ? "pending" : "completed";
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Loader2 className="w-6 h-6 text-slate-950 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Memuat Airlangga TaskFlow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onLogout={handleLogout}
        onRefresh={loadAssignments}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {!user ? (
          <div className="py-6 sm:py-12">
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              sessionExpiredMessage={sessionExpiredMsg}
            />
          </div>
        ) : (
          <>
            {/* Top View Navigation Tabs */}
            <div className="flex items-stretch justify-stretch sm:justify-start border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <button
                onClick={() => setActiveView("assignments")}
                className={`flex-1 sm:flex-none min-h-[44px] px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center sm:justify-start space-x-2 ${
                  activeView === "assignments"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Tugas & Deadline</span>
              </button>

              <button
                onClick={() => setActiveView("materials")}
                className={`flex-1 sm:flex-none min-h-[44px] px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center sm:justify-start space-x-2 ${
                  activeView === "materials"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Materi & Modul</span>
              </button>
            </div>

            {/* View Switch */}
            {activeView === "assignments" ? (
              <Dashboard
                user={user}
                assignments={assignments}
                enrolledCourses={enrolledCourses.map((c) => c.name)}
                onToggleStatus={handleToggleStatus}
                onRefresh={loadAssignments}
                isRefreshing={isRefreshing}
                message={fetchMessage}
              />
            ) : (
              <MaterialsExplorer
                enrolledCourses={enrolledCourses}
                onLogout={triggerAutoLogout}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
