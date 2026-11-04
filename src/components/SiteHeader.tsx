import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { LogoIcon } from "@/components/LogoIcon";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

const linkBase = "px-2 py-1 rounded hover:bg-muted transition-colors";

export function SiteHeader() {
  const { pathname } = useLocation();
  const isKanji = pathname.startsWith("/kanji");
  const isVerbs = pathname === "/conjugations" || pathname === "/verbs" || pathname === "/learn";
  const isAbout = pathname === "/about";
  const isProgress = pathname === "/progress";
  const isDiary = pathname.startsWith("/diary");


  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" aria-label="Japanese Practice Tool">
          <LogoIcon className="h-8 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav className="justify-self-end hidden sm:flex items-center gap-1 text-xs">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                linkBase,
                "inline-flex items-center gap-0.5 outline-none cursor-pointer",
                (isVerbs || isKanji) && "bg-muted",
              )}
            >
              Practice
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal pt-1 pb-1">
                Kanji
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/kanji">Read</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kanji/remember">Remember</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kanji/write">Write</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kanji/learn">Learn</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal pt-1 pb-1">
                Conjugation
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/conjugations">Practice</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/learn">Learn</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/diary" className={cn(linkBase, isDiary && "bg-muted")}>
            Diary
          </Link>
          <Link to="/progress" className={cn(linkBase, isProgress && "bg-muted")}>
            Progress
          </Link>

          <Link to="/about" className={cn(linkBase, isAbout && "bg-muted")}>
            About
          </Link>
          <ThemeToggle className="ml-1" />
        </nav>

        {/* Mobile burger */}
        <div className="justify-self-end sm:hidden flex items-center gap-2">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="p-1.5 rounded hover:bg-muted transition-colors outline-none cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Kanji
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/kanji">Read</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kanji/remember">Remember</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kanji/write">Write</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kanji/learn">Learn</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal pt-2">
                Conjugation
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/conjugations">Practice</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/learn">Learn</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/diary">Diary</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>

                <Link to="/progress">Progress</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/about">About</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
