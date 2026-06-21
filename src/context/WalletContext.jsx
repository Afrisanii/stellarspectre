import { createContext, useContext, useState, useCallback } from "react";
import { connectWallet as stellarConnect, getOwnedTokens } from "../stellar";

const Ctx = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState("");
  const [tokens, setTokens]   = useState([]);
  const [status, setStatus]   = useState("");
  const [busy, setBusy]       = useState(false);
  const [plan, setPlanState]  = useState(() => localStorage.getItem("morianah_plan") || "base");

  const setPlan = (id) => {
    localStorage.setItem("morianah_plan", id);
    setPlanState(id);
  };

  const refreshTokens = useCallback(async (addr) => {
    const a = addr || address;
    if (!a) return;
    try {
      const t = await getOwnedTokens(a);
      setTokens(t);
    } catch (e) {
      setStatus(`Failed to load tokens: ${e.message}`);
    }
  }, [address]);

  const connect = useCallback(async () => {
    try {
      const addr = await stellarConnect();
      setAddress(addr);
      setStatus("Wallet connected");
      await refreshTokens(addr);
      return addr;
    } catch (e) {
      setStatus(e.message);
      throw e;
    }
  }, [refreshTokens]);

  return (
    <Ctx.Provider value={{ address, tokens, status, busy, plan, setPlan, connect, refreshTokens, setStatus, setBusy }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => useContext(Ctx);
