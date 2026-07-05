"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OnlineStatus } from "@/components/online-status";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/scanner", label: "Scanner" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-blue-600 text-sm font-bold">BT</span>
          <span>
            <span className="block text-sm font-semibold leading-none">Bundle Tracker</span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-slate-400">Project Nexus</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <nav aria-label="Primary navigation" className="flex h-full items-center gap-1">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <OnlineStatus />
        </div>
      </div>
    </header>
  );
}
