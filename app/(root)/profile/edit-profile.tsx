import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AnimatedCard from "@/app/components/ui/AnimatedCard";

export default function EditProfile() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const savedName = await AsyncStorage.getItem("profileName");
      const savedBio = await AsyncStorage.getItem("profileBio");
      if (savedName) setName(savedName);
      if (savedBio) setBio(savedBio);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem("profileName", name);
    await AsyncStorage.setItem("profileBio", bio);
    alert("Profile updated!");
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <AnimatedCard style={styles.formCard}>
        {/* Name Input */}
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />

        {/* Bio Input */}
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
          placeholder="Enter your bio"
        />

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>
            Save
          </Text>
        </TouchableOpacity>
      </AnimatedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    marginLeft: 16,
    fontSize: 28,
    fontWeight: "bold",
  },
  formCard: {
    marginHorizontal: 0,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#8b5cf6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});
