import { createContext, useContext } from 'react';
import type { Review } from '../../domain/types';

type ReviewContextType = {
  reviewsByTarget: Record<string, Review[]>;
  reviewMode: boolean;
};

export const ReviewContext = createContext<ReviewContextType>({
  reviewsByTarget: {},
  reviewMode: false,
});

export const useReviews = (targetId: string) => {
  const { reviewsByTarget, reviewMode } = useContext(ReviewContext);
  const reviews = reviewsByTarget[targetId] ?? [];
  return {
    reviewMode,
    reviews,
    total: reviews.length,
    unresolved: reviews.filter((r) => !r.resolved).length,
  };
};
