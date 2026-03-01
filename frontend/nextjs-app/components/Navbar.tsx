"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/history", label: "History" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (session?.user?.name || session?.user?.email || "?")[0].toUpperCase();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl bg-[#0a0f1f]/80 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-extrabold text-white">
          CalmMate <span className="text-blue-400">AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? "text-blue-400 font-semibold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop user */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
            {initial}
          </div>
          <span className="text-gray-300 text-sm max-w-[120px] truncate">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="text-gray-500 hover:text-white text-sm transition"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-white transition-transform origin-center ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-opacity ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-transform origin-center ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#0a0f1f]/95 border-b border-white/10 animate-fadeIn sm:hidden">
          <div className="flex flex-col px-4 py-4 gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`text-sm transition-colors ${
                  pathname === href
                    ? "text-blue-400 font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-left text-gray-500 hover:text-white text-sm transition"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
