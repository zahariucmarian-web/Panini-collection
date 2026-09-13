"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, RefreshCw, MessageSquare, Copy, Check, ExternalLink, RefreshCcw, Users, TrendingUp } from "lucide-react";
import { CONFEDERATIONS, Country } from "@/data/countries";

// High-resolution Alpha-3 to Alpha-2 code map for FlagCDN
const CODE_MAP: Record<string, string> = {
  FWC: "panini",
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz", CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct", USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec", NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz", ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no", ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co", ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa"
};

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Input states
  const [myIdInput, setMyIdInput] = useState("");
  const [partnerIdInput, setPartnerIdInput] = useState("");

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loaded album data
  const [myAlbum, setMyAlbum] = useState<any>(null);
  const [partnerAlbum, setPartnerAlbum] = useState<any>(null);

  // Mobile Tabs
  const [activeMobileTab, setActiveMobileTab] = useState<"myOffer" | "partnerOffer">("myOffer");

  // Clipboard copies
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Load from URL query parameters on mount
  useEffect(() => {
    const myParam = searchParams.get("my") || "";
    const partnerParam = searchParams.get("partner") || "";

    if (myParam) setMyIdInput(myParam);
    if (partnerParam) setPartnerIdInput(partnerParam);

    if (myParam || partnerParam) {
      handleCompare(myParam, partnerParam);
    }
  }, [searchParams]);

  const handleCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCompare(myIdInput, partnerIdInput);
  };

  const handleCompare = async (myId: string, partnerId: string) => {
    const cleanMy = myId.trim().toLowerCase();
    const cleanPartner = partnerId.trim().toLowerCase();

    if (!cleanMy && !cleanPartner) return;
    
    setError(null);
    setLoading(true);

    try {
      let myData = null;
      let partnerData = null;

      // Update browser URL query params without reloading to make compare links shareable
      const newParams = new URLSearchParams();
      if (cleanMy) newParams.set("my", cleanMy);
      if (cleanPartner) newParams.set("partner", cleanPartner);
      router.push(`/compare?${newParams.toString()}`);

      if (cleanMy) {
        const res = await fetch(`/api/album/${cleanMy}`);
        if (!res.ok) throw new Error(`Albumul tău (${cleanMy.toUpperCase()}) nu a fost găsit.`);
        myData = await res.json();
      }

      if (cleanPartner) {
        const res = await fetch(`/api/album/${cleanPartner}`);
        if (!res.ok) throw new Error(`Albumul partenerului (${cleanPartner.toUpperCase()}) nu a fost găsit.`);
        partnerData = await res.json();
      }

      setMyAlbum(myData);
      setPartnerAlbum(partnerData);
    } catch (err: any) {
      setError(err.message || "A apărut o eroare la compararea albumelor.");
    } finally {
      setLoading(false);
    }
  };

  // Compute swap results
  const computeSwapMatches = () => {
    if (!myAlbum || !partnerAlbum) return { myOffer: [], partnerOffer: [], perfectMatchesCount: 0 };

    const myStickers = myAlbum.stickers || {};
    const partnerStickers = partnerAlbum.stickers || {};

    const myOffer: { key: string; code: string; num: number; count: number; name: string }[] = [];
    const partnerOffer: { key: string; code: string; num: number; count: number; name: string }[] = [];

    // Helper to find country object
    const findCountry = (code: string): Country | undefined => {
      for (const conf of CONFEDERATIONS) {
        const match = conf.countries.find(c => c.code === code);
        if (match) return match;
      }
      return undefined;
    };

    // Scan all confederations & countries
    CONFEDERATIONS.forEach(conf => {
      conf.countries.forEach(country => {
        for (let i = 1; i <= country.stickersCount; i++) {
          const key = `${country.code} ${i}`;
          const myCount = myStickers[key] || 0;
          const partnerCount = partnerStickers[key] || 0;

          // My duplicates that partner is missing:
          if (myCount > 1 && partnerCount === 0) {
            myOffer.push({
              key,
              code: country.code,
              num: i,
              count: myCount,
              name: country.name
            });
          }

          // Partner duplicates that I am missing:
          if (partnerCount > 1 && myCount === 0) {
            partnerOffer.push({
              key,
              code: country.code,
              num: i,
              count: partnerCount,
              name: country.name
            });
          }
        }
      });
    });

    const perfectMatchesCount = Math.min(myOffer.length, partnerOffer.length);

    return { myOffer, partnerOffer, perfectMatchesCount };
  };

  const { myOffer, partnerOffer, perfectMatchesCount } = computeSwapMatches();

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyTextProposal = () => {
    if (!myAlbum || !partnerAlbum) return;

    const offerStr = myOffer.map(o => o.key).join(", ") || "Nimic";
    const needStr = partnerOffer.map(o => o.key).join(", ") || "Nimic";

    const textToCopy = `♻️ PROPUNERE SCHIMB AUTOMATĂ (Panini 2026 Tracker)

🤝 Comparație între:
👤 Eu (${myAlbum.id.toUpperCase()})
👤 Partener (${partnerAlbum.id.toUpperCase()})

🎁 ÎȚI OFER EU (Dublurile mele de care tu ai nevoie):
👉 ${offerStr}

🎁 ÎMI OFERI TU (Dublurile tale de care eu am nevoie):
👉 ${needStr}

🔗 Detalii complete comparație pe: ${window.location.href}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!myAlbum || !partnerAlbum) return;

    const offerStr = myOffer.map(o => o.key).join(", ") || "Nimic";
    const needStr = partnerOffer.map(o => o.key).join(", ") || "Nimic";

    const text = `♻️ *PROPUNERE SCHIMB AUTOMATĂ (Panini 2026)*

🤝 *Comparație*:
👤 Eu (${myAlbum.id.toUpperCase()})
👤 Partener (${partnerAlbum.id.toUpperCase()})

🎁 *Îți ofer eu* (am dublură și îți lipsește):
👉 ${offerStr}

🎁 *Îmi oferi tu* (ai dublură și îmi lipsește):
👉 ${needStr}

🔗 *Comparație completă online*: ${window.location.href}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#fdfdfb] min-h-screen pb-24">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b-4 border-[#ffcc00] shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => router.push("/")}
            className="p-2 hover:bg-slate-50 text-[#e2001a] rounded-xl transition flex items-center space-x-1.5 font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Acasă</span>
          </button>
          
          <div className="inline-flex items-center justify-center bg-[#e2001a] border-2 border-[#ffcc00] px-3 py-1 rounded shadow transform rotate-[-1deg]" style={{ fontFamily: "Impact, sans-serif" }}>
            <span className="text-white font-black tracking-widest text-base md:text-lg">
              PANINI SWAP
            </span>
          </div>
          
          <div className="w-10"></div>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl md:text-3.5xl font-black text-slate-800 tracking-tight uppercase flex items-center justify-center space-x-2.5">
            <ArrowRightLeft className="w-6.5 h-6.5 text-[#e2001a]" />
            <span className="text-xl md:text-2xl">Match & Swap Hub</span>
          </h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-extrabold uppercase tracking-widest leading-none">Potrivește dublurile tale cu lipsurile prietenilor instant</p>
        </div>

        {/* Inputs form */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-5 md:p-8 max-w-lg mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffcc00] opacity-10 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
          
          <form onSubmit={handleCompareSubmit} className="space-y-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* My ID */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Codul tău de album
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">👤</span>
                  <input
                    type="text"
                    placeholder="ex: test-marian"
                    value={myIdInput}
                    onChange={(e) => setMyIdInput(e.target.value.replace(/\s/g, ""))}
                    className="w-full pl-8 pr-3 py-2.5 text-center font-extrabold text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-[#e2001a] focus:border-transparent transition text-slate-800 uppercase"
                  />
                </div>
              </div>

              {/* Partner ID */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Codul albumului partenerului
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">👤</span>
                  <input
                    type="text"
                    placeholder="ex: test-ozana"
                    value={partnerIdInput}
                    onChange={(e) => setPartnerIdInput(e.target.value.replace(/\s/g, ""))}
                    className="w-full pl-8 pr-3 py-2.5 text-center font-extrabold text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-[#e2001a] focus:border-transparent transition text-slate-800 uppercase"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-[#e2001a] text-center bg-rose-50 border border-rose-100 p-3 rounded-xl animate-shake">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (!myIdInput.trim() && !partnerIdInput.trim())}
              className="w-full py-3 bg-[#e2001a] hover:bg-[#c10014] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg border-b-4 border-[#b20012] flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent disabled:shadow-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Se analizează listele...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 text-[#ffcc00]" />
                  <span>Calculează Potrivirile</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results section */}
        {myAlbum && partnerAlbum && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Visual Balance Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffcc00] opacity-5 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#ffcc00] text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      Meciuri: {perfectMatchesCount}
                    </span>
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{myAlbum.id.toUpperCase()} ↔ {partnerAlbum.id.toUpperCase()}</span>
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black tracking-tight mt-1 text-[#ffcc00]">Balanta Schimbului</h2>
                  <p className="text-xs text-slate-300 font-medium">Fiecare are dubluri de care celălalt are nevoie. Poți trimite oferta pe WhatsApp!</p>
                </div>

                {/* Progress Bar of balance */}
                <div className="flex-1 max-w-sm space-y-2">
                  <div className="flex justify-between text-xs font-extrabold uppercase text-slate-400">
                    <span>Eu ({myOffer.length})</span>
                    <span>El ({partnerOffer.length})</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 flex overflow-hidden p-0.5">
                    {myOffer.length + partnerOffer.length === 0 ? (
                      <div className="w-full bg-slate-700 h-2 rounded-full"></div>
                    ) : (
                      <>
                        <div 
                          className="bg-[#e2001a] h-2 rounded-l-full transition-all duration-500" 
                          style={{ width: `${(myOffer.length / (myOffer.length + partnerOffer.length)) * 100}%` }}
                        ></div>
                        <div 
                          className="bg-[#ffcc00] h-2 rounded-r-full transition-all duration-500" 
                          style={{ width: `${(partnerOffer.length / (myOffer.length + partnerOffer.length)) * 100}%` }}
                        ></div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Share Bar */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
              <div className="text-left">
                <p className="font-extrabold text-emerald-800 text-sm flex items-center gap-1.5 leading-none">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Schimbul este optimizat și gata!</span>
                </p>
                <p className="text-[11px] text-emerald-600/80 font-bold mt-1">Poți deschide direct WhatsApp cu textul pre-formatat automat.</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md transition border-b-2 border-emerald-800"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Schimb pe WhatsApp</span>
                </button>

                <button
                  onClick={handleCopyTextProposal}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-sm transition"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Copiat!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiază Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 shadow-sm transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">Copiat!</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      <span>Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile-Friendly tab navigation (visible only on mobile screen widths) */}
            <div className="flex md:hidden bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setActiveMobileTab("myOffer")}
                className={`flex-1 py-3 text-center text-xs font-black uppercase rounded-xl transition flex items-center justify-center space-x-2 ${
                  activeMobileTab === "myOffer"
                    ? "bg-[#e2001a] text-white shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🎁 Oferi Tu</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeMobileTab === "myOffer" ? "bg-white text-slate-800" : "bg-slate-200 text-slate-600"}`}>
                  {myOffer.length}
                </span>
              </button>
              
              <button
                onClick={() => setActiveMobileTab("partnerOffer")}
                className={`flex-1 py-3 text-center text-xs font-black uppercase rounded-xl transition flex items-center justify-center space-x-2 ${
                  activeMobileTab === "partnerOffer"
                    ? "bg-[#ffcc00] text-slate-900 shadow-md"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🎁 Îți oferă El</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeMobileTab === "partnerOffer" ? "bg-slate-900 text-[#ffcc00]" : "bg-slate-200 text-slate-600"}`}>
                  {partnerOffer.length}
                </span>
              </button>
            </div>

            {/* Results Grids (Desktop: side-by-side, Mobile: controlled by tab state) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Column A: My Offer */}
              <div className={`bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden transition-all duration-300 ${
                activeMobileTab === "myOffer" ? "block" : "hidden md:block"
              }`}>
                <div className="bg-[#e2001a] text-white p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base tracking-tight">🎁 Oferi tu (👤 {myAlbum.id.toUpperCase()})</h3>
                    <p className="text-[9px] text-white/80 font-black uppercase mt-0.5">Dublurile tale de care el are nevoie</p>
                  </div>
                  <span className="bg-[#ffcc00] text-slate-900 text-xs font-black px-3 py-1 rounded-full shadow-md">
                    {myOffer.length} buc.
                  </span>
                </div>

                <div className="p-4 md:p-5 max-h-[500px] overflow-y-auto">
                  {myOffer.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-bold text-sm space-y-2">
                      <p className="text-3xl">😢</p>
                      <p>Nu ai dubluri pe care el să nu le dețină.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {myOffer.map(sticker => (
                        <div key={sticker.key} className="bg-[#fbfaf7] border border-slate-100/60 rounded-2xl p-3 flex items-center space-x-3 hover:shadow-md transition">
                          {sticker.code === "FWC" ? (
                            <span className="bg-[#e2001a] border border-[#ffcc00] text-white px-1.5 py-0.5 rounded font-black text-[7px] tracking-wider leading-none shadow-sm transform rotate-[-2deg]">PANINI</span>
                          ) : (
                            <img 
                              src={`https://flagcdn.com/w20/${CODE_MAP[sticker.code] || sticker.code.toLowerCase()}.png`} 
                              alt={`${sticker.name} flag`} 
                              className="w-5.5 h-4 object-cover rounded shadow-sm border border-slate-200/50 flex-shrink-0"
                            />
                          )}
                          <div className="text-left leading-tight">
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">{sticker.code}</p>
                            <p className="text-sm font-black text-slate-800 mt-0.5 leading-none">{sticker.num}</p>
                            {sticker.count > 2 && (
                              <p className="text-[8px] font-black text-emerald-600 mt-1 leading-none">x{sticker.count}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Column B: Partner Offer */}
              <div className={`bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden transition-all duration-300 ${
                activeMobileTab === "partnerOffer" ? "block" : "hidden md:block"
              }`}>
                <div className="bg-[#ffcc00] text-slate-900 p-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base tracking-tight">🎁 Îți oferă el (👤 {partnerAlbum.id.toUpperCase()})</h3>
                    <p className="text-[9px] text-slate-800/80 font-black uppercase mt-0.5">Dublurile lui de care tu ai nevoie</p>
                  </div>
                  <span className="bg-[#e2001a] text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                    {partnerOffer.length} buc.
                  </span>
                </div>

                <div className="p-4 md:p-5 max-h-[500px] overflow-y-auto">
                  {partnerOffer.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-bold text-sm space-y-2">
                      <p className="text-3xl">😢</p>
                      <p>El nu are dubluri de care tu să ai nevoie.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {partnerOffer.map(sticker => (
                        <div key={sticker.key} className="bg-[#fbfaf7] border border-slate-100/60 rounded-2xl p-3 flex items-center space-x-3 hover:shadow-md transition">
                          {sticker.code === "FWC" ? (
                            <span className="bg-[#e2001a] border border-[#ffcc00] text-white px-1.5 py-0.5 rounded font-black text-[7px] tracking-wider leading-none shadow-sm transform rotate-[-2deg]">PANINI</span>
                          ) : (
                            <img 
                              src={`https://flagcdn.com/w20/${CODE_MAP[sticker.code] || sticker.code.toLowerCase()}.png`} 
                              alt={`${sticker.name} flag`} 
                              className="w-5.5 h-4 object-cover rounded shadow-sm border border-slate-200/50 flex-shrink-0"
                            />
                          )}
                          <div className="text-left leading-tight">
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none">{sticker.code}</p>
                            <p className="text-sm font-black text-slate-800 mt-0.5 leading-none">{sticker.num}</p>
                            {sticker.count > 2 && (
                              <p className="text-[8px] font-black text-emerald-600 mt-1 leading-none">x{sticker.count}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#fbfaf7]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-12 h-12 text-[#e2001a] animate-spin" />
          <h2 className="text-lg font-bold text-slate-700 animate-pulse">Se încarcă modul de comparare...</h2>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
