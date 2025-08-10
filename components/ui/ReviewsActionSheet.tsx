import React, { useState } from 'react';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Star, X } from 'lucide-react-native';

interface Review {
  id: string;
  user: string;
  comment: string;
  date: string;
  rating?: number;
}

interface ReviewsData {
  overallRating: number | null;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: Review[];
}

const sortOptions = [
  { id: 'relevant', label: 'Most relevant' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'newest', label: 'Newest' },
];

interface ReviewsActionSheetProps {
  sheetId: string;
  payload?: {
    hotelId: string;
    reviews: Review[];
    reviewsData?: ReviewsData;
  };
  reviewsData?: ReviewsData;
}

export function ReviewsActionSheet({ sheetId, payload, reviewsData: propReviewsData }: ReviewsActionSheetProps) {
  const [selectedSort, setSelectedSort] = useState('relevant');

  const handleClose = () => {
    SheetManager.hide(sheetId);
  };

  const renderStars = (rating: number = 0, size: number = 18) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color={i <= rating ? '#FCD34D' : '#D1D5DB'}
          fill={i <= rating ? '#FCD34D' : '#D1D5DB'}
        />
      );
    }
    return stars;
  };

  const renderRatingBar = (rating: number, count: number, totalReviews: number) => {
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    
    return (
      <View className="flex-row items-center gap-3">
        <Text className="text-sm text-gray-700 w-2" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>{rating}</Text>
        <View className="flex-1 h-2 rounded-full bg-gray-200">
          <View
            className="h-full rounded-full bg-black"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <Text className="text-sm text-gray-500 w-8" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{percentage}%</Text>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    } catch {
      return 'Recently';
    }
  };

  const sortReviews = (reviews: Review[]) => {
    const sortedReviews = [...reviews];
    
    switch (selectedSort) {
      case 'newest':
        return sortedReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'oldest':
        return sortedReviews.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      default:
        return sortedReviews;
    }
  };

  // Get data from payload or props
  const reviews = payload?.reviews || propReviewsData?.reviews || [];
  const reviewsData = payload?.reviewsData || propReviewsData;
  const sortedReviews = sortReviews(reviews);

  // Calculate average rating if not provided
  const ratingsWithValues = reviews.filter(r => r.rating && r.rating > 0);
  const calculatedRating = ratingsWithValues.length > 0 
    ? ratingsWithValues.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsWithValues.length 
    : 0;

  const displayRating = reviewsData?.overallRating || calculatedRating;
  const totalReviews = reviewsData?.totalReviews || reviews.length;

  return (
    <ActionSheet
      id={sheetId}
      containerStyle={{
        paddingHorizontal: 0,
        paddingBottom: 0,
      }}
      gestureEnabled={true}
      closable={true}
      closeOnTouchBackdrop={true}
    >
      <View className="flex-col items-stretch rounded-t-3xl bg-white pt-3">
        {/* Handle */}
        <View className="flex h-5 w-full items-center justify-center">
          <View className="h-1.5 w-10 rounded-full bg-gray-200" />
        </View>

        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-lg text-gray-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Reviews
            </Text>
{reviewsData && (
              <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {displayRating > 0 ? displayRating.toFixed(1) : 'No rating'} • {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
          <View className="w-10" />
        </View>

        {/* Rating Summary */}
        {reviewsData && displayRating > 0 && (
          <View className="px-6 pb-6">
            <View className="flex-row items-start justify-between gap-6">
              <View className="flex-col items-start gap-1">
                <Text className="text-5xl text-gray-900" style={{ fontFamily: 'PlusJakartaSans-ExtraBold' }}>
                  {displayRating.toFixed(1)}
                </Text>
                <View className="flex-row items-center gap-1 mb-1">
                  {renderStars(Math.floor(displayRating))}
                </View>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </Text>
              </View>

              {reviewsData?.ratingBreakdown && (
                <View className="flex-1 min-w-[200px] gap-2">
                  {[5, 4, 3, 2, 1].map((rating) =>
                    renderRatingBar(
                      rating, 
                      reviewsData.ratingBreakdown[rating as keyof typeof reviewsData.ratingBreakdown], 
                      totalReviews
                    )
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Sort Options */}
        {reviews.length > 1 && (
          <View className="px-6 pt-4 border-t border-gray-100">
            <Text className="text-base text-gray-800 mb-3" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>Sort by</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row gap-3 pr-6">
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setSelectedSort(option.id)}
                    className={`flex h-9 items-center justify-center rounded-full px-4 ${
                      selectedSort === option.id
                        ? 'bg-black'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className={`text-sm ${
                      selectedSort === option.id
                        ? 'text-white'
                        : 'text-gray-700'
                    }`} style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Reviews List */}
        <ScrollView
          className="bg-gray-50 px-6 py-6"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 400 }}
        >
          {sortedReviews.length > 0 ? (
            sortedReviews.map((review, index) => (
              <View key={review.id || index} className="bg-white rounded-lg p-4 mb-4">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                    <Text className="text-lg text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                      {(review.user || review.userName || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                      {review.user || review.userName || 'Anonymous Guest'}
                    </Text>
                    <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      {formatDate(review.date)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1 mb-3">
                  {renderStars(review.rating || 5, 20)}
                </View>

                <Text className="text-base leading-relaxed text-gray-700 mb-4" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  {review.comment}
                </Text>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-lg p-8 items-center">
              <Text className="text-base text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                No reviews available
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Close Button */}
        <View className="border-t border-gray-200 bg-white px-6 py-4">
          <TouchableOpacity
            onPress={handleClose}
            className="flex h-12 w-full items-center justify-center rounded-full bg-black"
          >
            <Text className="text-base text-white" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ActionSheet>
  );
}