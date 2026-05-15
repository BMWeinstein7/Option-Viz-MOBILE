import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        <title>OptionViz — Options Strategy Builder & Visualizer</title>
        <meta
          name="description"
          content="OptionViz is a mobile-first options strategy builder and visualizer. Design, analyze, and track multi-leg options trades with live market data, margin calculations, and rate-of-return metrics."
        />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#0A0E1A" />

        <meta property="og:title" content="OptionViz" />
        <meta
          property="og:description"
          content="Mobile-first options strategy builder and visualizer."
        />
        <meta property="og:type" content="website" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
