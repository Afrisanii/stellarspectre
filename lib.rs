#![no_std]

//! NFT collection contract for Stellar/Soroban.
//!
//! Built on OpenZeppelin's `stellar-tokens` Enumerable NFT variant so the dApp
//! can list tokens owned by an address directly from the chain. Each token
//! stores its own IPFS metadata URI. Minting is restricted to the contract
//! owner via the Ownable access-control module. Royalty info is exposed for
//! the marketplace phase (ERC-2981-style).

use soroban_sdk::{contract, contractimpl, Address, Env, String};

use stellar_access::ownable::{self as ownable, Ownable};
use stellar_tokens::non_fungible::{
    burnable::NonFungibleBurnable,
    enumerable::{Enumerable, NonFungibleEnumerable},
    royalties::{NonFungibleRoyalties, RoyaltyInfo},
    Base, ContractOverrides, NonFungibleToken,
};

#[contract]
pub struct NFTCollection;

#[contractimpl]
impl NFTCollection {
    /// Initialize the collection.
    /// - `owner`: the only address allowed to mint
    /// - `base_uri`: e.g. "ipfs://" (token URI = base_uri + token metadata)
    /// - `name` / `symbol`: collection identity
    /// - `royalty_bps`: default royalty in basis points (e.g. 500 = 5%)
    /// - `royalty_receiver`: who receives royalties by default
    pub fn __constructor(
        e: &Env,
        owner: Address,
        base_uri: String,
        name: String,
        symbol: String,
        royalty_bps: u32,
        royalty_receiver: Address,
    ) {
        Base::set_metadata(e, base_uri, name, symbol);
        ownable::set_owner(e, &owner);
        Self::set_default_royalty(e, &royalty_receiver, royalty_bps);
    }

    /// Mint the next sequential token to `to` and attach its IPFS metadata URI
    /// (the CID/path appended to base_uri off-chain, or a full ipfs:// URI).
    /// Only the contract owner may call this.
    pub fn mint(e: &Env, to: Address, token_uri: String) -> u32 {
        ownable::enforce_owner_auth(e);
        let token_id = Enumerable::sequential_mint(e, &to);
        Base::set_token_uri(e, token_id, token_uri);
        token_id
    }

    /// Convenience helper used by the marketplace phase: set royalty for one token.
    pub fn set_token_royalty(e: &Env, token_id: u32, receiver: Address, bps: u32) {
        ownable::enforce_owner_auth(e);
        Self::set_token_royalty_internal(e, token_id, &receiver, bps);
    }

    // internal wrappers to keep the public surface clean
    fn set_default_royalty(e: &Env, receiver: &Address, bps: u32) {
        <Self as NonFungibleRoyalties>::ContractType::set_default_royalty(e, receiver, bps);
    }
    fn set_token_royalty_internal(e: &Env, token_id: u32, receiver: &Address, bps: u32) {
        <Self as NonFungibleRoyalties>::ContractType::set_token_royalty(e, token_id, receiver, bps);
    }
}

// Core NFT interface (balance_of, owner_of, transfer, transfer_from, approve, token_uri, etc.)
#[contractimpl(contracttrait)]
impl NonFungibleToken for NFTCollection {
    type ContractType = Enumerable;
}

// On-chain enumeration: get_owner_token_id(owner, index), total_supply, etc.
#[contractimpl(contracttrait)]
impl NonFungibleEnumerable for NFTCollection {}

// Allow holders to burn their tokens.
#[contractimpl(contracttrait)]
impl NonFungibleBurnable for NFTCollection {}

// Royalty info for marketplaces (royalty_info(token_id, sale_price) -> (receiver, amount)).
#[contractimpl(contracttrait)]
impl NonFungibleRoyalties for NFTCollection {}

// Ownership management (get_owner, transfer_ownership, renounce_ownership).
#[contractimpl(contracttrait)]
impl Ownable for NFTCollection {}

mod test;
