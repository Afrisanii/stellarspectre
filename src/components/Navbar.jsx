import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useAuth, computeLevel, getLevelInfo } from "../context/AuthContext";

export default function Navbar() {
  const { address, connect }            = useWallet();
  const { user, signOut }               = useAuth();
  const [menuOpen, setMenuOpen]         = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate    = useNavigate();
  const userMenuRef = useRef(null);

  const plan      = localStorage.getItem("morianah_plan") || "base";
  const level     = computeLevel(user, address, plan);
  const levelInfo = getLevelInfo(level);

  useEffect(() => {
    function handler(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleConnect() {
    try { await connect(); navigate("/dashboard"); } catch {}
  }

  async function handleSignOut() {
    setUserMenuOpen(false);
    await signOut();
    navigate("/");
  }

  const avatarUrl   = user?.user_metadata?.avatar_url;
  const userInitial = (user?.email || user?.user_metadata?.full_name || "U")[0].toUpperCase();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link className="logo" to="/">MO<span>RIANAH</span></Link>

        <ul className={`nav-links${menuOpen ? " open" : ""}`}>
          <li><NavLink to="/explore"   onClick={() => setMenuOpen(false)}>Explore</NavLink></li>
          <li><NavLink to="/spaces"    onClick={() => setMenuOpen(false)}>Spaces</NavLink></li>
          <li><NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink></li>
          <li><NavLink to="/pricing"   onClick={() => setMenuOpen(false)}>Pricing</NavLink></li>
          <li><NavLink to="/how-to"    onClick={() => setMenuOpen(false)}>Guide</NavLink></li>
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              {/* Account level chip */}
              <span
                className="nav-level-chip"
                style={{
                  color: levelInfo.color,
                  border: `1px solid ${levelInfo.color}44`,
                  background: `${levelInfo.color}12`,
                }}
              >
                {levelInfo.label}
              </span>

              {/* Wallet address or connect nudge */}
              {address ? (
                <Link to="/profile" className="addr-pill">
                  {address.slice(0, 6)}…{address.slice(-4)}
                </Link>
              ) : (
                <button className="btn-ghost" onClick={handleConnect}>
                  Connect Wallet
                </button>
              )}

              <Link to="/dashboard" className="btn-cta">Studio</Link>

              {/* Avatar + dropdown */}
              <div className="nav-user-wrap" ref={userMenuRef}>
                <button
                  className="nav-avatar"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
                    : <span>{userInitial}</span>}
                </button>

                {userMenuOpen && (
                  <div className="nav-user-dropdown">
                    <div className="nav-user-info">
                      <div className="nav-user-email">
                        {user.email || user.user_metadata?.full_name || "Account"}
                      </div>
                      <div className="nav-user-level" style={{ color: levelInfo.color }}>
                        Level {level} — {levelInfo.label}
                      </div>
                    </div>
                    <div className="nav-dropdown-divider" />
                    <Link to="/profile"   className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>Profile</Link>
                    <Link to="/dashboard" className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>Dashboard</Link>
                    <Link to="/pricing"   className="nav-dropdown-item" onClick={() => setUserMenuOpen(false)}>Upgrade plan</Link>
                    <div className="nav-dropdown-divider" />
                    <button className="nav-dropdown-item nav-signout" onClick={handleSignOut}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="btn-ghost">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-cta">Get Started</Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
