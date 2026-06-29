import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LabMap from './pages/LabMap';
import MachineDetail from './pages/MachineDetail';
import Equipment from './pages/Equipment';
import Maintenance from './pages/Maintenance';
import Complaints from './pages/Complaints';
import Inventory from './pages/Inventory';
import ExamSetup from './pages/ExamSetup';
import ExamWarRoom from './pages/ExamWarRoom';
import ExamStudent from './pages/ExamStudent';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
}

function Placeholder({ title }) {
  return (
    <div style={{ padding:28 }}>
      <h1 style={{ fontSize:24, fontWeight:700, color:'#1a1a2e' }}>{title}</h1>
      <p style={{ color:'#888', marginTop:8 }}>Coming soon — being built step by step.</p>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard"   element={<PrivateRoute roles={['admin','staff']}><Dashboard /></PrivateRoute>} />
      <Route path="/lab-map"     element={<PrivateRoute roles={['admin','staff']}><LabMap /></PrivateRoute>} />
      <Route path="/machines/:id" element={<PrivateRoute roles={['admin','staff']}><MachineDetail /></PrivateRoute>} />
      <Route path="/classroom"   element={<PrivateRoute roles={['admin','staff','invigilator']}><Placeholder title="Classroom Mode" /></PrivateRoute>} />
      <Route path="/exam"        element={<PrivateRoute roles={['admin','staff','invigilator']}><ExamSetup /></PrivateRoute>} />
      <Route path="/exam/war-room/:id" element={<PrivateRoute roles={['admin','staff','invigilator']}><ExamWarRoom /></PrivateRoute>} />
      <Route path="/exam/student/:sessionId/:machineId" element={<ExamStudent />} />
      <Route path="/equipment"   element={<PrivateRoute roles={['admin','staff']}><Equipment /></PrivateRoute>} />
      <Route path="/maintenance" element={<PrivateRoute roles={['admin','staff']}><Maintenance /></PrivateRoute>} />
      <Route path="/complaints"  element={<PrivateRoute><Complaints /></PrivateRoute>} />
      <Route path="/inventory"   element={<PrivateRoute roles={['admin','staff']}><Inventory /></PrivateRoute>} />
      <Route path="/predictions" element={<PrivateRoute roles={['admin','staff']}><Placeholder title="AI Predictions" /></PrivateRoute>} />
      <Route path="/booking"     element={<PrivateRoute><Placeholder title="Lab Booking" /></PrivateRoute>} />
      <Route path="/analytics"   element={<PrivateRoute roles={['admin']}><Placeholder title="Analytics" /></PrivateRoute>} />
      <Route path="/users"       element={<PrivateRoute roles={['admin']}><Placeholder title="Users" /></PrivateRoute>} />
      <Route path="/audit"       element={<PrivateRoute roles={['admin']}><Placeholder title="Audit Log" /></PrivateRoute>} />
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
