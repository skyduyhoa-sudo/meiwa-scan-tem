import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function Partners() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [fullName, setFullName] = useState('');

  const fetchPartners = async () => {
    try {
      const response = await axios.get('/api/partners');
      setData(response.data);
    } catch (error) {
      toast.error(t('common.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [t]);

  const openAddModal = () => {
    setModalMode('add');
    setName('');
    setFullName('');
    setIsModalOpen(true);
  };

  const openEditModal = (partner) => {
    setModalMode('edit');
    setCurrentId(partner.id);
    setName(partner.name);
    setFullName(partner.fullName);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !fullName) {
      toast.error(t('partners.missingInfo'));
      return;
    }

    try {
      if (modalMode === 'add') {
        await axios.post('/api/partners', { name, fullName });
        toast.success(t('partners.addSuccess'));
      } else {
        await axios.put(`/api/partners/${currentId}`, { name, fullName, status: 'ﾄ紳ng ho蘯｡t ﾄ黛ｻ冢g' });
        toast.success(t('partners.updateSuccess'));
      }
      setIsModalOpen(false);
      fetchPartners();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cﾃｳ l盻擁 x蘯｣y ra!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await axios.delete(`/api/partners/${id}`);
        toast.success(t('partners.deleteSuccess'));
        fetchPartners();
      } catch (error) {
        toast.error(t('common.errorDelete'));
      }
    }
  };

  const columns = [
    { field: 'id', title: t('common.stt'), width: '60px', align: 'center' },
    { field: 'name', title: t('partners.name') },
    { field: 'fullName', title: t('partners.fullName') },
    { 
      field: 'createdAt', 
      title: t('common.createdAt'), 
      align: 'center',
      render: (val) => new Date(val).toLocaleString('vi-VN')
    },
    { 
      field: 'updatedAt', 
      title: t('common.updatedAt'), 
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
      <button className="btn-toolbar btn-view" onClick={fetchPartners}><Eye size={14} /> {t('common.view')}</button>
      <button className="btn-toolbar btn-add" onClick={openAddModal}><Plus size={14} /> {t('common.add')}</button>
    </>
  );

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
        <div className="dot"></div>
        <span>{t('sidebar.categories')}</span>
        <div className="dot"></div>
        <span>{t('sidebar.partners')}</span>
      </div>
      
      <h2 className="page-title">{t('partners.title')}</h2>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
      ) : (
        <GridTable 
          columns={columns} 
          data={data} 
          toolbarButtons={toolbarButtons} 
        />
      )}

      {/* Modal Thﾃｪm/S盻ｭa */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? t('partners.addTitle') : t('partners.editTitle')}
      >
        <form onSubmit={handleSave}>
          <div>
            <label>{t('partners.name')}</label>
            <input 
              type="text" 
              className="form-control-modal" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div>
            <label>{t('partners.fullName')}</label>
            <input 
              type="text" 
              className="form-control-modal" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
            />
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



