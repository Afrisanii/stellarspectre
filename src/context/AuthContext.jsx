import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const Ctx = createContext(null);

// ── Account level definitions ────────────────────────────────────────────────
// Level 0  Guest      Not signed in
// Level 1  Member     Any sign-in (email unverified OK)
// Level 2  Verified   Email confirmed OR social login
// Level 3  Connected  Verified + Freighter wallet linked
// Level 4  Active     Connected + Artisan/Luminary/Studio plan

export const ACCOUNT_LEVELS = [
  { level: 0, label: "Guest",     color: "#6b7594", requirement: "Not signed in",                  perks: "Browse Explore & Home" },
  { level: 1, label: "Member",    color: "#6b7594", requirement: "Any sign-in method",              perks: "Dashboard access, cloud watchlist, basic profile" },
  { level: 2, label: "Verified",  color: "#4f8ef7", requirement: "Confirmed email or social login", perks: "Community Spaces, notifications, enhanced profile" },
  { level: 3, label: "Connected", color: "#00d4ff", requirement: "Verified + Freighter wallet",     perks: "NFT gallery, transfers, full Dashboard" },
  { level: 4, label: "Active",    color: "#ff5533", requirement: "Connected + Artisan+ plan",       perks: "Minting, royalties, analytics, gated Spaces" },
];

const PLAN_ORDER = ["base", "artisan", "luminary", "studio"];

export function computeLevel(user, address, plan) {
  if (!user) return 0;
  // Social providers are already verified by the OAuth provider
  const isVerified =
    user.app_metadata?.provider !== "email" || !!user.email_confirmed_at;
  if (!isVerified) return 1;
  if (!address) return 2;
  const hasPaidPlan = PLAN_ORDER.indexOf(plan || "base") >= 1;
  return hasPaidPlan ? 4 : 3;
}

export function getLevelInfo(level) {
  return ACCOUNT_LEVELS[level] ?? ACCOUNT_LEVELS[0];
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUpWithEmail(email, password) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signInWithProvider(provider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Ctx.Provider value={{
      user, session, loading,
      signInWithEmail, signUpWithEmail, signInWithProvider, signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
