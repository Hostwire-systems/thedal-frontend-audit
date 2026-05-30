import React, { useState, useEffect } from "react";
import { Table, Button, Dropdown, Menu, Modal, message, Tooltip, Tag, Spin } from "antd";
import axios from "axios";
import { updateCadreApi } from "../../api/cadreApi";
import { ColumnType } from "antd/es/table";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  EllipsisOutlined,
  LaptopOutlined,
  MobileOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { BASE_URL } from "../../config";

interface Cadre {
  id: string;
  name: string;
  boothNumber: string;
  contactNo: string;
  userId: number;

  [key: string]: any;
}

interface CadreTableProps {
  filteredCadreList: Cadre[];
  onDeleteCadre: (id: string | number) => void;
  onEditCadre: (cadre: Cadre) => void;
  onViewCadre: (cadre: Cadre) => void;
  fetchCadres: (currentPage: number, pageSize: number) => void;
  loading: boolean;
  rowSelection?: any;
  currentPage: number;
  pageSize: number;
  totalElements: number;
}

const CadreTable: React.FC<CadreTableProps> = ({
  filteredCadreList,
  onDeleteCadre,
  onEditCadre,
  onViewCadre,
  fetchCadres,
  loading,
  rowSelection,
  currentPage,
  pageSize,
  totalElements,
}) => {
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  // --- Device sessions modal state ---
  const [devicesModalVisible, setDevicesModalVisible] = useState(false);
  const [selectedCadre, setSelectedCadre] = useState<Cadre | null>(null);
  const [cadreDevices, setCadreDevices] = useState<any[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const handleNoOfDevices = async (record: Cadre) => {
    setSelectedCadre(record);
    setCadreDevices([]);
    setDevicesModalVisible(true);
    setDevicesLoading(true);
    try {
      const res = await axios.get(
        `${BASE_URL}/volunteers/${record.volunteerId}/devices`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } }
      );
      setCadreDevices(res.data?.data || []);
    } catch (e) {
      message.error("Failed to fetch session details");
    } finally {
      setDevicesLoading(false);
    }
  };

  const handleRevokeAllDevices = async () => {
    if (!selectedCadre) return;
    try {
      await axios.delete(
        `${BASE_URL}/volunteers/${selectedCadre.volunteerId}/devices`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } }
      );
      message.success("All sessions revoked");
      setCadreDevices([]);
      setDevicesModalVisible(false);
      fetchCadres(currentPage, pageSize);
    } catch (e) {
      message.error("Failed to revoke sessions");
    }
  };

  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const fetchVolunteerDetails = async (userId: number): Promise<any> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/volunteers/election/${selectedElectionId}/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            accept: "*/*",
          },
        }
      );
      return response.data?.data;
    } catch (error) {
      console.error("Error fetching cadre details:", error);
      message.error("Failed to fetch cadre details");
      return null;
    } finally {
    }
  };

  const toggleStatus = async (cadre: Cadre): Promise<void> => {
    const newStatus = cadre.status === "active" ? "inactive" : "active";

    try {
      const fullCadreDetails = await fetchVolunteerDetails(cadre.userId);

      if (fullCadreDetails) {
        const updatedCadre = {
          ...fullCadreDetails,
          assignedBooth: fullCadreDetails.assignedBooth?.toString(),
          status: newStatus,
        };
        await updateCadreApi(
          cadre.userId,
          updatedCadre,
          parseInt(selectedElectionId)
        );
        message.success(`Cadre status updated to ${newStatus}`);
        await fetchCadres(currentPage, pageSize); // Refresh the cadre list
      }
    } catch (error) {
      console.error("Failed to update cadre status:", error);
      message.error("Failed to update cadre status");
    }
  };

  const confirmToggleStatus = (cadre: Cadre) => {
    Modal.confirm({
      title: `Change status for ${cadre.firstName} ${cadre.lastName}?`,
      content: `Are you sure you want to set the status to ${
        cadre.status === "active" ? "inactive" : "active"
      }?`,
      onOk: () => toggleStatus(cadre),
      okText: "Yes",
      cancelText: "No",
    });
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "sno",
      key: "sno",
      render: (_: any, __: any, index: number) =>
        currentPage * pageSize + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: Cadre) =>
        `${record.firstName} ${record.lastName ? record.lastName : ""}`,
    },
    {
      title: "Role",
      dataIndex: "roleName",
      key: "roleName",
      render: (roleName: string) => <span>{roleName}</span>,
    },
    {
      title: "Booth No",
      dataIndex: "assignedBooths",
      key: "assignedBooths",
      render: (booths: number[], record: any) => {
        // Check if booth sections are available
        const boothSections = record.assignedBoothSections;
        
        let boothText = "";
        
        if (boothSections && boothSections.length > 0) {
          // Display booth sections with section details
          boothText = boothSections.map((bs: any) => {
            if (bs.sectionNumbers && bs.sectionNumbers.length > 0) {
              // Specific sections: "Booth 1 (Sec: 2, 3)"
              return `${bs.boothNumber} (Sec: ${bs.sectionNumbers.join(', ')})`;
            } else {
              // Full booth: "Booth 1 (All)"
              return `${bs.boothNumber}`;
            }
          }).join(", ");
        } else {
          // Fallback to assignedBooths if no sections available
          boothText = booths?.join(", ") || "";
        }
        
        const maxLength = 100;

        return (
          <Tooltip title={boothText}>
            <span>
              {boothText.length > maxLength
                ? `${boothText.slice(0, maxLength)}...`
                : boothText}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "No. Of Devices",
      dataIndex: "active_device_count",
      key: "noOfDevices",
      render: (count: string, record: any) => (
        <span
          style={{ cursor: "pointer", color: "#1D4ED8" }}
          onClick={() => handleNoOfDevices(record)}
        >
          {count || 0}
        </span>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Cadre) => (
        <span
          onClick={() => confirmToggleStatus(record)}
          className={`inline-block cursor-pointer px-2 py-1 rounded-full text-xs ${
            status?.toLowerCase() === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    ,
    //  {
    //    title: "Cadre ID",
    //    dataIndex: "volunteerId",
    //    key: "volunteerId",
    //  },

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Cadre) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="view" onClick={() => onViewCadre(record)}>
                <EyeOutlined /> View
              </Menu.Item>
              <Menu.Item
                key="edit"
                onClick={() => onEditCadre(record)}
                disabled={
                  isFrozen || (!isSuperAdminOrAdmin && !hasUpdatePermission("cadreList"))
                }
              >
                <EditOutlined /> Edit
              </Menu.Item>
              <Menu.Item
                key="delete"
                onClick={() => showDeleteConfirm(record)}
                disabled={
                  isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("cadreList"))
                }
              >
                <DeleteOutlined /> Delete
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <EllipsisOutlined style={{ cursor: "pointer" }} />
        </Dropdown>
      ),
    },
  ];

  const showDeleteConfirm = (record: Cadre) => {
    Modal.confirm({
      title: "Are you sure you want to delete this cadre?",
      content: `Cadre name: ${record.firstName} ${record.lastName}`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No",
      onOk: () => onDeleteCadre([record.userId]),
    });
  };

  return (
    <>
      <Table<Cadre>
      columns={columns}
      dataSource={filteredCadreList}
      bordered
      rowClassName="table-header"
      style={{ backgroundColor: "#1D4ED85C" }}
      rowSelection={rowSelection}
      scroll={{ x: "max-content" }}
      className="cadre-list-table"
      pagination={{
        current: currentPage + 1,
        pageSize: pageSize,
        total: totalElements,
        onChange: (page, pageSize) => {
          fetchCadres(page - 1, pageSize); // Convert to 0-based index
        },
        onShowSizeChange: (current, size) => {
          fetchCadres(0, size); // Reset to first page when changing size
        },
        position: ["bottomCenter"],
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "50", "100", "200", "300", "500"],
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} items`,
      }}
    />

    <Modal
      title={
        <span>
          Active Sessions —{" "}
          <strong>{selectedCadre ? `${selectedCadre.firstName} ${selectedCadre.lastName || ""}` : ""}</strong>
        </span>
      }
      open={devicesModalVisible}
      onCancel={() => setDevicesModalVisible(false)}
      footer={
        cadreDevices.length > 0 ? (
          <Button danger onClick={handleRevokeAllDevices}>
            Logout from all devices
          </Button>
        ) : null
      }
      width={700}
      destroyOnClose
    >
      <Spin spinning={devicesLoading}>
        {cadreDevices.length === 0 && !devicesLoading ? (
          <p className="text-gray-500 text-center py-4">No active sessions found.</p>
        ) : (
          <Table
            dataSource={cadreDevices}
            rowKey="session_id"
            pagination={false}
            size="small"
            columns={[
              {
                title: "Device",
                key: "device",
                render: (_: any, rec: any) => (
                  <div className="flex items-center gap-2">
                    {rec.operating_system?.toLowerCase().includes("android") ||
                    rec.operating_system?.toLowerCase().includes("ios") ? (
                      <MobileOutlined className="text-gray-500" />
                    ) : rec.operating_system?.toLowerCase().includes("windows") ||
                      rec.operating_system?.toLowerCase().includes("mac") ||
                      rec.operating_system?.toLowerCase().includes("linux") ? (
                      <LaptopOutlined className="text-gray-500" />
                    ) : (
                      <GlobalOutlined className="text-gray-500" />
                    )}
                    <span>{rec.device_type || rec.operating_system || "Unknown"}</span>
                  </div>
                ),
              },
              {
                title: "Browser",
                dataIndex: "browser_name",
                key: "browser",
                render: (v: string) => v || "—",
              },
              {
                title: "IP Address",
                dataIndex: "ip_address",
                key: "ip",
                render: (v: string) => v || "—",
              },
              {
                title: "Last Active",
                dataIndex: "last_access_time",
                key: "lastActive",
                render: (v: string) =>
                  v ? new Date(v).toLocaleString() : "—",
              },
            ]}
          />
        )}
      </Spin>
    </Modal>
  </>
  );
};

export default CadreTable;
