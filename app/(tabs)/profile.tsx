import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router, useNavigation } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout } = useAuth()


  const UserIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </Svg>
  );

  const ShieldIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z" />
    </Svg>
  );
  
  const RefundIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12,1A11,11 0 0,0 1,12A11,11 0 0,0 12,23A11,11 0 0,0 23,12A11,11 0 0,0 12,1M12,3A9,9 0 0,1 21,12A9,9 0 0,1 12,21A9,9 0 0,1 3,12A9,9 0 0,1 12,3M7,12A5,5 0 0,1 12,7V10.5L16,6.5L12,2.5V6A6,6 0 0,0 6,12H7Z" />
    </Svg>
  );
  
  // Alternative RefundIcon option (money/dollar sign)
  const RefundIcon2 = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
    </Svg>
  );


  const BellIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
    </Svg>
  );

  const SettingsIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
    </Svg>
  );

  const HelpIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
    </Svg>
  );

  const MessageIcon = ({ size = 28, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </Svg>
  );

  const WalletIcon = ({ size = 20, color = "#374151" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18M12,16H22V8H12M16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5Z" />
    </Svg>
  );

  const ChevronRightIcon = ({ size = 20, color = "#9CA3AF" }) => (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill={color}>
      <Path d="M181.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L166.69,128,98.34,59.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,181.66,133.66Z" />
    </Svg>
  );

  const menuItems = [
    {
      section: 'Account Settings',
      items: [
        {
          icon: UserIcon, label: 'Personal information', onPress: () => {
            router.push('/personal-info')
          }
        },
        {
          icon: WalletIcon, label: 'Wallet', onPress: () => {
            router.push('/wallet')
          }
        },
        {
          icon: BellIcon, label: 'Notifications', onPress: () => {
            router.push('/notifications')
          }
        },
      ]
    },
    {
      section: 'Business',
      items: [
        {
          icon: UserIcon, label: 'Join YOYO as partner', onPress: () => {
            router.push('/partner-registration')
          }
        },
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: HelpIcon, label: 'Help Center', onPress: () => { 
          router.push('/contactus')
        } },
        {
          icon: MessageIcon, label: 'Contact us', onPress: () => {
            router.push('/contactus')
          }
        },
      ]
    },
    {
      section: 'Policies',
      items: [
        {
          icon: ShieldIcon, label: 'Privacy & Guest Policy', onPress: () => {
            router.push('/PrivacyPolicy')
          }
        },
        {
          icon: RefundIcon2, label: 'Cancellation & Refund Policy', onPress: () => {
            router.push('/CancellationPolicy')
          }
        },
      ]
    }
  ];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShadowVisible: false,
      headerTitle: () => (
        <Text className="text-2xl text-[#121516]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Profile</Text>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation]);

  return (
    <View className="flex-1 bg-white ">
      {/* Content */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-6">
          {/* Profile Section */}
          <View className="flex-row items-center justify-between mb-8">
            <View className="flex-row items-center gap-4">
              <View className="relative">
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEge7MQC0MLY28227eQEwx3A3dYhxnRrlXYFJZzZVy9K09XXZ1fu1Gw_Y6Y76uySWhIHGTa1BHnwUJd2hTvwqH5sL5bR-AXweZz8IdGWdYNV6KHcCRf0ShYDYi0fYZguUtd7bV8KuR7XOs9eNV9k0jq_FQYezxz-SNIRi2Z-cQKFNqajKaCOoBYI64w1LK4Vnm1B0AufLtX_Ngd-10fnErG_fs-1hRW7xp2l5Wl-YcUcCIuQGlw1ueeQpNUaR3Z6J9zEbRoj6ySg' }}
                  className="w-20 h-20 rounded-full"
                  style={{ aspectRatio: 1 }}
                />
              </View>
              <View className="flex-col">
                <Text className="text-black text-2xl" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Sophia Carter</Text>
                <Text className="text-gray-500 text-sm" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Guest</Text>
              </View>
            </View>
            
            {/* Wallet Icon and Amount */}
            <TouchableOpacity 
              className="flex-row items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg"
              onPress={() => router.push('/wallet')}
            >
              <WalletIcon size={20} color="#374151" />
              <Text className="text-black text-sm" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                ₹1,500
              </Text>
            </TouchableOpacity>
          </View>

          {/* Menu Sections */}
          <View className="gap-8 mb-8">
            {menuItems.map((section, sectionIndex) => (
              <View key={sectionIndex}>
                <Text className="text-black  text-xl pb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{section.section}</Text>
                <View className="gap-1">
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={itemIndex}
                      className="flex-row items-center justify-between px-4 py-4 hover:bg-gray-50 rounded-lg transition-colors"
                      onPress={item.onPress}
                    >
                      <View className="flex-row items-center gap-4">
                        <item.icon size={28} color="#8A8A8A" />
                        <Text className="text-black  text-base flex-1" style={{ fontFamily: 'PlusJakartaSans-Medium' }}>{item.label}</Text>
                      </View>
                      <View className="shrink-0">
                        <ChevronRightIcon size={20} color="#8A8A8A" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Logout Button */}
          <View className="px-4 pt-6 border-t border-gray-100 ">
            <TouchableOpacity className="w-full py-4" onPress={async () => await logout()}>
              <Text className="text-black  text-left" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;