import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { MapPin, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export function NavBar() {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
    });
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/neighborhoods", label: "Explore" },
    { href: "/questionnaire", label: "Find My Fit" },
    ...(user ? [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/favorites", label: "Saved" },
    ] : []),
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground text-base">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span>NeighbourFit AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                <span className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  location === l.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}>
                  {l.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-muted-foreground flex items-center gap-1 px-2">
                  <User className="h-3.5 w-3.5" />{user.email}
                </span>
                <button
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button
                    data-testid="link-login"
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                  >
                    Sign in
                  </button>
                </Link>
                <Link href="/register">
                  <button
                    data-testid="link-register"
                    className="px-4 py-1.5 text-sm font-semibold bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Get started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent/50 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-card-border bg-card px-4 pb-4 pt-2">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              <div className={cn(
                "block px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
                location === l.href
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/50"
              )}>
                {l.label}
              </div>
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-card-border">
            {user ? (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 rounded-lg"
                onClick={() => { handleLogout(); setOpen(false); }}
              >
                <LogOut className="h-4 w-4" />Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setOpen(false)}>
                  <button className="w-full px-3 py-2 text-sm text-center text-muted-foreground hover:bg-accent/50 rounded-lg">Sign in</button>
                </Link>
                <Link href="/register" onClick={() => setOpen(false)}>
                  <button className="w-full px-3 py-2 text-sm font-semibold text-center bg-foreground text-background rounded-lg hover:opacity-90">Get started</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
