import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, Check, Sun, Moon, Printer, Search } from "lucide-react";
import { format } from "date-fns";

import {
  useGetStockQuote,
  useGetOptionExpirations,
  useGetPutCallRatio,
  useGetChainSummary,
  useGetPriceHistory,
  getGetStockQuoteQueryKey,
  getGetOptionExpirationsQueryKey,
  getGetPutCallRatioQueryKey,
  getGetChainSummaryQueryKey,
  getGetPriceHistoryQueryKey,
  type StrikeSummary
} from "@workspace/api-client-react";

import { trackEvent } from "../lib/analytics";
import { KPICard } from "../components/KPICard";
import { DashboardCharts } from "../components/DashboardCharts";
import { StrikesTable } from "../components/StrikesTable";

const CHART_COLORS = {
  blue: "#0079F2",
  purple: "#795EFF",
  green: "#009118",
  red: "#A60808",
  pink: "#ec4899",
};

const DATA_SOURCES = ["OptionViz Live"];

const INTERVAL_OPTIONS = [
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
  { label: "Every 15 min", ms: 15 * 60 * 1000 },
  { label: "Every 1 hour", ms: 60 * 60 * 1000 },
  { label: "Every 24 hours", ms: 24 * 60 * 60 * 1000 },
];

export default function Dashboard() {
  const [tickerInput, setTickerInput] = useState("SPY");
  const [ticker, setTicker] = useState("SPY");
  const [expiration, setExpiration] = useState<string>("");
  const [historyRange, setHistoryRange] = useState<"1mo" | "3mo" | "6mo" | "1y">("3mo");

  const [isDark, setIsDark] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIntervalMs, setSelectedIntervalMs] = useState(5 * 60 * 1000);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const selectTicker = (next: string, source: "search" | "quick_pick") => {
    const cleaned = next.trim().toUpperCase();
    if (!cleaned || cleaned === ticker) return;
    setTickerInput(cleaned);
    setTicker(cleaned);
    trackEvent("ticker_selected", { ticker: cleaned, source });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const quoteQuery = useGetStockQuote(ticker, {
    query: { queryKey: getGetStockQuoteQueryKey(ticker), retry: false },
  });
  const expirationsQuery = useGetOptionExpirations(ticker, {
    query: { queryKey: getGetOptionExpirationsQueryKey(ticker), retry: false },
  });
  const pcrQuery = useGetPutCallRatio(ticker, {
    query: { queryKey: getGetPutCallRatioQueryKey(ticker), retry: false },
  });
  const historyQuery = useGetPriceHistory(ticker, { range: historyRange }, {
    query: { queryKey: getGetPriceHistoryQueryKey(ticker, { range: historyRange }), retry: false },
  });
  
  const expirations = expirationsQuery.data?.expirations || [];
  
  useEffect(() => {
    if (expirations.length > 0) {
      if (!expiration || !expirations.includes(expiration)) {
        setExpiration(expirations.length > 1 ? expirations[1] : expirations[0]);
      }
    }
  }, [expirations, expiration]);

  const chainQuery = useGetChainSummary(ticker, expiration, {
    query: {
      queryKey: getGetChainSummaryQueryKey(ticker, expiration),
      enabled: !!expiration,
      retry: false
    }
  });

  const loadingQuote = quoteQuery.isLoading || quoteQuery.isFetching;
  const loadingChain = chainQuery.isLoading || chainQuery.isFetching;
  const loadingPcr = pcrQuery.isLoading || pcrQuery.isFetching;
  const loadingHistory = historyQuery.isLoading || historyQuery.isFetching;
  const anyLoading = loadingQuote || loadingChain || loadingPcr || loadingHistory || expirationsQuery.isLoading || expirationsQuery.isFetching;

  useEffect(() => {
    if (anyLoading) {
      setIsSpinning(true);
      return;
    }
    const t = setTimeout(() => setIsSpinning(false), 600);
    return () => clearTimeout(t);
  }, [anyLoading]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetStockQuoteQueryKey(ticker) });
    queryClient.invalidateQueries({ queryKey: getGetOptionExpirationsQueryKey(ticker) });
    queryClient.invalidateQueries({ queryKey: getGetPutCallRatioQueryKey(ticker) });
    if (expiration) {
      queryClient.invalidateQueries({ queryKey: getGetChainSummaryQueryKey(ticker, expiration) });
    }
    queryClient.invalidateQueries({ queryKey: getGetPriceHistoryQueryKey(ticker, { range: historyRange }) });
  }, [queryClient, ticker, expiration, historyRange]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(handleRefresh, selectedIntervalMs);
    return () => clearInterval(timer);
  }, [autoRefresh, selectedIntervalMs, handleRefresh]);

  const lastRefreshed = quoteQuery.dataUpdatedAt
    ? (() => {
        const d = new Date(quoteQuery.dataUpdatedAt);
        return `${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase()} on ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      })()
    : null;

  const chainData = chainQuery.data;
  const spotPrice = chainData?.spotPrice || quoteQuery.data?.price || 0;

  const atmIV = useMemo(() => {
    if (!chainData?.strikes || !spotPrice) return null;
    const closest = chainData.strikes.reduce((prev: StrikeSummary, curr: StrikeSummary) =>
      Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev
    );
    if (!closest) return null;
    const callsIV = closest.callIV || 0;
    const putsIV = closest.putIV || 0;
    return (callsIV + putsIV) / 2;
  }, [chainData, spotPrice]);

  return (
    <div className="min-h-[100dvh] bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="pt-2">
            <h1 className="font-bold text-[32px] tracking-tight">Options Charts</h1>
            <p className="text-muted-foreground mt-1 text-[14px]">Explore live options market data</p>
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
                {DATA_SOURCES.map((source) => (
                  <span key={source} className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)", color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)" }}>
                    {source}
                    {source === "OptionViz Live" && chainData?.source === "simulated" ? " (Simulated)" : ""}
                  </span>
                ))}
              </div>
            )}
            {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3 font-medium">Last refresh: {lastRefreshed}</p>}
          </div>

          <div className="flex items-center gap-3 pt-2 print:hidden">
            {/* Split Refresh */}
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px] font-medium"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
                  color: isDark ? "#c8c9cc" : "#4b5563",
                }}
              >
                <button onClick={() => { trackEvent("manual_refresh", { ticker, expiration }); handleRefresh(); }} disabled={anyLoading} className="flex items-center gap-1.5 px-2.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
                  Refresh
                </button>
                <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
                <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-popover p-2 shadow-lg z-50 text-sm">
                  <div className="flex items-center justify-between mb-2 px-2 py-1">
                    <span className="font-semibold text-foreground">Auto-refresh</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={autoRefresh} onChange={(e) => { setAutoRefresh(e.target.checked); trackEvent("auto_refresh_changed", { enabled: e.target.checked, interval_minutes: selectedIntervalMs / 60000 }); }} />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="space-y-1">
                    {INTERVAL_OPTIONS.map((opt) => (
                      <button
                        key={opt.ms}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted font-medium transition-colors ${selectedIntervalMs === opt.ms ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => {
                          setSelectedIntervalMs(opt.ms);
                          if (!autoRefresh) setAutoRefresh(true);
                          setDropdownOpen(false);
                          trackEvent("auto_refresh_changed", { enabled: true, interval_minutes: opt.ms / 60000 });
                        }}
                      >
                        {opt.label}
                        {selectedIntervalMs === opt.ms && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { trackEvent("export_pdf", { ticker, expiration }); window.print(); }}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              title="Export as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                trackEvent("theme_toggled", { theme: next ? "dark" : "light" });
              }}
              className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
              title="Toggle dark mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-end gap-4 bg-card p-5 rounded-xl border print:hidden shadow-sm">
          <div className="w-[220px]">
            <Label className="text-[13px] mb-1.5 block font-semibold text-muted-foreground uppercase tracking-wide">Ticker</Label>
            <div className="flex gap-2">
              <Input 
                value={tickerInput} 
                onChange={e => setTickerInput(e.target.value.toUpperCase())} 
                onKeyDown={e => e.key === "Enter" && selectTicker(tickerInput, "search")}
                placeholder="e.g. SPY" 
                className="h-10 font-bold bg-background text-base"
              />
              <Button onClick={() => selectTicker(tickerInput, "search")} variant="secondary" className="h-10 px-3"><Search className="w-4 h-4" /></Button>
            </div>
            <div className="flex gap-1.5 mt-2.5">
              {["SPY", "QQQ", "AAPL", "TSLA", "NVDA"].map(t => (
                <Badge key={t} variant="secondary" className="cursor-pointer font-bold px-2 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => selectTicker(t, "quick_pick")}>{t}</Badge>
              ))}
            </div>
          </div>
          
          <div className="w-[220px]">
            <Label className="text-[13px] mb-1.5 block font-semibold text-muted-foreground uppercase tracking-wide">Expiration</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={expiration}
              onChange={e => {
                setExpiration(e.target.value);
                trackEvent("expiration_selected", { ticker, expiration: e.target.value });
              }}
              disabled={expirationsQuery.isLoading || expirations.length === 0}
            >
              {expirations.length === 0 && <option value="">Loading...</option>}
              {expirations.map(exp => {
                const [y, m, d] = exp.split("-").map(Number);
                return <option key={exp} value={exp}>{format(new Date(y, m - 1, d), "MMM d, yyyy")}</option>
              })}
            </select>
            <div className="h-[24px]"></div>
          </div>

          <div className="w-[180px]">
            <Label className="text-[13px] mb-1.5 block font-semibold text-muted-foreground uppercase tracking-wide">History Range</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={historyRange}
              onChange={e => {
                const range = e.target.value as "1mo" | "3mo" | "6mo" | "1y";
                setHistoryRange(range);
                trackEvent("history_range_changed", { ticker, range });
              }}
            >
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
            <div className="h-[24px]"></div>
          </div>
        </div>

        {quoteQuery.isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh] border rounded-xl bg-card shadow-sm">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6 mb-5">
              <Search className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ticker not found</h2>
            <p className="text-muted-foreground mb-6 text-base">
              We couldn't find market data for "<span className="font-bold">{ticker}</span>". Please try another symbol.
            </p>
            <div className="flex gap-3">
              {["SPY", "QQQ", "AAPL"].map(t => (
                <Button key={t} variant="outline" onClick={() => { setTickerInput(t); setTicker(t); }}>Try {t}</Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <KPICard 
                title={`Spot Price (${ticker})`}
                value={quoteQuery.data ? `$${quoteQuery.data.price.toFixed(2)}` : "--"}
                change={quoteQuery.data ? `${quoteQuery.data.change > 0 ? "+" : ""}${quoteQuery.data.change.toFixed(2)} (${quoteQuery.data.changePercent.toFixed(2)}%)` : undefined}
                trend={quoteQuery.data?.change && quoteQuery.data.change > 0 ? "up" : quoteQuery.data?.change && quoteQuery.data.change < 0 ? "down" : "neutral"}
                loading={loadingQuote}
              />
              <KPICard 
                title="P/C Volume Ratio"
                value={pcrQuery.data?.volRatio?.toFixed(2) ?? "--"}
                loading={loadingPcr}
                color={pcrQuery.data?.volRatio && pcrQuery.data.volRatio > 1 ? CHART_COLORS.red : CHART_COLORS.green}
              />
              <KPICard 
                title="P/C Open Interest Ratio"
                value={pcrQuery.data?.oiRatio?.toFixed(2) ?? "--"}
                loading={loadingPcr}
                color={pcrQuery.data?.oiRatio && pcrQuery.data.oiRatio > 1 ? CHART_COLORS.red : CHART_COLORS.green}
              />
              <KPICard 
                title="Max Pain Strike"
                value={chainData?.maxPain ? `$${chainData.maxPain.toFixed(2)}` : "--"}
                loading={loadingChain}
              />
              <KPICard 
                title="Total Call Volume"
                value={chainData?.totalCallVolume?.toLocaleString() ?? "--"}
                loading={loadingChain}
              />
              <KPICard 
                title="Total Put Volume"
                value={chainData?.totalPutVolume?.toLocaleString() ?? "--"}
                loading={loadingChain}
              />
              <KPICard 
                title="Avg ATM IV"
                value={atmIV ? `${atmIV.toFixed(1)}%` : "--"}
                loading={loadingChain}
              />
              <KPICard 
                title="Total Open Interest"
                value={chainData ? (chainData.totalCallOpenInterest + chainData.totalPutOpenInterest).toLocaleString() : "--"}
                loading={loadingChain}
              />
            </div>

            {/* Charts */}
            <DashboardCharts 
              chainData={chainData}
              historyData={historyQuery.data?.points}
              pcrData={pcrQuery.data}
              loadingChain={loadingChain}
              loadingHistory={loadingHistory}
              loadingPcr={loadingPcr}
              isDark={isDark}
            />

            {/* Data Table */}
            <StrikesTable 
              data={chainData?.strikes || []} 
              loading={loadingChain} 
              spotPrice={spotPrice} 
            />
          </>
        )}
      </div>
    </div>
  );
}
