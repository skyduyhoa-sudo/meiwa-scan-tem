import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Vui lòng nhập tên đăng nhập và mật khẩu');
    
    setLoading(true);
    try {
      const response = await axios.post('/api/login', { username, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Đăng nhập thành công!');
        
        // Điều hướng dựa theo quyền:
        const role = response.data.user.role;
        if (role === 'Worker' || role === 'Công nhân') {
          navigate('/scan-tem');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>MEIWA SCAN TEM</h2>
          <p>HềEthống Quản lý Đối chiếu Hàng hóa</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nhập tên đăng nhập..."
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Nhập mật khẩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

