import React, { useState } from "react";
import { Table, Button, Modal, Space, Typography, Row, Col, Image } from "antd";
import QRCode, { QRCodeCanvas } from "qrcode.react";
import "./CreatePart.css";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  WhatsAppOutlined,
  UserOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { ColumnType } from "antd/es/table";

interface BoothCommitteeMember {
  name: string;
  designation: string;
  mobileNumber?: string;
}

interface Part {
  id: number;
  partImageUrl?: string | null;
  partNo: string;
  partNameEnglish: string;
  partNameL1: string;
  partType?: string;
  schoolName: string;
  partLat: number;
  partLong: number;
  schoolLat: number;
  schoolLong: number;
  pincode: string;
  partCaptainName?: string;
  captainDesignation?: string;
  captainMobileNo?: string;
  bloName:string;
  bloDesignation:string;
  bloMobileNumber:string
  bla2Name:string;
  bla2Designation:string;
  bla2MobileNumber:string
  boothCommitteeMembers?: BoothCommitteeMember[];
}

interface PartTableProps {
  filteredPartList: Part[];
  onDeletePart: (id: number) => void;
  onEditPart: (part: Part) => void;
  onExportPart: (part: Part) => void;
  onViewPart: (part: Part) => void;
  loading: boolean;
  rowSelection?: any;
  isFrozen: boolean;
}

const PartTable: React.FC<PartTableProps> = ({
  filteredPartList,
  onDeletePart,
  onEditPart,
  onViewPart,
  onExportPart,
  loading,
  rowSelection,
  isFrozen,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const showDeleteConfirm = (record: Part) => {
    Modal.confirm({
      title: "Are you sure you want to delete this part?",
      content: `Part number: ${record.partNo}`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No",
      onOk: () => onDeletePart(record.id),
    });
  };

  const openMapModal = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsModalVisible(true);
  };

  const columns: ColumnType<Part>[] = [
    {
      title: "Image",
      key: "image",
      width: 100,
      render: (record: any) =>
        record.partImageUrl ? (
          <Image
            src={record.partImageUrl}
            alt="Part Preview"
            style={{
              width: "70px",
              height: "70px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        ) : (
          <div
            style={{
              width: "70px",
              height: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          >
            <UserOutlined style={{ fontSize: "36px", color: "#8c8c8c" }} />
          </div>
        ),
    },
    {
      title: "Part No",
      dataIndex: "partNo",
      key: "partNo",
      defaultSortOrder: "ascend",
      sorter: (a, b) => Number(a.partNo?.trim()) - Number(b.partNo?.trim()),
      sortDirections: ["ascend", "descend"],
      fixed: "left",
      width: 60,
    },
    {
      title: "Part Name English",
      dataIndex: "partNameEnglish",
      key: "partNameEnglish",
      width: 120,
    },
    {
      title: "Part Name L1",
      dataIndex: "partNameL1",
      key: "partNameL1",
      width: 120,
    },
    {
      title: "Part Location",
      key: "location",
      render: (_, record) => `${record.partLat}, ${record.partLong}`,
      width: 120,
    },
    {
      title: "School Name",
      dataIndex: "schoolName",
      key: "schoolName",
      width: 120,
    },
    {
      title: "School Location",
      key: "school_location",
      render: (_, record) => `${record.schoolLat}, ${record.schoolLong}`,
      width: 120,
    },
    {
      title: "Pincode",
      dataIndex: "pincode",
      key: "pincode",
      width: 120,
    },
    {
      title: "Map",
      key: "map",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openMapModal(record.partLat, record.partLong)}
        />
      ),
      width: 100,
    },
    {
      title: "PART CAPTAIN",
      key: "partCaptain",
      render: (_, record) => (
        <div style={{ lineHeight: 1.4 }}>
          <div>
            {record.partCaptainName ? (
              <strong>{record.partCaptainName}</strong>
            ) : (
              "—"
            )}
          </div>
          <div>{record.captainMobileNo || "—"}</div>
          <div>{record.captainDesignation || "—"}</div>
        </div>
      ),
      width: 200,
    },
    {
      title: "PART BLO",
      key: "partBlo",
      render: (_, record) => (
        <div style={{ lineHeight: 1.4 }}>
          <div>
            {record.bloName ? (
              <strong>{record.bloName}</strong>
            ) : (
              "—"
            )}
          </div>
          <div>{record.bloDesignation || "—"}</div>
          <div>{record.bloMobileNumber || "—"}</div>
        </div>
      ),
      width: 200,
    },
    {
      title: "PART BLA-2",
      key: "partBla-2",
      render: (_, record) => (
        <div style={{ lineHeight: 1.4 }}>
          <div>
            {record.bla2Name ? (
              <strong>{record.bla2Name}</strong>
            ) : (
              "—"
            )}
          </div>
          <div>{record.bla2Designation || "—"}</div>
          <div>{record.bla2MobileNumber || "—"}</div>
        </div>
      ),
      width: 200,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        <div className="flex space-x-2">
            <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onViewPart(record)}
        />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEditPart(record)}
            disabled={isFrozen}
          />
          <Button
            type="link"
            
            icon={<ExportOutlined />}
            onClick={() => onExportPart(record)}
            disabled={isFrozen}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record)}
            disabled={isFrozen}
          />
        </div>
      ),
    },
  ];

  const googleMapsLink = selectedLocation
    ? `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`
    : "";

  return (
    <>
      <Row>
        <Col className="mb-4" span={24}>
          <Table<Part>
            rowKey="id"
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredPartList}
            bordered
            rowClassName="table-header row-bg-color"
            className="voters-list-table"
            loading={loading}
            pagination={{
              position: ["bottomCenter"],
              defaultPageSize: 10,
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: "max-content" }}
          />
        </Col>
      </Row>
      <Modal
        title="Part Location"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
      >
        {selectedLocation && (
          <Space
            direction="vertical"
            style={{ width: "100%" }}
            align="center"
            size="large"
          >
            {/* Coordinates */}
            <Typography.Text strong>Coordinates:</Typography.Text>
            <Typography.Text type="secondary">
              {selectedLocation.lat}, {selectedLocation.lng}
            </Typography.Text>

            {/* Google Maps Link */}
            <Button type="link" href={googleMapsLink} target="_blank">
              Open in Google Maps
            </Button>

            {/* QR Code - Centered */}
            <QRCodeCanvas value={googleMapsLink} size={150} />

            {/* WhatsApp Share Button */}
            <Button
              style={{ backgroundColor: "#25D366", color: "white" }}
              icon={<WhatsAppOutlined />}
              onClick={() => {
                window.open(
                  `https://wa.me/?text=Check%20this%20location:%20${encodeURIComponent(
                    googleMapsLink
                  )}`,
                  "_blank"
                );
              }}
              block
            >
              Share on WhatsApp
            </Button>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default PartTable;
