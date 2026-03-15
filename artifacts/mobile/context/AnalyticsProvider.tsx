import React, { useEffect } from "react";
import { Analytics } from "@/lib/analytics";

const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID || "";
const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || "";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Analytics.init({
      GA_MEASUREMENT_ID,
      AMPLITUDE_API_KEY,
    });

    return () => {
      Analytics.shutdown();
    };
  }, []);

  return <>{children}</>;
}
