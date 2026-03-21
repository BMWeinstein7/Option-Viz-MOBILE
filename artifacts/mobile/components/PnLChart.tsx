import React, { useMemo, useState } from "react";
import { View, StyleSheet, LayoutChangeEvent } from "react-native";
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

interface TimeDecayCurve {
  dte: number;
  label: string;
  data: PnLPoint[];
}

interface PnLChartProps {
  data: PnLPoint[];
  spotPrice: number;
  breakEvenPoints?: number[];
  height?: number;
  timeDecayCurves?: TimeDecayCurve[];
}

const PAD = { top: 20, bottom: 40, left: 60, right: 20 };

const TIME_COLORS = [
  `rgba(56, 189, 248, 0.5)`,
  `rgba(167, 139, 250, 0.5)`,
  `rgba(251, 191, 36, 0.5)`,
];

export function PnLChart({
  data,
  spotPrice,
  breakEvenPoints = [],
  height = 220,
  timeDecayCurves = [],
}: PnLChartProps) {
  const [layoutWidth, setLayoutWidth] = useState(340);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== layoutWidth) setLayoutWidth(w);
  };

  const width = layoutWidth;

  const { minPrice, maxPrice, minPnl, maxPnl } = useMemo(() => {
    const allPnls = [...data.map((d) => d.pnl)];
    for (const curve of timeDecayCurves) {
      for (const pt of curve.data) {
        allPnls.push(pt.pnl);
      }
    }
    const prices = data.map((d) => d.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      minPnl: Math.min(...allPnls),
      maxPnl: Math.max(...allPnls),
    };
  }, [data, timeDecayCurves]);

  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const toX = (price: number) =>
    PAD.left + ((price - minPrice) / (maxPrice - minPrice)) * chartW;

  const toY = (pnl: number) => {
    const range = maxPnl - minPnl || 1;
    return PAD.top + chartH - ((pnl - minPnl) / range) * chartH;
  };

  const zeroY = toY(0);

  const pathD = useMemo(() => {
    if (data.length === 0) return "";
    const pts = data.map((d) => `${toX(d.price)},${toY(d.pnl)}`);
    return `M ${pts.join(" L ")}`;
  }, [data, minPrice, maxPrice, minPnl, maxPnl, chartW, chartH]);

  const profitAreaD = useMemo(() => {
    if (data.length === 0) return "";
    const pts = data
      .filter((d) => d.pnl >= 0)
      .map((d) => `${toX(d.price)},${toY(d.pnl)}`);
    if (pts.length === 0) return "";
    const first = data.find((d) => d.pnl >= 0)!;
    const last = [...data].reverse().find((d) => d.pnl >= 0)!;
    return `M ${toX(first.price)},${zeroY} ${pts.join(" L ")} L ${toX(last.price)},${zeroY} Z`;
  }, [data, zeroY, minPrice, maxPrice, minPnl, maxPnl]);

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

  const timeDecayPaths = useMemo(() => {
    return timeDecayCurves.map((curve) => {
      if (curve.data.length === 0) return "";
      const pts = curve.data.map((d) => `${toX(d.price)},${toY(d.pnl)}`);
      return `M ${pts.join(" L ")}`;
    });
  }, [timeDecayCurves, minPrice, maxPrice, minPnl, maxPnl, chartW, chartH]);

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
    <View style={styles.container} onLayout={handleLayout}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.accent} stopOpacity="0.25" />
            <Stop offset="1" stopColor={Colors.accent} stopOpacity="0.02" />
          </LinearGradient>
          <LinearGradient id="lossGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={Colors.red} stopOpacity="0.25" />
            <Stop offset="1" stopColor={Colors.red} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {profitAreaD ? <Path d={profitAreaD} fill="url(#profitGrad)" /> : null}
        {lossAreaD ? <Path d={lossAreaD} fill="url(#lossGrad)" /> : null}

        <Line
          x1={PAD.left}
          y1={zeroY}
          x2={PAD.left + chartW}
          y2={zeroY}
          stroke={Colors.glassBorder}
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        <Line
          x1={spotX}
          y1={PAD.top}
          x2={spotX}
          y2={PAD.top + chartH}
          stroke={Colors.blue}
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.6}
        />

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

        {timeDecayPaths.map((pathStr, i) =>
          pathStr ? (
            <Path
              key={`td-${i}`}
              d={pathStr}
              fill="none"
              stroke={TIME_COLORS[i] || TIME_COLORS[0]}
              strokeWidth={1.5}
              strokeDasharray="5,4"
              strokeLinejoin="round"
            />
          ) : null
        )}

        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={Colors.textPrimary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
          />
        ) : null}

        {yLabels.map((v, i) => (
          <SvgText
            key={i}
            x={PAD.left - 4}
            y={toY(v) + 4}
            fontSize={9}
            fill={v >= 0 ? Colors.accent : Colors.red}
            textAnchor="end"
            opacity={0.8}
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

        {timeDecayCurves.map((curve, i) => (
          <SvgText
            key={`label-${i}`}
            x={width - PAD.right - 2}
            y={PAD.top + 12 + i * 14}
            fontSize={8}
            fill={TIME_COLORS[i] || TIME_COLORS[0]}
            textAnchor="end"
          >
            {curve.label}
          </SvgText>
        ))}
        {timeDecayCurves.length > 0 && (
          <SvgText
            x={width - PAD.right - 2}
            y={PAD.top + 12 + timeDecayCurves.length * 14}
            fontSize={8}
            fill={Colors.textPrimary}
            textAnchor="end"
            opacity={0.7}
          >
            At Expiry
          </SvgText>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    overflow: "hidden",
  },
});
