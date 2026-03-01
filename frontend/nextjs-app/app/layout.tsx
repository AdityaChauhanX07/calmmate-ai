import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CalmMate AI",
  description: "Your personal AI voice companion for emotional clarity",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        {/* Ambient background — fixed, z-0, behind all content */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Orb 1: blue, top-left */}
          <div style={{
            position: 'absolute', width: '600px', height: '600px',
            top: '-100px', left: '-100px',
            background: 'radial-gradient(circle, #1a4060 0%, transparent 70%)',
            animation: 'drift 14s ease-in-out infinite',
            filter: 'blur(80px)',
            opacity: 0.35,
          }} />
          {/* Orb 2: purple, bottom-right */}
          <div style={{
            position: 'absolute', width: '500px', height: '500px',
            bottom: '-80px', right: '-80px',
            background: 'radial-gradient(circle, #2a1040 0%, transparent 70%)',
            animation: 'drift 18s ease-in-out infinite reverse',
            filter: 'blur(80px)',
            opacity: 0.35,
          }} />
          {/* Orb 3: green, center */}
          <div style={{
            position: 'absolute', width: '300px', height: '300px',
            top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #0d3020 0%, transparent 70%)',
            animation: 'drift 10s ease-in-out infinite',
            filter: 'blur(80px)',
            opacity: 0.35,
          }} />
          {/* Noise texture overlay via inline SVG */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <filter id="noise-f">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#noise-f)" />
          </svg>
        </div>
        <div className="relative z-[1]">
          <SessionProvider session={session}>
            {children}
          </SessionProvider>
        </div>
      </body>
    </html>
  );
}
