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
    text = text.replace('ﾄ静｣ import d盻ｯ li盻㎡ t盻ｫ file', '繝輔ぃ繧､繝ｫ縺九ｉ縺ｮ繝・・繧ｿ繧､繝ｳ繝昴・繝亥ｮ御ｺ・');
    text = text.replace('ﾄ静｣ thﾃｪm s蘯｣n ph蘯ｩm:', '陬ｽ蜩√ｒ霑ｽ蜉縺励∪縺励◆:');
    text = text.replace('ﾄ静｣ c蘯ｭp nh蘯ｭt s蘯｣n ph蘯ｩm:', '陬ｽ蜩√ｒ譖ｴ譁ｰ縺励∪縺励◆:');
    text = text.replace('ﾄ静｣ xﾃｳa s蘯｣n ph蘯ｩm:', '陬ｽ蜩√ｒ蜑企勁縺励∪縺励◆:');
    text = text.replace('ﾄ静｣ thﾃｪm ﾄ黛ｻ訴 tﾃ｡c:', '繝代・繝医リ繝ｼ繧定ｿｽ蜉縺励∪縺励◆:');
    text = text.replace('ﾄ静｣ c蘯ｭp nh蘯ｭt ﾄ黛ｻ訴 tﾃ｡c:', '繝代・繝医リ繝ｼ繧呈峩譁ｰ縺励∪縺励◆:');
    text = text.replace('ﾄ静｣ xﾃｳa ﾄ黛ｻ訴 tﾃ｡c:', '繝代・繝医リ繝ｼ繧貞炎髯､縺励∪縺励◆:');
    text = text.replace('ﾄ斉ハg nh蘯ｭp khﾃｴng thﾃnh cﾃｴng', '繝ｭ繧ｰ繧､繝ｳ縺ｫ螟ｱ謨励＠縺ｾ縺励◆');
    text = text.replace('ﾄ斉ハg nh蘯ｭp h盻・th盻創g', '繧ｷ繧ｹ繝・Β縺ｫ繝ｭ繧ｰ繧､繝ｳ縺励∪縺励◆');
    text = text.replace('ﾄ静｣ thﾃｪm tﾃi kho蘯｣n:', '繧｢繧ｫ繧ｦ繝ｳ繝医ｒ霑ｽ蜉縺励∪縺励◆:');
    
    return text;
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/logs');
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
    if (data.length === 0) return toast.warn('Khﾃｴng cﾃｳ d盻ｯ li盻㎡ ﾄ黛ｻ・xu蘯･t');
    
    // Chu蘯ｩn b盻・d盻ｯ li盻㎡ cho Excel
    const exportData = data.map(item => ({
      'ID': item.id,
      'Lo蘯｡i': item.type === 'ERROR' ? 'L盻擁' : 'Thﾃｴng bﾃ｡o',
      'N盻冓 dung': item.message,
      'Th盻拱 gian': new Date(item.createdAt).toLocaleString('vi-VN')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");
    
    // T蘯｣i file xu盻創g
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
        <div className="dot"></div>
        <span>{t('sidebar.system')}</span>
        <div className="dot"></div>
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



