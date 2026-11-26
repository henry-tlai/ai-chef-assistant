"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Chat" },
  { href: "/favorites", label: "Favorites" },
  { href: "/discover", label: "Discover" },
];

function NavItem({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  const pathname = usePathname();
  const current = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${className} ${
        current
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
          : "hover:bg-stone-100 dark:hover:bg-stone-800"
      }`}
    >
      {label}
    </Link>
  );
}

export function NavRail() {
  return (
    <Suspense fallback={<nav aria-label="Main" className="hidden w-40 shrink-0 md:flex" />}>
      <nav aria-label="Main" className="hidden w-40 shrink-0 flex-col gap-1 border-r border-stone-200 bg-white p-3 md:flex dark:border-stone-800 dark:bg-stone-900">
        {NAV.map((n) => <NavItem key={n.href} {...n} />)}
      </nav>
    </Suspense>
  );
}

export function TabBar() {
  return (
    <Suspense fallback={<nav aria-label="Main" className="flex shrink-0 gap-1 p-2 md:hidden" />}>
      <nav aria-label="Main" className="flex shrink-0 gap-1 border-t border-stone-200 bg-white p-2 md:hidden dark:border-stone-800 dark:bg-stone-900">
        {NAV.map((n) => <NavItem key={n.href} {...n} className="flex-1 text-center" />)}
      </nav>
    </Suspense>
  );
}