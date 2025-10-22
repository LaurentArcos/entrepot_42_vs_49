// src\app\layout.tsx

import "../styles/globals.css";
import React from "react";

export const metadata = {
  title: "Entrepôt 42 vs 49",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-gray-100 text-gray-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
