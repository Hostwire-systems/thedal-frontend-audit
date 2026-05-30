import React from 'react';
import { Modal, Card, Spin, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';

interface ExportJob {
  jobId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  format: 'excel' | 'pdf';
  chartType?: string;
  dataType?: string;
}

interface ExportModalProps {
  visible: boolean;
  onCancel: () => void;
  onExport: (format: 'excel' | 'pdf') => Promise<void> | void;
  loading?: boolean;
  exportFormat?: 'excel' | 'pdf' | null;
  activeExportJob?: ExportJob | null;
  title?: string;
  description?: string;
  showFullscreenHandling?: boolean;
  fullscreenChartId?: string;
  isGridFullscreen?: boolean;
  width?: number;
}

const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onCancel,
  onExport,
  loading = false,
  exportFormat = null,
  activeExportJob = null,
  title = 'Export Data',
  description,
  showFullscreenHandling = false,
  fullscreenChartId,
  isGridFullscreen = false,
  width = 480,
}) => {
  const handleCardClick = (format: 'excel' | 'pdf') => {
    if (!loading || (loading && exportFormat !== format)) {
      onExport(format);
    }
  };

  const getExportTitle = () => {
    if (activeExportJob && (activeExportJob.status === 'PENDING' || activeExportJob.status === 'RUNNING')) {
      return 'Export in Progress';
    }
    return title;
  };

  const getModalContainer = () => {
    if (showFullscreenHandling && (fullscreenChartId || isGridFullscreen)) {
      const fullscreenElement = document.querySelector(
        '.chart-fullscreen-container:fullscreen, .charts-grid-fullscreen:fullscreen'
      );
      return (fullscreenElement as HTMLElement) || document.body;
    }
    return document.body;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DownloadOutlined
            style={{
              fontSize: '20px',
              color: activeExportJob ? '#1890ff' : '#52c41a',
            }}
          />
          <span>{getExportTitle()}</span>
        </div>
      }
      open={visible}
      mask={!(showFullscreenHandling && (fullscreenChartId || isGridFullscreen))}
      getContainer={showFullscreenHandling ? getModalContainer : undefined}
      style={
        showFullscreenHandling && (fullscreenChartId || isGridFullscreen)
          ? { zIndex: 10000 }
          : {}
      }
      onCancel={() => {
        if (
          activeExportJob &&
          (activeExportJob.status === 'PENDING' || activeExportJob.status === 'RUNNING')
        ) {
          onCancel();
          message.info('Export continues in background. You can navigate to other pages.');
          return;
        }
        onCancel();
      }}
      footer={null}
      width={width}
      closable={true}
      maskClosable={!activeExportJob || !['PENDING', 'RUNNING'].includes(activeExportJob.status)}
    >
      {activeExportJob && (activeExportJob.status === 'PENDING' || activeExportJob.status === 'RUNNING') ? (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <Spin size="large" />
          <div
            style={{
              marginTop: '24px',
              fontSize: '16px',
              fontWeight: 500,
              color: '#262626',
            }}
          >
            {activeExportJob.status === 'PENDING' ? 'Preparing your export...' : 'Processing export...'}
          </div>
          <div
            style={{
              marginTop: '12px',
              padding: '12px 20px',
              backgroundColor: '#f0f5ff',
              borderRadius: '8px',
              border: '1px solid #adc6ff',
            }}
          >
            {activeExportJob.dataType && (
              <div
                style={{
                  fontSize: '13px',
                  color: '#0050b3',
                  marginBottom: '4px',
                }}
              >
                <strong>Data Type:</strong> {activeExportJob.dataType}
              </div>
            )}
            {activeExportJob.chartType && (
              <div style={{ fontSize: '13px', color: '#0050b3' }}>
                <strong>Chart Type:</strong> {activeExportJob.chartType}
              </div>
            )}
            <div
              style={{
                fontSize: '13px',
                color: '#0050b3',
                marginTop: activeExportJob.dataType || activeExportJob.chartType ? '4px' : 0,
              }}
            >
              <strong>Format:</strong> {activeExportJob.format.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              marginTop: '20px',
              fontSize: '13px',
              color: '#8c8c8c',
              lineHeight: '1.6',
            }}
          >
            <p style={{ margin: 0 }}>✓ You can navigate to other pages</p>
            <p style={{ margin: '4px 0 0 0' }}>✓ Export will continue in background</p>
            <p style={{ margin: '4px 0 0 0' }}>✓ File will auto-download when ready</p>
          </div>
        </div>
      ) : (
        <div>
          {description && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontSize: '14px', color: '#389e0d' }}>{description}</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card
              hoverable
              onClick={() => handleCardClick('excel')}
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                border: '2px solid #217346',
                borderRadius: '8px',
                opacity: loading && exportFormat !== 'excel' ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              bodyStyle={{ padding: '20px' }}
              className="export-option-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f9ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading && exportFormat === 'excel' ? (
                    <Spin size="small" />
                  ) : (
                    <FileExcelOutlined style={{ fontSize: '24px', color: '#217346' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#217346',
                      marginBottom: '4px',
                    }}
                  >
                    Export as Excel
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Download data in XLSX format • Best for analysis
                  </div>
                </div>
                {!loading && <div style={{ fontSize: '20px', color: '#217346' }}>→</div>}
              </div>
            </Card>

            <Card
              hoverable
              onClick={() => handleCardClick('pdf')}
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                border: '2px solid #ff4d4f',
                borderRadius: '8px',
                opacity: loading && exportFormat !== 'pdf' ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              bodyStyle={{ padding: '20px' }}
              className="export-option-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#fff1f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading && exportFormat === 'pdf' ? (
                    <Spin size="small" />
                  ) : (
                    <FilePdfOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#ff4d4f',
                      marginBottom: '4px',
                    }}
                  >
                    Export as PDF
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Download data in PDF format • Best for printing
                  </div>
                </div>
                {!loading && <div style={{ fontSize: '20px', color: '#ff4d4f' }}>→</div>}
              </div>
            </Card>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExportModal;