import { useWallet } from "../context/WalletContext";

export default function StatusBar() {
  const { status, setStatus } = useWallet();
  if (!status) return null;
  return (
    <div className="status-bar">
      <span>{status}</span>
      <button className="status-close" onClick={() => setStatus("")}>✕</button>
    </div>
  );
}
