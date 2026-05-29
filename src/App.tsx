import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainFeed from "./components/MainFeed";
import AuthModal from "./components/AuthModal";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { Profile, SystemStatus } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authenticated Token Generation Helper
  // If we are in real Supabase mode, this is a real JWT token.
  // In our beautiful simulator, we output role keys ("auth-admin" or "auth-user") 
  // that our backend translates instantly into corresponding profiles!
  const [activeToken, setActiveToken] = useState("");

  // 1. Supabase Event subscription to monitor remote logins / Google redirection tokens
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const token = session.access_token;
          localStorage.setItem("dawah_auth_token", token);
          setActiveToken(token);
        } else {
          const currentToken = localStorage.getItem("dawah_auth_token") || "";
          if (currentToken && !currentToken.startsWith("auth-")) {
            localStorage.setItem("dawah_auth_token", "");
            setActiveToken("");
            setCurrentUser(null);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    // 2. Recover active token from localStorage on boot (or empty/admin defaults)
    const defaultToken = isSupabaseConfigured ? "" : "auth-admin";
    const storedToken = localStorage.getItem("dawah_auth_token") !== null 
      ? (localStorage.getItem("dawah_auth_token") || "") 
      : defaultToken;

    localStorage.setItem("dawah_auth_token", storedToken);
    setActiveToken(storedToken);

    // 3. Query currentUser Profile from endpoint
    const fetchProfile = async () => {
      if (!storedToken) {
        setCurrentUser(null);
        return;
      }
      try {
        const response = await fetch("/api/auth/profile", {
          headers: {
            "Authorization": `Bearer ${storedToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.profile);
        } else {
          // If no token was configured, let's auto-login as admin in simulator to have premium experience
          if (storedToken === "auth-admin") {
            const adminUser: Profile = {
              id: "admin-id",
              email: "admin@torunshongho.org",
              name: "তত্ত্বাবধায়ক (Admin Panel)",
              role: "admin",
              avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=admin"
            };
            setCurrentUser(adminUser);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
    };

    fetchProfile();

    // 4. Query system health and active database type
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/system/status");
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
        }
      } catch (err) {
        console.error("System connection check failed: ", err);
      }
    };

    fetchStatus();
  }, [activeToken]);

  const handleUpdateUser = async (profile: Profile | null) => {
    setCurrentUser(profile);
    if (!profile) {
      setActiveToken("");
      localStorage.setItem("dawah_auth_token", "");
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } else {
      const newToken = profile.role === "admin" ? "auth-admin" : "auth-user";
      setActiveToken(newToken);
      localStorage.setItem("dawah_auth_token", newToken);
    }
  };

  const handleSelectTopicFromSidebar = (topicName: string) => {
    setSearchQuery(topicName);
    setActiveTab("feed"); // Redirect search query back to MainFeed feed tab
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col font-sans antialiased selection:bg-brand-green/20 selection:text-brand-dark">
      
      {/* Dynamic System Alert Banner for Active Simulation Info */}
      {systemStatus && systemStatus.database === "local-memory" && (
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-xs font-semibold leading-relaxed tracking-wide shadow-sm flex items-center justify-center space-x-2">
          <span>🔔 <b>স্যান্ডবক্স ডেমো মোড সক্রিয়:</b> ডাটাবেস ক্লাউড কানেকশন (Supabase) সেটআপ করার পূর্বে সহজেই অ্যাপের ভোট, প্রশ্ন, ক্যাটাগরি ও ইমেজিং কার্যকারিতা পরীক্ষা করুন।</span>
        </div>
      )}

      {/* Modern navigation components */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Structural responsive body container Grid */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main feeds lists area with custom animations and state transitions */}
          <div className="flex-1 w-full order-2 lg:order-1">
            <MainFeed
              activeTab={activeTab}
              currentUser={currentUser}
              searchQuery={searchQuery}
              activeToken={activeToken}
            />
          </div>

          {/* Left/Right styled Sidebar panel info columns */}
          <div className="w-full lg:w-80 order-1 lg:order-2 shrink-0">
            <Sidebar
              currentUser={currentUser}
              setCurrentUser={handleUpdateUser}
              systemStatus={systemStatus}
              onSelectTopic={handleSelectTopicFromSidebar}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          </div>

        </div>
      </main>

      {/* Auth Modal Portal for Real Cloud / Google Integrations */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile, token) => {
          setCurrentUser(profile);
          setActiveToken(token);
          localStorage.setItem("dawah_auth_token", token);
          setIsAuthModalOpen(false);
        }}
      />

      {/* Tiny footers with organizational credits mapping */}
      <footer className="border-t border-slate-200/65 bg-white py-6 mt-12 text-center text-xs text-brand-muted font-sans col-span-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© ২০২৬ উদ্দীপ্ত তরুণ সংঘ। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center space-x-4">
            <a href="#feed" onClick={() => setActiveTab("guidelines")} className="hover:text-brand-green">ব্যবহারের শর্তাবলী</a>
            <a href="#feed" onClick={() => setActiveTab("contribute")} className="hover:text-brand-green">যোগদান ও দান</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
