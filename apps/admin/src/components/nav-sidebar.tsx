"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, ClipboardList, Wallet, Tag, Warehouse, Truck, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaslaMark } from "@/components/wasla-mark";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/products", label: "Catalog", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/staff", label: "Staff", icon: UserCog },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/promotions", label: "Promotions", icon: Tag },
  { href: "/warehouse", label: "Warehouse", icon: Warehouse },
  { href: "/delivery", label: "Delivery", icon: Truck },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const displayName = user?.email?.split("@")[0] ?? "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();
  const role = user?.roles[0]?.replace(/_/g, " ").toLowerCase() ?? "administrator";

  return (
    <nav className="flex w-[232px] shrink-0 flex-col gap-0.5 bg-sidebar-bg p-3.5">
      <div className="mb-2 flex items-center gap-2.5 px-2 pb-[22px] pt-1.5">
        <WaslaMark size={28} />
        <span className="text-[17px] font-extrabold tracking-tight text-sidebar-ink">Waslak</span>
        <span className="ml-0.5 rounded-[5px] bg-sidebar-active-bg px-1.5 py-0.5 text-[9.5px] font-bold text-sidebar-muted">
          ADMIN
        </span>
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-sidebar-muted transition-colors hover:bg-sidebar-active-bg hover:text-sidebar-ink",
              active && "bg-sidebar-active-bg text-sidebar-active-ink",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto flex items-center gap-2.5 border-t border-sidebar-border pt-3.5">
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-brand text-[13px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-bold text-sidebar-ink">{displayName}</div>
          <div className="truncate text-[11px] capitalize text-sidebar-muted">{role}</div>
        </div>
      </div>
    </nav>
  );
}
