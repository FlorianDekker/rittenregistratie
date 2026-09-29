import { Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import ImportPage from './pages/ImportPage';
import More from './pages/More';
import Cars from './pages/Cars';
import Locations from './pages/Locations';
import Checkpoints from './pages/Checkpoints';
import ExportPage from './pages/ExportPage';
import Settings from './pages/Settings';
import Help from './pages/Help';
import './App.css';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ritten" element={<Trips />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/meer" element={<More />} />
        <Route path="/autos" element={<Cars />} />
        <Route path="/locaties" element={<Locations />} />
        <Route path="/ijkpunten" element={<Checkpoints />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/instellingen" element={<Settings />} />
        <Route path="/help" element={<Help />} />
      </Routes>
      <BottomNav />
    </>
  );
}
