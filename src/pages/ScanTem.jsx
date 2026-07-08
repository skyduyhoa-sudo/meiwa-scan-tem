import { useState, useRef, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import GridTable from '../components/GridTable';
import { Home, Scan, CheckCircle, XCircle, Eye, Camera, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import './ScanTem.css';

export default function ScanTem() {
  const [data, setData] = useState([]);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanType, setScanType] = useState('TEM_BICH'); // TEM_BICH, TEM_THUNG
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  
  // States cho quá trình scan
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader';
  
  const { t } = useTranslation();

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/packing-list');
      setData(response.data);
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu đối chiếu');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isScanModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScanModalOpen]);

  const [cameraMode, setCameraMode] = useState("environment");

  const initCameras = async () => {
    // We no longer strictly need this for facingMode, but keep it for fallback info
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách camera", err);
    }
  };

  const startCamera = async (forceCameraId = null) => {
    try {
      if (html5QrCodeRef.current) {
        await stopCamera();
      }
      
      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39
        ],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });
      html5QrCodeRef.current = html5QrCode;

      if (cameras.length === 0) {
        await initCameras();
      }

      const cameraConfig = forceCameraId ? forceCameraId : { facingMode: cameraMode };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
             const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
             const qrboxSize = Math.floor(minEdgeSize * 0.8);
             return { width: qrboxSize, height: qrboxSize };
          },
          videoConstraints: {
              width: { ideal: 1920 },
              height: { ideal: 1080 }
          }
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Không thể mở Camera. Vui lòng cấp quyền truy cập hoặc thử chuyển Camera!");
    }
  };

  const switchCamera = () => {
    if (cameras.length > 1 || cameras.length === 0) {
      // Toggle facing mode
      const nextMode = cameraMode === "environment" ? "user" : "environment";
      setCameraMode(nextMode);
      
      // Stop and restart with new mode
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
          // We must wait a tiny bit for the camera hardware to release before starting the other one
          setTimeout(() => {
            startCamera({ facingMode: nextMode });
          }, 300);
        }).catch(err => console.error("Error stopping for switch", err));
      } else {
        startCamera({ facingMode: nextMode });
      }
    } else {
      toast.info("Thiết bị của bạn chỉ có 1 camera");
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping camera", err);
      }
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    if (isProcessing) return;
    
    // Tạm dừng camera khi đang xử lý để tránh quét liên tục 1 mã
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.pause();
    }
    
    setIsProcessing(true);
    setLastResult(null);

    try {
      const response = await axios.post('/api/scan/verify', { 
        barcode: decodedText,
        stampType: scanType
      });
      
      const { success, message, errors, data } = response.data;

      const resultObj = {
        id: Date.now(),
        barcode: decodedText,
        status: success ? 'OK' : 'NG',
        reason: success ? '' : (errors?.join('; ') || message),
        data: data || null,
        time: new Date()
      };

      setLastResult(resultObj);
      setHistory(prev => [resultObj, ...prev]);

      if (success) {
        toast.success('HỢP LỆ!', { icon: '🟢', position: "top-center", autoClose: 1000, theme: "colored" });
        playSound('ok');
      } else {
        toast.error(`LỖI: ${resultObj.reason}`, { icon: '🔴', position: "top-center", autoClose: 3000, theme: "colored" });
        playSound('ng');
      }

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Lỗi kết nối Server';
      toast.error(`LỖI: ${errorMsg}`, { icon: '🔴', position: "top-center", autoClose: 3000, theme: "colored" });
      playSound('ng');
      
      const errObj = {
        id: Date.now(),
        barcode: decodedText,
        status: 'NG',
        reason: errorMsg,
        data: null,
        time: new Date()
      };
      setLastResult(errObj);
      setHistory(prev => [errObj, ...prev]);
    } finally {
      setIsProcessing(false);
      // Đợi 2 giây để người dùng xem kết quả lớn trên màn hình, sau đó resume camera
      setTimeout(() => {
        if (html5QrCodeRef.current && !html5QrCodeRef.current.isScanning && isScanModalOpen) {
          html5QrCodeRef.current.resume();
        }
      }, 2000);
    }
  };

  const onScanFailure = (error) => {
    // Không làm gì cả, camera sẽ tiếp tục quét
  };

  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'ok') {
      // Âm thanh Ping-Pong (Thành công)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // Ping (Nốt Đô C5)
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // Pong (Nốt Mi E5)
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      // Âm thanh Pip (Lỗi) - 1 tiếng bíp ngắn, hơi chói tai để chú ý
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(350, audioContext.currentTime); 
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.stop(audioContext.currentTime + 0.2);
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
    { field: 'seriNumber', title: 'Seri Number', width: '120px' }
  ];

  const toolbarButtons = (
    <>
      <button className="btn-toolbar btn-scan" onClick={() => setIsScanModalOpen(true)}>
        <Camera size={14} /> Mở Camera Quét
      </button>
      <button className="btn-toolbar btn-view" onClick={fetchData}>
        <Eye size={14} /> Tải lại dữ liệu
      </button>
    </>
  );

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
        <div className="dot"></div>
        <span>{t('sidebar.operations')}</span>
        <div className="dot"></div>
        <span>{t('sidebar.scanTem')}</span>
      </div>
      
      <h2 className="page-title" style={{ textTransform: 'uppercase' }}>CHẾ ĐỘ QUÉT CAMERA</h2>

      <GridTable 
        columns={columns} 
        data={data} 
        toolbarButtons={toolbarButtons}
      />

      {isScanModalOpen && (
        <div className="mobile-scan-overlay">
          <div className="mobile-scan-header" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', boxSizing: 'border-box', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <select 
                value={scanType} 
                onChange={(e) => setScanType(e.target.value)}
                className="scan-type-selector"
                style={{ fontSize: '14px', padding: '6px', width: '60%' }}
              >
                <option value="TEM_BICH">Quét Tem BỊCH</option>
                <option value="TEM_THUNG">Quét Tem THÙNG</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button className="switch-cam-btn" onClick={switchCamera} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px' }}>
                  Đổi Camera
                </button>
                <button className="close-btn" onClick={() => setIsScanModalOpen(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '0 10px', marginBottom: '10px', boxSizing: 'border-box', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Hoặc bấm vào đây để dùng súng bắn mã USB..." 
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (val) {
                    onScanSuccess(val);
                    e.target.value = '';
                  }
                }
              }}
              autoFocus
            />
          </div>

          <div className="camera-container">
            <div id={scannerContainerId} className="scanner-view"></div>
            {isProcessing && (
              <div className="processing-overlay">
                <div className="spinner"></div>
                <p>Đang phân tích...</p>
              </div>
            )}
          </div>

          {lastResult && (
            <div className={`scan-result-panel ${lastResult.status === 'OK' ? 'success' : 'error'}`}>
              {lastResult.status === 'OK' ? (
                <>
                  <div className="huge-status">OK</div>
                  <div className="large-text-data">
                    <p><strong>Mã KH:</strong> {lastResult.data?.customerCode || '-'}</p>
                    <p><strong>Lot:</strong> {lastResult.data?.lotNo}</p>
                    <p><strong>SL:</strong> {lastResult.data?.quantity}</p>
                    <p><strong>Số:</strong> {lastResult.data?.seriNumber}</p>
                  </div>
                  <p className="hint-text">(Hãy đối chiếu mắt với Tem Xanh)</p>
                </>
              ) : (
                <>
                  <div className="huge-status">NG</div>
                  <div className="error-reason">{lastResult.reason}</div>
                  <p className="hint-text">(Mã lỗi - Vui lòng kiểm tra lại)</p>
                </>
              )}
            </div>
          )}

          {history.length > 0 && !lastResult && (
            <div className="history-preview">
              <p>Vừa quét xong: {history[0].barcode}</p>
              <span className={history[0].status === 'OK' ? 'badge-ok' : 'badge-ng'}>
                {history[0].status}
              </span>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
