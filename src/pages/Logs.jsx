import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import { Home, Eye, FileText, Download } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

export default function Logs() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, i18n } = useTranslation();

  const translateLogMessage = (msg) => {
    if (i18n.language !== 'ja') return msg;
    if (!msg) return msg;
    
    let text = msg;
    text = text.replace('Đã import dữ liệu từ file', 'ファイルからのデータインポート完了:');
    text = text.replace('Đã thêm sản phẩm:', '製品を追加しました:');
    text = text.replace('Đã cập nhật sản phẩm:', '製品を更新しました:');
    text = text.replace('Đã xóa sản phẩm:', '製品を削除しました:');
    text = text.replace('Đã thêm đối tác:', 'パートナーを追加しました:');
    text = text.replace('Đã cập nhật đối tác:', 'パートナーを更新しました:');
    text = text.replace('Đã xóa đối tác:', 'パートナーを削除しました:');
    text = text.replace('Đăng nhập không thành công', 'ログインに失敗しました');
    text = text.replace('Đăng nhập hệ thống', 'システムにログインしました');
    text = text.replace('Đã thêm tài khoản:', 'アカウントを追加しました:');
    
    return text;
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/logs');
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

  const columns = [
    { field: 'id', title: 'ID', width: '60px', align: 'center' },
    { 
      field: 'type', 
      title: t('logs.type'), 
      width: '120px',
      align: 'center',
      render: (val) => (
        <span style={{ 
          color: val === 'ERROR' ? '#e73d4a' : '#32c5d2',
          fontWeight: 'bold'
        }}>
          {val === 'ERROR' ? t('logs.error') : t('logs.info')}
        </span>
      )
    },
    { 
      field: 'message', 
      title: t('logs.message'),
      render: (val) => translateLogMessage(val)
    },
    { 
      field: 'createdAt', 
      title: t('common.createdAt'), 
      align: 'center',
      width: '200px',
      render: (val) => new Date(val).toLocaleString('vi-VN')
    }
  ];

  const handleExport = () => {
    if (data.length === 0) return toast.warn('Không có dữ liệu để xuất');
    
    // Chuẩn bị dữ liệu cho Excel
    const exportData = data.map(item => ({
      'ID': item.id,
      'Loại': item.type === 'ERROR' ? 'Lỗi' : 'Thông báo',
      'Nội dung': item.message,
      'Thời gian': new Date(item.createdAt).toLocaleString('vi-VN')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
    
    // Tải file xuống
    XLSX.writeFile(workbook, `NhatKy_HeThong_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const toolbarButtons = (
    <>
      <button className="btn-toolbar btn-view" onClick={fetchData}><Eye size={14} /> {t('common.view')}</button>
      <button className="btn-toolbar btn-add" onClick={handleExport} style={{ backgroundColor: '#20c997' }}><Download size={14} /> {t('common.exportExcel')}</button>
    </>
  );

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
        <div className="dot">●</div>
        <span>{t('sidebar.system')}</span>
        <div className="dot">●</div>
        <span>{t('sidebar.logs')}</span>
      </div>
      
      <h2 className="page-title"><FileText size={20} style={{marginRight: 10, verticalAlign: 'middle'}}/>{t('logs.title')}</h2>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
      ) : (
        <GridTable columns={columns} data={data} toolbarButtons={toolbarButtons} />
      )}
    </AdminLayout>
  );
}
