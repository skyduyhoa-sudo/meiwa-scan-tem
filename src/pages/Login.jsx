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
    if (!username || !password) return toast.error('Vui lﾃｲng nh蘯ｭp tﾃｪn ﾄ惰ハg nh蘯ｭp vﾃ m蘯ｭt kh蘯ｩu');
    
    setLoading(true);
    try {
      const response = await axios.post('/api/login', { username, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('ﾄ斉ハg nh蘯ｭp thﾃnh cﾃｴng!');
        
        // ﾄ進盻「 hﾆｰ盻嬾g d盻ｱa theo quy盻］:
        const role = response.data.user.role;
        if (role === 'Worker' || role === 'Cﾃｴng nhﾃ｢n') {
          navigate('/scan-tem');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'L盻擁 k蘯ｿt n盻訴 mﾃ｡y ch盻ｧ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>MEIWA SCAN TEM</h2>
          <p>H盻・th盻創g Qu蘯｣n lﾃｽ ﾄ雪ｻ訴 chi蘯ｿu Hﾃng hﾃｳa</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label>Tﾃｪn ﾄ惰ハg nh蘯ｭp</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nh蘯ｭp tﾃｪn ﾄ惰ハg nh蘯ｭp..."
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>M蘯ｭt kh蘯ｩu</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Nh蘯ｭp m蘯ｭt kh蘯ｩu..."
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'ﾄ紳ng xﾃ｡c th盻ｱc...' : 'ﾄ斉ハg nh蘯ｭp'}
          </button>
        </form>
      </div>
    </div>
  );
}



