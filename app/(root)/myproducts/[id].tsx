import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  FlatList,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { viewProduct, getReceivedNotifications } from "@/api/services";
import { ProductDTO } from "@/api/types";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Constants from "expo-constants";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

// Mock reviews for the product
const mockProductReviews = [
  {
    id: 1,
    userName: "Farmer John",
    rating: 5,
    comment: "Excellent quality seeds! Great germination rate.",
    date: "2024-01-15",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100",
  },
  {
    id: 2,
    userName: "Agricultural Co.",
    rating: 4,
    comment: "Good seeds, fast delivery. Will order again.",
    date: "2024-01-10",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100",
  },
];

export default function MyProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProductAndOrders();
    }, [id])
  );

  const fetchProductAndOrders = async () => {
    try {
      // Fetch product details
      const productRes = await viewProduct(Number(id));
      if (productRes.flag) {
        setProduct(productRes.response);
      }

      // Fetch orders for this product
      const ordersRes = await getReceivedNotifications();
      if (ordersRes.flag) {
        // Filter orders for this specific product
        const productOrders = ordersRes.response.filter(
          (order: any) => order.productId === Number(id)
        );
        setOrders(productOrders);
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProductAndOrders();
    setRefreshing(false);
  }, []);

  const getStatusCounts = () => {
    const pending = orders.filter(
      (order) => order.requestStatus === "PENDING"
    ).length;
    const accepted = orders.filter(
      (order) => order.requestStatus === "ACCEPTED"
    ).length;
    const rejected = orders.filter(
      (order) => order.requestStatus === "REJECTED"
    ).length;

    return { pending, accepted, rejected };
  };

  const renderStarRating = (rating: number) => {
    return (
      <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const renderOrderItem = ({ item, index }: { item: any; index: number }) => {
    const status = item.requestStatus || "PENDING";
    const totalAmount = (item.desiredQuantity * item.desiredPricePerKg).toFixed(
      2
    );

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle}>Order #{item.id}</Text>
            <Text style={styles.buyerName}>From {item.buyerName}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              status === "ACCEPTED"
                ? styles.acceptedBadge
                : status === "REJECTED"
                ? styles.rejectedBadge
                : styles.pendingBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                status === "ACCEPTED"
                  ? styles.acceptedText
                  : status === "REJECTED"
                  ? styles.rejectedText
                  : styles.pendingText,
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.desiredQuantity} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>₹{item.desiredPricePerKg}/kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderReview = ({ item, index }: { item: any; index: number }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewerName}>{item.userName}</Text>
          {renderStarRating(item.rating)}
          <Text style={styles.reviewDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="lg" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Product not found</Text>
        {/* <Button title="Go Back" onPress={() => router.back()} /> */}
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusCounts = getStatusCounts();
  const averageRating =
    mockProductReviews.reduce((sum, review) => sum + review.rating, 0) /
    mockProductReviews.length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}

        <View
          // colors={['#10B981', '#059669']}
          style={styles.header}
        >
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Product Details</Text>
              <TouchableOpacity
                onPress={() => router.push(`/(root)/myproducts/edit/${id}`)}
                style={styles.editButton}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Product Summary */}
        <AnimatedCard style={styles.productCard}>
          <View style={styles.productContent}>
            <Image
              source={{
                uri: product.image
                  ? `${BASE_URL}/${product.image}`
                  : "https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=300",
              }}
              style={styles.productImage}
            />

            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productDescription} numberOfLines={3}>
                {product.description}
              </Text>

              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{product.pricePerKg}</Text>
                <Text style={styles.priceUnit}>/kg</Text>
              </View>

              <View style={styles.stockInfo}>
                <Ionicons name="cube-outline" size={16} color="#6B7280" />
                <Text style={styles.stockText}>
                  {product.remainingQuantityKg} kg available
                </Text>
              </View>

              <View style={styles.ratingContainer}>
                {renderStarRating(Math.round(averageRating))}
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} ({mockProductReviews.length}{" "}
                  reviews)
                </Text>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {/* Status Counts */}
        <AnimatedCard style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Order Status Summary</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, styles.pendingIcon]}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statusCount}>{statusCounts.pending}</Text>
              <Text style={styles.statusLabel}>Pending</Text>
            </View>

            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, styles.acceptedIcon]}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#10B981"
                />
              </View>
              <Text style={styles.statusCount}>{statusCounts.accepted}</Text>
              <Text style={styles.statusLabel}>Accepted</Text>
            </View>

            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, styles.rejectedIcon]}>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#EF4444"
                />
              </View>
              <Text style={styles.statusCount}>{statusCounts.rejected}</Text>
              <Text style={styles.statusLabel}>Rejected</Text>
            </View>
          </View>
        </AnimatedCard>

        {/* Orders List */}
        <AnimatedCard style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/sales")}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {orders.length > 0 ? (
            <FlatList
              data={orders.slice(0, 3)} // Show only first 3 orders
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderOrderItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyOrders}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>
                Orders for this product will appear here
              </Text>
            </View>
          )}
        </AnimatedCard>

        {/* Reviews Section */}
        <AnimatedCard style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={mockProductReviews}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReview}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </AnimatedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  productCard: {
    margin: 16,
    marginBottom: 8,
  },
  productContent: {
    flexDirection: "row",
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981",
  },
  priceUnit: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 2,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stockText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statusItem: {
    alignItems: "center",
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pendingIcon: {
    backgroundColor: "#FEF3C7",
  },
  acceptedIcon: {
    backgroundColor: "#D1FAE5",
  },
  rejectedIcon: {
    backgroundColor: "#FEE2E2",
  },
  statusCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  ordersSection: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  seeAllText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  orderCard: {
    marginBottom: 12,
    padding: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  acceptedBadge: {
    backgroundColor: "#D1FAE5",
  },
  rejectedBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pendingText: {
    color: "#92400E",
  },
  acceptedText: {
    color: "#065F46",
  },
  rejectedText: {
    color: "#991B1B",
  },
  orderDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  emptyOrders: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  reviewsSection: {
    margin: 16,
    marginBottom: 32,
  },
  reviewCard: {
    marginBottom: 12,
    padding: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#F3F4F6",
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginVertical: 16,
    textAlign: "center",
  },
  goBackButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 16,
  },

  goBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
