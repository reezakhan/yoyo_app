import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import ActionSheet, { SheetProps } from 'react-native-actions-sheet';
import { X, MapPin, Calendar, CheckCircle, Star } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const ReviewSheet = (props: any) => {
  const { payload } = props;
  const booking = payload?.booking;
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = async () => {
    if (!booking || !reviewComment.trim()) {
      Alert.alert('Error', 'Please enter a comment for your review');
      return;
    }

    try {
      setSubmittingReview(true);
      
      const reviewData = {
        bookingId: booking.id,
        hotelId: booking.hotelId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      };

      const response = await apiService.post('/details/review', reviewData);
      
      if (response.success) {
        setReviewSubmitted(true);
        payload?.onReviewSubmitted?.();
        
        // Auto close after 2 seconds
        setTimeout(() => {
          props.sheetRef?.current?.hide();
        }, 2000);
      } else {
        Alert.alert('Error', response.error || 'Failed to submit review');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, onPress?: (rating: number) => void) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => onPress?.(i)}
          disabled={!onPress}
        >
          <Star
            size={32}
            color={i <= rating ? '#FCD34D' : '#D1D5DB'}
            fill={i <= rating ? '#FCD34D' : '#D1D5DB'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const formatDate = (dateString: string) => {
    const localDateString = dateString.replace('Z', '');
    const date = new Date(localDateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleClose = () => {
    setReviewRating(5);
    setReviewComment('');
    setSubmittingReview(false);
    setReviewSubmitted(false);
    props.sheetRef?.current?.hide();
  };

  return (
    <ActionSheet
      ref={props.sheetRef}
      containerStyle={{
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '95%',
      }}
      gestureEnabled={true}
      defaultOverlayOpacity={0.3}
    >
      <View className=" bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={handleClose} className="p-2 -ml-2">
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg text-gray-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            {reviewSubmitted ? 'Review Submitted' : 'Review your stay'}
          </Text>
          <View className="w-10" />
        </View>

        {reviewSubmitted ? (
          // Success State
          <View className=" items-center justify-center px-6">
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
              <CheckCircle size={40} color="#10B981" />
            </View>
            
            <Text className="text-2xl text-gray-900 text-center mb-3" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Thank you for your review!
            </Text>
            
            <Text className="text-base text-gray-600 text-center mb-6" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              Your feedback helps us improve our service and helps other travelers make better choices.
            </Text>

            {/* Review Summary */}
            <View className="bg-gray-50 rounded-xl p-4 w-full mb-8">
              <Text className="text-sm text-gray-500 text-center mb-2" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                Your Review
              </Text>
              
              <Text className="text-lg text-gray-900 text-center mb-3" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {booking?.hotelName}
              </Text>
              
              <View className="flex-row items-center justify-center mb-3">
                {renderStars(reviewRating)}
              </View>
              
              <Text className="text-sm text-gray-700 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                "{reviewComment}"
              </Text>
            </View>
          </View>
        ) : (
          // Review Form
          <ScrollView className="" showsVerticalScrollIndicator={false}>
            <View className="px-6 py-6">
              {/* Hotel Info */}
              <View className="mb-8">
                <View className="bg-gray-50 rounded-xl p-4">
                  {booking?.image && (
                    <Image
                      source={{ uri: booking.image }}
                      className="w-full h-32 rounded-lg mb-4"
                      style={{ resizeMode: 'cover' }}
                    />
                  )}
                  
                  <Text className="text-xl text-gray-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    {booking?.hotelName}
                  </Text>
                  
                  <View className="flex-row items-center mb-2">
                    <MapPin size={16} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      {booking?.address}
                    </Text>
                  </View>
                  
                  <Text className="text-base text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                    {booking?.roomType}
                  </Text>
                  
                  <View className="flex-row items-center mt-2">
                    <Calendar size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      {booking?.checkIn && booking?.checkOut && 
                        `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}`
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Rating Section */}
              <View className="mb-8">
                <Text className="text-xl text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  How was your overall experience?
                </Text>
                
                <View className="bg-gray-50 rounded-xl p-6 items-center">
                  <View className="flex-row items-center gap-3 mb-4">
                    {renderStars(reviewRating, setReviewRating)}
                  </View>
                  
                  <Text className="text-base text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                    {reviewRating === 5 && "Excellent!"}
                    {reviewRating === 4 && "Very Good"}
                    {reviewRating === 3 && "Good"}
                    {reviewRating === 2 && "Fair"}
                    {reviewRating === 1 && "Poor"}
                  </Text>
                </View>
              </View>

              {/* Comment Section */}
              <View className="mb-8">
                <Text className="text-xl text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  Tell us more about your stay
                </Text>
                
                <View className="bg-gray-50 rounded-xl p-4">
                  <TextInput
                    className="text-base min-h-32"
                    style={{ fontFamily: 'PlusJakartaSans-Regular', textAlignVertical: 'top' }}
                    placeholder="Share your experience, what you liked, or suggestions for improvement..."
                    placeholderTextColor="#9CA3AF"
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    numberOfLines={6}
                  />
                </View>
                
                <Text className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Your review will help other travelers and the property improve their service.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Submit Button - Only show in form state */}
        {!reviewSubmitted && (
          <View className="px-6 py-4 border-t border-gray-100">
            <TouchableOpacity
              className={`w-full py-4 rounded-xl items-center ${
                submittingReview || !reviewComment.trim() 
                  ? 'bg-gray-300' 
                  : 'bg-black'
              }`}
              onPress={handleSubmitReview}
              disabled={submittingReview || !reviewComment.trim()}
            >
              {submittingReview ? (
                <View className="flex-row items-center">
                  <LoadingSpinner size="small" color="white" />
                  <Text className="text-white text-lg ml-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    Submitting...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  Submit Review
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ActionSheet>
  );
};

export default ReviewSheet;