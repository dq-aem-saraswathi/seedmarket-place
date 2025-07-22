import { Slot } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@/store";
import "./global.css";
import { AuthProvider } from "@/app/context/AuthContext";
import { DarkModeProvider } from "@/app/context/DarkModeContext";
import { useFrameworkReady } from "@/hooks/useFrameworkReady";
import { StatusBar, setStatusBarStyle } from "expo-status-bar";
import { useDarkMode } from "@/app/context/DarkModeContext";
import { useEffect } from "react";

function StatusBarManager() {
  const { isDarkMode } = useDarkMode();

  useEffect(() => {
    setStatusBarStyle(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode]);

  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  useFrameworkReady();
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
