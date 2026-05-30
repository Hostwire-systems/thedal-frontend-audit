import React, { useEffect, useRef, useState } from 'react';
import { Modal, Progress, Button, Typography, Space, Spin } from 'antd';
import { CloseCircleOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { getJobStatus, cancelJob, JobStatusData } from '../api/reportingApi';

const { Text } = Typography;

interface RecomputeProgressModalProps {
  visible: boolean;
  jobId: string | null;
  onComplete: () => void;
  onClose: () => void;
}

const RecomputeProgressModal: React.FC<RecomputeProgressModalProps> = ({
  visible,
  jobId,
  onComplete,
  onClose,
}) => {
  const [jobData, setJobData] = useState<JobStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll job status
  const pollJobStatus = async () => {
    if (!jobId) return;

    try {
      const response = await getJobStatus(jobId);
      
      if (response.status === 'success' && response.data) {
        setJobData(response.data);
        
        // Stop polling on terminal states
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(response.data.status)) {
          stopPolling();
          
          if (response.data.status === 'COMPLETED') {
            setTimeout(() => {
              onComplete();
            }, 1000);
          } else if (response.data.status === 'FAILED') {
            setError(response.data.errorMessage || 'Job failed');
          }
        }
      } else {
        setError(response.message || 'Failed to fetch job status');
        stopPolling();
      }
    } catch (err: any) {
      console.error('Failed to fetch job status:', err);
      setError('Failed to fetch job status');
      stopPolling();
    }
  };

  // Start polling
  const startPolling = () => {
    if (pollingInterval.current) return;
    
    // Initial fetch
    pollJobStatus();
    
    // Poll every 3 seconds
    pollingInterval.current = setInterval(pollJobStatus, 3000);
    
    // Timeout after 10 minutes
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setError('Job timed out after 10 minutes');
    }, 10 * 60 * 1000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!jobId || !jobData) return;
    
    setCancelling(true);
    try {
      await cancelJob(jobId);
      // Polling will handle the status update
    } catch (err: any) {
      console.error('Failed to cancel job:', err);
    } finally {
      setCancelling(false);
    }
  };

  // Handle close
  const handleClose = () => {
    stopPolling();
    onClose();
  };

  // Start polling when modal opens with jobId
  useEffect(() => {
    if (visible && jobId) {
      setError(null);
      setJobData(null);
      startPolling();
    }
    
    return () => {
      stopPolling();
    };
  }, [visible, jobId]);

  // Format elapsed time
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status icon
  const getStatusIcon = () => {
    if (!jobData) return <LoadingOutlined spin style={{ fontSize: 24, color: '#1890ff' }} />;
    
    switch (jobData.status) {
      case 'COMPLETED':
        return <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
      case 'FAILED':
      case 'CANCELLED':
        return <CloseCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />;
      default:
        return <LoadingOutlined spin style={{ fontSize: 24, color: '#1890ff' }} />;
    }
  };

  // Get status text
  const getStatusText = () => {
    if (!jobData) return 'Initializing...';
    
    switch (jobData.status) {
      case 'QUEUED':
        return 'Queued';
      case 'IN_PROGRESS':
        return 'Processing';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return jobData.status;
    }
  };

  // Get progress color
  const getProgressColor = () => {
    if (!jobData) return undefined;
    
    switch (jobData.status) {
      case 'COMPLETED':
        return '#52c41a';
      case 'FAILED':
      case 'CANCELLED':
        return '#ff4d4f';
      default:
        return undefined;
    }
  };

  const showCancelButton = jobData && ['QUEUED', 'IN_PROGRESS'].includes(jobData.status);
  const showCloseButton = !jobData || ['COMPLETED', 'FAILED', 'CANCELLED'].includes(jobData.status);

  return (
    <Modal
      title="Recompute Progress"
      open={visible}
      onCancel={handleClose}
      footer={
        <Space>
          {showCancelButton && (
            <Button
              danger
              onClick={handleCancel}
              loading={cancelling}
              disabled={cancelling}
            >
              Cancel Job
            </Button>
          )}
          {showCloseButton && (
            <Button type="primary" onClick={handleClose}>
              Close
            </Button>
          )}
        </Space>
      }
      closable={showCloseButton}
      maskClosable={false}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Status Header */}
        <div style={{ textAlign: 'center' }}>
          {getStatusIcon()}
          <div style={{ marginTop: 8 }}>
            <Text strong style={{ fontSize: 16 }}>
              {getStatusText()}
            </Text>
          </div>
        </div>

        {/* Progress Bar */}
        {jobData && (
          <Progress
            percent={Math.round(jobData.progressPercent)}
            status={
              jobData.status === 'COMPLETED' ? 'success' :
              jobData.status === 'FAILED' || jobData.status === 'CANCELLED' ? 'exception' :
              'active'
            }
            strokeColor={getProgressColor()}
          />
        )}

        {/* Progress Details */}
        {jobData && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Parts Processed:</Text>
              <Text strong>{jobData.completedParts} / {jobData.totalParts}</Text>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">Elapsed Time:</Text>
              <Text strong>{formatElapsedTime(jobData.elapsedSeconds)}</Text>
            </div>

            {jobData.partNumber && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Part Number:</Text>
                <Text strong>{jobData.partNumber}</Text>
              </div>
            )}
          </Space>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '12px', 
            background: '#fff2f0', 
            border: '1px solid #ffccc7',
            borderRadius: 4 
          }}>
            <Text type="danger">{error}</Text>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default RecomputeProgressModal;
