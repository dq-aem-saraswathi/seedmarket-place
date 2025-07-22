import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

export default function PrivacyPolicyScreen() {
  const [policyText, setPolicyText] = useState<string>("");

  useEffect(() => {
    // In a real app, you could fetch this from the backend
    setPolicyText(`
      We value your privacy and are committed to protecting your personal information.
      
      1. Data Collection:
         We collect your name, email, phone number, address, and payment information to provide better services.

      2. Data Usage:
         Your data is used to personalize your experience, manage orders, and improve our platform.

      3. Data Sharing:
         We never sell your data. Information is only shared with service providers essential for app operations.

      4. Security:
         We use encryption and authentication to secure your data.

      5. Changes:
         This policy may be updated. Check back regularly for any changes.

      For any questions, contact support@example.com.
    `);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/profile")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <AnimatedCard style={styles.contentCard}>
        <Text style={styles.content}>
          {policyText}
        </Text>
      </AnimatedCard>
    </ScrollView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginLeft: 12,
  },
  contentCard: {
    marginHorizontal: 0,
  },
  content: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
});
