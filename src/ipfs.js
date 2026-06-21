// src/ipfs.js
// Uploads an image + JSON metadata to IPFS via Pinata, returns an ipfs:// URI.
//
// SECURITY: never ship your Pinata secret to the browser in production.
// For a real app, proxy these calls through a small backend. This direct
// approach is fine for local testnet development only.

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT; // set in .env

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Pinata image upload failed: ${res.status}`);
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

export async function uploadMetadata(metadata) {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error(`Pinata metadata upload failed: ${res.status}`);
  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

// Full flow: image file + attributes -> metadata URI to pass into mint().
export async function uploadNFT({ file, name, description }) {
  const imageUri = await uploadImage(file);
  return uploadMetadata({ name, description, image: imageUri });
}
