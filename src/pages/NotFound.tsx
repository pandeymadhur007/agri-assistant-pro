import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, MessageCircle, TrendingUp, Sprout } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const suggestions = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chat", label: "AI Assistant", icon: MessageCircle },
  { to: "/market-prices", label: "Market Prices", icon: TrendingUp },
  { to: "/crop-center", label: "Crop Center", icon: Sprout },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEO
        title="Page Not Found (404)"
        description="This Gram AI page could not be found. Jump back to the farming assistant, market prices, crop center or home."
      />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">This page isn't growing here</h1>
        <p className="mt-3 max-w-md text-sm sm:text-base text-muted-foreground">
          The page you're looking for doesn't exist or was moved. Try one of the sections below.
        </p>

        <Button asChild className="mt-6 min-h-11">
          <Link to="/">Back to Home</Link>
        </Button>

        <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3">
          {suggestions.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:bg-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </Link>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default NotFound;
