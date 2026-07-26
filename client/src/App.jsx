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
import Booking  from './pages/Booking';
import Users    from './pages/Users';
import AuditLog from './pages/AuditLog';
import EmailLog from './pages/EmailLog';
import Analytics from './pages/Analytics';
import Predictions from './pages/AIPredictions';
import Classroom from './pages/Classroom';
import ChangePassword from './pages/ChangePassword';
import { LabProvider } from './context/LabContext';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/booking" />;
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
      <Route path="/login" element={user ? <Navigate to={user.role === "student" || user.role === "invigilator" ? "/booking" : "/dashboard"} /> : <Login />} />
      <Route path="/dashboard"   element={<PrivateRoute roles={['admin','staff']}><Dashboard /></PrivateRoute>} />
      <Route path="/lab-map"     element={<PrivateRoute roles={['admin','staff']}><LabMap /></PrivateRoute>} />
      <Route path="/machines/:id" element={<PrivateRoute roles={['admin','staff']}><MachineDetail /></PrivateRoute>} />
      <Route path="/classroom" element={<PrivateRoute roles={['admin','staff','invigilator']}><Classroom /></PrivateRoute>} />
      <Route path="/exam"        element={<PrivateRoute roles={['admin','staff','invigilator']}><ExamSetup /></PrivateRoute>} />
      <Route path="/exam/war-room/:id" element={<PrivateRoute roles={['admin','staff','invigilator']}><ExamWarRoom /></PrivateRoute>} />
      <Route path="/exam/student/:sessionId/:machineId" element={<ExamStudent />} />
      <Route path="/equipment"   element={<PrivateRoute roles={['admin','staff']}><Equipment /></PrivateRoute>} />
      <Route path="/maintenance" element={<PrivateRoute roles={['admin','staff']}><Maintenance /></PrivateRoute>} />
      <Route path="/complaints"  element={<PrivateRoute><Complaints /></PrivateRoute>} />
      <Route path="/inventory"   element={<PrivateRoute roles={['admin','staff']}><Inventory /></PrivateRoute>} />
      <Route path="/predictions" element={<PrivateRoute roles={['admin','staff']}><Predictions /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute roles={['admin']}><Analytics /></PrivateRoute>} />
      <Route path="/booking" element={<PrivateRoute><Booking /></PrivateRoute>} />
      <Route path="/users"   element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
      <Route path="/emaillog" element={<PrivateRoute roles={['admin','staff']}><EmailLog /></PrivateRoute>} />
      <Route path="/audit"   element={<PrivateRoute roles={['admin']}><AuditLog /></PrivateRoute>} />
      <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
      <Route path="/" element={<Navigate to={user ? (user.role === 'student' || user.role === 'invigilator' ? '/booking' : '/dashboard') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LabProvider>
     <AppRoutes />
        </LabProvider>
    </AuthProvider>
   </BrowserRouter> 
  );
}
