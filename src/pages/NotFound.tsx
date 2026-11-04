import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="page-shell flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-[hsl(var(--accent))]">
          404
        </p>
        <h1 className="font-serif text-4xl md:text-5xl mb-3">This page isn’t here</h1>
        <p className="mb-8 max-w-md text-muted-foreground">
          That address isn’t part of the practice tool. Head home, or jump straight into a session.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
          >
            <Link to="/">Back home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/kanji">Practice kanji</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/conjugations">Practice conjugations</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/diary">Open diary</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
