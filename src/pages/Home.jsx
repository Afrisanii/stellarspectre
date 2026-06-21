import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

const ARTIST_FEATS = [
  { icon: "✦", title: "Mint & Showcase", desc: "Turn your digital creations into verified collectibles with our seamless on-chain minting tools." },
  { icon: "◈", title: "Full Ownership",  desc: "Retain complete ownership rights over your work with Stellar blockchain-verified provenance." },
  { icon: "⟁", title: "Earn Royalties",  desc: "Automatically receive royalties on every secondary sale — enforced at the contract level." },
];
const COLLECTOR_FEATS = [
  { icon: "◎", title: "Discover Talent",       desc: "Explore curated galleries and find emerging artists before the world does." },
  { icon: "⬡", title: "Verified Authenticity", desc: "Every piece is Soroban-verified, ensuring genuine ownership and provable rarity." },
  { icon: "⟐", title: "Exclusive Access",      desc: "Unlock gated Spaces, private drops, and direct communication with creators." },
];
const CATALOGUES = [
  { name: "Neon Dreams",  badge: "luminary", count: "12 artworks", bg: "linear-gradient(135deg,#ff5533,#ff9f1c)" },
  { name: "Digital Void", badge: "guild",    count: "15 artworks", bg: "linear-gradient(135deg,#0f2027,#2c5364)" },
  { name: "Chromatic",    badge: "atlimit",  count: "7 artworks",  bg: "linear-gradient(135deg,#1a1a2e,#0f3460)" },
  { name: "Pixel Sage",   badge: "luminary", count: "10 artworks", bg: "linear-gradient(135deg,#134e5e,#71b280)" },
  { name: "Synth",        badge: "guild",    count: "13 artworks", bg: "linear-gradient(135deg,#4a00e0,#8e2de2)" },
];
const TIERS = [
  { label: "Artist",   price: "Free",  sub: null,  highlight: false,
    feats: ["Up to 10 artworks", "Basic gallery", "Community Spaces access", "3% platform fee"] },
  { label: "Artist",   price: "$12",   sub: "/mo", highlight: false,
    feats: ["Up to 100 artworks", "Custom gallery", "Priority support", "2% platform fee", "Advanced dashboard"] },
  { label: "Luminary", price: "$39",   sub: "/mo", highlight: true,
    feats: ["Unlimited artworks", "Premium gallery", "Talent search", "1% platform fee", "Advanced analytics", "Verified badge", "Luminary Spaces"] },
  { label: "Studio",   price: "$129",  sub: "/mo", highlight: false,
    feats: ["Everything in Luminary", "Multi-artist support", "White-label services", "0% platform fee", "Dedicated account manager", "API access", "All Spaces"] },
];

export default function Home() {
  const { address, connect } = useWallet();
  const navigate = useNavigate();

  async function handleCTA() {
    if (address) { navigate("/dashboard"); return; }
    try { await connect(); navigate("/dashboard"); } catch {}
  }

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">THE ART LAYER OF THE NEW INTERNET</p>
          <h1>
            Where digital art<br />
            meets the <span className="orange">spectrum</span>{" "}
            of <span className="cyan">tomorrow</span>.
          </h1>
          <p className="hero-sub">
            A revolutionary platform where artists mint, showcase, and sell their
            digital masterpieces, while collectors discover and own the future of
            creative expression.
          </p>
          <div className="hero-ctas">
            <button className="btn-cta" onClick={handleCTA}>Start Creating</button>
            <Link to="/explore" className="btn-outline">Explore Gallery</Link>
          </div>
          <div className="hero-stats">
            <div className="hstat"><span>12.4k</span>Artworks minted</div>
            <div className="hstat"><span>3.2k</span>Artists</div>
            <div className="hstat"><span>890 XLM</span>Avg. sale price</div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="spectrum-board">
            <div className="sb-row"><span className="sb-tag orange-tag">At Flow &amp; Systems</span><span className="sb-label">Luminary</span></div>
            <div className="sb-row"><span className="sb-tag">Flow Blueprint &amp; beyond</span><span className="sb-label">Onboarding</span></div>
            <div className="sb-row"><span className="sb-tag cyan-tag">Colour Flow</span><span className="sb-label">Email Template</span></div>
            <div className="sb-row"><span className="sb-tag">Design System</span><span className="sb-label">Pricing</span></div>
            <div className="sb-row"><span className="sb-dot">●</span><span className="sb-label muted">4 active sessions</span></div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="features" id="artists">
        <div className="feature-col">
          <h2>For <span className="orange">Artists</span></h2>
          {ARTIST_FEATS.map((f) => (
            <div key={f.title} className="feat-item">
              <span className="feat-icon orange-icon">{f.icon}</span>
              <div><strong>{f.title}</strong><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
        <div className="feature-col" id="collectors">
          <h2>For <span className="cyan">Collectors</span></h2>
          {COLLECTOR_FEATS.map((f) => (
            <div key={f.title} className="feat-item">
              <span className="feat-icon cyan-icon">{f.icon}</span>
              <div><strong>{f.title}</strong><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED CATALOGUES ── */}
      <section className="catalogues">
        <div className="section-head">
          <div>
            <h2>Featured Catalogues</h2>
            <p>Discover exceptional work from our community</p>
          </div>
          <Link to="/explore" className="btn-outline">View All</Link>
        </div>
        <div className="cat-grid">
          {CATALOGUES.map((c) => (
            <Link to="/explore" key={c.name} className="cat-card">
              <div className="cat-thumb" style={{ background: c.bg }} />
              <div className="cat-meta">
                <span className="cat-name">{c.name}</span>
                <span className={`badge ${c.badge}`}>{c.badge === "atlimit" ? "At Limit" : c.badge.charAt(0).toUpperCase() + c.badge.slice(1)}</span>
              </div>
              <div className="cat-count">{c.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SPACES TEASER ── */}
      <section className="spaces-teaser">
        <div className="spaces-teaser-inner">
          <div className="st-text">
            <p className="hero-eyebrow">PERMISSIONED NETWORK SPACES</p>
            <h2>A platform built on <span className="cyan">trust layers</span></h2>
            <p>Your NFT holdings determine your access tier. The more you create and collect, the deeper you go — from open community forums to private studio circles and enterprise APIs.</p>
            <Link to="/spaces" className="btn-cta" style={{ display: "inline-block", marginTop: "1.25rem" }}>Explore Spaces</Link>
          </div>
          <div className="st-cards">
            {[
              { name: "The Commons",       req: "Open to all",  icon: "◈", cls: "" },
              { name: "Creator Workshop",  req: "Own 1+ NFT",   icon: "✦", cls: "" },
              { name: "Luminary Lounge",   req: "Own 3+ NFTs",  icon: "⬡", cls: "cyan" },
              { name: "Studio Circle",     req: "Own 5+ NFTs",  icon: "⟁", cls: "orange" },
            ].map((s) => (
              <div key={s.name} className={`st-card${s.cls ? " " + s.cls : ""}`}>
                <span className="st-icon">{s.icon}</span>
                <div>
                  <div className="st-name">{s.name}</div>
                  <div className="st-req">{s.req}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="section-head centered">
          <h2>Choose Your Spectrum</h2>
          <p>Select the tier that matches your creative ambition</p>
        </div>
        <div className="pricing-grid">
          {TIERS.map((t) => (
            <div key={t.label + t.price} className={`pricing-card${t.highlight ? " highlighted" : ""}`}>
              {t.highlight && <span className="popular-badge">Most Popular</span>}
              <div className="price-tier">{t.label}</div>
              <div className="price-val">{t.price}<span className="price-sub">{t.sub}</span></div>
              <ul className="price-features">
                {t.feats.map((f) => <li key={f}><span className="check">✓</span>{f}</li>)}
              </ul>
              <button className={t.highlight ? "btn-cta" : "btn-outline"} onClick={handleCTA}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <Link className="logo" to="/">MO<span>RIANAH</span></Link>
        <p>The art layer of the new internet. Built on Stellar &amp; Soroban.</p>
        <div className="footer-links">
          <Link to="/explore">Explore</Link>
          <Link to="/spaces">Spaces</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/#pricing">Pricing</Link>
        </div>
      </footer>
    </>
  );
}
