"use client";

import React, { useState } from "react";
import { Filter, X, Check, Search, CheckSquare, Square } from "lucide-react";

interface CourseFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCourses: { name: string; count: number }[];
  selectedCourses: string[];
  onSelectCourses: (courses: string[]) => void;
}

export const CourseFilterModal: React.FC<CourseFilterModalProps> = ({
  isOpen,
  onClose,
  availableCourses,
  selectedCourses,
  onSelectCourses,
}) => {
  const [modalSearch, setModalSearch] = useState("");

  if (!isOpen) return null;

  const isNoneSelected = selectedCourses.includes("__NONE__");
  const isDefaultAll = selectedCourses.length === 0;

  const isChecked = (courseName: string) => {
    if (isDefaultAll) return true;
    if (isNoneSelected) return false;
    return selectedCourses.includes(courseName);
  };

  const filteredCourses = availableCourses.filter((c) =>
    c.name.toLowerCase().includes(modalSearch.toLowerCase())
  );

  const handleToggleCourse = (courseName: string) => {
    const allCourseNames = availableCourses.map((c) => c.name);

    if (isDefaultAll) {
      // Uncheck one course from default all
      const next = allCourseNames.filter((name) => name !== courseName);
      onSelectCourses(next.length === 0 ? ["__NONE__"] : next);
      return;
    }

    if (isNoneSelected) {
      // Check first course from none selected state
      onSelectCourses([courseName]);
      return;
    }

    if (selectedCourses.includes(courseName)) {
      // Uncheck course
      const next = selectedCourses.filter((name) => name !== courseName);
      onSelectCourses(next.length === 0 ? ["__NONE__"] : next);
    } else {
      // Check course
      const next = [...selectedCourses, courseName];
      if (next.length === availableCourses.length) {
        onSelectCourses([]); // Reset to default all
      } else {
        onSelectCourses(next);
      }
    }
  };

  const handleSelectAll = () => {
    onSelectCourses([]);
  };

  const handleDeselectAll = () => {
    onSelectCourses(["__NONE__"]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Filter Mata Kuliah
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih mata kuliah yang ingin ditampilkan di dashboard
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

        {/* Search & Bulk Actions */}
        <div className="py-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              placeholder="Cari mata kuliah..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-1 font-semibold text-amber-600 dark:text-yellow-400 hover:underline"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Pilih Semua Mata Kuliah</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="flex items-center space-x-1 font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Sembunyikan Semua</span>
            </button>
          </div>
        </div>

        {/* Course Checkboxes List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((c) => {
              const active = isChecked(c.name);

              return (
                <button
                  type="button"
                  key={c.name}
                  onClick={() => handleToggleCourse(c.name)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                    active
                      ? "bg-amber-500/10 border-amber-500/40 text-slate-900 dark:text-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center space-x-3 max-w-[75%]">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors border flex-shrink-0 ${
                        active
                          ? "bg-amber-500 border-amber-500 text-slate-950"
                          : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-amber-400"
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold truncate">
                      {c.name}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                      c.count > 0
                        ? "bg-amber-500/20 text-yellow-400 border border-amber-500/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {c.count > 0 ? `${c.count} tugas` : "0 tugas"}
                  </span>
                </button>
              );
            })
          ) : (
            <p className="text-center text-xs text-slate-400 py-6">
              Mata kuliah tidak ditemukan.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
};
