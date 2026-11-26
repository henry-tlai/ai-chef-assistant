
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Chat" },
  { href: "/favorites", label: "Favorites" },
  { href: "/discover", label: "Discover" },
];

function NavItem({
  href,
  label,
  pathname,
  className = "",
}: {
  href: string;
  label: string;
  pathname: string;
  className?: string;
}) {
  const isCurrentPage =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isCurrentPage ? "page" : undefined}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${className} ${
        isCurrentPage
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
          : "hover:bg-stone-100 dark:hover:bg-stone-800"
      }`}
    >
      {label}
    </Link>
  );
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={
        mobile
          ? "flex shrink-0 gap-1 border-t border-stone-200 bg-white p-2 md:hidden dark:border-stone-800 dark:bg-stone-900"
          : "hidden w-40 shrink-0 flex-col gap-1 border-r border-stone-200 bg-white p-3 md:flex dark:border-stone-800 dark:bg-stone-900"
      }
    >
      {NAV.map((item) => (
        <NavItem
          key={item.href}
          {...item}
          pathname={pathname}
          className={mobile ? "flex-1 text-center" : ""}
        />
      ))}
    </nav>
  );
}

export function NavRail() {
  return (
    <Suspense
      fallback={
        <nav
          aria-label="Main navigation"
          className="hidden w-40 shrink-0 md:flex"
        />
      }
    >
      <Navigation />
    </Suspense>
  );
}

export function TabBar() {
  return (
    <Suspense
      fallback={
        <nav
          aria-label="Main navigation"
          className="flex shrink-0 gap-1 p-2 md:hidden"
        />
      }
    >
      <Navigation mobile />
    </Suspense>
  );
}
