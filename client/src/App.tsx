import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import RiskBoard from "./pages/RiskBoard";
import StaffProfile from "./pages/StaffProfile";
import SupervisionPack from "./pages/SupervisionPack";
import Cqc from "./pages/Cqc";
import CqcExport from "./pages/CqcExport";
import DataManager from "./pages/DataManager";
import Admin from "./pages/Admin";
import Gdpr from "./pages/Gdpr";
import { useAuth } from "./store";
import type { ReactNode } from "react";

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  if (user?.Role === "Team Leader") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* print-first pages render without the app chrome */}
        <Route path="/staff/:id/pack" element={<RequireAuth><SupervisionPack /></RequireAuth>} />
        <Route path="/cqc/export" element={<RequireAuth><CqcExport /></RequireAuth>} />
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/" element={<Overview />} />
          <Route path="/risk" element={<RiskBoard />} />
          <Route path="/staff/:id" element={<StaffProfile />} />
          <Route path="/cqc" element={<Cqc />} />
          <Route path="/data" element={<RequireAdmin><DataManager /></RequireAdmin>} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="/gdpr" element={<Gdpr />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
