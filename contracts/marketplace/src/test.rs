#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, Address, Env, String};

use crate::{ArtworkKind, Marketplace, MarketplaceClient};
use nft_collection::{NFTCollection, NFTCollectionClient};

// ── Shared helpers ────────────────────────────────────────────────────────────

/// Deploy a Stellar Asset Contract and return its address + SAC client (for minting).
fn create_token(e: &Env, admin: &Address) -> (Address, token::StellarAssetClient) {
    let sac  = e.register_stellar_asset_contract_v2(admin.clone());
    let addr = sac.address();
    (addr.clone(), token::StellarAssetClient::new(e, &addr))
}

/// Deploy the Marketplace; returns (admin, fee_collector, marketplace_client).
fn deploy_market(e: &Env) -> (Address, Address, MarketplaceClient) {
    let admin         = Address::generate(e);
    let fee_collector = Address::generate(e);
    let id = e.register(Marketplace, (admin.clone(), fee_collector.clone()));
    (admin, fee_collector, MarketplaceClient::new(e, &id))
}

/// Deploy the NFTCollection; returns (owner, nft_client).
fn deploy_nft(e: &Env) -> (Address, NFTCollectionClient) {
    let owner    = Address::generate(e);
    let receiver = Address::generate(e);
    let id = e.register(
        NFTCollection,
        (
            owner.clone(),
            String::from_str(e, "ipfs://"),
            String::from_str(e, "Morianah"),
            String::from_str(e, "MOR"),
            500u32,
            receiver,
        ),
    );
    (owner, NFTCollectionClient::new(e, &id))
}

// ══════════════════════════════════════════════════════════════════════════════
// PHYSICAL ARTWORK TESTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Base tier: 30 % commission ────────────────────────────────────────────────

#[test]
fn base_tier_painting_30_pct() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller = Address::generate(&e);
    let buyer  = Address::generate(&e);
    sac.mint(&buyer, &10_000);

    let id = market.list_physical(
        &seller,
        &String::from_str(&e, "Dusk Over Lagos"),
        &ArtworkKind::Painting,
        &4_200,
        &3000,   // 30 %
    );

    assert!(!market.get_physical_listing(&id).sold);

    market.buy_physical(&buyer, &id, &token_addr);

    // commission = 30% × 4200 = 1260;  net = 2940
    let tok = token::Client::new(&e, &token_addr);
    assert_eq!(tok.balance(&fee_collector), 1_260);
    assert_eq!(tok.balance(&seller),        2_940);
    assert_eq!(tok.balance(&buyer),         5_800);   // 10000 − 4200

    assert!(market.get_physical_listing(&id).sold);
}

// ── Artisan tier: 29 % commission ────────────────────────────────────────────

#[test]
fn artisan_tier_painting_29_pct() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller = Address::generate(&e);
    let buyer  = Address::generate(&e);
    sac.mint(&buyer, &10_000);

    let id = market.list_physical(
        &seller,
        &String::from_str(&e, "Harmattan Series #2"),
        &ArtworkKind::Painting,
        &2_800,
        &2900,   // 29 %
    );
    market.buy_physical(&buyer, &id, &token_addr);

    // 29% × 2800 = 812;  net = 1988
    let tok = token::Client::new(&e, &token_addr);
    assert_eq!(tok.balance(&fee_collector), 812);
    assert_eq!(tok.balance(&seller),        1_988);
}

// ── Luminary tier: 27 % commission ───────────────────────────────────────────

#[test]
fn luminary_tier_sculpture_27_pct() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller = Address::generate(&e);
    let buyer  = Address::generate(&e);
    sac.mint(&buyer, &10_000);

    let id = market.list_physical(
        &seller,
        &String::from_str(&e, "Terracotta Vessel I"),
        &ArtworkKind::Sculpture,
        &3_600,
        &2700,   // 27 %
    );
    market.buy_physical(&buyer, &id, &token_addr);

    // 27% × 3600 = 972;  net = 2628
    let tok = token::Client::new(&e, &token_addr);
    assert_eq!(tok.balance(&fee_collector), 972);
    assert_eq!(tok.balance(&seller),        2_628);
}

// ── Studio tier: 26 % commission ─────────────────────────────────────────────

#[test]
fn studio_tier_sculpture_26_pct() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller = Address::generate(&e);
    let buyer  = Address::generate(&e);
    sac.mint(&buyer, &20_000);

    let id = market.list_physical(
        &seller,
        &String::from_str(&e, "Bronze Sentinel III"),
        &ArtworkKind::Sculpture,
        &8_500,
        &2600,   // 26 %
    );
    market.buy_physical(&buyer, &id, &token_addr);

    // 26% × 8500 = 2210;  net = 6290
    let tok = token::Client::new(&e, &token_addr);
    assert_eq!(tok.balance(&fee_collector), 2_210);
    assert_eq!(tok.balance(&seller),        6_290);
}

// ── Commission sum always equals sale price ───────────────────────────────────

#[test]
fn commission_plus_net_equals_price() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller = Address::generate(&e);
    let buyer  = Address::generate(&e);
    let price  = 7_777i128;
    sac.mint(&buyer, &price);

    market.list_physical(
        &seller,
        &String::from_str(&e, "Study in Blue"),
        &ArtworkKind::Painting,
        &price,
        &2700,
    );
    market.buy_physical(&buyer, &0u32, &token_addr);

    let tok       = token::Client::new(&e, &token_addr);
    let collected = tok.balance(&fee_collector);
    let received  = tok.balance(&seller);
    assert_eq!(collected + received, price);
    assert_eq!(tok.balance(&buyer), 0);
}

// ── Guard: commission_bps below 26 % rejected ────────────────────────────────

#[test]
#[should_panic(expected = "commission_bps out of range")]
fn rejects_commission_below_26_pct() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, market) = deploy_market(&e);
    let seller = Address::generate(&e);
    market.list_physical(
        &seller,
        &String::from_str(&e, "Underpriced"),
        &ArtworkKind::Painting,
        &1_000,
        &2500,   // 25 % — rejected
    );
}

// ── Guard: commission_bps above 30 % rejected ────────────────────────────────

#[test]
#[should_panic(expected = "commission_bps out of range")]
fn rejects_commission_above_30_pct() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, market) = deploy_market(&e);
    let seller = Address::generate(&e);
    market.list_physical(
        &seller,
        &String::from_str(&e, "Overpriced"),
        &ArtworkKind::Painting,
        &1_000,
        &3100,   // 31 % — rejected
    );
}

// ── Guard: duplicate purchase rejected ───────────────────────────────────────

#[test]
#[should_panic(expected = "artwork already sold")]
fn double_buy_physical_rejected() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, _, market) = deploy_market(&e);
    let (token_addr, sac)  = create_token(&e, &admin);

    let seller = Address::generate(&e);
    let buyer  = Address::generate(&e);
    sac.mint(&buyer, &20_000);

    market.list_physical(
        &seller, &String::from_str(&e, "Unique"), &ArtworkKind::Painting, &1_000, &3000,
    );
    market.buy_physical(&buyer, &0u32, &token_addr);
    market.buy_physical(&buyer, &0u32, &token_addr);  // must panic
}

// ── Count increments correctly ────────────────────────────────────────────────

#[test]
fn phys_count_increments() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, market) = deploy_market(&e);
    let seller = Address::generate(&e);

    assert_eq!(market.phys_count(), 0);
    market.list_physical(&seller, &String::from_str(&e, "A"), &ArtworkKind::Painting,  &100, &3000);
    market.list_physical(&seller, &String::from_str(&e, "B"), &ArtworkKind::Sculpture, &200, &2600);
    assert_eq!(market.phys_count(), 2);
}

// ══════════════════════════════════════════════════════════════════════════════
// DIGITAL NFT LISTING TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn nft_list_and_buy_base_tier_5_pct_fee() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (nft_owner, nft)              = deploy_nft(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller          = Address::generate(&e);
    let buyer           = Address::generate(&e);
    let marketplace_id  = market.address.clone();

    // Mint an NFT to the seller (owner auth is mocked)
    let token_id = nft.mint(&seller, &String::from_str(&e, "ipfs://meta.json"));

    // Seller escrows NFT to marketplace
    nft.transfer(&seller, &marketplace_id, &token_id);
    assert_eq!(nft.owner_of(&token_id), marketplace_id);

    // List — Base tier fee = 5 % (500 bps)
    let listing_id = market.list_nft(
        &seller, &nft.address, &token_id, &10_000, &500,
    );

    // Fund and buy
    sac.mint(&buyer, &10_000);
    market.buy_nft(&buyer, &listing_id, &token_addr);

    // fee = 5% × 10000 = 500;  net = 9500
    let tok = token::Client::new(&e, &token_addr);
    assert_eq!(tok.balance(&fee_collector), 500);
    assert_eq!(tok.balance(&seller),        9_500);
    assert_eq!(tok.balance(&buyer),         0);

    // NFT now owned by buyer
    assert_eq!(nft.owner_of(&token_id), buyer);
    assert!(market.get_nft_listing(&listing_id).sold);
}

#[test]
fn nft_studio_tier_1_pct_fee() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, fee_collector, market) = deploy_market(&e);
    let (_, nft)                      = deploy_nft(&e);
    let (token_addr, sac)             = create_token(&e, &admin);

    let seller         = Address::generate(&e);
    let buyer          = Address::generate(&e);
    let marketplace_id = market.address.clone();

    let token_id = nft.mint(&seller, &String::from_str(&e, "ipfs://studio.json"));
    nft.transfer(&seller, &marketplace_id, &token_id);

    // Studio tier: 1 % (100 bps)
    let listing_id = market.list_nft(&seller, &nft.address, &token_id, &5_000, &100);

    sac.mint(&buyer, &5_000);
    market.buy_nft(&buyer, &listing_id, &token_addr);

    // 1% × 5000 = 50;  net = 4950
    let tok = token::Client::new(&e, &token_addr);
    assert_eq!(tok.balance(&fee_collector), 50);
    assert_eq!(tok.balance(&seller),        4_950);
    assert_eq!(nft.owner_of(&token_id),     buyer);
}

#[test]
fn cancel_nft_listing_returns_nft_to_seller() {
    let e = Env::default();
    e.mock_all_auths();

    let (_, _, market)  = deploy_market(&e);
    let (_, nft)        = deploy_nft(&e);

    let seller         = Address::generate(&e);
    let marketplace_id = market.address.clone();

    let token_id = nft.mint(&seller, &String::from_str(&e, "ipfs://cancel.json"));
    nft.transfer(&seller, &marketplace_id, &token_id);

    let listing_id = market.list_nft(&seller, &nft.address, &token_id, &1_000, &300);
    assert_eq!(nft.owner_of(&token_id), marketplace_id);

    market.cancel_nft_listing(&seller, &listing_id);
    assert_eq!(nft.owner_of(&token_id), seller);    // returned
    assert!(market.get_nft_listing(&listing_id).sold);  // marked inactive
}

#[test]
#[should_panic(expected = "NFT already sold")]
fn double_buy_nft_rejected() {
    let e = Env::default();
    e.mock_all_auths();

    let (admin, _, market) = deploy_market(&e);
    let (_, nft)           = deploy_nft(&e);
    let (token_addr, sac)  = create_token(&e, &admin);

    let seller         = Address::generate(&e);
    let buyer          = Address::generate(&e);
    let marketplace_id = market.address.clone();

    let token_id = nft.mint(&seller, &String::from_str(&e, "ipfs://double.json"));
    nft.transfer(&seller, &marketplace_id, &token_id);
    let lid = market.list_nft(&seller, &nft.address, &token_id, &1_000, &500);

    sac.mint(&buyer, &5_000);
    market.buy_nft(&buyer, &lid, &token_addr);
    market.buy_nft(&buyer, &lid, &token_addr);  // must panic
}

#[test]
#[should_panic(expected = "fee_bps out of range")]
fn rejects_fee_below_1_pct() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, market) = deploy_market(&e);
    let (_, nft)       = deploy_nft(&e);
    let seller         = Address::generate(&e);
    let marketplace_id = market.address.clone();
    let token_id = nft.mint(&seller, &String::from_str(&e, "ipfs://low.json"));
    nft.transfer(&seller, &marketplace_id, &token_id);
    market.list_nft(&seller, &nft.address, &token_id, &1_000, &50);  // 0.5% — rejected
}
