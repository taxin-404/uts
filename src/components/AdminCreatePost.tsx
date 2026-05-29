import React, { useState, useRef } from "react";
import { Image, Tag, Send, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { TABS_CONFIG } from "../tabsConfig";

interface AdminCreatePostProps {
  onPostCreated: () => void;
  activeRole: "user" | "admin";
  defaultTab?: string;
  activeToken: string;
}

export default function AdminCreatePost({
  onPostCreated,
  activeRole,
  defaultTab = "feed",
  activeToken
}: AdminCreatePostProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tabType, setTabType] = useState(defaultTab);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter allowed tabs based on active role and static definition
  const allowedTabs = TABS_CONFIG.filter((tab) => {
    if (tab.isStatic) return false;
    if (activeRole === "admin") return true;
    return !tab.requiresAdminPost;
  });

  // ImgBB API uploader implementation
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    setStatusMsg(null);

    // Get API Key from Environment with beautiful developer fallbacks
    const imgbbKey = (import.meta as any).env?.VITE_IMGBB_API_KEY || "";
    if (!imgbbKey || imgbbKey === "your-imgbb-api-key") {
      // Elegant warning with temporary fallback to unspash random to guarantee seamless testing of core UI
      setTimeout(() => {
        const fallbackUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 5000000)}?auto=format&fit=crop&q=80&w=800`;
        setImageUrl(fallbackUrl);
        setIsUploading(false);
        setStatusMsg({
          type: "success",
          text: "লোকাল ডেমো মোড সক্রিয়: পরিবেশ ফাইলে ImgBB কী (VITE_IMGBB_API_KEY) খুঁজে না পাওয়ায় একটি স্বয়ংক্রিয় প্রিমিয়াম ডেমো ব্যানার যুক্ত করা হয়েছে।"
        });
      }, 1000);
      return;
    }

    try {
      // 1. Construct raw FormData
      const formData = new FormData();
      formData.append("image", file);

      // 2. Transmit POST directly to ImgBB secure gateway API
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("ImgBB API Response failed. Please check your key validity.");
      }

      // 3. Digest returns
      const data = await response.json();
      if (data && data.success && data.data && data.data.url) {
        setImageUrl(data.data.url);
        setStatusMsg({
          type: "success",
          text: "আলহামদুলিল্লাহ! আপনার ছবি সফলভাবে ImgBB ক্লাউড স্টোরেজে আপলোড করা হয়েছে এবং ডাইরেক্ট লিঙ্ক সংগৃহীত হয়েছে।"
        });
      } else {
        throw new Error(data.error?.message || "হিসাব অমিল বা ত্রুটিযুক্ত প্রতিক্রিয়া।");
      }
    } catch (err: any) {
      console.error("ImgBB upload failed: ", err);
      setStatusMsg({
        type: "error",
        text: `ছবি আপলোড ব্যর্থ হয়েছে: ${err.message || "ইন্টারনেট কানেকশন বা এপিআই কি যাচাই করুন।"}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMsg({ type: "error", text: "অনুগ্রহ করে শিরোনাম ও বিস্তারিত বর্ণনা প্রদান করুন।" });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          title,
          content,
          image_url: imageUrl || null,
          tab_type: tabType
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "পোস্ট জমা দিতে ব্যর্থ হয়েছে।");
      }

      setTitle("");
      setContent("");
      setImageUrl("");
      setStatusMsg({
        type: "success",
        text: "আলহামদুলিল্লাহ! আপনার পোস্টটি সফলভাবে প্ল্যাটফর্মে প্রকাশিত হয়েছে।"
      });
      onPostCreated();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "সার্ভার সংযোগে সামান্য সমস্যা।" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Admin Safety Alerts */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">নতুন পোস্ট ও প্রবন্ধ প্রকাশ করুন</h2>
          <p className="text-xs text-brand-muted font-sans">
            আপনার লিখিত দানি গবেষণা ও মানবিক কার্যক্রম সবার মাঝে পৌঁছে দিন।
          </p>
        </div>
        <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold leading-none ${
          activeRole === "admin" 
            ? "bg-brand-green/10 text-brand-green" 
            : "bg-brand-blue/10 text-brand-blue"
        }`}>
          {activeRole === "admin" ? "তত্ত্বাবধায়ক মোড" : "সাধারণ ফোরাম প্রশ্নকারী"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-bold text-brand-dark tracking-wide uppercase">পোস্টার শিরোনামসমূহ</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="আকর্ষণীয় ও তথ্যমূলক শিরোনাম লিখুন..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-brand-dark focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-sans transition-all"
          />
        </div>

        {/* Tab Selection & Image Upload Trigger Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-brand-dark tracking-wide uppercase">ট্যাব / বিভাগ নির্বাচন</label>
            <div className="relative">
              <select
                value={tabType}
                onChange={(e) => setTabType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-brand-dark focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-sans transition-all cursor-pointer"
              >
                {allowedTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <ChevronRight className="h-4 w-4 rotate-90" />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-bold text-brand-dark tracking-wide uppercase">মিডিয়া আপলোড (ImgBB API)</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex flex-1 items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-brand-blue hover:bg-slate-100 disabled:opacity-50 transition-all font-sans"
              >
                {isUploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
                <span>{isUploading ? "আপলোড হচ্ছে..." : "ছবি আপলোড করুন"}</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Thumbnail Preview if available */}
        {imageUrl && (
          <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden flex items-center justify-between">
            <img 
              src={imageUrl} 
              alt="Banners" 
              referrerPolicy="no-referrer"
              className="h-10 w-20 object-cover rounded" 
            />
            <span className="text-xs font-mono text-brand-green break-all max-w-xs overflow-hidden truncate pl-2">
              {imageUrl}
            </span>
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs font-bold text-brand-orange px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg"
            >
              মুছে ফেলুন
            </button>
          </div>
        )}

        {/* Article Body Markdown Description */}
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-brand-dark tracking-wide uppercase">প্রবন্ধ বিস্তারিত (মার্কডাউন সমর্থিত)</label>
            <span className="text-[10px] font-mono text-brand-muted bg-slate-100 px-1.5 py-0.5 rounded leading-none">
              Markdown OK
            </span>
          </div>
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="আপনার গুরুত্বপূর্ণ প্রবন্ধের বিষয়বস্তু এখানে বিস্তারিত লিখুন। প্যারাগ্রাফ বা হেডার তৈরি করতে Markdown ফরম্যাট ব্যবহার করতে পারেন..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-dark focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/20 font-sans transition-all"
          />
        </div>

        {/* Submission Logs Banner message notifications */}
        {statusMsg && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2 leading-relaxed ${
            statusMsg.type === "success" 
              ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
              : "bg-red-50 border-red-100 text-red-800"
          }`}>
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            )}
            <span className="font-medium font-sans">{statusMsg.text}</span>
          </div>
        )}

        {/* Submit action trigger */}
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full flex items-center justify-center space-x-2 rounded-xl bg-brand-green py-3 text-sm font-bold text-white hover:bg-brand-green-hover shadow-lg shadow-brand-green/20 disabled:opacity-50 transition-all font-sans cursor-pointer"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isSubmitting ? "প্রকাশ হচ্ছে..." : "পোস্টটি প্রকাশ করুন"}</span>
        </button>
      </form>
    </div>
  );
}
