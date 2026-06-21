import { useState, useEffect, useMemo } from "react";
import { useWallet } from "../context/WalletContext";
import NFTCard from "../components/NFTCard";
import { getAllTokens } from "../stellar";

const MOCK_NFTS = [
  { id:  1, name: "Neon Dreams #1",   collection: "Neon Dreams",  badge: "luminary", owner: "GABC12…XYZ9", bg: "linear-gradient(135deg,#ff5533,#ff9f1c)", price: "250 XLM" },
  { id:  2, name: "Neon Dreams #2",   collection: "Neon Dreams",  badge: "luminary", owner: "GDEF34…UVW8", bg: "linear-gradient(135deg,#ff9f1c,#ffdd57)", price: "180 XLM" },
  { id:  3, name: "Digital Void #1",  collection: "Digital Void", badge: "guild",    owner: "GHIJ56…RST7", bg: "linear-gradient(135deg,#0f2027,#2c5364)",    price: "320 XLM" },
  { id:  4, name: "Digital Void #2",  collection: "Digital Void", badge: "guild",    owner: "GKLM78…OPQ6", bg: "linear-gradient(135deg,#203a43,#0f2027)",    price: "280 XLM" },
  { id:  5, name: "Chromatic #1",     collection: "Chromatic",    badge: "atlimit",  owner: "GNOP90…LMN5", bg: "linear-gradient(135deg,#1a1a2e,#0f3460)",    price: "450 XLM" },
  { id:  6, name: "Chromatic #2",     collection: "Chromatic",    badge: "atlimit",  owner: "GNOP90…LMN5", bg: "linear-gradient(135deg,#0f3460,#16213e)",    price: "420 XLM" },
  { id:  7, name: "Pixel Sage #1",    collection: "Pixel Sage",   badge: "luminary", owner: "GQRS12…IJK4", bg: "linear-gradient(135deg,#134e5e,#71b280)",    price: "190 XLM" },
  { id:  8, name: "Synth #1",         collection: "Synth",        badge: "guild",    owner: "GTUV34…GHI3", bg: "linear-gradient(135deg,#4a00e0,#8e2de2)",    price: "380 XLM" },
  { id:  9, name: "Synth #2",         collection: "Synth",        badge: "guild",    owner: "GWXY56…DEF2", bg: "linear-gradient(135deg,#8e2de2,#4a00e0)",    price: "290 XLM" },
  { id: 10, name: "Aurora Flux #1",   collection: "Aurora Flux",  badge: "atlimit",  owner: "GZAB78…ABC1", bg: "linear-gradient(135deg,#00d4ff,#0099cc)",    price: "520 XLM" },
  { id: 11, name: "Void Walker #1",   collection: "Void Walker",  badge: "luminary", owner: "GCDE90…XYZ0", bg: "linear-gradient(135deg,#1a1a2e,#e94560)",    price: "610 XLM" },
  { id: 12, name: "Prism Wave #1",    collection: "Prism Wave",   badge: "guild",    owner: "GFGH12…WXY9", bg: "linear-gradient(135deg,#f7971e,#ffd200)",    price: "175 XLM" },
  { id: 13, name: "Dark Matter #1",   collection: "Dark Matter",  badge: "atlimit",  owner: "GIJK34…VWX8", bg: "linear-gradient(135deg,#232526,#434343)",    price: "700 XLM" },
  { id: 14, name: "Solar Wind #1",    collection: "Solar Wind",   badge: "luminary", owner: "GJKL56…STU7", bg: "linear-gradient(135deg,#f83600,#f9d423)",    price: "340 XLM" },
  { id: 15, name: "Nebula Core #1",   collection: "Nebula Core",  badge: "guild",    owner: "GLMN78…PQR6", bg: "linear-gradient(135deg,#0575e6,#021b79)",    price: "460 XLM" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-high", label: "Price: High → Low" },
  { value: "price-low",  label: "Price: Low → High" },
];

export default function Explore() {
  const { address } = useWallet();
  const [nfts, setNfts]         = useState(MOCK_NFTS);
  const [loading, setLoading]   = useState(false);
  const [query, setQuery]       = useState("");
  const [badge, setBadge]       = useState("all");
  const [sort, setSort]         = useState("newest");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getAllTokens(50)
      .then((t) => { if (t.length) setNfts(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  const displayed = useMemo(() => {
    let list = [...nfts];
    if (query) list = list.filter((n) =>
      (n.name || "").toLowerCase().includes(query.toLowerCase()) ||
      String(n.id).includes(query)
    );
    if (badge !== "all") list = list.filter((n) => n.badge === badge);
    if (sort === "price-high") list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sort === "price-low")  list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sort === "oldest")     list.sort((a, b) => a.id - b.id);
    if (sort === "newest")     list.sort((a, b) => b.id - a.id);
    return list;
  }, [nfts, query, badge, sort]);

  return (
    <div className="page explore-page">
      {/* header */}
      <div className="page-header">
        <div>
          <h1>Explore</h1>
          <p className="page-sub">Discover and collect exceptional digital art on Stellar</p>
        </div>
        <div className="explore-stats">
          <span><b>{nfts.length}</b> artworks</span>
          <span><b>{new Set(nfts.map((n) => n.collection)).size}</b> collections</span>
        </div>
      </div>

      {/* search + filter bar */}
      <div className="explore-toolbar">
        <input
          className="search-input"
          placeholder="Search by name or token ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="filter-tabs">
          {["all", "luminary", "guild", "atlimit"].map((b) => (
            <button
              key={b}
              className={`filter-tab${badge === b ? " active" : ""}`}
              onClick={() => setBadge(b)}
            >
              {b === "all" ? "All" : b === "atlimit" ? "At Limit" : b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* grid */}
      {loading && <p className="loading-msg">Loading NFTs from contract…</p>}
      {!loading && displayed.length === 0 && <p className="empty-msg">No NFTs match your filters.</p>}
      <div className="explore-grid">
        {displayed.map((n) => (
          <NFTCard key={n.id} nft={n} onClick={() => setSelected(n)} />
        ))}
      </div>

      {/* detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <div className="modal-img">
              {selected.image
                ? <img src={selected.image} alt={selected.name} />
                : <div style={{ background: selected.bg, width: "100%", height: "100%" }} />
              }
            </div>
            <div className="modal-body">
              <div className="modal-top">
                <span className={`badge ${selected.badge}`}>
                  {selected.badge === "atlimit" ? "At Limit" : selected.badge?.charAt(0).toUpperCase() + selected.badge?.slice(1)}
                </span>
                {selected.collection && <span className="modal-collection">{selected.collection}</span>}
              </div>
              <h2 className="modal-name">{selected.name || `Token #${selected.id}`}</h2>
              <div className="modal-meta">
                <div className="modal-row"><span>Token ID</span><b>#{selected.id}</b></div>
                <div className="modal-row"><span>Owner</span><b className="mono">{selected.owner || "—"}</b></div>
                <div className="modal-row"><span>Price</span><b className="orange">{selected.price || "Not listed"}</b></div>
                {selected.uri && <div className="modal-row"><span>Metadata</span><a href={selected.uri} target="_blank" rel="noreferrer" className="cyan">IPFS ↗</a></div>}
              </div>
              <div className="modal-actions">
                <button className="btn-cta" style={{ width: "100%" }}>Buy Now</button>
                <button className="btn-outline" style={{ width: "100%" }}>Make Offer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
