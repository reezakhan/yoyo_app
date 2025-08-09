import React, { useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { SheetManager } from 'react-native-actions-sheet';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useWishlist } from '@/contexts/WishlistContext';
import { HeartIcon } from '@/components/ui/HeartIcon';
import { Plus, Minus, Check } from 'lucide-react-native';

interface Addon {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  status: string;
}

interface SelectedAddon extends Addon {
  quantity: number;
}

const HotelDetails = () => {
  const { id, guests, checkIn, checkOut, bookingType } = useLocalSearchParams();
  const navigation = useNavigation()
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollViewRef = useRef(null);
  const [searchParams, setSearchParams] = useState({
    guests: (guests as string) || '2',
    checkIn: (checkIn as string) || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    checkOut: (checkOut as string) || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    bookingType: bookingType || 'daily' // Default to daily, will be updated based on search params
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const { addToWishlist, removeFromWishlistByHotelId, isInWishlist } = useWishlist();

  

  // Wishlist handlers
  const handleWishlistToggle = async () => {
    if (!hotel) return;

    try {
      const isCurrentlyInWishlist = isInWishlist(hotel.id);

      if (isCurrentlyInWishlist) {
        await removeFromWishlistByHotelId(hotel.id);
      } else {
        await addToWishlist(hotel.id);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      Alert.alert('Error', 'Failed to update wishlist. Please try again.');
    }
  };

  useEffect(() => {
    fetchHotelDetails();
  }, [id, searchParams]);

  const fetchHotelDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('guests', searchParams.guests);
      params.append('checkIn', searchParams.checkIn);
      params.append('checkOut', searchParams.checkOut);
      params.append('bookingType', searchParams.bookingType)

      const queryString = params.toString();
      const url = `/hotels/${id}/details?${queryString}`;



      const response = await apiService.get(url);

      console.log('response in hotel details ', JSON.stringify(response))

      if (response.success) {
        setHotel(response.data.hotel);
        // Set initial selected room if available
        if (response.data.hotel.roomUpgradeData?.currentRoom) {
          setSelectedRoom(response.data.hotel.roomUpgradeData.currentRoom);
        }
      } else {
        setError('Failed to fetch hotel details');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShadowVisible: false,
      headerTitle: () => (
        <Text className="text-xl text-[#121516]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Details</Text>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  // Helper function to get amenity icon and label
  const getAmenityInfo = (amenityCode) => {
    const amenityMap = {
      'business_center': { icon: 'business', label: 'Business Center' },
      'parking': { icon: 'car', label: 'Parking' },
      'restaurant': { icon: 'restaurant', label: 'Restaurant' },
      'wifi': { icon: 'wifi', label: 'Free Wi-Fi' },
      'pool': { icon: 'water', label: 'Swimming Pool' },
      'gym': { icon: 'fitness', label: 'Fitness Center' },
      'spa': { icon: 'leaf', label: 'Spa' },
      'room_service': { icon: 'room-service', label: 'Room Service' },
      'laundry': { icon: 'shirt', label: 'Laundry' },
      'concierge': { icon: 'person', label: 'Concierge' }
    };
    return amenityMap[amenityCode] || { icon: 'checkmark-circle', label: amenityCode };
  };

  // Helper function to get image URL
  const getImageUrl = (imageObj) => {
    if (typeof imageObj === 'string') return imageObj;
    if (imageObj && imageObj.url) return imageObj.url;
    return 'https://via.placeholder.com/400x300?text=No+Image';
  };

  // Helper function to get all image URLs
  const getAllImageUrls = (images) => {

    console.log('images came re ', images)
    if (!images || images.length === 0) {
      return ['https://via.placeholder.com/400x300?text=No+Image'];
    }

    // Handle different image formats from backend
    let imageUrls = [];

    if (Array.isArray(images)) {
      imageUrls = images.map(img => getImageUrl(img));
    } else if (images.primary) {
      // Backend format with primary and gallery
      imageUrls.push(images.primary);
      if (images.gallery && Array.isArray(images.gallery)) {
        imageUrls.push(...images.gallery);
      }
    }

    // Filter out null/undefined URLs and ensure we have at least one image
    imageUrls = imageUrls.filter(url => url && url.trim() !== '');

    if (imageUrls.length === 0) {
      return ['https://via.placeholder.com/400x300?text=No+Image'];
    }


    return imageUrls;
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handler for editing search parameters
  const handleEditSearch = () => {
    SheetManager.show('editstay', {
      payload: {
        searchData: {
          guests: {
            adults: parseInt(searchParams.guests) || 2,
            children: 0,
            infants: 0
          },
          dateRange: searchParams.bookingType === 'daily' ? {
            startDate: searchParams.checkIn,
            endDate: searchParams.checkOut
          } : undefined,
          timeRange: searchParams.bookingType === 'hourly' ? {
            selectedDate: searchParams.checkIn.split('T')[0],
            startDateTime: searchParams.checkIn,
            endDateTime: searchParams.checkOut,
            startTime: new Date(searchParams.checkIn).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            endTime: new Date(searchParams.checkOut).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          } : undefined,
          bookingType: searchParams.bookingType
        },
        onSearch: (newSearchData) => {
          const totalGuests = newSearchData.guests.adults + newSearchData.guests.children;

          if (newSearchData.bookingType === 'daily' && newSearchData.dateRange) {
            setSearchParams({
              guests: totalGuests.toString(),
              checkIn: newSearchData.dateRange.startDate,
              checkOut: newSearchData.dateRange.endDate,
              bookingType: 'daily'
            });
          } else if (newSearchData.bookingType === 'hourly' && newSearchData.timeRange) {
            setSearchParams({
              guests: totalGuests.toString(),
              checkIn: newSearchData.timeRange.startDateTime!,
              checkOut: newSearchData.timeRange.endDateTime!,
              bookingType: 'hourly'
            });
          }
        }
      }
    });
  };

  // Handler for room selection
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    // Clear selected addons when room changes
    setSelectedAddons([]);
  };

  // Handler for addon selection
  const handleAddonToggle = (addon: Addon) => {
    setSelectedAddons(prev => {
      const existingIndex = prev.findIndex(item => item.id === addon.id);

      if (existingIndex >= 0) {
        // Remove addon if already selected
        return prev.filter(item => item.id !== addon.id);
      } else {
        // Add addon with quantity 1
        return [...prev, { ...addon, quantity: 1 }];
      }
    });
  };

  // Handler for addon quantity change
  const handleAddonQuantityChange = (addonId: string, increment: boolean) => {
    setSelectedAddons(prev =>
      prev.map(addon => {
        if (addon.id === addonId) {
          if (increment) {
            return { ...addon, quantity: addon.quantity + 1 };
          } else {
            // Don't allow decreasing below 1, just remove the addon
            if (addon.quantity <= 1) {
              return addon; // Keep it as is, the remove functionality should be handled by the X button
            }
            return { ...addon, quantity: addon.quantity - 1 };
          }
        }
        return addon;
      })
    );
  };

  // Handler for removing addon completely
  const handleRemoveAddon = (addonId: string) => {
    setSelectedAddons(prev => prev.filter(addon => addon.id !== addonId));
  };

  // Check if addon is selected
  const isAddonSelected = (addonId: string) => {
    return selectedAddons.some(addon => addon.id === addonId);
  };

  // Get addon quantity
  const getAddonQuantity = (addonId: string) => {
    const addon = selectedAddons.find(addon => addon.id === addonId);
    return addon?.quantity || 0;
  };

  // Calculate total addon price
  const calculateAddonTotal = () => {
    return selectedAddons.reduce((total, addon) => total + (addon.price * addon.quantity), 0);
  };

  // Get current room price
  const getCurrentRoomPrice = () => {
    if (selectedRoom) {
      return selectedRoom.displayPrice;
    }
    return hotel?.pricing?.startingFrom || hotel?.price || 0;
  };

  // Get total price including addons
  const getTotalPrice = () => {
    return getCurrentRoomPrice() + calculateAddonTotal();
  };

  // Check if rooms are available
  const areRoomsAvailable = () => {
    return hotel?.roomUpgradeData?.currentRoom ||
      (hotel?.roomUpgradeData?.upgradeOptions && hotel.roomUpgradeData.upgradeOptions.length > 0);
  };

  // Handle booking
  const handleBookNow = () => {
    if (!areRoomsAvailable()) return;
    console.log('selectedRoom ',selectedRoom)
    const bookingData = {
      hotelId: hotel.id,
      roomId: selectedRoom?.id || hotel.roomUpgradeData?.currentRoom?.id,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      guests: parseInt(searchParams.guests),
      hotelName: hotel.name,
      roomName: selectedRoom?.name || hotel.roomUpgradeData?.currentRoom?.name || 'Standard Room',
      totalAmount: getCurrentRoomPrice(),
      // Convert selectedAddons to JSON string properly
      selectedAddons: JSON.stringify(selectedAddons),
      addonTotal: calculateAddonTotal(),
      address: hotel.address,
      image: selectedRoom.images[0].url || 'https://via.placeholder.com/400x300',
      bookingType: searchParams.bookingType
    };


    router.push({
      pathname: '/checkout',
      params: bookingData
    });
  };

  if (loading) {
    return <LoadingSpinner  text="Loading hotel details..." />;
  }

  if (error || !hotel) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-lg text-gray-500 mb-4" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
          {error || 'Hotel not found'}
        </Text>
        <TouchableOpacity
          className="bg-black px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const imageUrls = getAllImageUrls(hotel.images);
  const currentRating = hotel.rating || 0;
  const reviewCount = hotel.reviewCount || 0;
  const reviewsData = hotel.reviewsData || {};
  const ratingBreakdown = reviewsData.ratingBreakdown || {};

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />

      <ScrollView
        className="flex-1"
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        <View className="relative">
          <ScrollView
            ref={imageScrollViewRef}
            horizontal={true} // Explicitly set to true
            pagingEnabled={true} // Explicitly set to true
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const contentOffset = event.nativeEvent.contentOffset.x;
              const viewSize = event.nativeEvent.layoutMeasurement.width;
              const pageIndex = Math.round(contentOffset / viewSize);
              setCurrentImageIndex(pageIndex);
              console.log('Current page index:', pageIndex); // Debug log
            }}

            // Add these props for better debugging:
            bounces={false}
            decelerationRate="fast"
            snapToInterval={Dimensions.get('window').width}
            snapToAlignment="center"
            style={{ height: 320 }}  // Add this line
            contentContainerStyle={{
              width: imageUrls.length * Dimensions.get('window').width,
              height: 320  // Add this line too
            }}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
            directionalLockEnabled={true}
          >
            {imageUrls.map((imageUrl, index) => (
              <View key={index} style={{ width: Dimensions.get('window').width }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: 320, resizeMode: 'cover' }}
                  // style={{ resizeMode: 'cover' }}
                  onError={(error) => console.log('Image load error:', error)} // Debug image loading
                />
              </View>
            ))}
          </ScrollView>

          {/* Rest of your overlay code... */}
          {/* <View className="absolute inset-0 bg-black/40" /> */}

          <HeartIcon
            isInWishlist={isInWishlist(hotel.id)}
            onPress={handleWishlistToggle}
            size={24}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
          />

          {imageUrls.length > 1 && (
            <View className="absolute bottom-5 left-0 right-0 flex-row justify-center gap-2">
              {imageUrls.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCurrentImageIndex(index);
                    imageScrollViewRef.current?.scrollTo({
                      x: index * Dimensions.get('window').width,
                      animated: true
                    });
                  }}
                  className={`h-2 rounded-full ${index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                />
              ))}
            </View>
          )}
        </View>

        {/* Hotel Info */}
        <View className="p-5 pb-6">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                {hotel.name}
              </Text>
              {/* {hotel.starRating && (
                <Text className="mt-1 text-stone-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  {hotel.starRating}
                </Text>
              )} */}
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={20} color="#facc15" />
              <Text className="text-lg text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                {currentRating > 0 ? currentRating.toFixed(1) : 'New'}
              </Text>
            </View>
          </View>

          <View className='flex-row items-center justify-between gap-4'>
            <View className="flex-1 flex-row items-start gap-2">
              <Ionicons name="location" size={16} color="#6b7280" className="mt-0.5" />
              <Text
                className="flex-1 text-stone-500"
                style={{ fontFamily: 'PlusJakartaSans-Regular' }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {hotel.address}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                // Open in maps
                const url = `https://maps.google.com/?q=${encodeURIComponent(hotel.address)}`;
                Linking.openURL(url);
              }}
              className="p-2 bg-stone-100 rounded-full"
            >
              <Ionicons name="navigate" size={18} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
        <View className=" p-5 border-t  border-stone-200">
          <Text className="text-lg text-stone-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Why Book YoyoLite?
          </Text>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-stone-100 rounded-xl p-4 items-center">
              <Text className="text-sm text-stone-900 text-center" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                100% Verified{'\n'}Clean Rooms
              </Text>
            </View>
            <View className="flex-1 bg-stone-100 rounded-xl p-4 items-center">
              <Text className="text-sm text-stone-900 text-center" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                Express{'\n'}Check-in
              </Text>
            </View>
            <View className="flex-1 bg-stone-100 rounded-xl p-4 items-center">
              <Text className="text-sm text-stone-900 text-center" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                No{'\n'}Hidden Charges
              </Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View className="border-t border-b border-stone-200 p-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Your {searchParams.bookingType === 'daily' ? 'stay' : 'booking'}
            </Text>
            <TouchableOpacity
              onPress={handleEditSearch}
              className="flex-row items-center gap-1"
            >
              <Text className="text-base text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                Edit
              </Text>
              <Ionicons name="create-outline" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {searchParams.bookingType === 'daily' ? 'Check-in' : 'Start time'}
              </Text>
              <Text className="text-base text-stone-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {searchParams.bookingType === 'daily'
                  ? formatDate(searchParams.checkIn)
                  : new Date(searchParams.checkIn).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                }
              </Text>
            </View>
            <View className="w-8 h-px bg-stone-300" />
            <View>
              <Text className="text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {searchParams.bookingType === 'daily' ? 'Check-out' : 'End time'}
              </Text>
              <Text className="text-base text-stone-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {searchParams.bookingType === 'daily'
                  ? formatDate(searchParams.checkOut)
                  : new Date(searchParams.checkOut).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })
                }
              </Text>
            </View>
            <View>
              <Text className="text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Guests
              </Text>
              <Text className="text-base text-stone-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {searchParams.guests} {parseInt(searchParams.guests) === 1 ? 'guest' : 'guests'}
              </Text>
            </View>
          </View>
        </View>

        {/* Amenities */}
        <View className="border-b border-stone-200 p-5">
          <Text className="text-lg text-stone-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Amenities</Text>

          <View className="flex-row flex-wrap">
            {hotel.amenities && hotel.amenities.slice(0, 4).map((amenity, index) => {
              const amenityInfo = getAmenityInfo(amenity);
              return (
                <View key={index} className="w-1/2 mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-stone-100 rounded-full items-center justify-center">
                      <Ionicons name={amenityInfo.icon} size={24} color="#57534e" />
                    </View>
                    <Text className="text-stone-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      {amenityInfo.label}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Show default amenities if none provided */}
            {(!hotel.amenities || hotel.amenities.length === 0) && (
              <>
                <View className="w-1/2 mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-stone-100 rounded-full items-center justify-center">
                      <Ionicons name="wifi" size={24} color="#57534e" />
                    </View>
                    <Text className="text-stone-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Free Wi-Fi</Text>
                  </View>
                </View>
                <View className="w-1/2 mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-stone-100 rounded-full items-center justify-center">
                      <Ionicons name="car" size={24} color="#57534e" />
                    </View>
                    <Text className="text-stone-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Parking</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-between w-full mt-2"
            onPress={() => SheetManager.show('amenities', {
              payload: {
                amenities: hotel.amenities || []
              }
            })}
          >
            <Text className="text-base text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              View All Amenities
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* Room Upgrades - Keep existing UI, just change onPress */}
        <View className="border-b border-stone-200 p-5">
          <Text className="text-lg text-stone-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Room Options</Text>

          <View className="gap-4">
            {/* Current Room - Only change onPress */}
            {hotel.roomUpgradeData?.currentRoom && (
              <TouchableOpacity
                onPress={() => SheetManager.show('roomSelection', {
                  payload: {
                    hotel: hotel,
                    selectedRoomFromMain: hotel.roomUpgradeData.currentRoom, // Pass the specific room that was clicked
                    currentRoom: selectedRoom || hotel.roomUpgradeData?.currentRoom,
                    onRoomSelect: handleRoomSelect,
                    bookingType: searchParams.bookingType
                  }
                })}
                className={`flex-row items-center gap-4 p-4 border rounded-xl ${selectedRoom?.id === hotel.roomUpgradeData.currentRoom.id
                  ? 'border-black bg-black/5'
                  : 'border-stone-200'
                  }`}
              >
                {/* Keep all existing content exactly the same */}
                <Image
                  source={{
                    uri: hotel.roomUpgradeData.currentRoom.images[0].url || imageUrls[0]
                  }}
                  className="w-24 h-24 rounded-lg"
                  style={{ resizeMode: 'cover' }}
                />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-sm text-green-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                      Current Selection
                    </Text>
                    {selectedRoom?.id === hotel.roomUpgradeData.currentRoom.id && (
                      <View className="w-5 h-5 bg-black rounded-full items-center justify-center">
                        <Check size={12} color="white" />
                      </View>
                    )}
                  </View>
                  <Text className="text-base text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    {hotel.roomUpgradeData.currentRoom.name}
                  </Text>
                  <Text className="mt-1 text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    {hotel.roomUpgradeData.currentRoom.features}
                  </Text>
                  <Text className="mt-1 text-sm text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    ₹{hotel.roomUpgradeData.currentRoom.displayPrice}/ {bookingType === 'hourly' ? 'hour' : 'night'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Upgrade Options - Only change onPress for each */}
            {hotel.roomUpgradeData?.upgradeOptions?.map((room, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => SheetManager.show('roomSelection', {
                  payload: {
                    hotel: hotel,
                    selectedRoomFromMain: room, // Pass the specific room that was clicked
                    currentRoom: selectedRoom || hotel.roomUpgradeData?.currentRoom,
                    onRoomSelect: handleRoomSelect,
                    bookingType: searchParams.bookingType
                  }
                })}
                className={`flex-row items-center gap-4 p-4 border rounded-xl ${selectedRoom?.id === room.id
                  ? 'border-black bg-black/5'
                  : 'border-stone-200'
                  }`}
              >
                {/* Keep all existing content exactly the same */}
                <Image
                  source={{
                    uri: room.image || imageUrls[0]
                  }}
                  className="w-24 h-24 rounded-lg"
                  style={{ resizeMode: 'cover' }}
                />
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                      Upgrade Available
                    </Text>
                    {selectedRoom?.id === room.id && (
                      <View className="w-5 h-5 bg-black rounded-full items-center justify-center">
                        <Check size={12} color="white" />
                      </View>
                    )}
                  </View>
                  <Text className="text-base text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    {room.name}
                  </Text>
                  <Text className="mt-1 text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    {room.features}
                  </Text>
                  <Text className="mt-1 text-sm text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    ₹{room.displayPrice}/{bookingType === 'hourly' ? 'hour' : 'night'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add-ons Section - Horizontal Scrollable */}
        {((selectedRoom?.addons && selectedRoom?.addons.length > 0) || (hotel?.roomUpgradeData?.currentRoom?.addons && hotel?.roomUpgradeData?.currentRoom?.addons.length > 0)) && (
          <View className="border-b border-stone-200 py-5">
            <View className="px-5 mb-4">
              <Text className="text-lg text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Add-ons
              </Text>
              <Text className="text-sm text-stone-500 mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Enhance your stay with these optional services
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5"
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <View className="flex-row gap-4">
                {(selectedRoom?.addons || hotel?.roomUpgradeData?.currentRoom?.addons || []).map((addon: Addon, index) => {
                  const isSelected = isAddonSelected(addon.id);
                  const quantity = getAddonQuantity(addon.id);

                  return (
                    <View key={addon.id} className="w-72 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                      <View className="relative">
                        <Image
                          source={{ uri: addon.image }}
                          className="w-full h-48"
                          style={{ resizeMode: 'cover' }}
                        />
                        <View className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                          <Text className="text-sm text-stone-900 font-medium" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            ₹{addon.price}
                          </Text>
                        </View>
                      </View>

                      <View className="p-5">
                        <Text className="text-lg text-stone-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                          {addon.name}
                        </Text>
                        <Text className="text-sm text-stone-600 mb-4 leading-5" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                          {addon.description}
                        </Text>

                        {!isSelected ? (
                          <TouchableOpacity
                            onPress={() => handleAddonToggle(addon)}
                            className="flex-row items-center justify-center gap-2 bg-black rounded-xl py-3.5"
                          >
                            <Plus size={18} color="white" />
                            <Text className="text-white text-base" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                              Add to Stay
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="flex gap-y-3">
                            <View className="flex-row items-center justify-between bg-stone-50 rounded-xl p-3">
                              <View className="flex-1">
                                <Text className="text-sm text-stone-600 mb-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                  Quantity
                                </Text>
                                <Text className="text-base text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                  {quantity} {quantity === 1 ? 'item' : 'items'}
                                </Text>
                              </View>

                              <View className="flex-row items-center gap-3">
                                <TouchableOpacity
                                  onPress={() => handleAddonQuantityChange(addon.id, false)}
                                  className="w-10 h-10 rounded-full bg-white border border-stone-200 items-center justify-center shadow-sm"
                                  disabled={quantity <= 1}
                                >
                                  <Minus size={16} color={quantity <= 1 ? "#d6d3d1" : "#374151"} />
                                </TouchableOpacity>

                                <Text className="text-lg text-stone-900 w-8 text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                  {quantity}
                                </Text>

                                <TouchableOpacity
                                  onPress={() => handleAddonQuantityChange(addon.id, true)}
                                  className="w-10 h-10 rounded-full bg-black items-center justify-center shadow-sm"
                                >
                                  <Plus size={16} color="white" />
                                </TouchableOpacity>
                              </View>
                            </View>

                            {/* Remove Button */}
                            <TouchableOpacity
                              onPress={() => handleRemoveAddon(addon.id)}
                              className="flex-row items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-xl py-3"
                            >
                              <Ionicons name="trash-outline" size={16} color="#dc2626" />
                              <Text className="text-red-600 text-base" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                Remove
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        <View className="border-b border-stone-200 p-5 hidden">
          <Text className="text-lg text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Reviews</Text>

          {reviewCount > 0 ? (
            <>
              <View className="mt-4 flex-row items-center gap-8">
                <View className="items-center gap-1">
                  <Text className="text-5xl text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    {currentRating.toFixed(1)}
                  </Text>
                  <View className="flex-row gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Ionicons
                        key={index}
                        name={index < Math.floor(currentRating) ? "star" : "star-outline"}
                        size={16}
                        color={index < Math.floor(currentRating) ? "#facc15" : "#d6d3d1"}
                      />
                    ))}
                  </View>
                  <Text className="text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    {reviewCount} reviews
                  </Text>
                </View>

                <View className="flex-1">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingBreakdown[rating] || 0;
                    const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;

                    return (
                      <View key={rating} className="flex-row items-center gap-3 mb-2">
                        <Text className="text-sm text-stone-700 w-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                          {rating}
                        </Text>
                        <View className="flex-1 h-1.5 bg-stone-200 rounded-full">
                          <View
                            className="h-1.5 bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </View>
                        <Text className="text-sm text-stone-500 w-8" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                          {percentage}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity onPress={() => SheetManager.show('reviews')} className="mt-5 flex-row items-center justify-between">
                <Text className="text-base text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  View All Reviews
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#dc2626" />
              </TouchableOpacity>
            </>
          ) : (
            <View className="mt-4 py-8 items-center">
              <Ionicons name="star-outline" size={48} color="#d6d3d1" />
              <Text className="mt-2 text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                No reviews yet
              </Text>
              <Text className="text-sm text-stone-400" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Be the first to review this hotel
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Booking Bar */}
      <View className="bg-white p-4 shadow-lg border-t border-stone-100">
        {areRoomsAvailable() ? (
          <View className="flex-row items-center justify-between">
            <View>
              <View className="flex-row items-baseline gap-1">
                <Text className="text-2xl text-stone-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  ₹{getCurrentRoomPrice().toLocaleString()}
                </Text>
                {selectedAddons.length > 0 && (
                  <Text className="text-lg text-stone-600" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                    +₹{calculateAddonTotal().toLocaleString()}
                  </Text>
                )}
              </View>
              <Text className="text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>/{searchParams.bookingType === 'hourly' ? 'hour' : 'night'}</Text>
              {selectedAddons.length > 0 && (
                <Text className="text-sm text-stone-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Total: ₹{getTotalPrice().toLocaleString()}/{searchParams.bookingType === 'hourly' ? 'hour' : 'night'}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={handleBookNow} className="bg-black px-6 py-3 rounded-full">
              <Text className="text-base text-white" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Book Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center">
            <Text className="text-xl text-stone-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              No Rooms Available
            </Text>
            <Text className="text-sm text-stone-500 mb-4 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              Try changing your check-in/check-out dates or number of guests for room availability
            </Text>
            <TouchableOpacity
              onPress={handleEditSearch}
              className="bg-black px-6 py-3 rounded-full"
            >
              <Text className="text-base text-white" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Change Dates/Guests
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HotelDetails;