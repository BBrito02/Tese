import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Review, Reply, ReviewPriority } from '../../domain/types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

type ReviewContextType = {
  reviewsByTarget: Record<string, Review[]>;
  reviewMode: boolean;
  toggleReviewMode: () => void;
  addReview: (payload: {
    targetId: string;
    content: string;
    priority: ReviewPriority;
    author: string;
  }) => void;
  deleteReview: (reviewId: string) => void;
  resolveReview: (reviewId: string) => void;
  addReply: (reviewId: string, content: string, author: string) => void;
  deleteReply: (reviewId: string, replyId: string) => void;
};

// --- FIX: Added 'export' here ---
export const ReviewContext = createContext<ReviewContextType | null>(null);

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [reviewsByTarget, setReviewsByTarget] = useState<
    Record<string, Review[]>
  >(() => {
    const saved = localStorage.getItem('designer:reviews');
    return saved ? JSON.parse(saved) : {};
  });

  const [reviewMode, setReviewMode] = useState(false);

  useEffect(() => {
    localStorage.setItem('designer:reviews', JSON.stringify(reviewsByTarget));
  }, [reviewsByTarget]);

  const toggleReviewMode = () => setReviewMode((prev) => !prev);

  const addReview = ({
    targetId,
    content,
    priority,
    author,
  }: {
    targetId: string;
    content: string;
    priority: ReviewPriority;
    author: string;
  }) => {
    const newReview: Review = {
      id: generateId(),
      targetId,
      text: content,
      author: author || 'Anonymous',
      createdAt: Date.now(),
      priority,
      resolved: false,
      replies: [],
    };

    setReviewsByTarget((prev) => {
      const list = prev[targetId] || [];
      return { ...prev, [targetId]: [newReview, ...list] };
    });
  };

  const deleteReview = (reviewId: string) => {
    setReviewsByTarget((prev) => {
      const next = { ...prev };
      for (const targetId in next) {
        next[targetId] = next[targetId].filter((r) => r.id !== reviewId);
        if (next[targetId].length === 0) delete next[targetId];
      }
      return next;
    });
  };

  const resolveReview = (reviewId: string) => {
    setReviewsByTarget((prev) => {
      const next = { ...prev };
      for (const targetId in next) {
        next[targetId] = next[targetId].map((r) =>
          r.id === reviewId ? { ...r, resolved: !r.resolved } : r
        );
      }
      return next;
    });
  };

  const addReply = (reviewId: string, content: string, author: string) => {
    const newReply: Reply = {
      id: generateId(),
      text: content,
      author: author || 'Anonymous',
      createdAt: Date.now(),
    };

    setReviewsByTarget((prev) => {
      const next = { ...prev };
      for (const targetId in next) {
        next[targetId] = next[targetId].map((r) => {
          if (r.id === reviewId) {
            return { ...r, replies: [...(r.replies || []), newReply] };
          }
          return r;
        });
      }
      return next;
    });
  };

  const deleteReply = (reviewId: string, replyId: string) => {
    setReviewsByTarget((prev) => {
      const next = { ...prev };
      for (const targetId in next) {
        next[targetId] = next[targetId].map((r) => {
          if (r.id === reviewId && r.replies) {
            return {
              ...r,
              replies: r.replies.filter((reply) => reply.id !== replyId),
            };
          }
          return r;
        });
      }
      return next;
    });
  };

  return (
    <ReviewContext.Provider
      value={{
        reviewsByTarget,
        reviewMode,
        toggleReviewMode,
        addReview,
        deleteReview,
        resolveReview,
        addReply,
        deleteReply,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews(targetId?: string) {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }

  // Global Context (Aggregation)
  if (!targetId) {
    return {
      ...context,
      reviews: [],
      total: 0,
      unresolved: 0,
    };
  }

  // Specific Target Context
  const reviews = context.reviewsByTarget[targetId] || [];
  const total = reviews.length;
  const unresolved = reviews.filter((r) => !r.resolved).length;

  return {
    ...context,
    reviews,
    total,
    unresolved,
  };
}
