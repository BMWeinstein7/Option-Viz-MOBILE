import React from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
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
  liveBid?: number;
  liveAsk?: number;
  liveMid?: number;
}

interface LegRowProps {
  leg: Leg;
  onRemove?: () => void;
  onQuantityChange?: (qty: number) => void;
  editable?: boolean;
  showLive?: boolean;
}

export function LegRow({ leg, onRemove, onQuantityChange, editable, showLive }: LegRowProps) {
  const isCall = leg.type === "call";
  const isBuy = leg.action === "buy";
  const hasMid = leg.liveMid != null && leg.liveMid > 0;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
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
          <Text style={styles.detail}>{leg.expiration}</Text>
        </View>

        {editable && onQuantityChange ? (
          <View style={styles.qtyControl}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => onQuantityChange(Math.max(1, leg.quantity - 1))}
              accessibilityLabel="Decrease quantity"
              accessibilityRole="button"
            >
              <Feather name="minus" size={12} color={Colors.textSecondary} />
            </Pressable>
            <TextInput
              style={styles.qtyInput}
              value={String(leg.quantity)}
              onChangeText={(v) => {
                const n = parseInt(v);
                if (!isNaN(n) && n > 0) onQuantityChange(n);
              }}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <Pressable
              style={styles.qtyBtn}
              onPress={() => onQuantityChange(leg.quantity + 1)}
              accessibilityLabel="Increase quantity"
              accessibilityRole="button"
            >
              <Feather name="plus" size={12} color={Colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.qtyStatic}>
            <Text style={styles.qtyStaticText}>x{leg.quantity}</Text>
          </View>
        )}

        {onRemove ? (
          <Pressable onPress={onRemove} style={styles.remove} hitSlop={8} accessibilityLabel="Remove leg" accessibilityRole="button">
            <Feather name="x" size={16} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>MID</Text>
          <Text style={[styles.priceValue, { color: Colors.textPrimary }]}>
            ${(hasMid ? leg.liveMid! : leg.premium).toFixed(2)}
          </Text>
        </View>
        {(showLive || hasMid) && leg.liveBid != null ? (
          <>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>BID</Text>
              <Text style={[styles.priceValue, { color: Colors.accent }]}>
                ${leg.liveBid.toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>ASK</Text>
              <Text style={[styles.priceValue, { color: Colors.red }]}>
                ${(leg.liveAsk ?? 0).toFixed(2)}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>PREMIUM</Text>
            <Text style={styles.priceValue}>${leg.premium.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>COST</Text>
          <Text style={[styles.priceValue, {
            color: isBuy ? Colors.red : Colors.accent,
          }]}>
            {isBuy ? "-" : "+"}${((hasMid ? leg.liveMid! : leg.premium) * leg.quantity * 100).toFixed(0)}
          </Text>
        </View>
        {hasMid && (
          <View style={styles.liveDot}>
            <View style={styles.liveDotInner} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.glassElevated,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  detail: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.glass,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    overflow: "hidden",
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyInput: {
    width: 30,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.glassBorder,
  },
  qtyStatic: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.glass,
    borderRadius: 6,
  },
  qtyStaticText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  remove: {
    padding: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  priceItem: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  liveDot: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
});
