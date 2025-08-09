import React, { useLayoutEffect, useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SheetManager } from 'react-native-actions-sheet';
import { Calendar, MapPin, Users, Phone, Mail, MessageCircle, Download, X, Plus, CreditCard, Clock, User, Copy, CheckCircle, RefreshCw } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { MockBooking } from '@/services/mockData';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useBookings } from '@/hooks/useBookings';
import * as Clipboard from 'expo-clipboard';
import { razorpayService } from '@/services/razorpay';
import { Modal } from '@/components/ui/Modal';


const BookingDetails = () => {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const [booking, setBooking] = useState<MockBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { refresh: refreshBookings } = useBookings();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const imageScrollViewRef = useRef<ScrollView>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageUrls = useMemo(() => {
    const arr = Array.isArray(booking?.images) && booking?.images.length > 0
      ? booking?.images
      : (booking?.image ? [booking.image] : []);
    return arr.filter(Boolean);
  }, [booking]);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(`/bookings/${id}/details`);

      console.log('response in booking details  ', JSON.stringify(response))

      if (response.success) {
        setBooking(response.data.booking);
      } else {
        setError(response.error || 'Failed to fetch booking details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShadowVisible: false,
      headerTitle: () => (
        <Text className="text-xl text-[#121516]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
          Booking Details
        </Text>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  const handleCancelBooking = async () => {
    if (!booking) return;

    router.push({
      pathname: '/cancel-booking',
      params: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        hotelName: booking.hotelName,
        totalAmount: booking.totalAmount.toString(),
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      }
    });
  };

  const handlePayNow = async () => {
    if (!booking || !booking.onlinePaymentEnabled) return;

    try {
      setPaymentLoading(true);

      // Create payment order
      const orderResponse = await apiService.post('/payments/orders', {
        bookingId: booking.id,
        amount: booking.paymentAmount || booking.totalAmount,
        currency: 'INR'
      });
      console.log('orderResponse ', orderResponse)
      if (orderResponse.success) {
        const { orderId, amount, currency } = orderResponse.data;

        // Razorpay checkout options
        const options = {
          description: `Payment for ${booking.hotelName}`,
          image: booking.image || 'https://your-logo-url.com/logo.png', // Replace with your logo
          currency: currency,
          key: 'rzp_live_P9WrcJVu8pueod', // Replace with your Razorpay key
          amount: amount * 100, // Amount in paise
          name: 'YOYO stays', // Replace with your app name
          order_id: orderId,
          prefill: {
            email: booking.guestEmail || 'customer@example.com',
            contact: booking.guestPhone || '9999999999',
            name: booking.guestName || 'Guest'
          },
          theme: {
            color: '#000000'
          },
          modal: {
            ondismiss: () => {
              console.log('Payment dismissed');
              setPaymentLoading(false);
            }
          }
        };

        const paymentResult = await razorpayService.openCheckout(options);

        if (paymentResult.razorpay_payment_id) {
          console.log('Payment completed, verifying...');

          const verifyPaymentData = {
            razorpayPaymentId: paymentResult.razorpay_payment_id,
            razorpayOrderId: paymentResult.razorpay_order_id,
            razorpaySignature: paymentResult.razorpay_signature,
          };

          await handlePaymentSuccess(orderId, verifyPaymentData.razorpayPaymentId, verifyPaymentData.razorpaySignature || '');

        } else {
          Alert.alert('Payment Cancelled', 'Payment was cancelled or failed.');
        }

        // Open Razorpay checkout

      } else {
        Alert.alert('Payment Error', orderResponse.error || 'Failed to create payment order');
        setPaymentLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'Failed to initiate payment');
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (orderId: string, paymentId: string, signature: string) => {
    try {
      setPaymentLoading(true);

      // Verify payment
      const verifyResponse = await apiService.post('/payments/verify', {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature
      });

      if (verifyResponse.success) {
        Alert.alert(
          'Payment Successful!',
          'Your payment has been processed successfully. Your booking is now confirmed.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh booking details
                fetchBookingDetails();
                refreshBookings();
              }
            }
          ]
        );
      } else {
        Alert.alert('Payment Verification Failed', verifyResponse.error || 'Payment verification failed');
      }
    } catch (error: any) {
      Alert.alert('Payment Verification Error', error.message || 'Failed to verify payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleModifyGuestName = () => {
    SheetManager.show('modify-guest-name', {
      payload: {
        bookingId: booking?.id,
        currentGuestName: booking?.guestName || 'Guest',
        onGuestNameUpdated: async (newName: string) => {
          if (booking) {
            try {
              const response = await apiService.put(`/bookings/${booking.id}/guest-details`, {
                guestName: booking?.guestName,
                guestEmail: booking?.guestEmail,
                guestPhone: booking?.guestPhone

              })
              console.log('response in guestdetail update  ', response)
              if (response.success) {
                setBooking({ ...booking, guestName: newName });
                return true;
              }
              return false

            } catch (e) {
              console.log('e ', e)
              return false
            }

          }
        }
      }
    });
  };

  const handleCopyBookingId = async () => {
    if (booking?.bookingReference) {
      await Clipboard.setStringAsync(booking.bookingReference);
      Alert.alert('Copied', 'Booking ID copied to clipboard');
    }
  };

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

      const response = await apiService.post('/reviews', reviewData);
      
      if (response.success) {
        Alert.alert(
          'Review Submitted',
          'Thank you for your feedback!',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowReviewModal(false);
                setReviewComment('');
                setReviewRating(5);
              }
            }
          ]
        );
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
    console.log('dateString', dateString);
    const date = new Date(dateString); // Don't add 'Z'
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Refund helper functions
  const getRefundStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#10B981" />;
      case 'pending':
        return <Clock size={20} color="#F59E0B" />;
      case 'processing':
        return <RefreshCw size={20} color="#3B82F6" />;
      case 'rejected':
        return <X size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color="#6B7280" />;
    }
  };

  const getRefundStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-800 bg-green-100 border-green-300';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100 border-yellow-300';
      case 'processing':
        return 'text-blue-800 bg-blue-100 border-blue-300';
      case 'rejected':
        return 'text-red-800 bg-red-100 border-red-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRefundStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Refund Completed';
      case 'pending':
        return 'Refund Pending';
      case 'processing':
        return 'Refund Processing';
      case 'rejected':
        return 'Refund Rejected';
      default:
        return 'Refund Status Unknown';
    }
  };

  const generateReceiptHTML = (booking: MockBooking) => {
    const addonsHTML = booking.addons && booking.addons.length > 0 ? `
      <div class="section">
        <div class="section-title">Add-ons</div>
        ${booking.addons.map(addon => `
          <div class="detail-row">
            <span>${addon.name} (x${addon.quantity}):</span>
            <span>₹${addon.totalPrice.toLocaleString()}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .booking-ref { background: #f5f5f5; padding: 10px; margin: 20px 0; text-align: center; }
          .section { margin: 20px 0; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
          .status.confirmed { background: #d4edda; color: #155724; }
          .status.cancelled { background: #f8d7da; color: #721c24; }
          .status.completed { background: #cce5ff; color: #004085; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Booking Receipt</h1>
          <p>Thank you for choosing our service</p>
        </div>
        
        <div class="booking-ref">
          <h2>Booking Reference: ${booking.bookingReference}</h2>
          <span class="status ${booking.status}">${booking.status.toUpperCase()}</span>
        </div>
        
        <div class="section">
          <div class="section-title">Hotel Information</div>
          <div class="detail-row">
            <span>Hotel Name:</span>
            <span>${booking.hotelName}</span>
          </div>
          <div class="detail-row">
            <span>Address:</span>
            <span>${booking.address}</span>
          </div>
          <div class="detail-row">
            <span>Room Type:</span>
            <span>${booking.roomType}</span>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Trip Details</div>
          <div class="detail-row">
            <span>Check-in:</span>
            <span>${formatDate(booking.checkIn)}</span>
          </div>
          <div class="detail-row">
            <span>Check-out:</span>
            <span>${formatDate(booking.checkOut)}</span>
          </div>
          <div class="detail-row">
            <span>Guests:</span>
            <span>${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}</span>
          </div>
         <div class="detail-row">
          <span>Nights:</span>
          <span>
            ${booking.nights}
            ${booking.bookingType === 'daily'
        ? booking.nights === 1
          ? 'night'
          : 'nights'
        : booking.nights === 1
          ? 'hour'
          : 'hours'
      }
          </span>
        </div>

        </div>
        
        <div class="section">
          <div class="section-title">Price Breakdown</div>
         <div class="detail-row">
            <span>
              ₹${booking.priceBreakdown.roomRate.toLocaleString()} × ${booking.nights}
              ${booking.bookingType === 'daily'
        ? booking.nights === 1
          ? 'night'
          : 'nights'
        : booking.nights === 1
          ? 'hour'
          : 'hours'
      }:
            </span>
            <span>₹${booking.priceBreakdown.subtotal.toLocaleString()}</span>
          </div>

          <div class="detail-row">
            <span>Taxes and fees:</span>
            <span>₹${booking.priceBreakdown.taxes.toLocaleString()}</span>
          </div>
          <div class="detail-row">
            <span>Service fee:</span>
            <span>₹${booking.priceBreakdown.serviceFee.toLocaleString()}</span>
          </div>
          <div class="detail-row total">
            <span>Total:</span>
            <span>₹${booking.totalAmount.toLocaleString()}</span>
          </div>
        </div>
        
        ${addonsHTML}
        
        <div class="section">
          <div class="section-title">Amenities</div>
          <p>${booking.amenities.join(', ')}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Cancellation Policy</div>
          <p>${booking.cancellationPolicy}</p>
        </div>
        
        <div class="section">
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadReceipt = async () => {
    if (!booking) return;

    try {
      const html = generateReceiptHTML(booking);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const filename = `booking_receipt_${booking.bookingReference}.pdf`;
      const documentsDir = FileSystem.documentDirectory;
      const newPath = `${documentsDir}${filename}`;

      await FileSystem.moveAsync({
        from: uri,
        to: newPath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath);
      } else {
        Alert.alert('Success', `Receipt saved to ${newPath}`);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
  };

  const handleContactHotel = () => {
    const contactOptions = [];

    if (booking?.hotelPhone) {
      contactOptions.push({
        title: 'Call Hotel',
        icon: 'phone',
        onPress: () => Linking.openURL(`tel:${booking.hotelPhone}`)
      });

      contactOptions.push({
        title: 'WhatsApp',
        icon: 'whatsapp',
        onPress: () => {
          const whatsappUrl = `whatsapp://send?phone=${booking.hotelPhone.replace(/\D/g, '')}&text=Hi, I have a booking inquiry regarding ${booking.bookingReference}`;
          Linking.canOpenURL(whatsappUrl).then(supported => {
            if (supported) {
              Linking.openURL(whatsappUrl);
            } else {
              Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature.');
            }
          });
        }
      });
    }

    if (booking?.hotelEmail) {
      contactOptions.push({
        title: 'Send Email',
        icon: 'email',
        onPress: () => {
          const emailUrl = `mailto:${booking.hotelEmail}?subject=Booking Inquiry - ${booking.bookingReference}&body=Hi, I have a question regarding my booking ${booking.bookingReference}.`;
          Linking.openURL(emailUrl);
        }
      });
    }

    if (contactOptions.length > 0) {
      SheetManager.show('contact-hotel', {
        payload: {
          hotelName: booking?.hotelName,
          contactOptions
        }
      });
    } else {
      Alert.alert('No Contact Info', 'Contact information is not available for this hotel.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading booking details..." />;
  }

  if (error || !booking) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-lg text-gray-500 mb-4 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
          {error || 'Booking not found'}
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

  const handleAddGstin = () => {
    Alert.alert(
      'Info',
      'We are not yet maintaining GSTIN details.',
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
    );
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'upcoming':
        return 'text-green-800 bg-green-100 border-green-300';
      case 'completed':
        return 'text-blue-800 bg-blue-100 border-blue-300';
      case 'cancelled':
        return 'text-gray-800 bg-gray-100 border-gray-300';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const canCancelBooking = booking.status === 'confirmed' || booking.status === 'upcoming';
  const showPaymentSection = booking.onlinePaymentEnabled && booking.paymentStaus === 'pending';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
       
        {
          !booking.refundInfo && <View className="w-full h-64 overflow-hidden">
            <ScrollView
              ref={imageScrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              decelerationRate="fast"
              snapToInterval={Dimensions.get('window').width}
              snapToAlignment="center"
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const x = e.nativeEvent.contentOffset.x;
                const w = e.nativeEvent.layoutMeasurement.width;
                setCurrentImageIndex(Math.round(x / w));
              }}
              style={{ height: 256 }}
            >
              {imageUrls.map((uri, idx) => (
                <View key={idx} style={{ width: Dimensions.get('window').width, height: 256 }}>
                  <Image
                    source={{ uri }}
                    className="w-full h-full"
                    style={{ resizeMode: 'cover' }}
                  />
                </View>
              ))}
            </ScrollView>



            {/* same status chip as before */}
            <View className={`absolute top-4 right-4 px-3 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
              <Text className="text-sm capitalize" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {booking.status}
              </Text>
            </View>

            {/* dots */}
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
        }

        {/* Hotel Information */}
        <View className="px-6 py-6">
          <Text className="text-2xl text-gray-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            {booking.hotelName}
          </Text>
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <MapPin size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-2 flex-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {booking.address}
              </Text>
            </View>
            {
              !booking.refundInfo && <TouchableOpacity
                className="ml-3 p-2 bg-black rounded-full"
                onPress={() => {
                  const address = encodeURIComponent(booking.address);
                  const url = Platform.OS === 'ios'
                    ? `maps://maps.google.com/maps?q=${address}`
                    : `geo:0,0?q=${address}`;

                  Linking.canOpenURL(url).then(supported => {
                    if (supported) {
                      Linking.openURL(url);
                    } else {
                      // Fallback to web maps
                      Linking.openURL(`https://maps.google.com/maps?q=${address}`);
                    }
                  });
                }}
              >
                <MapPin size={16} color="white" />
              </TouchableOpacity>
            }
          </View>
          <Text className="text-lg text-gray-800 mb-4" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
            {booking.roomType}
          </Text>
        </View>

        {/* Quick Actions - Hide when refund info exists */}
        {!booking.refundInfo && (
          <View className="px-6 pb-6">
            <View className="flex-row justify-between">
              <TouchableOpacity className="flex-1 items-center py-3 mx-1">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Calendar size={24} color="#6B7280" />
                </View>
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Check-in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 items-center py-3 mx-1">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <MapPin size={24} color="#6B7280" />
                </View>
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Directions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 items-center py-3 mx-1"
                onPress={handleContactHotel}
              >
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <Phone size={24} color="#6B7280" />
                </View>
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Call hotel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 items-center py-3 mx-1">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-2">
                  <MessageCircle size={24} color="#6B7280" />
                </View>
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Need help
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trip Details */}
        <View className="px-6 py-6 border-t border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-lg text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Check-in
              </Text>
              <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {formatDate(booking.checkIn)}
              </Text>
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                12:00 PM onwards
              </Text>
            </View>

            {/* <View className="items-center">
              <Text className="text-lg text-gray-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                {booking.nights}N
              </Text>
            </View> */}

            <View>
              <Text className="text-lg text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Checkout
              </Text>
              <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                {formatDate(booking.checkOut)}
              </Text>
              <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Before 11:00 AM
              </Text>
            </View>
          </View>
        </View>

        {/* Refund Information Section */}
        {booking.refundInfo && (
          <View className="px-6 py-6 border-t border-gray-100">
            <Text className="text-lg text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Refund Information
            </Text>

            {/* Refund Status */}
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  {getRefundStatusIcon(booking.refundInfo.status)}
                  <Text className="text-base text-gray-900 ml-2" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                    {getRefundStatusText(booking.refundInfo.status)}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full border ${getRefundStatusColor(booking.refundInfo.status)}`}>
                  <Text className="text-sm capitalize" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                    {booking.refundInfo.status}
                  </Text>
                </View>
              </View>

              {booking.refundInfo.refundReason && (
                <View className="mb-3">
                  <Text className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                    Reason for Cancellation:
                  </Text>
                  <Text className="text-sm text-gray-800" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    {booking.refundInfo.refundReason}
                  </Text>
                </View>
              )}

              {booking.refundInfo.status === 'rejected' && booking.refundInfo.rejectionReason && (
                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <Text className="text-sm text-red-800 mb-1" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                    Rejection Reason:
                  </Text>
                  <Text className="text-sm text-red-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    {booking.refundInfo.rejectionReason}
                  </Text>
                </View>
              )}
            </View>

            {/* Refund Details */}
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Original Amount
                </Text>
                <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  ₹{booking.refundInfo.originalAmount.toLocaleString()}
                </Text>
              </View>

              {booking.refundInfo.cancellationFeeAmount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    Cancellation Fee ({booking.refundInfo.cancellationFeePercentage}%)
                  </Text>
                  <Text className="text-red-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                    -₹{booking.refundInfo.cancellationFeeAmount.toLocaleString()}
                  </Text>
                </View>
              )}

              <View className="border-t border-gray-200 pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-900 text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    Refund Amount
                  </Text>
                  <Text className="text-green-600 text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    ₹{booking.refundInfo.refundAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Processing Information */}
            <View className="mt-4 bg-blue-50 rounded-lg p-4">
              <View className="flex-row items-start">
                <View className="ml-3 flex-1">
                  <Text className="text-sm text-blue-800 mb-2" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                    Refund Processing Information
                  </Text>

                  <View className="gap-2">
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-blue-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                        Refund Method:
                      </Text>
                      <Text className="text-xs text-blue-800 capitalize" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                        {booking.refundInfo.refundMethod}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-xs text-blue-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                        Expected Processing Time:
                      </Text>
                      <Text className="text-xs text-blue-800" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                        {booking.refundInfo.expectedProcessingDays} business days
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-xs text-blue-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                        Initiated On:
                      </Text>
                      <Text className="text-xs text-blue-800" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                        {formatDate(booking.refundInfo.createdAt)}
                      </Text>
                    </View>

                    {booking.refundInfo.processedAt && (
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-blue-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                          Processed On:
                        </Text>
                        <Text className="text-xs text-blue-800" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                          {formatDate(booking.refundInfo.processedAt)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {booking.refundInfo.status === 'pending' && (
                    <Text className="text-xs text-blue-700 mt-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      Your refund is being processed and will be credited to your original payment method within {booking.refundInfo.expectedProcessingDays} business days.
                    </Text>
                  )}

                  {booking.refundInfo.status === 'completed' && (
                    <Text className="text-xs text-green-700 mt-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      Your refund has been successfully processed and credited to your original payment method.
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Contact Support for Refund Issues */}
            {(booking.refundInfo.status === 'rejected' || booking.refundInfo.status === 'pending') && (
              <TouchableOpacity className="mt-4 p-3 border border-gray-300 rounded-lg">
                <Text className="text-center text-gray-700" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  Need Help with Refund?
                </Text>
                <Text className="text-center text-sm text-gray-500 mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Contact our support team
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Booking ID */}
        <View className="px-6 py-4 border-t border-gray-100">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Booking ID
              </Text>
              <Text className="text-base text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                {booking.bookingReference}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCopyBookingId} className="p-2">
              <Copy size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reserved For */}
        <View className="px-6 py-4 border-t border-gray-100">
          <Text className="text-lg text-gray-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Reserved for
          </Text>
          <Text className="text-base text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            {booking.guestName || 'Guest'}
          </Text>
        </View>

        {/* Rooms & Guests */}
        <View className="px-6 py-4 border-t border-gray-100">
          <Text className="text-lg text-gray-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Rooms & guests
          </Text>
          <Text className="text-base text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            1 {booking.roomType} • {booking.guests} guest{booking.guests > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Contact Information */}
        <View className="px-6 py-4 border-t border-gray-100">
          <Text className="text-lg text-gray-900 mb-3" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Contact information
          </Text>
          <Text className="text-base text-gray-700 mb-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            {booking.guestEmail || 'saicherry93479@gmail.com'}
          </Text>
          <Text className="text-base text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            {booking.guestPhone || '+91-9515235212'}
          </Text>
        </View>

        {/* Cancellation Policy */}
        <View className="px-6 py-6 border-t border-gray-100">
          <Text className="text-lg text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Cancellation policy
          </Text>

          <View className="mb-4">
            <View className="flex-row items-start mb-3">
              <View className="w-6 h-6 rounded-full border-2 border-orange-500 items-center justify-center mr-3 mt-1">
                <View className="w-2 h-2 bg-orange-500 rounded-full" />
              </View>
              <View className="flex-1">
                <Text className="text-base text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  This booking is non-refundable
                </Text>
                <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Amount paid via YOYO Money or YOYO Rupee will not be refunded.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-6 h-6 rounded-full border-2 border-gray-400 items-center justify-center mr-3 mt-1">
                <View className="w-2 h-2 bg-gray-400 rounded-full" />
              </View>
              <View className="flex-1">
                <Text className="text-base text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  Free cancellation was available till 27 July, 9:00 am
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-sm text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
            In case you don't show up at the property, there will be no refund of YOYO Money or YOYO Rupee.
          </Text>
        </View>

        {/* Manage Your Booking - Hide when refund info exists */}
        {!booking.refundInfo && (
          <View className="px-6 py-6 border-t border-gray-100">
            <Text className="text-sm text-gray-500 mb-4 uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              MANAGE YOUR BOOKING
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-between py-4 border-b border-gray-100"
              onPress={handleModifyGuestName}
            >
              <View className="flex-row items-center">
                <Clock size={20} color="#6B7280" />
                <Text className="text-base text-gray-900 ml-3" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Modify guest name
                </Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>

            <View className="py-4 border-b border-gray-100">
              <Text className="text-base text-gray-900 mb-2" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                Avail GST credit on this booking
              </Text>
              <Text className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Add GSTIN details to get GST credit on this and future bookings
              </Text>
              <TouchableOpacity onPress={handleAddGstin}>
                <Text className="text-blue-600" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  Add GSTIN details
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-between py-4"
              onPress={handleCancelBooking}
            >
              <View className="flex-row items-center">
                <Calendar size={20} color="#EF4444" />
                <Text className="text-base text-gray-900 ml-3" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                  Cancel booking
                </Text>
              </View>
              <Text className="text-gray-400">›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add-ons Section */}
        {booking.addons && booking.addons.length > 0 && (
          <View className="px-6 py-6 border-t border-gray-100">
            <Text className="text-lg text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Add-ons
            </Text>
            <View className="gap-4">
              {booking.addons.map((addon, index) => (
                <View key={addon.id} className="flex-row items-center bg-gray-50 p-4 rounded-lg">
                  <Image
                    source={{ uri: addon.image }}
                    className="w-16 h-16 rounded-lg"
                    style={{ resizeMode: 'cover' }}
                  />
                  <View className="ml-4 flex-1">
                    <Text className="text-base text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                      {addon.name}
                    </Text>
                    <Text className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                      {addon.description}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                        Quantity: {addon.quantity}
                      </Text>
                      <Text className="text-base text-gray-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                        ₹{addon.totalPrice.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Price Breakdown */}
        <View className="px-6 py-6 border-t border-gray-100">
          <Text className="text-lg text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Price Breakdown
          </Text>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                ₹{booking.priceBreakdown.roomRate.toLocaleString()} × {booking.nights} {booking.bookingType == 'daily' ? 'nights' : 'hours'}
              </Text>
              <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                ₹{booking.priceBreakdown.subtotal.toLocaleString()}
              </Text>
            </View>

            {/* Add-ons in price breakdown */}
            {booking.addons && booking.addons.length > 0 && booking.addons.map((addon) => (
              <View key={addon.id} className="flex-row justify-between">
                <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  {addon.name} (x{addon.quantity})
                </Text>
                <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  ₹{addon.totalPrice.toLocaleString()}
                </Text>
              </View>
            ))}

            <View className="flex-row justify-between">
              <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Taxes and fees
              </Text>
              <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                ₹{booking.priceBreakdown.taxes.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                Service fee
              </Text>
              <Text className="text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                ₹{booking.priceBreakdown.serviceFee.toLocaleString()}
              </Text>
            </View>
            <View className="border-t border-gray-200 pt-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-900 text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  Total
                </Text>
                <Text className="text-gray-900 text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  ₹{booking.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Amenities - Hide when refund info exists */}
        {!booking.refundInfo && (
          <View className="px-6 py-6 border-t border-gray-100">
            <Text className="text-lg text-gray-900 mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Amenities
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {booking.amenities.map((amenity, index) => (
                <View key={index} className="bg-gray-100 px-3 py-2 rounded-full">
                  <Text className="text-sm text-gray-700" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                    {amenity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {!booking.refundInfo && <View className="px-6 py-6 border-t border-gray-100 gap-3">
          <TouchableOpacity
            className="w-full h-12 bg-black rounded-lg items-center justify-center"
            onPress={handleContactHotel}
          >
            <Text className="text-white text-base" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Contact Hotel
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-3">
            {canCancelBooking && (
              <TouchableOpacity
                className="flex-1 h-12 bg-gray-100 rounded-lg items-center justify-center flex-row"
                onPress={handleCancelBooking}
                disabled={cancelling}
              >
                <X size={16} color="#DC2626" />
                <Text className="text-gray-600 text-base ml-2" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className={`${canCancelBooking ? 'flex-1' : 'w-full'} h-12 border border-gray-300 rounded-lg items-center justify-center flex-row`}
              onPress={handleDownloadReceipt}
            >
              <Download size={16} color="#374151" />
              <Text className="text-gray-700 text-base ml-2" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                Download Receipt
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        }

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Bottom Payment/Review Section - Hide when refund info exists */}
      {!booking.refundInfo && (
        <View className=" px-6 py-4">
          <View className="bg-white rounded-xl p-4">
            <View className="flex-row gap-3">
              {/* Show review button for completed bookings */}
              {booking.status === 'completed' ? (
                <TouchableOpacity
                  className="flex-1 py-2 px-4 rounded-lg bg-black"
                  onPress={() => setShowReviewModal(true)}
                >
                  <Text className="text-center text-white text-lg mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                    Review your stay
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  {/* Pay at Hotel Button - Always show */}
                  {booking.paymentStaus === 'pending' && <TouchableOpacity className="flex-1 py-2 px-4 rounded-lg border border-gray-300 bg-gray-50">
                    <Text className="text-center text-black text-lg mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                      Pay at hotel
                    </Text>
                  </TouchableOpacity>
                  }

                  {
                    booking.paymentStaus === 'completed' &&
                    <TouchableOpacity
                      className="flex-1 py-2 px-4 rounded-lg bg-green-500 relative"
                    >
                      <>
                        <Text className="text-center text-white text-lg mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                          Payment Sucessful
                        </Text>
                      </>
                    </TouchableOpacity>
                  }

                  {/* Pay Now Button - Only show if onlinePaymentEnabled is true */}
                  {booking.onlinePaymentEnabled && booking.paymentStaus === 'pending' && (
                    <TouchableOpacity
                      className="flex-1 py-2 px-4 rounded-lg bg-black relative"
                      onPress={handlePayNow}
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? (
                        <Text className="text-center text-white text-lg mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                          Loading...
                        </Text>
                      ) : (
                        <>
                          <Text className="text-center text-white text-lg mb-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            Pay now
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        animationType="slide"
      >
        <View className="bg-white rounded-t-3xl px-6 py-6" style={{ width: 350, maxHeight: 500 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl text-gray-900" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Review your stay
            </Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)} className="p-2">
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Hotel Info */}
          <View className="mb-6">
            <Text className="text-lg text-gray-900 mb-1" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              {booking.hotelName}
            </Text>
            <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              {booking.roomType}
            </Text>
          </View>

          {/* Rating */}
          <View className="mb-6">
            <Text className="text-lg text-gray-900 mb-3" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              Overall rating
            </Text>
            <View className="flex-row items-center gap-2">
              {renderStars(reviewRating, setReviewRating)}
            </View>
          </View>

          {/* Comment */}
          <View className="mb-6">
            <Text className="text-lg text-gray-900 mb-3" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
              Share your experience
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-4 text-base h-24"
              style={{ fontFamily: 'PlusJakartaSans-Regular', textAlignVertical: 'top' }}
              placeholder="Tell us about your stay..."
              placeholderTextColor="#9CA3AF"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`w-full py-4 rounded-lg items-center ${submittingReview ? 'bg-gray-400' : 'bg-black'}`}
            onPress={handleSubmitReview}
            disabled={submittingReview}
          >
            {submittingReview ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <Text className="text-white text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                Submit Review
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default BookingDetails;