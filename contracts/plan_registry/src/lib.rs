#![no_std]

//! Plan registry — on-chain source of truth for user plan tiers.
//!
//! Maps each creator address to a PlanTier and exposes fee / commission rates
//! so the marketplace can query them in a single cross-contract call instead of
//! carrying rate tables in every contract.
//!
//! Commission tiers (physical artworks — paintings & sculptures):
//!   Base     → 30 %   (3000 bps)
//!   Artisan  → 29 %   (2900 bps)
//!   Luminary → 27 %   (2700 bps)
//!   Studio   → 26 %   (2600 bps)
//!
//! Platform fee tiers (digital NFT sales):
//!   Base     →  5 %   ( 500 bps)
//!   Artisan  →  3 %   ( 300 bps)
//!   Luminary →  2 %   ( 200 bps)
//!   Studio   →  1 %   ( 100 bps)

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

// ── Plan tier enum ────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum PlanTier {
    Base,
    Artisan,
    Luminary,
    Studio,
}

impl PlanTier {
    /// Platform fee on digital NFT sales (basis points: 100 bps = 1 %).
    pub fn platform_fee_bps(&self) -> u32 {
        match self {
            PlanTier::Base     =>  500,
            PlanTier::Artisan  =>  300,
            PlanTier::Luminary =>  200,
            PlanTier::Studio   =>  100,
        }
    }

    /// Commission on physical artwork sales — paintings and sculptures (bps).
    pub fn physical_commission_bps(&self) -> u32 {
        match self {
            PlanTier::Base     => 3000,
            PlanTier::Artisan  => 2900,
            PlanTier::Luminary => 2700,
            PlanTier::Studio   => 2600,
        }
    }

    /// Returns true if this tier may mint NFTs on-chain.
    pub fn can_mint(&self) -> bool {
        !matches!(self, PlanTier::Base)
    }
}

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Plan(Address),
    Admin,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct PlanRegistry;

#[contractimpl]
impl PlanRegistry {
    /// Deploy and record the admin.
    pub fn __constructor(e: &Env, admin: Address) {
        e.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Upgrade (or downgrade) a user's plan tier.
    /// Requires the user's own auth — in production this call would be made
    /// by the payment processor once a subscription is confirmed.
    pub fn set_plan(e: &Env, user: Address, tier: PlanTier) {
        user.require_auth();
        e.storage().persistent().set(&DataKey::Plan(user.clone()), &tier);
        // Keep record live for ~1 year (≈6 307 200 ledgers at 5 s/ledger).
        e.storage()
            .persistent()
            .extend_ttl(&DataKey::Plan(user), 100, 6_307_200);
    }

    /// Return the plan tier for `user`; defaults to Base if not set.
    pub fn get_plan(e: &Env, user: Address) -> PlanTier {
        e.storage()
            .persistent()
            .get(&DataKey::Plan(user))
            .unwrap_or(PlanTier::Base)
    }

    /// Platform fee for digital NFT sales (bps).
    pub fn platform_fee_bps(e: &Env, user: Address) -> u32 {
        Self::get_plan(e, user).platform_fee_bps()
    }

    /// Commission on physical artwork (painting / sculpture) sales (bps).
    pub fn physical_commission_bps(e: &Env, user: Address) -> u32 {
        Self::get_plan(e, user).physical_commission_bps()
    }

    /// True when the user's plan allows NFT minting.
    pub fn can_mint(e: &Env, user: Address) -> bool {
        Self::get_plan(e, user).can_mint()
    }
}

#[cfg(test)]
mod test;
