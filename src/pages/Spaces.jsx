import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useAuth, computeLevel } from "../context/AuthContext";
import { hasAccess, getPlan } from "../lib/plans";

const SPACES = [
  {
    id: "commons",
    name: "The Commons",
    description: "Open discussion for all creators and collectors. Share your work, ask questions, and connect with the community.",
    icon: "◈",
    color: "var(--text)",
    requirement: 0,
    requirementLabel: "Open to all",
    members: 2847,
    online: 142,
    tags: ["general", "beginner-friendly", "announcements"],
    feed: [
      { user: "GABC…XYZ9", msg: "Just minted my first NFT on Morianah! The process was so smooth.", time: "2m", type: "text" },
      { user: "GDEF…UVW8", msg: "Anyone else getting Freighter connection drops today?", time: "8m", type: "question" },
      { user: "GHIJ…RST7", msg: "The Chromatic collection just dropped — absolutely stunning.", time: "15m", type: "text" },
      { user: "GKLM…OPQ6", msg: "Tips for setting royalty percentages on your first mint?", time: "23m", type: "question" },
      { user: "GNOP…LMN5", msg: "Welcome to the 50 new artists who joined this week! 🎨", time: "1h", type: "text" },
      { user: "GQRS…IJK4", msg: "Reminder: platform fee drops to 1% for Luminary tier.", time: "2h", type: "announcement" },
    ],
  },
  {
    id: "workshop",
    name: "Creator Workshop",
    description: "Technique-sharing, peer feedback, and tool deep-dives for active creators with skin in the game.",
    icon: "✦",
    color: "var(--orange)",
    requirement: 1,
    requirementLabel: "Own 1+ NFT",
    members: 1204,
    online: 67,
    tags: ["techniques", "tools", "feedback"],
    feed: [
      { user: "GTUV…GHI3", msg: "Sharing my IPFS metadata template — handles attributes, royalties, and provenance.", time: "5m", type: "resource" },
      { user: "GWXY…DEF2", msg: "Is anyone using generative art pipelines with Soroban triggers?", time: "14m", type: "question" },
      { user: "GZAB…ABC1", msg: "The royalty enforcement at contract level is genuinely game-changing.", time: "31m", type: "text" },
      { user: "GCDE…XYZ0", msg: "Workshop session tomorrow 18:00 UTC: on-chain traits and attribute schemas.", time: "2h", type: "announcement" },
      { user: "GFGH…WXY9", msg: "Pro tip: batch your IPFS uploads before minting to cut gas latency.", time: "3h", type: "tip" },
    ],
  },
  {
    id: "lounge",
    name: "Luminary Lounge",
    description: "Exclusive drops, collector meetups, talent scouting, and high-signal alpha for serious participants.",
    icon: "⬡",
    color: "var(--cyan)",
    requirement: 3,
    requirementLabel: "Own 3+ NFTs",
    members: 389,
    online: 28,
    tags: ["alpha", "exclusive-drops", "collector-talk"],
    feed: [
      { user: "GIJK…VWX8", msg: "Private drop tomorrow 18:00 UTC — Luminary access only. Reserve your slot.", time: "12m", type: "announcement" },
      { user: "GJKL…STU7", msg: "Partnering with three new studios this quarter for co-branded collections.", time: "40m", type: "text" },
      { user: "GLMN…PQR6", msg: "Collector AMA with the Chromatic team is confirmed for Friday.", time: "3h", type: "announcement" },
      { user: "GNOP…JKL5", msg: "Secondary volume up 34% WoW. Floor prices holding strong.", time: "5h", type: "alpha" },
    ],
  },
  {
    id: "studio",
    name: "Studio Circle",
    description: "Enterprise-grade integrations, white-label tools, API access, and strategic partnerships.",
    icon: "⟁",
    color: "var(--orange)",
    requirement: 5,
    requirementLabel: "Own 5+ NFTs",
    members: 87,
    online: 11,
    tags: ["enterprise", "api", "white-label"],
    feed: [
      { user: "GPQR…HIJ4", msg: "White-label package v2 is live — check the partner portal for migration guide.", time: "1h", type: "announcement" },
      { user: "GQRS…GHI3", msg: "Batch minting API endpoint now handles 500 tokens/req. 10× throughput.", time: "6h", type: "resource" },
      { user: "GSTU…FGH2", msg: "Reminder: enterprise SLA reviews happen Q1 and Q3. Submit tickets by EOW.", time: "1d", type: "announcement" },
    ],
  },
];

const MSG_TYPE_COLOR = { text: "", question: "msg-question", announcement: "msg-announcement", resource: "msg-resource", tip: "msg-tip", alpha: "msg-alpha" };

export default function Spaces() {
  const { address, tokens, connect, plan, setStatus } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreateGated = hasAccess(plan || "base", "luminary");
  const [activeSpace, setActiveSpace] = useState(null);
  const [msgInput, setMsgInput]       = useState("");

  const nftCount   = tokens.length;
  const authLevel  = computeLevel(user, address, plan);

  // The Commons (requirement: 0) needs Level 1 (signed in)
  // All other spaces need wallet + NFT holdings (Level 3+)
  function canEnter(space) {
    if (space.requirement === 0) return authLevel >= 1;
    return authLevel >= 3 && nftCount >= space.requirement;
  }

  function accessLabel(space) {
    if (space.requirement === 0) {
      if (!user)    return "Sign in to enter";
      return "Enter Space";
    }
    if (!user)    return "Sign in to enter";
    if (!address) return "Connect wallet to enter";
    if (nftCount >= space.requirement) return "Enter Space";
    return `Locked — need ${space.requirement - nftCount} more NFT${space.requirement - nftCount !== 1 ? "s" : ""}`;
  }

  function handleEnterClick(space) {
    if (space.requirement === 0 && !user) {
      navigate("/auth");
      return;
    }
    if (!user) { navigate("/auth"); return; }
    if (!address) { connect().catch(() => {}); return; }
    if (canEnter(space)) setActiveSpace(space);
  }

  if (activeSpace) {
    return <SpaceRoom space={activeSpace} onBack={() => setActiveSpace(null)} msgInput={msgInput} setMsgInput={setMsgInput} />;
  }

  return (
    <div className="page spaces-page">
      <div className="page-header">
        <div>
          <h1>Community Spaces</h1>
          <p className="page-sub">NFT-gated network spaces — your holdings unlock deeper access</p>
        </div>
        <div className="spaces-legend">
          <span className="legend-item"><span className="legend-dot open" />Open</span>
          <span className="legend-item"><span className="legend-dot locked" />Locked</span>
        </div>
      </div>

      <div className="access-banner">
        <span className="access-icon">◎</span>
        <div>
          <strong>{address ? `You own ${nftCount} NFT${nftCount !== 1 ? "s" : ""}` : "Wallet not connected"}</strong>
          <p>{address
            ? nftCount >= 5 ? "Full access — all four Spaces are unlocked for you."
            : nftCount >= 3 ? "Luminary access — mint 2 more NFTs to unlock Studio Circle."
            : nftCount >= 1 ? "Artist access — mint more NFTs to unlock higher-tier Spaces."
            : "Mint your first NFT to unlock Creator Workshop."
            : "Connect your wallet to enter Community Spaces."
          }</p>
        </div>
        {!address && <button className="btn-cta" onClick={async () => { try { await connect(); } catch {} }}>Connect Wallet</button>}
        {address && nftCount < 5 && <button className="btn-outline" onClick={() => navigate("/dashboard")}>Mint NFTs</button>}
      </div>

      {/* ── Create-a-space panel ── */}
      <div className={`create-space-banner${canCreateGated ? "" : " locked"}`}>
        <div className="create-space-info">
          <span className="create-space-icon" style={{ color: canCreateGated ? "var(--cyan)" : "#4f5a72" }}>⬡</span>
          <div>
            <div className="create-space-title">Create a Gated Space</div>
            <div className="create-space-sub">
              {canCreateGated
                ? "You can create token-gated rooms for your community — holders only."
                : `Requires Luminary plan. You're on ${getPlan(plan || "base").name}.`}
            </div>
          </div>
        </div>
        {canCreateGated
          ? <button className="btn-cta" onClick={() => setStatus("Gated Space creation is coming in Phase 2 — watch the Luminary Lounge for the launch.")}>+ Create Space</button>
          : <Link to="/pricing" className="btn-ghost sm">Upgrade to Luminary ↗</Link>
        }
      </div>

      <div className="spaces-grid">
        {SPACES.map((space) => {
          const entered = canEnter(space);
          return (
            <div key={space.id} className={`space-card${entered ? " unlocked" : " locked"}`}>
              {!entered && <div className="space-lock"><span>🔒</span></div>}
              <div className="space-card-top">
                <span className="space-icon" style={{ color: space.color }}>{space.icon}</span>
                <div className="space-meta">
                  <div className="space-name">{space.name}</div>
                  <div className="space-members">{space.members.toLocaleString()} members · {space.online} online</div>
                </div>
                <span className="space-req-badge">{space.requirementLabel}</span>
              </div>
              <p className="space-desc">{space.description}</p>
              <div className="space-tags">
                {space.tags.map((t) => <span key={t} className="space-tag">#{t}</span>)}
              </div>
              <div className="space-preview">
                {space.feed.slice(0, 2).map((m, i) => (
                  <div key={i} className="preview-msg">
                    <span className="preview-user">{m.user}</span>
                    <span className="preview-text">{m.msg.slice(0, 60)}{m.msg.length > 60 ? "…" : ""}</span>
                  </div>
                ))}
              </div>
              <button
                className={canEnter(space) ? "btn-cta" : "btn-ghost"}
                onClick={() => handleEnterClick(space)}
              >
                {accessLabel(space)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpaceRoom({ space, onBack, msgInput, setMsgInput }) {
  const { address } = useWallet();
  const [feed, setFeed] = useState(space.feed);

  function sendMsg(e) {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setFeed((f) => [
      { user: address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "You", msg: msgInput, time: "just now", type: "text" },
      ...f,
    ]);
    setMsgInput("");
  }

  return (
    <div className="page spaces-page">
      <div className="space-room-header">
        <button className="btn-ghost sm" onClick={onBack}>← Back to Spaces</button>
        <div className="space-room-title">
          <span style={{ color: space.color, fontSize: "1.3rem" }}>{space.icon}</span>
          <h2>{space.name}</h2>
          <span className="space-members">{space.online} online</span>
        </div>
        <div className="space-tags" style={{ justifyContent: "flex-end" }}>
          {space.tags.map((t) => <span key={t} className="space-tag">#{t}</span>)}
        </div>
      </div>

      <div className="space-room">
        <div className="room-feed">
          {feed.map((m, i) => (
            <div key={i} className={`room-msg ${MSG_TYPE_COLOR[m.type] || ""}`}>
              <span className="room-user">{m.user}</span>
              <span className="room-text">{m.msg}</span>
              <span className="room-time">{m.time}</span>
            </div>
          ))}
        </div>
        <form className="room-input-row" onSubmit={sendMsg}>
          <input
            value={msgInput}
            onChange={(e) => setMsgInput(e.target.value)}
            placeholder={`Message ${space.name}…`}
          />
          <button type="submit" className="btn-cta">Send</button>
        </form>
      </div>

      <div className="room-sidebar">
        <h4>Members online</h4>
        {space.feed.slice(0, 5).map((m, i) => (
          <div key={i} className="room-member">
            <div className="room-member-avatar" style={{ background: `hsl(${i * 60},60%,45%)` }}>{m.user.slice(0, 2)}</div>
            <span className="mono small">{m.user}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
