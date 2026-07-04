import { RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function GridTable({ 
  toolbarButtons, 
  filters,
  columns, 
  data 
}) {
  const { t } = useTranslation();
  return (
    <div className="grid-container">
      {/* Filters (if any) */}
      {filters && (
        <div className="grid-filter">
          {filters}
        </div>
      )}

      {/* Toolbar */}
      {toolbarButtons && (
        <div className="grid-toolbar">
          {toolbarButtons}
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="kendo-table">
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}><input type="checkbox" /></th>
              {columns.map((col, index) => (
                <th key={index} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row[col.field], row) : row[col.field]}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '20px' }}>
                  {t('grid.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="grid-pager">
        <div className="pager-left">
          <button className="pager-btn"><ChevronsLeft size={14} /></button>
          <button className="pager-btn"><ChevronLeft size={14} /></button>
          <span className="pager-text">{t('grid.page')}</span>
          <input type="text" className="pager-input" defaultValue="1" />
          <span className="pager-text">{t('grid.ofTotal')} 1</span>
          <button className="pager-btn"><ChevronRight size={14} /></button>
          <button className="pager-btn"><ChevronsRight size={14} /></button>
          
          <select className="pager-select" defaultValue="10">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <span className="pager-text">{t('grid.itemsPerPage')}</span>
        </div>
        <div className="pager-right">
          <span className="pager-info">1 - {data.length} {t('grid.of')} {data.length} {t('grid.items')}</span>
          <button className="pager-refresh"><RefreshCw size={14} /></button>
        </div>
      </div>
    </div>
  );
}

