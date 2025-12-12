import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StoreHome from './pages/Store/Home';
import DashboardPriceMonitor from './pages/Dashboard/PriceMonitor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/store" replace />} />
          <Route path="store" element={<StoreHome />} />
          <Route path="dashboard" element={<Navigate to="/dashboard/monitor" replace />} />
          <Route path="dashboard/monitor" element={<DashboardPriceMonitor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
