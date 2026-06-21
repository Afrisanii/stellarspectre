import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useAuth, computeLevel, getLevelInfo } from "../context/AuthContext";
import NFTCard from "../components/NFTCard";
import { getPerms, getPlan } from "../lib/plans";
import { mint, transfer } from "../stellar";
import { uploadNFT } from "../ipfs";

// ── Mock data ────────────────────────────────────────────────────────────────

// Physical works commission rates per plan
const PHYSICAL_COMMISSION = { base: 30, artisan: 29, luminary: 27, studio: 26 };

const MOCK_COMMISSION_SALES = [
  { title: "Dusk Over Lagos",      type: "Painting",   value: 4200, currency: "USD", date: "May 14, 2026", buyer: "Private collector" },
  { title: "Bronze Sentinel III",  type: "Sculpture",  value: 8500, currency: "USD", date: "May 8, 2026",  buyer: "Gallery Acquisition" },
  { title: "Harmattan Series #2",  type: "Painting",   value: 2800, currency: "USD", date: "Apr 29, 2026", buyer: "Online auction" },
  { title: "Terracotta Vessel I",  type: "Sculpture",  value: 3600, currency: "USD", date: "Apr 11, 2026", buyer: "Private collector" },
];

const DEFAULT_PHYSICAL_WORKS = [
  { id: 1, title: "Dusk Over Lagos",     type: "Painting",  medium: "Oil on canvas", dimensions: '48" × 36"', value: 4200,  status: "sold" },
  { id: 2, title: "Bronze Sentinel III", type: "Sculpture", medium: "Cast bronze",   dimensions: '22" × 14"', value: 8500,  status: "sold" },
  { id: 3, title: "Harmattan Series #2", type: "Painting",  medium: "Acrylic",       dimensions: '30" × 24"', value: 2800,  status: "sold" },
  { id: 4, title: "Terracotta Vessel I", type: "Sculpture", medium: "Fired clay",    dimensions: '18" × 10"', value: 3600,  status: "sold" },
  { id: 5, title: "Sundown Study #7",    type: "Painting",  medium: "Watercolour",   dimensions: '24" × 18"', value: 1800,  status: "listed" },
  { id: 6, title: "Standing Form IV",    type: "Sculpture", medium: "Marble resin",  dimensions: '36" × 12"', value: 12000, status: "listed" },
];

const MOCK_ROYALTIES = [
  { token: "#12", amount: "12.5 XLM",  buyer: "GABC…XYZ9", date: "Today, 14:32" },
  { token: "#9",  amount: "18.75 XLM", buyer: "GDEF…UVW8", date: "Yesterday" },
  { token: "#6",  amount: "6.25 XLM",  buyer: "GHIJ…RST7", date: "3 days ago" },
  { token: "#3",  amount: "25.0 XLM",  buyer: "GKLM…OPQ6", date: "1 week ago" },
];

const MOCK_ACTIVITY_CREATOR = [
  { type: "mint",    msg: "Minted token #12",          time: "2 min ago" },
  { type: "royalty", msg: "Earned 12.5 XLM on #12",   time: "1 hr ago" },
  { type: "mint",    msg: "Minted token #9",           time: "3 hrs ago" },
  { type: "royalty", msg: "Earned 18.75 XLM on #9",   time: "1 day ago" },
  { type: "mint",    msg: "Minted token #6",           time: "2 days ago" },
];

const MOCK_ACTIVITY_COLLECTOR = [
  { type: "acquire",  msg: "Acquired Neon Dreams #1",    time: "1 hr ago" },
  { type: "transfer", msg: "Sent Token #8 to GABC…",     time: "3 hrs ago" },
  { type: "acquire",  msg: "Acquired Digital Void #2",   time: "2 days ago" },
  { type: "acquire",  msg: "Acquired Chromatic #1",      time: "5 days ago" },
  { type: "transfer", msg: "Received Token #3 from G…",  time: "1 week ago" },
];

const DEFAULT_WATCHLIST = [
  { id: 5,  name: "Chromatic #1",   badge: "atlimit",  bg: "linear-gradient(135deg,#1a1a2e,#0f3460)", price: "450 XLM" },
  { id: 10, name: "Aurora Flux #1", badge: "atlimit",  bg: "linear-gradient(135deg,#00d4ff,#0099cc)", price: "520 XLM" },
  { id: 11, name: "Void Walker #1", badge: "luminary", bg: "linear-gradient(135deg,#1a1a2e,#e94560)", price: "610 XLM" },
];

// ── Shared helpers ───────────────────────────────────────────────────────────

function addrGradient(addr) {
  const h1 = parseInt((addr || "GA").slice(2, 4), 36) % 360;
  const h2 = (h1 + 80) % 360;
  return `linear-gradient(135deg, hsl(${h1},65%,38%), hsl(${h2},65%,55%))`;
}

function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon${accent ? " " + accent : ""}`}>{icon}</span>
      <div className={`stat-val${accent ? " " + accent : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function ActivityList({ items }) {
  return (
    <ul className="activity-list">
      {items.map((a, i) => (
        <li key={i} className="activity-item">
          <span className={`activity-dot ${a.type}`} />
          <div>
            <div className="activity-msg">{a.msg}</div>
            <div className="activity-time">{a.time}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Upgrade gate ─────────────────────────────────────────────────────────────

function UpgradeGate({ feature, requiredPlan }) {
  const plan = getPlan(requiredPlan);
  return (
    <div className="upgrade-gate">
      <span className="upgrade-gate-lock">🔒</span>
      <h3>Unlock {feature}</h3>
      <p>This feature requires the <strong style={{ color: plan.color }}>{plan.name}</strong> plan or higher.</p>
      <Link to="/pricing" className="btn-cta">View Plans →</Link>
    </div>
  );
}

// ── Connect prompt ───────────────────────────────────────────────────────────

function ConnectPrompt({ connect, level, levelInfo }) {
  return (
    <div className="page dash-connect">
      <div className="connect-card">
        <span className="connect-icon">◈</span>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", justifyContent: "center" }}>
          <h2>Connect your wallet</h2>
          <span className="badge" style={{ background: `${levelInfo?.color}18`, color: levelInfo?.color, border: `1px solid ${levelInfo?.color}44` }}>
            Level {level} — {levelInfo?.label}
          </span>
        </div>
        <p>Link your Freighter wallet to unlock Level 3 — enabling NFT transfers, your gallery, and the full Dashboard.</p>
        <button className="btn-cta" onClick={async () => { try { await connect(); } catch {} }}>
          Connect Freighter
        </button>
        <p className="connect-hint">
          Don't have Freighter?{" "}
          <a href="https://freighter.app" target="_blank" rel="noreferrer" className="cyan">Download here ↗</a>
        </p>
      </div>
    </div>
  );
}

// ── Role selection ───────────────────────────────────────────────────────────

function RoleSelect({ onSelect }) {
  return (
    <div className="role-select-wrap">
      <div className="role-select">
        <div className="role-select-head">
          <p className="hero-eyebrow">WELCOME TO MORIANAH</p>
          <h2>How will you use <span className="orange">Morianah</span>?</h2>
          <p className="role-select-sub">
            Your designation tailors your entire dashboard experience. You can switch or add roles at any time.
          </p>
        </div>

        <div className="role-cards">
          {/* Creator */}
          <button className="role-card creator-card" onClick={() => onSelect("creator")}>
            <div className="role-card-glow creator-glow" />
            <span className="role-card-icon orange">✦</span>
            <div className="role-card-label">Creator</div>
            <p className="role-card-desc">
              Mint artworks, build your catalogue, track royalties, and grow your on-chain presence.
            </p>
            <ul className="role-card-perks">
              <li><span className="check">✓</span>Mint studio &amp; IPFS upload</li>
              <li><span className="check">✓</span>Royalty tracking &amp; income</li>
              <li><span className="check">✓</span>Sales analytics &amp; reach</li>
              <li><span className="check">✓</span>Creator Spaces access</li>
            </ul>
            <div className="role-card-cta orange">Get Started as Creator →</div>
          </button>

          {/* Collector */}
          <button className="role-card collector-card" onClick={() => onSelect("collector")}>
            <div className="role-card-glow collector-glow" />
            <span className="role-card-icon cyan">◎</span>
            <div className="role-card-label">Collector</div>
            <p className="role-card-desc">
              Curate your portfolio, discover emerging artists, track acquisitions, and manage your NFT holdings.
            </p>
            <ul className="role-card-perks">
              <li><span className="check">✓</span>Portfolio overview &amp; value</li>
              <li><span className="check">✓</span>Watchlist &amp; alerts</li>
              <li><span className="check">✓</span>Acquisition history</li>
              <li><span className="check">✓</span>Collector Spaces access</li>
            </ul>
            <div className="role-card-cta cyan">Get Started as Collector →</div>
          </button>
        </div>

        <div className="role-both">
          <span className="muted">I create and collect — </span>
          <button className="btn-ghost sm" onClick={() => onSelect("both")}>Enable both roles</button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard header ─────────────────────────────────────────────────────────

function DashHeader({ role, activeRole, setActiveRole, onChangeRole, address, tokenCount, plan }) {
  const planInfo = getPlan(plan || "base");

  return (
    <div className="dash-header">
      <div className="dash-title-row">
        <div className={`dash-role-badge ${activeRole}`}>
          <span>{activeRole === "creator" ? "✦" : "◎"}</span>
          <span>{activeRole === "creator" ? "Creator Studio" : "Collector Hub"}</span>
        </div>
        {role === "both" && (
          <div className="role-switcher">
            <button
              className={`role-switch-btn${activeRole === "creator" ? " active creator" : ""}`}
              onClick={() => setActiveRole("creator")}
            >
              ✦ Creator
            </button>
            <button
              className={`role-switch-btn${activeRole === "collector" ? " active collector" : ""}`}
              onClick={() => setActiveRole("collector")}
            >
              ◎ Collector
            </button>
          </div>
        )}
      </div>
      <div className="dash-identity">
        <div className="dash-avatar" style={{ background: addrGradient(address) }}>
          {address.slice(0, 2)}
        </div>
        <div>
          <div className="mono small">{address.slice(0, 8)}…{address.slice(-6)}</div>
          <span className="badge" style={{ background: `${planInfo.color}22`, color: planInfo.color, border: `1px solid ${planInfo.color}55` }}>
            {planInfo.name}
          </span>
        </div>
        <Link to="/pricing" className="btn-ghost sm" style={{ marginLeft: "auto" }}>Upgrade ↗</Link>
        <button className="btn-ghost sm" onClick={onChangeRole} title="Change role">
          ⟳ Change role
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CREATOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function CreatorDashboard({ address, tokens, busy, setBusy, setStatus, refreshTokens, plan }) {
  const [tab, setTab]             = useState("mint");
  const [file, setFile]           = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [nftName, setNftName]     = useState("");
  const [description, setDescription] = useState("");

  const perms = getPerms(plan || "base");
  const planInfo = getPlan(plan || "base");
  const commissionRate = PHYSICAL_COMMISSION[plan || "base"] ?? 30;
  const royaltyTotal = (tokens.length * 12.5).toFixed(1);

  const [physicalWorks, setPhysicalWorks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("morianah_physical") || "null") || DEFAULT_PHYSICAL_WORKS; }
    catch { return DEFAULT_PHYSICAL_WORKS; }
  });
  const [physForm, setPhysForm] = useState({ title: "", type: "Painting", medium: "", dimensions: "", value: "" });
  const [physFormOpen, setPhysFormOpen] = useState(false);

  function savePhysWork(e) {
    e.preventDefault();
    if (!physForm.title || !physForm.value) return;
    const next = [...physicalWorks, { ...physForm, id: Date.now(), value: Number(physForm.value), status: "listed" }];
    setPhysicalWorks(next);
    localStorage.setItem("morianah_physical", JSON.stringify(next));
    setPhysForm({ title: "", type: "Painting", medium: "", dimensions: "", value: "" });
    setPhysFormOpen(false);
  }

  const soldWorks    = physicalWorks.filter((w) => w.status === "sold");
  const totalCommEarned = soldWorks.reduce((s, w) => s + w.value * (commissionRate / 100), 0);

  async function handleMint() {
    if (!file || !nftName) return setStatus("Pick an image and enter a name first");
    setBusy(true);
    try {
      setStatus("Uploading to IPFS…");
      const tokenUri = await uploadNFT({ file, name: nftName, description });
      setStatus("Minting on Stellar…");
      const id = await mint(address, tokenUri);
      setStatus(`Minted token #${id} ✓`);
      setFile(null); setNftName(""); setDescription("");
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }
      await refreshTokens();
    } catch (e) { setStatus(`Mint failed: ${e.message}`); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard label="NFTs Minted"      value={perms.canMint ? tokens.length : "—"}    icon="✦" accent="orange" sub={perms.canMint ? "on Stellar Testnet" : "Artisan+ required"} />
        <StatCard label="Royalties Earned" value={perms.canMint ? `${royaltyTotal} XLM` : "—"} icon="⟁" accent="cyan" sub={perms.canMint ? "auto on every sale" : "Artisan+ required"} />
        <StatCard label="Platform Fee"     value={`${planInfo.fee}%`}                     icon="◈" sub={`${planInfo.name} plan rate`} />
        <StatCard label="Est. Reach"       value={`${tokens.length * 3}+`}                icon="◎" sub="collectors reached" />
      </div>

      <div className="dash-tabs">
        {[
          { id: "mint",      label: "Mint" },
          { id: "creations", label: "My Creations" },
          { id: "physical",  label: "Physical Works" },
          { id: "analytics", label: "Analytics" },
          { id: "royalties", label: "Royalties" },
        ].map((t) => (
          <button key={t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Mint ── */}
      {tab === "mint" && !perms.canMint && (
        <UpgradeGate feature="NFT Minting" requiredPlan="artisan" />
      )}
      {tab === "mint" && perms.canMint && (
        <div className="dash-panel">
          <h3>Create a new NFT</h3>
          <label className="file-drop">
            <span>{file ? `✓  ${file.name}` : "Click to choose an image  (PNG, JPG, GIF, SVG)…"}</span>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files[0];
              if (!f) return;
              setFile(f);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(URL.createObjectURL(f));
            }} />
          </label>
          {previewUrl && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginTop: ".25rem" }}>
              <img src={previewUrl} alt="Preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)", flexShrink: 0 }} />
              <div style={{ fontSize: ".8rem", color: "var(--muted)", paddingTop: ".25rem" }}>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: ".2rem" }}>{file.name}</div>
                <div>{(file.size / 1024).toFixed(0)} KB · {file.type}</div>
                <button className="btn-ghost sm" style={{ marginTop: ".5rem" }} onClick={() => { setFile(null); URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>
                  ✕ Remove
                </button>
              </div>
            </div>
          )}
          <input placeholder="Name *" value={nftName} onChange={(e) => setNftName(e.target.value)} />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="mint-info">
            <span>Royalty: <b className="orange">5%</b> on all secondary sales</span>
            <span>Network: <b className="cyan">Stellar Testnet</b></span>
          </div>
          <button className="btn-cta" disabled={busy} onClick={handleMint}>
            {busy ? "Working…" : "Mint NFT"}
          </button>
        </div>
      )}

      {/* ── My Creations ── */}
      {tab === "creations" && (
        <div className="dash-panel">
          <div className="panel-row">
            <h3>Your minted artworks ({tokens.length})</h3>
            <button className="btn-ghost sm" onClick={refreshTokens}>↺ Refresh</button>
          </div>
          {tokens.length === 0
            ? <p className="empty-msg">No NFTs yet — mint your first one above.</p>
            : <div className="explore-grid sm">
                {tokens.map((t) => <NFTCard key={t.id} nft={{ ...t, name: t.name || `Token #${t.id}` }} />)}
              </div>
          }
        </div>
      )}

      {/* ── Physical Works ── */}
      {tab === "physical" && (
        <div className="dash-panel">
          {/* Commission rate banner */}
          <div className="phys-commission-bar">
            <div className="phys-comm-left">
              <span className="phys-comm-rate" style={{ color: planInfo.color }}>{commissionRate}%</span>
              <div>
                <div className="phys-comm-label">Your commission rate</div>
                <div className="phys-comm-sub">
                  Applies to all paintings &amp; sculptures sold through Morianah.
                  {commissionRate > 26 && (
                    <span> <Link to="/pricing" className="cyan">Upgrade to lower it ↗</Link></span>
                  )}
                </div>
              </div>
            </div>
            <div className="phys-comm-tiers">
              {[
                { id: "base",     label: "Base",     rate: 30 },
                { id: "artisan",  label: "Artisan",  rate: 29 },
                { id: "luminary", label: "Luminary", rate: 27 },
                { id: "studio",   label: "Studio",   rate: 26 },
              ].map((t) => (
                <div key={t.id} className={`phys-tier-pill${(plan || "base") === t.id ? " active" : ""}`}>
                  <span>{t.label}</span>
                  <b>{t.rate}%</b>
                </div>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="phys-stats-row">
            <div className="phys-stat">
              <span className="phys-stat-val orange">{physicalWorks.length}</span>
              <span className="phys-stat-label">Registered works</span>
            </div>
            <div className="phys-stat">
              <span className="phys-stat-val cyan">{soldWorks.length}</span>
              <span className="phys-stat-label">Sold</span>
            </div>
            <div className="phys-stat">
              <span className="phys-stat-val">${totalCommEarned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span className="phys-stat-label">Commission paid ({commissionRate}%)</span>
            </div>
            <div className="phys-stat">
              <span className="phys-stat-val">
                ${soldWorks.reduce((s, w) => s + w.value * (1 - commissionRate / 100), 0)
                    .toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="phys-stat-label">Your net proceeds</span>
            </div>
          </div>

          {/* Works list */}
          <div className="panel-row" style={{ marginTop: "1.5rem" }}>
            <h3>Registered works ({physicalWorks.length})</h3>
            <button className="btn-cta sm" onClick={() => setPhysFormOpen((o) => !o)}>
              {physFormOpen ? "✕ Cancel" : "+ Register artwork"}
            </button>
          </div>

          {/* Add-work form */}
          {physFormOpen && (
            <form className="phys-form" onSubmit={savePhysWork}>
              <div className="form-row two-col">
                <div>
                  <label className="form-label">Title *</label>
                  <input placeholder="Artwork title" value={physForm.title}
                    onChange={(e) => setPhysForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select value={physForm.type}
                    onChange={(e) => setPhysForm((f) => ({ ...f, type: e.target.value }))}>
                    <option>Painting</option>
                    <option>Sculpture</option>
                  </select>
                </div>
              </div>
              <div className="form-row two-col">
                <div>
                  <label className="form-label">Medium</label>
                  <input placeholder='e.g. Oil on canvas' value={physForm.medium}
                    onChange={(e) => setPhysForm((f) => ({ ...f, medium: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Dimensions</label>
                  <input placeholder='e.g. 24" × 18"' value={physForm.dimensions}
                    onChange={(e) => setPhysForm((f) => ({ ...f, dimensions: e.target.value }))} />
                </div>
              </div>
              <div className="form-row two-col">
                <div>
                  <label className="form-label">Sale price (USD) *</label>
                  <input type="number" placeholder="e.g. 3500" min="0" value={physForm.value}
                    onChange={(e) => setPhysForm((f) => ({ ...f, value: e.target.value }))} />
                </div>
                <div className="phys-commission-preview">
                  <div className="phys-prev-label">Commission at {commissionRate}%</div>
                  <div className="phys-prev-val orange">
                    ${physForm.value ? (Number(physForm.value) * commissionRate / 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </div>
                  <div className="phys-prev-label">Your net</div>
                  <div className="phys-prev-val cyan">
                    ${physForm.value ? (Number(physForm.value) * (1 - commissionRate / 100)).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </div>
                </div>
              </div>
              <button type="submit" className="btn-cta" style={{ marginTop: ".5rem" }}>Register artwork</button>
            </form>
          )}

          {/* Works table */}
          <table className="phys-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Medium</th>
                <th>Price (USD)</th>
                <th>Commission ({commissionRate}%)</th>
                <th>Net proceeds</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {physicalWorks.map((w) => {
                const comm = w.value * commissionRate / 100;
                const net  = w.value - comm;
                return (
                  <tr key={w.id}>
                    <td><b>{w.title}</b>{w.dimensions && <span className="muted small"> · {w.dimensions}</span>}</td>
                    <td><span className={`phys-type-badge ${w.type.toLowerCase()}`}>{w.type}</span></td>
                    <td className="muted small">{w.medium || "—"}</td>
                    <td>${w.value.toLocaleString()}</td>
                    <td><span className="orange">${comm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></td>
                    <td><span className="cyan">${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></td>
                    <td><span className={`phys-status ${w.status}`}>{w.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Commission sales history */}
          <div className="panel-row" style={{ marginTop: "2rem" }}>
            <h3>Commission history</h3>
          </div>
          <table className="royalty-table">
            <thead>
              <tr><th>Artwork</th><th>Type</th><th>Sale price</th><th>Commission ({commissionRate}%)</th><th>Net to artist</th><th>Date</th></tr>
            </thead>
            <tbody>
              {MOCK_COMMISSION_SALES.map((s, i) => {
                const comm = s.value * commissionRate / 100;
                return (
                  <tr key={i}>
                    <td><b>{s.title}</b></td>
                    <td><span className={`phys-type-badge ${s.type.toLowerCase()}`}>{s.type}</span></td>
                    <td>${s.value.toLocaleString()}</td>
                    <td><span className="orange">${comm.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></td>
                    <td><span className="cyan">${(s.value - comm).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></td>
                    <td className="muted small">{s.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Analytics ── */}
      {tab === "analytics" && !perms.advancedAnalytics && (
        <UpgradeGate feature="Advanced Analytics" requiredPlan="artisan" />
      )}
      {tab === "analytics" && perms.advancedAnalytics && (
        <div className="dash-panel">
          <h3>Creator Performance</h3>
          <div className="analytics-grid">
            <div className="analytics-main">
              <div className="chart-placeholder">
                <p className="chart-label">Mint &amp; royalty activity (last 30 days)</p>
                <div className="chart-bars">
                  {[20, 45, 30, 75, 55, 90, 40, 65, 35, 80, 60, 50].map((h, i) => (
                    <div key={i} className="chart-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="analytics-stats">
                <div className="astat"><span className="astat-val orange">{tokens.length}</span><span className="astat-label">Total minted</span></div>
                <div className="astat"><span className="astat-val cyan">{royaltyTotal} XLM</span><span className="astat-label">Royalties earned</span></div>
                <div className="astat"><span className="astat-val">{tokens.length > 0 ? "250 XLM" : "—"}</span><span className="astat-label">Avg price</span></div>
              </div>
            </div>
            <div className="analytics-side">
              <h4>Recent Activity</h4>
              <ActivityList items={MOCK_ACTIVITY_CREATOR} />
            </div>
          </div>
        </div>
      )}

      {/* ── Royalties ── */}
      {tab === "royalties" && !perms.autoRoyalties && (
        <UpgradeGate feature="Automatic Royalties" requiredPlan="artisan" />
      )}
      {tab === "royalties" && perms.autoRoyalties && (
        <div className="dash-panel">
          <div className="panel-row">
            <h3>Royalty income</h3>
            <span className="royalty-total">Total: <b className="cyan">{royaltyTotal} XLM</b></span>
          </div>
          <div className="royalty-info-bar">
            Your royalty rate is <b className="orange">5%</b> — enforced at the Soroban contract level on every secondary sale, forever.
          </div>
          {tokens.length === 0
            ? <p className="empty-msg">Mint NFTs to start earning royalties.</p>
            : (
              <table className="royalty-table">
                <thead><tr><th>Token</th><th>Amount</th><th>Buyer</th><th>Date</th></tr></thead>
                <tbody>
                  {MOCK_ROYALTIES.map((r, i) => (
                    <tr key={i}>
                      <td><b>{r.token}</b></td>
                      <td><span className="cyan">{r.amount}</span></td>
                      <td><span className="mono small muted">{r.buyer}</span></td>
                      <td><span className="muted small">{r.date}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTOR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function CollectorDashboard({ address, tokens, busy, setBusy, setStatus, refreshTokens }) {
  const [tab, setTab]           = useState("collection");
  const [transferId, setTransferId] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [watchlist, setWatchlist]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("morianah_watchlist") || "null") || DEFAULT_WATCHLIST; }
    catch { return DEFAULT_WATCHLIST; }
  });

  const portfolioValue = (tokens.length * 285).toFixed(0);
  const tier = tokens.length >= 5 ? "Studio" : tokens.length >= 3 ? "Luminary" : tokens.length >= 1 ? "Artist" : "Free";

  function isValidStellarAddress(addr) {
    return /^G[A-Z2-7]{55}$/.test(addr);
  }

  async function handleTransfer() {
    if (!transferId || !transferTo) return setStatus("Token ID and recipient required");
    if (!isValidStellarAddress(transferTo)) return setStatus("Invalid recipient — must be a Stellar address starting with G (56 characters)");
    setBusy(true);
    try {
      setStatus("Sending…");
      await transfer(address, transferTo, Number(transferId));
      setStatus(`Token #${transferId} sent ✓`);
      setTransferId(""); setTransferTo("");
      await refreshTokens();
    } catch (e) { setStatus(`Transfer failed: ${e.message}`); }
    finally { setBusy(false); }
  }

  function removeWatchlistItem(id) {
    const updated = watchlist.filter((n) => n.id !== id);
    setWatchlist(updated);
    localStorage.setItem("morianah_watchlist", JSON.stringify(updated));
  }

  return (
    <>
      <div className="stat-grid">
        <StatCard label="NFTs Owned"        value={tokens.length}               icon="◎" accent="cyan"   sub="in your collection" />
        <StatCard label="Portfolio Value"   value={`${portfolioValue} XLM`}    icon="⬡" accent="orange" sub="est. at 285 XLM avg" />
        <StatCard label="Artists Collected" value={Math.max(tokens.length, 0)} icon="✦" sub="unique creators" />
        <StatCard label="Access Tier"       value={tier}                        icon="⟁" sub="based on holdings" />
      </div>

      <div className="dash-tabs">
        {[
          { id: "collection", label: "My Collection" },
          { id: "transfer",   label: "Transfer" },
          { id: "watchlist",  label: `Watchlist (${watchlist.length})` },
          { id: "activity",   label: "Activity" },
        ].map((t) => (
          <button key={t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Collection ── */}
      {tab === "collection" && (
        <div className="dash-panel">
          <div className="panel-row">
            <h3>Owned NFTs ({tokens.length})</h3>
            <button className="btn-ghost sm" onClick={refreshTokens}>↺ Refresh</button>
          </div>
          {tokens.length === 0
            ? <p className="empty-msg">No NFTs yet — <Link to="/explore" className="cyan">explore the marketplace ↗</Link></p>
            : <div className="explore-grid sm">
                {tokens.map((t) => <NFTCard key={t.id} nft={{ ...t, name: t.name || `Token #${t.id}`, owner: address }} />)}
              </div>
          }
        </div>
      )}

      {/* ── Transfer ── */}
      {tab === "transfer" && (
        <div className="dash-panel">
          <h3>Transfer an NFT to another address</h3>
          <div className="form-row two-col">
            <div>
              <label className="form-label">Token ID</label>
              <input placeholder="e.g. 7" value={transferId} onChange={(e) => setTransferId(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Recipient address</label>
              <input placeholder="G…" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                style={transferTo && !isValidStellarAddress(transferTo) ? { borderColor: "var(--orange)" } : {}} />
              {transferTo && !isValidStellarAddress(transferTo) && (
                <div style={{ fontSize: ".72rem", color: "var(--orange)", marginTop: ".25rem" }}>
                  Must be a Stellar address starting with G (56 characters)
                </div>
              )}
            </div>
          </div>
          {tokens.length > 0 && (
            <div className="transfer-owned">
              <p className="form-label">Your tokens — click to pre-fill:</p>
              <div className="token-pills">
                {tokens.map((t) => (
                  <button key={t.id} className="token-pill" onClick={() => setTransferId(String(t.id))}>
                    #{t.id}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button className="btn-cta" disabled={busy} onClick={handleTransfer}>
            {busy ? "Sending…" : "Send NFT"}
          </button>
        </div>
      )}

      {/* ── Watchlist ── */}
      {tab === "watchlist" && (
        <div className="dash-panel">
          <div className="panel-row">
            <h3>Watchlist</h3>
            <Link to="/explore" className="btn-ghost sm">+ Browse to add</Link>
          </div>
          {watchlist.length === 0
            ? <p className="empty-msg">Nothing on your watchlist. <Link to="/explore" className="cyan">Explore NFTs ↗</Link></p>
            : (
              <div className="explore-grid sm">
                {watchlist.map((n) => (
                  <div key={n.id} className="watchlist-wrap">
                    <NFTCard nft={n} />
                    <button className="watchlist-remove" onClick={() => removeWatchlistItem(n.id)} title="Remove from watchlist">✕</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── Activity ── */}
      {tab === "activity" && (
        <div className="dash-panel">
          <h3>Acquisition &amp; transfer history</h3>
          <div className="analytics-grid">
            <div className="analytics-main">
              <div className="chart-placeholder">
                <p className="chart-label">Acquisition activity (last 30 days)</p>
                <div className="chart-bars">
                  {[10, 30, 20, 60, 40, 75, 35, 55, 25, 70, 45, 80].map((h, i) => (
                    <div key={i} className="chart-bar collector-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="analytics-stats">
                <div className="astat"><span className="astat-val cyan">{tokens.length}</span><span className="astat-label">Acquired</span></div>
                <div className="astat"><span className="astat-val orange">{portfolioValue} XLM</span><span className="astat-label">Portfolio value</span></div>
                <div className="astat"><span className="astat-val">0</span><span className="astat-label">Sold / sent</span></div>
              </div>
            </div>
            <div className="analytics-side">
              <h4>Recent Activity</h4>
              <ActivityList items={MOCK_ACTIVITY_COLLECTOR} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Root export ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { address, tokens, busy, setBusy, setStatus, refreshTokens, connect, plan } = useWallet();
  const { user } = useAuth();

  const level     = computeLevel(user, address, plan);
  const levelInfo = getLevelInfo(level);

  const [role, setRole] = useState(() => localStorage.getItem("morianah_role"));
  const [activeRole, setActiveRole] = useState(() => {
    const r = localStorage.getItem("morianah_role");
    return r === "both" ? "creator" : r || "creator";
  });

  function selectRole(r) {
    localStorage.setItem("morianah_role", r);
    setRole(r);
    setActiveRole(r === "both" ? "creator" : r);
  }

  function clearRole() {
    localStorage.removeItem("morianah_role");
    setRole(null);
  }

  // Must be signed in first
  if (!user) {
    return (
      <div className="page dash-connect">
        <div className="connect-card">
          <span className="connect-icon">◈</span>
          <h2>Sign in to continue</h2>
          <p>Create a free account or sign in to access your dashboard.</p>
          <Link to="/auth?mode=signup" className="btn-cta">Create Account</Link>
          <p className="connect-hint">Already have an account? <Link to="/auth" className="cyan">Sign in ↗</Link></p>
        </div>
      </div>
    );
  }

  if (!address) return <ConnectPrompt connect={connect} level={level} levelInfo={levelInfo} />;
  if (!role)    return <RoleSelect onSelect={selectRole} />;

  const shared = { address, tokens, busy, setBusy, setStatus, refreshTokens, plan };

  return (
    <div className="page dash-page">
      <DashHeader
        role={role}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        onChangeRole={clearRole}
        address={address}
        tokenCount={tokens.length}
        plan={plan}
      />
      {activeRole === "creator"
        ? <CreatorDashboard {...shared} />
        : <CollectorDashboard {...shared} />
      }
    </div>
  );
}
