// @vitest-environment jsdom
import React, { useEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

const mock = vi.hoisted(() => ({
  listener: undefined as undefined | ((event: string, session: unknown) => void),
  roles: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (listener: typeof mock.listener) => {
        mock.listener = listener;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      getSession: async () => ({ data: { session: null } }),
      signOut: vi.fn(),
    },
    from: () => ({ select: () => ({ eq: mock.roles }) }),
    channel: () => ({ on: () => ({ subscribe: vi.fn() }) }),
    removeChannel: vi.fn(),
  },
}));

import { AuthProvider, useAuth } from "./useAuth";

const session = (id = "account-a") => ({ user: { id, email: `${id}@example.test` }, access_token: "test" }) as Session;
function Editor() {
  const [value, setValue] = useState("");
  return <input aria-label="Unsaved draft" value={value} onChange={(event) => setValue(event.target.value)} />;
}
function Page() {
  const { user, loading, isAdmin } = useAuth();
  const [profile, setProfile] = useState("");
  useEffect(() => { setProfile(user?.id ?? ""); }, [user]);
  return <>
    <output aria-label="Loading">{String(loading)}</output>
    <output aria-label="Admin">{String(isAdmin)}</output>
    <input aria-label="Profile draft" value={profile} onChange={(event) => setProfile(event.target.value)} />
    {!loading && user && <Editor />}
  </>;
}
const emit = async (event: string, next: Session | null) => {
  await act(async () => { mock.listener?.(event, next); });
};
const openEditor = async () => {
  render(<AuthProvider><Page /></AuthProvider>);
  await emit("SIGNED_IN", session());
  await screen.findByLabelText("Unsaved draft");
  fireEvent.change(screen.getByLabelText("Unsaved draft"), { target: { value: "Незбережений опис клубу" } });
  fireEvent.change(screen.getByLabelText("Profile draft"), { target: { value: "Незбережене ім’я" } });
};

beforeEach(() => {
  mock.roles.mockReset();
  mock.roles.mockResolvedValue({ data: [{ role: "admin" }], error: null });
});
afterEach(cleanup);

describe("Unsaved forms during background authentication", () => {
  it.each(["SIGNED_IN", "TOKEN_REFRESHED"])("preserves draft and user-dependent hydration on %s", async (event) => {
    await openEditor();
    await emit(event, session());
    await waitFor(() => expect((screen.getByLabelText("Unsaved draft") as HTMLInputElement).value).toBe("Незбережений опис клубу"));
    expect((screen.getByLabelText("Profile draft") as HTMLInputElement).value).toBe("Незбережене ім’я");
  });

  it("keeps editors mounted while background roles are pending", async () => {
    await openEditor();
    mock.roles.mockImplementation(() => new Promise(() => {}));
    await emit("SIGNED_IN", session());
    expect(screen.getByLabelText("Loading").textContent).toBe("false");
    expect((screen.getByLabelText("Unsaved draft") as HTMLInputElement).value).toBe("Незбережений опис клубу");
  });

  it("preserves existing roles on a temporary focus-refresh error", async () => {
    await openEditor();
    mock.roles.mockResolvedValue({ data: null, error: { message: "Temporary network failure" } });
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    expect(screen.getByLabelText("Admin").textContent).toBe("true");
    expect((screen.getByLabelText("Unsaved draft") as HTMLInputElement).value).toBe("Незбережений опис клубу");
  });

  it("clears the previous account roles when switching accounts", async () => {
    await openEditor();
    mock.roles.mockResolvedValue({ data: [{ role: "participant" }], error: null });
    await emit("SIGNED_IN", session("account-b"));
    await waitFor(() => expect(screen.getByLabelText("Loading").textContent).toBe("false"));
    expect(screen.getByLabelText("Admin").textContent).toBe("false");
    expect((screen.getByLabelText("Profile draft") as HTMLInputElement).value).toBe("account-b");
  });

  it("ignores a pending role response after sign-out", async () => {
    await openEditor();
    let resolve: ((value: unknown) => void) | undefined;
    mock.roles.mockImplementation(() => new Promise((done) => { resolve = done; }));
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    await emit("SIGNED_OUT", null);
    await act(async () => { resolve?.({ data: [{ role: "admin" }], error: null }); });
    expect(screen.getByLabelText("Admin").textContent).toBe("false");
    expect(screen.queryByLabelText("Unsaved draft")).toBeNull();
  });
});