import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import NFTCard from "../components/NFTCard";
import { getOwnedTokens } from "../stellar";

const ACTIVITY = [
  { type: "mint",     label: "Minted",     detail: "Token #12",            time: "2 min ago" },
  { type: "transfer", label: "Transferred", detail: "Token #8 → GABC…XYZ", time: "1 hr ago" },
  { type: "mint",     label: "Minted",     detail: "Token #9",             time: "3 hrs ago" },
  { type: "mint",     label: "Minted",     detail: "Token #6",             time: "2 days ago" },
  { type: "transfer", label: "Received",   detail: "Token #3 from GDEF…", time: "5 days ago" },
];

function addrGradient(addr) {
  const h1 = parseInt((addr || "GA").slice(2, 4), 36) % 360;
  const h2 = (h1 + 80) % 360;
  return `linear-gradient(135deg, hsl(${h1},65%,38%), hsl(${h2},65%,55%))`;
}

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : "";
}

export default function Profile() {
  const { addr: paramAddr } = useParams();
  const { address: connAddr, tokens: ownTokens, connect } = useWallet();
  const navigate = useNavigate();

  const viewAddr = paramAddr || connAddr;
  const isOwn    = !paramAddr || paramAddr === connAddr;

  const [tokens, setTokens]   = useState(isOwn ? ownTokens : []);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem("morianah_profile") || "{}"); }
    catch { return {}; }
  });
  const [draftName, setDraftName] = useState(profile.name || "");
  const [draftBio,  setDraftBio]  = useState(profile.bio  || "");

  useEffect(() => {
    if (!isOwn && viewAddr) {
      setLoading(true);
      getOwnedTokens(viewAddr)
        .then(setTokens).catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setTokens(ownTokens);
    }
  }, [viewAddr, isOwn, ownTokens]);

  function saveProfile() {
    const p = { name: draftName, bio: draftBio };
    setProfile(p);
    localStorage.setItem("morianah_profile", JSON.stringify(p));
    setEditing(false);
  }

  if (!viewAddr) {
    return (
      <div className="page profile-connect">
        <div className="connect-card">
          <span className="connect-icon">◎</span>
          <h2>No wallet connected</h2>
          <p>Connect your Freighter wallet to view your profile.</p>
          <button className="btn-cta" onClick={async () => { try { await connect(); } catch {} }}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const tier = tokens.length >= 5 ? "Studio" : tokens.length >= 3 ? "Luminary" : tokens.length >= 1 ? "Artist" : "Free";
  const tierClass = tokens.length >= 3 ? "luminary" : tokens.length >= 1 ? "guild" : "";

  return (
    <div className="page profile-page">
      {/* profile header */}
      <div className="profile-header">
        <div className="profile-avatar" style={{ background: addrGradient(viewAddr) }}>
          {viewAddr.slice(0, 2)}
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <h1>{profile.name || shortAddr(viewAddr)}</h1>
            {tierClass && <span className={`badge ${tierClass}`}>{tier}</span>}
          </div>
          <p className="mono muted small">{shortAddr(viewAddr)}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-stats">
            <div className="pstat"><b>{tokens.length}</b><span>NFTs</span></div>
            <div className="pstat"><b>{ACTIVITY.length}</b><span>Actions</span></div>
            <div className="pstat"><b>{(tokens.length * 12.5).toFixed(0)} XLM</b><span>Royalties</span></div>
          </div>
        </div>
        {isOwn && (
          <div className="profile-actions">
            <button className="btn-ghost" onClick={() => { setDraftName(profile.name||""); setDraftBio(profile.bio||""); setEditing(true); }}>
              Edit Profile
            </button>
            <Link to="/dashboard" className="btn-cta">Open Studio</Link>
          </div>
        )}
      </div>

      {/* edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditing(false)}>✕</button>
            <h3 style={{ marginBottom: "1rem" }}>Edit Profile</h3>
            <label className="form-label">Display Name</label>
            <input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Your name or alias" />
            <label className="form-label" style={{ marginTop: ".75rem" }}>Bio</label>
            <textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} placeholder="Tell the community about yourself…" />
            <div className="modal-actions">
              <button className="btn-cta" onClick={saveProfile}>Save</button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-body">
        {/* NFT gallery */}
        <div className="profile-gallery">
          <div className="panel-row">
            <h3>NFT Collection{loading ? " (loading…)" : ` (${tokens.length})`}</h3>
          </div>
          {tokens.length === 0 && !loading
            ? <p className="empty-msg">{isOwn ? "No NFTs yet — " : "This address hasn't minted any NFTs yet."}{isOwn && <Link to="/dashboard" className="cyan">mint your first one ↗</Link>}</p>
            : <div className="explore-grid sm">
                {tokens.map((t) => <NFTCard key={t.id} nft={{ ...t, name: `Token #${t.id}`, owner: viewAddr }} />)}
              </div>
          }
        </div>

        {/* activity */}
        {isOwn && (
          <div className="profile-activity">
            <h3>Activity</h3>
            <ul className="activity-list">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="activity-item">
                  <span className={`activity-dot ${a.type}`} />
                  <div>
                    <div className="activity-msg"><b>{a.label}</b> {a.detail}</div>
                    <div className="activity-time">{a.time}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
