#![no_std]

//! Morianah marketplace contract.
//!
//! Handles two categories of sales, both settled atomically in a single token:
//!
//!  Physical artworks (paintings & sculptures)
//!  ──────────────────────────────────────────
//!  Commission of 26–30 % depending on the seller's plan tier.
//!    Base     → 30 %  (3000 bps)
//!    Artisan  → 29 %  (2900 bps)
//!    Luminary → 27 %  (2700 bps)
//!    Studio   → 26 %  (2600 bps)
//!
//!  Digital NFT sales
//!  ─────────────────
//!  Platform fee of 1–5 % depending on the seller's plan tier.
//!    Base     →  5 %  ( 500 bps)
//!    Artisan  →  3 %  ( 300 bps)
//!    Luminary →  2 %  ( 200 bps)
//!    Studio   →  1 %  ( 100 bps)
//!
//! On every sale the contract simultaneously routes the commission/fee to the
//! platform fee collector and the net proceeds to the seller in one atomic tx.
//!
//! NFT escrow model: the seller transfers the NFT to the marketplace address
//! before calling `list_nft`. The contract verifies ownership before listing
//! and transfers the NFT to the buyer at purchase time.

use soroban_sdk::{contract, contractimpl, contracttype, contractclient, token, Address, Env, String};

// ── Cross-contract NFT interface ──────────────────────────────────────────────
// The marketplace calls transfer() and owner_of() on the NFTCollection contract.

#[contractclient(name = "NftContractClient")]
pub trait NftContract {
    fn transfer(env: Env, from: Address, to: Address, token_id: u32);
    fn owner_of(env: Env, token_id: u32) -> Address;
}

// ── Domain types ──────────────────────────────────────────────────────────────

/// Physical artwork category for on-chain classification.
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum ArtworkKind {
    Painting,
    Sculpture,
}

/// A physical artwork listed for sale.
#[contracttype]
#[derive(Clone)]
pub struct PhysicalListing {
    pub seller:         Address,
    pub title:          String,
    pub kind:           ArtworkKind,
    pub price:          i128,        // payment token units (e.g. USDC micro-units)
    pub commission_bps: u32,         // 2600–3000  (26–30 %)
    pub sold:           bool,
}

/// A digital NFT listed for sale (escrowed by the marketplace).
#[contracttype]
#[derive(Clone)]
pub struct NftListing {
    pub seller:       Address,
    pub nft_contract: Address,
    pub token_id:     u32,
    pub price:        i128,          // payment token units
    pub fee_bps:      u32,           // 100–500    (1–5 %)
    pub sold:         bool,
}

// ── Storage keys ──────────────────────────────────────────────────────────────

#[contracttype]
pub enum DataKey {
    Admin,
    FeeCollector,
    PhysListing(u32),
    NftListing(u32),
    PhysCount,
    NftCount,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    /// Deploy the marketplace.
    /// `fee_collector` is the platform treasury that receives all fees/commissions.
    pub fn __constructor(e: &Env, admin: Address, fee_collector: Address) {
        e.storage().instance().set(&DataKey::Admin,        &admin);
        e.storage().instance().set(&DataKey::FeeCollector, &fee_collector);
        e.storage().instance().set(&DataKey::PhysCount,    &0u32);
        e.storage().instance().set(&DataKey::NftCount,     &0u32);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Physical artwork listings
    // ─────────────────────────────────────────────────────────────────────────

    /// Register a physical artwork (painting or sculpture) for sale.
    ///
    /// `commission_bps` must be in the range [2600, 3000] (26–30 %).
    /// The caller specifies their own rate so the chain enforces the allowed
    /// band; the front-end passes the rate from the plan registry.
    pub fn list_physical(
        e:              &Env,
        seller:         Address,
        title:          String,
        kind:           ArtworkKind,
        price:          i128,
        commission_bps: u32,
    ) -> u32 {
        seller.require_auth();
        assert!(commission_bps >= 2600 && commission_bps <= 3000,
            "commission_bps out of range: must be 2600-3000 (26-30%)");
        assert!(price > 0, "price must be positive");

        let id: u32 = e.storage().instance().get(&DataKey::PhysCount).unwrap_or(0);
        e.storage().persistent().set(
            &DataKey::PhysListing(id),
            &PhysicalListing { seller, title, kind, price, commission_bps, sold: false },
        );
        e.storage().instance().set(&DataKey::PhysCount, &(id + 1));
        id
    }

    /// Execute a physical artwork sale.
    ///
    /// Atomically splits the buyer's payment:
    ///   commission (commission_bps / 10_000 × price) → fee_collector
    ///   net proceeds                                   → seller
    pub fn buy_physical(
        e:             &Env,
        buyer:          Address,
        listing_id:     u32,
        payment_token:  Address,
    ) {
        buyer.require_auth();

        let mut listing: PhysicalListing = e
            .storage()
            .persistent()
            .get(&DataKey::PhysListing(listing_id))
            .expect("physical listing not found");
        assert!(!listing.sold, "artwork already sold");

        let fee_collector: Address =
            e.storage().instance().get(&DataKey::FeeCollector).unwrap();
        let tok = token::Client::new(e, &payment_token);

        let commission = listing.price * listing.commission_bps as i128 / 10_000;
        let net        = listing.price - commission;

        tok.transfer(&buyer, &fee_collector, &commission);
        tok.transfer(&buyer, &listing.seller, &net);

        listing.sold = true;
        e.storage()
            .persistent()
            .set(&DataKey::PhysListing(listing_id), &listing);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Digital NFT listings
    // ─────────────────────────────────────────────────────────────────────────

    /// List an NFT for sale.
    ///
    /// Before calling this the seller must transfer the NFT to the marketplace
    /// contract address (escrow). This function verifies the marketplace holds
    /// the token before creating the listing.
    ///
    /// `fee_bps` must be in the range [100, 500] (1–5 %).
    pub fn list_nft(
        e:            &Env,
        seller:        Address,
        nft_contract:  Address,
        token_id:      u32,
        price:         i128,
        fee_bps:       u32,
    ) -> u32 {
        seller.require_auth();
        assert!(fee_bps >= 100 && fee_bps <= 500,
            "fee_bps out of range: must be 100-500 (1-5%)");
        assert!(price > 0, "price must be positive");

        // Confirm the marketplace holds the NFT (seller escrowed it first).
        let nft     = NftContractClient::new(e, &nft_contract);
        let holder  = nft.owner_of(&token_id);
        assert!(
            holder == e.current_contract_address(),
            "marketplace must hold the NFT before listing; transfer it first"
        );

        let id: u32 = e.storage().instance().get(&DataKey::NftCount).unwrap_or(0);
        e.storage().persistent().set(
            &DataKey::NftListing(id),
            &NftListing { seller, nft_contract, token_id, price, fee_bps, sold: false },
        );
        e.storage().instance().set(&DataKey::NftCount, &(id + 1));
        id
    }

    /// Execute a digital NFT sale.
    ///
    /// Atomically:
    ///   1. Splits buyer's payment — fee → fee_collector, net → seller.
    ///   2. Transfers the escrowed NFT from marketplace to buyer.
    pub fn buy_nft(
        e:             &Env,
        buyer:          Address,
        listing_id:     u32,
        payment_token:  Address,
    ) {
        buyer.require_auth();

        let mut listing: NftListing = e
            .storage()
            .persistent()
            .get(&DataKey::NftListing(listing_id))
            .expect("NFT listing not found");
        assert!(!listing.sold, "NFT already sold");

        let fee_collector: Address =
            e.storage().instance().get(&DataKey::FeeCollector).unwrap();
        let tok = token::Client::new(e, &payment_token);

        let fee = listing.price * listing.fee_bps as i128 / 10_000;
        let net = listing.price - fee;

        // Settle payment.
        tok.transfer(&buyer, &fee_collector, &fee);
        tok.transfer(&buyer, &listing.seller, &net);

        // Release escrowed NFT to buyer.
        let nft = NftContractClient::new(e, &listing.nft_contract);
        nft.transfer(&e.current_contract_address(), &buyer, &listing.token_id);

        listing.sold = true;
        e.storage()
            .persistent()
            .set(&DataKey::NftListing(listing_id), &listing);
    }

    /// Cancel a digital NFT listing and return the escrowed NFT to the seller.
    pub fn cancel_nft_listing(e: &Env, seller: Address, listing_id: u32) {
        seller.require_auth();

        let mut listing: NftListing = e
            .storage()
            .persistent()
            .get(&DataKey::NftListing(listing_id))
            .expect("NFT listing not found");
        assert!(!listing.sold,     "cannot cancel a completed sale");
        assert!(listing.seller == seller, "only the seller can cancel");

        // Return the NFT from escrow.
        let nft = NftContractClient::new(e, &listing.nft_contract);
        nft.transfer(&e.current_contract_address(), &seller, &listing.token_id);

        listing.sold = true; // mark inactive so it cannot be purchased
        e.storage()
            .persistent()
            .set(&DataKey::NftListing(listing_id), &listing);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────────────────

    pub fn get_physical_listing(e: &Env, id: u32) -> PhysicalListing {
        e.storage()
            .persistent()
            .get(&DataKey::PhysListing(id))
            .expect("physical listing not found")
    }

    pub fn get_nft_listing(e: &Env, id: u32) -> NftListing {
        e.storage()
            .persistent()
            .get(&DataKey::NftListing(id))
            .expect("NFT listing not found")
    }

    pub fn phys_count(e: &Env) -> u32 {
        e.storage().instance().get(&DataKey::PhysCount).unwrap_or(0)
    }

    pub fn nft_count(e: &Env) -> u32 {
        e.storage().instance().get(&DataKey::NftCount).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
