import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/colors";

interface GreekRowProps {
  label: string;
  value: number;
  range?: [number, number];
  description: string;
}

function GreekRow({ label, value, range = [-1, 1], description }: GreekRowProps) {
  const [min, max] = range;
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const isPositive = value >= 0;

  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${normalized * 100}%`,
                backgroundColor: isPositive ? Colors.accent : Colors.red,
              },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.value, { color: isPositive ? Colors.accent : Colors.red }]}>
        {value >= 0 ? "+" : ""}{value.toFixed(4)}
      </Text>
    </View>
  );
}

interface GreeksBarProps {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function GreeksBar({ delta, gamma, theta, vega, rho }: GreeksBarProps) {
  return (
    <View style={styles.container}>
      <GreekRow label="\u0394" value={delta} range={[-1, 1]} description="Delta" />
      <GreekRow label="\u0393" value={gamma} range={[0, 0.1]} description="Gamma" />
      <GreekRow label="\u0398" value={theta} range={[-0.5, 0.1]} description="Theta" />
      <GreekRow label="V" value={vega} range={[0, 1]} description="Vega" />
      <GreekRow label="\u03C1" value={rho} range={[-0.5, 0.5]} description="Rho" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  labelContainer: {
    width: 56,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  desc: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  barContainer: {
    flex: 1,
  },
  track: {
    height: 5,
    backgroundColor: Colors.glass,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  value: {
    width: 70,
    textAlign: "right",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
