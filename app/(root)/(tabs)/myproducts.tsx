import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getMyProducts, deleteProduct } from "@/api/services";
import useFetch from "@/hooks/useFetch";
import CreateProduct from "@/app/components/CreateProduct";
import { useRouter } from "expo-router"; // ✅ Import router
import { useDarkMode } from "@/app/context/DarkModeContext";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

import Constants from "expo-constants";
const BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl;
export default function Products() {
  const { colors } = useDarkMode();
  const { data: response, loading, error, refetch } = useFetch(getMyProducts);
  const products = response?.response || [];

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter(); // ✅ Initialize router

  const handleDelete = async (id: number) => {
    Alert.alert("Confirm", "Are you sure you want to delete this product?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteProduct(id);
            Alert.alert("Deleted", "Product removed");
            refetch();
          } catch (e) {
            Alert.alert("Error", "Failed to delete product");
          }
        },
        style: "destructive",
      },
    ]);
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProduct(null);
    refetch();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <View>
          <Text style={[styles.title, { color: colors.headerText }]}>
            My Products
          </Text>
          <Text style={[styles.subtitle, { color: `${colors.headerText}CC` }]}>
            {products.length} product{products.length !== 1 ? "s" : ""} listed
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setEditProduct(null);
            setShowModal(true);
          }}
        >
          <Ionicons
            name="add"
            size={24}
            color={colors.surface}
            style={styles.addButtonText}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No products yet
          </Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Add your first product to start selling
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditProduct(null);
              setShowModal(true);
            }}
          >
            <Text style={[styles.addButtonText, { color: colors.surface }]}>
              Add Product
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardContainer}
              activeOpacity={0.9}
              onPress={() => router.push(`/product/${item.id}`)}
            >
            <AnimatedCard style={styles.card}>
              {/* Image section */}
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri: item.image
                      ? `${BASE_URL}/${item.image}`
                      : "https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=400",
                  }}
                  style={styles.productImage}
                />

                {/* Stock badge (bottom-right of image) */}
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>{item.quantityKg} kg</Text>
                </View>
              </View>

              {/* Content section */}
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.priceContainer}>
                  <Text style={[styles.cardPrice, { color: colors.primary }]}>
                    ₹ {item.pricePerKg} /kg
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.remainingQuantityKg > 0
                        ? styles.availableBadge
                        : styles.outOfStockBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.remainingQuantityKg > 0
                          ? styles.availableText
                          : styles.outOfStockText,
                      ]}
                    >
                      {item.remainingQuantityKg > 0
                        ? "Available"
                        : "Out of Stock"}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation(); // ✅ Prevents click propagation to detail nav
                    setEditProduct(item);
                    setShowModal(true);
                  }}
                >
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
                  <Text style={[{ paddingBottom: 25 }, { color: colors.text }]}>
                    Edit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation(); // ✅ Prevents click propagation to detail nav
                    handleDelete(item.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              </View>
            </AnimatedCard>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide">
        <CreateProduct onClose={closeModal} editData={editProduct} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { fontSize: 14 },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: { fontWeight: "600" },
  empty: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 20,
    marginTop: 40,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  cardContent: { flex: 1, marginLeft: 12 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: { fontSize: 14, marginBottom: 8 },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  cardPrice: { fontSize: 18, fontWeight: "700" },
  cardStock: { color: "#6B21A8" },
  imageContainer: { position: "relative" },
  productImage: {
    width: 90,
    height: 100,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  stockBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#10B981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
  statusContainer: { flexDirection: "row" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  availableBadge: { backgroundColor: "#D1FAE5" },
  outOfStockBadge: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 12, fontWeight: "600" },
  availableText: { color: "#065F46" },
  outOfStockText: { color: "#991B1B" },
});
