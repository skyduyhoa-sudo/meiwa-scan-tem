import { useState, useRef } from 'react';
import { Menu, ChevronDown, Home, List, Package, Scan, Settings, User, Shield, LogOut, Key, Users, FileText, Save, X, UploadCloud } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [profileForm, setProfileForm] = useState({ 
    lastName: 'Công ty', 
    firstName: 'Meiwa', 
    dob: '', 
    gender: 'Nam', 
    avatar: null 
  });
  const [pwdError, setPwdError] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleChangePasswordSubmit = async (e) => {
    // ... code cũ của đổi mật khẩu
    e.preventDefault();
    setPwdError('');
    if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      setPwdError('Vui lòng nhập đầy đủ thông tin (*)');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await axios.post('/api/change-password', {
        username: user.username,
        oldPassword: pwdForm.oldPassword,
        newPassword: pwdForm.newPassword
      });
      if (res.data.success) {
        toast.success('Đổi mật khẩu thành công!');
        setIsPasswordModalOpen(false);
        setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setUserMenuOpen(false);
      }
    } catch (error) {
      setPwdError(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    }
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await axios.post('/api/update-profile', {
        username: user.username,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        dob: profileForm.dob,
        gender: profileForm.gender,
        avatarUrl: ''
      });
      if (res.data.success) {
        toast.success('Đổi thông tin cá nhân thành công!');
        
        // Update local storage user
        const updatedUser = { ...user, fullName: `${profileForm.lastName} ${profileForm.firstName}` };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setIsProfileModalOpen(false);
        setUserMenuOpen(false);
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật thông tin');
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = i18n.language || 'vi';

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const displayName = (user.fullName || 'Công ty Việt Nam Meiwa').replace(/Viết Nam/g, 'Việt Nam').replace(/Miewa/g, 'Meiwa');
  const role = user.role || '';
  const isWorker = role === 'Worker' || role === 'Công nhân';

  const menuItems = [
    { title: t('sidebar.dashboard'), icon: Home, path: '/dashboard', hidden: isWorker },
    { title: t('sidebar.catalog'), isCategory: true, hidden: isWorker },
    { title: t('sidebar.partners'), icon: Users, path: '/partners', hidden: isWorker },
    { title: t('sidebar.products'), icon: Package, path: '/products', hidden: isWorker },
    { title: t('sidebar.operations'), isCategory: true },
    { title: t('sidebar.packingList'), icon: FileText, path: '/packing-list', hidden: isWorker },
    { title: t('sidebar.referenceDocs'), icon: FileText, path: '/reference-docs', hidden: isWorker },
    { title: t('sidebar.importData', { defaultValue: 'Import Dữ Liệu' }), icon: UploadCloud, path: '/import-data', hidden: isWorker },
    { title: t('sidebar.scanTem'), icon: Scan, path: '/scan-tem' },
    { title: t('sidebar.system'), isCategory: true, hidden: isWorker },
    { title: t('sidebar.roles'), icon: Shield, path: '/roles', hidden: isWorker },
    { title: t('sidebar.accounts'), icon: Users, path: '/accounts', hidden: isWorker },
    { title: t('sidebar.logs'), icon: List, path: '/logs', hidden: isWorker },
  ].filter(item => !item.hidden);



  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="admin-container" style={{ flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          MEIWA
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item, index) => (
              item.isCategory ? (
                <li key={index} className="nav-category">
                  {item.title}
                </li>
              ) : (
                <li key={index} className="nav-item">
                  <Link 
                    to={item.path} 
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    <item.icon size={18} />
                    <span>{item.title}</span>
                  </Link>
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h1 style={{ 
              margin: 0, 
              fontSize: '14px', 
              fontWeight: '800', 
              color: '#fff', 
              letterSpacing: '0.5px', 
              textTransform: 'uppercase',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2), 2px 2px 4px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap'
            }}>
              <span className="company-name">Công Ty TNHH Việt Nam </span>MEIWA
            </h1>
          </div>
          
          {/* Language Switcher - Centered */}
          <div className="lang-switcher" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => changeLanguage('vi')}
              style={{ 
                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px',
                fontWeight: currentLang.includes('vi') ? 'bold' : 'normal',
                color: currentLang.includes('vi') ? '#ff5252' : 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s', textShadow: currentLang.includes('vi') ? '0 0 8px rgba(255,82,82,0.6)' : 'none'
              }}
            >
              Vietnamese
            </button>
            <span style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '0 5px' }}>|</span>
            <button 
              onClick={() => changeLanguage('ja')}
              style={{ 
                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '15px',
                fontWeight: currentLang.includes('ja') ? 'bold' : 'normal',
                color: currentLang.includes('ja') ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s', textShadow: currentLang.includes('ja') ? '0 0 8px rgba(255,255,255,0.8)' : 'none'
              }}
            >
              Japanese
            </button>
          </div>
          
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            
            {/* User Dropdown */}
            <div className="user-profile">
              <div 
                className="user-info" 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <div className="avatar">
                  <User size={20} />
                </div>
                <span>{displayName}</span>
                <ChevronDown size={16} />
              </div>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header" style={{ padding: '12px 15px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                    <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{displayName}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Quản trị viên</div>
                  </div>
                  <div className="dropdown-item" onClick={() => { setIsProfileModalOpen(true); setUserMenuOpen(false); }} style={{ marginTop: '5px' }}>
                    <User size={15} style={{ color: '#32c5d2' }}/> <span style={{ fontWeight: '500' }}>{t('header.profile')}</span>
                  </div>
                  <div className="dropdown-item" onClick={() => { setIsPasswordModalOpen(true); setUserMenuOpen(false); }}>
                    <Key size={15} style={{ color: '#32c5d2' }}/> <span style={{ fontWeight: '500' }}>{t('header.changePassword')}</span>
                  </div>
                  <div className="dropdown-divider" style={{ borderBottom: '1px solid #eee', margin: '5px 0' }}></div>
                  <div className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={15} style={{ color: '#e73d4a' }}/> <span style={{ fontWeight: '500', color: '#e73d4a' }}>{t('header.logout')}</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </div>

      {/* Modal Đổi Mật Khẩu */}
      {isPasswordModalOpen && (
        <Modal isOpen={true} title="Đổi mật khẩu" onClose={() => setIsPasswordModalOpen(false)}>
          <form onSubmit={handleChangePasswordSubmit} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ width: '150px', textAlign: 'right', paddingRight: '20px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                Mật khẩu cũ <span style={{ color: 'red' }}>*</span>
              </label>
              <input 
                type="password" 
                className="form-control" 
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={pwdForm.oldPassword}
                onChange={e => setPwdForm({...pwdForm, oldPassword: e.target.value})}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ width: '150px', textAlign: 'right', paddingRight: '20px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                Mật khẩu mới <span style={{ color: 'red' }}>*</span>
              </label>
              <input 
                type="password" 
                className="form-control" 
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={pwdForm.newPassword}
                onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ width: '150px', textAlign: 'right', paddingRight: '20px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span>
              </label>
              <input 
                type="password" 
                className="form-control" 
                style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                value={pwdForm.confirmPassword}
                onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})}
              />
            </div>

            {pwdError && (
              <div style={{ paddingLeft: '150px', color: '#e73d4a', fontSize: '13px', marginBottom: '15px' }}>
                {pwdError}
              </div>
            )}

            <div style={{ borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                onClick={() => setIsPasswordModalOpen(false)}
                style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <X size={14}/> Hủy
              </button>
              <button 
                type="submit"
                style={{ backgroundColor: '#3498db', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Save size={14}/> Lưu
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Đổi Thông Tin Cá Nhân */}
      {isProfileModalOpen && (
        <Modal isOpen={true} title="Đổi thông tin cá nhân" onClose={() => setIsProfileModalOpen(false)}>
          <form onSubmit={handleUpdateProfileSubmit} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                  HềEtên lót <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={profileForm.lastName}
                  onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                  Tên <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={profileForm.firstName}
                  onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                  Ngày sinh
                </label>
                <input 
                  type="date" 
                  className="form-control" 
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={profileForm.dob}
                  onChange={e => setProfileForm({...profileForm, dob: e.target.value})}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                  Giới tính
                </label>
                <select 
                  className="form-control" 
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={profileForm.gender}
                  onChange={e => setProfileForm({...profileForm, gender: e.target.value})}
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', fontSize: '13px', color: '#555' }}>
                Ảnh đại diện
              </label>
              <div style={{ border: '1px solid #3498db', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#3498db', color: '#fff', padding: '10px 15px', fontSize: '13px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="fa fa-paperclip"></i> TềE ĐÍNH KÁE</span>
                  <ChevronDown size={14} />
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ border: '1px solid #ddd', backgroundColor: '#fff', padding: '20px', textAlign: 'center' }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfileForm({...profileForm, avatar: e.target.files[0]});
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current.click()}
                      style={{ border: '1px solid #ccc', background: '#f5f5f5', padding: '6px 15px', cursor: 'pointer', marginBottom: '10px' }}
                    >
                      {profileForm.avatar ? profileForm.avatar.name : 'Chọn tệp tin...'}
                    </button>
                    {profileForm.avatar && (
                      <div style={{ marginBottom: '10px', color: '#32c5d2', fontSize: '13px', fontWeight: 'bold' }}>
                        Đã chọn 1 tệp ✁E                      </div>
                    )}
                    <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                       EBạn chềEcó thềEtải lên tệp có định dạng <i>Ảnh (jpg, png, jpeg)</i> và kích thước không quá <i>10MB</i>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <button 
                type="button" 
                onClick={() => setIsProfileModalOpen(false)}
                style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <X size={14}/> Hủy
              </button>
              <button 
                type="submit"
                style={{ backgroundColor: '#3498db', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Save size={14}/> Lưu
              </button>
            </div>
          </form>
        </Modal>
      )}
      </div>
      
      {/* Footer */}
      <footer style={{ 
        background: 'linear-gradient(90deg, #0d47a1 0%, #1565c0 100%)', 
        padding: '10px 20px', 
        display: 'flex', 
        alignItems: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)'
      }}>
        <span style={{ color: '#e3f2fd', fontSize: '12px', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          @2026 - Designed by 
        </span>
        <span style={{ color: '#fff', fontSize: '12px', marginLeft: '5px', fontWeight: 'bold', textShadow: '1px 1px 0px rgba(255,255,255,0.2), 2px 2px 3px rgba(0,0,0,0.8)' }}>
          Duy Hoà Meiwa
        </span>
      </footer>
    </div>
  );
}

