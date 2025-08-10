import React, { useState, useLayoutEffect, useEffect, useRef } from "react"
import { View, Text, ScrollView, TouchableOpacity, ImageBackground, Pressable, Image, RefreshControl, Alert, Animated } from "react-native"
import { Svg, Path, Line, Circle } from "react-native-svg"
import { useNavigation } from "@react-navigation/native"
import { router } from "expo-router"
import { SheetManager } from "react-native-actions-sheet"
import { Search, Star, Heart, MapPin, Clock, Users, ArrowUpDown, ChevronDown, X, ListFilter as Filter } from "lucide-react-native"
import * as Location from 'expo-location'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNearbyHotels } from '@/hooks/useHotels'
import { HotelCardSkeleton } from '@/components/ui/SkeletonLoader'
import { useWishlist } from '@/contexts/WishlistContext'
import { HeartIcon } from '@/components/ui/HeartIcon'
import { useBookings } from '@/hooks/useBookings'
import { SafeAreaView } from "react-native-safe-area-context"
import { TimeRangePicker } from '@/components/ui/TimeRangePicker'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// SVG Icons as components
const MagnifyingGlassIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill={color}>
    <Path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
  </Svg>
)

const LocationIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
)

interface LocationState {
  coordinates: { lat: number; lng: number } | null
  hasPermission: boolean
  permissionDenied: boolean
  loading: boolean
  error: string | null
  fromCache: boolean
}

interface SearchFilters {
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  amenities?: string[];
  propertyType?: string[];
  sortBy?: string;
}

export default function HotelBookingApp() {
  const [location, setLocation] = useState<LocationState>({
    coordinates: null,
    hasPermission: false,
    permissionDenied: false,
    loading: true,
    error: null,
    fromCache: false
  })
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'recommended'
  });
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [stickyHeaderVisible, setStickyHeaderVisible] = useState(false);

  const navigation = useNavigation()
  const scrollY = useRef(new Animated.Value(0)).current
  const filterSectionY = useRef(0);

  const { addToWishlist, removeFromWishlistByHotelId, isInWishlist, forceRefresh } = useWishlist()
  const { getUpcomingBookings } = useBookings()

  // Get upcoming bookings
  const upcomingBookings = getUpcomingBookings()
  const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null

  // Use only nearby hotels hook
  const nearbyData = useNearbyHotels(location.coordinates, filters)

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 999999)) count++;
    if (filters.rating && filters.rating > 0) count++;
    if (filters.amenities && filters.amenities.length > 0) count++;
    if (filters.sortBy && filters.sortBy !== 'recommended') count++;
    return count;
  };

  // Clear specific filter
  const clearFilter = (filterType: string) => {
    const newFilters = { ...filters };
    switch (filterType) {
      case 'price':
        delete newFilters.priceRange;
        break;
      case 'rating':
        delete newFilters.rating;
        break;
      case 'amenities':
        delete newFilters.amenities;
        break;
      case 'sort':
        newFilters.sortBy = 'recommended';
        break;
    }
    setFilters(newFilters);
    setFiltersApplied(getActiveFiltersCount() > 0);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setFiltersApplied(getActiveFiltersCount() > 0);
  };

  // Wishlist handlers
  const handleWishlistToggle = async (hotel: any) => {
    try {
      const isCurrentlyInWishlist = isInWishlist(hotel.id)

      if (isCurrentlyInWishlist) {
        await removeFromWishlistByHotelId(hotel.id)
      } else {
        await addToWishlist(hotel.id)
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      Alert.alert('Error', 'Failed to update wishlist. Please try again.')
    }
  }

  // Location management with caching
  const loadCachedLocation = async () => {
    try {
      const cachedLocation = await AsyncStorage.getItem('user_location');
      if (cachedLocation) {
        const parsedLocation = JSON.parse(cachedLocation);
        setLocation(prev => ({
          ...prev,
          coordinates: parsedLocation,
          fromCache: true,
          loading: false
        }));
        return parsedLocation;
      }
      return null;
    } catch (error) {
      console.error('Error loading cached location:', error);
      return null;
    }
  };

  const saveLocationToCache = async (coordinates: { lat: number; lng: number }) => {
    try {
      await AsyncStorage.setItem('user_location', JSON.stringify(coordinates));
    } catch (error) {
      console.error('Error saving location to cache:', error);
    }
  };

  const shouldUpdateLocation = (cached: { lat: number; lng: number }, current: { lat: number; lng: number }) => {
    const distance = Math.sqrt(
      Math.pow(cached.lat - current.lat, 2) + Math.pow(cached.lng - current.lng, 2)
    );
    return distance > 0.01; // Update if moved more than ~1km
  };

  const requestLocationPermission = async (skipCache = false) => {
    try {
      if (!skipCache) {
        setLocation(prev => ({ ...prev, loading: true, error: null }));
      }

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocation(prev => ({
          ...prev,
          hasPermission: false,
          permissionDenied: true,
          loading: false,
          error: 'Location permission denied'
        }));
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoordinates = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      };

      // Check if we need to update cached location
      const cachedLocation = location.coordinates;
      if (!cachedLocation || shouldUpdateLocation(cachedLocation, newCoordinates)) {
        await saveLocationToCache(newCoordinates);
      }

      setLocation({
        coordinates: newCoordinates,
        hasPermission: true,
        permissionDenied: false,
        loading: false,
        error: null,
        fromCache: false
      });
    } catch (error) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to get location'
      }));
    }
  };

  const checkLocationPermission = async () => {
    try {
      // First load cached location
      const cached = await loadCachedLocation();

      const { status } = await Location.getForegroundPermissionsAsync();

      if (status === 'granted') {
        // Get fresh location in background
        requestLocationPermission(true);
      } else {
        setLocation(prev => ({
          ...prev,
          hasPermission: false,
          permissionDenied: status === 'denied',
          loading: false
        }));
      }
    } catch (error) {
      setLocation(prev => ({
        ...prev,
        error: 'Failed to check location permission',
        loading: false
      }));
    }
  };

  // Initialize location on component mount
  useEffect(() => {
    checkLocationPermission()
  }, [])

  const handleSearchFromSheet = (searchData: any) => {
    router.push({
      pathname: '/(tabs)/search',
      params: {
        searchData: JSON.stringify(searchData)
      }
    });
  };

  // Handle scroll for sticky header
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const currentY = event.nativeEvent.contentOffset.y;
        setStickyHeaderVisible(currentY > filterSectionY.current);
      }
    }
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <SafeAreaView edges={['top']} style={{ backgroundColor: 'white' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                width: '100%'
              }}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Search size={18} color="#6B7280" />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', color: '#111827' }}>
                  Current Location
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans-Regular', color: '#6B7280', fontSize: 12 }}>
                  26 Jul - 27 Jul • 1 guest
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )
    })
  }, [navigation])

  const handleRefresh = () => {
    if (!location.hasPermission) {
      requestLocationPermission()
    } else {
      nearbyData.refresh()
    }
  }

  const renderFilterTag = (
    label: string,
    isActive: boolean,
    onPress: () => void,
    onClear?: () => void,
    icon?: React.ReactNode,
    isSort?: boolean,
    shouldNotReopenOnClear?: boolean
  ) => (
    <View className="flex-row items-center">
      <TouchableOpacity
        className={`px-4 py-2 rounded-full flex-row items-center border ${isActive
          ? isSort
            ? 'bg-gray-100 border-black'
            : 'bg-black border-black'
          : 'bg-white border-gray-200'
          }`}
        onPress={onPress}
      >
        {icon && (
          <View className="mr-2">
            {icon}
          </View>
        )}
        <Text
          className={`${isActive ? (isSort ? 'text-black' : 'text-white') : 'text-gray-700'}`}
          style={{ fontFamily: 'PlusJakartaSans-Medium' }}
        >
          {label}
        </Text>
        {isActive && onClear && !isSort ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onClear();
              // Only re-open if shouldNotReopenOnClear is not true
              if (!shouldNotReopenOnClear) {
                setTimeout(() => {
                  onPress();
                }, 100);
              }
            }}
            className="ml-2"
          >
            <X size={14} color="white" />
          </TouchableOpacity>
        ) : (
          <View className="ml-2">
            <ChevronDown size={14} color={isActive ? (isSort ? "black" : "white") : "#6B7280"} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Sticky filter bar component
  const renderStickyFilterBar = () => {
    const activeFiltersCount = getActiveFiltersCount();
    const isPriceActive = filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 999999);
    const isRatingActive = filters.rating && filters.rating > 0;
    const isAmenitiesActive = filters.amenities && filters.amenities.length > 0;
    const isSortActive = filters.sortBy && filters.sortBy !== 'recommended';

    return (
      <View className="bg-white "
      //  style={{ elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
      >
        <View className="flex-row items-center px-4">
          {/* Scrollable filter tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-1 py-3"
            contentContainerStyle={{ paddingRight: 6 }}
          >
            <View className="flex-row gap-3">
              {renderFilterTag(
                'Sort',
                isSortActive,
                () => SheetManager.show('sort-options', {
                  payload: {
                    currentSort: filters.sortBy || 'recommended',
                    onSortSelect: (sortBy: string) => handleFilterChange({ sortBy })
                  }
                }),
                undefined, // No clear function for sort
                <ArrowUpDown size={14} color={isSortActive ? "black" : "#6B7280"} />,
                true // isSort flag
              )}

              {renderFilterTag(
                'Price',
                isPriceActive,
                () => SheetManager.show('price-filter', {
                  payload: {
                    currentPriceRange: filters.priceRange,
                    onPriceSelect: (priceRange: any) => handleFilterChange({ priceRange })
                  }
                }),
                isPriceActive ? () => clearFilter('price') : undefined,
                <Text className={`text-sm ${isPriceActive ? 'text-white' : 'text-gray-600'}`}>₹</Text>,
                false,
                true // shouldNotReopenOnClear
              )}

              {renderFilterTag(
                'Rating',
                isRatingActive,
                () => SheetManager.show('rating-filter', {
                  payload: {
                    currentRating: filters.rating || 0,
                    onRatingSelect: (rating: number) => handleFilterChange({ rating })
                  }
                }),
                isRatingActive ? () => clearFilter('rating') : undefined,
                <Star size={14} color={isRatingActive ? "white" : "#6B7280"} />,
                false,
                true // shouldNotReopenOnClear
              )}

              {renderFilterTag(
                'Amenities',
                isAmenitiesActive,
                () => SheetManager.show('amenities-filter', {
                  payload: {
                    currentAmenities: filters.amenities || [],
                    onAmenitiesSelect: (amenities: string[]) => handleFilterChange({ amenities })
                  }
                }),
                isAmenitiesActive ? () => clearFilter('amenities') : undefined,
                <Filter size={14} color={isAmenitiesActive ? "white" : "#6B7280"} />,
                false,
                true // shouldNotReopenOnClear
              )}
            </View>
          </ScrollView>

          {/* Fixed filter icon on the right */}
          <View className="right-0 top-0 bottom-0 bg-white flex-row items-center">
            <TouchableOpacity
              className="flex-row items-center bg-gray-100 px-3 py-2 rounded-full relative"
              onPress={() => SheetManager.show('filters', {
                payload: {
                  currentFilters: filters,
                  onApplyFilters: handleFilterChange
                }
              })}
            >
              <Filter size={16} color="#6B7280" />
              {activeFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-black rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Handle hourly booking selection - state for TimeRangePicker
  const [showTimeRangePicker, setShowTimeRangePicker] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [selectedHours, setSelectedHours] = useState<number>(3);
  const [timeRange, setTimeRange] = useState({
    selectedDate: null,
    startDateTime: null,
    endDateTime: null,
    startTime: null,
    endTime: null
  });

  const handleHourlyBooking = (hotel: any, hours: number) => {
    setSelectedHotel(hotel);
    setSelectedHours(hours);
    setTimeRange({
      selectedDate: null,
      startDateTime: null,
      endDateTime: null,
      startTime: null,
      endTime: null
    });
    setShowTimeRangePicker(true);
  };

  const handleTimeRangeSelect = (selectedTimeRange: any) => {
    setTimeRange(selectedTimeRange);
    if (selectedTimeRange.startDateTime && selectedTimeRange.endDateTime && selectedHotel) {
      const searchParams = new URLSearchParams();
      searchParams.append('guests', '2');
      searchParams.append('checkIn', selectedTimeRange.startDateTime);
      searchParams.append('checkOut', selectedTimeRange.endDateTime);
      searchParams.append('bookingType', 'hourly');

      router.push(`/hotels/${selectedHotel.id}?${searchParams.toString()}`);
      setShowTimeRangePicker(false);
    }
  };

  const renderHotelCard = (hotel: any) => (
    <Pressable
      onPress={() => {
        const searchParams = new URLSearchParams();
        searchParams.append('guests', '2');

        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 1);
        const checkOut = new Date();
        checkOut.setDate(checkOut.getDate() + 3);

        searchParams.append('checkIn', checkIn.toISOString().split('T')[0] + 'T12:00:00');
        searchParams.append('checkOut', checkOut.toISOString().split('T')[0] + 'T12:00:00');
        searchParams.append('bookingType', 'daily');

        router.push(`/hotels/${hotel.id}?${searchParams.toString()}`);
      }}
      key={hotel.id}
      className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
    >
      <View className="relative">
        <Image
          source={{ uri: hotel.images[0] }}
          className="w-full h-56"
          style={{ resizeMode: 'cover' }}
        />

        {/* Pay at Hotel Badge */}
        <View className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full">
          <Text className="text-xs text-black" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
            Pay at hotel
          </Text>
        </View>

        {/* Offer Badge */}
        {hotel.offer && (
          <View className="absolute top-3 right-12 bg-black px-2 py-1 rounded">
            <Text className="text-white text-xs" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              {hotel.offer}
            </Text>
          </View>
        )}

        <HeartIcon
          isInWishlist={isInWishlist(hotel.id)}
          onPress={() => handleWishlistToggle(hotel)}
          size={18}
        />
      </View>

      <View className="p-4">
        {/* Main Details Section */}
        <View className="flex-row justify-between items-start mb-4">
          {/* Left Side - Name and Address */}
          <View className="flex-1 pr-4">
            <Text className="text-lg text-black mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              {hotel.name}
            </Text>
            <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              {hotel.location}
            </Text>
          </View>

          {/* Right Side - Price Per Night */}
          <View className="items-end">
            <View className="flex-row items-baseline">
              <Text className="text-xl text-black" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                ₹{hotel.price.toLocaleString()}
              </Text>
            </View>
            <Text className="text-xs text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              per night
            </Text>
          </View>
        </View>

        {/* Hourly Pricing Boxes */}
        <View className="flex-row gap-2">
          {
            hotel.hourlyStays && hotel.hourlyStays.length >= 3 &&
            hotel.hourlyStays.slice(0, 3).map((h) => <TouchableOpacity
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 active:bg-gray-100"
              onPress={(e) => {
                e.stopPropagation();
                handleHourlyBooking(hotel, 3);
              }}
            >
              <Text className="text-xs text-gray-800 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {h.hours}
              </Text>
              <Text className="text-sm text-black text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                ₹{Math.round(hotel.minPrice * 0.3).toLocaleString()}
              </Text>
            </TouchableOpacity>)

          }
        </View>
        {/* <View className="flex-row gap-2">
          <TouchableOpacity
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 active:bg-gray-100"
            onPress={(e) => {
              e.stopPropagation();
              handleHourlyBooking(hotel, 3);
            }}
          >
            <Text className="text-xs text-gray-800 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              3hrs
            </Text>
            <Text className="text-sm text-black text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              ₹{Math.round(hotel.price * 0.3).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 active:bg-gray-100"
            onPress={(e) => {
              e.stopPropagation();
              handleHourlyBooking(hotel, 6);
            }}
          >
            <Text className="text-xs text-gray-800 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              6hrs
            </Text>
            <Text className="text-sm text-black text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              ₹{Math.round(hotel.price * 0.5).toLocaleString()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 active:bg-gray-100"
            onPress={(e) => {
              e.stopPropagation();
              handleHourlyBooking(hotel, 9);
            }}
          >
            <Text className="text-xs text-gray-800 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              9hrs
            </Text>
            <Text className="text-sm text-black text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              ₹{Math.round(hotel.price * 0.7).toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </Pressable>
  );

  const renderNextTrip = () => {
    if (!nextBooking) return null;

    const checkInDate = new Date(nextBooking.checkInDate);
    const checkOutDate = new Date(nextBooking.checkOutDate);

    return (
      <TouchableOpacity
        className="bg-black rounded-2xl p-4 mx-4 mb-6"
        onPress={() => router.push(`/booking-details/${nextBooking.id}`)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-2 h-2 bg-green-400 rounded-full"></View>
            <Text className="text-white text-sm" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              Your next trip
            </Text>
            <Text className="text-white text-sm" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              {checkInDate.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric'
              })} - {checkOutDate.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric'
              })}
            </Text>
            <View className="flex-row items-center gap-1">
              <Users size={12} color="#ffffff" />
              <Text className="text-white text-sm" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {nextBooking.guests} guests
              </Text>
            </View>
          </View>
          <Text className="text-white text-sm" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            ₹{nextBooking.totalAmount.toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderBanner = () => (
    <View className="mx-4 mb-6">
      <ImageBackground
        source={{
          uri: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800"
        }}
        className="h-32 rounded-2xl overflow-hidden"
        style={{ resizeMode: 'cover' }}
      >
        <View className="flex-1 bg-black/40 justify-center px-6">
          <Text className="text-white text-xl mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            New User Offer - 1st Stay at ₹799
          </Text>
          <TouchableOpacity className="bg-white px-4 py-2 rounded-lg self-start">
            <Text className="text-[#FF5A5F] text-sm" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Book Now
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );



  return (
    <View className="flex-1 bg-white">
      {/* Sticky Filter Header */}
      {stickyHeaderVisible && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'white',
          }}
        >
          <SafeAreaView edges={['top']}>
            {renderStickyFilterBar()}
          </SafeAreaView>
        </Animated.View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={nearbyData.refreshing}
            onRefresh={handleRefresh}
            colors={['#000000']}
            tintColor="#FF5A5F"
          />
        }
      >
        {/* Banner */}
        {renderBanner()}

        {/* Next Trip */}
        {renderNextTrip()}

        {/* Nearby Hotels Title */}
        {/* <View className="px-4 mb-4">
          <Text className="text-lg text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Nearby Hotels
          </Text>
        </View> */}

        {/* Quick Picks Filters */}
        <View
          className="px-4 mb-4"
          onLayout={(event) => {
            filterSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text className="text-lg text-gray-900 " style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Quick picks for you
          </Text>
          {/* Filter Tabs */}

          {renderStickyFilterBar()}
        </View>

        {/* Hotel Listings - Only show when filters are applied or initially */}
        <View className="px-4">
          {(nearbyData.loading || location.loading) ? (
            <View className="gap-6">
              <HotelCardSkeleton />
              <HotelCardSkeleton />
              <HotelCardSkeleton />
              {location.loading && (
                <View className="flex-row items-center justify-center py-4">
                  <LoadingSpinner size="small" />
                  <Text className="ml-2 text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    Getting your location...
                  </Text>
                </View>
              )}
            </View>
          ) : nearbyData.error ? (
            <View className="flex-1 items-center justify-center py-12 px-6">
              <Text className="text-6xl mb-4">⚠️</Text>
              <Text className="text-xl text-gray-900 text-center mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Something went wrong
              </Text>
              <Text className="text-base text-gray-600 text-center mb-6" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {nearbyData.error}
              </Text>
              <TouchableOpacity
                className="bg-[#FF5A5F] px-6 py-3 rounded-lg"
                onPress={handleRefresh}
              >
                <Text className="text-white text-base" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          ) : nearbyData.hotels.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12 px-6">
              <Text className="text-6xl mb-4">🏨</Text>
              <Text className="text-xl text-gray-900 text-center mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                No hotels found
              </Text>
              <Text className="text-base text-gray-600 text-center mb-6" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Try adjusting your filters or check back later.
              </Text>
              <TouchableOpacity
                className="bg-[#FF5A5F] px-6 py-3 rounded-lg"
                onPress={() => SheetManager.show('search', {
                  payload: {
                    onSearch: handleSearchFromSheet
                  }
                })}
              >
                <Text className="text-white text-base" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  Search Hotels
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {nearbyData.hotels.map(renderHotelCard)}
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* TimeRangePicker Modal */}
      <TimeRangePicker
        value={timeRange}
        onTimeRangeSelect={handleTimeRangeSelect}
        minHours={selectedHours}
        placeholder="Select check-in & check-out"
        visible={showTimeRangePicker}
        onClose={() => setShowTimeRangePicker(false)}
        showButton={false}

      />
    </View>
  )
}


