"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("maker");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUp.email({
          email,
          password,
          name,
        });
        if (res.error) {
          toast.error(res.error.message || "Failed to create account");
        } else {
          toast.success("Account created successfully!");
          router.push("/");
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          toast.error(res.error.message || "Invalid email or password");
        } else {
          toast.success("Signed in successfully!");
          router.push("/");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Authentication error";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoName: string) => {
    setEmail(demoEmail);
    setName(demoName);
    setPassword("cbgDemo2026!");
    setLoading(true);
    toast.info(`Signing in as ${demoName}...`);

    try {
      const res = await signIn.email({
        email: demoEmail,
        password: "cbgDemo2026!",
      });
      if (res.error) {
        toast.error(res.error.message || "Failed to sign in");
      } else {
        toast.success(`Signed in as ${demoName}!`);
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Authentication error";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <span className="text-lg font-bold">CBG</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Chartered Brokers Group
          </h1>
          <p className="text-sm text-muted-foreground">
            Digital Payment Voucher System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isSignUp ? "Create an account" : "Sign in"}</CardTitle>
            <CardDescription>
              {isSignUp
                ? "Register a new finance maker/approver account"
                : "Enter your credentials to access the voucher workflow"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        required
                        type="text"
                        placeholder="e.g. A. Fernandes"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="maker">Maker (Creates vouchers)</option>
                      <option value="approver">Approver (Reviews & approves)</option>
                      <option value="admin">Administrator</option>
                      <option value="auditor">Auditor (Read-only)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    required
                    type="email"
                    placeholder="user@charteredbrokers.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Authenticating..." : isSignUp ? "Create Account" : "Sign In"}
              </Button>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in instead"
                  : "Need an account? Register as Maker or Approver"}
              </button>
            </CardFooter>
          </form>
        </Card>

        {/* Quick Demo Credentials */}
        <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Demo Accounts in Neon DB:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleDemoLogin("a.fernandes@charteredbrokers.com", "A. Fernandes")}
            >
              Maker: A. Fernandes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleDemoLogin("s.patel@charteredbrokers.com", "S. Patel")}
            >
              Approver: S. Patel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleDemoLogin("admin@charteredbrokers.com", "Admin")}
            >
              Admin: CBG Admin
            </Button>
          </div>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Secured with Better Auth & PostgreSQL Session Isolation
        </p>
      </div>
    </div>
  );
}
