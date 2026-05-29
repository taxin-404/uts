import React, { useState } from "react";
import { X, Mail, Lock, ShieldAlert, CheckCircle2, User, HelpCircle, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { Profile } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: Profile, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setStatus({
        type: "error",
        text: "সুপাবেস (Supabase API) ক্লাউড এনভায়রনমেন্ট কনফিগার করা নেই। অনুগ্রহ করে README.md গাইড দেখে কনফিগার করুন এবং ডেমো সিমুলেটর ব্যবহার করুন।"
      });
      return;
    }

    setOauthLoading(true);
    setStatus(null);
    try {
      if (!supabase) throw new Error("Supabase is not initialized");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      // OAuth redirects, so if successful, user gets bounced to Google
    } catch (err: any) {
      console.error("Google login failed:", err);
      setStatus({
        type: "error",
        text: err.message || "গুগল লগইন ট্রিপ ব্যর্থ হয়েছে।"
      });
    } finally {
      setOauthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setStatus({
        type: "error",
        text: "সুপাবেস কনফিগার করা নেই। আপনি কেবল স্থানীয় স্যান্ডবক্স সিমুলেটর বোতাম ব্যবহার করতে পারবেন।"
      });
      return;
    }

    if (!email || !password || (isSignUp && !fullName)) {
      setStatus({ type: "error", text: "দয়া করে সকল তথ্য সঠিকভাবে পূরণ করুন।" });
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      if (!supabase) throw new Error("Supabase is not initialized");

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: fullName,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`
            }
          }
        });

        if (error) throw error;
        setStatus({
          type: "success",
          text: "নিবন্ধন সফল হয়েছে! অনুগ্রহ করে আপনার ইমেল ইনবক্স বা স্প্যাম ফোল্ডার পরীক্ষা করুন।"
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.session) {
          // Fetch backend profile copy or issue login sync
          const dawahToken = data.session.access_token;
          const userMeta = data.user?.user_metadata || {};
          const profile: Profile = {
            id: data.user.id,
            email: data.user.email || "",
            name: userMeta.name || userMeta.full_name || data.user.email?.split("@")[0] || "ব্যবহারকারী",
            role: "user", // Client role fallback, backend sync checks rules
            avatar_url: userMeta.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`
          };
          onAuthSuccess(profile, dawahToken);
          setStatus({ type: "success", text: "লগইন সফল হয়েছে!" });
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err: any) {
      console.error("Email authentication failed:", err);
      setStatus({
        type: "error",
        text: err.message || "অথেনটিকেশন প্রক্রিয়াকরণ ব্যর্থ হয়েছে।"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Header Block with Close Button */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-brand-dark">
              {isSignUp ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "সুপাবেস লগইন গেটওয়ে"}
            </h3>
            <p className="text-xs text-brand-muted mt-1 font-sans">
              নিরাপদ ক্লাউড অথেনটিকেশনের মাধ্যমে যুক্ত হোন
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Status Bar Messages */}
        {status && (
          <div className={`p-4 rounded-xl border flex items-start space-x-2 text-xs font-sans ${
            status.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}>
            {status.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <p className="leading-relaxed">{status.text}</p>
          </div>
        )}

        {/* 1. Google OAuth Authentication Button (Highly Stylized Branding) */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center space-x-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition-all font-sans cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {oauthLoading ? (
              <Loader2 className="h-5 w-5 text-slate-500 animate-spin" />
            ) : (
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Google-লগইন (গুগল সাইন-ইন)</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <span className="relative px-3 bg-white text-xs text-brand-muted uppercase font-mono tracking-widest">
              অথবা ইমেইল দিয়ে
            </span>
          </div>
        </div>

        {/* 2. Email Sign In Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4 font-sans text-sm">
          {isSignUp && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              <label className="block text-xs font-bold text-slate-700">পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="যেমন: জাহিদ হাসান"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">ইমেইল ঠিকানা</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 font-sans">পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="কমপক্ষে ৬টি অক্ষর"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 bg-slate-50/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center rounded-2xl bg-brand-green hover:bg-brand-green/90 active:bg-brand-green text-white font-bold py-3 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-1.5" />
            ) : null}
            <span>{isSignUp ? "নিবন্ধন সম্পন্ন করুন" : "ইমেইল দিয়ে প্রবেশ করুন"}</span>
          </button>
        </form>

        {/* Footer actions for switching Sign Up / In */}
        <div className="text-center pt-2">
          <p className="text-xs text-brand-muted font-sans">
            {isSignUp ? "ইতিমধ্যে অ্যাকাউন্ট আছে?" : "নতুন সদস্য?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatus(null);
              }}
              className="text-brand-green font-bold hover:underline font-sans cursor-pointer"
            >
              {isSignUp ? "এখানে লগইন করুন" : "অ্যাকাউন্ট তৈরি করুন"}
            </button>
          </p>
        </div>

        {/* Simulator Info Box when Supabase is not active */}
        {!isSupabaseConfigured && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex gap-2.5 text-[11px] font-sans text-amber-800">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5">লোকাল ডেমো মোড সক্রিয় আছে</p>
              <p className="text-amber-700 leading-relaxed">
                Supabase credentials কনফিগার না থকায় জেনুইন সাইন-ইন বন্ধ রয়েছে। আপনি পাশের <b>ব্যবহারকারী সিমুলেটর (Auth Toggle)</b> প্যানেলের মাধ্যমে সরাসরি এডমিন বা ইউজার মোড পরীক্ষা করতে পারেন।
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
