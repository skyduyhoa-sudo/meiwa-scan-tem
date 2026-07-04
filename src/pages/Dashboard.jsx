import { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { Home, Package, Users, FileText, CheckCircle, XCircle, Activity, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Dashboard.css';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    products: 0,
    partners: 0,
    packingLists: 0,
    invoices: 0,
    processDocs: 0,
    scanOk: 0,
    scanNg: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Home size={14} />
        <span>{t('sidebar.dashboard')}</span>
      </div>
      
      <h2 className="page-title">{t('dashboard.title')}</h2>

      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h3>{t('dashboard.welcome')}</h3>
          <p>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <h3 className="section-title">{t('dashboard.stats')}</h3>
      
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>{t('common.loading')}</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card" style={{ borderTopColor: '#32c5d2' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(50, 197, 210, 0.1)', color: '#32c5d2' }}>
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.products}</div>
              <div className="stat-label">{t('dashboard.totalProducts')}</div>
            </div>
          </div>
          
          <div className="stat-card" style={{ borderTopColor: '#8E44AD' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(142, 68, 173, 0.1)', color: '#8E44AD' }}>
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.partners}</div>
              <div className="stat-label">{t('dashboard.totalPartners')}</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderTopColor: '#E67E22' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(230, 126, 34, 0.1)', color: '#E67E22' }}>
              <Box size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.packingLists}</div>
              <div className="stat-label">{t('dashboard.totalPackingLists')}</div>
            </div>
          </div>

          <div className="stat-card" style={{ borderTopColor: '#3498DB' }}>
            <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498DB' }}>
              <FileText size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.invoices} + {stats.processDocs}</div>
              <div className="stat-label">{t('dashboard.totalInvoices')} / {t('dashboard.processDocsLabel')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid" style={{ marginTop: '20px' }}>
        <div className="stat-card" style={{ borderTopColor: '#2ecc71', flex: 1 }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>
            <CheckCircle size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: '#2ecc71', fontSize: '32px' }}>{stats.scanOk}</div>
            <div className="stat-label" style={{ fontSize: '16px' }}>{t('dashboard.scanOk')}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderTopColor: '#e74c3c', flex: 1 }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}>
            <XCircle size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: '#e74c3c', fontSize: '32px' }}>{stats.scanNg}</div>
            <div className="stat-label" style={{ fontSize: '16px' }}>{t('dashboard.scanNg')}</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

