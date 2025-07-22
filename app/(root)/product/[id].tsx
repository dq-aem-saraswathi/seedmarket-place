import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  viewProduct,
  getProducts,
  createNotificationRequest,
} from "@/api/services";
import { ProductDTO } from "@/api/types";
import { useDarkMode } from "@/app/context/DarkModeContext";

import Input from "@/app/components/ui/Input";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";
import Constants from "expo-constants";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;

// Mock reviews data - in real app, this would come from API
const mockReviews = [
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

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useDarkMode();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Order modal states
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [sampleModalVisible, setSampleModalVisible] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [sampleQuantity, setSampleQuantity] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
      getCurrentUserId();
    }, [id])
  );

  const getCurrentUserId = async () => {
    const userId = await AsyncStorage.getItem("userId");
    setCurrentUserId(userId);
  };

  const fetchProduct = async () => {
    try {
      const res = await viewProduct(Number(id));
      if (res.flag) {
        setProduct(res.response);
        await fetchSimilarProducts(res.response);
      } else {
        Alert.alert("Error", res.message);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async (currentProduct: ProductDTO) => {
    try {
      const res = await getProducts(0, 5);
      if (res.flag) {
        // Filter out current product and get similar ones
        const similar = res.response
          .filter(
            (p) => p.id !== currentProduct.id && p.remainingQuantityKg > 0
          )
          .slice(0, 3);
        setSimilarProducts(similar);
      }
    } catch (err) {
      console.error("Error fetching similar products:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProduct();
    setRefreshing(false);
  }, []);

  const handleOrderNow = async () => {
    if (!orderQuantity || !product || !currentUserId) {
      Alert.alert("Error", "Please enter quantity");
      return;
    }

    const quantity = parseFloat(orderQuantity);
    if (quantity <= 0 || quantity > product.remainingQuantityKg) {
      Alert.alert("Error", "Invalid quantity");
      return;
    }

    setOrderLoading(true);

    try {
      // Create order request
      await createNotificationRequest({
        buyerId: currentUserId,
        sellerId: product.userId!,
        productId: product.id,
        desiredQuantity: quantity,
        desiredPricePerKg: product.pricePerKg,
        requestStatus: "PENDING",
        sendAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Order request sent successfully!");
      setOrderModalVisible(false);
      setOrderQuantity("");
    } catch (err) {
      console.error("Order request failed:", err);
      Alert.alert("Error", "Failed to send order request");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleRequestSample = async () => {
    if (!sampleQuantity || !product || !currentUserId) {
      Alert.alert("Error", "Please enter sample quantity");
      return;
    }

    const quantity = parseFloat(sampleQuantity);
    if (quantity <= 0 || quantity > 1) {
      // Sample limit to 1kg
      Alert.alert("Error", "Sample quantity should be between 0.1 - 1 kg");
      return;
    }

    setOrderLoading(true);

    try {
      // Create sample request
      await createNotificationRequest({
        buyerId: currentUserId,
        sellerId: product.userId!,
        productId: product.id,
        desiredQuantity: quantity,
        desiredPricePerKg: product.pricePerKg,
        requestStatus: "PENDING",
        sendAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Sample request sent successfully!");
      setSampleModalVisible(false);
      setSampleQuantity("");
    } catch (err) {
      console.error("Sample request failed:", err);
      Alert.alert("Error", "Failed to send sample request");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleChatPress = () => {
    if (!product) return;
    router.push({
      pathname: "/(root)/chat/[receiverId]",
      params: {
        receiverId: product.userId!,
        productId: product.id.toString(),
        receiverName: product.seller?.name || "Seller",
      },
    });
  };

  const handleSaveProduct = async () => {
    // In real app, save to backend
    const savedProducts = (await AsyncStorage.getItem("savedProducts")) || "[]";
    const saved = JSON.parse(savedProducts);

    if (isSaved) {
      const filtered = saved.filter((p: any) => p.id !== product?.id);
      await AsyncStorage.setItem("savedProducts", JSON.stringify(filtered));
      setIsSaved(false);
      Alert.alert("Removed", "Product removed from saved items");
    } else {
      saved.push(product);
      await AsyncStorage.setItem("savedProducts", JSON.stringify(saved));
      setIsSaved(true);
      Alert.alert("Saved", "Product saved successfully");
    }
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

  const renderReview = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
      <View style={styles.reviewHeader}>
        <Image source={{ uri: item.avatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewInfo}>
          <Text style={[styles.reviewerName, { color: colors.text }]}>
            {item.userName}
          </Text>
          {renderStarRating(item.rating)}
          <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
        {item.comment}
      </Text>
    </View>
  );

  const renderSimilarProduct = ({ item }: { item: ProductDTO }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(root)/product/${item.id}`)}
      style={styles.similarProductCard}
    >
      <Image
        source={{
          uri:
            item.image ||
            "https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=200",
        }}
        style={styles.similarProductImage}
      />
      <Text
        style={[styles.similarProductName, { color: colors.text }]}
        numberOfLines={2}
      >
        {item.name}
      </Text>
      <Text style={styles.similarProductPrice}>₹{item.pricePerKg}/kg</Text>
    </TouchableOpacity>
  );

  const renderOrderModal = () => (
    <Modal
      visible={orderModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setOrderModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Send Request
            </Text>
            <TouchableOpacity
              onPress={() => setOrderModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {product && (
            <>
              <Text style={[styles.productName, { color: colors.text }]}>
                {product.name}
              </Text>
              <Text style={[styles.productPrice, { color: colors.primary }]}>
                ₹{product.pricePerKg}/kg
              </Text>
              <Text
                style={[styles.availableStock, { color: colors.textSecondary }]}
              >
                Available: {product.remainingQuantityKg} kg
              </Text>

              <Input
                label="Quantity (kg)"
                placeholder="Enter quantity"
                keyboardType="numeric"
                value={orderQuantity}
                onChangeText={setOrderQuantity}
                containerStyle={styles.quantityInput}
              />

              {orderQuantity && (
                <View
                  style={[
                    styles.totalContainer,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    Total Amount:
                  </Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>
                    ₹
                    {(parseFloat(orderQuantity) * product.pricePerKg).toFixed(
                      2
                    )}
                  </Text>
                </View>
              )}
              {/* 
              <Button
                title={orderLoading ? "Placing Order..." : "Place Order"}
                onPress={handleOrderNow}
                loading={orderLoading}
                style={styles.modalButton}
              /> */}
              <TouchableOpacity
                onPress={handleOrderNow}
                disabled={orderLoading}
                style={[styles.modButton, orderLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.modalButtonText}>
                  {orderLoading ? "Sending Request..." : "send Request"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderSampleModal = () => (
    <Modal
      visible={sampleModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setSampleModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Request Sample
            </Text>
            <TouchableOpacity
              onPress={() => setSampleModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {product && (
            <>
              <Text style={[styles.productName, { color: colors.text }]}>
                {product.name}
              </Text>
              <Text style={[styles.productPrice, { color: colors.primary }]}>
                ₹{product.pricePerKg}/kg
              </Text>
              <Text style={styles.sampleNote}>Sample limit: 0.1 - 1 kg</Text>

              <Input
                label="Sample Quantity (kg)"
                placeholder="Enter sample quantity"
                keyboardType="numeric"
                value={sampleQuantity}
                onChangeText={setSampleQuantity}
                containerStyle={styles.quantityInput}
              />

              {sampleQuantity && (
                <View
                  style={[
                    styles.totalContainer,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Text style={[styles.totalLabel, { color: colors.text }]}>
                    Sample Cost:
                  </Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>
                    ₹
                    {(parseFloat(sampleQuantity) * product.pricePerKg).toFixed(
                      2
                    )}
                  </Text>
                </View>
              )}
              {/* <Button
                title={orderLoading ? "Requesting..." : "Request Sample"}
                onPress={handleRequestSample}
                loading={orderLoading}
                style={styles.modalButton}
              /> */}
              <TouchableOpacity
                onPress={handleRequestSample}
                disabled={orderLoading}
                style={[styles.modButton, orderLoading && { opacity: 0.6 }]}
              >
                <Text style={styles.modalButtonText}>
                  {orderLoading ? "Requesting..." : "Request Sample"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <LoadingSpinner size="lg" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading product details...
        </Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Product not found</Text>
        {/* <Button title="Go Back" onPress={() => router.back()} /> */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.goBackButton}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const averageRating =
    mockReviews.reduce((sum, review) => sum + review.rating, 0) /
    mockReviews.length;
  const isOwner = product.userId === currentUserId;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSaveProduct}
            style={styles.saveButton}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#EF4444" : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View>
          <Image
            source={{
              uri: product.image
                ? `${BASE_URL}/${product.image}`
                : "https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=600",
            }}
            style={styles.productImage}
          />
        </View>

        {/* Product Info */}
        <AnimatedCard style={styles.productInfoCard}>
          <Text style={[styles.productTitle, { color: colors.text }]}>
            {product.name}
          </Text>

          <View style={styles.ratingContainer}>
            {renderStarRating(Math.round(averageRating))}
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {averageRating.toFixed(1)} ({mockReviews.length} reviews)
            </Text>
          </View>

          <Text
            style={[styles.productDescription, { color: colors.textSecondary }]}
          >
            {product.description}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.pricePerKg}</Text>
            <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>
              /kg
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons
                name="cube-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.detailLabel, { color: colors.textSecondary }]}
              >
                Available:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {product.remainingQuantityKg} kg
              </Text>
            </View>

            {product.seller && (
              <View style={styles.detailItem}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Seller:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {product.seller.name}
                </Text>
              </View>
            )}
          </View>
        </AnimatedCard>

        {/* Action Buttons */}
        {!isOwner && (
          <AnimatedCard style={styles.actionCard}>
            <View style={styles.actionButtons}>
              {/* <Button
                title="Order Now"
                onPress={() => setOrderModalVisible(true)}
                style={styles.orderButton}
              /> */}
              <TouchableOpacity
                style={styles.orderButton}
                onPress={() => setOrderModalVisible(true)}
              >
                <Text style={styles.orderButtonText}>Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chatButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={handleChatPress}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.chatButtonText, { color: colors.primary }]}
                >
                  Chat
                </Text>
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        )}

        {/* Reviews Section */}
        <AnimatedCard style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Customer Reviews
            </Text>
            <TouchableOpacity>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={mockReviews}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderReview}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </AnimatedCard>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <AnimatedCard style={styles.similarSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Similar Products
            </Text>
            <FlatList
              data={similarProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSimilarProduct}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarProductsList}
            />
          </AnimatedCard>
        )}
      </ScrollView>

      {renderOrderModal()}
      {renderSampleModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 20,
  },
  saveButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 8,
    borderRadius: 20,
  },
  productImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#F3F4F6",
  },
  productInfoCard: {
    margin: 16,
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10B981",
  },
  priceUnit: {
    fontSize: 16,
    marginLeft: 4,
  },
  detailsContainer: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  orderButton: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  orderButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  chatButtonText: {
    fontWeight: "600",
    marginLeft: 4,
  },
  sampleButton: {
    marginTop: 0,
  },
  reviewsSection: {
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
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  similarSection: {
    margin: 16,
    marginBottom: 32,
  },
  similarProductsList: {
    paddingTop: 12,
  },
  similarProductCard: {
    width: 120,
    marginRight: 12,
  },
  similarProductImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  similarProductName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  similarProductPrice: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginVertical: 16,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  availableStock: {
    fontSize: 14,
    marginBottom: 20,
  },
  sampleNote: {
    fontSize: 14,
    color: "#F59E0B",
    marginBottom: 20,
    fontStyle: "italic",
  },
  quantityInput: {
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalButton: {
    marginTop: 8,
  },
  modButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  goBackButton: {
    backgroundColor: "#2563EB", // or any primary color you prefer
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },

  goBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
