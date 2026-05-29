import React, { useState, useEffect } from "react";
import { ArrowBigUp, ArrowBigDown, MessageSquare, Calendar, User, CornerDownRight, Reply, Ban, PlusCircle, AlertCircle, Share2, Clipboard, Heart, Gift, Award, HelpCircle } from "lucide-react";
import { Post, Comment, Profile } from "../types";
import AdminCreatePost from "./AdminCreatePost";
import { TABS_CONFIG } from "../tabsConfig";

interface MainFeedProps {
  activeTab: string;
  currentUser: Profile | null;
  searchQuery: string;
  activeToken: string;
}

export default function MainFeed({
  activeTab,
  currentUser,
  searchQuery,
  activeToken
}: MainFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // Load posts whenever tab changes
  const fetchPosts = async () => {
    const currentTabSpec = TABS_CONFIG.find((t) => t.id === activeTab);
    if (currentTabSpec?.isStatic) {
      setIsLoading(false);
      setPosts([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts?tab=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);

        // Optimistically pre-fetch vote statuses for visible posts
        if (currentUser) {
          const votesPromises = data.posts.map(async (p: Post) => {
            const voteRes = await fetch(`/api/posts/${p.id}/my-vote`, {
              headers: { "Authorization": `Bearer ${activeToken}` }
            });
            if (voteRes.ok) {
              const voteData = await voteRes.json();
              return { postId: p.id, vote: voteData.user_vote };
            }
            return { postId: p.id, vote: 0 };
          });
          const fetchedVotes = await Promise.all(votesPromises);
          const votesMap: Record<string, number> = {};
          fetchedVotes.forEach((item) => {
            votesMap[item.postId] = item.vote;
          });
          setUserVotes((prev) => ({ ...prev, ...votesMap }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedPost(null); // Force collapse post detail on tab change
    setIsCreatingPost(false); // Close post creator form toggle
    fetchPosts();
  }, [activeTab, currentUser, activeToken]);

  // Load comments for a single expanded post
  const fetchComments = async (postId: string) => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Comments error:", err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleExpandPost = (post: Post) => {
    setSelectedPost(post);
    setReplyToId(null);
    setNewCommentText("");
    fetchComments(post.id);
  };

  // Upvote/Downvote actions
  const handleVote = async (postId: string, currentVoteDirection: number, clickedDirection: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) {
      alert("ভোট বা মূল্যায়নে অংশ নিতে প্রথমে ডানদিকের প্যানেল থেকে লগইন করুন!");
      return;
    }

    // Recalculate target direction representation
    // If clicking same direction, retract vote (0). Otherwise assign clickedDirection
    const targetDirection = currentVoteDirection === clickedDirection ? 0 : clickedDirection;

    try {
      // Optimistic UI updates
      const originalPosts = [...posts];
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            const delta = targetDirection - currentVoteDirection;
            return { ...p, vote_count: p.vote_count + delta };
          }
          return p;
        })
      );
      setUserVotes((prev) => ({ ...prev, [postId]: targetDirection }));

      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({ direction: targetDirection })
      });

      if (!response.ok) {
        // Rollback on server failure
        setPosts(originalPosts);
        setUserVotes((prev) => ({ ...prev, [postId]: currentVoteDirection }));
        const errData = await response.json();
        alert(errData.error || "ভোট গ্রহণে ত্রুটি।");
      } else {
        const data = await response.json();
        // Sync-up with exact server count on success
        setPosts((prevPosts) =>
          prevPosts.map((p) => (p.id === postId ? { ...p, vote_count: data.vote_count } : p))
        );
        setUserVotes((prev) => ({ ...prev, [postId]: data.user_vote }));
        
        // If expanded, update selected post count as well
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost((prev) => prev ? { ...prev, vote_count: data.vote_count } : null);
        }
      }
    } catch (err) {
      console.error("Voting API error:", err);
    }
  };

  // Submit Comments / Replies
  const handleAddComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    if (!currentUser) {
      alert("মন্তব্য করতে প্রথমে অনুগ্রহ করে লগইন করুন।");
      return;
    }
    if (!newCommentText.trim() && !parentId) return;

    setIsSubmittingComment(true);
    const targetPostId = selectedPost?.id;
    if (!targetPostId) return;

    try {
      const response = await fetch(`/api/posts/${targetPostId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          content: newCommentText,
          parent_id: parentId
        })
      });

      if (response.ok) {
        setNewCommentText("");
        setReplyToId(null);
        await fetchComments(targetPostId);
      } else {
        const err = await response.json();
        alert(err.error || "মন্তব্য প্রকাশ ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("Comment submit failed:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Filter posts based on user search bar query
  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper formatting dates beautifully in Bengali style
  const formatBanglaDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const copyToClipboard = (postId: string) => {
    const url = `${window.location.origin}/#post-${postId}`;
    navigator.clipboard.writeText(url);
    alert("পোস্টের লিংক ক্লিপবোর্ডে কপি করা হয়েছে!");
  };

  // Recursive Comment Node Reducer
  const CommentNode = ({ comment, allComments, depth = 0 }: { comment: Comment; allComments: Comment[]; depth: number; key?: string | number }) => {
    const replies = allComments.filter((c) => c.parent_id === comment.id);
    const isReplying = replyToId === comment.id;
    const [replyText, setReplyText] = useState("");

    const submitReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyText.trim()) return;

      setIsSubmittingComment(true);
      try {
        const response = await fetch(`/api/posts/${selectedPost?.id}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            content: replyText,
            parent_id: comment.id
          })
        });

        if (response.ok) {
          setReplyText("");
          setReplyToId(null);
          await fetchComments(selectedPost!.id);
        } else {
          const err = await response.json();
          alert(err.error || "রিপ্লাই ব্যর্থ হয়েছে।");
        }
      } catch (err) {
        console.error("Reply error:", err);
      } finally {
        setIsSubmittingComment(false);
      }
    };

    return (
      <div className="flex flex-col space-y-3 font-sans mt-4 border-l-2 border-slate-100 pl-4 py-1">
        {/* Comment Header */}
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-100">
            <img 
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${comment.user_id}`} 
              alt="User" 
              referrerPolicy="no-referrer"
              className="h-full w-full" 
            />
          </div>
          <span className="text-xs font-bold text-brand-dark">{comment.author_name}</span>
          <span className="text-[10px] text-brand-muted">• {formatBanglaDate(comment.created_at)}</span>
        </div>

        {/* Comment Body Content */}
        <p className="text-sm text-brand-dark whitespace-pre-line leading-relaxed font-sans font-normal pl-1">
          {comment.content}
        </p>

        {/* Reply Action Triggers */}
        <div className="flex items-center space-x-4 pl-1">
          <button
            onClick={() => setReplyToId(isReplying ? null : comment.id)}
            className="flex items-center space-x-1.5 text-xs font-bold text-brand-blue hover:text-brand-blue-hover"
          >
            <Reply className="h-3 w-3" />
            <span>উত্তর দিন</span>
          </button>
        </div>

        {/* Self Reply Nested Form */}
        {isReplying && (
          <form onSubmit={submitReply} className="mt-2 pl-2">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`${comment.author_name}-কে উত্তর লিখুন...`}
                className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-brand-dark focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green/20"
              />
              <button
                type="submit"
                disabled={isSubmittingComment}
                className="rounded-xl bg-brand-green px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-green-hover"
              >
                জমা দিন
              </button>
            </div>
          </form>
        )}

        {/* Recursive Children comments rendering down */}
        {replies.length > 0 && (
          <div className="space-y-1 mt-2">
            {replies.map((reply) => (
              <CommentNode
                key={reply.id}
                comment={reply}
                allComments={allComments}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };


  // -----------------------------------------
  // MAIN CONDITIONAL TAB RENDERING SCHEMES
  // -----------------------------------------

  // A. Expanded Single Post Rendering View Mode
  if (selectedPost) {
    return (
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
        
        {/* Post Detail Header breadcrumbs back */}
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center space-x-1.5 text-xs font-bold text-brand-green hover:text-brand-green-hover pb-4 border-b border-slate-100"
        >
          <CornerDownRight className="h-4 w-4 rotate-180" />
          <span>তালিকায় ফিরে যান</span>
        </button>

        {/* Voting & Metadata grid inside expanded post */}
        <div className="flex space-x-4">
          <div className="flex flex-col items-center bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl h-fit">
            <button
              onClick={() => handleVote(selectedPost.id, userVotes[selectedPost.id] || 0, 1)}
              className={`p-1.5 rounded-lg transition-colors ${
                userVotes[selectedPost.id] === 1
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              <ArrowBigUp className="h-6 w-6 fill-current" />
            </button>
            <span className="text-sm font-bold my-1 text-brand-dark">
              {selectedPost.vote_count}
            </span>
            <button
              onClick={() => handleVote(selectedPost.id, userVotes[selectedPost.id] || 0, -1)}
              className={`p-1.5 rounded-lg transition-colors ${
                userVotes[selectedPost.id] === -1
                  ? "bg-brand-orange/10 text-brand-orange"
                  : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              <ArrowBigDown className="h-6 w-6 fill-current" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark leading-tight">
              {selectedPost.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                <User className="h-3.5 w-3.5 text-brand-green" />
                <span>{selectedPost.author_name}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatBanglaDate(selectedPost.created_at)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Large content Image layout */}
        {selectedPost.image_url && (
          <div className="overflow-hidden rounded-2xl max-h-[450px] border border-slate-100">
            <img
              src={selectedPost.image_url}
              alt="Islamic Banner"
              referrerPolicy="no-referrer"
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Body content (Markdown formatting simulated nicely) */}
        <div className="prose max-w-none text-brand-dark space-y-4 leading-relaxed font-sans">
          {selectedPost.content.split("\n\n").map((para, pIdx) => {
            // Primitive Markdown parser support
            if (para.startsWith("**") && para.endsWith("**")) {
              return <h3 key={pIdx} className="text-base font-bold text-brand-green pt-2">{para.replace(/\*\*/g, "")}</h3>;
            }
            if (para.startsWith("- ") || para.startsWith("1. ")) {
              return (
                <ul key={pIdx} className="list-disc pl-6 space-y-1 text-sm bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {para.split("\n").map((li, lIdx) => (
                    <li key={lIdx} className="text-slate-700">
                      {li.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "")}
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={pIdx} className="text-sm sm:text-base text-slate-800 whitespace-pre-wrap">{para}</p>;
          })}
        </div>

        {/* Interactive share tools */}
        <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => copyToClipboard(selectedPost.id)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-brand-dark rounded-xl text-xs font-bold transition-all"
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            <span>পোস্টের লিংক কপি করুন</span>
          </button>
        </div>

        {/* =========================================
            COMMENTS AND REPLIES BLOCK SECTION
           ========================================= */}
        <div className="pt-6 border-t border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-brand-dark flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-brand-green" />
              <span>প্রতিক্রিয়া ও প্রশ্নোত্তর আলোচনা ({comments.length})</span>
            </h3>
          </div>

          {/* New root comment textbox form */}
          {currentUser ? (
            <form onSubmit={(e) => handleAddComment(e, null)} className="space-y-2">
              <textarea
                rows={3}
                required
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="আপনার গঠনমূলক মন্তব্য বা প্রশ্ন এখানে লিখুন..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-brand-dark focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green/20 font-sans"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="rounded-xl bg-brand-green px-5 py-2 text-xs font-bold text-white hover:bg-brand-green-hover disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmittingComment ? "জমা হচ্ছে..." : "মন্তব্য প্রদান করুন"}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-brand-orange bg-brand-orange/5 text-amber-950 text-xs text-center space-y-1">
              <p className="font-bold">মন্তব্য করতে চান?</p>
              <p className="text-zinc-600">অনুগ্রহ করে ডানদিকের "ব্যবহারকারী সিমুলেটর" থেকে যেকোন একটি ইউজার আইডি সেশনে সাইন ইন করুন।</p>
            </div>
          )}

          {/* Comments list display tree */}
          {isLoadingComments ? (
            <div className="text-center py-6 text-brand-muted text-xs">মন্তব্য লোড হচ্ছে...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-brand-muted text-xs font-sans">
              এখনও কোনো মন্তব্য করা হয়নি। আপনার মতামত দিয়ে আলোচনা শুরু করুন!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {comments
                .filter((c) => !c.parent_id) // Fetch flat root parents first
                .map((rootCmt) => (
                  <CommentNode
                    key={rootCmt.id}
                    comment={rootCmt}
                    allComments={comments}
                    depth={0}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeTabSpec = TABS_CONFIG.find((t) => t.id === activeTab);

  if (activeTabSpec?.isStatic) {
    return (
      <div className="flex-1 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200/85 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Heart className="h-5 w-5 text-brand-green fill-brand-green/10" />
              <span>{activeTabSpec.label}</span>
            </h2>
            <p className="text-xs text-brand-muted font-sans mt-0.5 font-sans">
              {activeTabSpec.subTitle}
            </p>
          </div>
        </div>

        {/* Static Content Body - Pristine instruction panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8 font-sans animate-in fade-in-50 duration-200">
          
          <div className="border-b border-slate-100 pb-5">
            <h3 className="text-xl font-bold text-brand-dark leading-snug">
              মাঠপর্যায়ের মানবিক কাজ ও দাওয়াহ অংশীদারিত্ব নির্দেশিকা
            </h3>
            <p className="text-sm text-brand-muted mt-2 leading-relaxed">
              উদ্দীপ্ত তরুণ সংঘ-এর দ্বীনী সেবামূলক কর্মকাণ্ডে শরিক হওয়া প্রতিটি সচেতন মুমিনের জন্য একটি উত্তম সুযোগ। আমাদের সাথে মাঠপর্যায়ে বা স্বেচ্ছাসেবী হিসেবে যুক্ত হওয়ার অনুমোদিত নিয়মাবলী নিম্নরূপ:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-all space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                <User className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-brand-dark">১. মাঠপর্যায়ে স্বেচ্ছাসেবক হিসেবে অংশগ্রহণ</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                আমাদের এলাকায় নিয়মিত খাদ্য ত্রাণ বিতরণ, জরুরী চিকিৎসা সেবা, রক্তদান কর্মসূচী, পথশিশু পাঠশালা এবং বন্যা বা প্রাকৃতিক দুর্যোগের সময়ে আমাদের মনিটরিং ফোর্সের অধীনে সরাসরি শারীরিক বা লজিস্টিক সেবা দিয়ে আল্লাহর সন্তুষ্টির উদ্দেশ্যে অবদান রাখতে পারেন।
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-all space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                <Gift className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-brand-dark">২. দ্বীনি দাওয়াহ ও লিটারেচার বিতরণ</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                বিশুদ্ধ আকীদা প্রচার ও তরুণ সমাজকে চারিত্রিক বিপর্যয় থেকে বাঁচাতে আমাদের উদ্যোগে প্রতি মাসে মাসজিদ, স্কুল-কলেজ ও পথচারীদের মাঝে কুরআন-সুন্নাহ ভিত্তিক গুরুত্বপূর্ণ লিফলেট ও বই বিতরণ করা হয়। এতে সরাসরি বিতরণে কিংবা লিখনীতে অবদান রাখা যাবে।
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/20 space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-brand-green" />
              <h4 className="font-bold text-sm text-brand-dark">স্বেচ্ছাসেবক হিসেবে আবেদনের নিয়ম ও নীতিমালা</h4>
            </div>
            
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700 list-inside pl-1 font-sans">
              <li className="flex items-start space-x-2">
                <span className="text-brand-green font-bold mr-1 shrink-0">✓</span>
                <span><strong>সরাসরি অন-গ্রাউন্ড যোগাযোগ:</strong> প্রতি শুক্রবার বাদে আসর আমাদের কেন্দ্রীয় কার্যালয়ে সরাসরি দেখা করে নাম তালিকাভুক্ত করুন।</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-brand-green font-bold mr-1 shrink-0">✓</span>
                <span><strong>জরুরী রেসপন্স টিম:</strong> কোনো এলাকায় আপদকালীন দুর্যোগ দেখা দিলে আমাদের সিনিয়র অ্যাডমিনদের সমন্বয়ে গঠিত বিশেষ অন-গ্রাউন্ড স্পেশাল ফোর্সে তালিকাভুক্ত সদস্যদের কল করা হয়।</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-brand-green font-bold mr-1 shrink-0">✓</span>
                <span><strong>স্বেচ্ছাসেবক আচরণবিধি:</strong> মাঠপর্যায়ে কার্যক্রম পরিচালনার সময় সংগঠনের নির্ধারিত স্বেচ্ছাসেবক কটি (Vest) ও পরিচয়পত্র পরিধান বাধ্যতামূলক। কোনো প্রকার ব্যক্তিগত প্রচার, বিতর্ক সৃষ্টি বা নীতিবিরোধী আচরণ করা যাবে না।</span>
              </li>
            </ul>
          </div>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-brand-muted italic font-sans">
              "তোমরা সৎকাজ ও তাকওয়ার ব্যাপারে একে অপরকে সহযোগিতা কর।" (সূরা আল-মায়িদাহ: ২)
            </p>
          </div>

        </div>
      </div>
    );
  }

  // -----------------------------------------
  // B. Standard Listing tab Views Container
  // -----------------------------------------
  const isAdmin = currentUser?.role === "admin";
  const userCanCreateInTargetTab = !activeTabSpec?.isStatic && (!activeTabSpec?.requiresAdminPost || isAdmin);

  return (
    <div className="flex-1 space-y-6">
      
      {/* Sleek Admin and community Creation Header Banner Block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200/85 rounded-2xl shadow-sm animate-in fade-in-50 duration-200">
        <div>
          <h2 className="text-lg font-bold text-brand-dark">
            {activeTabSpec?.label || "ফিড (Feed)"}
          </h2>
          <p className="text-xs text-brand-muted font-sans mt-0.5">
            {activeTabSpec?.subTitle || "সুস্থ চিন্তা ও বিশুদ্ধ তাওহীদী সমাজ বিনির্মাণে চিন্তাসমূহ।"}
          </p>
        </div>

        {/* Trigger to toggle Custom Creation drawer for administrative members */}
        {userCanCreateInTargetTab ? (
          <button
            onClick={() => setIsCreatingPost(!isCreatingPost)}
            className="flex items-center space-x-1.5 rounded-xl bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-brand-green/10 transition-all font-sans cursor-pointer whitespace-nowrap self-end sm:self-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isCreatingPost ? "ফর্ম বন্ধ করুন" : (activeTab === "qa" ? "প্রশ্ন জিজ্ঞাসা করুন" : "নতুন পোস্ট প্রকাশ")}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-brand-muted text-xs rounded-xl font-medium w-full sm:w-auto">
            <Ban className="h-3.5 w-3.5 text-brand-orange" />
            <span>পোস্ট প্রকাশ শুধুমাত্র পরিচালকদের জন্য সীমিত।</span>
          </div>
        )}
      </div>

      {/* Slideout Active Create Post Form Module */}
      {isCreatingPost && userCanCreateInTargetTab && (
        <div className="animate-in fade-in-50 duration-200">
          <AdminCreatePost
            activeRole={currentUser?.role || "user"}
            defaultTab={activeTab}
            activeToken={activeToken}
            onPostCreated={() => {
              setIsCreatingPost(false);
              fetchPosts();
            }}
          />
        </div>
      )}

      {/* Main Loop rendering layout cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-10 w-10 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-brand-muted font-sans">দ্বীনী পোস্টগুলো ডাটাবেস থেকে সংগৃহীত হচ্ছে...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="font-bold text-sm text-brand-dark">কোনো পোস্ট এখনও প্রকাশিত হয়নি</h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed font-sans max-w-sm mx-auto">
              এই ট্যাবে প্রদর্শনের মতো কোনো তথ্য এই মুহূর্তে পাওয়া যায়নি। নতুন প্রশ্ন বা তথ্য যোগ করে আপনি আপনার যাত্রা শুরু করুন।
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const currentVoteDir = userVotes[post.id] || 0;
            return (
              <article
                key={post.id}
                onClick={() => handleExpandPost(post)}
                className="group flex flex-col sm:flex-row bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:border-brand-green/45 hover:shadow-md transition-all duration-200 cursor-pointer text-left gap-4"
              >
                
                {/* Visual Reddit Reddit-style Vote Left block */}
                <div 
                  className="flex sm:flex-col items-center justify-between sm:justify-start bg-slate-50/70 p-1.5 rounded-xl sm:w-12 h-fit"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleVote(post.id, currentVoteDir, 1, e)}
                    className={`p-1 rounded-lg transition-all ${
                      currentVoteDir === 1
                        ? "bg-brand-green/10 text-brand-green"
                        : "text-slate-400 hover:bg-slate-100 hover:text-brand-green"
                    }`}
                  >
                    <ArrowBigUp className="h-5 w-5 fill-current" />
                  </button>
                  <span className="text-xs font-bold mx-2 sm:my-1 text-brand-dark">
                    {post.vote_count}
                  </span>
                  <button
                    onClick={(e) => handleVote(post.id, currentVoteDir, -1, e)}
                    className={`p-1 rounded-lg transition-all ${
                      currentVoteDir === -1
                        ? "bg-brand-orange/10 text-brand-orange"
                        : "text-slate-400 hover:bg-slate-100 hover:text-brand-orange"
                    }`}
                  >
                    <ArrowBigDown className="h-5 w-5 fill-current" />
                  </button>
                </div>

                {/* Right text body contents */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  
                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-brand-dark leading-snug group-hover:text-brand-green transition-all">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-sans line-clamp-2 md:line-clamp-3 leading-relaxed">
                      {post.content.replace(/\*|_|#/g, "")}
                    </p>
                  </div>

                  {/* Thumbnail snippet if present */}
                  {post.image_url && (
                    <div className="h-24 w-full sm:w-48 overflow-hidden rounded-xl border border-slate-100/50">
                      <img
                        src={post.image_url}
                        alt="Content Preview"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                      />
                    </div>
                  )}

                  {/* Meta items bar */}
                  <div className="flex flex-wrap items-center justify-between pt-1.5 border-t border-slate-100/80 gap-2">
                    <div className="flex items-center space-x-3 text-xs text-brand-muted">
                      <span className="flex items-center space-x-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-brand-dark">
                        <User className="h-3 w-3 text-brand-green" />
                        <span>{post.author_name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatBanglaDate(post.created_at)}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-brand-blue font-bold">
                      <div className="flex items-center space-x-1 bg-brand-blue/5 px-2 py-0.5 rounded-lg">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>আলোচনা দেখুন</span>
                      </div>
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
