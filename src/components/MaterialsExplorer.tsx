"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { EnrolledCourse, CourseSection, CourseResource } from "@/types";
import { getCourseContentsAction, getEnrolledCoursesAction } from "@/app/actions/materials";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  File,
  Folder,
  Globe,
  Video,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Search,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Filter,
  Link as LinkIcon,
} from "lucide-react";

interface MaterialsExplorerProps {
  enrolledCourses: EnrolledCourse[];
  onLogout?: () => void;
}

type MaterialTypeFilter = "all" | "file" | "link";

export const MaterialsExplorer: React.FC<MaterialsExplorerProps> = ({
  enrolledCourses: initialEnrolledCourses,
  onLogout,
}) => {
  const [courses, setCourses] = useState<EnrolledCourse[]>(initialEnrolledCourses);
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(
    initialEnrolledCourses.length > 0 ? initialEnrolledCourses[0] : null
  );
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialType, setMaterialType] = useState<MaterialTypeFilter>("all");
  const [error, setError] = useState<string | null>(null);
  // Mobile: tracks which panel is visible ("list" = course list, "content" = course content)
  const [mobilePanel, setMobilePanel] = useState<"list" | "content">("list");

  // Auto-fetch enrolled courses on component mount or refresh
  const fetchCourses = useCallback(async () => {
    setIsCoursesLoading(true);
    setError(null);
    try {
      const res = await getEnrolledCoursesAction();
      if (res.success && res.data) {
        setCourses(res.data);
        if (res.data.length > 0 && !selectedCourse) {
          setSelectedCourse(res.data[0]);
        }
      } else {
        if (res.error?.includes("Sesi telah berakhir") && onLogout) {
          onLogout();
          return;
        }
        setError(res.error || "Gagal mengambil daftar mata kuliah.");
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat mata kuliah.");
    } finally {
      setIsCoursesLoading(false);
    }
  }, [onLogout, selectedCourse]);

  // Initial mount auto-fetch if initial array is empty
  useEffect(() => {
    if (initialEnrolledCourses.length === 0) {
      fetchCourses();
    } else {
      setCourses(initialEnrolledCourses);
      if (!selectedCourse) {
        setSelectedCourse(initialEnrolledCourses[0]);
      }
    }
  }, [initialEnrolledCourses, fetchCourses, selectedCourse]);

  // Load course sections when selected course changes
  useEffect(() => {
    if (!selectedCourse) return;

    let isMounted = true;
    async function loadContents() {
      setIsSectionsLoading(true);
      setError(null);
      try {
        const courseIdNum = Number(selectedCourse!.id);
        const res = await getCourseContentsAction(courseIdNum);
        if (isMounted) {
          if (res.success && res.data) {
            setSections(res.data);
            const initialExpanded: Record<string, boolean> = {};
            let expandedCount = 0;
            res.data.forEach((sec) => {
              if (sec.modules && sec.modules.length > 0) {
                initialExpanded[sec.id] = true;
                expandedCount++;
              }
            });
            // If no section has modules, expand all sections as fallback
            if (expandedCount === 0) {
              res.data.slice(0, 5).forEach((sec) => {
                initialExpanded[sec.id] = true;
              });
            }
            setExpandedSections(initialExpanded);
          } else {
            if (res.error?.includes("Sesi telah berakhir") && onLogout) {
              onLogout();
              return;
            }
            setError(res.error || "Gagal mengambil materi mata kuliah.");
            setSections([]);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Terjadi kesalahan saat memuat materi.");
          setSections([]);
        }
      } finally {
        if (isMounted) setIsSectionsLoading(false);
      }
    }

    loadContents();
    return () => {
      isMounted = false;
    };
  }, [selectedCourse, onLogout]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getResourceIcon = (modname: string, name: string, fileExtension?: string) => {
    const lowerName = name.toLowerCase();
    const ext = (fileExtension || "").toLowerCase();

    if (modname === "url" || lowerName.includes("youtube") || lowerName.includes("zoom")) {
      return <Video className="w-4 h-4 text-rose-500 flex-shrink-0" />;
    }
    if (ext === "pdf" || lowerName.endsWith(".pdf") || modname === "pdf") {
      return <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />;
    }
    if (
      ext === "xlsx" ||
      ext === "xls" ||
      ext === "csv" ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls") ||
      lowerName.endsWith(".csv")
    ) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
    }
    if (ext === "pptx" || ext === "ppt" || lowerName.endsWith(".pptx") || lowerName.endsWith(".ppt")) {
      return <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    }
    if (ext === "docx" || ext === "doc" || lowerName.endsWith(".docx") || lowerName.endsWith(".doc")) {
      return <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
    if (
      ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext) ||
      /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(lowerName)
    ) {
      return <ImageIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />;
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext) || lowerName.endsWith(".zip") || lowerName.endsWith(".rar")) {
      return <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />;
    }
    if (modname === "forum" || modname === "page") {
      return <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
    if (modname === "assign") {
      return <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />;
    }
    return <File className="w-4 h-4 text-amber-400 flex-shrink-0" />;
  };

  const isModuleLink = (mod: CourseResource) => {
    const lowerName = mod.name.toLowerCase();
    return (
      mod.modname === "url" ||
      mod.isExternal ||
      lowerName.includes("youtube") ||
      lowerName.includes("zoom") ||
      lowerName.includes("http")
    );
  };

  // Filter sections and modules based on search query and type filter
  const filteredSections = useMemo(() => {
    return sections
      .map((sec) => {
        const filteredModules = sec.modules.filter((mod) => {
          const matchesQuery =
            !materialSearch.trim() ||
            mod.name.toLowerCase().includes(materialSearch.toLowerCase());

          let matchesType = true;
          if (materialType === "file") {
            matchesType = !isModuleLink(mod);
          } else if (materialType === "link") {
            matchesType = isModuleLink(mod);
          }

          return matchesQuery && matchesType;
        });

        return {
          ...sec,
          modules: filteredModules,
        };
      })
      .filter((sec) => sec.modules.length > 0 || !materialSearch.trim());
  }, [sections, materialSearch, materialType]);

  const totalFilteredModules = useMemo(() => {
    return filteredSections.reduce((sum, sec) => sum + sec.modules.length, 0);
  }, [filteredSections]);

  const filteredCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12">
      {/* Left Sidebar: Course Selection List — hidden on mobile when content panel is active */}
      <div className={`lg:col-span-4 space-y-4 ${mobilePanel === "content" ? "hidden lg:block" : "block"}`}>
        <div className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Daftar Mata Kuliah
              </h2>
            </div>
            <button
              onClick={fetchCourses}
              disabled={isCoursesLoading}
              title="Refresh Daftar Matkul"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCoursesLoading ? "animate-spin text-amber-500" : ""}`} />
            </button>
          </div>

          {/* Search Course Filter */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata kuliah..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Course Items Stack or Loading Skeleton */}
          {isCoursesLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Memuat mata kuliah...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((c) => {
                  const isSelected = selectedCourse?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCourse(c);
                        setMobilePanel("content");
                      }}
                      className={`w-full min-h-[48px] text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-yellow-300 font-semibold shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-xs sm:text-sm line-clamp-2 pr-2">
                        {c.name}
                      </span>
                      <ChevronRight
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isSelected
                            ? "text-amber-500 translate-x-1"
                            : "text-slate-400 group-hover:translate-x-0.5"
                        }`}
                      />
                    </button>
                  );
                })
              ) : (
                /* Empty Courses Banner with Refresh Button */
                <div className="py-8 text-center space-y-3">
                  <p className="text-xs text-slate-400">
                    Tidak ada mata kuliah terdeteksi.
                  </p>
                  <button
                    onClick={fetchCourses}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-yellow-400 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/20 transition-all inline-flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Data</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Main Content — hidden on mobile when course list panel is active */}
      <div className={`lg:col-span-8 space-y-5 ${mobilePanel === "list" ? "hidden lg:block" : "block"}`}>
        {selectedCourse ? (
          <>
            {/* Mobile Back Button */}
            <button
              onClick={() => setMobilePanel("list")}
              className="lg:hidden flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors mb-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Matkul</span>
            </button>
            {/* Header Banner for Active Course */}
            <div className="glass-card rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 text-white border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-yellow-400 border border-amber-500/30 text-xs font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modul Perkuliahan HEBAT</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  {selectedCourse.name}
                </h1>
                {selectedCourse.shortname && (
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    Kode: {selectedCourse.shortname}
                  </p>
                )}
              </div>

              <a
                href={`https://hebat.elearning.unair.ac.id/course/view.php?id=${selectedCourse.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 flex-shrink-0"
              >
                <span>Buka di HEBAT</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start space-x-3 text-red-700 dark:text-red-300 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {/* Material Search & Type Filter Controls */}
            {sections.length > 0 && !isSectionsLoading && (
              <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      placeholder="Cari nama materi atau modul..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                  </div>

                  {/* Type Filter Pills */}
                  <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <button
                      onClick={() => setMaterialType("all")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                        materialType === "all"
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>Semua</span>
                    </button>

                    <button
                      onClick={() => setMaterialType("file")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                        materialType === "file"
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Dokumen / File</span>
                    </button>

                    <button
                      onClick={() => setMaterialType("link")}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                        materialType === "link"
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Link & Video</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            {isSectionsLoading ? (
              <div className="glass-card rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Mengambil materi & modul perkuliahan dari HEBAT...
                </p>
              </div>
            ) : sections.length > 0 ? (
              totalFilteredModules > 0 ? (
                /* Accordion Section List */
                <div className="space-y-4">
                  {filteredSections.map((sec) => {
                    const isExpanded = !!expandedSections[sec.id];
                    const hasModules = sec.modules && sec.modules.length > 0;

                    if (!hasModules && (materialSearch.trim() || materialType !== "all")) {
                      return null;
                    }

                    return (
                      <div
                        key={sec.id}
                        className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all"
                      >
                        {/* Section Accordion Trigger */}
                        <button
                          onClick={() => toggleSection(sec.id)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          <div className="flex items-center space-x-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                              <FolderOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">
                                {sec.name}
                              </h3>
                              {sec.summary && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {sec.summary}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {hasModules ? `${sec.modules.length} materi` : "0 materi"}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {/* Section Modules List */}
                        {isExpanded && (
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                            {hasModules ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                {sec.modules.map((mod) => (
                                  <a
                                    key={mod.id}
                                    href={mod.fileurl || mod.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 hover:shadow-md transition-all flex items-center justify-between group"
                                  >
                                    <div className="flex items-center space-x-2.5 max-w-[80%] min-w-0">
                                      {getResourceIcon(mod.modname, mod.name, mod.fileExtension)}
                                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-500 transition-colors">
                                        {mod.name}
                                      </span>
                                      {mod.fileExtension && (
                                        <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0">
                                          {mod.fileExtension}
                                        </span>
                                      )}
                                    </div>

                                    {mod.fileurl ? (
                                      <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500 flex-shrink-0" />
                                    ) : (
                                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 flex-shrink-0" />
                                    )}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              /* Empty State Banner */
                              <div className="p-6 text-center rounded-xl bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 mt-2">
                                <p className="text-xs font-medium text-slate-400">
                                  Belum ada materi yang diunggah oleh dosen
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Filter Empty State Banner */
                <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                  <Search className="w-12 h-12 text-slate-400 mb-3" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Tidak ada materi yang sesuai dengan filter
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Coba ganti kata kunci pencarian atau pilih kategori materi lainnya.
                  </p>
                </div>
              )
            ) : (
              /* Empty Course Banner */
              <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <FolderOpen className="w-12 h-12 text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Belum ada materi perkuliahan
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Belum ada materi atau modul yang diunggah oleh dosen untuk mata kuliah ini.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              Pilih mata kuliah dari daftar di sebelah kiri untuk melihat materi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
