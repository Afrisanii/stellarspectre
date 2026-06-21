/**
 * How-To Guide — completely standalone page.
 * Zero imports from the platform core (no WalletContext, no stellar.js,
 * no ipfs.js). Only React, react-router-dom Links, and its own CSS.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import "./HowTo.css";

// ─────────────────────────────────────────────────────────────────────────────
// Content definitions — pure data, no platform coupling
// ─────────────────────────────────────────────────────────────────────────────

const CREATOR_STEPS = [
  {
    id: "prereqs",
    num: "01",
    icon: "⬡",
    title: "Install Prerequisites",
    summary: "Wallet, testnet XLM, and IPFS hosting",
    content: [
      { type: "text", text: "Before you can create on Morianah you need Freighter (a Stellar browser wallet) and a funded testnet account. Nothing here costs real money — Stellar Testnet XLM is free." },
      { type: "checklist", items: [
        "Install Freighter from freighter.app (Chrome, Brave, or Firefox)",
        "Open Freighter → Settings → Network → switch to Testnet",
        "Create or import a wallet and copy your G… address",
        "Fund via Stellar Friendbot — paste your address at friendbot.stellar.org",
        "Optional — create a free Pinata account at app.pinata.cloud for IPFS image hosting",
      ]},
      { type: "tip", text: "Testnet XLM has no real-world value. Experiment freely — you can refund at any time via Friendbot." },
    ],
  },
  {
    id: "connect",
    num: "02",
    icon: "◈",
    title: "Connect Your Wallet",
    summary: "Authenticate with Freighter in one click",
    content: [
      { type: "text", text: "Click Get Started or Connect Wallet in the top navigation bar. Freighter will ask you to approve the connection — this is read-only and does not spend any XLM." },
      { type: "steps", items: [
        "Click Get Started in the navbar",
        "Freighter popup opens — review and click Approve",
        "Your truncated address (e.g. GABC12…XYZ9) appears in the navbar",
        "You are redirected to the Dashboard automatically",
      ]},
      { type: "warn", text: "Make sure Freighter shows Testnet in its header before connecting. Signing transactions on Public Network uses real XLM." },
    ],
  },
  {
    id: "role",
    num: "03",
    icon: "✦",
    title: "Choose the Creator Role",
    summary: "Your role shapes your entire dashboard",
    content: [
      { type: "text", text: "On your first Dashboard visit you will see the role selection screen. Choosing Creator gives you the minting studio, royalty tracking, and sales analytics." },
      { type: "steps", items: [
        "Navigate to /dashboard",
        "Click the Creator card (orange ✦)",
        "Your dashboard becomes the Creator Studio",
        "You can add the Collector role at any time via Change role",
      ]},
    ],
  },
  {
    id: "mint",
    num: "04",
    icon: "⟁",
    title: "Mint Your First NFT",
    summary: "Upload → IPFS → Soroban → done",
    content: [
      { type: "text", text: "Every NFT is a token on the Stellar blockchain. Metadata and images are stored on IPFS via Pinata. The entire flow takes about 15 seconds once your wallet is connected." },
      { type: "steps", items: [
        "Go to Dashboard → Mint tab",
        "Click the upload area and pick an image (PNG, JPG, GIF, or SVG)",
        "Enter a Name (required) and Description (optional)",
        "Click Mint NFT",
        "Freighter opens — review the transaction details and click Sign",
        "Wait ~5 seconds for Stellar confirmation",
        "Your NFT appears in My Creations",
      ]},
      { type: "code", label: "src/.env — required for IPFS image uploads", text: "VITE_PINATA_JWT=your_pinata_jwt_here" },
      { type: "tip", text: "Without a Pinata JWT the image upload step will fail with a 401. Get a free JWT from app.pinata.cloud → API Keys." },
    ],
  },
  {
    id: "manage",
    num: "05",
    icon: "◎",
    title: "Manage & Transfer Creations",
    summary: "Your gallery, transfers, and on-chain history",
    content: [
      { type: "text", text: "All your minted tokens live in My Creations. You can send any token to another Stellar address — useful for gifting, selling off-platform, or testing." },
      { type: "steps", items: [
        "Dashboard → My Creations to browse your gallery",
        "Dashboard → Transfer tab (or enable both roles) to send a token",
        "Enter the Token ID and the recipient G… address",
        "Click Send NFT and sign in Freighter",
      ]},
      { type: "warn", text: "Transfers are irreversible on-chain. Always double-check the recipient address before signing." },
    ],
  },
  {
    id: "royalties",
    num: "06",
    icon: "◉",
    title: "Earn & Track Royalties",
    summary: "5 % on every secondary sale, forever",
    content: [
      { type: "text", text: "Every time one of your NFTs is resold on a compatible marketplace, 5 % of the sale price is sent directly to your wallet. This is enforced at the Soroban smart contract level — no intermediary and no way to disable it." },
      { type: "steps", items: [
        "Go to Dashboard → Royalties tab",
        "See a table of per-token royalty payments with buyer addresses and dates",
        "Your total cumulative earnings are shown at the top right",
      ]},
      { type: "tip", text: "The 5 % rate is set at contract deploy time. Changing it requires deploying a new contract version." },
    ],
  },
  {
    id: "spaces",
    num: "07",
    icon: "⬡",
    title: "Join Creator Spaces",
    summary: "NFT-gated community rooms",
    content: [
      { type: "text", text: "Spaces are permissioned network rooms. Your NFT holdings determine your access tier — the more you mint and hold, the deeper you go." },
      { type: "table",
        headers: ["Space", "Requirement", "What's inside"],
        rows: [
          ["The Commons",      "Open to all",   "General discussion, help, announcements"],
          ["Creator Workshop", "Own 1 + NFT",   "Technique sharing, peer feedback, tool reviews"],
          ["Luminary Lounge",  "Own 3 + NFTs",  "Exclusive drops, collector meetups, platform alpha"],
          ["Studio Circle",    "Own 5 + NFTs",  "Enterprise partnerships, API access, white-label tools"],
        ],
      },
      { type: "tip", text: "Your access level updates in real time after each mint or transfer — no manual claim needed." },
    ],
  },
  {
    id: "profile",
    num: "08",
    icon: "◌",
    title: "Set Up Your Public Profile",
    summary: "Display name, bio, and public gallery",
    content: [
      { type: "text", text: "Your profile page at /profile is public and shows your display name, bio, NFT gallery, and activity history. It requires no additional transaction." },
      { type: "steps", items: [
        "Connect your wallet and navigate to /profile",
        "Click Edit Profile",
        "Enter a display name and bio",
        "Click Save — stored locally in your browser",
        "Share your profile link with collectors",
      ]},
    ],
  },
];

const COLLECTOR_STEPS = [
  {
    id: "prereqs",
    num: "01",
    icon: "⬡",
    title: "Install Prerequisites",
    summary: "Wallet and testnet XLM",
    content: [
      { type: "text", text: "To collect on Morianah you only need Freighter and a funded testnet account — no Pinata required." },
      { type: "checklist", items: [
        "Install Freighter from freighter.app (Chrome, Brave, or Firefox)",
        "Open Freighter → Settings → Network → switch to Testnet",
        "Create or import a wallet and copy your G… address",
        "Fund via Stellar Friendbot — paste your address at friendbot.stellar.org",
      ]},
      { type: "tip", text: "Testnet XLM is free and has no real value. You can always refund via Friendbot." },
    ],
  },
  {
    id: "connect",
    num: "02",
    icon: "◈",
    title: "Connect Your Wallet",
    summary: "One-click authentication",
    content: [
      { type: "text", text: "Click Get Started or Connect Wallet in the navigation. Freighter will ask you to approve the connection." },
      { type: "steps", items: [
        "Click Get Started in the navbar",
        "Approve the connection in the Freighter popup",
        "Your truncated address appears in the navbar",
        "You are now authenticated on Morianah",
      ]},
      { type: "warn", text: "Always verify Freighter shows Testnet before signing any transaction." },
    ],
  },
  {
    id: "role",
    num: "03",
    icon: "◎",
    title: "Choose the Collector Role",
    summary: "Portfolio-focused dashboard experience",
    content: [
      { type: "text", text: "On your first Dashboard visit, choose the Collector role to get a portfolio-first layout with collection management, watchlist, and acquisition history." },
      { type: "steps", items: [
        "Navigate to /dashboard",
        "Click the Collector card (cyan ◎)",
        "Your dashboard becomes the Collector Hub",
        "Add the Creator role at any time via Change role",
      ]},
    ],
  },
  {
    id: "explore",
    num: "04",
    icon: "✦",
    title: "Explore the Marketplace",
    summary: "Browse, search, filter, and discover",
    content: [
      { type: "text", text: "The Explore page shows every NFT minted on the platform. Use the toolbar to find exactly what you are looking for." },
      { type: "steps", items: [
        "Click Explore in the navbar",
        "Type in the search bar to filter by name or token ID",
        "Use the badge-tier filter buttons: All / Luminary / Guild / At Limit",
        "Change the sort order: Newest, Oldest, Price High → Low, Price Low → High",
        "Click any card to open the full detail modal",
      ]},
      { type: "tip", text: "Badge tiers reflect a creator's standing on the platform. Luminary pieces come from the most established creators." },
    ],
  },
  {
    id: "acquire",
    num: "05",
    icon: "⟁",
    title: "Acquire NFTs",
    summary: "Peer-to-peer transfers (marketplace in Phase 2)",
    content: [
      { type: "text", text: "NFTs are acquired via direct transfer from creators or other collectors. A marketplace buy / sell flow is planned for Phase 2." },
      { type: "steps", items: [
        "Find an NFT you want on the Explore page",
        "Contact the owner via Community Spaces or off-platform",
        "Share your G… address so they can send the token to you",
        "The owner initiates the transfer and signs it in Freighter",
        "The NFT appears in your Dashboard → My Collection after on-chain confirmation (~5 s)",
      ]},
      { type: "warn", text: "A Phase 2 marketplace contract will add Buy Now and Make Offer flows. Follow The Commons space for the launch announcement." },
    ],
  },
  {
    id: "manage",
    num: "06",
    icon: "◉",
    title: "Manage Your Collection",
    summary: "Gallery, transfers, watchlist, and activity",
    content: [
      { type: "text", text: "Your Collector Hub has four tabs, each focused on a different aspect of managing your holdings." },
      { type: "table",
        headers: ["Tab", "What it does"],
        rows: [
          ["My Collection", "Gallery of every NFT you currently own"],
          ["Transfer",      "Send any owned NFT to another Stellar address"],
          ["Watchlist",     "Pin NFTs you are interested in (stored in your browser)"],
          ["Activity",      "Acquisition history, outbound transfers, and a portfolio chart"],
        ],
      },
    ],
  },
  {
    id: "spaces",
    num: "07",
    icon: "◈",
    title: "Join Community Spaces",
    summary: "NFT-gated rooms that grow with your collection",
    content: [
      { type: "text", text: "Spaces are permissioned community rooms. Your NFT count determines which ones you can enter — access updates automatically as your collection grows." },
      { type: "table",
        headers: ["Space", "Requirement", "What's inside"],
        rows: [
          ["The Commons",      "Open to all",   "General discussion, help, platform news"],
          ["Creator Workshop", "Own 1 + NFT",   "Creator techniques, tool reviews"],
          ["Luminary Lounge",  "Own 3 + NFTs",  "Exclusive drops, collector-only AMAs"],
          ["Studio Circle",    "Own 5 + NFTs",  "Enterprise access, API docs, white-label"],
        ],
      },
      { type: "tip", text: "Your access level is calculated live from your on-chain holdings — no manual claim required." },
    ],
  },
  {
    id: "tiers",
    num: "08",
    icon: "⬡",
    title: "Understanding Collector Tiers",
    summary: "How holdings translate to platform standing",
    content: [
      { type: "text", text: "Your tier is automatically derived from the number of NFTs in your wallet and is displayed as a badge on your profile and in your dashboard." },
      { type: "table",
        headers: ["Tier", "Requirement", "Key Benefits"],
        rows: [
          ["Free",     "0 NFTs",   "The Commons access, basic profile, watchlist"],
          ["Artist",   "1 + NFTs", "Creator Workshop, transfers, activity history"],
          ["Luminary", "3 + NFTs", "Luminary Lounge, analytics, verified badge"],
          ["Studio",   "5 + NFTs", "Studio Circle, all spaces, full platform access"],
        ],
      },
      { type: "tip", text: "Tiers are based on NFTs you currently hold — if you transfer tokens out your tier may decrease." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Block renderers
// ─────────────────────────────────────────────────────────────────────────────

function Block({ block }) {
  switch (block.type) {
    case "text":
      return <p className="ht-text">{block.text}</p>;

    case "checklist":
      return (
        <ul className="ht-checklist">
          {block.items.map((item, i) => (
            <li key={i}><span className="ht-check">✓</span>{item}</li>
          ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="ht-steps">
          {block.items.map((item, i) => (
            <li key={i}><span className="ht-step-num">{i + 1}</span>{item}</li>
          ))}
        </ol>
      );

    case "tip":
      return (
        <div className="ht-callout tip">
          <span className="ht-callout-icon">💡</span>
          <p>{block.text}</p>
        </div>
      );

    case "warn":
      return (
        <div className="ht-callout warn">
          <span className="ht-callout-icon">⚠</span>
          <p>{block.text}</p>
        </div>
      );

    case "code":
      return (
        <div className="ht-code-block">
          {block.label && <div className="ht-code-label">{block.label}</div>}
          <pre><code>{block.text}</code></pre>
        </div>
      );

    case "table":
      return (
        <div className="ht-table-wrap">
          <table className="ht-table">
            <thead>
              <tr>{block.headers.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step card
// ─────────────────────────────────────────────────────────────────────────────

function StepCard({ step, open, onToggle }) {
  return (
    <div className={`ht-step-card${open ? " open" : ""}`} id={step.id}>
      <button className="ht-step-header" onClick={onToggle} aria-expanded={open}>
        <div className="ht-step-left">
          <span className="ht-step-badge">{step.num}</span>
          <div>
            <div className="ht-step-title">{step.title}</div>
            <div className="ht-step-summary">{step.summary}</div>
          </div>
        </div>
        <span className="ht-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="ht-step-body">
          {step.content.map((block, i) => <Block key={i} block={block} />)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Guide panel (one per role)
// ─────────────────────────────────────────────────────────────────────────────

function Guide({ steps, accentClass }) {
  const [openId, setOpenId] = useState(steps[0].id);

  function toggle(id) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="ht-guide">
      {/* sidebar TOC */}
      <nav className="ht-toc">
        <p className="ht-toc-label">In this guide</p>
        {steps.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`ht-toc-item${openId === s.id ? " active " + accentClass : ""}`}
            onClick={(e) => { e.preventDefault(); setOpenId(s.id); }}
          >
            <span className="ht-toc-num">{s.num}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {/* step cards */}
      <div className="ht-steps-list">
        {steps.map((s) => (
          <StepCard
            key={s.id}
            step={s}
            open={openId === s.id}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page root — no platform architecture imports below this point
// ─────────────────────────────────────────────────────────────────────────────

export default function HowTo() {
  const [role, setRole] = useState(null); // null = landing, "creator" | "collector"

  // ── Landing ──────────────────────────────────────────────────────────────
  if (!role) {
    return (
      <div className="ht-root">
        <div className="ht-landing">
          <div className="ht-landing-head">
            <p className="ht-eyebrow">PLATFORM GUIDE</p>
            <h1>How to use <span className="ht-orange">Morianah</span></h1>
            <p className="ht-landing-sub">
              Step-by-step instructions for every feature of the platform.
              Select your role below to get started.
            </p>
          </div>

          <div className="ht-role-pick">
            {/* Creator */}
            <button className="ht-pick-card creator" onClick={() => setRole("creator")}>
              <div className="ht-pick-glow ht-pick-glow-orange" />
              <span className="ht-pick-icon ht-orange">✦</span>
              <div className="ht-pick-label">Creator Guide</div>
              <p className="ht-pick-desc">
                Learn how to mint NFTs, earn royalties, track your analytics,
                and build your on-chain presence.
              </p>
              <ul className="ht-pick-topics">
                <li>Wallet setup &amp; minting</li>
                <li>IPFS &amp; metadata</li>
                <li>Royalty tracking</li>
                <li>Creator Spaces</li>
                <li>Profile &amp; analytics</li>
              </ul>
              <div className="ht-pick-cta ht-orange">Open Creator Guide →</div>
            </button>

            {/* Collector */}
            <button className="ht-pick-card collector" onClick={() => setRole("collector")}>
              <div className="ht-pick-glow ht-pick-glow-cyan" />
              <span className="ht-pick-icon ht-cyan">◎</span>
              <div className="ht-pick-label">Collector Guide</div>
              <p className="ht-pick-desc">
                Learn how to browse the marketplace, build your portfolio,
                manage your watchlist, and access gated Spaces.
              </p>
              <ul className="ht-pick-topics">
                <li>Wallet setup &amp; connecting</li>
                <li>Exploring &amp; acquiring NFTs</li>
                <li>Collection management</li>
                <li>Watchlist &amp; activity</li>
                <li>Collector tiers &amp; Spaces</li>
              </ul>
              <div className="ht-pick-cta ht-cyan">Open Collector Guide →</div>
            </button>
          </div>

          {/* Quick links */}
          <div className="ht-quick-links">
            <span className="ht-muted">Jump to the platform:</span>
            <Link to="/explore"   className="ht-link">Explore ↗</Link>
            <Link to="/spaces"    className="ht-link">Spaces ↗</Link>
            <Link to="/dashboard" className="ht-link">Dashboard ↗</Link>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = role === "creator";

  // ── Guide page ────────────────────────────────────────────────────────────
  return (
    <div className="ht-root">
      {/* Guide header */}
      <div className={`ht-guide-header ${isCreator ? "creator" : "collector"}`}>
        <div className="ht-guide-header-inner">
          <div className="ht-guide-header-left">
            <button className="ht-back" onClick={() => setRole(null)}>← All Guides</button>
            <div className="ht-guide-title-row">
              <span className={`ht-guide-icon ${isCreator ? "ht-orange" : "ht-cyan"}`}>
                {isCreator ? "✦" : "◎"}
              </span>
              <div>
                <h1>{isCreator ? "Creator Guide" : "Collector Guide"}</h1>
                <p className="ht-guide-subtitle">
                  {isCreator
                    ? "Everything you need to mint, earn, and grow on Morianah"
                    : "Everything you need to discover, collect, and engage on Morianah"
                  }
                </p>
              </div>
            </div>
          </div>
          {/* Switch role */}
          <button
            className={`ht-switch-role ${isCreator ? "ht-border-cyan" : "ht-border-orange"}`}
            onClick={() => setRole(isCreator ? "collector" : "creator")}
          >
            Switch to {isCreator ? "◎ Collector" : "✦ Creator"} Guide
          </button>
        </div>
      </div>

      {/* Guide content */}
      <Guide
        steps={isCreator ? CREATOR_STEPS : COLLECTOR_STEPS}
        accentClass={isCreator ? "creator" : "collector"}
      />
    </div>
  );
}
