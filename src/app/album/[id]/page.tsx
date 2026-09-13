"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CONFEDERATIONS, TOTAL_STICKERS_COUNT, Country } from "@/data/countries";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  Share2, 
  SlidersHorizontal, 
  FileDown, 
  FileUp, 
  Trash2, 
  Percent, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp,
  LayoutGrid,
  Info,
  Lock,
  Unlock,
  X
} from "lucide-react";

export default function AlbumTracker({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id.toLowerCase();
  
  // State for sticker collection
  const [stickers, setStickers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"salvat" | "se_salveaza" | "eroare">("salvat");
  
  // PIN lock protection state (PIN: 1122)
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Navigation and active UI tabs
  const [activeTab, setActiveTab] = useState<"album" | "swap" | "settings">("album");
  const [activeConfederation, setActiveConfederation] = useState<string>("all");
  const [filterState, setFilterState] = useState<"all" | "missing" | "owned" | "duplicates">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Visual accordion states for countries (opened/closed)
  const [collapsedCountries, setCollapsedCountries] = useState<Record<string, boolean>>({});
  
  // Notifications
  const [linkCopied, setCopyNotification] = useState(false);
  const [swapCopied, setSwapCopied] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load album and unlock state on mount
  useEffect(() => {
    async function fetchAlbum() {
      try {
        const res = await fetch(`/api/album/${id}`);
        if (!res.ok) {
          throw new Error("Albumul nu a fost găsit.");
        }
        const data = await res.json();
        setStickers(data.stickers || {});
        
        // Initialize all country accordions to open by default
        const initialCollapsed: Record<string, boolean> = {};
        CONFEDERATIONS.forEach(conf => {
          conf.countries.forEach(country => {
            initialCollapsed[country.code] = false;
          });
        });
        setCollapsedCountries(initialCollapsed);

        // Check if previously unlocked on this device
        const unlockedCached = localStorage.getItem(`panini_unlocked_${id}`);
        if (unlockedCached === "true") {
          setIsEditUnlocked(true);
        }
      } catch (err) {
        alert("Eroare la încărcarea albumului. Este posibil ca link-ul să fie invalid.");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    fetchAlbum();
  }, [id, router]);

  // Debounced auto-save mechanism
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Only allow auto-saving if edit mode is unlocked!
    if (!isEditUnlocked) return;

    setSaveStatus("se_salveaza");
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/album/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stickers })
        });
        if (!res.ok) throw new Error("Eroare la salvare");
        setSaveStatus("salvat");
      } catch (err) {
        console.error("Autosave error:", err);
        setSaveStatus("eroare");
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [stickers, id, isEditUnlocked]);

  // Calculations for stats
  const totalUniqueCollected = Object.keys(stickers).filter(key => stickers[key] > 0).length;
  const totalMissingCount = TOTAL_STICKERS_COUNT - totalUniqueCollected;
  const totalDuplicatesCount = Object.values(stickers).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const completionPercentage = Math.round((totalUniqueCollected / TOTAL_STICKERS_COUNT) * 100);

  // Sticker click interaction
  const handleStickerClick = (stickerKey: string) => {
    if (!isEditUnlocked) {
      triggerUnlockPrompt();
      return;
    }
    setStickers(prev => {
      const current = prev[stickerKey] || 0;
      const nextStickers = { ...prev };
      if (current === 0) {
        nextStickers[stickerKey] = 1;
      } else {
        delete nextStickers[stickerKey];
      }
      return nextStickers;
    });
  };

  const incrementDuplicate = (stickerKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditUnlocked) {
      triggerUnlockPrompt();
      return;
    }
    setStickers(prev => {
      const current = prev[stickerKey] || 0;
      return {
        ...prev,
        [stickerKey]: current + 1
      };
    });
  };

  const decrementDuplicate = (stickerKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditUnlocked) {
      triggerUnlockPrompt();
      return;
    }
    setStickers(prev => {
      const current = prev[stickerKey] || 0;
      if (current <= 1) {
        const nextStickers = { ...prev };
        delete nextStickers[stickerKey];
        return nextStickers;
      }
      return {
        ...prev,
        [stickerKey]: current - 1
      };
    });
  };

  // Bulk actions for countries
  const markCountryCompleted = (country: Country) => {
    if (!isEditUnlocked) {
      triggerUnlockPrompt();
      return;
    }
    setStickers(prev => {
      const nextStickers = { ...prev };
      for (let i = 1; i <= country.stickersCount; i++) {
        const key = `${country.code} ${i}`;
        if (!nextStickers[key]) {
          nextStickers[key] = 1;
        }
      }
      return nextStickers;
    });
  };

  const clearCountryStickers = (country: Country) => {
    if (!isEditUnlocked) {
      triggerUnlockPrompt();
      return;
    }
    if (!confirm(`Sigur dorești să ștergi toate selecțiile pentru ${country.name}?`)) return;
    setStickers(prev => {
      const nextStickers = { ...prev };
      for (let i = 1; i <= country.stickersCount; i++) {
        const key = `${country.code} ${i}`;
        delete nextStickers[key];
      }
      return nextStickers;
    });
  };

  // Toggle country collapse
  const toggleCountryCollapse = (code: string) => {
    setCollapsedCountries(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  // Copy shareable link
  const copyShareableLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 2000);
    }
  };

  // Reset entire album
  const handleResetAll = () => {
    if (!isEditUnlocked) return;
    if (!confirm("⚠️ ATENȚIE: Sigur vrei să resetezi complet albumul? Toate stickerele colectate și dublurile vor fi șterse definitiv!")) return;
    setStickers({});
  };

  // Export JSON Backup
  const exportBackup = () => {
    const backupData = {
      id,
      exportedAt: new Date().toISOString(),
      stickers
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `panini-2026-album-${id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON Backup
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditUnlocked) return;
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed.stickers === "object") {
          setStickers(parsed.stickers);
          alert("Import realizat cu succes!");
        } else {
          alert("Fișierul selectat nu are formatul corect de backup.");
        }
      } catch (err) {
        alert("A apărut o eroare la procesarea fișierului de backup.");
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Lock and unlock functions for PIN
  const triggerUnlockPrompt = () => {
    setPinInput("");
    setPinError(false);
    setPinModalOpen(true);
  };

  const handleUnlockPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.length !== 4 || isVerifyingPin) return;

    setIsVerifyingPin(true);
    setPinError(false);

    try {
      const res = await fetch(`/api/album/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: enteredPin })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditUnlocked(true);
        localStorage.setItem(`panini_unlocked_${id}`, "true");
        setPinModalOpen(false);
        setPinInput("");
      } else {
        setPinError(true);
      }
    } catch (err) {
      setPinError(true);
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleLockEdit = () => {
    setIsEditUnlocked(false);
    localStorage.removeItem(`panini_unlocked_${id}`);
    if (activeTab === "settings") {
      setActiveTab("album");
    }
  };

  // Generate missing and duplicate text list for trading
  const generateSwapLists = () => {
    const missingList: string[] = [];
    const duplicateList: string[] = [];

    CONFEDERATIONS.forEach(conf => {
      conf.countries.forEach(country => {
        for (let i = 1; i <= country.stickersCount; i++) {
          const key = `${country.code} ${i}`;
          const count = stickers[key] || 0;
          if (count === 0) {
            missingList.push(key);
          } else if (count > 1) {
            const extra = count - 1;
            duplicateList.push(`${key}${extra > 1 ? ` (x${extra})` : ""}`);
          }
        }
      });
    });

    return {
      missingText: missingList.length > 0 ? missingList.join(", ") : "Nimic! Album complet! 🎉",
      duplicateText: duplicateList.length > 0 ? duplicateList.join(", ") : "Nu ai dubluri disponibile.",
      missingCount: missingList.length,
      duplicateCount: duplicateList.length
    };
  };

  const swapLists = generateSwapLists();

  const copySwapListToClipboard = () => {
    const textToCopy = `📋 LISTĂ SCHIMB PANINI 2026 (Cod Album: ${id.toUpperCase()})\n\n❌ AM NEVOIE DE (Lipsă):\n${swapLists.missingText}\n\n♻️ OFER LA SCHIMB (Dubluri):\n${swapLists.duplicateText}\n\nGenerat automat pe ${window.location.origin}/album/${id}`;
    navigator.clipboard.writeText(textToCopy);
    setSwapCopied(true);
    setTimeout(() => setSwapCopied(false), 2000);
  };

  // Global search & filter logic for stickers
  const matchesSearchAndFilters = (country: Country, stickerIndex: number) => {
    const key = `${country.code} ${stickerIndex}`;
    const count = stickers[key] || 0;

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      const matchesCountryName = country.name.toLowerCase().includes(query);
      const matchesCountryCode = country.code.toLowerCase().includes(query);
      const matchesStickerKey = key.toLowerCase().includes(query);
      
      if (!matchesCountryName && !matchesCountryCode && !matchesStickerKey) {
        return false;
      }
    }

    if (filterState === "missing") return count === 0;
    if (filterState === "owned") return count >= 1;
    if (filterState === "duplicates") return count > 1;

    return true;
  };

  const getVisibleStickersCount = (country: Country) => {
    let count = 0;
    for (let i = 1; i <= country.stickersCount; i++) {
      if (matchesSearchAndFilters(country, i)) {
        count++;
      }
    }
    return count;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#fbfaf7]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-[#e2001a] animate-spin" />
          <h2 className="text-lg font-bold text-slate-700">Se încarcă albumul tău din cloud...</h2>
          <p className="text-sm text-slate-400">Verificăm baza de date Vercel KV</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#fbfaf7] min-h-screen pb-24">
      
      {/* Sticky Top Header Bar with Panini Colors */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-[#ffcc00] shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push("/")}
              className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-[#e2001a]" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                {/* Stylized Panini Header Brand Box */}
                <div className="bg-[#e2001a] text-white px-2 py-0.5 rounded font-black uppercase text-xs border border-white tracking-widest" style={{ fontFamily: "Impact, sans-serif" }}>
                  PANINI
                </div>
                <span className="bg-[#e2001a] text-white text-xs px-2.5 py-0.5 rounded font-black uppercase tracking-wider">
                  {id}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                {isEditUnlocked ? (
                  <>
                    <Unlock className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Mod Editare Activat</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Mod Doar Vizualizare (Read-Only)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Lock / Unlock Toggle Button */}
            {isEditUnlocked ? (
              <button
                onClick={handleLockEdit}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition shadow-sm"
                title="Blochează editarea"
              >
                <Lock className="w-3.5 h-3.5 text-[#e2001a]" />
                <span className="hidden sm:inline">Blochează Editarea</span>
              </button>
            ) : (
              <button
                onClick={triggerUnlockPrompt}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#e2001a] hover:bg-[#c10014] text-white text-xs font-bold rounded-lg transition shadow-sm border-b-2 border-[#b20012]"
                title="Deblochează cu PIN"
              >
                <Unlock className="w-3.5 h-3.5 text-[#ffcc00]" />
                <span>Deblochează Editare</span>
              </button>
            )}

            <button
              onClick={copyShareableLink}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#fbfaf7] hover:bg-[#eae8df] text-slate-700 text-xs font-bold rounded-lg transition border border-slate-200"
            >
              {linkCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copiat!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#e2001a]" />
                  <span className="hidden sm:inline">Partajează Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-6xl w-full mx-auto px-4 mt-6 flex-1 flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        
        {/* LEFT COLUMN: Sidebar with Progress Stats */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-6">
          
          {/* Card: Progres General with Panini Theme */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffcc00] opacity-10 rounded-full blur-xl transform translate-x-6 -translate-y-6"></div>
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Progres General</h3>
            
            <div className="flex items-center space-x-4">
              <div className="relative flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full border-4 border-slate-100" style={{
                background: `conic-gradient(#e2001a ${completionPercentage}%, #f1f5f9 0)`
              }}>
                <div className="absolute w-[calc(100%-12px)] h-[calc(100%-12px)] bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-800">{completionPercentage}%</span>
                  <Percent className="w-2.5 h-2.5 text-slate-400 -mt-0.5" />
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="text-2xl font-black text-slate-800">{totalUniqueCollected}</div>
                <div className="text-xs text-slate-400 font-bold uppercase">din {TOTAL_STICKERS_COUNT} stickere</div>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mt-5">
              <div className="bg-[#e2001a] h-2 rounded-full transition-all duration-300" style={{ width: `${completionPercentage}%` }}></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
              <div>
                <div className="text-sm font-bold text-slate-600">{totalMissingCount}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Mai ai nevoie</div>
              </div>
              <div>
                <div className="text-sm font-bold text-amber-500">{totalDuplicatesCount}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Dubluri</div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts / Tabs */}
          <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab("album")}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                activeTab === "album" 
                  ? "bg-[#e2001a] text-white shadow-md shadow-[#e2001a]/10" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Catalogul Meu</span>
            </button>
            <button
              onClick={() => setActiveTab("swap")}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                activeTab === "swap" 
                  ? "bg-[#e2001a] text-white shadow-md shadow-[#e2001a]/10" 
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Schimb / Dubluri ({totalDuplicatesCount})</span>
            </button>

            {/* Only show Settings tab if unlocked! */}
            {isEditUnlocked && (
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition ${
                  activeTab === "settings" 
                    ? "bg-[#e2001a] text-white shadow-md shadow-[#e2001a]/10" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Backup & Setări</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Panel View */}
        <div className="flex-1 flex flex-col space-y-6">

          {/* TAB 1: STICKER ALBUM CATALOG */}
          {activeTab === "album" && (
            <>
              {/* Toolbar: Search & Filters */}
              <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Caută după țară, cod (ex: USA, CAN 4)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#e2001a] focus:border-transparent outline-none transition text-sm text-slate-800"
                    />
                  </div>

                  {/* Filter State Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto self-start sm:self-auto">
                    {[
                      { id: "all", label: "Toate" },
                      { id: "missing", label: "Lipsă" },
                      { id: "owned", label: "Deținute" },
                      { id: "duplicates", label: "Dubluri" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setFilterState(tab.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                          filterState === tab.id
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Confederation Quick Jump Nav */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setActiveConfederation("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      activeConfederation === "all"
                        ? "bg-[#e2001a]/10 text-[#e2001a]"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                  >
                    Toate Grupele
                  </button>
                  {CONFEDERATIONS.map(conf => (
                    <button
                      key={conf.id}
                      onClick={() => setActiveConfederation(conf.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                        activeConfederation === conf.id
                          ? "bg-[#e2001a]/10 text-[#e2001a]"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      {conf.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Displaying Confederations and Countries */}
              <div className="space-y-6">
                {CONFEDERATIONS
                  .filter(conf => activeConfederation === "all" || conf.id === activeConfederation)
                  .map(conf => {
                    const visibleCountries = conf.countries.filter(country => {
                      const visibleStickersCount = getVisibleStickersCount(country);
                      return visibleStickersCount > 0;
                    });

                    if (visibleCountries.length === 0) return null;

                    return (
                      <div key={conf.id} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h2 className="font-extrabold text-[#e2001a] text-base md:text-lg tracking-tight uppercase">
                            {conf.name}
                          </h2>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                            {visibleCountries.length} țări
                          </span>
                        </div>

                        {visibleCountries.map(country => {
                          const isCollapsed = collapsedCountries[country.code] || false;
                          const visibleStickersCount = getVisibleStickersCount(country);
                          
                          let collectedInCountry = 0;
                          for (let i = 1; i <= country.stickersCount; i++) {
                            if ((stickers[`${country.code} ${i}`] || 0) > 0) {
                              collectedInCountry++;
                            }
                          }

                          return (
                            <div key={country.code} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition duration-200 hover:shadow-md">
                              {/* Country Header (Accordion) */}
                              <div 
                                onClick={() => toggleCountryCollapse(country.code)}
                                className="flex items-center justify-between p-4 md:p-5 bg-[#fbfaf7] border-b border-slate-50 cursor-pointer select-none no-select"
                              >
                                <div className="flex items-center space-x-3">
                                  {country.flag === "PANINI" ? (
                                    <span className="bg-[#e2001a] border border-[#ffcc00] text-white px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider leading-none select-none shadow-sm transform rotate-[-2deg]" style={{ fontFamily: "Impact, sans-serif" }}>
                                      PANINI
                                    </span>
                                  ) : (
                                    <span className="text-2xl leading-none">{country.flag}</span>
                                  )}
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-extrabold text-slate-800 text-sm md:text-base">
                                        {country.name}
                                      </span>
                                      <span className="text-xs font-black text-[#e2001a] bg-[#e2001a]/5 border border-[#e2001a]/10 px-1.5 py-0.5 rounded uppercase">
                                        {country.code}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-400 font-bold mt-0.5">
                                      Ai colectat {collectedInCountry} din {country.stickersCount} stickere
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                                  {/* Bulk Actions (Only visible if UNLOCKED) */}
                                  {isEditUnlocked && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => markCountryCompleted(country)}
                                        title="Marchează ca deținute"
                                        className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => clearCountryStickers(country)}
                                        title="Resetează țară"
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}

                                  <button 
                                    onClick={() => toggleCountryCollapse(country.code)}
                                    className="p-1 hover:bg-slate-100 text-slate-500 rounded"
                                  >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Sticker Grid Items */}
                              {!isCollapsed && (
                                <div className="p-4 md:p-5">
                                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
                                    {Array.from({ length: country.stickersCount }, (_, index) => {
                                      const stickerNum = index + 1;
                                      const key = `${country.code} ${stickerNum}`;
                                      const count = stickers[key] || 0;
                                      const isOwned = count > 0;
                                      const isDuplicate = count > 1;

                                      if (!matchesSearchAndFilters(country, stickerNum)) return null;

                                      return (
                                        <div
                                          key={key}
                                          onClick={() => handleStickerClick(key)}
                                          className={`relative h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition select-none no-select shadow-sm border ${
                                            isOwned
                                              ? "bg-teal-700 border-teal-800 text-white hover:bg-teal-800"
                                              : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
                                          }`}
                                        >
                                          {/* Sticker Label */}
                                          <span className={`text-[10px] font-black uppercase ${isOwned ? "text-[#ffcc00]" : "text-slate-300"}`}>
                                            {country.code}
                                          </span>
                                          <span className="text-sm font-extrabold -mt-0.5">
                                            {stickerNum}
                                          </span>

                                          {/* Duplicate management (Only visible when owned AND unlocked) */}
                                          {isOwned && (
                                            <>
                                              {isDuplicate && (
                                                <span className="absolute bottom-1 right-1 bg-[#ffcc00] text-slate-900 text-[9px] px-1 font-black rounded-sm shadow-sm scale-95">
                                                  x{count}
                                                </span>
                                              )}

                                              {isEditUnlocked && (
                                                <div className="absolute inset-0 bg-teal-900/90 rounded-xl opacity-0 hover:opacity-100 flex items-center justify-between px-1 transition duration-100">
                                                  <button
                                                    onClick={(e) => decrementDuplicate(key, e)}
                                                    className="p-1 hover:bg-teal-800 rounded text-white"
                                                    title="Scade"
                                                  >
                                                    <Minus className="w-3.5 h-3.5" />
                                                  </button>
                                                  <span className="text-xs font-black">{count}</span>
                                                  <button
                                                    onClick={(e) => incrementDuplicate(key, e)}
                                                    className="p-1 hover:bg-teal-800 rounded text-white"
                                                    title="Adaugă"
                                                  >
                                                    <Plus className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              )}
                                            </>
                                          )}

                                          {/* Locked View Badge icon on stickers if hover but locked */}
                                          {!isEditUnlocked && !isOwned && (
                                            <div className="absolute top-0.5 right-0.5 opacity-0 hover:opacity-100 transition duration-100">
                                              <Lock className="w-2.5 h-2.5 text-slate-300" />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {/* TAB 2: SWAP HUB */}
          {activeTab === "swap" && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Centrul de Schimb (Swap Hub)</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Aici poți genera o listă completă de stickere pe care le cauți sau le oferi la schimb.
                </p>
              </div>

              <div className="bg-[#fbfaf7] rounded-xl p-4 flex items-start space-x-3 border border-slate-200/50">
                <Info className="w-5 h-5 text-[#e2001a] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">Cum se folosește?</p>
                  <p>Apasă pe butonul de mai jos pentru a copia textul formatat în clipboard, gata de trimis pe WhatsApp sau rețele sociale.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Previzualizare Listă</h3>
                  <button
                    onClick={copySwapListToClipboard}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#e2001a] hover:bg-[#c10014] text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    {swapCopied ? (
                      <>
                        <Check className="w-4 h-4 text-[#ffcc00]" />
                        <span>Copiat cu succes!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-[#ffcc00]" />
                        <span>Copiază Lista de Schimb</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 text-[#fbfaf7] p-5 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px] border border-slate-800 shadow-inner">
                  <span className="text-[#ffcc00]">📋 LISTĂ SCHIMB PANINI 2026 (Cod Album: {id.toUpperCase()})</span>
                  {"\n\n"}
                  <span className="text-rose-400 font-bold">❌ AM NEVOIE DE (Lipsă):</span>
                  {"\n"}
                  {swapLists.missingText}
                  {"\n\n"}
                  <span className="text-emerald-400 font-bold">♻️ OFER LA SCHIMB (Dubluri):</span>
                  {"\n"}
                  {swapLists.duplicateText}
                  {"\n\n"}
                  <span className="text-slate-500">// Generat automat pe {typeof window !== "undefined" && window.location.origin}/album/{id}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS & BACKUP (Only loaded if edit mode unlocked) */}
          {activeTab === "settings" && isEditUnlocked && (
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Setări & Backup Colecție</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Administrează integritatea datelor tale, salvează backup-uri sau curăță albumul.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm flex items-center space-x-2">
                      <FileDown className="w-4 h-4 text-[#ffcc00]" />
                      <span>Exportă Fișier Backup</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Descarcă un fișier JSON cu toate datele tale. Recomandat periodic.
                    </p>
                  </div>
                  <button
                    onClick={exportBackup}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
                  >
                    Descarcă Backup (.json)
                  </button>
                </div>

                <div className="border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm flex items-center space-x-2">
                      <FileUp className="w-4 h-4 text-emerald-600" />
                      <span>Importă Fișier Backup</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Restaurează un fișier JSON salvat anterior pentru a înlocui starea curentă a albumului.
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={importBackup}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100/60 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 transition"
                  >
                    Încarcă Fișier Backup
                  </button>
                </div>
              </div>

              <div className="border border-rose-100 bg-rose-50/20 p-5 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-bold text-rose-800 text-sm flex items-center space-x-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Zonă de Pericol</span>
                  </h3>
                  <p className="text-xs text-rose-500 mt-1">
                    Resetarea albumului va șterge toate datele deținute de pe acest album.
                  </p>
                </div>
                <button
                  onClick={handleResetAll}
                  className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Resetează Complet Albumul
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PIN UNLOCK MODAL DIALOG */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#e2001a] text-white p-6 relative flex flex-col items-center">
              <button 
                onClick={() => setPinModalOpen(false)}
                className="absolute top-4 right-4 p-1 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="bg-white/10 p-3 rounded-full mb-3">
                <Lock className="w-6 h-6 text-[#ffcc00]" />
              </div>
              <h3 className="text-lg font-bold">Autorizare Album</h3>
              <p className="text-xs text-white/80 mt-1">Introdu codul PIN pentru a activa modificările</p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUnlockPin} className="p-6 space-y-4">
              {pinError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl p-3 text-xs text-center font-bold">
                  Cod PIN incorect! Încearcă din nou.
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                  Codul PIN din 4 cifre
                </label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="&bull; &bull; &bull; &bull;"
                  value={enteredPin}
                  onChange={(e) => {
                    setPinError(false);
                    setPinInput(e.target.value.replace(/\D/g, ""));
                  }}
                  className="w-full text-center py-3 text-2xl font-black tracking-widest border border-slate-200 bg-slate-50 focus:bg-white rounded-2xl outline-none focus:ring-2 focus:ring-[#e2001a] focus:border-transparent transition"
                  autoFocus
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={enteredPin.length < 4 || isVerifyingPin}
                  className="flex-1 py-3 px-4 bg-[#e2001a] hover:bg-[#c10014] text-white text-xs font-bold rounded-xl transition shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none border-b-2 border-[#b20012] flex items-center justify-center space-x-2"
                >
                  {isVerifyingPin ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#ffcc00]" />
                  ) : (
                    <span>Deblochează</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
