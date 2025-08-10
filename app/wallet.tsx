
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react-native';
import { apiService } from '@/services/api';

interface WalletData {
  id: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  status: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  source: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string;
  referenceType: string;
  createdAt: string;
  metadata?: any;
}

interface WalletResponse {
  success: boolean;
  data: WalletData;
}

interface TransactionsResponse {
  success: boolean;
  data: {
    wallet: WalletData;
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function WalletScreen() {
  const navigation = useNavigation();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <Text className="text-xl text-black" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
          Wallet
        </Text>
      ),
      headerTitleAlign: 'center',
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} className="ml-4">
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchWalletData = async () => {
    try {
      const [walletResponse, transactionsResponse] = await Promise.all([
        apiService.get<WalletResponse>('/api/v1/wallet'),
        apiService.get<TransactionsResponse>('/api/v1/wallet/transactions'),
      ]);

      if (walletResponse.success) {
        setWalletData(walletResponse.data);
      }

      if (transactionsResponse.success) {
        setTransactions(transactionsResponse.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Balance Card */}
        <View className="mx-4 mt-6 mb-4">
          <View className="bg-black rounded-2xl p-6">
            <View className="flex-row items-center gap-3 mb-4">
              <Wallet size={24} color="#fff" />
              <Text className="text-white text-lg" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                Wallet Balance
              </Text>
            </View>
            
            <Text className="text-white text-4xl mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              ₹{walletData?.balance?.toLocaleString() || '0'}
            </Text>
            
            <View className="flex-row justify-between">
              <View>
                <Text className="text-gray-300 text-sm" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Total Earned
                </Text>
                <Text className="text-white text-lg" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  ₹{walletData?.totalEarned?.toLocaleString() || '0'}
                </Text>
              </View>
              <View>
                <Text className="text-gray-300 text-sm" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  Total Spent
                </Text>
                <Text className="text-white text-lg" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                  ₹{walletData?.totalSpent?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transactions Section */}
        <View className="mx-4 mb-6">
          <Text className="text-black text-xl mb-4" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            Recent Transactions
          </Text>
          
          <View className="bg-white rounded-2xl overflow-hidden">
            {transactions.length === 0 ? (
              <View className="p-8 items-center">
                <Text className="text-gray-500 text-center" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                  No transactions found
                </Text>
              </View>
            ) : (
              transactions.map((transaction, index) => (
                <View key={transaction.id}>
                  <View className="flex-row items-center justify-between p-4">
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className={`p-2 rounded-full ${
                        transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <ArrowDownLeft size={20} color="#16a34a" />
                        ) : (
                          <ArrowUpRight size={20} color="#dc2626" />
                        )}
                      </View>
                      
                      <View className="flex-1">
                        <Text className="text-black text-base" style={{ fontFamily: 'PlusJakartaSans-SemiBold' }}>
                          {transaction.description}
                        </Text>
                        <Text className="text-gray-500 text-sm" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                          {formatDate(transaction.createdAt)} • {formatTime(transaction.createdAt)}
                        </Text>
                      </View>
                      
                      <View className="items-end">
                        <Text className={`text-lg ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                        </Text>
                        <Text className="text-gray-500 text-xs" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
                          Balance: ₹{transaction.balanceAfter.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < transactions.length - 1 && <View className="h-px bg-gray-100 mx-4" />}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
