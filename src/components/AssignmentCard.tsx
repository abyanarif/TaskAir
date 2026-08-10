"use client";

import React from "react";
import { Assignment } from "@/types";
import {
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

interface AssignmentCardProps {
  assignment: Assignment;
  onToggleStatus: (id: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onToggleStatus,
}) => {
  const isCompleted = assignment.status === "completed";
  const now = Date.now();
  const hoursUntilDue = (assignment.timestamp - now) / (1000 * 60 * 60);
  const isDueSoon = !isCompleted && hoursUntilDue > 0 && hoursUntilDue <= 48;
  const isOverdue = !isCompleted && assignment.timestamp < now;

  return (
    <div
      className={`glass-card rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg relative overflow-hidden group flex flex-col justify-between ${
        isCompleted
          ? "opacity-75 border-slate-200 dark:border-slate-800/60"
          : isOverdue
          ? "border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10"
          : isDueSoon
          ? "border-amber-300 dark:border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Top Course Badge & Category */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 max-w-[80%] truncate">
            <BookOpen className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
            <span className="truncate">{assignment.courseName}</span>
          </span>

          {/* Status Badge */}
          {isCompleted ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3 h-3" />
              <span>Selesai</span>
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800/60">
              <AlertTriangle className="w-3 h-3" />
              <span>Terlewat</span>
            </span>
          ) : isDueSoon ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse">
              <Clock className="w-3 h-3" />
              <span>Segera Hadir</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
              <span>Pending</span>
            </span>
          )}
        </div>

        {/* Assignment Title */}
        <h3
          className={`font-semibold text-sm sm:text-base mb-2 leading-snug line-clamp-2 break-words ${
            isCompleted
              ? "line-through text-slate-500 dark:text-slate-400"
              : "text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors"
          }`}
        >
          {assignment.title}
        </h3>

        {/* Description if present */}
        {assignment.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
            {assignment.description.replace(/<[^>]*>?/gm, "")}
          </p>
        )}
      </div>

      {/* Due Date & Action Toolbar */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Due Date */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {assignment.dueDate}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Toggle Completion */}
          <button
            onClick={() => onToggleStatus(assignment.id)}
            className={`min-h-[44px] flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isCompleted
                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            }`}
          >
            {isCompleted ? (
              <>
                <Circle className="w-3.5 h-3.5" />
                <span>Batal</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </>
            )}
          </button>

          {/* External Link to HEBAT */}
          <a
            href={assignment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-yellow-400 border border-amber-300/50 dark:border-yellow-500/30 transition-colors"
          >
            <span>HEBAT</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
