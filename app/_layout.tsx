import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@/store";
import "./global.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { DarkModeProvider } from "@/app/context/DarkModeContext";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { StatusBar } from "expo-status-bar";
import { useDarkMode } from "@/app/context/DarkModeContext";
import { useEffect } from "react";

function StatusBarManager() {
  const { isDarkMode } = useDarkMode();

  return <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={isDarkMode ? '#1F2937' : '#FFFFFF'} />;
}

function AppContent() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <Provider store={store}>
          <StatusBarManager />
          <Slot />
        </Provider>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return <AppContent />;
}