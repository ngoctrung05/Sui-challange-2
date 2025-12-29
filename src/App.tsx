import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import SwapPage from './pages/SwapPage';
import LiquidityPage from './pages/LiquidityPage';
import PositionsPage from './pages/PositionsPage';
import FaucetPage from './pages/FaucetPage';
import PoolsPage from './pages/PoolsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/swap" replace />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/pools" element={<PoolsPage />} />
        <Route path="/liquidity" element={<LiquidityPage />} />
        <Route path="/positions" element={<PositionsPage />} />
        <Route path="/faucet" element={<FaucetPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
