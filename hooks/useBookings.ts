import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';

export interface Booking {
  id: string;
  userId: string;
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  // Use a single base path; adjust if your backend differs
  const BASE = '/api/v1';

  const fetchBookings = useCallback(async (isRefresh = false, status?: string) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', '50');

      const qs = params.toString();
      const endpoint = `/bookings/user/me${qs ? `?${qs}` : ''}`;

      const res = await apiService.get(endpoint);
      // Axios: res.data is the payload
      const payload = res?.data ?? res;

      // Accept either { success, data: { bookings, total } } or { bookings, total }
      const ok = payload?.success ?? true;
      const data = payload?.data ?? payload;

      if (ok && Array.isArray(data?.bookings)) {
        setBookings(data.bookings);
        setTotal(Number(data.total ?? data.bookings.length));
      } else {
        throw new Error(payload?.error || 'Failed to fetch bookings');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch bookings');
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const createBooking = useCallback(async (bookingData: any) => {
    const res = await apiService.post(`${BASE}/bookings`, bookingData);
    const payload = res?.data ?? res;
    const ok = payload?.success ?? true;
    if (!ok) throw new Error(payload?.error || 'Booking failed');
    await fetchBookings(true);
    return payload?.data ?? payload;
  }, [fetchBookings]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    const res = await apiService.patch(`${BASE}/bookings/${bookingId}/cancel`);
    const payload = res?.data ?? res;
    const ok = payload?.success ?? true;
    if (!ok) throw new Error(payload?.error || 'Cancellation failed');

    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelled' } as Booking : b))
    );
    return payload?.data ?? payload;
  }, []);

  const refresh = useCallback(() => fetchBookings(true), [fetchBookings]);

  const getUpcomingBookings = useCallback(
    () => bookings.filter(b => b.status === 'confirmed' || b.status === 'pending'),
    [bookings]
  );

  const getPastBookings = useCallback(
    () => bookings.filter(b => b.status === 'completed' || b.status === 'cancelled'),
    [bookings]
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    total,
    loading,
    error,
    refreshing,
    refresh,
    createBooking,
    cancelBooking,
    getUpcomingBookings,
    getPastBookings,
    fetchBookings,
  };
}
