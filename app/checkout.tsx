import React, { useLayoutEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Image,
    StatusBar,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation, useLocalSearchParams } from 'expo-router';
import { X, Bed, Clock, Tag, User, Mail, Phone } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SheetManager } from 'react-native-actions-sheet';
import Svg, { Path } from 'react-native-svg';

// Define the RoomIcon component directly
const RoomIcon = () => (
    <Bed size={16} color="#6B7280" />
);

const CheckoutScreen = () => {
    const navigation = useNavigation();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [discountAmount, setDiscountAmount] = useState(0);


    // Safe parsing of selectedAddons
    const parseSelectedAddons = () => {
        try {
            if (!params.selectedAddons) {
                return [];
            }

            // If it's already an array, return it
            if (Array.isArray(params.selectedAddons)) {
                return params.selectedAddons;
            }

            // If it's a string, try to parse it
            if (typeof params.selectedAddons === 'string') {
                // Check if it looks like JSON
                if (params.selectedAddons.startsWith('[') || params.selectedAddons.startsWith('{')) {
                    return JSON.parse(params.selectedAddons);
                }
                // If it's "[object Object]" or similar, return empty array
                if (params.selectedAddons.includes('[object')) {
                    console.warn('selectedAddons contains [object Object], returning empty array');
                    return [];
                }
            }

            return [];
        } catch (error) {
            console.error('Error parsing selectedAddons:', error);

            return [];
        }
    };

    const selectedAddons = parseSelectedAddons();
    const addonTotal = parseFloat(String(params.addonTotal || '0')) || 0;

    // console.log('selectedAddons parsed:', selectedAddons);
    // console.log('addonTotal:', addonTotal);

    // Guest information state
    const [guestInfo, setGuestInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Extract booking data from params with safe parsing
    const bookingData = {
        hotelId: String(params.hotelId || ''),
        roomId: String(params.roomId || ''),
        checkIn: String(params.checkIn || ''),
        checkOut: String(params.checkOut || ''),
        guests: parseInt(String(params.guests || '2'), 10) || 2,
        hotelName: String(params.hotelName || ''),
        roomName: String(params.roomName || ''),
        totalAmount: parseFloat(String(params.totalAmount || '0')) || 0,
        address: String(params.address || ''),
        image: String(params.image || ''),
        bookingType: String(params.bookingType || 'daily') as 'daily' | 'hourly'
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShadowVisible: false,
            headerTitle: () => (
                <Text className="text-xl text-[#121516]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Checkout</Text>
            ),
            headerTitleAlign: 'center',
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <X size={24} color="#121516" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    // Validation function for guest information
    const validateGuestInfo = () => {
        if (!guestInfo.name.trim()) {
            Alert.alert('Error', 'Please enter guest name');
            return false;
        }
        if (!guestInfo.email.trim()) {
            Alert.alert('Error', 'Please enter guest email');
            return false;
        }
        if (!guestInfo.phone.trim()) {
            Alert.alert('Error', 'Please enter guest phone number');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(guestInfo.email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }

        // Basic phone validation (at least 10 digits)
        const phoneRegex = /^\d{10,}$/;
        if (!phoneRegex.test(guestInfo.phone.replace(/\D/g, ''))) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return false;
        }

        return true;
    };

    // Handle booking creation
    const handleConfirmBooking = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!bookingData.hotelId || !bookingData.roomId || !bookingData.checkIn || !bookingData.checkOut) {
                Alert.alert('Error', 'Missing required booking information. Please go back and try again.');
                setLoading(false);
                return;
            }

            // Validate guest information
            if (!validateGuestInfo()) {
                setLoading(false);
                return;
            }

            const bookingRequest = {
                hotelId: bookingData.hotelId,
                roomId: bookingData.roomId,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut,
                guests: bookingData.guests,
                guestName: guestInfo.name.trim(),
                guestEmail: guestInfo.email.trim(),
                guestPhone: guestInfo.phone.trim(),
                totalAmount: total, // Final calculated amount after all discounts
                specialRequests: '', // Can be added later if needed,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                selectedAddons: selectedAddons,
                bookingType: bookingData.bookingType, // Include booking type in request
            };



            const response = await apiService.post('/bookings/', bookingRequest);


            if (response.success) {
                Alert.alert(
                    'Booking Confirmed!',
                    `Your ${bookingData.bookingType} booking has been successfully created.`,
                    [
                        {
                            text: 'View Booking',
                            onPress: () => {
                                router.replace('/(tabs)/bookings');
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Booking error:', error);
            Alert.alert('Booking Failed', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Helper function to format date and time for hourly bookings
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Calculate duration and pricing based on booking type
    const calculateBookingMetrics = () => {
        const checkIn = new Date(bookingData.checkIn);
        const checkOut = new Date(bookingData.checkOut);

        if (bookingData.bookingType === 'daily') {
            const timeDiff = checkOut.getTime() - checkIn.getTime();
            const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return {
                duration: nights,
                durationLabel: `${nights} ${nights === 1 ? 'night' : 'nights'}`,
                subtotal: bookingData.totalAmount * nights,
                addonTotalForBooking: addonTotal * nights
            };
        } else {
            // Hourly booking
            const timeDiff = checkOut.getTime() - checkIn.getTime();
            const hours = Math.ceil(timeDiff / (1000 * 3600));
            return {
                duration: hours,
                durationLabel: `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
                subtotal: bookingData.totalAmount * hours, // For hourly, totalAmount is already calculated
                addonTotalForBooking: addonTotal // For hourly, don't multiply addons
            };
        }
    };

    const bookingMetrics = calculateBookingMetrics();
    const { duration, durationLabel, subtotal, addonTotalForBooking } = bookingMetrics;

    const taxes = 0; // As requested, keeping taxes as 0
    const total = subtotal + addonTotalForBooking + taxes - discountAmount;

    const handleCouponApplied = (validationData: any) => {
        setAppliedCoupon(validationData.coupon);
        setDiscountAmount(validationData.discountAmount);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
    };

    const openCouponsSheet = () => {
        SheetManager.show('coupons-sheet', {
            payload: {
                hotelId: bookingData.hotelId,
                roomTypeId: bookingData.roomId,
                orderAmount: subtotal + addonTotalForBooking,
                onCouponApplied: handleCouponApplied,
            },
        });
    };

    const VisaIcon = () => (
        <Svg width="48" height="32" viewBox="0 0 38 24">
            <Path d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" opacity=".07" />
            <Path d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" fill="#fff" />
            <Path d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm-5.5 7.5c.3-1.1.5-1.8.6-2.2l-2.8-5.3h2.2l1.2 2.8 1.1-2.8h2l-2.1 6.6c-.2.6-.4 1.1-.7 1.6l-1.9-1.6c.2-.5.4-.9.5-1.3zm-14.2-7.5h-2.2l-3.6 8.9c-.2.5-.3.7-.3.7h1.6l.5-1.4h2.5l.3 1.4h1.9l-2.1-8.9zm-2.2 5.6l1-2.5.8 2.5h-1.8z" fill="#01579B" />
            <Path d="M12.2 12.2c-.3-2.5-.9-4.8-2.8-4.8s-2.5 2.3-2.8 4.8c.2-2.3.8-4.1 2.3-4.1s2.1 1.8 2.3 4.1zm-3.9 5.3c.3.4.8.6 1.3.6s1-.2 1.3-.6c-.2.4-.6.7-1.3.7s-1.1-.3-1.3-.7z" fill="#F79E1B" />
        </Svg>
    );

    return (
        <SafeAreaView className="flex-1 bg-white ">
            <View className="flex-1 justify-between">
                {/* Scrollable Content */}
                <ScrollView className="flex-1 px-6 py-6">
                    {/* Room Card */}
                    <View className="flex-row items-center bg-white  p-4 rounded-2xl border border-gray-100  shadow-sm mb-6">
                        <View className="w-24 h-24 rounded-xl overflow-hidden">
                            <Image
                                source={{
                                    uri: bookingData.image
                                }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className="text-gray-500  text-xs uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                {bookingData.hotelName}
                            </Text>
                            <Text className="text-black  text-lg  mt-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                {bookingData.roomName}
                            </Text>
                            <View className="flex-row items-center mt-2">
                                <View className="text-gray-500">
                                    <Clock size={16} color="#6B7280" />
                                </View>
                                <Text className="text-gray-500 text-sm ml-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                    {bookingData.bookingType === 'daily'
                                        ? durationLabel
                                        : `${durationLabel} booking`
                                    }
                                </Text>
                            </View>
                            <View className="flex-row items-center mt-2">
                                <View className="text-gray-500">
                                    <RoomIcon />
                                </View>
                                <Text className="text-gray-500 text-sm ml-2" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                    {bookingData.guests} {bookingData.guests === 1 ? 'guest' : 'guests'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Divider */}
                    <View className="h-px bg-gray-100 -mx-6 mb-6" />

                    /* Guest Information Section with smaller TextInputs */
                    <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <Text className="text-[#161312] text-lg mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            Guest Information
                        </Text>

                        {/* Guest Name - Smaller */}
                        <View className="mb-4">
                            <Text className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                Full Name
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-1 border border-gray-200">
                                <User size={16} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-2 text-[#161312] text-sm"
                                    style={{ fontFamily: 'PlusJakartaSans-Regular' }}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#9CA3AF"
                                    value={guestInfo.name}
                                    onChangeText={(text) => setGuestInfo({ ...guestInfo, name: text })}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Guest Email - Smaller */}
                        <View className="mb-4">
                            <Text className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                Email Address
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-1 border border-gray-200">
                                <Mail size={16} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-2 text-[#161312] text-sm"
                                    style={{ fontFamily: 'PlusJakartaSans-Regular' }}
                                    placeholder="Enter email address"
                                    placeholderTextColor="#9CA3AF"
                                    value={guestInfo.email}
                                    onChangeText={(text) => setGuestInfo({ ...guestInfo, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Guest Phone - Smaller */}
                        <View className="mb-0">
                            <Text className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                Phone Number
                            </Text>
                            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-1 border border-gray-200">
                                <Phone size={16} color="#6B7280" />
                                <TextInput
                                    className="flex-1 ml-2 text-[#161312] text-sm"
                                    style={{ fontFamily: 'PlusJakartaSans-Regular' }}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#9CA3AF"
                                    value={guestInfo.phone}
                                    onChangeText={(text) => setGuestInfo({ ...guestInfo, phone: text })}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Selected Add-ons */}
                    {selectedAddons.length > 0 && (
                        <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                            <Text className="text-[#161312] text-lg mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                Selected Add-ons
                            </Text>

                            <View className="gap-3">
                                {selectedAddons.map((addon: any) => (
                                    <View key={addon.id} className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Image
                                            source={{ uri: addon.image }}
                                            className="w-12 h-12 rounded-lg"
                                            style={{ resizeMode: 'cover' }}
                                        />
                                        <View className="flex-1">
                                            <Text className="text-base text-[#161312]" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                                {addon.name}
                                            </Text>
                                            <Text className="text-sm text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                                Quantity: {addon.quantity}
                                            </Text>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-base text-[#161312]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                                ₹{(addon.price * addon.quantity).toLocaleString()}
                                            </Text>
                                            <Text className="text-xs text-gray-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                                {bookingData.bookingType === 'daily' ? 'per night' : 'per booking'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Dates/Times */}
                    <View className="flex-row bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <View className="flex-1">
                            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                {bookingData.bookingType === 'daily' ? 'Check-in' : 'Start Time'}
                            </Text>
                            <Text className="text-[#161312] text-lg mt-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                {bookingData.bookingType === 'daily'
                                    ? formatDate(bookingData.checkIn)
                                    : formatDateTime(bookingData.checkIn)
                                }
                            </Text>
                            <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                {bookingData.bookingType === 'daily' ? 'After 2:00 PM' : 'Start'}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-500 text-sm" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                {bookingData.bookingType === 'daily' ? 'Check-out' : 'End Time'}
                            </Text>
                            <Text className="text-[#161312] text-lg mt-1" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                {bookingData.bookingType === 'daily'
                                    ? formatDate(bookingData.checkOut)
                                    : formatDateTime(bookingData.checkOut)
                                }
                            </Text>
                            <Text className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                {bookingData.bookingType === 'daily' ? 'Before 12:00 PM' : 'End'}
                            </Text>
                        </View>
                        <View className="items-center justify-center">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                                <Text className="text-[#161312] text-sm" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{bookingData.guests}</Text>
                            </View>
                            <Text className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Guests</Text>
                        </View>
                    </View>

                    {/* Price Breakdown */}
                    <View className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
                        <Text className="text-[#161312] text-lg mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            Price Details
                        </Text>

                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                {bookingData.bookingType === 'daily'
                                    ? `₹${bookingData.totalAmount.toLocaleString()} x ${durationLabel}`
                                    : `₹${bookingData.totalAmount.toLocaleString()} x (${durationLabel})`
                                }
                            </Text>
                            <Text className="text-[#161312]" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                ₹{subtotal.toLocaleString()}
                            </Text>
                        </View>

                        {addonTotalForBooking > 0 && (
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                    {bookingData.bookingType === 'daily'
                                        ? `Add-ons x ${durationLabel}`
                                        : 'Add-ons'
                                    }
                                </Text>
                                <Text className="text-[#161312]" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                    ₹{addonTotalForBooking.toLocaleString()}
                                </Text>
                            </View>
                        )}

                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                Taxes and fees
                            </Text>
                            <Text className="text-[#161312]" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                ₹{taxes.toLocaleString()}
                            </Text>
                        </View>

                        {/* Coupon Section */}
                        {appliedCoupon ? (
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center">
                                    <Tag size={16} color="#000000" />
                                    <Text className="text-black ml-2" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                        {appliedCoupon.code}
                                    </Text>
                                    <TouchableOpacity onPress={handleRemoveCoupon} className="ml-2">
                                        <X size={16} color="#000000" />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-black" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                    -₹{discountAmount.toLocaleString()}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => openCouponsSheet()}
                                className="flex-row justify-between items-center mb-3 p-3 rounded-lg border border-dashed border-gray-300 bg-gray-50"
                            >
                                <View className="flex-row items-center">
                                    <Tag size={16} color="#000000" />
                                    <Text className="text-black ml-2" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                                        Apply Coupon
                                    </Text>
                                </View>
                                <Text className="text-black" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                    Save more
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View className="border-t border-gray-200 pt-3">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-[#161312] text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                    Total
                                </Text>
                                <Text className="text-[#161312] text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                    ₹{total.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Cancellation Policy Section */}
                    <View className="mb-6">
                        <Text className="text-[#161312] text-lg  mb-3" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            Cancellation Policy
                        </Text>
                        <Text className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                            {bookingData.bookingType === 'daily'
                                ? `Cancel before Jul 10, 2024 for a partial refund. After that, this reservation is non-refundable.`
                                : `Hourly bookings can be cancelled up to 2 hours before the start time for a partial refund.`
                            }{' '}
                            <Text className="text-black underline" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                Learn more
                            </Text>
                        </Text>
                    </View>
                </ScrollView>

                {/* Confirm Button */}
                <View className="px-6 py-4">
                    <TouchableOpacity
                        className={`w-full p-4 rounded-2xl items-center ${loading ? 'bg-gray-400' : 'bg-black '}`}
                        onPress={handleConfirmBooking}
                        disabled={loading}
                    >
                        {loading ? (
                            <LoadingSpinner size="small" color="white" />
                        ) : (
                            <Text className="text-white  text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                Confirm {bookingData.bookingType === 'daily' ? 'Booking' : 'Hourly Booking'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default CheckoutScreen;