export interface ForumCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  topics_count: number;
}

export interface ForumReply {
  id: number;
  body: string;
  author: string;
  created_at: string | null;
}

export interface ForumTopic {
  id: number;
  title: string;
  body: string;
  views: number;
  is_pinned: boolean;
  replies_count?: number;
  category: { id: number; name: string } | null;
  author: string;
  replies?: ForumReply[];
  created_at: string | null;
}

export interface TopicFormData {
  category_id: number | '';
  title: string;
  body: string;
}
