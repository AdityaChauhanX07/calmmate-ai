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
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(7,9,15,0.85)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 48px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        className="px-5 sm:px-12">

        {/* Logo */}
        <Link href="/" className="font-fraunces no-underline" style={{ fontSize: 20, color: 'var(--text)', textDecoration: 'none' }}>
          Calm<em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Mate</em>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="text-[13px] uppercase tracking-[0.08em] transition-colors hover:text-[var(--text)]"
                style={{ color: isActive ? 'var(--text)' : 'var(--muted)', fontWeight: isActive ? 500 : 400, textDecoration: 'none' }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Desktop user */}
        <div className="hidden sm:flex items-center gap-3">
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#07090f', fontSize: 12, fontWeight: 600,
          }}>
            {initial}
          </div>
          <span className="text-[13px] max-w-[120px] truncate" style={{ color: 'var(--muted)' }}>
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="text-[13px] transition-colors hover:text-[var(--text)]"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span
            className="block w-5 h-0.5 transition-transform origin-center"
            style={{
              background: 'var(--text)',
              transform: menuOpen ? 'rotate(45deg) translateY(8px)' : 'none',
            }}
          />
          <span
            className="block w-5 h-0.5 transition-opacity"
            style={{
              background: 'var(--text)',
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-0.5 transition-transform origin-center"
            style={{
              background: 'var(--text)',
              transform: menuOpen ? 'rotate(-45deg) translateY(-8px)' : 'none',
            }}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 sm:hidden animate-fadeIn"
          style={{ background: 'rgba(7,9,15,0.95)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-col px-5 py-4 gap-4">
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-[13px] uppercase tracking-[0.08em] transition-colors"
                  style={{ color: isActive ? 'var(--text)' : 'var(--muted)', textDecoration: 'none' }}
                >
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="text-left text-[13px] transition-colors hover:text-[var(--text)]"
              style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
