import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

interface AnimatedButtonProps {
  title: string;
  onPress?: () => void;
  colors?: string[];
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  colors = ["#8B5CF6", "#7C3AED"],
  size = "medium",
  style,
  textStyle,
  disabled = false,
}) => {
  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return { paddingHorizontal: 16, paddingVertical: 8 };
      case "large":
        return { paddingHorizontal: 32, paddingVertical: 16 };
      default:
        return { paddingHorizontal: 24, paddingVertical: 12 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return { fontSize: 14 };
      case "large":
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getSizeStyle(),
        { backgroundColor: colors[0] },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, getTextSize(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.6,
  },
});

export default AnimatedButton;