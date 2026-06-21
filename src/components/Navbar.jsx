import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function Navbar() {
  const { address, connect } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleConnect() {
    try { await connect(); navigate("/dashboard"); }
    catch {}
  }

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
          {address ? (
            <>
              <Link to="/profile" className="addr-pill">
                {address.slice(0, 6)}…{address.slice(-4)}
              </Link>
              <Link to="/dashboard" className="btn-cta">Studio</Link>
            </>
          ) : (
            <>
              <button className="btn-ghost" onClick={handleConnect}>Sign In</button>
              <button className="btn-cta"   onClick={handleConnect}>Get Started</button>
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
