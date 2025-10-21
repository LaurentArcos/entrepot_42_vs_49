import "../styles/globals.css";
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-gray-200 text-gray-900">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
