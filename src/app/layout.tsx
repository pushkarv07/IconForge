import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "IconForge", description: "Build icons that belong together." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ margin: 0, padding: 0 }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("iconforge-theme")||"system";var d=t==="system"?window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light":t;document.documentElement.dataset.theme=d;}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
