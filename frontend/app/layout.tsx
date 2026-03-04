import type { Metadata, Viewport } from "next"
import "./globals.css"
import Providers from "./providers"

export const metadata: Metadata = {
  title: "To-Do List ✨",
  description: "A cozy place to keep track of your magical tasks",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "To-Do List" },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#c9a84c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Lora:ital,wght@0,400;0,500;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
