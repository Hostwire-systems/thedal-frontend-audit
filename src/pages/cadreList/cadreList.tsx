import React, { JSX, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import {
  Col,
  Row,
  Select,
  Input,
  Button,
  message,
  Menu,
  Modal,
  Checkbox,
  Dropdown,
} from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  DownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import axios from "axios";
import { BASE_URL } from "../../config";

import {
  getCadresApi,
  deleteCadresApi,
  updateCadreApi,
  updateCadreBoothApi,
  getCadreSearchApi,
} from "../../api/cadreApi";
import {
  getVolunteerOtpSetting,
  updateVolunteerOtpSetting,
  updateVolunteerOtpSettingAlt,
  VolunteerOtpSetting,
} from "../../api/volunteerOtpApi";
import CadreTable from "./cadreTable";
import EditCadreModal from "../../components/editCadreModal";
import { RootState } from "../../redux/store";
import { getPartsApi } from "../../api/partApi";
import { Part } from "../../types/part";
import { useExport } from "../../context/ExportContext";
import { fetchRolesApi } from "../../api/roleApi";

const { Option } = Select;

interface Cadre {
  volunteerId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  assignedBooth: string;
  assignedBooths: string[];
  status: string;
  photoUrl: string | null;
  remarks: string;
  electionId?: string;
}

export default function CadreList(): JSX.Element {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [cadreList, setCadreList] = useState<Cadre[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredCadreList, setFilteredCadreList] = useState<Cadre[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedCadres, setSelectedCadres] = useState<Cadre[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [boothNumbers, setBoothNumbers] = useState<string[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [partsExport, setPartsExport] = useState<Part[]>([]);
  const [roles, setRoles] = useState<any>([]);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const [loadingBooths, setLoadingBooths] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<{
    roleName?: string;
    boothNumbers?: string[];
  }>({});
  const [selectedBoothNumber, setSelectedBoothNumber] = useState<string[]>([]);
  const [editingCadre, setEditingCadre] = useState<Cadre | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [filterDropdownVisible, setFilterDropdownVisible] =
    useState<boolean>(false);
  const { isLoading, setLoading: setLoadingPage } = useLoading();

  const userId = localStorage.getItem("userId");
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const { showExportModal } = useExport();

  const navigate = useNavigate();

  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const userRole = localStorage.getItem("role");
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  useEffect(() => {
    const fetchParts = async (): Promise<void> => {
      if (!selectedElectionId) return;
      try {
        setLoadingBooths(true);
        const response = await getPartsApi(parseInt(selectedElectionId));
        console.log("Parts response:", response.data);
        let validParts = Array.isArray(response.data) ? response.data : [];
        validParts = validParts.map((part) => ({
          ...part,
          partNo: Number(part?.partNo?.trim() ?? 0),
        }));

        validParts.sort((a, b) => {
          return a.partNo - b.partNo;
        });
        let partNumbersFromResponse = validParts
          .map((part: any) => part.partNo)
          .filter((pn: any) => !isNaN(pn) && pn !== null && pn !== undefined)
          .sort((a: number, b: number) => a - b);

        console.log("validParts", validParts);
        console.log("partNumbersFromResponse", partNumbersFromResponse);
        setParts(validParts);
        setPartsExport(partNumbersFromResponse);
      } catch (error) {
        console.error("Error fetching parts:", error);
        setParts([]);
      } finally {
        setLoadingBooths(false);
      }
    };
    fetchParts();
  }, [selectedElectionId]);

  useEffect(() => {
    resetState();
    if (selectedElectionId) {
      fetchCadres(0, pageSize, undefined, undefined); // Add undefined for roleName
    }
  }, [selectedElectionId]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetchRolesApi();
        const mappedRoles = response.data
          .filter((role) => role.roleName !== "SUPER_ADMIN")
          .map((role) => ({
            id: role.id,
            name: role.roleName,
            description: role.description,
            permissions: role.rolePermission,
          }));
        console.log("Roles", mappedRoles);
        setRoles(mappedRoles);
      } catch (error) {
        message.error("Failed to fetch roles");
      }
    };
    fetchRoles();
  }, []);

  // useEffect(() => {
  //   applyFilters();
  // }, [selectedBoothNumber, cadreList]);

  const resetState = () => {
    setCadreList([]);
    setFilteredCadreList([]);
    setParts([]);
    setSelectedBoothNumber([]);
    setSearchQuery("");
    setSelectedRole(null); // Reset role filter
    setAppliedFilters({}); // Reset applied filters
    setEditingCadre(null);
    setIsEditModalVisible(false);
  };

  const fetchCadres = async (
    page = 0,
    size = 10,
    boothNumbers?: string[],
    roleName?: string
  ): Promise<void> => {
    if (!selectedElectionId) return;

    try {
      setLoadingPage(true);
      console.log("selectedElectionId", selectedElectionId);
      const response = await getCadresApi(
        parseInt(selectedElectionId),
        parseInt(userId!),
        boothNumbers,
        roleName,
        page,
        size
      );
      console.log("response", response);

      const validCadres = response.data.content
        .filter(
          (cadre: Cadre) =>
            !cadre.electionId || cadre.electionId === selectedElectionId
        )
        .map((cadre: Cadre) => ({
          ...cadre,
          key: cadre.volunteerId,
        }));
      console.log("validCadres", validCadres);
      setCadreList(validCadres);
      setFilteredCadreList(validCadres);
      setTotalElements(response.data?.totalElements);
      setCurrentPage(page);
      setPageSize(size);

      //       const uniqueBoothNumbers = [
      //         ...new Set(validCadres.map((cadre) => cadre.assignedBooths).flat()),
      //       ]
      //         .filter(Boolean)
      //         .sort((a:any, b:any) => a - b);
      // ;
      //       console.log("uniqueBoothNumbers", uniqueBoothNumbers);
      //       setBoothNumbers(uniqueBoothNumbers);
    } catch (error) {
      console.error("Error fetching cadres:", error);
      setCadreList([]);
      setFilteredCadreList([]);
      // setBoothNumbers([]);

      // message.error("Failed to fetch cadres list");
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchVolunteerDetails = async (userId: number): Promise<void> => {
    try {
      // setLoadingPage(true);
      const response = await axios.get(
        `${BASE_URL}/volunteers/election/${selectedElectionId}/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            accept: "*/*",
          },
        }
      );

      if (response.data?.data) {
        // Removed the election ID check
        setEditingCadre(response.data.data);
        setIsEditModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching cadre details:", error);
      // message.error("Failed to fetch cadre details");
    } finally {
      // setLoadingPage(false);
    }
  };
  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all the cadres?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all the
            cadres.
          </p>
          <Checkbox
            onChange={(e) => {
              const isChecked = e.target.checked;
              modal.update({
                okButtonProps: {
                  disabled: !isChecked,
                  className: !isChecked ? "opacity-50 cursor-not-allowed" : "",
                },
              });
              modal._isDeleteConfirmed = isChecked;
            }}
            style={{ marginTop: 16 }}
          >
            I understand that by confirming, all the cadres will be permanently
            deleted
          </Checkbox>
        </div>
      ),
      okText: "Yes, Delete",
      okType: "danger",
      okButtonProps: {
        disabled: true,
        className: "opacity-50 cursor-not-allowed",
      },
      cancelText: "Cancel",
      async onOk() {
        if (modal._isDeleteConfirmed) {
          await handleDeleteCadre([]);
        }
      },
    });
  };

  const filterMenu = (
    <div className="bg-[#f9f9f9] p-3 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.1)] max-h-[450px] overflow-y-auto w-[320px]">
      <div>
        <span className="block mb-2 font-medium">Role:</span>
        <Select
          placeholder="Select Role"
          className="w-full"
          value={selectedRole}
          onChange={(value) => setSelectedRole(value)}
          allowClear
        >
          {roles?.map((r) => (
            <Option key={r.id} value={r.name}>
              {r.name}
            </Option>
          ))}
        </Select>
      </div>
      <Button
        type="primary"
        onClick={async () => {
          setFilterDropdownVisible(false);
          await applyFilters();
        }}
        block
        className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)] mt-4"
      >
        Apply Filters
      </Button>
      <Button
        onClick={() => {
          setSelectedRole(null);
          setAppliedFilters({});
          setFilterDropdownVisible(false);
          // Reset to original data without any filters
          fetchCadres(0, pageSize, undefined, undefined);
        }}
        block
        className="h-[46px] mt-2 bg-gray-200 border-gray-300 text-black hover:bg-gray-300"
      >
        Clear Filters
      </Button>
    </div>
  );

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "Delete Selected Cadres",
            content: `Are you sure you want to delete ${selectedCadres.length} cadre(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDeleteCadre(
                selectedCadres.map((cadre) => cadre.userId)
              );
            },
          });
        }}
        disabled={
          isFrozen ||
          selectedCadres.length === 0 ||
          loading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("cadreList"))
        }
      >
        {loading ? "Deleting..." : `Delete Selected (${selectedCadres.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("religion"))}
        danger
      >
        Delete All Cadres
      </Menu.Item>
      <Menu.Item
        key="export"
        icon={<DownloadOutlined />}
        onClick={() =>
          showExportModal("cadre", parseInt(selectedElectionId), partsExport)
        }
      >
        Export Cadres
      </Menu.Item>
    </Menu>
  );

  const applyFilters = async (): Promise<void> => {
    try {
      setLoadingPage(true);

      // Prepare filters object
      const filters = {
        roleName: selectedRole || undefined,
        boothNumbers:
          selectedBoothNumber.length > 0 &&
          !selectedBoothNumber.includes("All Booths")
            ? selectedBoothNumber
            : undefined,
      };

      setAppliedFilters(filters);

      // Call API with both boothNumbers and roleName filters
      const response = await getCadresApi(
        parseInt(selectedElectionId),
        parseInt(userId!),
        filters.boothNumbers,
        filters.roleName, // Pass roleName to API
        0, // Reset to first page
        pageSize
      );

      const filteredCadres = response.data.content
        .filter(
          (cadre: Cadre) =>
            !cadre.electionId || cadre.electionId === selectedElectionId
        )
        .map((cadre: Cadre) => ({
          ...cadre,
          key: cadre.volunteerId,
        }));

      setCadreList(filteredCadres);
      setFilteredCadreList(filteredCadres);
      setTotalElements(response.data?.totalElements);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error applying filters:", error);
      message.error("Failed to apply filters");
    } finally {
      setLoadingPage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleSearch = async (searchQuery: string): Promise<void> => {
    try {
      setLoadingPage(true);
      setSearchQuery(searchQuery);

      const res = await getCadreSearchApi(
        parseInt(selectedElectionId),
        searchQuery
      );

      const validCadres = res.data.content
        .filter(
          (cadre: Cadre) =>
            !cadre.electionId || cadre.electionId === selectedElectionId
        )
        .map((cadre: Cadre) => ({
          ...cadre,
          key: cadre.volunteerId,
        }));

      console.log("validCadres", validCadres);
      setCadreList(validCadres);
      setFilteredCadreList(validCadres);
      setTotalElements(res.data?.totalElements);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error while searching cadres:", error);
      // Optionally show a notification/snackbar here
    } finally {
      setLoadingPage(false);
    }
  };

  // const getUserIdFromVolunteerId = (volunteerId: string): string | null => {
  //   const cadre = cadreList.find((cadre) => cadre.volunteerId === volunteerId);
  //   return cadre ? cadre.userId : null;
  // };

  const handleDeleteCadre = async (userIds?: number[]): Promise<void> => {
    try {
      setLoading(true);
      console.log("userIds", userIds);
      await deleteCadresApi(parseInt(selectedElectionId), userIds);
      const successMessage = userIds?.length
        ? `${userIds.length} Cadre deleted successfully`
        : "All Cadres deleted successfully";

      message.success(successMessage);
      message.success("Cadre deleted successfully");
      console.log("Now fetching cadres again after deleting");
    } catch (error) {
      const errorMessage = userIds?.length
        ? "Failed to delete selected Cadres"
        : "Failed to delete all Cadres";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
      setSelectedRowKeys([]);
      setSelectedCadres([]);
      await fetchCadres(
        currentPage,
        pageSize,
        appliedFilters.boothNumbers,
        appliedFilters.roleName
      );
    }
  };

  const handleEditCadre = (cadre: Cadre): void => {
    fetchVolunteerDetails(cadre.userId);
  };

  const handleViewCadre = (cadre: Cadre): void => {
    navigate(`/cadre-details/${cadre.userId}`);
  };

  const handleUpdateCadre = async (updatedCadre: Cadre): Promise<void> => {
    try {
      // setLoadingPage(true);
      console.log("updatedCadre", updatedCadre);
      const boothData = {
        booths: [...updatedCadre?.assignedBooths],
        overwrite: true,
      };
      console.log("boothData", boothData);
      await updateCadreBoothApi(
        parseInt(selectedElectionId),
        updatedCadre.userId,
        boothData
      );
      await updateCadreApi(
        updatedCadre.userId,
        updatedCadre,
        selectedElectionId
      );
      message.success("Cadre updated successfully");
      await fetchCadres(
        currentPage,
        pageSize,
        appliedFilters.boothNumbers,
        appliedFilters.roleName
      );
    } catch (error) {
      console.error("Failed to update cadre:", error);
      message.error("Failed to update cadre");
    } finally {
      setIsEditModalVisible(false);
      // setLoadingPage(false);
      setButtonLoading(false);
    }
  };

  const handleBoothChange = (value: string[] | null): void => {
    const selectedValues = value || [];

    const filteredValues = selectedValues.includes("All Booths")
      ? ["All Booths"]
      : selectedValues;

    setSelectedBoothNumber(filteredValues);

    const boothNumbersToUse =
      filteredValues.includes("All Booths") || filteredValues.length === 0
        ? undefined
        : filteredValues;

    // Fetch data with combined filters - pass the currently selected role
    fetchCadres(0, pageSize, boothNumbersToUse, appliedFilters.roleName);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Cadre[]) => {
      console.log("selectedKeys", selectedKeys);
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedCadres(selectedRows);
    },
  };

  return (
    <div className="w-full h-full p-10 pt-5">
      {!selectedElectionId ? (
        <div className="text-center p-4">
          Please select an election to view cadres
        </div>
      ) : (
        //  isLoading ? (
        //   <div className="text-center p-4">
        //     <Spin size="large" />
        //   </div>
        // ) :
        <>
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={24}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Cadre List
              </h3>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="w-full items-end mt-10">
            <Col xs={24} sm={12} md={6}>
              <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
                Choose Booth Number
              </label>
              <Select
                className="w-full h-[45px] custom-select"
                mode="multiple"
                showSearch
                filterOption={(input, option) =>
                  option?.children
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                }
                placeholder={
                  loadingBooths ? "Loading booths..." : "Choose Booth Number"
                }
                loading={loadingBooths}
                disabled={loadingBooths}
                onChange={handleBoothChange}
                value={selectedBoothNumber}
                allowClear
              >
                {" "}
                <Option key="All Booths" value={"All Booths"}>
                  All Booths
                </Option>
                {parts.map((part) => (
                  <Option key={part.id} value={part.partNo}>
                    {part.partNo}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  placeholder="Search by name or number"
                  className=" input-element flex-1 h-[45px]"
                  value={searchQuery}
                  onChange={handleInputChange}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined style={{ color: "#fff" }} />}
                  className="h-[45px] px-12 bg-[#1D4ED8]"
                  style={{ width: "45px" }}
                  onClick={() => handleSearch(searchQuery)}
                />
                <Button
                  type="default"
                  className="h-[45px] px-4"
                  onClick={() => {
                    setSearchQuery("");
                    handleSearch("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <div className="flex flex-wrap gap-3 mt-2 md:mt-0">
                <Dropdown
                  overlay={filterMenu}
                  trigger={["click"]}
                  open={filterDropdownVisible}
                  onOpenChange={(visible) => setFilterDropdownVisible(visible)}
                >
                  <Button
                    type="primary"
                    className="h-[45px] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                  >
                    Filter <DownOutlined />
                  </Button>
                </Dropdown>
                <Dropdown overlay={actionsMenu} trigger={["click"]}>
                  <Button
                    type="primary"
                    className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                  >
                    Actions <DownOutlined />
                  </Button>
                </Dropdown>
              </div>
            </Col>
          </Row>
          <Row className="mt-10">
            <Col span={24}>
              <CadreTable
                filteredCadreList={filteredCadreList}
                onDeleteCadre={handleDeleteCadre}
                onEditCadre={handleEditCadre}
                onViewCadre={handleViewCadre}
                currentPage={currentPage}
                pageSize={pageSize}
                totalElements={totalElements}
                rowSelection={rowSelection}
                fetchCadres={fetchCadres}
                loading={isLoading}
              />
            </Col>
          </Row>
          <EditCadreModal
            buttonLoading={buttonLoading}
            setButtonLoading={setButtonLoading}
            visible={isEditModalVisible}
            onCancel={() => {
              setIsEditModalVisible(false);
              setEditingCadre(null);
            }}
            onUpdate={handleUpdateCadre}
            cadre={editingCadre}
            electionId={selectedElectionId}
          />
        </>
      )}
    </div>
  );
}
