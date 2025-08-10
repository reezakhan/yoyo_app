import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { MockHotel } from '@/services/mockData';

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  amenities?: string[];
  sortBy?: string;
  query?: string;
}

export interface BackendHotel {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  starRating: number;
  amenities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  distance: number | null;
  rating: {
    average: number;
    count: number;
  };
  pricing: {
    startingFrom: number;
    range: {
      min: number;
      max: number;
    };
    currency: string;
    totalPrice: number | null;
    perNight: boolean;
  } | null;
  offers?: Array<{
    title: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    code: string;
    validUntil?: string;
  }>;
  images: {
    primary: string | null;
    gallery?: string[];
  };
  paymentOptions: {
    onlineEnabled: boolean;
    offlineEnabled: boolean;
  };
}

// Transform backend hotel to frontend format
const transformHotel = (backendHotel: BackendHotel): MockHotel => {
  return {
    id: backendHotel?.id,
    name: backendHotel?.name,
    location: `${backendHotel.city}, ${backendHotel.address}`,
    address: backendHotel.address,
    rating: backendHotel.rating?.average || 0,
    reviewCount: backendHotel.rating?.count || 0,
    price: backendHotel.pricing?.startingFrom || 0,
    originalPrice: backendHotel.pricing?.range?.max || undefined,
    images: [
      backendHotel.images?.primary || backendHotel.images?.gallery[0] || 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    amenities: backendHotel.amenities || [],
    description: backendHotel.description || '',
    latitude: backendHotel.coordinates?.lat || 0,
    longitude: backendHotel.coordinates?.lng || 0,
    distance: backendHotel.distance ? `${backendHotel.distance.toFixed(1)} km away` : undefined,
    offer: backendHotel.offers && backendHotel.offers.length > 0 ? backendHotel.offers[0].title : undefined,
    bookingType: backendHotel.pricing?.bookingType || 'daily',
    perHour: backendHotel.pricing?.perHour || false,
    perNight: backendHotel.pricing?.perNight || true,
    rooms: [], // Will be populated when needed
    reviews: [] // Will be populated when needed
  };
};

export function useHotels(filters?: SearchFilters) {
  const [hotels, setHotels] = useState<MockHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchHotels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let response;
      if (filters?.query || filters?.location) {
        response = await apiService.get('/hotels/search', { params: filters });
      } else {
        response = await apiService.get('/hotels', { params: filters });
      }

      if (response.success) {
        const transformedHotels = response.data.hotels?.map(transformHotel) || [];
        setHotels(transformedHotels);
        setTotal(response.data.total || transformedHotels.length);
      } else {
        setError(response.error || 'Failed to fetch hotels');
        setHotels([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching hotels');
      setHotels([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchHotels = async (searchFilters: SearchFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get('/hotels/search', { params: searchFilters });

      if (response.success) {
        const transformedHotels = response.data.hotels?.map(transformHotel) || [];
        setHotels(transformedHotels);
        setTotal(response.data.total || transformedHotels.length);
      } else {
        setError(response.error || 'Search failed');
        setHotels([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setHotels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchHotels(true);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return {
    hotels,
    total,
    loading,
    error,
    refreshing,
    refresh,
    searchHotels,
  };
}

// Hook for nearby hotels
export function useNearbyHotels(coordinates: { lat: number; lng: number } | null, filters?: SearchFilters) {
  const [hotels, setHotels] = useState<MockHotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNearbyHotels = async (isRefresh = false) => {
    // Don't make API call if coordinates are not available
    if (!coordinates || (coordinates.lat === 0 && coordinates.lng === 0)) {
      setLoading(false);
      setRefreshing(false);
      setHotels([]);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params: any = { 
        limit: 10,
        lat: coordinates.lat,
        lng: coordinates.lng,
        ...filters
      };

      const response = await apiService.get('/search/nearby', { params });

      console.log('response in nearby  ',JSON.stringify(response))

      if (response.success) {
        const transformedHotels = response.data.hotels?.map(transformHotel) || [];
        setHotels(transformedHotels);
      } else {
        setError(response.error || 'Failed to fetch nearby hotels');
        setHotels([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching nearby hotels');
      setHotels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    if (coordinates) {
      fetchNearbyHotels(true);
    }
  };

  useEffect(() => {
    if (coordinates) {
      fetchNearbyHotels();
    } else {
      setLoading(false);
      setHotels([]);
    }
  }, [coordinates?.lat, coordinates?.lng, filters]);

  return {
    hotels,
    loading,
    error,
    refreshing,
    refresh,
  };
}

// Hook for latest hotels
export function useLatestHotels() {
  const [hotels, setHotels] = useState<MockHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLatestHotels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get('/search/latest', { params: { limit: 10 } });
      console.log('response latest  ', JSON.stringify(response.data))

      if (response.success) {
        const transformedHotels = response.data.hotels?.map(transformHotel) || [];
        console.log('transformedHotels ', transformedHotels)
        setHotels(transformedHotels);
      } else {
        setError(response.error || 'Failed to fetch latest hotels');
        setHotels([]);
        console.log('error ', response.error)
      }
    } catch (err: any) {
      console.log('error ', err)
      setError(err.message || 'An error occurred while fetching latest hotels');
      setHotels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    fetchLatestHotels(true);
  };

  useEffect(() => {
    fetchLatestHotels();
  }, []);

  return {
    hotels,
    loading,
    error,
    refreshing,
    refresh,
  };
}

// Hook for offers
export function useOffersHotels() {
  const [hotels, setHotels] = useState<MockHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOffersHotels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get('/search/offers', { params: { limit: 10 } });

      if (response.success) {
        const transformedHotels = response.data.hotels?.map(transformHotel) || [];

        console.log('transformedHotels offers  ',transformedHotels)
        setHotels(transformedHotels);
      } else {
        setError(response.error || 'Failed to fetch offers');
        setHotels([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching offers');
      setHotels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    fetchOffersHotels(true);
  };

  useEffect(() => {
    fetchOffersHotels();
  }, []);

  return {
    hotels,
    loading,
    error,
    refreshing,
    refresh,
  };
}

// Hook for featured hotels
export function useFeaturedHotels() {
  const [hotels, setHotels] = useState<MockHotel[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeaturedHotels = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await apiService.get('/search/featured', { params: { limit: 10 } });

      if (response.success) {
        const transformedHotels = response.data.hotels?.map(transformHotel) || [];
        setHotels(transformedHotels);
        setBanners(response.data.banners || []);
      } else {
        setError(response.error || 'Failed to fetch featured hotels');
        setHotels([]);
        setBanners([]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching featured hotels');
      setHotels([]);
      setBanners([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => {
    fetchFeaturedHotels(true);
  };

  useEffect(() => {
    fetchFeaturedHotels();
  }, []);

  return {
    hotels,
    banners,
    loading,
    error,
    refreshing,
    refresh,
  };
}