import React, { useState } from 'react';
import ActionSheet, { SheetManager } from 'react-native-actions-sheet';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, FlatList } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';

interface Room {
    id: string;
    name: string;
    features: string;
    displayPrice: number;
    image?: string;
    images?: string[];
}

interface RoomSelectionSheetProps {
    sheetId: string;
    payload?: {
        hotel: any;
        selectedRoomFromMain?: Room; // The room that was clicked
        currentRoom?: Room;
        onRoomSelect: (room: Room) => void;
        bookingType?: string;
    };
}

export function RoomSelectionSheet({ sheetId, payload }: RoomSelectionSheetProps) {
    const { hotel, selectedRoomFromMain, currentRoom, onRoomSelect, bookingType = 'daily' } = payload || {};
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleClose = () => {
        SheetManager.hide(sheetId);
    };

    const handleSelectRoom = () => {
        if (selectedRoomFromMain && onRoomSelect) {
            onRoomSelect(selectedRoomFromMain);
            handleClose();
        }
    };

    // Get images for the selected room
    const getRoomImages = (room: Room) => {
        if (room?.images && room.images.length > 0) {
            return room.images.map(image => image.url);
        }
        if (room?.image) {
            return [room.image];
        }
        // Fallback to hotel images
        if (hotel?.images) {
            if (Array.isArray(hotel.images)) {
                return hotel.images.map(img => typeof img === 'string' ? img : img.url || img);
            }
            if (hotel.images.primary) {
                const images = [hotel.images.primary];
                if (hotel.images.gallery) {
                    images.push(...hotel.images.gallery);
                }
                return images;
            }
        }
        return ['https://via.placeholder.com/400x300?text=No+Image'];
    };

    const roomImages = selectedRoomFromMain ? getRoomImages(selectedRoomFromMain) : [];

    return (
        <ActionSheet
            id={sheetId}
            containerStyle={{
                paddingHorizontal: 0,
                paddingBottom: 0,
            }}
            closable={true}
            closeOnTouchBackdrop={true}
        >
            <View className="rounded-t-2xl bg-white pt-3" style={{ maxHeight: '90%' }}>

                {/* Handle */}
                <View className="flex h-5 w-full items-center justify-center">
                    <View className="h-1.5 w-10 rounded-full bg-gray-200" />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
                    <View className="flex-1">
                        <Text className="text-2xl text-black" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            {selectedRoomFromMain?.name || 'Room Details'}
                        </Text>
                        {/* <Text className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                            {selectedRoomFromMain?.features}
                        </Text> */}
                    </View>
                    <TouchableOpacity onPress={handleClose} className="p-2">
                        <X size={24} color="#8A8A8A" />
                    </TouchableOpacity>
                </View>

                <View className="">
                    {/* Room Images */}
                    {roomImages.length > 0 ? (
                        <View className="relative">
                            <FlatList
                                data={roomImages}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(event) => {
                                    const contentOffset = event.nativeEvent.contentOffset.x;
                                    const viewSize = event.nativeEvent.layoutMeasurement.width;
                                    const pageIndex = Math.round(contentOffset / viewSize);
                                    setCurrentImageIndex(pageIndex);
                                }}
                                style={{ height: 300 }}
                                directionalLockEnabled={true}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item: imageUrl, index }) => (
                                    <View style={{ width: Dimensions.get('window').width, height: 300, backgroundColor: '#f0f0f0' }}>
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={{
                                                width: '100%',
                                                height: 300,
                                                resizeMode: 'cover'
                                            }}
                                            onError={(error) => {
                                                console.log('Image load error for:', imageUrl, error);
                                            }}
                                            onLoad={() => {
                                                console.log('Image loaded successfully:', imageUrl);
                                            }}
                                        />
                                    </View>
                                )}
                            />

                            {/* Image Indicators */}
                            {roomImages.length > 1 && (
                                <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                                    {roomImages.map((_, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                setCurrentImageIndex(index);
                                                // You might want to scroll to this image programmatically
                                            }}
                                            className={`h-2 rounded-full ${index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                                                }`}
                                        />
                                    ))}
                                </View>
                            )}

                            {/* Price Overlay */}
                            <View className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                                <Text className="text-lg text-black" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                    ₹{selectedRoomFromMain?.displayPrice.toLocaleString()}
                                </Text>
                                <Text className="text-xs text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                    /{bookingType === 'hourly' ? 'hour' : 'night'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ height: 300, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                            <Text>No images available</Text>
                        </View>
                    )}

                    {/* Room Details */}
                    <View className="p-4">
                        {/* <View className="bg-gray-50 rounded-xl p-4 mb-4">
                            <Text className="text-lg text-black mb-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                                Room Features
                            </Text>
                            <Text className="text-sm text-gray-700 leading-5" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                {selectedRoomFromMain?.features || 'Comfortable accommodation with modern amenities for a pleasant stay.'}
                            </Text>
                        </View> */}

                        <View className="flex-row items-center justify-between py-3">
                            <Text className="text-base text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                Bed Type
                            </Text>
                            <Text className="text-base text-black" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                {selectedRoomFromMain.bedType}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                            <Text className="text-base text-gray-600" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                                Occupancy
                            </Text>
                            <Text className="text-base text-black" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
                                {selectedRoomFromMain.capacity}
                            </Text>
                        </View>


                    </View>
                </View>

                {/* Bottom Select Button */}
                <View className="border-t border-gray-200 bg-white px-4 py-4">
                    <TouchableOpacity
                        onPress={handleSelectRoom}
                        className="bg-black rounded-full px-6 py-4 flex-row items-center justify-center"
                    >
                        <Text className="text-white text-lg mr-2" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            Select This Room
                        </Text>
                        <Text className="text-white text-lg" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                            ₹{selectedRoomFromMain?.displayPrice.toLocaleString()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ActionSheet>
    );
}