import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Progress } from 'antd';
import { LoadingOutlined, UpOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons';
import { selectActiveUploads, removeUpload } from '../../redux/slices/bulkUploadSlice';

const UploadStatusTracker = () => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [timeInfo, setTimeInfo] = useState<{ [key: number]: { timeRemaining: string | null, progress: number } }>({});
    const uploads = useSelector(selectActiveUploads);
    const dispatch = useDispatch();

    const calculateTimeInfo = (startTime: string, endTime: string) => {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        const now = new Date().getTime();
        const totalDuration = end - start;
        const elapsed = now - start;
        const diff = end - now;

        if (diff <= 0) return { timeRemaining: null, progress: 100 };

        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

        return {
            timeRemaining: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            progress
        };
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const newTimeInfo: { [key: number]: { timeRemaining: string | null, progress: number } } = {};

            uploads.forEach(upload => {
                if (upload.bulkUploadId !== null) {
                    const info = calculateTimeInfo(upload.startTime, upload.endTime);
                    newTimeInfo[upload.bulkUploadId] = info;

                    if (!info.timeRemaining) {
                        dispatch(removeUpload(upload.bulkUploadId));
                    }
                }
            });

            setTimeInfo(newTimeInfo);
        }, 1000);

        return () => clearInterval(interval);
    }, [uploads, dispatch]);

    if (uploads.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 z-[1000]">
            <Card
                className="shadow-xl border border-gray-200 transition-all duration-300 ease-in-out"
                title={
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                        <span className="text-lg font-semibold">Active Uploads ({uploads.length})</span>
                        {isMinimized ? <UpOutlined className="text-blue-600" /> : <DownOutlined className="text-blue-600" />}
                    </div>
                }
                bodyStyle={{
                    padding: '16px',
                    maxHeight: isMinimized ? '0px' : '400px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                }}
            >
                {!isMinimized && uploads.map((upload) => {
                    const uploadInfo = upload.bulkUploadId !== null ?
                        timeInfo[upload.bulkUploadId] || calculateTimeInfo(upload.startTime, upload.endTime) :
                        { timeRemaining: null, progress: 0 };

                    return (
                        <div key={upload.bulkUploadId} className="mb-4 last:mb-0 p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <LoadingOutlined className="text-blue-500 text-lg" />
                                    <span className="font-medium">Upload #{upload.bulkUploadId}</span>
                                </div>
                                <CloseOutlined
                                    className="text-red-500 cursor-pointer hover:text-red-700 transition-colors duration-200"
                                    onClick={() => upload.bulkUploadId && dispatch(removeUpload(upload.bulkUploadId))}
                                />
                            </div>
                            <Progress
                                percent={uploadInfo.progress}
                                status="active"
                                showInfo={false}
                                size="small"
                                strokeColor={{ '0%': 'rgb(29, 78, 216)', '100%': 'rgba(29, 78, 216, 0.3)' }}
                            />
                            <div className="text-sm text-gray-600 mt-1">
                                {uploadInfo.timeRemaining ?
                                    `${uploadInfo.timeRemaining} remaining` :
                                    'Processing...'
                                }
                            </div>
                        </div>
                    );
                })}
            </Card>
        </div>
    );
};

export default UploadStatusTracker;
