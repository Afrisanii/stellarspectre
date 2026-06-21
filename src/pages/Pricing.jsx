import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { PLANS, PERMS, ADDONS, FAQS } from "../lib/plans";
import "./Pricing.css";

const TIERS = ["base", "artisan", "luminary", "studio"];

const FEATURE_SECTIONS = [
  {
    category: "Catalogue",
    rows: [
      { label: "Artworks",  custom: { base: "10", artisan: "100", luminary: "Unlimited", studio: "Unlimited" } },
      { label: "Storage",   custom: { base: "1 GB", artisan: "10 GB", luminary: "100 GB", studio: "1 TB" } },
    ],
  },
  {
    category: "Wallet & On-Chain",
    rows: [
      { label: "Wallet connection",   key: "canConnect" },
      { label: "NFT minting",         key: "canMint" },
      { label: "Automatic royalties", key: "autoRoyalties" },
      { label: "Bulk minting",        key: "bulkMint" },
    ],
  },
  {
    category: "Marketplace",
    rows: [
      { label: "Public listings", key: "publicListings" },
      { label: "Private sales",   key: "privateSales" },
      { label: "Featured drops",  key: "featuredDrops" },
      { label: "Custom gallery",  key: "customGallery" },
      { label: "Custom domain",   key: "customDomain" },
    ],
  },
  {
    category: "Gated Spaces",
    rows: [
      { label: "Create gated rooms",  key: "createGatedRooms" },
      { label: "Token-gated access",  key: "tokenGatedAccess" },
      { label: "Ticketed events",     key: "ticketedEvents" },
    ],
  },
  {
    category: "Analytics & Ops",
    rows: [
      { label: "Basic analytics",    key: "basicAnalytics" },
      { label: "Advanced analytics", key: "advancedAnalytics" },
      { label: "API access",         key: "apiAccess" },
    ],
  },
  {
    category: "Support",
    rows: [
      { label: "Community support", key: "communitySupport" },
      { label: "Priority support",  key: "prioritySupport" },
      { label: "Dedicated manager", key: "dedicatedManager" },
    ],
  },
  {
    category: "Physical Works",
    rows: [
      { label: "Paintings commission",  custom: { base: "30%", artisan: "29%", luminary: "27%", studio: "26%" } },
      { label: "Sculptures commission", custom: { base: "30%", artisan: "29%", luminary: "27%", studio: "26%" } },
      { label: "Physical listing",      key: "publicListings" },
      { label: "Private physical sales", key: "privateSales" },
    ],
  },
  {
    category: "Platform",
    rows: [
      { label: "Transaction fee", custom: { base: "5%", artisan: "3%", luminary: "2%", studio: "1%" } },
      { label: "Team seats",      custom: { base: "1", artisan: "1", luminary: "3", studio: "Unlimited" } },
    ],
  },
];

function CellValue({ val }) {
  if (val === true)  return <span className="pc-check">✓</span>;
  if (val === false) return <span className="pc-dash">—</span>;
  return <span className="pc-text">{val}</span>;
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? " open" : ""}`} onClick={() => setOpen((o) => !o)}>
      <div className="faq-q">
        <span>{q}</span>
        <span className="faq-chevron">{open ? "−" : "+"}</span>
      </div>
      {open && <div className="faq-a">{a}</div>}
    </div>
  );
}

export default function Pricing() {
  const { plan: activePlan, setPlan, address, connect } = useWallet();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [addonToast, setAddonToast] = useState("");

  function showAddonToast() {
    setAddonToast("Add-ons launch with billing in Phase 2 — stay tuned");
    setTimeout(() => setAddonToast(""), 2800);
  }

  const currentPlanId = activePlan || "base";

  async function handleCTA(planId) {
    if (planId === "base") {
      if (!address) {
        try { await connect(); } catch {}
      }
      navigate("/dashboard");
      return;
    }
    setUpgrading(planId);
  }

  function confirmUpgrade() {
    setPlan(upgrading);
    setConfirmed(upgrading);
    setUpgrading(null);
    setTimeout(() => setConfirmed(null), 3500);
  }

  return (
    <div className="pc-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pc-hero">
        <p className="hero-eyebrow">PRICING</p>
        <h1>Plans for every creator</h1>
        <p className="pc-hero-sub">From your first mint to a full studio operation — scale as you grow.</p>
      </div>

      {/* ── Plan cards ───────────────────────────────────────────────────── */}
      <div className="pc-cards">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`pc-card${plan.popular ? " pc-popular" : ""}${isCurrent ? " pc-current" : ""}`}
              style={{ "--plan-color": plan.color, "--plan-border": plan.borderColor }}
            >
              {plan.popular && <div className="pc-popular-badge">Most Popular</div>}
              {isCurrent && <div className="pc-current-label">Current Plan</div>}

              <div className="pc-card-tier">{plan.tier}</div>
              <div className="pc-card-price">
                <span className="pc-price-num">{plan.priceLabel}</span>
                {plan.priceSub && <span className="pc-price-sub">{plan.priceSub}</span>}
              </div>
              <p className="pc-card-tagline">{plan.tagline}</p>

              <ul className="pc-highlights">
                {plan.highlights.map((h, i) => (
                  <li key={i}><span className="pc-hi-check">✓</span>{h}</li>
                ))}
              </ul>

              <button
                className={`pc-cta-btn pc-cta-${plan.ctaStyle}`}
                onClick={() => !isCurrent && handleCTA(plan.id)}
                disabled={isCurrent}
              >
                {isCurrent ? "Current plan" : plan.cta}
              </button>

              <a href="#features" className="pc-see-features">See full features ↓</a>
            </div>
          );
        })}
      </div>

      {/* ── Feature comparison table ─────────────────────────────────────── */}
      <div className="pc-table-wrap" id="features">
        <h2 className="pc-section-title">Full feature comparison</h2>
        <div className="pc-table-scroll">
          <table className="pc-table">
            <thead>
              <tr>
                <th className="pc-th-feature">Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="pc-th-plan" style={{ "--col-color": p.color }}>
                    <span style={{ color: p.color }}>{p.name}</span>
                    {currentPlanId === p.id && <span className="pc-th-current">✓</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_SECTIONS.map((section) => (
                <Fragment key={section.category}>
                  <tr className="pc-section-row">
                    <td colSpan={5}>{section.category}</td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.label} className="pc-feature-row">
                      <td className="pc-feature-label">{row.label}</td>
                      {TIERS.map((tier) => {
                        const val = row.custom ? row.custom[tier] : PERMS[tier][row.key];
                        return (
                          <td key={tier} className={`pc-feature-val${currentPlanId === tier ? " pc-col-active" : ""}`}>
                            <CellValue val={val} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add-ons ──────────────────────────────────────────────────────── */}
      <div className="pc-addons">
        <h2 className="pc-section-title">Add-ons</h2>
        <p className="pc-section-sub">Extend any plan with à-la-carte extras</p>
        <div className="pc-addons-grid">
          {ADDONS.map((addon) => (
            <div key={addon.id} className="pc-addon-card">
              <div className="pc-addon-icon">{addon.icon}</div>
              <div className="pc-addon-name">{addon.name}</div>
              <div className="pc-addon-desc">{addon.desc}</div>
              <div className="pc-addon-footer">
                <span className="pc-addon-price">{addon.price}</span>
                <button className="pc-addon-btn" onClick={showAddonToast}>Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Payment bar ──────────────────────────────────────────────────── */}
      <div className="pc-payment-bar">
        <div className="pc-payment-inner">
          <div className="pc-pay-methods">
            <span className="pc-pay-label">We accept</span>
            <div className="pc-pay-logos">
              <span className="pc-pay-chip stripe">Stripe</span>
              <span className="pc-pay-chip applepay">Apple Pay</span>
              <span className="pc-pay-chip googlepay">Google Pay</span>
              <span className="pc-pay-chip wallet">WalletConnect</span>
            </div>
          </div>
          <div className="pc-pay-guarantees">
            <span>✓ Cancel anytime</span>
            <span>✓ 14-day money-back guarantee</span>
            <span>✓ Annual plans save 20%</span>
          </div>
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <div className="pc-faq">
        <h2 className="pc-section-title">Frequently asked questions</h2>
        <div className="pc-faq-list">
          {FAQS.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </div>

      {/* ── Upgrade modal ────────────────────────────────────────────────── */}
      {upgrading && (() => {
        const p = PLANS.find((x) => x.id === upgrading);
        return (
          <div className="pc-overlay" onClick={() => setUpgrading(null)}>
            <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pc-modal-tier" style={{ color: p.color }}>{p.tier}</div>
              <h3 className="pc-modal-title">Upgrade to {p.name}</h3>
              <div className="pc-modal-price">{p.priceLabel}<span className="pc-price-sub">{p.priceSub}</span></div>
              <p className="pc-modal-desc">{p.tagline}</p>
              <ul className="pc-modal-perks">
                {p.highlights.map((h, i) => <li key={i}><span className="pc-hi-check">✓</span>{h}</li>)}
              </ul>
              <div className="pc-modal-actions">
                <button className={`pc-cta-btn pc-cta-${p.ctaStyle}`} onClick={confirmUpgrade}>
                  Confirm upgrade
                </button>
                <button className="btn-ghost" onClick={() => setUpgrading(null)}>Cancel</button>
              </div>
              <p className="pc-modal-fine">14-day money-back guarantee · Cancel anytime</p>
            </div>
          </div>
        );
      })()}

      {/* ── Addon toast ──────────────────────────────────────────────────── */}
      {addonToast && <div className="pc-toast">{addonToast}</div>}

      {/* ── Confirmed toast ──────────────────────────────────────────────── */}
      {confirmed && (
        <div className="pc-toast">
          ✓ Upgraded to <strong>{PLANS.find((p) => p.id === confirmed)?.name}</strong> — features now active
        </div>
      )}
    </div>
  );
}
