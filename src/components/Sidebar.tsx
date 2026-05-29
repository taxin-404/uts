import React from "react";
import { BookOpen, UserCheck, HelpCircle, ShieldAlert, Wifi, Globe, Database, Lock, HelpCircle as HelpIcon } from "lucide-react";
import { Profile, SystemStatus } from "../types";

interface SidebarProps {
  currentUser: Profile | null;
  setCurrentUser: (profile: Profile | null) => void;
  systemStatus: SystemStatus | null;
  onSelectTopic: (topic: string) => void;
  onOpenAuthModal?: () => void;
}

export default function Sidebar({
  currentUser,
  setCurrentUser,
  systemStatus,
  onSelectTopic,
  onOpenAuthModal
}: SidebarProps) {

  // Pre-seed simulator user credentials
  const simulateLogin = (role: "guest" | "user" | "admin") => {
    if (role === "guest") {
      setCurrentUser(null);
      localStorage.setItem("dawah_auth_token", "");
    } else if (role === "user") {
      const u: Profile = {
        id: "user-id",
        email: "user@example.com",
        name: "মেহেদী হাসান",
        role: "user",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=user"
      };
      setCurrentUser(u);
      localStorage.setItem("dawah_auth_token", "auth-user");
    } else {
      const a: Profile = {
        id: "admin-id",
        email: "admin@torunshongho.org",
        name: "তত্ত্বাবধায়ক (Admin Panel)",
        role: "admin",
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=admin"
      };
      setCurrentUser(a);
      localStorage.setItem("dawah_auth_token", "auth-admin");
    }
  };

  const categories = [
    { name: "আকীদাহ ও বিশ্বাস", count: 18 },
    { name: "কুরআন ও হাদিস চর্চা", count: 24 },
    { name: "সমাজ সংস্কার ও দাওয়াহ", count: 15 },
    { name: "ইসলামী বিধিবিধান ও ফিকহ", count: 32 },
    { name: "ইতিহাস ও ঐতিহ্য", count: 9 },
    { name: "তরুণদের চরিত্র গঠন", count: 21 },
  ];

  return (
    <aside className="w-full lg:w-80 flex flex-col space-y-6">
      
      {/* 📜 Quranic Verse Banner Card (Strictly Styled) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green to-emerald-800 p-6 text-white shadow-xl shadow-brand-green/10">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <BookOpen className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col space-y-4">
          <span className="inline-flex self-start rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wider uppercase">
            আজকের বাণী
          </span>
          <blockquote className="font-sans text-base leading-relaxed font-medium">
            "আর তোমাদের মধ্যে এমন একটি দল যেন থাকে যারা কল্যাণের দিকে আহ্বান করবে এবং সৎকাজের আদেশ দিবে ও অসৎকাজে নিষেধ করবে, আর তারাই সফলকাম।"
          </blockquote>
          <cite className="not-italic text-xs text-emerald-100 font-semibold self-end font-sans">
            — সূরা আল-ইমরান: ১০৪
          </cite>
        </div>
      </div>

      {/* 🔐 Sandbox User Session Simulator Control Box (Essential for Boilerplate Testing) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
          <UserCheck className="h-5 w-5 text-brand-blue" />
          <h3 className="font-bold text-sm text-brand-dark">ব্যবহারকারী সিমুলেটর (Auth Toggle)</h3>
        </div>
        
        <p className="text-xs text-brand-muted leading-relaxed font-sans">
          নিচে বোতামগুলো ক্লিক করে আপনার সক্রিয় ইউজার চরিত্র পরিবর্তন করুন যাতে সুপাবেস বা লোকাল RLS সিকিউরিটির কার্যকারিতা পরীক্ষা করতে পারেন:
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => simulateLogin("admin")}
            className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              currentUser?.role === "admin"
                ? "bg-brand-green text-white shadow"
                : "bg-slate-100 text-brand-dark hover:bg-slate-200"
            }`}
          >
            তত্ত্বাবধায়ক
          </button>
          <button
            onClick={() => simulateLogin("user")}
            className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              currentUser?.role === "user"
                ? "bg-brand-blue text-white shadow"
                : "bg-slate-100 text-brand-dark hover:bg-slate-200"
            }`}
          >
            সাধারণ সদস্য
          </button>
          <button
            onClick={() => simulateLogin("guest")}
            className={`px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              currentUser === null
                ? "bg-brand-orange text-white shadow"
                : "bg-slate-100 text-brand-dark hover:bg-slate-200"
            }`}
          >
            অতিথি পাঠক
          </button>
        </div>

        {/* Real Cloud Login trigger button entry */}
        {onOpenAuthModal && (
          <div className="pt-2 border-t border-slate-100/80">
            <button
              onClick={onOpenAuthModal}
              className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-850 hover:from-slate-950 hover:to-slate-900 active:scale-[0.99] text-white text-[11px] font-bold py-2 px-3 transition-all cursor-pointer shadow-sm shadow-slate-950/5 border border-slate-800"
            >
              <Lock className="h-3 w-3 text-brand-green" />
              <span>সুপাবেস লগইন (Google OAuth)</span>
            </button>
          </div>
        )}

        {/* Display Current Role parameters */}
        <div className="rounded-xl bg-slate-50 p-3 flex items-center space-x-3 text-xs border border-slate-100">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-white border border-slate-200">
            <img 
              src={currentUser?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=guest"} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover" 
            />
          </div>
          <div>
            <div className="font-bold text-brand-dark">
              {currentUser?.name || "অতিথি পাঠক"}
            </div>
            <div className="text-[10px] text-brand-muted font-mono flex items-center space-x-1">
              <span>ভূমিকা:</span>
              <span className={`font-semibold ${
                currentUser?.role === 'admin' ? 'text-brand-green' : currentUser?.role === 'user' ? 'text-brand-blue' : 'text-brand-orange'
              }`}>
                {currentUser?.role === 'admin' ? 'SYSTEM-ADMIN' : currentUser?.role === 'user' ? 'REGISTERED-USER' : 'GUEST-READER'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 📡 Platform Live System Connection Logger Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
            <h3 className="font-bold text-sm text-brand-dark leading-none">কানেকশন স্ট্যাটাস</h3>
          </div>
          <span className="text-[10px] font-mono rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 font-semibold uppercase">
            LIVE
          </span>
        </div>

        <div className="space-y-3 text-xs font-sans">
          <div className="flex justify-between items-center text-brand-dark">
            <span className="text-brand-muted flex items-center space-x-1">
              <Database className="h-3 w-3" />
              <span>ডাটাবেস উৎস:</span>
            </span>
            <span className={`font-mono font-bold ${systemStatus?.database === 'supabase' ? 'text-brand-green' : 'text-brand-blue'}`}>
              {systemStatus?.database === 'supabase' ? 'Supabase cloud' : 'Local Memory'}
            </span>
          </div>

          <p className="text-[11px] text-emerald-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50 leading-relaxed font-sans">
            {systemStatus?.msg || "অ্যাপের ডেটা সংযোগ সফলভাবে প্রতিষ্ঠিত হয়েছে।"}
          </p>
        </div>
      </div>

      {/* 🏷️ Trending Categories list */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-brand-dark border-b border-slate-100 pb-2">
          আলোচিত বিষয়সমূহ
        </h3>
        <div className="flex flex-col space-y-2">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTopic(cat.name)}
              className="flex justify-between items-center text-xs text-brand-muted hover:text-brand-green text-left font-sans py-1 transition-all"
            >
              <span>#{cat.name}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-500 font-bold">
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
