/** Relay team identity belongs to the registration, not the account profile. */
export const ticketTeamName = (registration: { team_name?: string | null }) =>
  registration.team_name?.trim() || null;

export const ticketBibName = (
  registration: { team_name?: string | null; athletes?: { full_name?: string | null } | null },
  profileName?: string | null,
) => ticketTeamName(registration) ?? registration.athletes?.full_name ?? profileName ?? null;