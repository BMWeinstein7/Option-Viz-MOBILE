import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

export interface Leg {
  id: string;
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
  expiration: string;
}

interface LegRowProps {
  leg: Leg;
  onRemove?: () => void;
}

export function LegRow({ leg, onRemove }: LegRowProps) {
  const isCall = leg.type === "call";
  const isBuy = leg.action === "buy";

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: isBuy ? Colors.accentDim : Colors.redDim }]}>
        <Text style={[styles.badgeText, { color: isBuy ? Colors.accent : Colors.red }]}>
          {leg.action.toUpperCase()}
        </Text>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: isCall ? Colors.blueDim : Colors.purpleDim }]}>
        <Text style={[styles.typeText, { color: isCall ? Colors.blue : Colors.purple }]}>
          {leg.type.toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.strike}>${leg.strike}</Text>
        <Text style={styles.detail}>
          x{leg.quantity} · ${leg.premium} · {leg.expiration}
        </Text>
      </View>

      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.remove} hitSlop={8}>
          <Feather name="x" size={16} color={Colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.bgCardElevated,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
  },
  strike: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  detail: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  remove: {
    padding: 4,
  },
});
