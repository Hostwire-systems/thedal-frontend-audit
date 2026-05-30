import React, { useEffect } from 'react';
import { notification } from 'antd';
import PhotoProcessingService from '../services/PhotoProcessingService';

const PhotoProcessingNotifications: React.FC = () => {
  useEffect(() => {
    const processingService = PhotoProcessingService.getInstance();
    
    // Subscribe to global job updates for notifications
    const unsubscribe = processingService.subscribe("*", (job) => {
      // Only show notifications when jobs complete or fail
      if (!job.isActive) {
        if (job.status === "COMPLETED") {
          notification.success({
            message: "Photo Processing Completed",
            description: `Successfully processed PDF for Part ${job.partNo} in Election ${job.electionId}`,
            duration: 6,
            placement: 'topRight',
          });
        } else if (job.status === "FAILED") {
          notification.error({
            message: "Photo Processing Failed", 
            description: `Processing failed for Part ${job.partNo} in Election ${job.electionId}`,
            duration: 8,
            placement: 'topRight',
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PhotoProcessingNotifications;
