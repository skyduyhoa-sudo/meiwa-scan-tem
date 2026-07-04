import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Eye, Download, Upload, FileText, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ReferenceDocs.css'; // Will create this for tabs

export default function ReferenceDocs() {
  const [activeTab, setActiveTab] = useState('invoice'); // 'invoice' | 'process_doc'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Modal Import Data
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'invoice' ? '/api/invoices' : '/api/process-docs';
      const response = await axios.get(`${endpoint}`);
      setData(response.data);
    } catch (error) {
      toast.error(t('common.errorFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Vui lòng chọn file đềEimport!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('docType', activeTab); // 'invoice' or 'process_doc'

    setIsUploading(true);
    try {
      const response = await axios.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || 'Import dữ liệu thành công!');
      setIsImportModalOpen(false);
      setSelectedFile(null);
      fetchData(); // Reload table
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi import file!');
    } finally {
      setIsUploading(false);
    }
  };

  const invoiceColumns = [
    { field: 'id', title: t('common.stt'), width: '60px', align: 'center' },
    { field: 'invoiceNo', title: t('reference.invoiceNo') },
    { field: 'poNumber', title: t('reference.poNumber') },
    { field: 'code', title: t('reference.code') },
    { field: 'quantity', title: t('reference.quantity') },
    { 
      field: 'createdAt', 
      title: t('common.createdAt'), 
      align: 'center',
      render: (val) => new Date(val).toLocaleString('vi-VN')
    }
  ];

  const processDocColumns = [
    { field: 'id', title: t('common.stt'), width: '60px', align: 'center' },
    { field: 'docNo', title: t('reference.docNo') },
    { field: 'code', title: t('reference.code') },
    { field: 'lotNo', title: t('reference.lotNo') },
    { field: 'quantity', title: t('reference.quantity') },
    { 
      field: 'createdAt', 
      title: t('common.createdAt'), 
      align: 'center',
      render: (val) => new Date(val).toLocaleString('vi-VN')
    }
  ];

  const toolbarButtons = (
    <>
      <button className="btn-toolbar btn-scan" onClick={() => setIsImportModalOpen(true)}>
        <Download size={14} /> {activeTab === 'invoice' ? t('reference.importInvoice') : t('reference.importProcessDoc')}
      </button>
      <button className="btn-toolbar btn-view" onClick={fetchData}><Eye size={14} /> {t('common.view')}</button>
    </>
  );

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
        <div className="dot">◁E/div>
        <span>{t('sidebar.operations')}</span>
        <div className="dot">◁E/div>
        <span>{t('sidebar.referenceDocs')}</span>
      </div>
      
      <h2 className="page-title">{t('reference.title')}</h2>
      
      <div className="tabs-container">
        <div 
          className={`tab-item ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          <FileText size={16} /> {t('reference.tabInvoice')}
        </div>
        <div 
          className={`tab-item ${activeTab === 'process_doc' ? 'active' : ''}`}
          onClick={() => setActiveTab('process_doc')}
        >
          <Settings size={16} /> {t('reference.tabProcessDoc')}
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
        ) : (
          <GridTable 
            columns={activeTab === 'invoice' ? invoiceColumns : processDocColumns} 
            data={data} 
            toolbarButtons={toolbarButtons} 
          />
        )}
      </div>

      {/* Modal Import Data */}
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => !isUploading && setIsImportModalOpen(false)}
        title={activeTab === 'invoice' ? t('reference.importInvoice') : t('reference.importProcessDoc')}
      >
        <form onSubmit={handleUpload}>
          <div style={{ padding: '20px', border: '2px dashed #ccc', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            <Upload size={40} color="#ccc" style={{ marginBottom: '10px' }} />
            <p>Kéo thả file vào đây hoặc nhấn đềEchọn file</p>
            <p style={{ fontSize: '12px', color: '#666' }}>HềEtrợ: .xlsx, .csv, .pdf, .docx, .png, .jpg</p>
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv,.pdf,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              style={{ marginTop: '15px' }}
            />
          </div>

          {isUploading && (
            <div style={{ textAlign: 'center', marginBottom: '15px', color: '#32c5d2', fontWeight: 'bold' }}>
              Đang xử lý tài liệu (OCR / Parse)... Vui lòng đợi.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn" onClick={() => setIsImportModalOpen(false)} disabled={isUploading}>{t('common.cancel')}</button>
            <button type="submit" className="btn green" disabled={isUploading || !selectedFile}>
              {isUploading ? 'Đang Import...' : t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

    </AdminLayout>
  );
}

