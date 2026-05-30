import React, { useEffect } from "react";
import {
  Table,
  Button,
  Avatar,
  Tag,
  Dropdown,
  Menu,
  Tooltip,
  Space,
  Typography,
} from "antd";
import type { ColumnsType, TableRowSelection } from "antd/es/table/interface";
import {
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { FamilyCaptain } from "../../types/familyCaptain";

const { Text } = Typography;

interface FamilyCaptainTableProps {
  data: FamilyCaptain[];
  loading: boolean;
  rowSelection: TableRowSelection<FamilyCaptain>;
  onView: (captain: FamilyCaptain) => void;
  onEdit: (captain: FamilyCaptain) => void;
  onDelete: (captain: FamilyCaptain) => void;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
    showSizeChanger: boolean;
    showQuickJumper: boolean;
    showTotal: (total: any, range: any) => string;
  };
  hasUpdatePermission: () => boolean;
  hasDeletePermission: () => boolean;
  isSuperAdminOrAdmin: boolean;
}

const FamilyCaptainTable: React.FC<FamilyCaptainTableProps> = ({
  data,
  loading,
  rowSelection,
  onView,
  onEdit,
  onDelete,
  pagination,
  hasUpdatePermission,
  hasDeletePermission,
  isSuperAdminOrAdmin,
}) => {

  
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      default:
        return "default";
    }
  };

  const formatAssignedFamilies = (families: string[] | undefined): string => {
    if (!families || families.length === 0) return "No families assigned";
    if (families.length === 1) return "1 family";
    return `${families.length} families`;
  };

  const renderActionsMenu = (captain: FamilyCaptain) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => onView(captain)}
      >
        View Details
      </Menu.Item>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => onEdit(captain)}
        disabled={!isSuperAdminOrAdmin && !hasUpdatePermission()}
      >
        Edit Captain
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(captain)}
        disabled={!isSuperAdminOrAdmin && !hasDeletePermission()}
        danger
      >
        Delete Captain
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<FamilyCaptain> = [
    {
      title: "Profile",
      key: "profile",
      width: 80,
      render: (_, captain) => (
        <Avatar
          size={40}
          src={captain.photo_url || captain.photoUrl}
          icon={<UserOutlined />}
          className="border-2 border-gray-200"
        />
      ),
    },
    {
      title: "Name",
      key: "name",
      sorter: true,
      render: (_, captain) => (
        <div className="flex flex-col">
          <Text strong className="text-base">
            {`${captain.first_name || captain.firstName || ""} ${
              captain.last_name || captain.lastName || ""
            }`.trim()}
          </Text>
          <Text type="secondary" className="text-sm">
            ID: {captain.user_id || captain.userId}
          </Text>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, captain) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <PhoneOutlined className="text-gray-400" />
            <Text
              copyable={{
                text: captain.mobile_number || captain.mobileNumber || "",
              }}
            >
              {captain.mobile_number || captain.mobileNumber || "N/A"}
            </Text>
          </div>
          {captain.email && (
            <div className="flex items-center gap-2">
              <MailOutlined className="text-gray-400" />
              <Text
                copyable={{ text: captain.email }}
                className="text-sm"
                ellipsis={{ tooltip: captain.email }}
              >
                {captain.email}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Address",
      key: "address",
      render: (_, captain) => (
        <div className="max-w-48">
          {captain.address ? (
            <Tooltip
              title={`${captain.address.street}, ${captain.address.city}, ${captain.address.state} - ${captain.address.postal_code}`}
            >
              <Text ellipsis className="text-sm">
                {captain.address.city}, {captain.address.state}
              </Text>
            </Tooltip>
          ) : (
            <Text type="secondary">Address not provided</Text>
          )}
        </div>
      ),
    },
    {
      title: "Assigned Families",
      key: "assignedFamilies",
      render: (_, captain) => (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          <Text className="font-medium">
            {formatAssignedFamilies(
              captain.assigned_families || captain.assignedFamilies
            )}
          </Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      sorter: true,
      render: (_, captain) => (
        <Tag color={getStatusColor(captain.status)} className="font-medium">
          {captain.status?.toUpperCase() || "UNKNOWN"}
        </Tag>
      ),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      render: (gender: string) => (
        <Text className="capitalize">
          {gender?.toLowerCase() || "Not specified"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, captain) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(captain)}
            />
          </Tooltip>
          <Tooltip title="Edit Captain">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(captain)}
              disabled={!isSuperAdminOrAdmin && !hasUpdatePermission()}
            />
          </Tooltip>
          <Dropdown
            overlay={renderActionsMenu(captain)}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="hover:bg-gray-100"
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="family-captain-table">
      <Table<FamilyCaptain>
        columns={columns}
        dataSource={data}
        loading={loading}
        className="my-4 w-full"
        rowSelection={rowSelection}
        pagination={{
          ...pagination,
          position: ["bottomCenter"],
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total: number, range: [number, number]) =>
            `Showing ${range[0]}-${range[1]} of ${total} family captains`,
        }}
        scroll={{ x: "max-content" }}
        size="middle"
        bordered
        rowClassName="hover:bg-gray-50 transition-colors"
        tableLayout="fixed"
        onChange={(paginationInfo, filters, sorter) => {
          console.log("Table changed:", { paginationInfo, filters, sorter });
        }}
        locale={{
          emptyText: (
            <div className="py-8 text-center">
              <UserOutlined className="text-4xl text-gray-300 mb-2" />
              <div className="text-gray-500">No family captains found</div>
              <div className="text-gray-400 text-sm mt-1">
                Try adjusting your search or filters
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
};

export default FamilyCaptainTable;
