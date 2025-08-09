
import React, { useState, useLayoutEffect, useCallback, useRef } from "react"
import { View, Text, TouchableOpacity, Image, SafeAreaView, ScrollView, RefreshControl } from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { router } from "expo-router"
import { useBookings } from '@/hooks/useBookings'
import { BookingCardSkeleton } from '@/components/ui/SkeletonLoader'



export default function MyTripsApp() {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()

  const { bookings, loading, error, refresh, getUpcomingBookings, getPastBookings } = useBookings()

  // Refresh data when screen comes into focus (when user navigates back)
  const didMountRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (didMountRef.current) refresh();
      else didMountRef.current = true;
    }, [refresh])
  );

  // Get filtered bookings based on active tab
  const getFilteredBookings = () => {
    if (activeTab === 'upcoming') {
      return getUpcomingBookings();
    } else {
      return getPastBookings();
    }
  };

  const filteredBookings = getFilteredBookings();

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  // Hide the default header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShadowVisible: false,
      headerTitle: () => (
        <Text className="text-2xl text-[#121516]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Bookings</Text>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const formatDate = (dateString: string) => {
    // Remove the 'Z' to treat it as local time instead of UTC
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


  const formatTime = (dateString: string) => {
    const date = new Date(dateString + 'Z');
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateDuration = (checkIn: string, checkOut: string, bookingType: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (bookingType === 'hourly') {
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const hours = Math.ceil(timeDiff / (1000 * 3600));
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return `${nights} ${nights === 1 ? 'night' : 'nights'}`;
    }
  };

  const getBookingTypeLabel = (bookingType: string) => {
    switch (bookingType) {
      case 'hourly':
        return 'Hourly Booking';
      case 'daily':
      case 'overnight':
      default:
        return 'Overnight Stay';
    }
  };

  const renderBookingCard = (booking: any) => {
    const duration = calculateDuration(booking.checkInDate, booking.checkOutDate, booking.bookingType);
    const isHourly = booking.bookingType === 'hourly';

    return (
      <TouchableOpacity
        key={booking.id}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
        onPress={() => router.push(`/booking-details/${booking.id}`)}
      >
        <View className="relative">
          <Image
            source={{
              uri: booking.room.image || "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=800"
            }}
            className="w-full h-48"
            style={{ resizeMode: 'cover' }}
          />
          <View className={`absolute top-3 right-3 px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
            <Text className="text-xs capitalize" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              {booking.status}
            </Text>
          </View>
          {/* Booking Type Badge */}
          <View className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/90">
            <Text className="text-xs text-gray-700" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              {getBookingTypeLabel(booking.bookingType)}
            </Text>
          </View>
        </View>

        <View className="p-4">
          {/* Hotel Name and Location */}
          <Text className="text-lg text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            {booking.hotel?.name || `Hotel Booking #${booking.id.slice(-8)}`}
          </Text>
          <Text className="text-sm text-gray-500 mb-3" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            {booking.hotel?.city || `Hotel ID: ${booking.hotelId}`}
            {booking.room?.name && ` • ${booking.room.name}`}
          </Text>

          {/* Date and Time Information */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {isHourly ? 'Start Time' : 'Check-in'}
              </Text>
              <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {formatDate(booking.checkInDate)}
              </Text>
              {isHourly && (
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  {formatTime(booking.checkInDate)}
                </Text>
              )}
            </View>
            <View className="w-8 h-px bg-gray-300" />
            <View>
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {isHourly ? 'End Time' : 'Check-out'}
              </Text>
              <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {formatDate(booking.checkOutDate)}
              </Text>
              {isHourly && (
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  {formatTime(booking.checkOutDate)}
                </Text>
              )}
            </View>
            {booking.guests && (
              <View>
                <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Guests
                </Text>
                <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  {booking.guests}
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View>
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Total amount
              </Text>
              <Text className="text-lg text-gray-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                ₹{booking.totalAmount.toLocaleString()}
              </Text>
              {/* Payment Status */}
              {booking.paymentStatus && (
                <Text className={`text-xs mt-1 ${booking.paymentStatus === 'pending' ? 'text-orange-600' : 'text-green-600'}`}
                  style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Payment: {booking.paymentStatus}
                </Text>
              )}
            </View>
            <View className="bg-gray-50 px-3 py-1 rounded">
              <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                {duration}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-white border-b border-gray-100">
        {/* Tab Navigation */}
        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity
            className={`flex-1 text-center py-3 ${activeTab === 'upcoming' ? 'border-b-2 border-black ' : ''}`}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text className={`text-center ${activeTab === 'upcoming' ? 'text-black ' : 'text-gray-500 '}`} style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 text-center py-3 ${activeTab === 'past' ? 'border-b-2 border-black ' : ''}`}
            onPress={() => setActiveTab('past')}
          >
            <Text className={`text-center ${activeTab === 'past' ? 'text-black ' : 'text-gray-500 '}`} style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000000']} // Android
            tintColor="#000000" // iOS
          />
        }
      >
        {loading && !refreshing ? (
          <View>
            {Array.from({ length: 3 }).map((_, index) => (
              <BookingCardSkeleton key={index} />
            ))}
          </View>
        ) : error ? (
          <View className="p-4 bg-gray-50 rounded-lg">
            <Text className="text-gray-600 text-center" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              {error}
            </Text>
            <TouchableOpacity onPress={refresh} className="mt-2">
              <Text className="text-gray-600 text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View className="flex-col items-center justify-center text-center p-6">
            {/* Luggage Illustration */}
            <View className="mb-6">
              <Image
                source={{
                  uri: "https://images.pexels.com/photos/1008155/pexels-photo-1008155.jpeg?auto=compress&cs=tinysrgb&w=300"
                }}
                className="w-48 h-48"
                style={{ resizeMode: 'contain' }}
              />
            </View>

            {/* Title */}
            <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              {activeTab === 'upcoming' ? 'No upcoming trips' : 'No past trips'}
            </Text>

            {/* Description */}
            <Text className="text-gray-600 max-w-xs mx-auto mb-8 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              {activeTab === 'upcoming'
                ? "It looks like you haven't booked anything yet. Let's find your next destination!"
                : "You haven't completed any trips yet. Start exploring to create amazing memories!"
              }
            </Text>

            {/* CTA Button */}
            <TouchableOpacity
              className="w-full max-w-xs items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-black shadow-lg"
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text className="text-white text-base" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Start Exploring
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
