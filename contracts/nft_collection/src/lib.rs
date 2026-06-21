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
    /// Initialise the collection.
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

    /// Mint the next sequential token to `to` and store its IPFS metadata URI.
    /// Caller must be the contract owner.
    pub fn mint(e: &Env, to: Address, token_uri: String) -> u32 {
        ownable::enforce_owner_auth(e);
        let token_id = Enumerable::sequential_mint(e, &to);
        Base::set_token_uri(e, token_id, token_uri);
        token_id
    }

    /// Override per-token royalty (owner only).
    pub fn set_token_royalty(e: &Env, token_id: u32, receiver: Address, bps: u32) {
        ownable::enforce_owner_auth(e);
        Self::set_token_royalty_internal(e, token_id, &receiver, bps);
    }

    fn set_default_royalty(e: &Env, receiver: &Address, bps: u32) {
        <Self as NonFungibleRoyalties>::ContractType::set_default_royalty(e, receiver, bps);
    }
    fn set_token_royalty_internal(e: &Env, token_id: u32, receiver: &Address, bps: u32) {
        <Self as NonFungibleRoyalties>::ContractType::set_token_royalty(e, token_id, receiver, bps);
    }
}

#[contractimpl(contracttrait)]
impl NonFungibleToken for NFTCollection {
    type ContractType = Enumerable;
}

#[contractimpl(contracttrait)]
impl NonFungibleEnumerable for NFTCollection {}

#[contractimpl(contracttrait)]
impl NonFungibleBurnable for NFTCollection {}

#[contractimpl(contracttrait)]
impl NonFungibleRoyalties for NFTCollection {}

#[contractimpl(contracttrait)]
impl Ownable for NFTCollection {}

#[cfg(test)]
mod test;
