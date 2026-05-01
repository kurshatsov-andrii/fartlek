import { CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type CalendarEvent,
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/lib/calendar";
import { useApp } from "@/contexts/AppContext";

interface Props {
  event: CalendarEvent;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

// Inline SVG brand icons (monochrome, currentColor) so no extra deps are needed.
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.1S8.69 6 12 6c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.83 3.42 14.6 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12s4.26 9.5 9.5 9.5c5.48 0 9.1-3.85 9.1-9.27 0-.62-.07-1.1-.16-1.53H12z"/>
  </svg>
);

const OutlookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#0078D4" d="M7 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7V4z"/>
    <path fill="#fff" d="M14 8h6v2h-6zM14 11h6v2h-6zM14 14h6v2h-6z"/>
    <path fill="#106EBE" d="M0 6l9-1.5v15L0 18V6z"/>
    <ellipse cx="4.5" cy="12" rx="2.4" ry="3.2" fill="#fff"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
    <path d="M16.37 1.43c0 1.14-.46 2.27-1.22 3.08-.82.88-2.16 1.55-3.27 1.46-.13-1.1.41-2.27 1.18-3.06.84-.86 2.27-1.5 3.31-1.48zM20 17.27c-.55 1.27-.81 1.83-1.52 2.95-.99 1.55-2.39 3.49-4.13 3.51-1.54.02-1.94-1.01-4.04-1-2.1.01-2.54 1.02-4.08 1-1.74-.02-3.06-1.77-4.05-3.32-2.77-4.34-3.06-9.43-1.35-12.14C2.04 6.36 4 5.07 5.84 5.07c1.87 0 3.05 1.03 4.6 1.03 1.5 0 2.42-1.03 4.59-1.03 1.64 0 3.38.9 4.62 2.45-4.06 2.22-3.4 8.02.35 9.75z"/>
  </svg>
);

export function AddToCalendarButton({ event, variant = "outline", className }: Props) {
  const { t } = useApp();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={className}>
          <CalendarPlus className="h-4 w-4" /> {t.events.addToCalendar}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover">
        <DropdownMenuItem asChild>
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <GoogleIcon /> Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={outlookCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <OutlookIcon /> Outlook.com
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadIcs(event)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <AppleIcon /> Apple / iOS (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadIcs(event)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Download className="h-4 w-4" /> .ics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
