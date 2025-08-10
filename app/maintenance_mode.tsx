
import React from 'react';
import { View, Text, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, RefreshCw } from 'lucide-react-native';

export default function MaintenanceMode() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <View className="flex-1 justify-center items-center px-6">
        {/* Icon */}
        <View className="w-24 h-24 bg-orange-100 rounded-full items-center justify-center mb-8">
          <Wrench size={48} color="#f97316" />
        </View>

        {/* Title */}
        <Text 
          className="text-3xl text-gray-900 text-center mb-4" 
          style={{ fontFamily: 'PlusJakartaSans-Bold' }}
        >
          We'll be right back!
        </Text>

        {/* Description */}
        <Text 
          className="text-lg text-gray-600 text-center mb-8 leading-6" 
          style={{ fontFamily: 'PlusJakartaSans-Regular' }}
        >
          We're currently performing some maintenance to improve your experience. 
          Please check back in a few minutes.
        </Text>

        {/* Loading indicator */}
        <View className="flex-row items-center gap-2">
          <RefreshCw size={20} color="#f97316" />
          <Text 
            className="text-base text-orange-600" 
            style={{ fontFamily: 'PlusJakartaSans-Medium' }}
          >
            Updating our services...
          </Text>
        </View>

        {/* Footer */}
        <View className="absolute bottom-10 left-6 right-6">
          <Text 
            className="text-sm text-gray-500 text-center" 
            style={{ fontFamily: 'PlusJakartaSans-Regular' }}
          >
            Thank you for your patience. We appreciate your understanding.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
