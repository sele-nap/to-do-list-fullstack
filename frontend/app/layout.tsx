import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "To-Do List",
  description: "A cozy place to keep track of your magical tasks",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
