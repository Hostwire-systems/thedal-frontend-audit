import React, { useEffect, useState } from 'react';
import { Progress, notification } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { selectUploadById, removeUpload } from '../../redux/slices/bulkUploadSlice';
import { getBulkUploadStatus, getBulkUploadsByElectionId } from '../../api/voterApi';
import { CloseOutlined, CheckCircleOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';

const UploadProgressNotification = ({ uploadId, electionId, uploadProgress }) => {
  const [processingStatus, setProcessingStatus] = useState('PENDING');
  const [showNotification, setShowNotification] = useState(true);
  const [isConfirmedInList, setIsConfirmedInList] = useState(false);
  const dispatch = useDispatch();
  
  const upload = useSelector(state => selectUploadById(uploadId)(state));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'IN_PROGRESS':
        return <SyncOutlined spin className="text-blue-500" />;
      case 'FAILED':
        return <WarningOutlined className="text-red-500" />;
      default:
        return <SyncOutlined spin className="text-blue-500" />;
    }
  };

  const verifyUploadInList = async () => {
    try {
      const response = await getBulkUploadsByElectionId(electionId);
      const uploadsList = response.data.content;
      const foundUpload = uploadsList.find(upload => 
        upload.bulkUploadId === uploadId && upload.status === 'COMPLETED'
      );
      
      if (foundUpload) {
        setIsConfirmedInList(true);
        notification.success({
          message: 'Upload Complete',
          description: 'Voter list has been successfully processed and verified',
          duration: 5,
        });
        // Hide notification after 5 seconds of verified completion
        setTimeout(() => setShowNotification(false), 5000);
      }
      
      return !!foundUpload;
    } catch (error) {
      console.error('Error verifying upload in list:', error);
      return false;
    }
  };

  useEffect(() => {
    let statusCheckInterval;
    let listCheckInterval;

    const checkStatus = async () => {
      try {
        const status = await getBulkUploadStatus(uploadId, electionId);
        setProcessingStatus(status.status);
        
        if (status.status === 'COMPLETED') {
          // When status is COMPLETED, start checking the uploads list
          verifyUploadInList();
        } else if (status.status === 'FAILED') {
          notification.error({
            message: 'Upload Failed',
            description: 'There was an error processing the voter list',
            duration: 5,
          });
          clearInterval(statusCheckInterval);
          clearInterval(listCheckInterval);
        }
      } catch (error) {
        console.error('Error checking upload status:', error);
        clearInterval(statusCheckInterval);
        clearInterval(listCheckInterval);
        setProcessingStatus('FAILED');
      }
    };

    if (uploadId && electionId) {
      checkStatus();
      statusCheckInterval = setInterval(checkStatus, 5000); // Check status every 5 seconds
      // Also start checking the uploads list every 10 seconds
      listCheckInterval = setInterval(verifyUploadInList, 10000);
    }

    return () => {
      if (statusCheckInterval) clearInterval(statusCheckInterval);
      if (listCheckInterval) clearInterval(listCheckInterval);
    };
  }, [uploadId, electionId]);

  const handleClose = () => {
    setShowNotification(false);
    if ((processingStatus === 'COMPLETED' && isConfirmedInList) || processingStatus === 'FAILED') {
      dispatch(removeUpload(uploadId));
    }
  };

  if (!showNotification) return null;

  const getProgressStatus = () => {
    if (processingStatus === 'COMPLETED' && !isConfirmedInList) return 'active';
    switch (processingStatus) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'exception';
      default:
        return 'active';
    }
  };

  const getProgressPercent = () => {
    if (processingStatus === 'PENDING') return uploadProgress;
    if (processingStatus === 'IN_PROGRESS') return Math.min(99, uploadProgress + Math.floor(Math.random() * 20));
    if (processingStatus === 'COMPLETED' && isConfirmedInList) return 100;
    if (processingStatus === 'COMPLETED' && !isConfirmedInList) return 99;
    if (processingStatus === 'FAILED') return uploadProgress;
    return uploadProgress;
  };

  const getStatusMessage = () => {
    if (processingStatus === 'COMPLETED' && !isConfirmedInList) {
      return 'Upload complete, verifying processing...';
    }
    switch (processingStatus) {
      case 'PENDING':
        return 'Uploading file...';
      case 'IN_PROGRESS':
        return 'Processing voter data...';
      case 'COMPLETED':
        return 'Upload complete! Processing finished.';
      case 'FAILED':
        return 'Upload failed. Please try again.';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg w-96 z-50">
      <div className="mb-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {getStatusIcon(processingStatus)}
          <span className="font-medium">Voter List Upload</span>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <CloseOutlined />
        </button>
      </div>
      
      <Progress 
        percent={getProgressPercent()} 
        status={getProgressStatus()}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
      />
      
      <p className="text-sm mt-2 text-gray-600">
        {getStatusMessage()}
      </p>
    </div>
  );
};

export default UploadProgressNotification;