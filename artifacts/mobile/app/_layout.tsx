import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { AnalyticsProvider } from "@/context/AnalyticsProvider";
import { AuthScreen } from "@/components/AuthScreen";
import { Analytics, AnalyticsEvents } from "@/lib/analytics";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5000,
    },
  },
});

function AuthGate() {
  const { user, login, register, logout } = useAppContext();
  const { isLoading } = useAuth();
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      Analytics.identify(user.id, {
        email: user.email,
        first_name: user.firstName,
        auth_method: "email",
      });
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  if (!user && !isGuest) {
    return (
      <AuthScreen
        onLogin={login}
        onRegister={register}
        onGuest={() => {
          Analytics.track(AnalyticsEvents.AUTH_GUEST_MODE);
          Analytics.track(AnalyticsEvents.GUEST_SESSION_STARTED);
          setIsGuest(true);
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    Analytics.track(AnalyticsEvents.APP_OPENED);
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <AnalyticsProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <AuthGate />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </AppProvider>
            </AuthProvider>
          </QueryClientProvider>
        </AnalyticsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
