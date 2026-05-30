import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Select,
  Row,
  Col,
  Avatar,
  Image,
  Spin,
  Button,
  Modal,
  Descriptions,
  Typography,
  message,
  Menu,
  Dropdown,
  Checkbox,
  Progress,
} from "antd";
import {
  UserOutlined,
  CameraOutlined,
  EyeOutlined,
  WarningOutlined,
  DownloadOutlined,
  DownOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { RootState } from "../../redux/store";
import { getPartsApi } from "../../api/partApi";
import { getVotersApi } from "../../api/voterApi";
import moment from "moment";
import {
  getDuplicateVotersApi,
  runDuplicateVotersApi,
  checkDuplicateVotersApiStatus,
} from "../../api/duplicateVoterApi";
import DuplicateProgressModal from "../../components/DuplicateProgressModal";
import { useExport } from "../../context/ExportContext";
import { useLoading } from "../../context/LoadingContext";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

const { Option } = Select;
const { Text } = Typography;

const DuplicateVotersList = () => {
  // Pagination state variables
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const { isLoading, setLoading: setIsLoading } = useLoading();

  // Data state variables
  const [votersList, setVotersList] = useState<any[]>([]);
  const [boothNumbers, setBoothNumbers] = useState<number[]>([]);
  const [selectedBoothNumber, setSelectedBoothNumber] = useState<string[]>([
    "ALL",
  ]);
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Progress tracking state
  const [duplicateRunStatus, setDuplicateRunStatus] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const userId = localStorage.getItem("userId");
  const { showExportModal } = useExport();
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const formatName = (
    firstName: string = "",
    lastName: string = "",
    firstNameL1: string = "",
    lastNameL1: string = ""
  ) => {
    const clean = (name: string) => (name ? name.replace(/-/g, "").trim() : "");
    return [
      clean(firstName),
      clean(lastName),
      clean(firstNameL1),
      clean(lastNameL1),
    ]
      .filter(Boolean)
      .join(" ");
  };

  const columns = [
    {
      title: "S.No",
      key: "sno",
      render: (_: any, __: any, index: number) =>
        currentPage * pageSize + index + 1,
    },
    {
      title: "Image",
      key: "image",
      render: (record: any) => (
        <div
          style={{
            width: 60,
            height: 60,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {record.photo_url ? (
            <Image
              src={record.photo_url}
              alt="Voter"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              preview={{
                mask: (
                  <CameraOutlined style={{ color: "#fff", fontSize: "16px" }} />
                ),
              }}
            />
          ) : (
            <Avatar
              size={60}
              icon={<UserOutlined />}
              style={{ backgroundColor: "#f0f0f0", color: "#8c8c8c" }}
            />
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: "EPIC Number",
      dataIndex: "epicNumber",
      key: "epicNumber",
    },
    {
      title: "Name",
      key: "name",
      render: (record: any) =>
        formatName(
          record.voterFnameEn,
          record.voterLnameEn,
          record.voterFnameL1,
          record.voterLnameL1
        ),
    },
    {
      title: "Age",
      key: "age",
      render: (record: any) => record.age || "N/A",
    },
    {
      title: "Relative Name",
      key: "relativeName",
      render: (record: any) =>
        formatName(
          record.rlnFnameEn,
          record.rlnLnameEn,
          record.rlnFnameL1,
          record.rlnLnameL1
        ),
    },
    {
      title: "Gender",
      key: "gender",
      render: (record: any) => {
        if (!record.gender) return "N/A";
        return (
          record.gender.charAt(0).toUpperCase() +
          record.gender.slice(1).toLowerCase()
        );
      },
    },
    {
      title: "Part No",
      dataIndex: "partNo",
      key: "partNo",
    },
    {
      title: "Section No",
      dataIndex: "sectionNo",
      key: "sectionNo",
      render: (sectionNumber: any) => {
        return sectionNumber !== null && sectionNumber !== undefined
          ? sectionNumber.toString()
          : "No data";
      },
    },
    {
      title: "Serial No",
      dataIndex: "serialNo",
      key: "serialNo",
    },
    {
      title: "Action",
      key: "action",
      render: (record: any) => (
        <Button
          type="primary"
          icon={<EyeOutlined style={{ color: "white" }} />}
          shape="circle"
          onClick={() => {
            setSelectedVoter(record);
            setIsModalVisible(true);
          }}
        />
      ),
      width: 100,
    },
  ];

  const fetchParts = useCallback(async () => {
    if (!selectedElectionId) return;

    try {
      const response = await getPartsApi(parseInt(selectedElectionId));
      console.log("Parts response:", response.data);

      const validParts = (
        Array.isArray(response.data) ? response.data : []
      ).map((part: any) => ({
        ...part,
        partNo: Number(part?.partNo?.trim() ?? 0),
      }));

      const partNumbersFromResponse = validParts
        .map((part: any) => part.partNo)
        .filter((pn: any) => !isNaN(pn) && pn !== null && pn !== undefined)
        .sort((a: number, b: number) => a - b);

      console.log("Mapped & Sorted Part Numbers:", partNumbersFromResponse);
      setBoothNumbers(partNumbersFromResponse);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setBoothNumbers([]);
    }
  }, [selectedElectionId]);

  const fetchVoters = useCallback(
    async (page = currentPage, size = pageSize) => {
      if (!selectedElectionId) return;

      try {
        setIsLoading(true);

        const params = {
          page,
          size,
          accountId: parseInt(userId!),
          partNo: selectedBoothNumber.includes("ALL")
            ? []
            : selectedBoothNumber,
        };

        console.log("Fetching duplicate voters with params:", params);
        const response = await getDuplicateVotersApi(
          selectedElectionId,
          params
        );

        const votersData = response.data?.data?.content || [];
        const total = response.data?.data?.totalElements || 0;

        const mappedData = votersData.map((voter: any, index: number) => ({
          ...voter,
          key: `${page}-${index}`,
          epicNumber: `${voter.epicNumber || "No data"}`,
          voterName: formatName(
            voter.voterFnameEn,
            voter.voterLnameEn,
            voter.voterFnameL1,
            voter.voterLnameL1
          ),
          age:
            voter.age !== undefined && voter.age !== null
              ? voter.age
              : voter.date_of_birth
              ? moment().diff(moment(voter.date_of_birth), "years")
              : "No Data",
          gender: voter.gender
            ? voter.gender.charAt(0).toUpperCase() +
              voter.gender.slice(1).toLowerCase()
            : "No data",
          relativeName: formatName(
            voter.rlnFnameEn,
            voter.rlnLnameEn,
            voter.rlnFnameL1,
            voter.rlnLnameL1
          ),
          partNumber: voter.partNo ?? "No data",
          sectionNumber:
            voter.sectionNo !== null && voter.sectionNo !== undefined
              ? voter.sectionNo
              : "No data",
          familyCount: voter.familyCount ?? "1",
          friendCount: voter.friendCount ?? "0",
          serialNumber: voter.serialNumber ?? "No data",
          pinCode: `${voter?.partManager?.pincode || "No Data"}`,
        }));

        setVotersList(mappedData);
        setTotalElements(total);
        setCurrentPage(page);
        setPageSize(size);
      } catch (error) {
        console.error("Error fetching duplicate voters:", error);
        setVotersList([]);
        setTotalElements(0);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedElectionId, selectedBoothNumber, currentPage, pageSize]
  );

  const showDuplicateCheckConfirmation = () => {
    if (isFrozen) {
      message.warning("Election is frozen. Duplicate check is disabled.");
      return;
    }
    let modal: any;

    modal = Modal.confirm({
      title: "Run Duplicate Voters Check?",
      content: (
        <div>
          <p>
            Are you sure you want to run double entry? <br />
            This action can be performed only once in 24 hours.
          </p>
          <Checkbox
            onChange={(e) => {
              const isChecked = e.target.checked;

              // Enable/disable the OK button dynamically
              modal.update({
                okButtonProps: {
                  disabled: !isChecked,
                  className: !isChecked ? "opacity-50 cursor-not-allowed" : "",
                },
              });

              // Store checkbox state on modal
              modal._isConfirmed = isChecked;
            }}
            style={{ marginTop: 16 }}
          >
            I understand that this operation can only be performed once in 24
            hours.
          </Checkbox>
        </div>
      ),
      okText: "Yes, Run Check",
      okType: "primary",
      okButtonProps: {
        disabled: true,
        className: "opacity-50 cursor-not-allowed",
      },
      cancelText: "Cancel",
      onOk() {
        if (modal._isConfirmed) {
          runDuplicateVotersCheck();
        }
      },
    });
  };

  const runDuplicateVotersCheck = async () => {
    if (isFrozen) {
      return;
    }
    try {
      if (!selectedElectionId || !userId) {
        message.error("Election ID or User ID is missing");
        return;
      }
      const response = await runDuplicateVotersApi(
        parseInt(selectedElectionId),
        parseInt(userId!)
      );
      console.log("Response of run duplicate voters check", response);
      
      // Start showing progress modal and polling
      if (response?.data?.data) {
        setDuplicateRunStatus(response.data.data);
        setIsRunning(true);
        setShowProgressModal(true);
      }
    } catch (error) {
      console.error("Error fetching histories: ", error);
    }
  };

  const checkDuplicateRunStatus = async (showCompletionMessage = true) => {
    if (!selectedElectionId || !userId) return;
    
    try {
      const response = await checkDuplicateVotersApiStatus(
        selectedElectionId,
        parseInt(userId!)
      );
      console.log("Duplicate run status response:", response);
      
      if (response?.data?.data) {
        const status = response.data.data;
        setDuplicateRunStatus(status);
        
        // Check if run is still active
        const isActive = status.status === "RUNNING" || status.status === "PENDING";
        setIsRunning(isActive);
        
        // Only show completion messages if we're actively polling (not on initial load)
        if (showCompletionMessage) {
          // If completed, refresh voters list and hide progress modal after a delay
          if (status.status === "COMPLETED") {
            setTimeout(() => {
              setShowProgressModal(false);
              fetchVoters(0, pageSize); // Refresh voters list
              message.success(
                `Double entry check completed! Found ${status.duplicateGroupsFound || 0} duplicate groups.`
              );
            }, 2000);
          } else if (status.status === "FAILED") {
            setTimeout(() => {
              setShowProgressModal(false);
              message.error("Double entry check failed. Please try again.");
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error("Error checking duplicate run status:", error);
    }
  };

  // Poll for status updates when a run is active
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (isRunning && selectedElectionId && userId) {
      console.log("Starting polling for duplicate run status...");
      // Immediate check
      checkDuplicateRunStatus();
      
      // Poll every 2 seconds
      pollInterval = setInterval(() => {
        checkDuplicateRunStatus();
      }, 2000);
    }
    
    return () => {
      if (pollInterval) {
        console.log("Stopping polling for duplicate run status");
        clearInterval(pollInterval);
      }
    };
  }, [isRunning, selectedElectionId, userId]);

  // Check status on component mount (silent check, no messages)
  useEffect(() => {
    if (selectedElectionId && userId) {
      checkDuplicateRunStatus(false); // Pass false to prevent showing completion message on page load
    }
  }, [selectedElectionId, userId]);

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="export"
        icon={<DownloadOutlined />}
        onClick={() =>
          showExportModal(
            "duplicate",
            parseInt(selectedElectionId),
            boothNumbers,
            parseInt(userId!)
          )
        }
      >
        Export Voters
      </Menu.Item>
    </Menu>
  );

  const handleBoothChange = (selectedValues: string[]) => {
    let updatedSelection = [...selectedValues];
    const lastSelectedBooth = updatedSelection[updatedSelection.length - 1];

    if (lastSelectedBooth === "ALL") {
      updatedSelection = ["ALL"];
    } else if (selectedBoothNumber.includes("ALL")) {
      updatedSelection = updatedSelection.filter((booth) => booth !== "ALL");
    }

    setSelectedBoothNumber(updatedSelection);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page - 1);
    setPageSize(size);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedVoter(null);
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchParts();
    }
  }, [selectedElectionId, fetchParts]);

  useEffect(() => {
    if (selectedElectionId) {
      fetchVoters();
    }
  }, [selectedElectionId, selectedBoothNumber, fetchVoters]);

  return (
    <div className="w-full h-full p-10 pt-5">
      <h3 className="text-2xl font-semibold mb-6">Double Entry Voters</h3>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} md={12}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Booth Number
            </label>
            <Select
              mode="multiple"
              className="w-full custom-select"
              style={{ minHeight: "45px", height: "auto" }}
              placeholder="Choose Booth number(s)"
              value={selectedBoothNumber}
              onChange={handleBoothChange}
              showSearch
              filterOption={(input, option) =>
                option?.children
                  ?.toString()
                  .toLowerCase()
                  .includes(input.toLowerCase()) ?? false
              }
            >
              <Option value="ALL">All Booths</Option>
              {boothNumbers.map((boothNumber) => (
                <Option key={boothNumber} value={String(boothNumber)}>
                  {boothNumber}
                </Option>
              ))}
            </Select>
          </div>
        </Col>
        <Col className="flex items-center" span={12}>
          {" "}
          <div className="flex  items-center gap-3">
            <Dropdown overlay={actionsMenu} trigger={["click"]}>
              <Button
                type="primary"
                className="h-[45px] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
              >
                Actions <DownOutlined />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              className={`h-[45px] text-[#fff] text-[15px] font-semibold px-3 ${
                isRunning 
                  ? 'bg-[#F97316] border-[#F97316] hover:!bg-[#EA580C] hover:border-[#EA580C] cursor-not-allowed' 
                  : 'bg-[#1D4ED8] border-[#1D4ED8] hover:!bg-[#1D4ED8] hover:border-[#1D4ED8]'
              } hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]`}
              onClick={showDuplicateCheckConfirmation}
              disabled={isFrozen}
              loading={isRunning}
            >
              {isRunning ? "Running..." : "Run Double Entry"}
            </Button>
            {isRunning && !showProgressModal && (
              <Button
                type="default"
                icon={<EyeOutlined />}
                className="h-[45px] text-[15px] font-semibold px-3"
                onClick={() => setShowProgressModal(true)}
              >
                Show Details
              </Button>
            )}
          </div>
        </Col>
        {/* <Col xs={24} md={12} className="flex mt-2 items-center">
            {" "}
            <Button
              type="primary"
              className="text-white  h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            >
              Duplicate Checker
            </Button>
          </Col> */}
      </Row>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          dataSource={votersList}
          rowClassName="table-header"
          className="voters-list-table"
          pagination={{
            current: currentPage + 1,
            pageSize,
            total: totalElements,
            position: ["bottomCenter"],
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} voters`,
          }}
          loading={isLoading}
          scroll={{ x: "max-content" }}
          bordered
        />
      </div>

      {/* Progress Modal */}
      <Modal
        title="Double Entry Check Progress"
        open={showProgressModal}
        footer={
          <Button onClick={() => setShowProgressModal(false)}>
            Close
          </Button>
        }
        onCancel={() => setShowProgressModal(false)}
        closable={true}
        centered
      >
        <div className="p-4">
          {duplicateRunStatus ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <Text strong>Status:</Text>
                  <Text 
                    type={
                      duplicateRunStatus.status === "COMPLETED" 
                        ? "success" 
                        : duplicateRunStatus.status === "FAILED" 
                        ? "danger" 
                        : "warning"
                    }
                  >
                    {duplicateRunStatus.status || "UNKNOWN"}
                  </Text>
                </div>
                
                {(duplicateRunStatus.totalVoters !== undefined && 
                  duplicateRunStatus.totalVoters !== null && 
                  duplicateRunStatus.totalVoters > 0) ? (
                  <>
                    <Progress
                      percent={Math.round(duplicateRunStatus.progressPercentage || 0)}
                      status={
                        duplicateRunStatus.status === "COMPLETED"
                          ? "success"
                          : duplicateRunStatus.status === "FAILED"
                          ? "exception"
                          : "active"
                      }
                      strokeColor={{
                        "0%": "#108ee9",
                        "100%": "#87d068",
                      }}
                    />
                    
                    <div className="mt-3 text-center text-gray-600">
                      <div>
                        Processed: {duplicateRunStatus.processedVoters || 0} of{" "}
                        {duplicateRunStatus.totalVoters} voters
                      </div>
                      {duplicateRunStatus.duplicateGroupsFound > 0 && (
                        <div className="mt-1 text-orange-600 font-semibold">
                          Found {duplicateRunStatus.duplicateGroupsFound} duplicate groups
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-center text-gray-500">
                    <Text>Initializing duplicate check...</Text>
                  </div>
                )}
                
                {duplicateRunStatus.status === "RUNNING" && (
                  <div className="mt-4 flex items-center justify-center">
                    <Spin />
                    <Text className="ml-2">Processing voters...</Text>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center p-4">
              <Spin />
              <Text className="ml-2">Loading status...</Text>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Double Entry Voter Details"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        centered
      >
        {selectedVoter && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="EPIC Number">
              <Text>{selectedVoter.epic_number || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Name">
              <Text>
                {formatName(
                  selectedVoter.voterFnameEn,
                  selectedVoter.voterLnameEn,
                  selectedVoter.voterFnameL1,
                  selectedVoter.voterLnameL1
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Age">
              <Text>{selectedVoter.age || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              <Text>
                {selectedVoter.gender
                  ? selectedVoter.gender.charAt(0).toUpperCase() +
                    selectedVoter.gender.slice(1).toLowerCase()
                  : "N/A"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Relative Name">
              <Text>
                {formatName(
                  selectedVoter.rlnFnameEn,
                  selectedVoter.rlnLnameEn,
                  selectedVoter.rlnFnameL1,
                  selectedVoter.rlnLnameL1
                )}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Part No">
              <Text>{selectedVoter.partNo || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Section No">
              <Text>
                {selectedVoter.sectionNo !== null &&
                selectedVoter.sectionNo !== undefined
                  ? selectedVoter.sectionNo.toString()
                  : "No data"}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Serial No">
              <Text>{selectedVoter.serialNo || "N/A"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mobile">
              <Text>{selectedVoter.mobileNo || "N/A"}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default DuplicateVotersList;
