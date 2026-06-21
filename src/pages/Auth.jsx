import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, ACCOUNT_LEVELS } from "../context/AuthContext";
import "./Auth.css";

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#0A66C2" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// ── Social provider config ────────────────────────────────────────────────────

const PROVIDERS = [
  { id: "google",         label: "Continue with Google",    Icon: GoogleIcon },
  { id: "twitter",        label: "Continue with Twitter / X", Icon: TwitterIcon },
  { id: "linkedin_oidc",  label: "Continue with LinkedIn",  Icon: LinkedInIcon },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Auth() {
  const { user, signInWithEmail, signUpWithEmail, signInWithProvider } = useAuth();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();

  const [mode, setMode]           = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [busy, setBusy]           = useState(null); // provider id or "email" or null
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError(""); setBusy("email");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        setSuccessMsg("Account created! Check your email to confirm before signing in.");
      } else {
        await signInWithEmail(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleProvider(providerId) {
    setError(""); setBusy(providerId);
    try {
      await signInWithProvider(providerId);
    } catch (err) {
      setError(err.message);
      setBusy(null);
    }
  }

  function switchMode() {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError(""); setSuccessMsg("");
  }

  return (
    <div className="auth-root">

      {/* ── Left: form ── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <Link className="logo auth-logo" to="/">MO<span>RIANAH</span></Link>

          <h2 className="auth-heading">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="auth-sub">
            {mode === "signin"
              ? "Sign in to access your dashboard, wallet, and spaces."
              : "Join the art layer of the new internet — free to start."}
          </p>

          {/* Social providers */}
          <div className="auth-providers">
            {PROVIDERS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className="auth-provider-btn"
                disabled={!!busy}
                onClick={() => handleProvider(id)}
              >
                {busy === id ? <span className="auth-spinner" /> : <Icon />}
                {label}
              </button>
            ))}
          </div>

          <div className="auth-divider"><span>or continue with email</span></div>

          {/* Email / password form */}
          {successMsg ? (
            <div className="auth-success">
              <span>✓</span> {successMsg}
            </div>
          ) : (
            <form className="auth-email-form" onSubmit={handleEmailSubmit}>
              <div className="auth-field">
                <label className="form-label">Email address</label>
                <input
                  type="email" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  disabled={!!busy}
                />
              </div>
              <div className="auth-field">
                <label className="form-label">
                  Password
                  {mode === "signup" && <span className="auth-hint"> (min 8 characters)</span>}
                </label>
                <input
                  type="password" required minLength={8} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  disabled={!!busy}
                />
              </div>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="submit"
                className="btn-cta"
                style={{ width: "100%", justifyContent: "center", marginTop: ".25rem" }}
                disabled={!!busy}
              >
                {busy === "email"
                  ? "Working…"
                  : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          )}

          <p className="auth-switch-row">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}
            {" "}
            <button className="auth-switch-btn" onClick={switchMode}>
              {mode === "signin" ? "Sign up free" : "Sign in"}
            </button>
          </p>

          <div className="auth-wallet-note">
            <span>Have a Stellar wallet? </span>
            <Link to="/dashboard" className="cyan">Connect Freighter on the Dashboard ↗</Link>
          </div>
        </div>
      </div>

      {/* ── Right: account levels ── */}
      <div className="auth-levels-side">
        <div className="auth-levels-inner">
          <p className="hero-eyebrow" style={{ marginBottom: "1.75rem" }}>ACCOUNT LEVELS</p>
          <h2 className="auth-levels-title">
            The more you engage,<br />the more you unlock.
          </h2>
          <p className="auth-levels-sub">
            Your level is determined by your sign-in method, email verification,
            wallet connection, and plan tier — stacked automatically.
          </p>

          <div className="auth-level-list">
            {ACCOUNT_LEVELS.filter((l) => l.level > 0).map((l) => (
              <div key={l.level} className="auth-level-row">
                <div
                  className="auth-level-badge"
                  style={{
                    background: `${l.color}18`,
                    border: `1px solid ${l.color}44`,
                    color: l.color,
                  }}
                >
                  {l.label}
                </div>
                <div className="auth-level-info">
                  <div className="auth-level-req">{l.requirement}</div>
                  <div className="auth-level-perks">{l.perks}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
