/**
 * plans.js — single source of truth for plan definitions and the
 * permission matrix. No React, no platform imports — pure data.
 * Import from any page or component that needs to check access rights.
 */

// ── Plan catalogue ───────────────────────────────────────────────────────────

export const PLANS = [
  {
    id:           "base",
    name:         "Base",
    tier:         "Free",
    price:        0,
    priceLabel:   "Free",
    priceSub:     null,
    tagline:      "Start hosting your work.",
    cta:          "Start free",
    ctaStyle:     "ghost",
    color:        "#6b7594",
    borderColor:  "#252d42",
    artworkLimit: 10,
    storage:      "1 GB",
    fee:          5,
    teamSeats:    1,
    highlights: [
      "Up to 10 artworks",
      "Basic gallery",
      "Community access",
      "Public profile",
      "Social sharing",
      "5% platform fee",
    ],
  },
  {
    id:           "artisan",
    name:         "Artisan",
    tier:         "Artisan",
    price:        12,
    priceLabel:   "$12",
    priceSub:     "/mo",
    tagline:      "Connect your wallet. Get analytics. Qualify for minting.",
    cta:          "Upgrade to Artisan",
    ctaStyle:     "orange",
    color:        "#ff5533",
    borderColor:  "#ff5533",
    popular:      true,
    artworkLimit: 100,
    storage:      "10 GB",
    fee:          3,
    teamSeats:    1,
    highlights: [
      "Up to 100 artworks",
      "Custom gallery",
      "Wallet connection",
      "Analytics dashboard",
      "Priority support",
      "3% platform fee",
    ],
  },
  {
    id:           "luminary",
    name:         "Luminary",
    tier:         "Luminary",
    price:        39,
    priceLabel:   "$39",
    priceSub:     "/mo",
    tagline:      "Run gated drops with your own domain.",
    cta:          "Upgrade to Luminary",
    ctaStyle:     "blue",
    color:        "#4f8ef7",
    borderColor:  "#4f8ef7",
    artworkLimit: null,
    storage:      "100 GB",
    fee:          2,
    teamSeats:    3,
    highlights: [
      "Unlimited artworks",
      "Gated spaces",
      "Custom domain",
      "Advanced analytics",
      "Verified badge",
      "2% platform fee",
    ],
  },
  {
    id:           "studio",
    name:         "Studio",
    tier:         "Studio",
    price:        129,
    priceLabel:   "$129",
    priceSub:     "/mo",
    tagline:      "Multi-artist studios. Bulk mint. API.",
    cta:          "Start Studio",
    ctaStyle:     "studio",
    color:        "#9333ea",
    borderColor:  "#9333ea",
    artworkLimit: null,
    storage:      "1 TB",
    fee:          1,
    teamSeats:    null, // unlimited
    highlights: [
      "Multi-artist support",
      "Bulk minting",
      "API access",
      "White-label options",
      "Dedicated manager",
      "1% platform fee",
    ],
  },
];

// ── Permission matrix ────────────────────────────────────────────────────────
// Each key maps to a boolean or value. Used everywhere feature gating is needed.

export const PERMS = {
  base: {
    canConnect:          false,
    canMint:             false,
    bulkMint:            false,
    autoRoyalties:       false,
    customGallery:       false,
    customDomain:        false,
    publicListings:      true,
    featuredDrops:       false,
    privateSales:        false,
    createGatedRooms:    false,
    tokenGatedAccess:    false,
    ticketedEvents:      false,
    basicAnalytics:      true,
    advancedAnalytics:   false,
    apiAccess:           false,
    teamSeats:           1,
    communitySupport:    true,
    prioritySupport:     false,
    dedicatedManager:    false,
    fee:                 5,
    physicalCommission:  30,  // % on paintings & sculptures
  },
  artisan: {
    canConnect:          true,
    canMint:             true,
    bulkMint:            false,
    autoRoyalties:       true,
    customGallery:       true,
    customDomain:        false,
    publicListings:      true,
    featuredDrops:       false,
    privateSales:        true,
    createGatedRooms:    false,
    tokenGatedAccess:    false,
    ticketedEvents:      false,
    basicAnalytics:      true,
    advancedAnalytics:   true,
    apiAccess:           false,
    teamSeats:           1,
    communitySupport:    true,
    prioritySupport:     true,
    dedicatedManager:    false,
    fee:                 3,
    physicalCommission:  29,
  },
  luminary: {
    canConnect:          true,
    canMint:             true,
    bulkMint:            false,
    autoRoyalties:       true,
    customGallery:       true,
    customDomain:        true,
    publicListings:      true,
    featuredDrops:       true,
    privateSales:        true,
    createGatedRooms:    true,
    tokenGatedAccess:    true,
    ticketedEvents:      true,
    basicAnalytics:      true,
    advancedAnalytics:   true,
    apiAccess:           false,
    teamSeats:           3,
    communitySupport:    true,
    prioritySupport:     true,
    dedicatedManager:    false,
    fee:                 2,
    physicalCommission:  27,
  },
  studio: {
    canConnect:          true,
    canMint:             true,
    bulkMint:            true,
    autoRoyalties:       true,
    customGallery:       true,
    customDomain:        true,
    publicListings:      true,
    featuredDrops:       true,
    privateSales:        true,
    createGatedRooms:    true,
    tokenGatedAccess:    true,
    ticketedEvents:      true,
    basicAnalytics:      true,
    advancedAnalytics:   true,
    apiAccess:           true,
    teamSeats:           null, // unlimited
    communitySupport:    true,
    prioritySupport:     true,
    dedicatedManager:    true,
    fee:                 1,
    physicalCommission:  26,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPlan(id)  { return PLANS.find((p) => p.id === id) || PLANS[0]; }
export function getPerms(id) { return PERMS[id]  || PERMS.base; }

/** Returns true if `planId` meets or exceeds `required`. */
export function hasAccess(planId, required) {
  const order = ["base", "artisan", "luminary", "studio"];
  return order.indexOf(planId) >= order.indexOf(required);
}

/** Minimum plan name needed for a feature label. */
export const FEATURE_MIN_PLAN = {
  canMint:           "artisan",
  autoRoyalties:     "artisan",
  advancedAnalytics: "artisan",
  privateSales:      "artisan",
  customGallery:     "artisan",
  createGatedRooms:  "luminary",
  tokenGatedAccess:  "luminary",
  ticketedEvents:    "luminary",
  featuredDrops:     "luminary",
  customDomain:      "luminary",
  bulkMint:          "studio",
  apiAccess:         "studio",
  dedicatedManager:  "studio",
  whiteLabel:        "studio",
};

// ── Add-ons catalogue ────────────────────────────────────────────────────────

export const ADDONS = [
  { id: "storage",     icon: "🗄",  name: "Extra storage",          price: "$5/mo", desc: "Add 50 GB to your account" },
  { id: "featured",    icon: "⭐",  name: "Featured drop",          price: "$99",   desc: "Homepage placement for 7 days" },
  { id: "boosted",     icon: "📈",  name: "Boosted search",         price: "$29/mo",desc: "Appear higher in discovery" },
  { id: "certificate", icon: "🏅",  name: "Custom mint certificate",price: "$49",   desc: "Branded NFT certificates" },
  { id: "gatedpack",   icon: "🔐",  name: "Gated room pack",        price: "$19/mo",desc: "5 additional gated spaces" },
  { id: "teamseat",    icon: "👥",  name: "Team seat",              price: "$15/mo",desc: "Add a collaborator" },
  { id: "whitelabel",  icon: "🎨",  name: "White-label",            price: "$199/mo",desc: "Remove Morianah branding" },
];

// ── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQS = [
  {
    q: "How does minting approval work?",
    a: "Minting is available from the Artisan plan upward. Once you upgrade, your wallet is automatically eligible — no additional approval step is needed. On the Base plan you can browse and showcase, but on-chain minting requires a paid plan.",
  },
  {
    q: "Can I change my plan at any time?",
    a: "Yes. You can upgrade instantly and the new features activate immediately. Downgrades take effect at the end of your current billing period. Your NFTs and on-chain data are never deleted when you downgrade.",
  },
  {
    q: "What happens to my NFTs if I downgrade?",
    a: "Your NFTs remain on-chain permanently — blockchain data cannot be erased. You will lose access to platform features above your new plan (e.g. gated rooms become read-only) but ownership is unaffected.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept Stripe (credit/debit cards), Apple Pay, Google Pay, and WalletConnect for crypto payments. All plans can also be paid annually for a 20% discount.",
  },
  {
    q: "How do automatic royalties work?",
    a: "Royalties are enforced at the Soroban smart contract level — not at the platform level. On Artisan+ plans, a 5% royalty is baked into every token at mint time. Every secondary sale on any compatible marketplace triggers an automatic payout to your wallet.",
  },
  {
    q: "What are Gated Spaces?",
    a: "Gated Spaces are private community rooms where access is controlled by token ownership. Luminary and Studio plan holders can create their own gated rooms and set the token requirements. Anyone holding the required NFT can enter.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "All paid plans include a 14-day money-back guarantee. There is no time-limited trial — the Base plan is free forever and lets you evaluate the platform before committing.",
  },
  {
    q: "What does the transaction fee apply to?",
    a: "The platform fee is deducted from the sale price each time an NFT is sold through Morianah's marketplace. It does not apply to direct wallet-to-wallet transfers or royalty payouts. Studio plan holders pay 1% — the lowest available.",
  },
];
