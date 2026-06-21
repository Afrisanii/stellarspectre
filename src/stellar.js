// src/stellar.js
// All Soroban contract interaction lives here.
// Uses @stellar/stellar-sdk for RPC + transaction building and
// @stellar/freighter-api for wallet signing.

import {
  Contract,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  rpc,
  nativeToScVal,
  scValToNative,
  Address,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

// ---- Config: fill these in after you deploy ----
export const CONTRACT_ID = "PASTE_YOUR_CONTRACT_ID_HERE"; // C...
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
// Public IPFS gateway used to render images from ipfs:// URIs.
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const server = new rpc.Server(RPC_URL);

// ---- Wallet ----
export async function connectWallet() {
  const { isConnected: connected } = await isConnected();
  if (!connected) {
    throw new Error("Freighter not installed. Install it from freighter.app");
  }
  await requestAccess();
  const { address } = await getAddress();
  return address;
}

// ---- Helpers ----
function gatewayUrl(uri) {
  if (!uri) return "";
  return uri.startsWith("ipfs://")
    ? uri.replace("ipfs://", IPFS_GATEWAY)
    : uri;
}

// Simulate a read-only contract call (no signing, no fee).
async function simulateRead(method, args = []) {
  const contract = new Contract(CONTRACT_ID);
  // A throwaway source account is fine for simulation-only reads.
  const sourceAcct = await server.getAccount(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF" // placeholder; replaced below
  ).catch(() => null);

  // If the placeholder account doesn't exist, use the connected wallet instead.
  const addr = sourceAcct ? sourceAcct.accountId() : await getConnectedAddress();
  const account = await server.getAccount(addr);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  return scValToNative(sim.result.retval);
}

async function getConnectedAddress() {
  const { address } = await getAddress();
  return address;
}

// Build, sign (via Freighter), and submit a state-changing call.
async function invokeWrite(method, args = []) {
  const caller = await getConnectedAddress();
  const account = await server.getAccount(caller);
  const contract = new Contract(CONTRACT_ID);

  let tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  // Prepare (simulate + assemble auth/footprint).
  tx = await server.prepareTransaction(tx);

  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: caller,
  });

  const signedTx = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const sendResp = await server.sendTransaction(signedTx);
  // Poll until the transaction is confirmed.
  let getResp = await server.getTransaction(sendResp.hash);
  while (getResp.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1500));
    getResp = await server.getTransaction(sendResp.hash);
  }
  if (getResp.status !== "SUCCESS") {
    throw new Error(`Transaction failed: ${getResp.status}`);
  }
  return getResp.returnValue ? scValToNative(getResp.returnValue) : null;
}

// ---- Contract methods ----

// Mint to an address with a token metadata URI (owner only).
export async function mint(toAddress, tokenUri) {
  return invokeWrite("mint", [
    nativeToScVal(Address.fromString(toAddress), { type: "address" }),
    nativeToScVal(tokenUri, { type: "string" }),
  ]);
}

// Transfer a token you own to another address.
export async function transfer(fromAddress, toAddress, tokenId) {
  return invokeWrite("transfer", [
    nativeToScVal(Address.fromString(fromAddress), { type: "address" }),
    nativeToScVal(Address.fromString(toAddress), { type: "address" }),
    nativeToScVal(tokenId, { type: "u32" }),
  ]);
}

export async function balanceOf(address) {
  return simulateRead("balance_of", [
    nativeToScVal(Address.fromString(address), { type: "address" }),
  ]);
}

export async function ownerOf(tokenId) {
  return simulateRead("owner_of", [nativeToScVal(tokenId, { type: "u32" })]);
}

export async function tokenUri(tokenId) {
  return simulateRead("token_uri", [nativeToScVal(tokenId, { type: "u32" })]);
}

// Walk all tokens owned by an address using the Enumerable extension.
export async function getOwnedTokens(address) {
  const count = Number(await balanceOf(address));
  const tokens = [];
  for (let i = 0; i < count; i++) {
    const id = await simulateRead("get_owner_token_id", [
      nativeToScVal(Address.fromString(address), { type: "address" }),
      nativeToScVal(i, { type: "u32" }),
    ]);
    const uri = await tokenUri(Number(id));
    const token = { id: Number(id), uri, image: gatewayUrl(uri) };
    tokens.push(await enrichToken(token));
  }
  return tokens;
}

// ---- Global enumeration (Enumerable extension) ----

export async function totalSupply() {
  return simulateRead("total_supply");
}

export async function tokenByIndex(index) {
  return simulateRead("get_token_by_index", [
    nativeToScVal(index, { type: "u32" }),
  ]);
}

// Fetch all minted tokens up to `limit`. Falls back gracefully if contract not deployed.
export async function getAllTokens(limit = 50) {
  try {
    const count = Number(await totalSupply());
    const tokens = [];
    for (let i = 0; i < Math.min(count, limit); i++) {
      const id = Number(await tokenByIndex(i));
      const uri = await tokenUri(id);
      const owner = String(await ownerOf(id));
      const token = { id, uri, owner, image: gatewayUrl(uri) };
      tokens.push(await enrichToken(token));
    }
    return tokens;
  } catch {
    return [];
  }
}

// Fetch metadata JSON from IPFS and resolve the real image URL.
async function enrichToken(token) {
  try {
    const metaUrl = gatewayUrl(token.uri);
    if (!metaUrl) return token;
    const res = await fetch(metaUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return token;
    const meta = await res.json();
    return {
      ...token,
      name:        meta.name        || token.name,
      description: meta.description || token.description,
      image:       meta.image ? gatewayUrl(meta.image) : token.image,
    };
  } catch {
    return token;
  }
}
