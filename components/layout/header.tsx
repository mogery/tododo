"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ListChecks, ArrowsClockwise, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Today", icon: House },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/recurring", label: "Recurring", icon: ArrowsClockwise },
  { href: "/tags", label: "Tags", icon: Tag },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-primary">
          tododo
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" weight={isActive ? "fill" : "regular"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
