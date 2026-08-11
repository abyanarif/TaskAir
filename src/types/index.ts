export interface MoodleSessionData {
  username: string;
  fullName: string;
  moodleSession: string;
  sesskey?: string;
  loggedInAt: number;
}

export interface Assignment {
  id: string;
  title: string;
  courseName: string;
  dueDate: string;
  timestamp: number;
  url: string;
  status: "pending" | "completed";
  category?: string;
  description?: string;
  isOverdue?: boolean;
}

export interface EnrolledCourse {
  id: number;
  name: string;
  shortname?: string;
}

export interface CourseResource {
  id: string;
  name: string;
  modname: string;
  url: string;
  fileurl?: string;
  isExternal?: boolean;
  fileName?: string;
  fileExtension?: string;
  fileSize?: number;
}

export interface CourseSection {
  id: string;
  name: string;
  summary?: string;
  modules: CourseResource[];
}

export interface AssignmentsData {
  assignments: Assignment[];
  enrolledCourses: EnrolledCourse[];
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  sessionExpired?: boolean;
}

export interface UserProfile {
  username: string;
  fullName: string;
  loggedInAt: number;
}

export interface UserPreferences {
  hiddenCourses: string[];
  telegramChatId?: string;
  notifiedCourses?: string[];
  reminderTime?: string;
  enableDailyDigest?: boolean;
}
