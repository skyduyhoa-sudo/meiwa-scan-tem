import { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ImportData.css';

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Vui lòng chọn file Excel trước khi upload!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Import dữ liệu thành công!');
        setResult({ success: true, message: response.data.message });
        setFile(null);
      } else {
        toast.error(response.data.message || 'Lỗi khi import dữ liệu');
        setResult({ success: false, message: response.data.message });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Có lỗi xảy ra khi tải file lên máy chủ.');
      setResult({ success: false, message: 'Lỗi máy chủ.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="import-container">
        <div className="import-header">
          <h2>Import Dữ Liệu Đối Chiếu (Lot Detail / Packing List)</h2>
          <p>Tải lên file Excel (.xlsx, .xls) để nạp dữ liệu vào hệ thống trước khi quét tem.</p>
        </div>

        <div className="import-card">
          <div className={`upload-zone ${file ? 'has-file' : ''}`}>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange} 
              id="file-upload" 
            />
            <label htmlFor="file-upload" className="upload-label">
              <FileSpreadsheet size={48} className="upload-icon" />
              {file ? (
                <div className="file-info">
                  <h3>{file.name}</h3>
                  <p>{(file.size / 1024).toFixed(2)} KB</p>
                  <span>Nhấn để chọn file khác</span>
                </div>
              ) : (
                <div className="upload-prompt">
                  <h3>Kéo thả file Excel vào đây hoặc Nhấn để chọn file</h3>
                  <p>Hỗ trợ định dạng .xlsx, .xls</p>
                </div>
              )}
            </label>
          </div>

          <div className="upload-actions">
            <button 
              className={`btn-upload ${!file || isUploading ? 'disabled' : ''}`} 
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <><Loader className="spin" size={18} /> Đang xử lý...</>
              ) : (
                <><Upload size={18} /> Bắt đầu Import</>
              )}
            </button>
          </div>

          {result && (
            <div className={`result-box ${result.success ? 'success' : 'error'}`}>
              {result.success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              <p>{result.message}</p>
            </div>
          )}
        </div>

        <div className="import-guide">
          <h3>Hướng dẫn cấu trúc file Excel</h3>
          <p>File Excel tải lên cần có Sheet đầu tiên chứa dữ liệu và dòng 1 là Tiêu đề cột (Header). Các tên cột cần thiết:</p>
          <ul>
            <li><strong>LotNo</strong> (Bắt buộc): Mã Lot (VD: VG52636-04A5)</li>
            <li><strong>Quantity</strong> (Bắt buộc): Số lượng (VD: 20000)</li>
            <li><strong>PoNumber</strong>: Mã P/O Khách hàng</li>
            <li><strong>CustomerCode</strong>: Mã SP Khách hàng (VD: Q110M252010S04-P1)</li>
            <li><strong>BoxNo</strong>: Số thùng (VD: 1)</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
