import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

interface SkeletonState {
  isLoading: boolean;
  type: 'card' | 'text' | 'avatar' | 'button' | 'game-board';
  count?: number;
}

export const useSkeletonLoader = () => {
  const [skeletonState, setSkeletonState] = useState<SkeletonState>({
    isLoading: false,
    type: 'card'
  });

  const startLoading = (type: SkeletonState['type'], count?: number) => {
    setSkeletonState({
      isLoading: true,
      type,
      count
    });
  };

  const stopLoading = () => {
    setSkeletonState({
      isLoading: false,
      type: 'card'
    });
  };

  // Auto-stop loading after timeout
  useEffect(() => {
    if (skeletonState.isLoading) {
      const timer = setTimeout(() => {
        stopLoading();
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    }
  }, [skeletonState.isLoading]);

  return {
    skeletonState,
    startLoading,
    stopLoading
  };
};

// Skeleton components
export const SkeletonCard = () => (
  <div className="animate-pulse bg-white rounded-lg shadow-lg p-6">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="h-4 bg-gray-200 rounded"></div>
    ))}
  </div>
);

export const SkeletonAvatar = () => (
  <div className="animate-pulse w-10 h-10 bg-gray-200 rounded-full"></div>
);

export const SkeletonButton = () => (
  <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-24"></div>
);

export const SkeletonGameBoard = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg p-8">
    <div className="grid grid-cols-8 gap-2">
      {Array.from({ length: 64 }).map((_, index) => (
        <div key={index} className="w-12 h-12 bg-gray-200 rounded"></div>
      ))}
    </div>
  </div>
);
