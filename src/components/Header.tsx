import { Link } from "react-router-dom";
import { Moon, Sun, Globe, Activity, LogOut, User, LayoutDashboard, Ticket, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { lang, setLang, theme, toggleTheme, t } = useApp();
  const { user, isOrganizer, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow transition-bounce group-hover:scale-110">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            Fartlek<span className="text-primary">.</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link to="/#events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.events}</Link>
          {isOrganizer ? (
            <Link to="/organizer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.dashboard}</Link>
          ) : (
            <Link to="/auth?role=organizer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.organizer}</Link>
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={() => setLang(lang === "uk" ? "en" : "uk")} aria-label="Toggle language" className="h-9 w-9">
            <Globe className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold uppercase text-muted-foreground w-6 text-center">{lang}</span>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-9 w-9">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1 h-9 w-9 rounded-full bg-primary/10">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4" />{t.nav.profile}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/my-events"><Ticket className="h-4 w-4" />{t.nav.myEvents}</Link></DropdownMenuItem>
                {isOrganizer && (
                  <DropdownMenuItem asChild><Link to="/organizer"><LayoutDashboard className="h-4 w-4" />{t.nav.dashboard}</Link></DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4" />{t.nav.logout}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-2 hidden sm:inline-flex">
              <Link to="/auth">{t.nav.login}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
