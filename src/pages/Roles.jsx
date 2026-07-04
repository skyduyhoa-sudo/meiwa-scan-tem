import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Eye, Plus, Edit, Trash2, Shield } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function Roles() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentId, setCurrentId] = useState(null);
  
  const [name, setName] = useState('');

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/roles');
      setData(response.data);
    } catch (error) {
      toast.error(t('common.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [t]);

  const openAddModal = () => {
    setModalMode('add');
    setName('');
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setModalMode('edit');
    setCurrentId(role.id);
    setName(role.name);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name) return toast.error(t('roles.missingInfo') || 'Vui lﾃｲng ﾄ訴盻］ tﾃｪn vai trﾃｲ');

    try {
      if (modalMode === 'add') {
        await axios.post('/api/roles', { name });
        toast.success(t('roles.addSuccess'));
      } else {
        await axios.put(`/api/roles/${currentId}`, { name, status: 'ﾄ紳ng ho蘯｡t ﾄ黛ｻ冢g' });
        toast.success(t('roles.updateSuccess'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('L盻擁 khi lﾆｰu d盻ｯ li盻㎡');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await axios.delete(`/api/roles/${id}`);
        toast.success(t('roles.deleteSuccess'));
        fetchData();
      } catch (error) {
        toast.error(t('common.errorDelete'));
      }
    }
  };

  const columns = [
    { field: 'id', title: 'ID', width: '60px', align: 'center' },
    { field: 'name', title: t('roles.name') },
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
        <div className="dot"></div>
        <span>{t('sidebar.system')}</span>
        <div className="dot"></div>
        <span>{t('sidebar.roles')}</span>
      </div>
      
      <h2 className="page-title">{t('roles.title')}</h2>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
      ) : (
        <GridTable columns={columns} data={data} toolbarButtons={toolbarButtons} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'add' ? t('roles.addTitle') : t('roles.editTitle')}>
        <form onSubmit={handleSave}>
          <div>
            <label>{t('roles.name')}</label>
            <input type="text" className="form-control-modal" value={name} onChange={(e) => setName(e.target.value)} />
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



