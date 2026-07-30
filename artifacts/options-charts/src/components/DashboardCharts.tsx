import { useMemo } from "react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { format } from "date-fns";

const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

export function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "6px",
        padding: "10px 14px",
        border: "1px solid #e0e0e0",
        color: "#1a1a1a",
        fontSize: "13px",
      }}
    >
      <div style={{ marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
        {payload.length === 1 && payload[0].color && payload[0].color !== "#ffffff" && (
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: payload[0].color, flexShrink: 0 }} />
        )}
        {label}
      </div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
          {payload.length > 1 && entry.color && entry.color !== "#ffffff" && (
            <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          )}
          <span style={{ color: "#444" }}>{entry.name}</span>
          <span style={{ marginLeft: "auto", fontWeight: 600 }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CustomLegend({ payload }: any) {
  if (!payload || payload.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 16px", fontSize: "13px" }}>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", backgroundColor: entry.color, flexShrink: 0 }} />
          <span style={{ color: "var(--foreground)" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, data, filename, loading, isDark, children }: { title: string, data: any, filename: string, loading: boolean, isDark: boolean, children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {!loading && data && data.length > 0 && (
          <CSVLink data={data} filename={filename} className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
            <Download className="w-3.5 h-3.5" />
          </CSVLink>
        )}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="w-full h-[300px]" /> : data && data.length > 0 ? children : <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>}
      </CardContent>
    </Card>
  );
}

export function DashboardCharts({ 
  chainData, 
  historyData, 
  pcrData, 
  loadingChain, 
  loadingHistory, 
  loadingPcr, 
  isDark 
}: any) {
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const pcrChartData = useMemo(() => {
    if (!pcrData) return [];
    return [
      { name: "Volume", Calls: pcrData.totalCallVol, Puts: pcrData.totalPutVol },
      { name: "Open Interest", Calls: pcrData.totalCallOI, Puts: pcrData.totalPutOI }
    ];
  }, [pcrData]);

  const strikesData = chainData?.strikes || [];
  const spotPrice = chainData?.spotPrice;
  const maxPain = chainData?.maxPain;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* 1. Open Interest by Strike */}
      <ChartCard title="Open Interest by Strike" data={strikesData} filename="oi-by-strike.csv" loading={loadingChain} isDark={isDark}>
        <ResponsiveContainer width="100%" height={300} debounce={0}>
          <BarChart data={strikesData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="strike" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => `$${v}`} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
            <Legend content={<CustomLegend />} />
            {spotPrice && <ReferenceLine x={spotPrice} stroke={CHART_COLORS.green} strokeDasharray="3 3" label={{ value: "Spot", position: "insideTopLeft", fill: CHART_COLORS.green, fontSize: 12 }} />}
            {maxPain && <ReferenceLine x={maxPain} stroke={CHART_COLORS.red} strokeDasharray="3 3" label={{ value: "Max Pain", position: "insideTopRight", fill: CHART_COLORS.red, fontSize: 12 }} />}
            <Bar dataKey="callOpenInterest" name="Call OI" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
            <Bar dataKey="putOpenInterest" name="Put OI" fill={CHART_COLORS.purple} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Volume by Strike */}
      <ChartCard title="Volume by Strike" data={strikesData} filename="volume-by-strike.csv" loading={loadingChain} isDark={isDark}>
        <ResponsiveContainer width="100%" height={300} debounce={0}>
          <BarChart data={strikesData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="strike" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => `$${v}`} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
            <Legend content={<CustomLegend />} />
            {spotPrice && <ReferenceLine x={spotPrice} stroke={CHART_COLORS.green} strokeDasharray="3 3" />}
            <Bar dataKey="callVolume" name="Call Volume" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
            <Bar dataKey="putVolume" name="Put Volume" fill={CHART_COLORS.purple} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Implied Volatility Skew */}
      <ChartCard title="Implied Volatility Skew" data={strikesData} filename="iv-skew.csv" loading={loadingChain} isDark={isDark}>
        <ResponsiveContainer width="100%" height={300} debounce={0}>
          <LineChart data={strikesData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="strike" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => `$${v}`} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => `${Number(v).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: '3 3' }} />
            <Legend content={<CustomLegend />} />
            {spotPrice && <ReferenceLine x={spotPrice} stroke={CHART_COLORS.green} strokeDasharray="3 3" label={{ value: "Spot", position: "insideTopLeft", fill: CHART_COLORS.green, fontSize: 12 }} />}
            <Line type="monotone" dataKey="callIV" name="Call IV" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="putIV" name="Put IV" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.purple, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Put/Call Totals Comparison */}
      <ChartCard title="Put/Call Ratio Summary" data={pcrChartData} filename="pcr-summary.csv" loading={loadingPcr} isDark={isDark}>
        <ResponsiveContainer width="100%" height={300} debounce={0}>
          <BarChart data={pcrChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
            <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
            <Legend content={<CustomLegend />} />
            <Bar dataKey="Calls" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
            <Bar dataKey="Puts" fill={CHART_COLORS.purple} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 5. Price History (Full Width) */}
      <div className="lg:col-span-2">
        <ChartCard title="Price History" data={historyData} filename="price-history.csv" loading={loadingHistory} isDark={isDark}>
          <ResponsiveContainer width="100%" height={300} debounce={0}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="gradientPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: tickColor }} 
                stroke={tickColor} 
                tickFormatter={(d) => {
                  const [y, m, day] = d.split("-").map(Number);
                  return format(new Date(y, m - 1, day), "MMM d");
                }} 
              />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
              <Area type="linear" dataKey="close" name="Close Price" fill="url(#gradientPrice)" stroke={CHART_COLORS.blue} fillOpacity={1} strokeWidth={2} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
