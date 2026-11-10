"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogIn, LogOut, Menu, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, useSession } from "@/lib/auth-client";
import { DEMO_USER } from "@/lib/constants";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const currentUser = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email,
        role: (session.user as { role?: string }).role || "Maker",
      }
    : {
        name: DEMO_USER.name,
        email: "thasha@charteredbrokers.com",
        role: DEMO_USER.role,
      };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const roleLabel =
    currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="min-w-0">
        <Link href="/" className="flex items-center gap-2 group">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            Payment Voucher System
          </p>
        </Link>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">
          Chartered Brokers Group • Finance &amp; Accounting
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          onClick={() => toast.info("No unread notifications")}
        >
          <Bell className="size-4" />
        </Button>

        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="gap-2 px-2 h-9"
                  size="default"
                />
              }
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="hidden text-left md:block">
                <span className="block text-sm font-medium leading-none">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
              <ChevronDown className="hidden size-3 text-muted-foreground md:block" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="text-sm font-medium">{currentUser.name}</span>
                  <span className="text-xs font-normal text-muted-foreground truncate">
                    {currentUser.email}
                  </span>
                  <div className="flex items-center gap-1 pt-1 text-[11px] font-semibold text-primary">
                    <Shield className="size-3" />
                    <span>Role: {roleLabel}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/vouchers")}>
                <UserRound className="size-4 mr-2" />
                My Vouchers
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="size-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            {!isPending && (
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <LogIn className="size-3.5 mr-1" />
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}