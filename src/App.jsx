import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import Products from './pages/Products';
import PackingList from './pages/PackingList';
import ReferenceDocs from './pages/ReferenceDocs';
import ScanTem from './pages/ScanTem';
import Roles from './pages/Roles';
import Accounts from './pages/Accounts';
import Logs from './pages/Logs';
import ImportData from './pages/ImportData';

// PrivateRoute đềEbảo vềEcác trang yêu cầu đăng nhập
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/partners" element={<PrivateRoute><Partners /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/packing-list" element={<PrivateRoute><PackingList /></PrivateRoute>} />
          <Route path="/reference-docs" element={<PrivateRoute><ReferenceDocs /></PrivateRoute>} />
          <Route path="/scan-tem" element={<PrivateRoute><ScanTem /></PrivateRoute>} />
          <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute><Logs /></PrivateRoute>} />
          <Route path="/import-data" element={<PrivateRoute><ImportData /></PrivateRoute>} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </>
  );
}

export default App;

