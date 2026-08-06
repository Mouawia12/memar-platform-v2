import { useState } from 'react';

import { queryClient } from '../../../lib/queryClient';
import { forumApi } from '../api/forumApi';
import { ForumBoard } from '../components/ForumBoard';
import { useCreateBoardTopic, useForumBoard } from '../hooks/useForum';
import { useMutation } from '@tanstack/react-query';

/**
 * منتدى لوحة الموظف — **نفس لوحة منتدى بوابة العميل تمامًا** (تصميم واحد، جدول مشترك،
 * موحّد لكل الأدوار). ردود الإدارة مميّزة بوسم «فريق معمار · الإدارة». طلب أيمن (اجتماع 2026-08-03).
 */
export function ForumPage() {
  const { data: threads, isLoading } = useForumBoard();
  const create = useCreateBoardTopic();
  const [sent, setSent] = useState(false);
  // الطاقم يردّ على المواضيع مباشرة من اللوحة الموحّدة — الردود تظهر موسومة كـ«الإدارة».
  const reply = useMutation({
    mutationFn: ({ threadId, body }: { threadId: number; body: string }) => forumApi.addReply(threadId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['forum-board'] }),
  });

  return (
    <div className="mcp-root">
      <ForumBoard
        threads={threads}
        isLoading={isLoading}
        posting={create.isPending}
        sent={sent}
        subtitle="منتدى واحد لكل فريق ومستخدمي معمار — أسئلة وإجابات على منصّة مشتركة"
        onPost={(title, body) => create.mutate({ title, body }, { onSuccess: () => { setSent(true); setTimeout(() => setSent(false), 3000); } })}
        onReply={(threadId, body) => reply.mutate({ threadId, body })}
        replying={reply.isPending}
      />
    </div>
  );
}
