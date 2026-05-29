import { Compass, Flame, BookOpen, Heart, MessageSquare, Megaphone, FileText, LucideIcon } from "lucide-react";

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  isStatic: boolean; // True for 'contribute' which has static content
  requiresAdminPost: boolean; // True for official tabs that need admin roles
  subTitle: string;
  placeholder?: string;
}

export const TABS_CONFIG: TabConfig[] = [
  {
    id: "feed",
    label: "ফিড (Feed)",
    icon: Compass,
    isStatic: false,
    requiresAdminPost: true,
    subTitle: "সুস্থ চিন্তা ও বিশুদ্ধ তাওহীদী সমাজ বিনির্মাণে প্রবন্ধসমূহ।",
    placeholder: "ফিড (ফিচার্ড প্রবন্ধসমূহ)"
  },
  {
    id: "activity",
    label: "কার্যক্রম (Activities)",
    icon: Flame,
    isStatic: false,
    requiresAdminPost: true,
    subTitle: "দরিদ্র জনগোষ্ঠী ও অসহায়দের সাহায্যের বাস্তব চিত্রের বিশ্বস্ত দলিল।",
    placeholder: "সংগঠনের বাস্তব কার্যক্রম"
  },
  {
    id: "guidelines",
    label: "নির্দেশিকা (Guidelines)",
    icon: BookOpen,
    isStatic: false,
    requiresAdminPost: true,
    subTitle: "তাকওয়া ও চারিত্রিক সৌন্দর্য অর্জনে আদর্শ নির্দেশনা।",
    placeholder: "কমিউনিটি নির্দেশিকা"
  },
  {
    id: "contribute",
    label: "অবদান রাখুন (Contribute)",
    icon: Heart,
    isStatic: true, // Marked static under Requirement 1
    requiresAdminPost: true,
    subTitle: "দাওয়াহ কার্যকলাপে অংশগ্রহণ ও মণ্ডলীগত মাঠপর্যায়ের মানবিক অবদানের নিয়মাবলী।"
  },
  {
    id: "qa",
    label: "প্রশ্নোত্তর (Q&A)",
    icon: MessageSquare,
    isStatic: false,
    requiresAdminPost: false,
    subTitle: "সাধারণ প্রশ্নাবলীর দলীলভিত্তিক ফিকহী জবাব ও পারস্পরিক জ্ঞানচর্চা।",
    placeholder: "প্রশ্নোত্তর (Q&A ফোরাম প্রশ্ন)"
  },
  {
    id: "announcements",
    label: "ঘোষণা (Announcements)",
    icon: Megaphone,
    isStatic: false,
    requiresAdminPost: true,
    subTitle: "উদ্দীপ্ত তরুণ সংঘের অফিশিয়াল নোটিশ এবং অতি জরুরী তথ্যাবলী।",
    placeholder: "সংবাদের নোটিশ বোর্ড"
  },
  {
    id: "research",
    label: "গবেষণা (Research)",
    icon: FileText,
    isStatic: false,
    requiresAdminPost: true,
    subTitle: "দ্বীনী ও সমসাময়িক বিষয়ে গবেষণামূলক প্রবন্ধ ও দলিলসমূহ।",
    placeholder: "গবেষণামূলক প্রকাশনা"
  }
];
