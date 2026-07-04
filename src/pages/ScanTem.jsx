import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import Modal from '../components/Modal';
import { Home, Scan, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ScanTem.css';

export default function ScanTem() {
  const [data, setData] = useState([]);
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  
  // States cho quá trình scan
  const [barcode, setBarcode] = useState('');
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);
  
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/packing-list');
      setData(response.data);

      const pResponse = await axios.get('/api/partners');
      setPartners(pResponse.data);

      const prResponse = await axios.get('/api/products');
      setProducts(prResponse.data);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu đối chiếu');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Luôn auto-focus vào ô input khi Modal Scan đang mềE  useEffect(() => {
    let interval;
    if (isScanModalOpen) {
      inputRef.current?.focus();
      interval = setInterval(() => {
        const activeTag = document.activeElement?.tagName;
        const isUserInteracting = activeTag === 'SELECT' || activeTag === 'TEXTAREA' || (activeTag === 'INPUT' && document.activeElement !== inputRef.current);
        if (document.activeElement !== inputRef.current && isScanModalOpen && !isUserInteracting) {
          inputRef.current?.focus();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isScanModalOpen]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim() || isProcessing) return;

    setIsProcessing(true);
    const scannedCode = barcode.trim();
    setBarcode(''); // Clear input for next scan immediately

    try {
      const response = await axios.post('/api/scan/verify', { barcode: scannedCode });
      const { success, message, errors } = response.data;

      const result = {
        id: Date.now(),
        barcode: scannedCode,
        status: success ? 'OK' : 'NG',
        reason: success ? '' : (errors?.join(', ') || message),
        time: new Date()
      };

      setHistory(prev => [result, ...prev]);

      if (success) {
        toast.success(t('scan.statusOk'), { icon: '🟢', position: "top-center", autoClose: 2000, theme: "colored" });
        playSound('ok');
      } else {
        toast.error(`${t('scan.statusNg')}: ${result.reason}`, { icon: '🔴', position: "top-center", autoClose: 5000, theme: "colored" });
        playSound('ng');
      }

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi kết nối Server';
      toast.error(`${t('scan.statusNg')}: ${errorMsg}`, { icon: '🔴', position: "top-center", autoClose: 5000, theme: "colored" });
      playSound('ng');
      
      setHistory(prev => [{
        id: Date.now(),
        barcode: scannedCode,
        status: 'NG',
        reason: errorMsg,
        time: new Date()
      }, ...prev]);
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'ok') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15); // Short beep
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime); // Low pitch error
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      oscillator.start();
      // 3 short error beeps
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(300, audioContext.currentTime);
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.1);
      }, 150);
      setTimeout(() => {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.type = 'square';
        osc3.frequency.setValueAtTime(300, audioContext.currentTime);
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.start();
        osc3.stop(audioContext.currentTime + 0.2);
      }, 300);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  const columns = [
    { field: 'id', title: 'STT', width: '60px', align: 'center' },
    { field: 'boxNo', title: 'Box No', width: '80px' },
    { field: 'code', title: 'Code', width: '120px' },
    { field: 'lotNo', title: 'LotNo', width: '100px' },
    { field: 'item', title: 'Item', width: '150px' },
    { field: 'rank', title: 'Rank', width: '80px' },
    { field: 'quantity', title: 'Quantity', width: '80px', align: 'right' },
    { field: 'total', title: 'Total', width: '80px', align: 'right' },
    { field: 'packDate', title: 'Pack Date', width: '100px' },
    { field: 'warrantyPeriod', title: 'Warranty Period', width: '120px' },
    { field: 'seriNumber', title: 'Seri Number', width: '120px' },
    { 
      field: 'qrcode', 
      title: 'QRCode', 
      render: (_, row) => `${row.code}|${row.lotNo}|${row.quantity}|${row.boxNo}|${row.seriNumber || ''}`,
      width: '250px'
    }
  ];

  const toolbarButtons = (
    <>
      <button className="btn-toolbar btn-scan" onClick={() => setIsScanModalOpen(true)}>
        <Scan size={14} /> {t('scan.scanBtn')}
      </button>
      <button className="btn-toolbar btn-view" onClick={fetchData}>
        <Eye size={14} /> {t('common.view')}
      </button>
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
        <span>{t('sidebar.scanTem')}</span>
      </div>
      
      <h2 className="page-title" style={{ textTransform: 'uppercase' }}>{t('scan.title')}</h2>

      <div style={{ marginBottom: '15px' }}>
        <select style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '150px' }}>
          <option>CS</option>
          <option>CR</option>
          <option>CD</option>
          <option>DC</option>
        </select>
      </div>

      <GridTable 
        columns={columns} 
        data={data} 
        toolbarButtons={toolbarButtons}
      />

      {isScanModalOpen && (
        <Modal isOpen={true} title={t('scan.title')} onClose={() => setIsScanModalOpen(false)}>
          <div style={{ padding: '10px' }}>
            {/* 3 Dropdowns */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#555' }}>{t('scan.stampType')}</label>
                <select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}>
                  <option>CS</option>
                  <option>CR</option>
                  <option>CD</option>
                  <option>DC</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#555' }}>{t('scan.partner')}</label>
                <select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}>
                  <option>{t('scan.selectPartner')}</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', color: '#555' }}>{t('scan.product')}</label>
                <select style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px' }}>
                  <option>{t('scan.selectProduct')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nút Kiểm tra */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <button 
                onClick={handleScan}
                style={{ 
                  backgroundColor: '#337ab7', color: 'white', border: 'none', 
                  padding: '8px 20px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}
              >
                <CheckCircle size={14} /> {t('scan.check')}
              </button>
            </div>

            {/* ÁEvuông xanh (Khung quét) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ 
                width: '250px', height: '250px', 
                border: '4px solid #28a745', 
                position: 'relative',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                backgroundColor: '#f9f9f9'
              }}>
                <form onSubmit={handleScan} style={{ width: '100%', height: '100%' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    style={{ 
                      width: '100%', height: '100%', opacity: 0, 
                      position: 'absolute', top: 0, left: 0, cursor: 'text' 
                    }}
                    autoComplete="off"
                  />
                </form>
                <Scan size={64} color="#ccc" style={{ opacity: 0.5 }} />
                <div style={{ position: 'absolute', bottom: '10px', fontSize: '12px', color: '#888' }}>
                  {t('scan.clickToScan')}
                </div>
              </div>
              {isProcessing && <p style={{ color: '#ffb822', marginTop: '10px', fontSize: '13px' }}>{t('scan.processing')}</p>}
            </div>

            {/* Lịch sử mini (Giúp công nhân biết kết quả quét thay vì mù tịt) */}
            {history.length > 0 && (
              <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', color: history[0].status === 'OK' ? '#28a745' : '#e73d4a' }}>
                {t('scan.lastResult')} {history[0].barcode} - {history[0].status === 'OK' ? t('scan.valid') : `${t('scan.error')} (${history[0].reason})`}
              </div>
            )}

            {/* Nút Hủy dưới cùng bên trái */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <button 
                onClick={() => setIsScanModalOpen(false)}
                style={{ 
                  backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', 
                  padding: '6px 15px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '5px'
                }}
              >
                <XCircle size={14} /> {t('common.cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

