import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function Products() {
  const [data, setData] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [partnerId, setPartnerId] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setData(response.data);
    } catch (error) {
      toast.error(t('common.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const response = await axios.get('/api/partners');
      setPartners(response.data);
    } catch (error) {
      console.error('Error fetching partners', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPartners();
  }, [t]);

  const openAddModal = () => {
    setModalMode('add');
    setName('');
    setCode('');
    setPartnerId('');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setCurrentId(product.id);
    setName(product.name);
    setCode(product.code);
    setPartnerId(product.partnerId);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !code || !partnerId) {
      toast.error(t('products.missingInfo'));
      return;
    }

    try {
      if (modalMode === 'add') {
        await axios.post('/api/products', { name, code, partnerId });
        toast.success(t('products.addSuccess'));
      } else {
        await axios.put(`/api/products/${currentId}`, { name, code, partnerId, status: 'ﾄ紳ng ho蘯｡t ﾄ黛ｻ冢g' });
        toast.success(t('products.updateSuccess'));
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cﾃｳ l盻擁 x蘯｣y ra!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('common.confirmDelete'))) {
      try {
        await axios.delete(`/api/products/${id}`);
        toast.success(t('products.deleteSuccess'));
        fetchProducts();
      } catch (error) {
        toast.error(t('common.errorDelete'));
      }
    }
  };

  const columns = [
    { field: 'id', title: t('common.stt'), width: '60px', align: 'center' },
    { field: 'partner', title: t('products.partner') },
    { field: 'name', title: t('products.name') },
    { field: 'code', title: t('products.code') },
    { 
      field: 'created', 
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
      <button className="btn-toolbar btn-view" onClick={fetchProducts}><Eye size={14} /> {t('common.view')}</button>
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
        <span>{t('sidebar.products')}</span>
      </div>
      
      <h2 className="page-title">{t('products.title')}</h2>
      
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
        title={modalMode === 'add' ? t('products.addTitle') : t('products.editTitle')}
      >
        <form onSubmit={handleSave}>
          <div>
            <label>{t('products.partner')}</label>
            <select 
              className="form-control-modal" 
              value={partnerId} 
              onChange={(e) => setPartnerId(e.target.value)}
            >
              <option value="">{t('products.selectPartner')}</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>{t('products.name')}</label>
            <input 
              type="text" 
              className="form-control-modal" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div>
            <label>{t('products.code')}</label>
            <input 
              type="text" 
              className="form-control-modal" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
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



