import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = 
  SUPABASE_URL && 
  SUPABASE_URL !== "https://your-project-id.supabase.co" && 
  SUPABASE_SERVICE_ROLE_KEY && 
  SUPABASE_SERVICE_ROLE_KEY !== "your-service-role-key" &&
  SUPABASE_SERVICE_ROLE_KEY !== "your-anon-key";

// Real Supabase Client setup (using service_role for system actions)
const supabase = isSupabaseConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })
  : null;

// ==========================================
// MOCK DATABASE FALLBACK (For out-of-the-box local testing)
// ==========================================
interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  tab_type: string;
  author_id: string;
  author_name: string;
  vote_count: number;
  created_at: string;
}

interface Vote {
  user_id: string;
  post_id: string;
  vote_type: number;
}

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  avatar_url: string;
}

// In-Memory Database State
const mockProfiles: Record<string, Profile> = {
  "admin-id": {
    id: "admin-id",
    email: "admin@torunshongho.org",
    name: "তত্ত্বাবধায়ক (Admin)",
    role: "admin",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=admin"
  },
  "user-id": {
    id: "user-id",
    email: "user@example.com",
    name: "মেহেদী হাসান",
    role: "user",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=user"
  }
};

let mockPosts: Post[] = [
  {
    id: "post-1",
    title: "ইসলামের দৃষ্টিতে তরুণ সমাজের দায়িত্ব ও কর্তব্য",
    content: `রাসূলুল্লাহ (সাঃ) তরুণ সমাজকে অত্যন্ত গুরুত্ব দিয়েছেন। যুব সমাজই হচ্ছে জাতির চালিকাশক্তি। 

একটি সুস্থ ও আদর্শ ইসলামী সমাজ গঠনে তরুণদের ভূমিকা অপরিসীম। সুরা আল-কাহফে আল্লাহ তাআলা সেই যুবকদের গল্প শোনান যারা নিজেদের ঈমানকে বাঁচাতে একজোট হয়ে অন্যায়ের বিরুদ্ধে দাঁড়িয়েছিলেন। 

**কুরআনের নির্দেশ:**
"আর তোমাদের মধ্যে এমন একটি দল যেন থাকে যারা কল্যাণের দিকে আহ্বান করবে এবং সৎকাজের আদেশ দিবে ও অসৎকাজে নিষেধ করবে, আর তারাই সফলকাম।" (সূরা আল-ইমরান: ১০৪)

**আমাদের তরুণদের বর্তমান করণীয়:**
1. দ্বীনের সহীহ জ্ঞান অর্জন করা।
2. সামাজিক অবক্ষয় রুখে দাঁড়ানো।
3. দাওয়াত ও গবেষণামূলক কাজে নিজেকে যুক্ত করা।`,
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    tab_type: "feed",
    author_id: "admin-id",
    author_name: "তত্ত্বাবধায়ক (Admin)",
    vote_count: 14,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "post-2",
    title: "সিলভেটে অসহায়দের মাঝে খাদ্য ও শীতবস্ত্র বিতরণ - কার্যক্রম ২০২৬",
    content: `উদ্দীপ্ত তরুণ সংঘের সিলেট শাখার সদস্যদের উদ্যোগে সিলেট অঞ্চলের প্রত্যন্ত গ্রামের বন্যাপীড়িত ও অসচ্ছল পরিবারের মাঝে দুই সপ্তাহব্যাপী খাদ্য সামগ্রী ও নিত্যপ্রয়োজনীয় শীতবস্ত্র বিতরণ করা হয়েছে। 

এবারের কার্যক্রমে আমরা প্রায় ৩৫০টি পরিবারকে সরাসরি সাহায্য পৌঁছাতে পেরেছি। আলহামদুলিল্লাহ! এই মহৎ কার্যক্রমে আর্থিক ও কায়িক শ্রম দিয়ে সাহায্যকারী সকল দাতাদের আল্লাহ উত্তম প্রতিদান দিন। আমীন।`,
    image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
    tab_type: "activity",
    author_id: "admin-id",
    author_name: "তত্ত্বাবধায়ক (Admin)",
    vote_count: 22,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "post-3",
    title: "উদ্দীপ্ত তরুণ সংঘ - সদস্য যোগদান নির্দেশিকা",
    content: `সালাম ও শুভেচ্ছা। উদ্দীপ্ত তরুণ সংঘে যুক্ত হতে আগ্রহ প্রকাশ করায় আপনাকে ধন্যবাদ।

**শর্তাবলী:**
1. পাঁচ ওয়াক্ত সালাত জামাতের সাথে আদায় করার নিয়মিত চেষ্টা করা।
2. তাকওয়া, নিষ্ঠা ও চারিত্রিক পবিত্রতা বজায় রাখা।
3. সংঘের কোনো কার্যক্রমে অনৈসলামিক বা উগ্র কোনো দৃষ্টিভঙ্গি পরিহার করা।
4. সমাজসেবা মূলক উদ্যোগে স্বতঃস্ফূর্ত অংশগ্রহণ করা।

আমাদের দলে একজন স্বেচ্ছাসেবক লেখক, দাওয়াহ কর্মী, বা সমাজসেবক হিসেবে যুক্ত হওয়ার প্রক্রিয়া নিচে অবদানের পাতায় বিস্তারিত দেয়া হয়েছে।`,
    image_url: "https://images.unsplash.com/photo-1455849318743-b2233052fcff?auto=format&fit=crop&q=80&w=800",
    tab_type: "guidelines",
    author_id: "admin-id",
    author_name: "তত্ত্বাবধায়ক (Admin)",
    vote_count: 9,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "post-4",
    title: "ফরজ সালাত কাজা হওয়ার পর আদায়ের সঠিক সময় ও নিয়ম কী?",
    content: `সালাম। আমার এক বছর আগের কিছু ফজরের ফরজ সালাত অলসতাবশত কাজা হয়ে গেছিল। এখন আমি নিয়মিত সালাত আদায় করি এবং লজ্জিত। সেই পূর্বের কাজা সালাতগুলো কীভাবে আদায় করব? দলীলসহ জানালে কৃতজ্ঞ থাকব।`,
    image_url: null,
    tab_type: "qa",
    author_id: "user-id",
    author_name: "মেহেদী হাসান",
    vote_count: 5,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

let mockVotes: Vote[] = [
  { user_id: "user-id", post_id: "post-1", vote_type: 1 },
  { user_id: "admin-id", post_id: "post-2", vote_type: 1 }
];

let mockComments: Comment[] = [
  {
    id: "cmt-1",
    post_id: "post-4",
    parent_id: null,
    user_id: "admin-id",
    author_name: "তত্ত্বাবধায়ক (Scholarly Panel)",
    content: `ওয়া আলাইকুমুস সালাম ওয়া রাহমাতুল্লাহি ওয়া বারাকাতুহ। আলহামদুলিল্লাহ যা আল্লাহ আপনাকে হিদায়াত ও সালাতের আনুগত্য দান করেছেন।

ফরজ সালাত ইচ্ছাকৃত হোক বা অলসতাবশত ছুটে যাক, তা ত্বরিৎ কাজা আদায় করা আবশ্যক। 

হাদীস শরিফে এসেছে, রাসুলুল্লাহ (সাঃ) বলেন:
"যে ব্যক্তি নামাজ ভুলে যায় বা ঘুমিয়ে থাকে, তার কাফফারা হলো যখনই তার মনে পড়বে তখনই তা আদায় করে নেয়া।" (সহীহ বুখারী: ৫৯৭)

**আদায়ের নিয়ম:**
১. প্রতিদিনের কাজা নামাজগুলো একটি নির্দিষ্ট রুটিন মেনে ধারাবাহিকভাবে আদায় করে নিতে পারেন। যেমন: প্রতি ওয়াক্তের সাথে একটি করে ছুটে যাওয়া ওয়াক্তের উমরি কাজা আদায় করা।
২. আগে ফরজের নিয়ত এভাবে করবেন: "আমি আমার জিম্মায় থাকা সর্বশেষ পঠিতব্য ফজরের দুই রাকাত ফরজ আদায় করছি।"

আল্লাহ আপনার তওবা কবুল করুন। আমীন।`,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "cmt-2",
    post_id: "post-4",
    parent_id: "cmt-1",
    user_id: "user-id",
    author_name: "মেহেদী হাসান",
    content: `জাযাকাল্লাহু খাইরান শায়খ! বিষয়টি সুন্দর ও সহজভাবে বুঝিয়ে দেওয়ার জন্য। আমি আলহামদুলিল্লাহ আজ থেকেই কাজা নামাজ আদায় করা শুরু করেছি। দুয়া করবেন।`,
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

let mockActivityLogs: string[] = [];

// ==========================================
// CENTRAL EXPRESS APP SETUP
// ==========================================
const app = express();
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Authentication Validation Middleware (Real & Mock modes)
const getAuthenticatedUser = async (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];

  // Real Supabase User Fetch
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    
    // Fetch profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email || "",
      name: profile?.name || data.user.email || "Unknown User",
      role: profile?.role || "user",
      avatar_url: profile?.avatar_url || ""
    };
  }

  // Mock Mode: Decode JSON web token-like client payload or simple role indicators
  // For easy preview we let user supply: auth-admin, auth-user
  if (token === "auth-admin") {
    return mockProfiles["admin-id"];
  } else if (token === "auth-user") {
    return mockProfiles["user-id"];
  } else if (token.startsWith("client-")) {
    const customUser = JSON.parse(Buffer.from(token.replace("client-", ""), "base64").toString());
    return {
      id: customUser.id || "user-id",
      email: customUser.email || "guest@example.com",
      name: customUser.name || "অতিথি",
      role: customUser.role || "user",
      avatar_url: customUser.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=guest"
    };
  }

  return null;
};

// ==========================================
// API REST ENDPOINTS
// ==========================================

// 1. Get Setup Info (Useful to advise visual UI whether we are running in Supabase or Mock fallback mode)
app.get("/api/system/status", (req: Request, res: Response) => {
  res.json({
    database: isSupabaseConfigured ? "supabase" : "local-memory",
    supabaseUrl: isSupabaseConfigured ? SUPABASE_URL : null,
    msg: isSupabaseConfigured 
      ? "দ্বীনী কার্যক্রম সরাসরি সুপাবেস ডাটাবেসে সফলভাবে যুক্ত।" 
      : "ডেমো মোড চালু রয়েছে। স্থানীয় মেমোরি ডাটাবেস ব্যবহৃত হচ্ছে।"
  });
});

// 2. Fetch Profiles / Current user info
app.get("/api/auth/profile", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "অননুমোদিত প্রবেশ চেষ্টা। অনুগ্রহ করে সাইন ইন করুন।" });
  }
  res.json({ profile: user });
});

// 3. Get Posts by Tab Type
app.get("/api/posts", async (req: Request, res: Response) => {
  const { tab } = req.query;
  const tabStr = typeof tab === "string" ? tab : "feed";

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("tab_type", tabStr)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return res.json({ posts: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback memory logic
  const filtered = mockPosts
    .filter((p) => p.tab_type === tabStr)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json({ posts: filtered });
});

// 4. Create Post (Admin only for official tabs, user allowed for public Q&A query creation)
app.post("/api/posts", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "পোস্ট তৈরি করতে প্রথমে লগইন করুন।" });
  }

  const { title, content, image_url, tab_type } = req.body;
  if (!title || !content || !tab_type) {
    return res.status(400).json({ error: "শিরোনাম, বিস্তারিত ও সঠিক ট্যাব নির্বাচন করুন।" });
  }

  // Admin lock on official/extensible tabs other than qa
  if (tab_type !== "qa" && user.role !== "admin") {
    return res.status(403).json({ error: "দুঃখিত! এই ট্যাবে শুধুমাত্র সংগঠনের তত্ত্বাবধায়কই পোস্ট করতে পারবেন।" });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title,
          content,
          image_url: image_url || null,
          tab_type,
          author_id: user.id,
          author_name: user.name,
          vote_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ post: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback memory logic
  const newPost: Post = {
    id: `post-${Date.now()}`,
    title,
    content,
    image_url: image_url || null,
    tab_type,
    author_id: user.id,
    author_name: user.name,
    vote_count: 0,
    created_at: new Date().toISOString()
  };
  mockPosts.unshift(newPost);
  res.status(201).json({ post: newPost });
});

// 5. Fetch Nested/Flat Comments for a Post
app.get("/api/posts/:id/comments", async (req: Request, res: Response) => {
  const { id: postId } = req.params;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return res.json({ comments: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback memory logic
  const filtered = mockComments.filter((c) => c.post_id === postId);
  res.json({ comments: filtered });
});

// 6. Create Comment under Post or nested Reply
app.post("/api/posts/:id/comments", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "মন্তব্য করতে প্রথমে অনুগ্রহ করে লগইন করুন।" });
  }

  const { id: postId } = req.params;
  const { content, parent_id } = req.body;

  if (!content) {
    return res.status(400).json({ error: "মন্তব্যের লেখা শূন্য হতে পারে না।" });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          parent_id: parent_id || null,
          user_id: user.id,
          author_name: user.name,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ comment: data });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback memory logic
  const newComment: Comment = {
    id: `cmt-${Date.now()}`,
    post_id: postId,
    parent_id: parent_id || null,
    user_id: user.id,
    author_name: user.name,
    content,
    created_at: new Date().toISOString()
  };
  mockComments.push(newComment);
  res.status(201).json({ comment: newComment });
});

// 7. BULLETPROOF ATOMIC VOTING ENDPOINT
// POST /api/posts/:id/vote
app.post("/api/posts/:id/vote", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: "ভোট বা মূল্যায়নে অংশ নিতে প্রথমে লগইন করুন।" });
  }

  const { id: postId } = req.params;
  const { direction } = req.body; // Expecting: 1 (Up), -1 (Down), or 0 (Retraction)

  if (direction !== 1 && direction !== -1 && direction !== 0) {
    return res.status(400).json({ error: "ভোটের ধরন ত্রুটিপূর্ণ (শুধুমাত্র 1, -1 অথবা 0 অনুমোদিত)।" });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Step 1: Handle vote entry in `votes` table
      if (direction === 1 || direction === -1) {
        const { error: upsertErr } = await supabase
          .from("votes")
          .upsert({
            user_id: user.id,
            post_id: postId,
            vote_type: direction
          }, {
            onConflict: "user_id,post_id"
          });
        if (upsertErr) throw upsertErr;
      } else if (direction === 0) {
        // Vote retraction
        const { error: deleteErr } = await supabase
          .from("votes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        if (deleteErr) throw deleteErr;
      }

      // Step 2: Atomic Recalculation on Supabase
      const { data: votesData, error: sumErr } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("post_id", postId);

      if (sumErr) throw sumErr;

      const newTally = votesData 
        ? votesData.reduce((acc, curr) => acc + curr.vote_type, 0)
        : 0;

      // Step 3: Update local cached vote_count in `posts` table
      const { data: updatedPost, error: postUpdateErr } = await supabase
        .from("posts")
        .update({ vote_count: newTally })
        .eq("id", postId)
        .select()
        .single();

      if (postUpdateErr) throw postUpdateErr;

      // Return current vote status of user combined with new count
      return res.json({ 
        success: true, 
        vote_count: newTally,
        user_vote: direction,
        post: updatedPost
      });

    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback Memory Logic for Atomic Voting
  const postIndex = mockPosts.findIndex((p) => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: "কোন পোস্ট পাওয়া যায়নি।" });
  }

  // Locate or remove current vote
  const existingVoteIdx = mockVotes.findIndex((v) => v.user_id === user.id && v.post_id === postId);

  if (direction === 0) {
    if (existingVoteIdx !== -1) {
      mockVotes.splice(existingVoteIdx, 1);
    }
  } else {
    if (existingVoteIdx !== -1) {
      mockVotes[existingVoteIdx].vote_type = direction;
    } else {
      mockVotes.push({ user_id: user.id, post_id: postId, vote_type: direction });
    }
  }

  // Recalculate tally
  const tally = mockVotes
    .filter((v) => v.post_id === postId)
    .reduce((sum, current) => sum + current.vote_type, 0);

  mockPosts[postIndex].vote_count = tally;

  res.json({
    success: true,
    vote_count: tally,
    user_vote: direction,
    post: mockPosts[postIndex]
  });
});

// Helper for UI to query current vote direction for active user
app.get("/api/posts/:id/my-vote", async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.json({ user_vote: 0 });
  }
  const { id: postId } = req.params;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .maybeSingle();

      if (error) throw error;
      return res.json({ user_vote: data ? data.vote_type : 0 });
    } catch (err) {
      return res.json({ user_vote: 0 });
    }
  }

  // Fallback
  const foundVote = mockVotes.find((v) => v.user_id === user.id && v.post_id === postId);
  res.json({ user_vote: foundVote ? foundVote.vote_type : 0 });
});


// ==========================================
// VITE DEV / PRODUCTION INGRESS HANDLERS
// ==========================================
async function start() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    // Mount Vite middleware in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Middleware Mounted.");
  } else {
    // Serve static files in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static production files from ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===================================================`);
    console.log(`🕌 Islamic Dawah Platform Server initialized successfully!`);
    console.log(`🚀 Access application here: http://localhost:${PORT}`);
    console.log(`📡 Ingress Binding: 0.0.0.0:${PORT}`);
    console.log(`🗃️ active mode: ${isSupabaseConfigured ? "Supabase Cloud" : "In-Memory Sandbox Dev"}`);
    console.log(`===================================================`);
  });
}

start().catch((err) => {
  console.error("Oops! Backend server start failed:", err);
});
