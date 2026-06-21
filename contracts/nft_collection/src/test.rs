#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{NFTCollection, NFTCollectionClient};

fn setup(e: &Env) -> (Address, Address, NFTCollectionClient) {
    let owner    = Address::generate(e);
    let receiver = Address::generate(e);
    let id = e.register(
        NFTCollection,
        (
            owner.clone(),
            String::from_str(e, "ipfs://"),
            String::from_str(e, "Morianah Collection"),
            String::from_str(e, "MOR"),
            500u32,  // 5% default royalty
            receiver.clone(),
        ),
    );
    (owner, receiver, NFTCollectionClient::new(e, &id))
}

// ── Basic minting ─────────────────────────────────────────────────────────────

#[test]
fn mint_assigns_sequential_ids() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user = Address::generate(&e);

    let id0 = client.mint(&user, &String::from_str(&e, "ipfs://a.json"));
    let id1 = client.mint(&user, &String::from_str(&e, "ipfs://b.json"));

    assert_eq!(id0, 0);
    assert_eq!(id1, 1);
    assert_eq!(client.balance_of(&user), 2);
}

#[test]
fn mint_sets_owner() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user = Address::generate(&e);

    let id = client.mint(&user, &String::from_str(&e, "ipfs://token.json"));
    assert_eq!(client.owner_of(&id), user);
}

#[test]
fn token_uri_stored_correctly() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user = Address::generate(&e);

    let id = client.mint(&user, &String::from_str(&e, "bafyTest.json"));
    // base_uri "ipfs://" + supplied uri
    assert_eq!(
        client.token_uri(&id),
        String::from_str(&e, "ipfs://bafyTest.json"),
    );
}

// ── Transfer ──────────────────────────────────────────────────────────────────

#[test]
fn transfer_moves_ownership() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let from = Address::generate(&e);
    let to   = Address::generate(&e);

    let id = client.mint(&from, &String::from_str(&e, "ipfs://x.json"));
    client.transfer(&from, &to, &id);

    assert_eq!(client.owner_of(&id), to);
    assert_eq!(client.balance_of(&from), 0);
    assert_eq!(client.balance_of(&to),   1);
}

// ── Enumeration ───────────────────────────────────────────────────────────────

#[test]
fn enumerate_owner_tokens() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user = Address::generate(&e);

    client.mint(&user, &String::from_str(&e, "ipfs://a.json"));
    client.mint(&user, &String::from_str(&e, "ipfs://b.json"));
    client.mint(&user, &String::from_str(&e, "ipfs://c.json"));

    assert_eq!(client.balance_of(&user), 3);
    let t0 = client.get_owner_token_id(&user, &0);
    let t1 = client.get_owner_token_id(&user, &1);
    let t2 = client.get_owner_token_id(&user, &2);
    assert_ne!(t0, t1);
    assert_ne!(t1, t2);
}

#[test]
fn total_supply_tracks_mints() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user = Address::generate(&e);

    assert_eq!(client.total_supply(), 0);
    client.mint(&user, &String::from_str(&e, "ipfs://1.json"));
    client.mint(&user, &String::from_str(&e, "ipfs://2.json"));
    assert_eq!(client.total_supply(), 2);
}

// ── Royalties ─────────────────────────────────────────────────────────────────

#[test]
fn default_royalty_returned_for_any_token() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, receiver, client) = setup(&e);
    let user = Address::generate(&e);

    let id = client.mint(&user, &String::from_str(&e, "ipfs://r.json"));
    let info = client.royalty_info(&id, &10_000i128);

    assert_eq!(info.receiver, receiver);
    assert_eq!(info.amount, 500i128); // 5% of 10_000
}

#[test]
fn per_token_royalty_overrides_default() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user     = Address::generate(&e);
    let new_recv = Address::generate(&e);

    let id = client.mint(&user, &String::from_str(&e, "ipfs://s.json"));
    client.set_token_royalty(&id, &new_recv, &1000u32); // override to 10%

    let info = client.royalty_info(&id, &10_000i128);
    assert_eq!(info.receiver, new_recv);
    assert_eq!(info.amount, 1_000i128);
}

// ── Burn ──────────────────────────────────────────────────────────────────────

#[test]
fn burn_removes_token() {
    let e = Env::default();
    e.mock_all_auths();
    let (_, _, client) = setup(&e);
    let user = Address::generate(&e);

    let id = client.mint(&user, &String::from_str(&e, "ipfs://burn.json"));
    assert_eq!(client.total_supply(), 1);

    client.burn(&user, &id);
    assert_eq!(client.total_supply(), 0);
    assert_eq!(client.balance_of(&user), 0);
}
