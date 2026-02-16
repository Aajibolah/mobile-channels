"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Overview" },
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/links", label: "Links" },
  { href: "/app/settings", label: "Settings" },
];

export function AppShellNav() {
  const pathname = usePathname();

  return (
    <nav className="app-shell-nav" aria-label="App sections">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/app" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-nav-link ${isActive ? "active" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

