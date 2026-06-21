const BADGE_LABEL = { luminary: "Luminary", guild: "Guild", atlimit: "At Limit" };

export default function NFTCard({ nft, onClick }) {
  const { id, name, image, bg, owner, badge = "guild", price, collection } = nft;

  return (
    <div className="nft-card" onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className="nft-card-img">
        {image
          ? <img src={image} alt={name || `Token #${id}`} loading="lazy" />
          : <div className="nft-card-gradient" style={{ background: bg || "linear-gradient(135deg,#1e293b,#0f172a)" }} />
        }
        {badge && <span className={`badge ${badge} nft-badge`}>{BADGE_LABEL[badge] || badge}</span>}
      </div>
      <div className="nft-card-body">
        <div className="nft-card-name">{name || `Token #${id}`}</div>
        {collection && <div className="nft-card-collection">{collection}</div>}
        {owner && <div className="nft-card-owner">{owner.slice(0, 6)}…{owner.slice(-4)}</div>}
        {price && <div className="nft-card-price">{price}</div>}
      </div>
    </div>
  );
}
