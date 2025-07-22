import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { MotiView } from "moti";
import Constants from "expo-constants";

import Input from "./ui/Input";
import AnimatedCard from "./ui/AnimatedCard";
import { createProduct, updateProduct } from "@/api/services";
import { useDarkMode } from "@/app/context/DarkModeContext";

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8081";

export default function CreateProduct({
  onClose,
  editData,
}: {
  onClose: () => void;
  editData?: any;
}) {
  const { colors } = useDarkMode();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editData) {
      setName(editData.name || "");
      setDescription(editData.description || "");
      setQuantityKg(editData.quantityKg?.toString() || "");
      setPricePerKg(editData.pricePerKg?.toString() || "");
      setImage(editData.image ? `${BASE_URL}/${editData.image}` : null);
    }
  }, [editData]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission denied", "Please allow access to gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !quantityKg || !pricePerKg) {
      Alert.alert("Please fill all fields");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("quantityKg", quantityKg);
    formData.append("pricePerKg", pricePerKg);

    if (editData?.id) {
      formData.append("id", editData.id.toString());
    }

    if (image && image.startsWith("file://")) {
      const filename = image.split("/").pop() || "file.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : "jpg";
      formData.append("image", {
        uri: image,
        name: filename,
        type: `image/${ext}`,
      } as any);
    }

    try {
      if (editData) {
        const res = await updateProduct(formData);
        if (res.flag) {
          Alert.alert("Success", "Product updated successfully");
          onClose();
        } else {
          Alert.alert("Error", res.message);
        }
      } else {
        const res = await createProduct(formData);
        if (res.flag) {
          Alert.alert("Success", "Product created successfully");
          onClose();
        } else {
          Alert.alert("Error", res.message);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.headerText} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.headerText }]}>
              {editData ? "Edit Product" : "Add Product"}
            </Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCard style={styles.card}>
          <Text style={[styles.label, { color: colors.text }]}>Product Image</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={36} color="#9CA3AF" />
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                  Tap to upload
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Input
            label="Name"
            placeholder="Enter product name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <Input
            label="Description"
            placeholder="Write a short description"
            value={description}
            onChangeText={setDescription}
            error={errors.description}
            multiline
            style={{ height: 80 }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Input
              label="Quantity (kg)"
              placeholder="0"
              value={quantityKg}
              onChangeText={setQuantityKg}
              keyboardType="numeric"
              error={errors.quantityKg}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Price per kg (₹)"
              placeholder="0"
              value={pricePerKg}
              onChangeText={setPricePerKg}
              keyboardType="numeric"
              error={errors.pricePerKg}
              containerStyle={{ flex: 1 }}
            />
          </View>

          {/* <Button
            title={loading ? "Saving..." : editData ? "Update Product" : "Create Product"}
            onPress={handleSubmit}
            loading={loading}
            style={{ marginTop: 24 }}
          /> */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              {loading ? "Saving..." : editData ? "Update" : "Submit"}
            </Text>
          </TouchableOpacity>
        </AnimatedCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  header: { paddingBottom: 16 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    margin: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 6,
  },
  imagePicker: {
    alignSelf: "center",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
