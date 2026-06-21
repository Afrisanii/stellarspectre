#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{PlanRegistry, PlanRegistryClient, PlanTier};

fn deploy(e: &Env) -> PlanRegistryClient {
    let admin = Address::generate(e);
    let id    = e.register(PlanRegistry, (admin,));
    PlanRegistryClient::new(e, &id)
}

// ── Default plan ──────────────────────────────────────────────────────────────

#[test]
fn unknown_address_defaults_to_base() {
    let e = Env::default();
    e.mock_all_auths();
    let client = deploy(&e);
    let user   = Address::generate(&e);
    assert_eq!(client.get_plan(&user), PlanTier::Base);
}

// ── set / get round-trip ──────────────────────────────────────────────────────

#[test]
fn set_and_get_round_trip() {
    let e = Env::default();
    e.mock_all_auths();
    let client = deploy(&e);
    let user   = Address::generate(&e);

    client.set_plan(&user, &PlanTier::Artisan);
    assert_eq!(client.get_plan(&user), PlanTier::Artisan);

    client.set_plan(&user, &PlanTier::Luminary);
    assert_eq!(client.get_plan(&user), PlanTier::Luminary);

    client.set_plan(&user, &PlanTier::Studio);
    assert_eq!(client.get_plan(&user), PlanTier::Studio);
}

// ── Platform fee rates ────────────────────────────────────────────────────────

#[test]
fn platform_fee_bps_by_tier() {
    let e = Env::default();
    e.mock_all_auths();
    let client = deploy(&e);
    let user   = Address::generate(&e);

    // Base: 5%
    assert_eq!(client.platform_fee_bps(&user), 500);

    client.set_plan(&user, &PlanTier::Artisan);
    assert_eq!(client.platform_fee_bps(&user), 300);   // 3%

    client.set_plan(&user, &PlanTier::Luminary);
    assert_eq!(client.platform_fee_bps(&user), 200);   // 2%

    client.set_plan(&user, &PlanTier::Studio);
    assert_eq!(client.platform_fee_bps(&user), 100);   // 1%
}

// ── Physical commission rates (paintings & sculptures) ────────────────────────

#[test]
fn physical_commission_bps_by_tier() {
    let e = Env::default();
    e.mock_all_auths();
    let client = deploy(&e);
    let user   = Address::generate(&e);

    assert_eq!(client.physical_commission_bps(&user), 3000);   // Base  30%

    client.set_plan(&user, &PlanTier::Artisan);
    assert_eq!(client.physical_commission_bps(&user), 2900);   // 29%

    client.set_plan(&user, &PlanTier::Luminary);
    assert_eq!(client.physical_commission_bps(&user), 2700);   // 27%

    client.set_plan(&user, &PlanTier::Studio);
    assert_eq!(client.physical_commission_bps(&user), 2600);   // 26%
}

// ── Minting eligibility ───────────────────────────────────────────────────────

#[test]
fn base_cannot_mint_paid_tiers_can() {
    let e = Env::default();
    e.mock_all_auths();
    let client = deploy(&e);
    let user   = Address::generate(&e);

    assert!(!client.can_mint(&user));          // Base → denied

    for tier in [PlanTier::Artisan, PlanTier::Luminary, PlanTier::Studio] {
        client.set_plan(&user, &tier);
        assert!(client.can_mint(&user));       // paid tier → allowed
    }
}

// ── Independent state per address ────────────────────────────────────────────

#[test]
fn different_users_independent_plans() {
    let e = Env::default();
    e.mock_all_auths();
    let client  = deploy(&e);
    let alice   = Address::generate(&e);
    let bob     = Address::generate(&e);
    let charlie = Address::generate(&e);

    client.set_plan(&alice, &PlanTier::Studio);
    client.set_plan(&bob,   &PlanTier::Artisan);
    // charlie not set — defaults to Base

    assert_eq!(client.get_plan(&alice),   PlanTier::Studio);
    assert_eq!(client.get_plan(&bob),     PlanTier::Artisan);
    assert_eq!(client.get_plan(&charlie), PlanTier::Base);

    assert_eq!(client.platform_fee_bps(&alice),   100);
    assert_eq!(client.platform_fee_bps(&bob),     300);
    assert_eq!(client.platform_fee_bps(&charlie), 500);

    assert_eq!(client.physical_commission_bps(&alice),   2600);
    assert_eq!(client.physical_commission_bps(&bob),     2900);
    assert_eq!(client.physical_commission_bps(&charlie), 3000);
}
