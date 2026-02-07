"use client";

import React, { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { Download, Trash2, RefreshCcw, Plus, Eye, EyeOff, Folder, Save, FilePlus, List, X, Edit3, Settings2, Target } from "lucide-react";

type PlacedIcon = {
  id: string;
  src: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
};

type AxisLabels = {
  top: string;
  bottom: string;
  left: string;
  right: string;
};

type VisibleLabels = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

type AxisRanges = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type Project = {
  id: string;
  name: string;
  placedIcons: PlacedIcon[];
  axisLabels: AxisLabels;
  visibleLabels: VisibleLabels;
  axisRanges: AxisRanges;
  updatedAt: number;
};

type GroupedIcons = Record<string, string[]>;

const LL_PINK = "#E4007F";

export default function TierMaker() {
  const [icons, setIcons] = useState<GroupedIcons>({});
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // Project States
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [placedIcons, setPlacedIcons] = useState<PlacedIcon[]>([]);
  const [axisLabels, setAxisLabels] = useState<AxisLabels>({
    top: "好き",
    bottom: "普通",
    left: "かっこいい",
    right: "かわいい",
  });
  const [visibleLabels, setVisibleLabels] = useState<VisibleLabels>({
    top: true,
    bottom: true,
    left: true,
    right: true,
  });
  const [axisRanges, setAxisRanges] = useState<AxisRanges>({
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10,
  });

  // UI States
  const [showProjectList, setShowProjectList] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "rename">("create");
  const [modalInputName, setModalInputName] = useState("");
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [includeTitleInExport, setIncludeTitleInExport] = useState(true);

  // Load from API and LocalStorage
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/icons");
        const data: GroupedIcons = await res.json();
        setIcons(data);
        const folders = Object.keys(data);
        if (folders.length > 0) {
          setActiveFolder(folders[0]);
        }
      } catch (err) {
        console.error("Failed to fetch icons", err);
      }

      const savedProjects = localStorage.getItem("lovelive-projects");
      const lastProjectId = localStorage.getItem("lovelive-current-project-id");
      
      let loadedProjects: Project[] = [];
      if (savedProjects) {
        try {
          loadedProjects = JSON.parse(savedProjects);
          setProjects(loadedProjects);
        } catch (e) {
          console.error("Failed to parse projects", e);
        }
      }

      if (loadedProjects.length > 0) {
        const projectToLoad = loadedProjects.find(p => p.id === lastProjectId) || loadedProjects[0];
        loadProject(projectToLoad);
      } else {
        const initialProject: Project = {
          id: Math.random().toString(36).substr(2, 9),
          name: "無題のプロジェクト",
          placedIcons: [],
          axisLabels: {
            top: "好き",
            bottom: "普通",
            left: "かっこいい",
            right: "かわいい",
          },
          visibleLabels: {
            top: true,
            bottom: true,
            left: true,
            right: true,
          },
          axisRanges: {
            minX: -10,
            maxX: 10,
            minY: -10,
            maxY: 10,
          },
          updatedAt: Date.now()
        };
        setProjects([initialProject]);
        loadProject(initialProject);
      }
      
      setIsLoaded(true);
    };

    fetchData();
  }, []);

  // Auto-save current project
  useEffect(() => {
    if (isLoaded && currentProjectId) {
      const updatedProjects = projects.map(p => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            placedIcons,
            axisLabels,
            visibleLabels,
            axisRanges,
            updatedAt: Date.now()
          };
        }
        return p;
      });
      
      setProjects(updatedProjects);
      localStorage.setItem("lovelive-projects", JSON.stringify(updatedProjects));
      localStorage.setItem("lovelive-current-project-id", currentProjectId);
    }
  }, [placedIcons, axisLabels, visibleLabels, axisRanges, isLoaded]);

  const openCreateModal = () => {
    setModalMode("create");
    setModalInputName(`プロジェクト ${projects.length + 1}`);
    setShowNameModal(true);
  };

  const openRenameModal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const project = projects.find(p => p.id === id);
    if (!project) return;
    setModalMode("rename");
    setModalInputName(project.name);
    setTargetProjectId(id);
    setShowNameModal(true);
  };

  const handleModalSubmit = () => {
    const trimmedName = modalInputName.trim() || "無題のプロジェクト";

    if (modalMode === "create") {
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name: trimmedName,
        placedIcons: [],
        axisLabels: {
          top: "好き",
          bottom: "普通",
          left: "かっこいい",
          right: "かわいい",
        },
        visibleLabels: {
          top: true,
          bottom: true,
          left: true,
          right: true,
        },
        axisRanges: {
          minX: -10,
          maxX: 10,
          minY: -10,
          maxY: 10,
        },
        updatedAt: Date.now()
      };

      const newProjects = [...projects, newProject];
      setProjects(newProjects);
      localStorage.setItem("lovelive-projects", JSON.stringify(newProjects));
      loadProject(newProject);
      setShowProjectList(false);
    } else if (modalMode === "rename" && targetProjectId) {
      const updated = projects.map(p => p.id === targetProjectId ? { ...p, name: trimmedName } : p);
      setProjects(updated);
      localStorage.setItem("lovelive-projects", JSON.stringify(updated));
    }

    setShowNameModal(false);
    setModalInputName("");
    setTargetProjectId(null);
  };

  const loadProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setPlacedIcons(project.placedIcons);
    setAxisLabels(project.axisLabels);
    setVisibleLabels(project.visibleLabels);
    // Provide defaults for old projects that don't have axisRanges
    setAxisRanges(project.axisRanges || {
      minX: -10,
      maxX: 10,
      minY: -10,
      maxY: 10,
    });
    localStorage.setItem("lovelive-current-project-id", project.id);
    setSelectedIconId(null);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert("最後のプロジェクトは削除できません。");
      return;
    }
    if (confirm("このプロジェクトを削除してもよろしいですか？")) {
      const filtered = projects.filter(p => p.id !== id);
      setProjects(filtered);
      localStorage.setItem("lovelive-projects", JSON.stringify(filtered));
      if (currentProjectId === id) {
        loadProject(filtered[0]);
      }
    }
  };

  const addIcon = (src: string) => {
    if (placedIcons.some((icon) => icon.src === src)) {
      alert("このアイコンは既に追加されています。");
      return;
    }
    const newIcon: PlacedIcon = {
      id: Math.random().toString(36).substr(2, 9),
      src,
      x: 50,
      y: 50,
    };
    setPlacedIcons([...placedIcons, newIcon]);
    setSelectedIconId(newIcon.id);
  };

  const removeIcon = (id: string) => {
    setPlacedIcons(placedIcons.filter((icon) => icon.id !== id));
    if (selectedIconId === id) setSelectedIconId(null);
  };

  const updateLabel = (key: keyof AxisLabels, value: string) => {
    setAxisLabels({ ...axisLabels, [key]: value });
  };

  const toggleVisibility = (key: keyof VisibleLabels) => {
    setVisibleLabels({ ...visibleLabels, [key]: !visibleLabels[key] });
  };

  const updateRange = (key: keyof AxisRanges, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setAxisRanges({ ...axisRanges, [key]: num });
    }
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
    setSelectedIconId(id);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingId || !plotRef.current) return;

    const rect = plotRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      if (e.cancelable) e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));

    setPlacedIcons(
      placedIcons.map((icon) =>
        icon.id === draggingId
          ? { ...icon, x: constrainedX, y: constrainedY }
          : icon,
      ),
    );
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  // Coordinate mapping functions
  const percentToVal = (percent: number, min: number, max: number, isY = false) => {
    if (isY) {
      // For Y, 0% is top (max value) and 100% is bottom (min value)
      return max - (percent / 100) * (max - min);
    }
    return min + (percent / 100) * (max - min);
  };

  const valToPercent = (val: number, min: number, max: number, isY = false) => {
    if (max === min) return 50;
    const percent = ((val - min) / (max - min)) * 100;
    if (isY) {
      return 100 - percent;
    }
    return percent;
  };

  const updateSelectedIconCoord = (axis: 'x' | 'y', valStr: string) => {
    if (!selectedIconId) return;
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

    setPlacedIcons(placedIcons.map(icon => {
      if (icon.id === selectedIconId) {
        if (axis === 'x') {
          return { ...icon, x: Math.max(0, Math.min(100, valToPercent(val, axisRanges.minX, axisRanges.maxX, false))) };
        } else {
          return { ...icon, y: Math.max(0, Math.min(100, valToPercent(val, axisRanges.minY, axisRanges.maxY, true))) };
        }
      }
      return icon;
    }));
  };

  const exportImage = async () => {
    if (plotRef.current) {
      try {
        const dataUrl = await toPng(plotRef.current, {
          backgroundColor: "#fff",
          cacheBust: true,
          pixelRatio: 4,
          fontEmbedCSS: "",
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains("delete-button-ignore")) {
              return false;
            }
            if (!includeTitleInExport && node instanceof HTMLElement && node.classList.contains("plot-title-ignore")) {
              return false;
            }
            return true;
          },
          style: {
            fontFamily: "Arial, sans-serif",
          },
        });
        const link = document.createElement("a");
        link.download = `${projects.find(p => p.id === currentProjectId)?.name || 'plot'}.png`;
        link.href = dataUrl;
        link.click();
        setShowExportModal(false);
      } catch (err) {
        console.error("Export failed", err);
        alert("画像の出力に失敗しました。");
      }
    }
  };

  if (!isLoaded) return null;

  const folders = Object.keys(icons);
  const currentProject = projects.find(p => p.id === currentProjectId);
  const selectedIcon = placedIcons.find(icon => icon.id === selectedIconId);

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-8 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-6 md:y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-200 pb-4 md:pb-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2" style={{ color: LL_PINK }}>
              2D Tierメーカー
            </h1>
          </div>
          <div className="flex flex-col md:flex-row justify-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowProjectList(!showProjectList)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
              <List size={16} />
              プロジェクト一覧
            </button>
            <button
              onClick={() => currentProjectId && openRenameModal(currentProjectId)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 border rounded-lg transition-colors shadow-sm text-sm"
              style={{ backgroundColor: `${LL_PINK}1A`, color: LL_PINK, borderColor: `${LL_PINK}33` }}
            >
              <Edit3 size={16} />
              タイトルを変更
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg hover:brightness-110 transition-colors shadow-md text-sm"
              style={{ backgroundColor: LL_PINK }}
            >
              <Download size={16} />
              画像で保存
            </button>
          </div>
        </header>

        {/* Project List Modal */}
        {showProjectList && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-lg">保存されたプロジェクト</h3>
                <button onClick={() => setShowProjectList(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {projects.sort((a, b) => b.updatedAt - a.updatedAt).map(project => (
                  <div 
                    key={project.id}
                    onClick={() => {
                      loadProject(project);
                      setShowProjectList(false);
                    }}
                    className={`group p-4 mb-2 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      currentProjectId === project.id 
                        ? "border-opacity-20 ring-4 ring-opacity-10" 
                        : "bg-white border-gray-100"
                    }`}
                    style={currentProjectId === project.id ? { 
                      backgroundColor: `${LL_PINK}0D`, 
                      borderColor: `${LL_PINK}33`,
                      boxShadow: `0 0 0 4px ${LL_PINK}1A`
                    } : {}}
                  >
                    <div>
                      <div className="font-bold text-gray-800">{project.name}</div>
                      <div className="text-[10px] text-gray-400">最終更新: {new Date(project.updatedAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => openRenameModal(project.id, e)}
                        className="p-1.5 text-gray-400 rounded-md hover:bg-gray-100"
                        style={{ color: "inherit" }}
                      >
                        <RefreshCcw size={14} />
                      </button>
                      <button 
                        onClick={(e) => deleteProject(project.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-gray-50">
                <button 
                  onClick={openCreateModal}
                  className="w-full py-3 text-white rounded-xl font-bold shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: LL_PINK }}
                >
                  <Plus size={20} />
                  新しいプロットを作成
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Name Input Modal */}
        {showNameModal && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
              <div className="p-6 space-y-4">
                <h3 className="font-bold text-xl text-center">
                  {modalMode === "create" ? "新しいプロット" : "プロジェクト名を変更"}
                </h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">プロジェクト名</label>
                  <input
                    autoFocus
                    type="text"
                    value={modalInputName}
                    onChange={(e) => setModalInputName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleModalSubmit()}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 outline-none transition-all"
                    style={{ focusRingColor: LL_PINK } as any}
                    placeholder="名前を入力してください"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowNameModal(false)}
                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleModalSubmit}
                    className="flex-1 py-3 text-white font-bold rounded-xl shadow-lg hover:brightness-110 transition-all"
                    style={{ backgroundColor: LL_PINK }}
                  >
                    {modalMode === "create" ? "作成" : "保存"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
              <div className="p-6 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl">画像を保存</h3>
                  <p className="text-gray-500 text-sm">出力の設定を選択してください</p>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="font-medium">題名を含める</span>
                  <button 
                    onClick={() => setIncludeTitleInExport(!includeTitleInExport)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${includeTitleInExport ? '' : 'bg-gray-300'}`}
                    style={includeTitleInExport ? { backgroundColor: LL_PINK } : {}}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeTitleInExport ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={exportImage}
                    className="flex-1 py-3 text-white font-bold rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: LL_PINK }}
                  >
                    <Download size={18} />
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6 order-2 lg:order-1">
            {/* Icon Selector */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
                <Plus size={18} style={{ color: LL_PINK }} />
                アイコンを追加
              </h2>
              
              {folders.length > 1 && (
                <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-100 pb-2">
                  {folders.map((folder) => (
                    <button
                      key={folder}
                      onClick={() => setActiveFolder(folder)}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        activeFolder === folder
                          ? "font-bold"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      style={activeFolder === folder ? { backgroundColor: `${LL_PINK}1A`, color: LL_PINK } : {}}
                    >
                      {folder}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 lg:grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-1">
                {activeFolder && icons[activeFolder]?.map((src, index) => {
                  const isPlaced = placedIcons.some((icon) => icon.src === src);
                  return (
                    <button
                      key={index}
                      onClick={() => addIcon(src)}
                      disabled={isPlaced}
                      className={`relative aspect-square border rounded-md overflow-hidden transition-all active:scale-95 ${
                        isPlaced
                          ? "opacity-40 grayscale border-gray-100 cursor-not-allowed"
                          : "border-gray-100"
                      }`}
                      style={!isPlaced ? { borderColor: 'transparent' } : {}}
                    >
                      <img src={src} alt="icon" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Icon Settings */}
            {selectedIcon && (
              <div className="bg-white p-4 md:p-5 rounded-xl shadow-lg border-2 animate-in slide-in-from-left duration-200" style={{ borderColor: LL_PINK }}>
                <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2" style={{ color: LL_PINK }}>
                  <Target size={18} />
                  選択中のアイコン
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  <img src={selectedIcon.src} className="w-12 h-12 rounded-full border-2 border-gray-100 shadow-sm" />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">X座標</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={percentToVal(selectedIcon.x, axisRanges.minX, axisRanges.maxX, false).toFixed(1)}
                        onChange={(e) => updateSelectedIconCoord('x', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 outline-none"
                        style={{ focusRingColor: LL_PINK } as any}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Y座標</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={percentToVal(selectedIcon.y, axisRanges.minY, axisRanges.maxY, true).toFixed(1)}
                        onChange={(e) => updateSelectedIconCoord('y', e.target.value)}
                        className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:ring-2 outline-none"
                        style={{ focusRingColor: LL_PINK } as any}
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeIcon(selectedIcon.id)}
                  className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  このアイコンを削除
                </button>
              </div>
            )}

            {/* Axis Labels & Visibility */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                軸のラベル設定
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {(["top", "bottom", "left", "right"] as const).map((key) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">
                        {key === "top" ? "上 (Y軸+)" : key === "bottom" ? "下 (Y軸-)" : key === "left" ? "左 (X軸-)" : "右 (X軸+)"}
                      </label>
                      <button
                        onClick={() => toggleVisibility(key)}
                        className={`p-1 rounded-md transition-colors ${visibleLabels[key] ? "" : "text-gray-300 hover:bg-gray-50"}`}
                        style={visibleLabels[key] ? { color: LL_PINK, backgroundColor: `${LL_PINK}0D` } : {}}
                      >
                        {visibleLabels[key] ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={axisLabels[key]}
                      onChange={(e) => updateLabel(key, e.target.value)}
                      disabled={!visibleLabels[key]}
                      className={`w-full px-3 py-1.5 border rounded-lg outline-none transition-all text-sm ${
                        visibleLabels[key] ? "bg-gray-50 border-gray-200" : "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Axis Range Settings */}
            <div className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <Settings2 size={18} />
                数値の範囲設定
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">X軸 最小値</label>
                  <input 
                    type="number" 
                    value={axisRanges.minX}
                    onChange={(e) => updateRange('minX', e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">X軸 最大値</label>
                  <input 
                    type="number" 
                    value={axisRanges.maxX}
                    onChange={(e) => updateRange('maxX', e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Y軸 最小値</label>
                  <input 
                    type="number" 
                    value={axisRanges.minY}
                    onChange={(e) => updateRange('minY', e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Y軸 最大値</label>
                  <input 
                    type="number" 
                    value={axisRanges.maxY}
                    onChange={(e) => updateRange('maxY', e.target.value)}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Area: The Plot */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div
              ref={plotRef}
              className="relative aspect-square w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg touch-none select-none"
              onMouseMove={handleMouseMove}
              onTouchMove={handleMouseMove}
              onMouseUp={handleDragEnd}
              onTouchEnd={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onClick={() => setSelectedIconId(null)}
            >
              {/* Plot Title */}
              <div className="absolute top-2 left-4 z-20 pointer-events-none plot-title-ignore">
                <h2 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter" style={{ color: `${LL_PINK}33` }}>
                  {currentProject?.name}
                </h2>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-[2px] bg-gray-200" />
                <div className="h-full w-[2px] bg-gray-200 absolute" />
              </div>

              {/* Axis Labels on Plot */}
              {visibleLabels.top && (
                <div className="absolute top-3 md:top-6 left-1/2 -translate-x-1/2 px-3 md:px-4 py-0.5 md:py-1 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 font-bold text-[10px] md:text-sm pointer-events-none shadow-sm border border-gray-100 whitespace-nowrap">
                  {axisLabels.top}
                </div>
              )}
              {visibleLabels.bottom && (
                <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 px-3 md:px-4 py-0.5 md:py-1 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 font-bold text-[10px] md:text-sm pointer-events-none shadow-sm border border-gray-100 whitespace-nowrap">
                  {axisLabels.bottom}
                </div>
              )}
              {visibleLabels.left && (
                <div className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 -rotate-90 origin-center px-3 md:px-4 py-0.5 md:py-1 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 font-bold text-[10px] md:text-sm pointer-events-none shadow-sm border border-gray-100 whitespace-nowrap">
                  {axisLabels.left}
                </div>
              )}
              {visibleLabels.right && (
                <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 rotate-90 origin-center px-3 md:px-4 py-0.5 md:py-1 bg-white/80 backdrop-blur-sm rounded-full text-gray-600 font-bold text-[10px] md:text-sm pointer-events-none shadow-sm border border-gray-100 whitespace-nowrap">
                  {axisLabels.right}
                </div>
              )}

              {placedIcons.map((icon) => (
                <div
                  key={icon.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move group z-10"
                  style={{ left: `${icon.x}%`, top: `${icon.y}%` }}
                  onMouseDown={(e) => { e.stopPropagation(); handleDragStart(icon.id); }}
                  onTouchStart={(e) => { e.stopPropagation(); handleDragStart(icon.id); }}
                  onClick={(e) => { e.stopPropagation(); setSelectedIconId(icon.id); }}
                >
                  <div className="relative">
                    <img
                      src={icon.src}
                      alt="placed"
                      className={`w-10 h-10 md:w-20 md:h-20 rounded-full border-2 shadow-md transition-all ${
                        selectedIconId === icon.id
                          ? "scale-110 ring-4 z-50"
                          : "border-white"
                      }`}
                      style={selectedIconId === icon.id ? { 
                        borderColor: LL_PINK,
                        boxShadow: `0 0 0 4px ${LL_PINK}1A`
                      } : {}}
                      draggable={false}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeIcon(icon.id);
                      }}
                      data-html2canvas-ignore="true"
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-20 delete-button-ignore"
                    >
                      <Trash2 size={12} className="md:w-3.5 md:h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg border text-xs md:text-sm flex items-start gap-2"
                 style={{ backgroundColor: `${LL_PINK}0D`, borderColor: `${LL_PINK}1A`, color: LL_PINK }}>
              <span className="text-base">💡</span>
              <p>
                アイコンをタップすると数値で座標を指定できます。軸の範囲設定から数値のスケールも変更可能です。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
