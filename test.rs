#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

use crate::{NFTCollection, NFTCollectionClient};

fn setup(e: &Env) -> (Address, NFTCollectionClient) {
    let owner = Address::generate(e);
    let receiver = Address::generate(e);
    let contract_id = e.register(
        NFTCollection,
        (
            owner.clone(),
            String::from_str(e, "ipfs://"),
            String::from_str(e, "My Collection"),
            String::from_str(e, "MYC"),
            500u32,            // 5% royalty
            receiver.clone(),
        ),
    );
    (owner, NFTCollectionClient::new(e, &contract_id))
}

#[test]
fn mint_and_owner_of() {
    let e = Env::default();
    e.mock_all_auths();
    let (_owner, client) = setup(&e);

    let user = Address::generate(&e);
    let uri = String::from_str(&e, "ipfs://bafyTokenOne.json");
    let id = client.mint(&user, &uri);

    assert_eq!(client.owner_of(&id), user);
    assert_eq!(client.balance_of(&user), 1);
    assert_eq!(client.token_uri(&id), String::from_str(&e, "ipfs://ipfs://bafyTokenOne.json"));
}

#[test]
fn transfer_moves_ownership() {
    let e = Env::default();
    e.mock_all_auths();
    let (_owner, client) = setup(&e);

    let from = Address::generate(&e);
    let to = Address::generate(&e);
    let id = client.mint(&from, &String::from_str(&e, "ipfs://x.json"));

    client.transfer(&from, &to, &id);
    assert_eq!(client.owner_of(&id), to);
}

#[test]
fn enumerate_owned_tokens() {
    let e = Env::default();
    e.mock_all_auths();
    let (_owner, client) = setup(&e);

    let user = Address::generate(&e);
    client.mint(&user, &String::from_str(&e, "ipfs://a.json"));
    client.mint(&user, &String::from_str(&e, "ipfs://b.json"));

    assert_eq!(client.balance_of(&user), 2);
    // Enumerable lets us walk the owner's tokens by index.
    let first = client.get_owner_token_id(&user, &0);
    let second = client.get_owner_token_id(&user, &1);
    assert_ne!(first, second);
}
