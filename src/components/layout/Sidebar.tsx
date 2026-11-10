"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/sidebar-nav";
import { useSession, signOut } from "@/lib/auth-client";
import { ShieldCheck, LogOut, LogIn } from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function isActive(pathname: string, href: string, segmentPrefix: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/vouchers" && pathname.startsWith("/vouchers/new")) return false;
  return pathname.startsWith(segmentPrefix);
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user || {
    name: "Thasha",
    email: "thasha@charteredbrokers.com",
    role: "Maker (Preparer)",
  };

  const userRole = (user as { role?: string }).role || "Finance Maker";

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-semibold tracking-tight">CBG</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              Digital Payment Voucher
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Chartered Brokers Group
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href, item.segmentPrefix);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/60 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-xs font-semibold">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">
                  {userRole}
                </p>
              </div>
            </div>

            {session?.user ? (
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out"
                className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            ) : (
              <Link
                href="/login"
                title="Sign in"
                className="text-muted-foreground hover:text-primary p-1 rounded-md transition-colors"
              >
                <LogIn className="size-4" />
              </Link>
            )}
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3 text-emerald-500" />
            Connected to Neon PostgreSQL
          </p>
        </div>
      </aside>
    </>
  );
}