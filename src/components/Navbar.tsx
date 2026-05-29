import React from "react";
import { Search } from "lucide-react";
import { TABS_CONFIG } from "../tabsConfig";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery
}: NavbarProps) {
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Branding Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("feed")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green text-white font-bold text-xl shadow-md shadow-brand-green/20">
            উ
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-brand-dark sm:text-xl">
              উদ্দীপ্ত তরুণ সংঘ
            </h1>
            <span className="text-[10px] text-brand-green font-semibold tracking-wider">
              দাওয়াহ ও দ্বীনি সেবা প্ল্যাটফর্ম
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-brand-muted" />
            </div>
            <input
              type="text"
              placeholder="প্রবন্ধ বা ফোরাম প্রশ্ন অনুসন্ধান করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-brand-dark placeholder-slate-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 transition-all font-sans"
            />
          </div>
        </div>

        {/* Top Actions or Quick Stat badge */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
            দাঈ প্যানেল
          </span>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-white/80 border-t border-slate-100 px-4 overflow-x-auto scrollbar-none scroll-smooth">
        <div className="mx-auto max-w-7xl flex space-x-1 sm:space-x-2 py-2">
          {TABS_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-brand-green text-white shadow-md shadow-brand-green/20"
                    : "text-brand-dark hover:bg-slate-100 hover:text-brand-green"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Search Bar Expansion */}
      <div className="md:hidden px-4 py-2 border-t border-slate-100 bg-white">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-brand-muted" />
          </div>
          <input
            type="text"
            placeholder="প্রবন্ধ অনুসন্ধান..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-4 text-sm text-brand-dark placeholder-slate-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green/20"
          />
        </div>
      </div>
    </header>
  );
}
