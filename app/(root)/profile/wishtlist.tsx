import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

export default function wishtlist() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(root)/(tabs)")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Wishlist</Text>
      </View>
      
      <AnimatedCard style={styles.emptyCard}>
        <View style={styles.emptyContent}>
          <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No items in wishlist</Text>
          <Text style={styles.emptySubtitle}>
            Products you save will appear here
          </Text>
        </View>
      </AnimatedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 12,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    marginTop: 40,
    marginHorizontal: 0,
  },
  emptyContent: {
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    color: "#6b7280",
  },
});
