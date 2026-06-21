import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Navbar from "./components/Navbar";
import StatusBar from "./components/StatusBar";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Spaces from "./pages/Spaces";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import HowTo from "./pages/HowTo";
import Pricing from "./pages/Pricing";
import "./App.css";

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Navbar />
        <StatusBar />
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/explore"   element={<Explore />} />
          <Route path="/spaces"    element={<Spaces />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="/profile/:addr" element={<Profile />} />
          <Route path="/how-to"        element={<HowTo />} />
          <Route path="/pricing"       element={<Pricing />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
}
