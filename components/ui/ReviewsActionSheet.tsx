import React, { useState } from 'react';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Star, ThumbsUp, ThumbsDown, X } from 'lucide-react-native';

interface Review {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  timeAgo: string;
  content: string;
  likes: number;
  dislikes: number;
}

interface ReviewsData {
  overallRating: number;
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

const mockReviewsData: ReviewsData = {
  overallRating: 4.6,
  totalReviews: 123,
  ratingBreakdown: {
    5: 50,
    4: 30,
    3: 10,
    2: 5,
    1: 5,
  },
  reviews: [
    {
      id: '1',
      userName: 'Sophia Carter',
      userImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCiwTBFQKZjVYnXjgeA5Tr0DGkaG014mIQsm9kAWbdniS-x77IsKnZy4ghFLY0B6ww8BEQ0KR45v3jcqtH_h3XJGQtpY4olM7vsStCO7yQd7z1oVMuLPGjuPZ89M6EVBc8jMvQ4aPFnpbSmzZBgZq7NjjE4UBjKJqBSYlRQBcxp1AyOMWGAMxrOCRBy3vmiIDUql0uw5yuWz-nvMQuarNC3PP0suiyPFSHVTPXZRY654lw8M37Z4MZvLnG3oEdbSCul7BB6WhnbdQ',
      rating: 5,
      timeAgo: '2 months ago',
      content: 'The hotel exceeded my expectations! The room was immaculate, the staff were incredibly friendly and helpful, and the location was perfect for exploring the city. I especially enjoyed the complimentary breakfast and the stunning views from my room. I highly recommend this hotel for anyone looking for a luxurious and comfortable stay.',
      likes: 12,
      dislikes: 2,
    },
    {
      id: '2',
      userName: 'Ethan Bennett',
      userImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClWd0eTdGQ-Ro_d35lNY5V1UQIpbqRWSQV9yldY4OGLl0Yo6aioMNd_-2sU7iSI31wCGz34kUzl7afKNb2LyNghA80_IFpCc-V-C9yuztPodmmImPsZRo1VKN3DA8mrjJV-2ZTe3yOCTlXEbwepndSnkovkYthpbVulSoVvdGXOBfM9mXNZjDjGzgqdHrarIvvf1A3c3zdxf_MS4Xc_Mk4GVuW17lbJbVkMekDQdVCRdIYnWUgdGj2a7Y33IPqBRVOgxrp33zjcg',
      rating: 4,
      timeAgo: '3 months ago',
      content: 'Overall, I had a pleasant stay at the hotel. The room was clean and well-maintained, and the staff were generally helpful. The hotel\'s location was convenient, with easy access to public transportation and nearby attractions. However, I found the breakfast options to be somewhat limited, and the noise level from the street was noticeable at times. Despite these minor issues, I would consider staying here again.',
      likes: 8,
      dislikes: 1,
    },
  ],
};

const sortOptions = [
  { id: 'relevant', label: 'Most relevant' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'newest', label: 'Newest' },
];

interface ReviewsActionSheetProps {
  sheetId: string;
  reviewsData?: ReviewsData;
  props: any; // Assuming props is passed and has sheetRef
}

export function ReviewsActionSheet({ sheetId, reviewsData = mockReviewsData }: ReviewsActionSheetProps) {
  const [selectedSort, setSelectedSort] = useState('relevant');

  const handleClose = () => {
    SheetManager.hide(sheetId);
  };

  const renderStars = (rating: number, size: number = 18) => {
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

  const renderRatingBar = (rating: number, percentage: number) => (
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

  const renderReviewItem = (review: any) => ( // Changed to 'any' to accommodate new structure
    <View key={review.id || review.reviewId} className="bg-white rounded-lg p-4 mb-4">
      <View className="flex-row items-center gap-3 mb-3">
        <Image
          source={{ uri: review.userImage }}
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1">
          <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>{review.userName}</Text>
          <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{review.timeAgo}</Text>
        </View>
      </View>

      <View className="flex-row items-center gap-1 mb-3">
        {renderStars(review.rating, 20)}
      </View>

      <Text className="text-base leading-relaxed text-gray-700 mb-4" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
        {review.content}
      </Text>

      <View className="flex-row items-center gap-6">
        <TouchableOpacity className="flex-row items-center gap-2">
          <ThumbsUp size={20} color="#6B7280" />
          <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>{review.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-2">
          <ThumbsDown size={20} color="#6B7280" />
          <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>{review.dislikes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Extract hotelReviewsData from reviewsData if available
  const hotelReviewsData = reviewsData?.data?.booking?.reviewData;
  const reviews = reviewsData?.reviews || reviewsData?.data?.booking?.reviews || []; // Fallback for different structures

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
            {hotelReviewsData && (
              <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {hotelReviewsData.rating} • {reviews.length} reviews
              </Text>
            )}
          </View>
          <View className="w-10" />
        </View>

        {/* Rating Summary - This part needs to be adjusted if hotelReviewsData structure differs */}
        {hotelReviewsData && (
          <View className="px-6 pb-6">
            <View className="flex-row items-start justify-between gap-6">
              <View className="flex-col items-start gap-1">
                <Text className="text-5xl text-gray-900" style={{ fontFamily: 'PlusJakartaSans-ExtraBold' }}>{hotelReviewsData.rating}</Text>
                <View className="flex-row items-center gap-1 mb-1">
                  {renderStars(Math.floor(hotelReviewsData.rating))}
                </View>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{reviews.length} reviews</Text>
              </View>

              <View className="flex-1 min-w-[200px] gap-2">
                {/* Rating breakdown might not be directly available in reviewData, adjust if needed */}
                {[5, 4, 3, 2, 1].map((rating) =>
                  renderRatingBar(rating, hotelReviewsData.ratingBreakdown?.[rating as keyof typeof hotelReviewsData.ratingBreakdown] || 0)
                )}
              </View>
            </View>
          </View>
        )}

        {/* Sort Options */}
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

        {/* Reviews List */}
        <ScrollView
          className="bg-gray-50 px-6 py-6"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 400 }}
        >
          {reviews.map((review, index) => (
            <View key={review.id || index} className="bg-white rounded-lg p-4 mb-4">
              <View className="flex-row items-center gap-3 mb-3">
                <Image
                  source={{ uri: review.userImage || 'https://via.placeholder.com/40' }} // Fallback image
                  className="w-10 h-10 rounded-full"
                />
                <View className="flex-1">
                  <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                    {review.userName || review.userName}
                  </Text>
                  <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    {review.timeAgo || 'Just now'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1 mb-3">
                {renderStars(review.rating || 0, 20)}
              </View>

              <Text className="text-base leading-relaxed text-gray-700 mb-4" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {review.comment || 'No comment provided.'}
              </Text>

              <View className="flex-row items-center gap-6">
                <TouchableOpacity className="flex-row items-center gap-2">
                  <ThumbsUp size={20} color="#6B7280" />
                  <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>{review.likes || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-row items-center gap-2">
                  <ThumbsDown size={20} color="#6B7280" />
                  <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>{review.dislikes || 0}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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