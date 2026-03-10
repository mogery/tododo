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

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-around px-4">
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
                "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className="size-5"
                weight={isActive ? "fill" : "regular"}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
