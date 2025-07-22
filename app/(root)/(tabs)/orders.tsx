import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getSentNotifications } from "@/api/services";
import { useApi } from "@/hooks/useApi";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function OrdersScreen() {
  const {
    response,
    loading,
    error,
    refetch
  } = useApi(getSentNotifications, { immediate: true });

  const sentNotifications = response?.response ?? [];
  const [refreshing, setRefreshing] = React.useState(false);
  const acceptedRequests = sentNotifications.filter(
    (item) => item.requestStatus === "PENDING"
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleChatWithSeller = (sellerId: string, sellerName: string, productId: number) => {
    router.push({
      pathname: "/(root)/chat/[receiverId]",
      params: {
        receiverId: sellerId,
        productId: productId.toString(),
        receiverName: sellerName,
      },
    });
  };

  const handleViewOrderDetails = (item: any) => {
    router.push({
      pathname: "/(root)/profile/OrderDetails",
      params: {
        productName: item.productName,
        desiredQuantity: item.desiredQuantity.toString(),
        desiredPricePerKg: item.desiredPricePerKg.toString(),
        requestStatus: item.requestStatus,
        sendAt: item.sendAt,
        sellerName: item.sellerName,
      },
    });
  };

  // const handleViewOrderDetails = (item: any) => {
  //   if (item.requestStatus === 'ACCEPTED') {
  //     // Show full order summary
  //     Alert.alert(
  //       "Order Summary",
  //       `Product: ${item.productName}\nQuantity: ${item.desiredQuantity} kg\nPrice: ₹${item.desiredPricePerKg}/kg\nTotal: ₹${(item.desiredQuantity * item.desiredPricePerKg).toFixed(2)}\nStatus: Accepted\n\nThe seller will contact you soon for delivery details.`,
  //       [{ text: "OK" }]
  //     );
  //   } else if (item.requestStatus === 'REJECTED') {
  //     Alert.alert(
  //       "Order Rejected",
  //       "Unfortunately, this order was rejected by the seller. You can try contacting them or look for similar products.",
  //       [{ text: "OK" }]
  //     );
  //   } else {
  //     Alert.alert(
  //       "Order Pending",
  //       "Your order is still pending approval from the seller. Please wait for their response.",
  //       [{ text: "OK" }]
  //     );
  //   }
  // };

  const renderHeader = () => (

    <View
      style={styles.header}
    >
      <SafeAreaView>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Orders</Text>
            <Text style={styles.headerSubtitle}>
              {acceptedRequests.length} order{acceptedRequests.length !== 1 ? 's' : ''} placed
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{sentNotifications.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>

  );

  const renderOrderItem = ({ item, index }: { item: any; index: number }) => {
    const status = item.requestStatus || item.status || "PENDING";
    const totalAmount = (item.desiredQuantity * item.desiredPricePerKg).toFixed(2);

    return (
      <TouchableOpacity onPress={() => handleViewOrderDetails(item)} activeOpacity={0.9}>
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>
                Order #{item.id}
              </Text>
              <Text style={styles.productName}>
                {item.productName || `Product #${item.productId}`}
              </Text>
              <Text style={styles.sellerName}>
                From {item.sellerName || "Unknown Seller"}
              </Text>
            </View>

            <View style={[
              styles.statusBadge,
              status === 'ACCEPTED' ? styles.acceptedBadge :
                status === 'REJECTED' ? styles.rejectedBadge : styles.pendingBadge
            ]}>
              <Ionicons
                name={
                  status === 'ACCEPTED' ? 'checkmark-circle' :
                    status === 'REJECTED' ? 'close-circle' : 'time'
                }
                size={12}
                color={
                  status === 'ACCEPTED' ? '#065F46' :
                    status === 'REJECTED' ? '#991B1B' : '#92400E'
                }
              />
              <Text style={[
                styles.statusText,
                status === 'ACCEPTED' ? styles.acceptedText :
                  status === 'REJECTED' ? styles.rejectedText : styles.pendingText
              ]}>
                {status}
              </Text>
            </View>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="scale-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>{item.desiredQuantity} kg</Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={16} color="#6B7280" />
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>₹{item.desiredPricePerKg}/kg</Text>
              </View>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>₹{totalAmount}</Text>
            </View>

            {item.sendAt && (
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.dateText}>
                  Ordered on {new Date(item.sendAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {status === 'ACCEPTED' && (
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>
                Your order has been accepted! The seller will contact you soon.
              </Text>
            </View>
          )}

          {status === 'REJECTED' && (
            <View style={styles.errorMessage}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>
                Unfortunately, this order was rejected by the seller.
              </Text>
            </View>
          )}

          <View style={styles.orderActions}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={(e) => {
                e.stopPropagation();
                handleChatWithSeller(item.sellerId, item.sellerName, item.productId);
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#8B5CF6" />
              <Text style={styles.chatButtonText}>Chat with Seller</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load orders</Text>
        {/* <Button title="Retry" onPress={refetch} /> */}
        <TouchableOpacity
          onPress={refetch}
          className="mt-4 px-6 py-2 bg-blue-600 rounded-md self-center"
        >
          <Text className="text-white font-semibold text-base text-center">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sentNotifications}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={{ alignItems: "center" }}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                When you request products from sellers, they'll appear here
              </Text>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingBottom: 20,
    backgroundColor: "#3B82F6",
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#DBEAFE',
    marginTop: 4,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#DBEAFE',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 100,
  },
  orderCard: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  sellerName: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  acceptedBadge: {
    backgroundColor: '#D1FAE5',
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingText: {
    color: '#92400E',
  },
  acceptedText: {
    color: '#065F46',
  },
  rejectedText: {
    color: '#991B1B',
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 8,
    flex: 1,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
    marginLeft: 8,
    flex: 1,
  },
  orderActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    alignSelf: 'flex-start',
  },
  chatButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  // errorText: {
  //   fontSize: 18,
  //   color: '#EF4444',
  //   marginVertical: 16,
  //   textAlign: 'center',
  // },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});