"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, ClipboardList, Wallet, Tag, Warehouse, Truck, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaslaMark } from "@/components/wasla-mark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/promotions", label: "Promotions", icon: Tag },
  { href: "/warehouse", label: "Warehouse", icon: Warehouse },
  { href: "/delivery", label: "Delivery", icon: Truck },
  { href: "/staff", label: "Staff", icon: UserCog },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-line bg-paper-raised p-4">
      <div className="mb-4 flex items-center gap-2 px-2">
        <WaslaMark size={22} />
        <span className="font-display text-lg font-semibold text-ink">Wasla</span>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-brand-soft hover:text-ink",
              active && "bg-brand-soft text-brand-ink",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
