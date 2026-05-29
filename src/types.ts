export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  tab_type: string;
  author_id: string;
  author_name: string;
  vote_count: number;
  created_at: string;
  user_vote?: number; // Optional flag representing active user's vote direction (1, -1, or 0)
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface SystemStatus {
  database: "supabase" | "local-memory";
  supabaseUrl: string | null;
  msg: string;
}
