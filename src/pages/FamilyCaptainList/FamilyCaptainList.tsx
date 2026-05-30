import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Input,
  Button,
  message,
  Modal,
  Select,
  Space,
  Typography,
  Card,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ExportOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import FamilyCaptainTable from "./FamilyCaptainTable";
import EditFamilyCaptainModal from "./EditFamilyCaptainModal";
import {
  getFamilyCaptains,
  deleteFamilyCaptain,
  deleteFamilyCaptains,
  getFamilyCaptainDetails,
  updateFamilyCaptain,
  updateAssignedFamilies,
} from "../../api/familyApi";
import {
  FamilyCaptain,
  FamilyCaptainDetails,
  FamilyCaptainFilters,
  UpdateFamilyCaptainPayload,
} from "../../types/familyCaptain";

const { Search } = Input;
const { Option } = Select;
const { Title } = Typography;
const { confirm } = Modal;

export default function FamilyCaptainList(): JSX.Element {
  // State management
  const [familyCaptains, setFamilyCaptains] = useState<FamilyCaptain[]>([]);
  const [filteredFamilyCaptains, setFilteredFamilyCaptains] = useState<
    FamilyCaptain[]
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedFamilyCaptains, setSelectedFamilyCaptains] = useState<
    FamilyCaptain[]
  >([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<FamilyCaptainFilters>({});
  const [statusFilter, setStatusFilter] = useState<string>("active");

  // Modal states
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editingFamilyCaptain, setEditingFamilyCaptain] =
    useState<FamilyCaptainDetails | null>(null);

  // Loading states
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();

  // Redux
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Permissions
  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");
  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  // Navigation
  const navigate = useNavigate();

  // Fetch family captains
  const fetchFamilyCaptains = useCallback(
    async (
      page = 0,
      size = 10,
      searchTerm?: string,
      filtersObj?: FamilyCaptainFilters
    ): Promise<void> => {
      if (!selectedElectionId) return;

      try {
        setLoadingPage(true);
        console.log(
          "Fetching family captains for election:",
          selectedElectionId
        );

        const response = await getFamilyCaptains(
          parseInt(selectedElectionId),
          page,
          size,
          filtersObj?.assignedFamilies,
          filtersObj?.mobileNumber,
          searchTerm || filtersObj?.searchTerm
        );

        if (response.status === "success" && response.data?.content) {
          const captainsWithKeys = response.data.content.map(
            (captain: FamilyCaptain) => ({
              ...captain,
              key: captain.id || captain.user_id,
              // Add compatibility fields
              firstName: captain.first_name,
              lastName: captain.last_name,
              mobileNumber: captain.mobile_number,
              photoUrl: captain.photo_url,
              volunteerId: captain.id,
              userId: captain.user_id,
            })
          );
          setFamilyCaptains(captainsWithKeys);
          setFilteredFamilyCaptains(captainsWithKeys);
          setTotalElements(response.data.totalElements || 0);
          setCurrentPage(page);
          setPageSize(size);
        } else {
          setFamilyCaptains([]);
          setFilteredFamilyCaptains([]);
          setTotalElements(0);
        }
      } catch (error) {
        console.error("Error fetching family captains:", error);
        message.error("Failed to fetch family captains");
        setFamilyCaptains([]);
        setFilteredFamilyCaptains([]);
        setTotalElements(0);
      } finally {
        setLoadingPage(false);
      }
    },
    [selectedElectionId]
  );

  // Fetch family captain details for editing
  const fetchFamilyCaptainDetails = async (userId: number): Promise<void> => {
    if (!selectedElectionId) return;

    try {
      setLoadingPage(true);
      const response = await getFamilyCaptainDetails(
        parseInt(selectedElectionId),
        userId
      );

      if (response.status === "success" && response.data) {
        const details: FamilyCaptainDetails = {
          ...response.data,
          // Add compatibility fields
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          mobileNumber: response.data.mobile_number,
          photoUrl: response.data.photo_url,
          assignedFamilies: response.data.assigned_families,
          assignedFamilyDetails: response.data.assigned_family_details,
        };
        setEditingFamilyCaptain(details);
        setIsEditModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching family captain details:", error);
      message.error("Failed to fetch family captain details");
    } finally {
      setLoadingPage(false);
    }
  };

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      const newFilters = { ...filters, searchTerm: value };
      setFilters(newFilters);
      setCurrentPage(0);
      fetchFamilyCaptains(0, pageSize, value, newFilters);
    },
    [filters, pageSize, fetchFamilyCaptains]
  );

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (value) {
      const filtered = familyCaptains.filter(
        (captain) => captain.status.toLowerCase() === value.toLowerCase()
      );
      setFilteredFamilyCaptains(filtered);
    } else {
      setFilteredFamilyCaptains(familyCaptains);
    }
  };

  // Handle page change
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page - 1);
    setPageSize(size);
    fetchFamilyCaptains(page - 1, size, searchQuery, filters);
  };

  // Handle row selection
  const handleRowSelection = {
    selectedRowKeys,
    onChange: (
      newSelectedRowKeys: React.Key[],
      newSelectedRows: FamilyCaptain[]
    ) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedFamilyCaptains(newSelectedRows);
    },
  };

  // Handle edit family captain
  const handleEditFamilyCaptain = (captain: FamilyCaptain): void => {
    fetchFamilyCaptainDetails(captain.user_id);
  };

  // Handle view family captain
  const handleViewFamilyCaptain = (captain: FamilyCaptain): void => {
    navigate(`/family-captain-details/${captain.user_id}`);
  };

  // Handle update family captain
  const handleUpdateFamilyCaptain = async (
    updatedCaptain: UpdateFamilyCaptainPayload,
    assignedFamilies: string[]
  ): Promise<void> => {
    if (!editingFamilyCaptain || !selectedElectionId) return;

    try {
      setButtonLoading(true);

      // Update personal details
      await updateFamilyCaptain(
        parseInt(selectedElectionId),
        editingFamilyCaptain.user_id,
        updatedCaptain
      );

      // Update assigned families if changed
      const currentFamilies = editingFamilyCaptain.assigned_families || [];
      const familiesChanged =
        JSON.stringify(currentFamilies.sort()) !==
        JSON.stringify(assignedFamilies.sort());

      if (familiesChanged) {
        await updateAssignedFamilies(
          parseInt(selectedElectionId),
          editingFamilyCaptain.user_id,
          assignedFamilies
        );
      }

      message.success("Family captain updated successfully");
      setIsEditModalVisible(false);
      setEditingFamilyCaptain(null);
      await fetchFamilyCaptains(currentPage, pageSize, searchQuery, filters);
    } catch (error) {
      console.error("Failed to update family captain:", error);
      message.error("Failed to update family captain");
    } finally {
      setButtonLoading(false);
    }
  };

  // Handle delete single family captain
  const handleDeleteFamilyCaptain = async (
    captain: FamilyCaptain
  ): Promise<void> => {
    if (!selectedElectionId) return;

    confirm({
      title: `Delete Family Captain`,
      content: `Are you sure you want to delete ${captain.first_name} ${captain.last_name}?`,
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setButtonLoading(true);
          await deleteFamilyCaptain(
            parseInt(selectedElectionId),
            captain.user_id
          );
          message.success("Family captain deleted successfully");
          await fetchFamilyCaptains(
            currentPage,
            pageSize,
            searchQuery,
            filters
          );
        } catch (error) {
          console.error("Error deleting family captain:", error);
          message.error("Failed to delete family captain");
        } finally {
          setButtonLoading(false);
        }
      },
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async (): Promise<void> => {
    if (selectedFamilyCaptains.length === 0 || !selectedElectionId) return;

    const userIds = selectedFamilyCaptains.map((captain) => captain.user_id);

    confirm({
      title: "Delete Selected Family Captains",
      content: `Are you sure you want to delete ${selectedFamilyCaptains.length} family captains?`,
      okText: "Yes, Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setButtonLoading(true);
          await deleteFamilyCaptains(parseInt(selectedElectionId), userIds);
          message.success(
            `${selectedFamilyCaptains.length} family captains deleted successfully`
          );
          setSelectedRowKeys([]);
          setSelectedFamilyCaptains([]);
          await fetchFamilyCaptains(
            currentPage,
            pageSize,
            searchQuery,
            filters
          );
        } catch (error) {
          console.error("Error deleting family captains:", error);
          message.error("Failed to delete family captains");
        } finally {
          setButtonLoading(false);
        }
      },
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchQuery("");
    setStatusFilter("");
    setFilters({});
    setSelectedRowKeys([]);
    setSelectedFamilyCaptains([]);
    fetchFamilyCaptains(0, pageSize);
  };

  // Effects
  useEffect(() => {
    if (selectedElectionId) {
      fetchFamilyCaptains(0, pageSize);
    } else {
      setFamilyCaptains([]);
      setFilteredFamilyCaptains([]);
      setTotalElements(0);
    }
  }, [selectedElectionId, fetchFamilyCaptains, pageSize]);

  useEffect(() => {
    console.log("Filtered family captains", filteredFamilyCaptains);
  }, [filteredFamilyCaptains]);

  return (
    <div className="w-full h-full p-6">
      <Card>
        {/* Header */}
        <Row justify="space-between" align="middle" className="mb-4">
          <Col>
            <Title level={3} className="m-0">
              Family Captain Management
            </Title>
            <p className="text-gray-500 mt-1">
              Manage family captains and their assigned families
            </p>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/create-family-captain")}
                disabled={
                  !isSuperAdminOrAdmin && !hasCreatePermission("family-captain")
                }
              >
                Add Family Captain
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                disabled={loadingPage}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Search and Filters */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="Search family captains..."
              allowClear
              enterButton={
                <Button
                  type="primary"
                  icon={<SearchOutlined style={{ color: "#fff" }} />}
                />
              }
              size="middle"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              disabled={loadingPage}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="Filter by status"
              style={{ width: "100%" }}
              allowClear
              value={statusFilter}
              onChange={handleStatusFilterChange}
              disabled={loadingPage}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBulkDelete}
                  disabled={
                    buttonLoading ||
                    (!isSuperAdminOrAdmin &&
                      !hasDeletePermission("family-captain"))
                  }
                  loading={buttonLoading}
                >
                  Delete ({selectedRowKeys.length})
                </Button>
              )}
              <Button
                icon={<ExportOutlined />}
                onClick={() => {
                  /* TODO: Implement export */
                }}
                disabled={loadingPage}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <FamilyCaptainTable
          data={filteredFamilyCaptains}
          loading={loadingPage}
          rowSelection={handleRowSelection}
          onEdit={handleEditFamilyCaptain}
          onView={handleViewFamilyCaptain}
          onDelete={handleDeleteFamilyCaptain}
          pagination={{
            current: currentPage + 1,
            pageSize: pageSize,
            total: totalElements,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `Showing ${range[0]}-${range[1]} of ${total} family captains`,
          }}
          hasUpdatePermission={() =>
            isSuperAdminOrAdmin || hasUpdatePermission("family-captain")
          }
          hasDeletePermission={() =>
            isSuperAdminOrAdmin || hasDeletePermission("family-captain")
          }
          isSuperAdminOrAdmin={isSuperAdminOrAdmin}
        />
      </Card>

      {/* Edit Modal */}
      <EditFamilyCaptainModal
        visible={isEditModalVisible}
        familyCaptain={editingFamilyCaptain}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingFamilyCaptain(null);
        }}
        onSubmit={handleUpdateFamilyCaptain}
        loading={buttonLoading}
        electionId={
          selectedElectionId ? parseInt(selectedElectionId) : undefined
        }
      />
    </div>
  );
}
