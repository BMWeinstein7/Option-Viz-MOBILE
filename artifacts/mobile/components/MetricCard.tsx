import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

interface MetricCardProps {
  label: string;
  value: string;
  color?: string;
  small?: boolean;
}

export function MetricCard({ label, value, color, small }: MetricCardProps) {
  return (
    <View style={[styles.container, small && styles.small]}>
      <Text style={[styles.label, small && styles.labelSmall]}>{label}</Text>
      <Text style={[styles.value, small && styles.valueSmall, color ? { color } : null]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassElevated,
    borderRadius: 14,
    padding: 14,
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  small: {
    padding: 10,
    borderRadius: 12,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  labelSmall: {
    fontSize: 10,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  valueSmall: {
    fontSize: 14,
  },
});
