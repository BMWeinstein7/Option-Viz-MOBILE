import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface AuthScreenProps {
  onLogin: () => Promise<void>;
  onGuest: () => void;
  isLoading?: boolean;
}

export function AuthScreen({ onLogin, onGuest, isLoading }: AuthScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.welcomeContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather name="trending-up" size={36} color={Colors.accent} />
          </View>
        </View>

        <Text style={styles.appName}>OptionViz</Text>
        <Text style={styles.tagline}>Options Strategy Builder & Visualizer</Text>

        <View style={styles.featureList}>
          {[
            ["bar-chart-2", "12+ strategy templates with P&L analysis"],
            ["activity", "Live streaming market data for any ticker"],
            ["layers", "Custom strategy builder with Greeks"],
            ["briefcase", "Portfolio tracking & trade management"],
          ].map(([icon, text], i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={icon as any} size={16} color={Colors.accent} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.welcomeButtons}>
          <Pressable
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={onLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <Text style={styles.primaryBtnText}>Log In</Text>
            )}
          </Pressable>

          <Pressable style={styles.ghostBtn} onPress={onGuest}>
            <Text style={styles.ghostBtnText}>Continue as Guest</Text>
            <Feather name="arrow-right" size={14} color={Colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.accentDim,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 36,
  },
  featureList: {
    gap: 14,
    marginBottom: 40,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.glassElevated,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  welcomeButtons: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.bg,
  },
  ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  ghostBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
