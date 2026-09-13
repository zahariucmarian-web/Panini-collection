"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, PlusCircle, ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [albumCode, setAlbumCode] = useState("");
  const [lastAlbum, setLastAlbum] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("last_panini_album_id");
      if (stored) {
        setLastAlbum(stored);
      }
    }
  }, []);

  const handleCreateAlbum = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/album", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Nu s-a putut crea albumul.");
      const data = await res.json();
      
      localStorage.setItem("last_panini_album_id", data.id);
      router.push(`/album/${data.id}`);
    } catch (err: any) {
      setError("A apărut o eroare la crearea albumului. Încearcă din nou.");
      setIsCreating(false);
    }
  };

  const handleLoadAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = albumCode.trim().toLowerCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/album/${cleanCode}`);
      if (!res.ok) {
        throw new Error("Codul de album introdus nu este valid sau nu mai există.");
      }
      
      localStorage.setItem("last_panini_album_id", cleanCode);
      router.push(`/album/${cleanCode}`);
    } catch (err: any) {
      setError(err.message || "Eroare la încărcarea albumului.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#fbfaf7]">
      <main className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Panini-themed Brand Header */}
        <div className="bg-[#e2001a] text-white p-8 text-center relative overflow-hidden flex flex-col items-center">
          {/* Decorative background shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffcc00] opacity-15 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#ffcc00] opacity-20 rounded-full blur-xl transform -translate-x-6 translate-y-6"></div>
          
          {/* Panini Stylized rectangular logo */}
          <div className="inline-flex items-center justify-center bg-[#e2001a] border-4 border-[#ffcc00] px-6 py-1.5 rounded shadow-lg select-none mb-4 transform hover:scale-105 transition duration-200">
            <span className="text-white font-black tracking-widest text-3xl md:text-4xl" style={{ fontFamily: "Impact, sans-serif" }}>
              PANINI
            </span>
          </div>

          <h1 className="text-xl font-extrabold tracking-tight mt-1 text-[#ffcc00]">ALBUM 2026</h1>
          <p className="text-white text-xs mt-1 font-semibold opacity-90 uppercase tracking-widest">Sticker Tracking & Swap Hub</p>
        </div>

        {/* Content body */}
        <div className="p-6 md:p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-[#e2001a] rounded-xl p-4 text-sm text-center font-bold">
              {error}
            </div>
          )}

          {/* Quick Resume Button */}
          {lastAlbum && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Continuă colecția</h2>
              <button
                onClick={() => router.push(`/album/${lastAlbum}`)}
                className="w-full flex items-center justify-between p-4 bg-[#fbfaf7] hover:bg-[#eae8df] text-[#e2001a] font-bold rounded-xl border border-[#eae8df] transition duration-200 shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-[#e2001a] text-white text-xs px-2.5 py-1 rounded font-black uppercase">
                    {lastAlbum}
                  </div>
                  <span className="text-slate-700 text-sm">Albumul tău activ</span>
                </div>
                <ArrowRight className="w-5 h-5 text-[#ffcc00]" />
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* Create Album */}
            <button
              onClick={handleCreateAlbum}
              disabled={isCreating || isLoading}
              className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-[#e2001a] hover:bg-[#c10014] disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition duration-200 text-base border-b-4 border-[#b20012]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Se generează albumul...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-[#ffcc00]" />
                  <span>Creează un Album Nou</span>
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center text-slate-300 text-xs uppercase font-bold">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4">sau</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Load Album */}
            <form onSubmit={handleLoadAlbum} className="space-y-3">
              <label htmlFor="code" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Introdu codul albumului tău
              </label>
              <div className="flex space-x-2">
                <input
                  id="code"
                  type="text"
                  placeholder="ex: gnby6x"
                  value={albumCode}
                  onChange={(e) => setAlbumCode(e.target.value)}
                  disabled={isCreating || isLoading}
                  maxLength={15}
                  className="flex-1 uppercase font-black tracking-widest text-center px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#e2001a] focus:border-transparent outline-none transition duration-150 text-slate-800 placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={isCreating || isLoading || !albumCode.trim()}
                  className="px-5 py-3 bg-[#ffcc00] hover:bg-[#e0b400] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-extrabold rounded-xl shadow-sm transition duration-150 border-b-4 border-[#e0b400]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Încarcă"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-[#fcfbf9] px-6 py-4 border-t border-slate-50 text-center text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          Sincronizare Cloud &bull; Securizat &bull; Toate dispozitivele
        </div>
      </main>
    </div>
  );
}
