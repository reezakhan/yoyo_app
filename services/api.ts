import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockHotels, mockBookings, mockWishlistItems, getHotelById, getBookingById, searchHotels, filterHotels } from './mockData';

const BASE_URL = 'http://192.168.1.3:3000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private isMockMode = false; // Set to true to enable mock mode

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Only setup interceptors if not in mock mode
    if (!this.isMockMode) {
      this.setupInterceptors();
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performTokenRefresh(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    await AsyncStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  }

  private async clearTokens() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userProfile']);
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Use mock data only when mock mode is enabled
    if (this.isMockMode) {
      return this.getMockResponse<T>(config);
    }

    try {
      const response = await this.axiosInstance.request<ApiResponse<T>>(config);
      return response.data;
    } catch (error: any) {
      // Return actual error instead of mock fallback
      return {
        success: false,
        data: null,
        error: error.response?.data?.error || error.message || 'An error occurred',
      };
    }
  }

  private async getMockResponse<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));

    const url = config.url || '';
    const method = config.method?.toUpperCase() || 'GET';
    const params = config.params || {};

    // Mock responses based on endpoint
    if (url.includes('/auth/login')) {
      return {
        success: true,
        data: {
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
            hasOnboarded: true,
          }
        } as T,
        message: 'Login successful'
      };
    }

    if (url.includes('/auth/register')) {
      return {
        success: true,
        data: {
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
          user: {
            id: '2',
            name: 'New User',
            email: 'newuser@example.com',
            phone: '+919876543210',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
            hasOnboarded: false,
          }
        } as T,
        message: 'Registration successful'
      };
    }

    if (url.includes('/auth/me')) {
      return {
        success: true,
        data: {
          user: {
            id: '1',
            name: 'Sophia Carter',
            email: 'sophia.carter@example.com',
            phone: '+919876543210',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
            hasOnboarded: true,
          }
        } as T,
        message: 'User data fetched successfully'
      };
    }
    if (url.includes('/hotels/search')) {
      const searchQuery = params.query || '';
      const location = params.location || '';
      const bookingType = params.bookingType || 'daily';
      const filteredHotels = searchHotels(searchQuery).filter(hotel => 
        !location || hotel.location.toLowerCase().includes(location.toLowerCase())
      );

      // For hourly bookings, you might want to filter hotels that support hourly bookings
      // This is just a placeholder - you'll need to implement actual hourly booking logic
      const finalHotels = bookingType === 'hourly' 
        ? filteredHotels.filter(hotel => hotel.amenities.includes('Hourly Booking')) // Add this amenity to some hotels
        : filteredHotels;

      return {
        success: true,
        data: {
          hotels: finalHotels,
          total: finalHotels.length,
          page: params.page || 1,
          limit: params.limit || 20,
          bookingType
        } as T,
        message: 'Search results fetched successfully'
      };
    }

    if (url.includes('/hotels/') && !url.includes('/search')) {
      const hotelId = url.split('/hotels/')[1];
      const hotel = getHotelById(hotelId);

      if (hotel) {
        return {
          success: true,
          data: { hotel } as T,
          message: 'Hotel details fetched successfully'
        };
      } else {
        return {
          success: false,
          data: null,
          error: 'Hotel not found'
        };
      }
    }

    if (url.includes('/hotels') && method === 'GET') {
      const filteredHotels = filterHotels({
        priceRange: params.priceRange,
        rating: params.rating,
        amenities: params.amenities,
        location: params.location
      });

      return {
        success: true,
        data: {
          hotels: filteredHotels,
          total: filteredHotels.length,
          page: params.page || 1,
          limit: params.limit || 20
        } as T,
        message: 'Hotels fetched successfully'
      };
    }

    if (url.includes('/bookings/') && method === 'GET') {
      const bookingId = url.split('/bookings/')[1].split('/')[0];
      const booking = getBookingById(bookingId);

      if (booking) {
        return {
          success: true,
          data: { booking } as T,
          message: 'Booking details fetched successfully'
        };
      } else {
        return {
          success: false,
          data: null,
          error: 'Booking not found'
        };
      }
    }

    if (url.includes('/bookings') && method === 'GET') {
      return {
        success: true,
        data: {
          bookings: mockBookings,
          total: mockBookings.length
        } as T,
        message: 'Bookings fetched successfully'
      };
    }

    if (url.includes('/bookings') && method === 'POST') {
      const newBooking = {
        id: `booking_${Date.now()}`,
        userId: 'user_1',
        ...config.data,
        status: 'confirmed',
        totalAmount: config.data.totalAmount || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bookingReference: `BK${Date.now().toString().slice(-6)}`
      };

      return {
        success: true,
        data: { booking: newBooking } as T,
        message: 'Booking created successfully'
      };
    }

    if (url.includes('/bookings/') && url.includes('/cancel') && method === 'PATCH') {
      return {
        success: true,
        data: { status: 'cancelled' } as T,
        message: 'Booking cancelled successfully'
      };
    }

    if (url.includes('/wishlist')) {
      if (method === 'GET') {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedItems = mockWishlistItems.slice(startIndex, endIndex);

        return {
          success: true,
          data: {
            items: paginatedItems.map(item => ({
              id: item.id,
              addedAt: new Date(item.addedDate).toISOString(),
              hotel: {
                id: item.hotelId,
                name: item.hotelName,
                description: null,
                address: item.location,
                city: item.location.split(',')[1]?.trim() || item.location,
                starRating: Math.floor(item.rating),
                amenities: ['WiFi', 'Pool', 'Spa'],
                coordinates: {
                  lat: 19.0760 + Math.random() * 0.1,
                  lng: 72.8777 + Math.random() * 0.1
                }
              }
            })),
            pagination: {
              page,
              limit,
              total: mockWishlistItems.length,
              pages: Math.ceil(mockWishlistItems.length / limit)
            }
          } as T,
          message: 'Wishlist fetched successfully'
        };
      }

      if (method === 'POST') {
        const { hotelId } = config.data || {};
        const newWishlistItem = {
          id: `wishlist_${Date.now()}`,
          hotelId,
          addedAt: new Date().toISOString()
        };

        return {
          success: true,
          data: {
            item: newWishlistItem
          } as T,
          message: 'Hotel added to wishlist successfully'
        };
      }

      if (method === 'DELETE') {
        // Handle both /wishlist/{itemId} and /wishlist/ with hotelId in body
        let itemIndex = -1;
        
        if (url.includes('/wishlist/') && url.split('/').pop() !== 'wishlist') {
          // URL format: /wishlist/{itemId}
          const itemId = url.split('/').pop();
          itemIndex = mockWishlistItems.findIndex(item => item.id === itemId);
        } else if (config.data?.hotelId) {
          // Body format: { hotelId: "..." }
          itemIndex = mockWishlistItems.findIndex(item => item.hotelId === config.data.hotelId);
        }

        if (itemIndex !== -1) {
          mockWishlistItems.splice(itemIndex, 1);
          return {
            success: true,
            data: { message: 'Removed from wishlist successfully' } as T,
            message: 'Removed from wishlist successfully'
          };
        } else {
          return {
            success: false,
            error: 'Wishlist item not found'
          };
        }
      }
    }

    if (url.includes('/user/profile') && method === 'PUT') {
      return {
        success: true,
        data: {
          user: {
            ...config.data,
            id: '1',
            updatedAt: new Date().toISOString()
          }
        } as T,
        message: 'Profile updated successfully'
      };
    }

    if (url.includes('/notifications/register-token') && method === 'POST') {
      return {
        success: true,
        data: {
          message: 'Device token registered successfully'
        } as T,
        message: 'Device token registered successfully'
      };
    }

    if (url.includes('/notifications/remove-token') && method === 'DELETE') {
      return {
        success: true,
        data: {
          message: 'Device token removed successfully'
        } as T,
        message: 'Device token removed successfully'
      };
    }

    if (url.includes('/notifications/settings') && method === 'PUT') {
      return {
        success: true,
        data: {
          settings: config.data
        } as T,
        message: 'Notification settings updated successfully'
      };
    }

    if (url.includes('/notifications/test') && method === 'POST') {
      return {
        success: true,
        data: {
          message: 'Test notification sent successfully'
        } as T,
        message: 'Test notification sent successfully'
      };
    }

    if (url.includes('/user/notification-settings') && method === 'PUT') {
      return {
        success: true,
        data: {
          settings: config.data
        } as T,
        message: 'Notification settings updated successfully'
      };
    }

    if (url.includes('/reviews/') && method === 'GET') {
      const hotelId = url.split('/reviews/')[1];
      const hotel = getHotelById(hotelId);

      return {
        success: true,
        data: {
          reviews: hotel?.reviews || [],
          total: hotel?.reviews?.length || 0,
          averageRating: hotel?.rating || 0
        } as T,
        message: 'Reviews fetched successfully'
      };
    }

    if (url.includes('/coupons/user/all') && method === 'GET') {
      const mockCoupons = [
        {
          id: '1',
          code: 'SAVE20',
          description: 'Get 20% off on your booking',
          discountType: 'percentage',
          discountValue: 20,
          maxDiscountAmount: 2000,
          minOrderAmount: 5000,
          validFrom: '2024-01-01',
          validTo: '2024-12-31',
          usageLimit: 100,
          usedCount: 25,
          status: 'active',
          mappings: {
            cities: [],
            hotels: [],
            roomTypes: []
          }
        },
        {
          id: '2',
          code: 'FLAT500',
          description: 'Flat ₹500 off on bookings above ₹10,000',
          discountType: 'fixed',
          discountValue: 500,
          maxDiscountAmount: 500,
          minOrderAmount: 10000,
          validFrom: '2024-01-01',
          validTo: '2024-12-31',
          usageLimit: 50,
          usedCount: 10,
          status: 'active',
          mappings: {
            cities: [],
            hotels: [],
            roomTypes: []
          }
        },
        {
          id: '3',
          code: 'FIRSTTIME',
          description: 'Special offer for first time users - 15% off',
          discountType: 'percentage',
          discountValue: 15,
          maxDiscountAmount: 1500,
          minOrderAmount: 3000,
          validFrom: '2024-01-01',
          validTo: '2024-12-31',
          usageLimit: 200,
          usedCount: 150,
          status: 'active',
          mappings: {
            cities: [],
            hotels: [],
            roomTypes: []
          }
        }
      ];

      return {
        success: true,
        data: {
          coupons: mockCoupons,
          total: mockCoupons.length,
          page: 1,
          limit: 10,
          totalPages: 1
        } as T,
        message: 'Coupons fetched successfully'
      };
    }

    if (url.includes('/coupons/validate') && method === 'POST') {
      const { code, orderAmount } = config.data || {};
      
      // Mock validation logic
      let discountAmount = 0;
      let couponData = null;

      if (code === 'SAVE20' && orderAmount >= 5000) {
        discountAmount = Math.min(orderAmount * 0.2, 2000);
        couponData = {
          id: '1',
          code: 'SAVE20',
          discountType: 'percentage',
          discountValue: 20
        };
      } else if (code === 'FLAT500' && orderAmount >= 10000) {
        discountAmount = 500;
        couponData = {
          id: '2',
          code: 'FLAT500',
          discountType: 'fixed',
          discountValue: 500
        };
      } else if (code === 'FIRSTTIME' && orderAmount >= 3000) {
        discountAmount = Math.min(orderAmount * 0.15, 1500);
        couponData = {
          id: '3',
          code: 'FIRSTTIME',
          discountType: 'percentage',
          discountValue: 15
        };
      }

      if (couponData) {
        return {
          success: true,
          data: {
            coupon: couponData,
            discountAmount,
            finalAmount: orderAmount - discountAmount
          } as T,
          message: 'Coupon validated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Invalid coupon code or minimum order amount not met'
        };
      }
    }

    // Default mock response
    return {
      success: true,
      data: {
        message: 'Mock API endpoint not implemented yet',
        endpoint: url,
        method: method
      } as T,
      message: 'Mock response - endpoint not implemented'
    };
  }

  // Method to toggle mock mode (useful for testing)
  setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
}

export const apiService = new ApiService();