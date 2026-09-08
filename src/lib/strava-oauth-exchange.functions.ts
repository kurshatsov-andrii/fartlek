import { createServerFn } from "@tanstack/react-start";
import { adminClient, getAuthedUser } from "@/lib/server-supabase";

type Input = { code: string };

type Result = {
  success?: boolean;
  error?: string;
  details?: any;
  athlete?: { id?: number; firstname?: string; lastname?: string; profile?: string };
};

export const stravaOauthExchange = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => (input ?? {}) as Input)
  .handler(async ({ data }): Promise<Result> => {
    const clientId = process.env['STRAVA_CLIENT_ID'];
    const clientSecret = process.env['STRAVA_CLIENT_SECRET'];
    if (!clientId || !clientSecret) return { error: "Strava credentials not configured" };

    const authed = await getAuthedUser();
    if (!authed) return { error: "Unauthorized" };
    const userId = authed.user.id;

    const code = data.code;
    if (!code || typeof code !== "string") return { error: "Missing code" };

    const tokenResp = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok) {
      console.error("Strava token error", tokenData);
      return { error: "Strava exchange failed", details: tokenData };
    }

    const athlete = tokenData.athlete ?? {};
    const admin = adminClient();

    const { error: upsertErr } = await admin.from("strava_connections").upsert(
      {
        user_id: userId,
        strava_athlete_id: athlete.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
        scope: tokenData.scope ?? null,
        athlete_firstname: athlete.firstname ?? null,
        athlete_lastname: athlete.lastname ?? null,
        athlete_profile: athlete.profile ?? null,
        athlete_city: athlete.city ?? null,
        athlete_country: athlete.country ?? null,
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) {
      console.error("Upsert error", upsertErr);
      return { error: upsertErr.message };
    }

    return {
      success: true,
      athlete: {
        id: athlete.id,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
      },
    };
  });
