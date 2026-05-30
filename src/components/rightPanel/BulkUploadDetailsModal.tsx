import React from "react";
import dayjs from "dayjs"
import { Modal, Descriptions, Typography } from "antd";
import {getStatusDisplay,getStatusStyles} from "./RightPanel"

const { Text } = Typography;


interface BulkUploadDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  data: {
    bulkUploadId: number;
    status: string;
    startTime: string;
    endTime: string;
    totalProcessedVoters: number;
    totalFailedVoters: number;
    totalRecords: number;
  } | null;
}

const BulkUploadDetailsModal: React.FC<BulkUploadDetailsModalProps> = ({
  visible,
  onClose,
  data,
}) => {
  if (!data) return null; 

 const formatDate = (date) => {
    return `${dayjs(date).format("DD")}-${dayjs(date)
      .format("MMM")
      .slice(0, 3)}-${dayjs(date).format("YYYY")}`;
  };

  return (
    <Modal
      title={`Bulk Upload Details #${data.bulkUploadId}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Status">
          <Text
            style={{
              color: getStatusStyles(data.status).textColor,
            }}
          >
            {getStatusDisplay(data.status)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Start Time">
          {formatDate(data.startTime)}
        </Descriptions.Item>
        <Descriptions.Item label="End Time">
          {formatDate(data.endTime)}
        </Descriptions.Item>
        <Descriptions.Item label="Total Records">
          {data.totalRecords}
        </Descriptions.Item>
        <Descriptions.Item label="Total Processed Voters">
          {data.totalProcessedVoters}
        </Descriptions.Item>
        <Descriptions.Item label="Total Failed Voters">
          {data.totalFailedVoters}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
};

export default BulkUploadDetailsModal;
