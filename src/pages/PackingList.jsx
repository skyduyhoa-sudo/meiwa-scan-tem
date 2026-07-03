import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Eye, Plus, Edit, Trash2, Download, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export default function PackingList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Modal Import Data
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPackingList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/packing-list');
      setData(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách Packing List');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingList();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Vui lòng chọn file để import!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setIsUploading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message || 'Import dữ liệu thành công!');
      setIsImportModalOpen(false);
      setSelectedFile(null);
      fetchPackingList(); // Reload table
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi import file!');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) return toast.warn('Không có dữ liệu để xuất');
    
    const exportData = data.map(item => ({
      'Ngày đóng gói': item.packDate,
      'Số Box': item.boxNo,
      'Mã Lô': item.lotNo,
      'Mã SP': item.code,
      'Item': item.item,
      'Hạng': item.rank,
      'Số lượng': item.quantity,
      'Tổng': item.total,
      'Bảo hành': item.warrantyPeriod,
      'Số Seri': item.seriNumber || '',
      'PO No': item.poNumber || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PackingList");
    XLSX.writeFile(workbook, `PackingList_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const columns = [
    { field: 'id', title: 'STT', width: '60px', align: 'center' },
    { field: 'boxNo', title: 'Box No' },
    { field: 'code', title: 'Code' },
    { field: 'lotNo', title: 'LotNo' },
    { field: 'item', title: 'Item' },
    { field: 'rank', title: 'Rank' },
    { field: 'quantity', title: 'Quantity' },
    { field: 'total', title: 'Total' },
    { field: 'packDate', title: 'Pack Date' },
    { field: 'poNumber', title: 'PO Number' },
    { field: 'warrantyPeriod', title: 'Warranty Period' },
    { field: 'seriNumber', title: 'Seri Number' },
  ];

  const toolbarButtons = (
    <>
      <button className="btn-toolbar btn-view"><Eye size={14} /> {t('common.view')}</button>
      <button className="btn-toolbar btn-scan" onClick={() => setIsImportModalOpen(true)}>
        <Download size={14} /> {t('common.importData')}
      </button>
      <button className="btn-toolbar btn-add" onClick={handleExport} style={{ backgroundColor: '#20c997' }}>
        <Download size={14} /> {t('common.exportExcel')}
      </button>
      <button className="btn-toolbar btn-add"><Plus size={14} /> {t('common.add')}</button>
      <button className="btn-toolbar btn-update"><Edit size={14} /> {t('common.edit')}</button>
      <button className="btn-toolbar btn-delete"><Trash2 size={14} /> {t('common.delete')}</button>
    </>
  );

  const filters = (
    <>
      <select defaultValue="">
        <option value="">{t('stampTypes.all')}</option>
        <option value="CD">{t('stampTypes.cd')}</option>
        <option value="CS">{t('stampTypes.cs')}</option>
        <option value="DC">{t('stampTypes.dc')}</option>
        <option value="CR">{t('stampTypes.cr')}</option>
      </select>
      <input type="text" style={{ flex: 1 }} />
      <button className="btn-toolbar btn-view"><Eye size={14} /> {t('common.view')}</button>
    </>
  );

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
        <div className="dot">●</div>
        <span>{t('sidebar.operations')}</span>
        <div className="dot">●</div>
        <span>{t('packingList.title')}</span>
      </div>
      
      <h2 className="page-title">{t('packingList.title')}</h2>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
      ) : (
        <GridTable 
          columns={columns} 
          data={data} 
          toolbarButtons={toolbarButtons} 
          filters={filters}
        />
      )}

      {/* Modal Import Data */}
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => !isUploading && setIsImportModalOpen(false)}
        title="Import Dữ Liệu Đa Định Dạng"
      >
        <form onSubmit={handleUpload}>
          <div style={{ padding: '20px', border: '2px dashed #ccc', textAlign: 'center', marginBottom: '20px', borderRadius: '8px' }}>
            <Upload size={40} color="#ccc" style={{ marginBottom: '10px' }} />
            <p>Kéo thả file vào đây hoặc nhấn để chọn file</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Hỗ trợ: .xlsx, .csv, .pdf, .docx, .png, .jpg</p>
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
            <button type="button" className="btn" onClick={() => setIsImportModalOpen(false)} disabled={isUploading}>Hủy</button>
            <button type="submit" className="btn green" disabled={isUploading || !selectedFile}>
              {isUploading ? 'Đang Import...' : 'Import ngay'}
            </button>
          </div>
        </form>
      </Modal>

    </AdminLayout>
  );
}
