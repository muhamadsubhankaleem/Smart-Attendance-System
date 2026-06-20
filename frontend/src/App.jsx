import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import AttendanceRecords from './pages/AttendanceRecords';
import ThemeSwitcher from './ThemeSwitcher';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login isRegister />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/attendance" element={<AttendanceRecords />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global floating theme switcher — visible on every page */}
      <ThemeSwitcher />
    </BrowserRouter>
  );
}
