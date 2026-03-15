import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SavedLeg {
  id: string;
  action: "buy" | "sell";
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
  expiration: string;
}

export interface SavedStrategy {
  id: string;
  name: string;
  ticker: string;
  spotPrice: number;
  legs: SavedLeg[];
  createdAt: number;
  updatedAt: number;
}

export interface OpenTrade {
  id: string;
  strategyId: string;
  strategyName: string;
  ticker: string;
  openedAt: number;
  closedAt?: number;
  entryNetCost: number;
  exitValue?: number;
  realizedPnL?: number;
  status: "open" | "closed";
}

interface AppContextType {
  savedStrategies: SavedStrategy[];
  openTrades: OpenTrade[];
  saveStrategy: (strategy: Omit<SavedStrategy, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateStrategy: (id: string, updates: Partial<SavedStrategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  openTrade: (trade: Omit<OpenTrade, "id" | "status">) => Promise<void>;
  closeTrade: (tradeId: string, exitValue: number) => Promise<void>;
  deleteTrade: (tradeId: string) => Promise<void>;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STRATEGIES_KEY = "optionviz_strategies";
const TRADES_KEY = "optionviz_trades";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>([]);
  const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [strategiesJson, tradesJson] = await Promise.all([
          AsyncStorage.getItem(STRATEGIES_KEY),
          AsyncStorage.getItem(TRADES_KEY),
        ]);
        if (strategiesJson) setSavedStrategies(JSON.parse(strategiesJson));
        if (tradesJson) setOpenTrades(JSON.parse(tradesJson));
      } catch (e) {
        console.error("Failed to load data:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  const persistStrategies = useCallback(async (strategies: SavedStrategy[]) => {
    await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(strategies));
    setSavedStrategies(strategies);
  }, []);

  const persistTrades = useCallback(async (trades: OpenTrade[]) => {
    await AsyncStorage.setItem(TRADES_KEY, JSON.stringify(trades));
    setOpenTrades(trades);
  }, []);

  const saveStrategy = useCallback(
    async (strategy: Omit<SavedStrategy, "id" | "createdAt" | "updatedAt">) => {
      const newStrategy: SavedStrategy = {
        ...strategy,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...savedStrategies, newStrategy];
      await persistStrategies(updated);
    },
    [savedStrategies, persistStrategies]
  );

  const updateStrategy = useCallback(
    async (id: string, updates: Partial<SavedStrategy>) => {
      const updated = savedStrategies.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      );
      await persistStrategies(updated);
    },
    [savedStrategies, persistStrategies]
  );

  const deleteStrategy = useCallback(
    async (id: string) => {
      const updated = savedStrategies.filter((s) => s.id !== id);
      await persistStrategies(updated);
    },
    [savedStrategies, persistStrategies]
  );

  const openTrade = useCallback(
    async (trade: Omit<OpenTrade, "id" | "status">) => {
      const newTrade: OpenTrade = {
        ...trade,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        status: "open",
      };
      const updated = [...openTrades, newTrade];
      await persistTrades(updated);
    },
    [openTrades, persistTrades]
  );

  const closeTrade = useCallback(
    async (tradeId: string, exitValue: number) => {
      const updated = openTrades.map((t) => {
        if (t.id === tradeId) {
          const realizedPnL = exitValue - t.entryNetCost;
          return {
            ...t,
            status: "closed" as const,
            closedAt: Date.now(),
            exitValue,
            realizedPnL,
          };
        }
        return t;
      });
      await persistTrades(updated);
    },
    [openTrades, persistTrades]
  );

  const deleteTrade = useCallback(
    async (tradeId: string) => {
      const updated = openTrades.filter((t) => t.id !== tradeId);
      await persistTrades(updated);
    },
    [openTrades, persistTrades]
  );

  return (
    <AppContext.Provider
      value={{
        savedStrategies,
        openTrades,
        saveStrategy,
        updateStrategy,
        deleteStrategy,
        openTrade,
        closeTrade,
        deleteTrade,
        isLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
