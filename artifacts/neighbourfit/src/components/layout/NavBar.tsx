import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MapPin, LogOut, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export function NavBar() {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
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
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-primary text-lg">
            <MapPin className="h-5 w-5" />
            <span>NeighbourFit AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href}>
                <span className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
                  {l.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />{user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4 mr-1" />Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm" data-testid="link-login">Sign in</Button></Link>
                <Link href="/register"><Button size="sm" data-testid="link-register">Get started</Button></Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-muted-foreground" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 pb-4 pt-2">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              <div className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md cursor-pointer">{l.label}</div>
            </Link>
          ))}
          <div className="mt-2 pt-2 border-t border-border">
            {user ? (
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { handleLogout(); setOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" />Logout
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full">Sign in</Button></Link>
                <Link href="/register" onClick={() => setOpen(false)}><Button size="sm" className="w-full">Get started</Button></Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
