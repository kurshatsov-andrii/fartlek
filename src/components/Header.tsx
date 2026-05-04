import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User, LayoutDashboard, Ticket, Shield, Mail, Users, Sparkles } from "lucide-react";
import logoFartlek from "@/assets/logo-fartlek.jpg";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { t } = useApp();
  const { user, isOrganizer, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleEventsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      const el = document.getElementById("events");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    navigate("/#events");
    setTimeout(() => {
      const el = document.getElementById("events");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <img src={logoFartlek} alt="Фартлек" className="h-10 w-10 rounded-full object-cover shadow-glow transition-bounce group-hover:scale-110" />
          <span className="hidden sm:inline font-display text-xl font-bold tracking-tight">
            Фартлек
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <a href="/#events" onClick={handleEventsClick} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base cursor-pointer">{t.nav.events}</a>
          <Link to="/calendar" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">Календар</Link>
          <Link to="/clubs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">Клуби</Link>
          <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">Можливості</Link>
          {user && (
            <>
              <Link to="/profile" className="hidden lg:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.profile}</Link>
              <Link to="/my-events" className="hidden lg:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.myEvents}</Link>
            </>
          )}
          {isOrganizer ? (
            <Link to="/organizer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.dashboard}</Link>
          ) : (
            <Link to="/auth?role=organizer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.organizer}</Link>
          )}
          <Link to="/contacts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-base">{t.nav.contacts}</Link>
        </nav>

        <div className="flex items-center gap-1.5">
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
                  <>
                    <DropdownMenuItem asChild><Link to="/organizer"><LayoutDashboard className="h-4 w-4" />{t.nav.dashboard}</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link to="/clubs/edit"><Users className="h-4 w-4" />Профіль клубу</Link></DropdownMenuItem>
                  </>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild><Link to="/admin"><Shield className="h-4 w-4" />Адмін-панель</Link></DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="md:hidden"><Link to="/clubs"><Users className="h-4 w-4" />Клуби</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden"><Link to="/features"><Sparkles className="h-4 w-4" />Можливості</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="md:hidden"><Link to="/contacts"><Mail className="h-4 w-4" />{t.nav.contacts}</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4" />{t.nav.logout}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <a href="/#events" onClick={handleEventsClick} className="md:hidden text-xs font-medium text-muted-foreground hover:text-foreground transition-base px-1 cursor-pointer">
                {t.nav.events}
              </a>
              <Link to="/clubs" className="md:hidden text-xs font-medium text-muted-foreground hover:text-foreground transition-base px-1">
                Клуби
              </Link>
              <Link to="/features" className="md:hidden text-xs font-medium text-muted-foreground hover:text-foreground transition-base px-1">
                Опції
              </Link>
              <Link to="/contacts" className="md:hidden text-xs font-medium text-muted-foreground hover:text-foreground transition-base px-1">
                {t.nav.contacts}
              </Link>
              <Button asChild size="sm" className="ml-2 hidden sm:inline-flex">
                <Link to="/auth">{t.nav.login}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
