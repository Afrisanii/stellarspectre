# Stellar NFT dApp

NFT collection on Stellar/Soroban with a React dApp. Mint, view, and transfer
NFTs with metadata on IPFS (Pinata). Built on OpenZeppelin's `stellar-tokens`
NFT library (Enumerable variant + per-token URI + royalties).

```
stellar-nft/
├── contracts/         # Rust/Soroban smart contract
│   ├── Cargo.toml
│   └── nft/
│       ├── Cargo.toml
│       └── src/{lib.rs, test.rs}
└── frontend/          # React + Vite dApp
    └── src/{App.jsx, stellar.js, ipfs.js, ...}
```

## Phase status
- ✅ Phase 1 (this code): mint, transfer, on-chain gallery, IPFS metadata.
- ⏳ Phase 2 (next): separate marketplace contract (list / buy / cancel).

---

## Prerequisites
- Rust + `wasm32-unknown-unknown` target
- Stellar CLI (`stellar`)
- Node 18+
- Freighter browser wallet (https://freighter.app)
- Pinata account (https://app.pinata.cloud) for IPFS

```bash
# Rust + wasm target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Stellar CLI (macOS via brew; see docs for Linux/Windows)
brew install stellar-cli
# or: cargo install --locked stellar-cli
```

## 1. Build & test the contract
```bash
cd contracts
cargo test                              # run unit tests
stellar contract build                  # compiles to target/wasm32-unknown-unknown/release/nft.wasm
```

## 2. Create a testnet identity (funded by friendbot)
```bash
stellar keys generate --global alice --network testnet --fund
stellar keys address alice              # your G... address
```

## 3. Deploy to testnet
The constructor takes: owner, base_uri, name, symbol, royalty_bps, royalty_receiver.

```bash
OWNER=$(stellar keys address alice)

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nft.wasm \
  --source alice \
  --network testnet \
  -- \
  --owner "$OWNER" \
  --base_uri "ipfs://" \
  --name "My Collection" \
  --symbol "MYC" \
  --royalty_bps 500 \
  --royalty_receiver "$OWNER"
```
Save the returned contract ID (starts with `C`).

## 4. (Optional) mint from the CLI to sanity-check
```bash
stellar contract invoke --id <CONTRACT_ID> --source alice --network testnet \
  -- mint --to "$OWNER" --token_uri "ipfs://bafyExampleCID"
```

## 5. Configure & run the frontend
```bash
cd ../frontend
npm install
cp .env.example .env          # then paste your Pinata JWT into .env
```
Edit `src/stellar.js` and set `CONTRACT_ID` to your deployed contract ID.

```bash
npm run dev                   # open the printed localhost URL
```
Connect Freighter (set it to **Testnet** in its settings), then mint/transfer.

---

## Important notes
- **Minting is owner-only.** The wallet you connect in the dApp must be the
  `owner` you deployed with, or `mint` will fail auth. To let anyone mint,
  remove `ownable::enforce_owner_auth(e)` from `mint` in `lib.rs`.
- **Pinata JWT in the browser** is for local dev only. For production, proxy
  uploads through a backend so the secret never reaches the client.
- **Versions**: `soroban-sdk`, `stellar-tokens`, and the JS SDK move fast.
  If `cargo build` or `npm install` complains about versions, check
  crates.io / npm for the latest and bump. The contract API used here matches
  the OpenZeppelin `stellar-tokens` Enumerable + Royalties modules.
