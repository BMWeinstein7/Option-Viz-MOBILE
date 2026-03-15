import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, {
  Path,
  Line,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Colors } from "@/constants/colors";

interface PnLPoint {
  price: number;
  pnl: number;
}

interface PnLChartProps {
  data: PnLPoint[];
  spotPrice: number;
  breakEvenPoints?: number[];
  height?: number;
}

const PAD = { top: 20, bottom: 40, left: 60, right: 20 };

export function PnLChart({
  data,
  spotPrice,
  breakEvenPoints = [],
  height = 220,
}: PnLChartProps) {
  const width = 340;

  const { minPrice, maxPrice, minPnl, maxPnl } = useMemo(() => {
    const prices = data.map((d) => d.price);
    const pnls = data.map((d) => d.pnl);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minPnl: Math.min(...pnls),
      maxPnl: Math.max(...pnls),
    };
  }, [data]);

  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const toX = (price: number) =>
    PAD.left + ((price - minPrice) / (maxPrice - minPrice)) * chartW;

  const toY = (pnl: number) => {
    const range = maxPnl - minPnl || 1;
    return PAD.top + chartH - ((pnl - minPnl) / range) * chartH;
  };

  const zeroY = toY(0);

  // Build SVG path
  const pathD = useMemo(() => {
    if (data.length === 0) return "";
    const pts = data.map((d) => `${toX(d.price)},${toY(d.pnl)}`);
    return `M ${pts.join(" L ")}`;
  }, [data, minPrice, maxPrice, minPnl, maxPnl, chartW, chartH]);

  // Profit area fill (above zero)
  const profitAreaD = useMemo(() => {
    if (data.length === 0) return "";
    const pts = data
      .filter((d) => d.pnl >= 0)
      .map((d) => `${toX(d.price)},${toY(d.pnl)}`);
    if (pts.length === 0) return "";
    // Simple fill: drop down to zero line
    const first = data.find((d) => d.pnl >= 0)!;
    const last = [...data].reverse().find((d) => d.pnl >= 0)!;
    return `M ${toX(first.price)},${zeroY} ${pts.join(" L ")} L ${toX(last.price)},${zeroY} Z`;
  }, [data, zeroY, minPrice, maxPrice, minPnl, maxPnl]);

  // Loss area fill (below zero)
  const lossAreaD = useMemo(() => {
    if (data.length === 0) return "";
    const pts = data
      .filter((d) => d.pnl <= 0)
      .map((d) => `${toX(d.price)},${toY(d.pnl)}`);
    if (pts.length === 0) return "";
    const first = data.find((d) => d.pnl <= 0)!;
    const last = [...data].reverse().find((d) => d.pnl <= 0)!;
    return `M ${toX(first.price)},${zeroY} ${pts.join(" L ")} L ${toX(last.price)},${zeroY} Z`;
  }, [data, zeroY, minPrice, maxPrice, minPnl, maxPnl]);

  const fmt = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(0)}`;
  };

  const fmtPrice = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
    return `$${n.toFixed(0)}`;
  };

  const spotX = toX(spotPrice);
  const yLabels = [minPnl, 0, maxPnl].filter((v) => v !== 0);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent} stopOpacity="0.35" />
            <Stop offset="1" stopColor={Colors.accent} stopOpacity="0.05" />
          </LinearGradient>
          <LinearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={Colors.red} stopOpacity="0.35" />
            <Stop offset="1" stopColor={Colors.red} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Fill areas */}
        {profitAreaD ? <Path d={profitAreaD} fill="url(#profitGrad)" /> : null}
        {lossAreaD ? <Path d={lossAreaD} fill="url(#lossGrad)" /> : null}

        {/* Zero line */}
        <Line
          x1={PAD.left}
          y1={zeroY}
          x2={PAD.left + chartW}
          y2={zeroY}
          stroke={Colors.borderLight}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Current spot price line */}
        <Line
          x1={spotX}
          y1={PAD.top}
          x2={spotX}
          y2={PAD.top + chartH}
          stroke={Colors.blue}
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* Break-even markers */}
        {breakEvenPoints.map((be, i) => {
          const bx = toX(be);
          return (
            <React.Fragment key={i}>
              <Circle cx={bx} cy={zeroY} r={4} fill={Colors.gold} />
              <SvgText
                x={bx}
                y={zeroY - 8}
                fontSize={9}
                fill={Colors.gold}
                textAnchor="middle"
              >
                BE
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* P&L curve */}
        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={Colors.accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {/* Y-axis labels */}
        {yLabels.map((v, i) => (
          <SvgText
            key={i}
            x={PAD.left - 4}
            y={toY(v) + 4}
            fontSize={9}
            fill={v >= 0 ? Colors.accent : Colors.red}
            textAnchor="end"
          >
            {fmt(v)}
          </SvgText>
        ))}
        <SvgText
          x={PAD.left - 4}
          y={zeroY + 4}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="end"
        >
          $0
        </SvgText>

        {/* X-axis labels */}
        {[minPrice, spotPrice, maxPrice].map((p, i) => (
          <SvgText
            key={i}
            x={toX(p)}
            y={height - 8}
            fontSize={9}
            fill={p === spotPrice ? Colors.blue : Colors.textMuted}
            textAnchor="middle"
          >
            {fmtPrice(p)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    overflow: "hidden",
  },
});
