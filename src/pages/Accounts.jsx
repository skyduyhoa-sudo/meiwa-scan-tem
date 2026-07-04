import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Eye, Plus, Edit, Trash2, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function Accounts() {
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentId, setCurrentId] = useState(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/accounts');
      setData(response.data);
    } catch (error) {
      toast.error(t('common.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/roles');
      setRoles(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [t]);

  const openAddModal = () => {
    setModalMode('add');
    setUsername('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRoleId('');
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setModalMode('edit');
    setCurrentId(account.id);
    setUsername(account.username);
    setPassword(''); // Không hiển thềEpassword cũ
    setFirstName(account.firstName);
    setLastName(account.lastName);
    setRoleId(account.roleId);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username || !firstName || !roleId) return toast.error('Vui lòng điền đủ thông tin bắt buộc');

    try {
      if (modalMode === 'add') {
        if (!password) return toast.error('Vui lòng nhập mật khẩu');
        await axios.post('/api/accounts', { username, password, firstName, lastName, roleId });
        toast.success(t('accounts.addSuccess'));
      } else {
        await axios.put(`/api/accounts/${currentId}`, { username, firstName, lastName, roleId, status: 'Đang hoạt động' });
        toast.success(t('accounts.updateSuccess'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi lưu dữ liệu');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await axios.delete(`/api/accounts/${id}`);
        toast.success(t('accounts.deleteSuccess'));
        fetchData();
      } catch (error) {
        toast.error(t('common.errorDelete'));
      }
    }
  };

  const columns = [
    { field: 'id', title: 'ID', width: '60px', align: 'center' },
    { field: 'username', title: t('accounts.username') },
    { 
      field: 'fullName', 
      title: t('accounts.fullName'),
      render: (_, row) => `${row.lastName} ${row.firstName}`
    },
    { 
      field: 'role', 
      title: t('accounts.role'),
      render: (_, row) => row.role?.name || ''
    },
    { 
      field: 'createdAt', 
      title: t('common.createdAt'), 
      align: 'center',
      render: (val) => new Date(val).toLocaleString('vi-VN')
    },
    { 
      field: 'status', 
      title: t('common.status'), 
      align: 'center',
      render: (val) => <span className="status-badge">{t('common.active')}</span>
    },
    {
      field: 'actions',
      title: t('common.actions'),
      align: 'center',
      width: '100px',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          <button style={{ border: 'none', background: 'transparent', color: '#337ab7', cursor: 'pointer' }} onClick={() => openEditModal(row)}><Edit size={16}/></button>
          <button style={{ border: 'none', background: 'transparent', color: '#e73d4a', cursor: 'pointer' }} onClick={() => handleDelete(row.id)}><Trash2 size={16}/></button>
        </div>
      )
    }
  ];

  const toolbarButtons = (
    <>
      <button className="btn-toolbar btn-view" onClick={fetchData}><Eye size={14} /> {t('common.view')}</button>
      <button className="btn-toolbar btn-add" onClick={openAddModal}><Plus size={14} /> {t('common.add')}</button>
    </>
  );

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
        <div className="dot">◁E/div>
        <span>{t('sidebar.system')}</span>
        <div className="dot">◁E/div>
        <span>{t('sidebar.accounts')}</span>
      </div>
      
      <h2 className="page-title">{t('accounts.title')}</h2>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
      ) : (
        <GridTable columns={columns} data={data} toolbarButtons={toolbarButtons} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? t('accounts.addTitle') : t('accounts.editTitle')}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label>{t('accounts.lastName')}</label>
              <input type="text" className="form-control-modal" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>{t('accounts.firstName')}</label>
              <input type="text" className="form-control-modal" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
          </div>
          <div>
            <label>{t('accounts.username')}</label>
            <input type="text" className="form-control-modal" value={username} onChange={(e) => setUsername(e.target.value)} disabled={modalMode === 'edit'} />
          </div>
          {modalMode === 'add' && (
            <div>
              <label>{t('accounts.password')}</label>
              <input type="password" className="form-control-modal" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <div>
            <label>{t('accounts.role')}</label>
            <select className="form-control-modal" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">{t('accounts.selectRole')}</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn green">{t('common.save')}</button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}

