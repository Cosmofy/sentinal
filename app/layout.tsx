import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Status Page",
  description: "Beautiful status page monitoring system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.className} ${GeistMono.variable}`} style={{ backgroundColor: '#ffffff' }}>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              color-scheme: light;
            }
            html {
              background-color: #ffffff !important;
              background: #ffffff !important;
            }
            body {
              background-color: #ffffff !important;
              background: #ffffff !important;
            }
            #__next {
              background-color: #ffffff !important;
            }
          `
        }} />
      </head>
      <body className={GeistSans.className} style={{ backgroundColor: '#ffffff' }}>
        {children}
      </body>
    </html>
  );
}
