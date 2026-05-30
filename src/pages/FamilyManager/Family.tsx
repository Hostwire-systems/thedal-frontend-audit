import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Checkbox,
  Input,
  Radio,
  InputNumber,
  Form,
  Tag,
  Dropdown,
} from "antd";
import {
  UserOutlined,
  CameraOutlined,
  EyeOutlined,
  DownloadOutlined,
  WarningOutlined,
  FolderOpenOutlined,
  TeamOutlined,
  EditOutlined,
  FilterOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { fetchBooths } from "../../api/boothApi";
import {
  getFamiliesSummary,
  getFamilyMembers,
  startFamilyMapping,
  getFamilyMappingStatus,
  checkFamilyMappingStatus,
  forceCancelFamilyMappingJob,
  reorderFamily,
  updateFamilyHead,
  updateFamilyPartNumber,
  verifyRunFamilyOTP,
} from "../../api/familyApi";
import { RootState } from "../../redux/store";
import { getPartsApi } from "../../api/partApi";
// ExportFamilyModal removed (replaced by backend async job export)
import FamilyMappingProgressModal from "../../components/FamilyMappingProgressModal";
import { FamilyMappingJobData } from "../../types/familyMapping";
import {
  FamilySummaryResponse,
  FamilyMembersResponse,
  FamilySummaryItem,
  FamilyMemberDetail,
} from "../../types/family";
import styled from "styled-components";
import {
  createFamilyVoterCardExportJob,
  getFamilyVoterCardExportJobStatus,
} from "../../api/familyExportJobApi";
import {
  createFamilyExcelExportJob,
  pollExcelExportJob,
} from "../../api/familyExcelExportApi";
import FamilyExportJobsModal from "./FamilyExportJobsModal";
import { familyModalColumns } from "./FamilyColumns";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import CustomRadioGroup from "../../components/common/CustomRadioGroup";
import FamilyMappingOtpVerification from "./FamilyMappingOtpVerification";
import AdvancedSearchModal from "../../components/Modals/AdvanceSearchModal";
import { useLoading } from "../../context/LoadingContext";

const { Option } = Select;
const { Text } = Typography;
const commonHeaderStyle: React.CSSProperties = {
  whiteSpace: "normal",
  wordWrap: "break-word",
};

const Family = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isAdvanceSearchModalVisible, setIsAdvanceSearchModalVisible] =
    useState<boolean>(false);
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);
  const [isCrossFamily, setIsCrossFamily] = useState<boolean | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<any>(null);
  const [familyStats, setFamilyStats] = useState({
    familyNumber: "",
    familyHead: "",
    assignedPart: "",
  });
  const [headerStats, setHeaderStats] = useState<any>({
    assignedPart: "",
    totalFamilies: "",
    familyCount: "",
    unmappedVotersCount: "",
    oneVoterFamilyCount: "",
  });
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [partNumbers, setPartNumbers] = useState<number[]>([]);
  const [search, setSearch] = useState<string>("");
  const [advancedFilters, setAdvancedFilters] = useState<any>(null);
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [families, setFamilies] = useState<FamilySummaryItem[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberDetail[]>([]);
  // removed exportMembers state (client-side PDF)
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [memberCurrentPage, setMemberCurrentPage] = useState(0);
  const [memberPageSize, setMemberPageSize] = useState(20);
  const [memberTotalElements, setMemberTotalElements] = useState(0);
  // removed isExportModalVisible state
  const [familySearchTerm, setFamilySearchTerm] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const hasInitializedPart = useRef(false);
  const [sortBy, setSortBy] = useState<string>("age");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState({
    families: false,
    members: false,
  });
  const { isLoading, setLoading:setGlobalLoading } = useLoading();

  // Family mapping states
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isProgressModalVisible, setIsProgressModalVisible] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [familyMappingJob, setFamilyMappingJob] =
    useState<FamilyMappingJobData | null>(null);
  const [familyMappingLoading, setFamilyMappingLoading] = useState(false);
  const [familyMappingError, setFamilyMappingError] = useState<string | null>(
    null,
  );
  const [selectedRunParts, setSelectedRunParts] = useState<number[]>([]);
  const [forceCancelLoading, setForceCancelLoading] = useState(false);
  const [checkingMappingStatus, setCheckingMappingStatus] = useState(false);
  const [isBackgroundJobRunning, setIsBackgroundJobRunning] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState(false);
  const exportPollingRef = useRef<NodeJS.Timeout | null>(null);
  const [exportingFamily, setExportingFamily] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | null
  >(null);
  const [isFamilyExportModalOpen, setIsFamilyExportModalOpen] = useState(false);
  const [selectedExportFamilyId, setSelectedExportFamilyId] = useState<
    string | null
  >(null);
  const [exportColumns, setExportColumns] = useState<2 | 3>(2);
  const [exportPartNo, setExportPartNo] = useState<number | null>(null);
  const [exportType, setExportType] = useState<"family" | "part">("family");
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");
  const [exportOrderBy, setExportOrderBy] = useState<"family" | "serial">(
    "family",
  );
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isFamilyMembersModalVisible, setIsFamilyMembersModalVisible] =
    useState(false);
  const [selectedFamilyForEdit, setSelectedFamilyForEdit] =
    useState<FamilySummaryItem | null>(null);
  const [selectedFamilyForMembers, setSelectedFamilyForMembers] =
    useState<FamilySummaryItem | null>(null);
  const [familyMembersForModal, setFamilyMembersForModal] = useState<
    FamilyMemberDetail[]
  >([]);
  const [newFamilySequenceNumber, setNewFamilySequenceNumber] =
    useState<number>(0);
  const [newFamilyHead, setNewFamilyHead] = useState<string>("");
  const [firstMember, setFirstMember] = useState<string>("");
  const [newPartNumber, setNewPartNumber] = useState<number>(0);
  const [familyMembersForEdit, setFamilyMembersForEdit] = useState<
    FamilyMemberDetail[]
  >([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpData, setOtpData] = useState<any>(null);
  const [otpVerificationLoading, setOtpVerificationLoading] = useState(false);
  const [loadingFamilyMembers, setLoadingFamilyMembers] = useState(false);
  const [editingLoading, setEditingLoading] = useState(false);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId,
  );
  const mobileNumberFromProfile = useSelector(
    (state: RootState) => state.userData?.profileDetails?.mobile,
  );
  const mobileNumberFromAuth = useSelector(
    (state: RootState) => state?.auth?.user?.mobileNumber,
  );
  const mobileNumber = mobileNumberFromProfile || mobileNumberFromAuth;
  const userDetails = useSelector(
    (state: RootState) => state.userData?.profileDetails,
  );

  const getAccountIdFromToken = (): number | null => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      const tokenAccountId = Number(payload?.accountId);
      return Number.isFinite(tokenAccountId) && tokenAccountId > 0
        ? tokenAccountId
        : null;
    } catch {
      return null;
    }
  };

  const userId = Number(localStorage.getItem("userId"));
  const accountId =
    Number(localStorage.getItem("accountId")) ||
    getAccountIdFromToken() ||
    undefined;
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {},
  );
  const userRole = localStorage.getItem("role");
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  // Memoized fetchBoothNumbers function

  const showAvailabilityModal = (record: any) => {
    setSelectedAvailability(record);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedAvailability(null);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters(null);
    setCurrentPage(0);
    setSelectedFamilyId(null);
    setFamilyMembers([]);
    fetchFamilies(0, pageSize, true);
    setIsAdvanceSearchModalVisible(false);
  };

  const handleAdvanceSearchModal = () => {
    setIsAdvanceSearchModalVisible(true);
  };
  const handleAdvanceSearch = (filters: any) => {
    setAdvancedFilters(filters);
    setCurrentPage(0);
    setSelectedFamilyId(null);
    setFamilyMembers([]);
    fetchFamilies(0, pageSize, true);
  };
  // removed handleExportFamily / handleExportModalClose

  const getCurrentFamilyIndex = () => {
    if (!selectedFamilyId || families.length === 0) return 0;
    return families.findIndex((family) => family.familyId === selectedFamilyId);
  };

  // removed convertMembersForExport helper

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
      setPartNumbers(partNumbersFromResponse);

      return partNumbersFromResponse;
    } catch (error) {
      console.error("Error fetching parts:", error);
      setPartNumbers([]);
      return [];
    }
  }, [selectedElectionId]);

  // Separate useEffect to set default part when parts are loaded for the first time
  useEffect(() => {
    if (partNumbers.length > 0 && !hasInitializedPart.current) {
      const defaultPart = partNumbers.includes(1) ? 1 : partNumbers[0];
      setSelectedPart(defaultPart);
      hasInitializedPart.current = true;
    }
  }, [partNumbers]);

  // Memoized fetchFamilies function - Updated to use new API
  const fetchFamilies = useCallback(
    async (page = 0, size = pageSize, resetList = true) => {
      if (!selectedElectionId) return;

      try {
        setLoading((prev) => ({ ...prev, families: true }));
setGlobalLoading(true);
        const partNumbersParam = selectedPart.toString();
        console.log("Advance filters",advancedFilters);

        const response: FamilySummaryResponse = await getFamiliesSummary(
          parseInt(selectedElectionId),
          undefined,
          partNumbersParam,
          page,
          size,
          isCrossFamily,
          advancedFilters,
        );

        console.log("Families response:", response); // Debug log

        if (
          response.status === "success" &&
          response.data &&
          response.data.families
        ) {
          const totalVotersCount = Number(response.data?.totalVotersCount || 0);
          const unmappedVotersCount = Number(
            response.data?.familyMappingStats?.unmappedVoterCount || 0,
          );
          const mappedFamilyVotersCount = Math.max(
            0,
            totalVotersCount - unmappedVotersCount,
          );

          // Handle the response structure: response.data.families.content
          const familiesData = response.data.families.content || [];
          console.log("Families Data", familiesData);

          if (resetList) {
            setFamilies(familiesData);
          } else {
            setFamilies((prev) => [...prev, ...familiesData]);
          }

          setTotalFamilies(response.data.families.totalElements || 0);

          // Set gender stats if available
          // Removed gender stats - no longer needed

          // Auto-select first family if not already selected and we're resetting the list
          if (resetList && familiesData.length > 0 && !selectedFamilyId) {
            setSelectedFamilyId(familiesData[0].familyId);
            setFamilyStats((prev) => ({
              ...prev,
              familyNumber: String(1),
            }));
          }
          setHeaderStats({
            familyMembersCount: mappedFamilyVotersCount,
            assignedPart: totalVotersCount,
            totalFamilies: response.data.families.totalElements,
            unmappedVotersCount: unmappedVotersCount,
            oneVoterFamilyCount:
              response.data?.familyMappingStats?.singleVoterFamilyCount,
          });
        } else {
          console.warn("Invalid response structure:", response);
          if (resetList) {
            setFamilies([]);
            setTotalFamilies(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch families:", error);
        if (resetList) {
          setFamilies([]);
          setFamilyMembers([]);
          setHeaderStats({
            familyMembersCount: 0,
            assignedPart: 0,
            totalFamilies: 0,
          });
          setTotalFamilies(0);
        }
        message.error("Failed to fetch families. Please try again.");
      } finally {
        setLoading((prev) => ({ ...prev, families: false }));
        setGlobalLoading(false);
      }
    },
    [advancedFilters, isCrossFamily, pageSize, selectedElectionId, selectedPart],
  );

  const refreshCurrentFamiliesPage = useCallback(() => {
    return fetchFamilies(currentPage, pageSize, true);
  }, [currentPage, fetchFamilies, pageSize]);

  const handlePartChange = (value: number) => {
    setSelectedPart(value);
    setSelectedFamilyId(null);
    setFamilyMembers([]);
    setCurrentPage(0); // Reset to first page when changing parts
    setMemberCurrentPage(0); // Reset member pagination
  };

  const onDragStart = () => {
    setIsDragging(true);
  };

  const buildReorderPayload = (reorderedFamilies: FamilySummaryItem[]) => {
    const familiesByPart = new Map<
      number,
      { nextIndex: number; occupiedSequenceNumbers: number[] }
    >();

    for (const [index, family] of reorderedFamilies.entries()) {
      const effectivePartNo = (family.firstMember.partNo !== null && family.firstMember.partNo !== undefined) ? family.firstMember.partNo : (selectedPart || 0);
      const fallbackSequence = currentPage * pageSize + index + 1;
      const familySequenceNumber = family.familySequenceNumber ?? fallbackSequence;

      const partBucket = familiesByPart.get(effectivePartNo);
      if (partBucket) {
        partBucket.occupiedSequenceNumbers.push(familySequenceNumber);
      } else {
        familiesByPart.set(effectivePartNo, {
          nextIndex: 0,
          occupiedSequenceNumbers: [familySequenceNumber],
        });
      }
    }

    for (const bucket of familiesByPart.values()) {
      bucket.occupiedSequenceNumbers.sort((left, right) => left - right);
    }

    return reorderedFamilies.map((family, index) => {
      const effectivePartNo = (family.firstMember.partNo !== null && family.firstMember.partNo !== undefined) ? family.firstMember.partNo : (selectedPart || 0);
      const partBucket = familiesByPart.get(effectivePartNo)!;
      const newSequenceNumber =
        partBucket.occupiedSequenceNumbers[partBucket.nextIndex];
      partBucket.nextIndex += 1;

      return {
        familyId: family.familyId,
        newSequenceNumber,
        effectivePartNo,
      };
    });
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Reorder families locally
    const reorderedFamilies = Array.from(families);
    const [movedFamily] = reorderedFamilies.splice(sourceIndex, 1);
    reorderedFamilies.splice(destinationIndex, 0, movedFamily);
    setFamilies(reorderedFamilies);

    // Prepare API payload
    const payload = buildReorderPayload(reorderedFamilies);
    try {
      await reorderFamily(parseInt(selectedElectionId!), payload);
      await refreshCurrentFamiliesPage();
    } catch (error) {
      console.error("Failed to update order:", error);
      // Revert on error
      refreshCurrentFamiliesPage();
    }
  };

  const filterMenu = (
    <div className="bg-[#f9f9f9] p-3 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.1)] w-[220px]">
      <div>
        <span className="block mb-2 font-medium">Cross Family:</span>
        <CustomRadioGroup
          value={isCrossFamily === null ? "both" : isCrossFamily ? "yes" : "no"}
          onChange={(e) => {
            const val = e.target.value;
            setIsCrossFamily(val === "both" ? null : val === "yes");
          }}
        >
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
          <Radio value="both">Both</Radio>
        </CustomRadioGroup>
      </div>
    </div>
  );

  // Set family members when family selection changes - Updated to use new API
  useEffect(() => {
    if (!selectedFamilyId || !selectedElectionId || families.length === 0) {
      setFamilyMembers([]);
      return;
    }

    const loadMembers = async () => {
      try {
        setLoading((prev) => ({ ...prev, members: true }));

        const response: FamilyMembersResponse = await getFamilyMembers(
          parseInt(selectedElectionId),
          selectedFamilyId,
          sortBy,
          sortOrder,
          memberCurrentPage,
          memberPageSize,
        );

        if (response.status === "success" && response.data) {
          let members = response.data.members;
          setFamilyMembers(members);
          setFamilyStats((prev) => ({
            ...prev,
            assignedPart: String(selectedPart),
            familyHead: members[0].voterFnameEn,
          }));
          setMemberTotalElements(response.data.totalElements || 0);
        }
      } catch (error) {
        console.error("Error loading family members:", error);
        setFamilyMembers([]);
        // message.error("Failed to load family members. Please try again.");
      } finally {
        setLoading((prev) => ({ ...prev, members: false }));
      }
    };

    loadMembers();
  }, [
    selectedFamilyId,
    selectedElectionId,
    families.length,
    sortBy,
    sortOrder,
    memberCurrentPage,
    memberPageSize,
  ]);

  // removed fetchAllFamilyMembers (legacy client PDF flow)

  const handleFamilySelection = (familyId: string) => {
    setSelectedFamilyId(familyId);
    const family = families.find((f) => f.familyId === familyId);
    if (family) {
      setFamilyStats({
        familyNumber: family.familySequenceNumber?.toString() || "1",
        familyHead: family.firstMember.name,
        assignedPart: family.firstMember.partNo?.toString() || "",
      });
    }
  };

  const showEditModal = (family: FamilySummaryItem) => {
    console.log("Selected family", family);
    setSelectedFamilyForEdit(family);
    setNewFamilyHead(family.firstMember.epicNumber!);
    setNewPartNumber((family.firstMember.partNo !== null && family.firstMember.partNo !== undefined) ? family.firstMember.partNo : selectedPart);
    setNewFamilySequenceNumber(family.familySequenceNumber || 0); // ADD THIS LINE
    setIsEditModalVisible(true);
    setFamilyMembersForEdit([]);
  };

  // Show family members modal
  const showFamilyMembersModal = async (family: FamilySummaryItem) => {
    setSelectedFamilyForMembers(family);
    try {
      setLoading((prev) => ({ ...prev, members: true }));
      const response: FamilyMembersResponse = await getFamilyMembers(
        parseInt(selectedElectionId!),
        family.familyId,
        sortBy,
        sortOrder,
        0, // Always show first page
        100, // Show more members
      );

      if (response.status === "success" && response.data) {
        console.log("Family members", response.data.members);
        setFamilyMembersForModal(response.data.members);
        setIsFamilyMembersModalVisible(true);
      }
    } catch (error) {
      console.error("Error loading family members:", error);
      message.error("Failed to load family members.");
    } finally {
      setLoading((prev) => ({ ...prev, members: false }));
    }
  };

  // Handle family edit submission
  const handleEditFamily = async () => {
    if (
      !selectedFamilyForEdit ||
      !selectedElectionId ||
      !newFamilySequenceNumber
    )
      return;

    setEditingLoading(true);
    try {
      const apiCalls = [];
      const changes = [];

      // Update family head if changed
      if (newFamilyHead !== selectedFamilyForEdit.firstMember.epic_number) {
        console.log("Family head epic number", newFamilyHead);
        apiCalls.push(
          updateFamilyHead(
            parseInt(selectedElectionId),
            selectedFamilyForEdit.familyId,
            newFamilyHead,
          ),
        );
        changes.push("family head");
      }

      const currentSequenceNumber =
        selectedFamilyForEdit.familySequenceNumber || 0;

      if (newFamilySequenceNumber !== currentSequenceNumber) {
        apiCalls.push(
          reorderFamily(parseInt(selectedElectionId), [
            {
              familyId: selectedFamilyForEdit.familyId,
              newSequenceNumber: newFamilySequenceNumber,
            },
          ]),
        );
        changes.push("family number");
      }

      // if(newFamilySequenceNumber!==selectedFamilyForEdit.familySequenceNumber){

      //   const reorderedFamilies=[...families];
      //   const currIndex=families.
      // }

      // Update part number if changed (when API is available)
      if (newPartNumber !== selectedFamilyForEdit.firstMember.partNo) {
        apiCalls.push(
          updateFamilyPartNumber(
            parseInt(selectedElectionId),
            selectedFamilyForEdit.familyId,
            newPartNumber,
          ),
        );
        changes.push("part number");
      }

      // Execute all API calls in parallel
      if (apiCalls.length > 0) {
        await Promise.all(apiCalls);
        message.success(`Successfully updated ${changes.join(" and ")}!`);
      } else {
        message.info("No changes were made");
      }

      setIsEditModalVisible(false);
      setFamilyMembersForEdit([]);
      await refreshCurrentFamiliesPage();
    } catch (error: any) {
      console.error("Error updating family:", error);

      // More specific error message
      if (error.response?.data?.message) {
        message.error(`Update failed: ${error.response.data.message}`);
      } else {
        message.error("Failed to update family. Please try again.");
      }
    } finally {
      setEditingLoading(false);
    }
  };

  const handleFamilySearch = (value: string) => {
    setFamilySearchTerm(value);
    // You can implement search functionality here if needed
    // For now, we'll just store the search term
  };

  const loadMoreFamilies = async () => {
    if (loadingMore || families.length >= totalFamilies) return;

    setLoadingMore(true);
    try {
      const nextPage = Math.floor(families.length / pageSize);
      const response: FamilySummaryResponse = await getFamiliesSummary(
        parseInt(selectedElectionId!),
        undefined, // boothNumbers
        selectedPart.toString(), // partNumbers
        nextPage,
        pageSize,
        isCrossFamily,
      );

      if (
        response.status === "success" &&
        response.data &&
        response.data.families
      ) {
        const newFamilies = response.data.families.content || [];
        setFamilies((prev) => [...prev, ...newFamilies]);
      }
    } catch (error) {
      console.error("Error loading more families:", error);
      message.error("Failed to load more families. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page - 1);
    setPageSize(size);
  };

  const handleMemberPageChange = (page: number, size: number) => {
    setMemberCurrentPage(page - 1);
    setMemberPageSize(size || memberPageSize);
  };

  // Trigger fetchFamilies when election or part changes
  useEffect(() => {
    if (selectedElectionId) {
      fetchFamilies(0, pageSize); // Always start from page 0 when filters change
      setCurrentPage(0);
    }
  }, [selectedElectionId, selectedPart, fetchFamilies, pageSize]);

  // Separate effect for pagination changes only
  useEffect(() => {
    if (selectedElectionId && currentPage > 0) {
      fetchFamilies(currentPage, pageSize);
    }
  }, [currentPage, fetchFamilies, selectedElectionId, pageSize]);

  // Function to fetch family members when modal opens
  useEffect(() => {
    const fetchFamilyMembersForEdit = async () => {
      if (!selectedFamilyForEdit || !selectedElectionId) return;

      try {
        setLoadingFamilyMembers(true);
        const response: FamilyMembersResponse = await getFamilyMembers(
          parseInt(selectedElectionId),
          selectedFamilyForEdit.familyId,
          "age", // default sort
          "desc", // default order
          0, // page
          100, // limit to get all members
        );

        if (response.status === "success" && response.data) {
          setFamilyMembersForEdit(response.data.members);
        }
      } catch (error) {
        console.error("Error loading family members for edit:", error);
        message.error("Failed to load family members");
      } finally {
        setLoadingFamilyMembers(false);
      }
    };

    if (isEditModalVisible && selectedFamilyForEdit) {
      fetchFamilyMembersForEdit();
    }
  }, [isEditModalVisible, selectedFamilyForEdit, selectedElectionId]);

  const handleRunFamily = () => {
    const defaultParts = (selectedPart !== null && selectedPart !== undefined) ? [selectedPart] : [];
    setSelectedRunParts(defaultParts);
    setRiskAcknowledged(false);
    setIsConfirmModalVisible(true);
  };

  // Check if family mapping is currently running for this election
  const checkFamilyMappingCompletionStatus = useCallback(async () => {
    if (!selectedElectionId) {
      setIsBackgroundJobRunning(false);
      return;
    }

    try {
      setCheckingMappingStatus(true);
      console.log(
        "Checking family mapping status for election:",
        selectedElectionId,
      );
      const response = await checkFamilyMappingStatus(
        parseInt(selectedElectionId),
      );
      console.log("Family mapping completion status response:", response);

      if (response && response.data === true) {
        setIsBackgroundJobRunning(true);
        console.log("Family mapping is currently running for this election");
      } else {
        setIsBackgroundJobRunning(false);
        console.log("No active family mapping job for this election");
      }
    } catch (error) {
      console.error("Error checking family mapping completion status:", error);
      setIsBackgroundJobRunning(false);
    } finally {
      setCheckingMappingStatus(false);
    }
  }, [selectedElectionId]);

  const handleConfirmFamilyMapping = async () => {
    if (!riskAcknowledged) {
      message.warning("Please acknowledge the risk before proceeding.");
      return;
    }

    if (!selectedElectionId) {
      message.error("No election selected.");
      return;
    }

    if (!selectedRunParts.length) {
      message.warning("Please select at least one part number.");
      return;
    }

    try {
      setFamilyMappingLoading(true);
      setFamilyMappingError(null);

      // First, call the runFamily API to get OTP
      console.log(
        "Requesting OTP for family mapping for election:",
        selectedElectionId,
      );
      const otpResponse = await startFamilyMapping(
        parseInt(selectedElectionId),
        mobileNumber!,
        selectedRunParts,
      );

      console.log("OTP response:", otpResponse);

      if (otpResponse && otpResponse.status === "success") {
        // Store the OTP data and show OTP modal
        setOtpData({
          electionId: parseInt(selectedElectionId),
          mobileNumber: mobileNumber,
          userId: userId,
          partNumbers: selectedRunParts,
        });

        setIsConfirmModalVisible(false);
        setShowOtpModal(true);
        message.success(
          `OTP sent to mobile number ending with ${mobileNumber!.slice(-4)}`,
        );
      } else {
        throw new Error(otpResponse?.message || "Failed to send OTP");
      }
    } catch (error: any) {
      console.error("Error requesting OTP for family mapping:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to request OTP";
      setFamilyMappingError(errorMessage);
      message.error(errorMessage);
    } finally {
      setFamilyMappingLoading(false);
    }
  };

  const handleOtpVerification = async (otp: string) => {
    if (!otpData) {
      message.error("No verification data available.");
      return;
    }

    try {
      setOtpVerificationLoading(true);

      console.log("Verifying OTP for family mapping:", {
        electionId: otpData.electionId,
        mobileNumber: otpData.mobileNumber,
        otp: otp,
      });

      const verificationResponse = await verifyRunFamilyOTP({
        electionId: otpData.electionId,
        mobileNumber: otpData.mobileNumber,
        otp: otp,
        partNumbers: otpData.partNumbers || [],
      });

      console.log("OTP verification response:", verificationResponse);

      if (
        verificationResponse &&
        verificationResponse.status === "success" &&
        verificationResponse.data
      ) {
        // OTP verified successfully, now start the family mapping job
        const jobData = verificationResponse.data;

        setShowOtpModal(false);
        setIsProgressModalVisible(true);
        setFamilyMappingJob(jobData);

        message.success("OTP verified successfully! Family mapping started.");

        // Store jobId for background polling
        localStorage.setItem("familyMappingJobId", jobData.jobId.toString());

        // Start polling for status updates
        console.log("Starting polling for job ID:", jobData.jobId);
        startStatusPolling(jobData.jobId);

        // Immediate status check
        setTimeout(async () => {
          try {
            console.log("Doing immediate status check...");
            const immediateCheck = await getFamilyMappingStatus(jobData.jobId);
            console.log("Immediate status check result:", immediateCheck);
            if (
              immediateCheck &&
              immediateCheck.status === "success" &&
              immediateCheck.data
            ) {
              setFamilyMappingJob(immediateCheck.data);
            }
          } catch (error) {
            console.error("Immediate status check failed:", error);
          }
        }, 1000);
      } else {
        throw new Error(
          verificationResponse?.message || "Invalid OTP verification response",
        );
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to verify OTP";
      message.error(errorMessage);
    } finally {
      setOtpVerificationLoading(false);
    }
  };

  // Add this function to handle OTP modal cancel
  const handleOtpModalCancel = () => {
    setShowOtpModal(false);
    setOtpData(null);
    setOtpVerificationLoading(false);
  };

  const startStatusPolling = (
    jobId: number,
    showModalUpdates: boolean = true,
  ) => {
    console.log(
      "Setting up polling for job ID:",
      jobId,
      "Show modal updates:",
      showModalUpdates,
    );

    // Set background job state
    if (!showModalUpdates) {
      setIsBackgroundJobRunning(true);
    }

    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        console.log("Polling status for job ID:", jobId);
        const statusResponse = await getFamilyMappingStatus(jobId);
        console.log("Status response:", statusResponse);

        if (
          statusResponse &&
          statusResponse.status === "success" &&
          statusResponse.data
        ) {
          // Only update modal state if we're showing modal updates
          if (showModalUpdates) {
            setFamilyMappingJob(statusResponse.data);
            console.log("Updated job data:", statusResponse.data);
          }

          // Stop polling if job is completed or failed
          if (
            statusResponse.data.status === "COMPLETED" ||
            statusResponse.data.status === "FAILED"
          ) {
            console.log(
              "Job finished with status:",
              statusResponse.data.status,
            );
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Remove stored jobId when polling ends and notify on failure
            localStorage.removeItem("familyMappingJobId");
            setIsBackgroundJobRunning(false);

            if (statusResponse.data.status === "FAILED") {
              message.error("Family mapping job failed.");
            } else if (statusResponse.data.status === "COMPLETED") {
              // Show notification for completion
              message.success({
                content:
                  "🎉 Family mapping completed successfully! Family data has been refreshed.",
                duration: 8,
                key: "family-mapping-complete",
              });
              // Refresh families data
              setTimeout(() => {
                fetchFamilies();
              }, 1000);
            }
            // If completed successfully, refresh the families data
          }
        } else {
          console.warn("Invalid status response:", statusResponse);
        }
      } catch (error) {
        console.error("Error polling family mapping status:", error);
        // Don't show error message for polling failures to avoid spam
        // But if too many failures, stop polling to prevent infinite errors
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleCloseFamilyMappingProgress = () => {
    // Clear polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // If job is still in progress, show background message and continue polling
    if (familyMappingJob?.status === "IN_PROGRESS") {
      message.info(
        "Family mapping will continue in the background. You will be notified when it's completed.",
      );

      // Restart polling in background (without showing modal)
      if (familyMappingJob.jobId) {
        startStatusPolling(familyMappingJob.jobId, false); // false = don't show modal updates
      }
    } else {
      // Clear stored jobId only if job is completed or failed
      localStorage.removeItem("familyMappingJobId");
    }

    setIsProgressModalVisible(false);
    setFamilyMappingJob(null);
    setFamilyMappingError(null);
  };

  const handleForceCancelFamilyMapping = async () => {
    if (!familyMappingJob?.jobId) {
      message.warning("No active family mapping job found.");
      return;
    }

    try {
      setForceCancelLoading(true);
      await forceCancelFamilyMappingJob(familyMappingJob.jobId);

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      localStorage.removeItem("familyMappingJobId");
      setIsBackgroundJobRunning(false);
      setFamilyMappingJob((prev) =>
        prev
          ? {
              ...prev,
              status: "FAILED",
              errorMessage: "FORCE_CANCELLED: Job was force-cancelled by user",
            }
          : prev,
      );

      message.success("Family mapping job force-cancelled.");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to force-cancel family mapping job";
      message.error(msg);
    } finally {
      setForceCancelLoading(false);
    }
  };

  // Cleanup polling interval on component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Resume polling if a family mapping job is in progress
  useEffect(() => {
    const storedJobId = localStorage.getItem("familyMappingJobId");
    if (storedJobId) {
      const jobId = parseInt(storedJobId, 10);
      console.log("Resuming polling for stored job ID:", jobId);

      // Check the current status first to decide if we should show the modal
      const checkStatusAndResume = async () => {
        try {
          const statusResponse = await getFamilyMappingStatus(jobId);
          if (statusResponse?.status === "success" && statusResponse.data) {
            if (statusResponse.data.status === "IN_PROGRESS") {
              // Job is still in progress, start background polling
              setIsBackgroundJobRunning(true);
              startStatusPolling(jobId, false); // Background polling, no modal
              message.info(
                "Family mapping is still in progress. You will be notified when it's completed.",
              );
            } else {
              // Job completed/failed while user was away, show final status
              setIsProgressModalVisible(true);
              setFamilyMappingJob(statusResponse.data);

              if (statusResponse.data.status === "COMPLETED") {
                message.success(
                  "Family mapping completed while you were away!",
                );
                fetchFamilies();
                localStorage.removeItem("familyMappingJobId");
                setIsBackgroundJobRunning(false);
              } else if (statusResponse.data.status === "FAILED") {
                message.error("Family mapping failed.");
                localStorage.removeItem("familyMappingJobId");
                setIsBackgroundJobRunning(false);
              }
            }
          }
        } catch (error) {
          console.error("Error checking resumed job status:", error);
          // If we can't check status, start polling with modal (safe fallback)
          setIsProgressModalVisible(true);
          startStatusPolling(jobId, true);
        }
      };

      checkStatusAndResume();
    }
  }, []);

  const formatName = (
    firstName: string = "",
    lastName: string = "",
    firstNameL1: string = "",
    lastNameL1: string = "",
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

  const renderVotingHistory = (vh: any) => {
    if (!vh) return <Text type="secondary">N/A</Text>;
    if (typeof vh === "string") return <Text>{vh}</Text>;
    if (Array.isArray(vh)) {
      return (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {vh.map((item: any) => (
            <div
              key={item?.id || item?.name}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Avatar
                src={item?.image || undefined}
                size={32}
                icon={<UserOutlined />}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Text>{item?.name || "-"}</Text>
                {item?.orderIndex != null && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{item.orderIndex}
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (typeof vh === "object" && vh.name) return <Text>{vh.name}</Text>;
    return <Text type="secondary">N/A</Text>;
  };

  const columns = [
    {
      title: "Family No.",
      key: "familyNo",
      dataIndex: "familySequenceNumber",
      render: (
        value: number | undefined,
        record: FamilySummaryItem,
        index: number,
      ) => {
        return value ?? currentPage * pageSize + index + 1;
      },
      width: 70,
      onHeaderCell: () => ({
        style: commonHeaderStyle,
      }),
    },
    {
      title: "Image",
      key: "photoUrl",
      dataIndex: ["firstMember", "photoUrl"],
      render: (url: any) => {
        let imageUrl = url;
        if (typeof url === "object" && url?.image) {
          imageUrl = url.image;
        } else if (typeof url === "object" && url?.name) {
          imageUrl = null; // Don't try to render object as image
        }
        return (
          <div
            style={{
              width: 70,
              height: 70,
              display: "flex",
              justifyContent: "center",
            }}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Voter Preview"
                style={{
                  width: "70px",
                  height: "70px",
                  objectFit: "cover",
                  borderRadius: 4,
                }}
                preview={false}
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
                  borderRadius: 4,
                }}
              >
                <UserOutlined style={{ fontSize: "36px", color: "#8c8c8c" }} />
              </div>
            )}
          </div>
        );
      },
      width: 90,
    },
    {
      title: "EPIC Number",
      dataIndex: ["firstMember", "epicNumber"],
      key: "epicNumber",
      sorter: true,
      render: (value: any) => {
        if (!value) return "N/A";
        if (typeof value === "string") return value;
        if (typeof value === "object" && value.name) return value.name;
        return "N/A";
      },
      width: 110,
    },
    {
      title: "Name",
      key: "name",
      render: (record: FamilySummaryItem) => (
        <span
          style={{
            display: "inline-block",
            maxWidth: 180,
            wordWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          {formatName(
            record.firstMember?.voterFnameEn || "",
            record.firstMember?.voterLnameEn || "",
            record.firstMember?.voterFnameL1 || "",
            record.firstMember?.voterLnameL1 || "",
          )}
        </span>
      ),
      width: 140,
    },
    {
      title: "Age",
      key: "age",
      render: (record: FamilySummaryItem) => record.firstMember?.age ?? "N/A",
      width: 60,
    },
    {
      title: "Relative Name",
      key: "relativeName",
      render: (record: FamilySummaryItem) => (
        <span
          style={{
            display: "inline-block",
            maxWidth: 180,
            wordWrap: "break-word",
            whiteSpace: "normal",
          }}
        >
          {formatName(
            record.firstMember?.rlnFnameEn || "",
            record.firstMember?.rlnLnameEn || "",
            record.firstMember?.rlnFnameL1 || "",
            record.firstMember?.rlnLnameL1 || "",
          )}
        </span>
      ),
      width: 140,
    },
    {
      title: "Relationship",
      dataIndex: ["firstMember", "rlnType"],
      key: "rlnType",
      render: (value: any) => {
        if (!value) return "N/A";
        if (typeof value === "string") return value;
        if (typeof value === "object" && value.name) return value.name;
        return "N/A";
      },
      width: 120,
    },
    {
      title: "Gender",
      key: "gender",
      render: (record: FamilySummaryItem) => {
        const gender = record.firstMember?.gender;
        if (!gender) return "N/A";
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      },
      width: 80,
    },
    {
      title: "Part No",
      dataIndex: ["firstMember", "partNo"],
      key: "partNo",
      sorter: true,
      width: 70,
      render: (value: any) => {
        if (value === null || value === undefined) return "N/A";
        if (typeof value === "number") return value;
        if (typeof value === "object" && value.name) return value.name;
        return "N/A";
      },
    },
    {
      title: "Serial No",
      dataIndex: ["firstMember", "serialNo"],
      key: "serialNo",
      sorter: true,
      render: (value: any) => {
        if (value === null || value === undefined) return "N/A";
        if (typeof value === "number") return value;
        if (typeof value === "object" && value.name) return value.name;
        return "N/A";
      },
      width: 80,
    },
    {
      title: "Family Count",
      dataIndex: "memberCount",
      key: "familyCount",
      width: 80,
    },
    {
      title: "Mobile",
      dataIndex: ["firstMember", "mobileNo"],
      key: "mobileNo",
      render: (value: any) => {
        if (!value) return "N/A";
        if (typeof value === "string" || typeof value === "number")
          return value;
        if (typeof value === "object" && value.name) return value.name;
        return "N/A";
      },
      width: 100,
    },
    // {
    //   title: "Verification Status",
    //   key: "verification",
    //   render: (record: FamilySummaryItem) => (
    //     <div>
    //       <div>Voter: {record.firstMember?.memberVerified ? "✓" : "✗"}</div>
    //       <div>Aadhaar: {record.firstMember?.aadhaarVerified ? "✓" : "✗"}</div>
    //     </div>
    //   ),
    //   width: 120,
    //   onHeaderCell: () => ({
    //     style: commonHeaderStyle,
    //   }),
    // },
    {
      title: "Voting History",
      dataIndex: ["firstMember", "votingHistory"],
      key: "votingHistory",
      render: (value: any) => {
        // votingHistory may be a string, an object, or an array of items
        if (!value) return "N/A";
        if (typeof value === "string") return value;
        if (Array.isArray(value)) {
          const names = value
            .map((v: any) =>
              v && typeof v === "object" ? v.name || "" : String(v),
            )
            .filter(Boolean);
          return names.length > 0 ? names.join(", ") : "N/A";
        }
        if (typeof value === "object" && value.name) return value.name;
        return "N/A";
      },
      width: 125,
    },
    {
      title: "Action",
      key: "action",
      render: (record: FamilySummaryItem) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EyeOutlined style={{ color: "white" }} />}
            shape="circle"
            onClick={() => showAvailabilityModal(record.firstMember)}
            disabled={!record?.firstMember}
          />
          <Button
            type="default"
            icon={<TeamOutlined />}
            shape="circle"
            onClick={() => showFamilyMembersModal(record)}
            disabled={!record}
          />
          <Button
            type="default"
            icon={<EditOutlined />}
            disabled={
              !record ||
              (!isSuperAdminOrAdmin && !hasUpdatePermission("family"))
            }
            shape="circle"
            onClick={() => showEditModal(record)}
          />
        </div>
      ),
      width: 150,
    },
  ];

  // Reset part initialization flag when election changes
  useEffect(() => {
    hasInitializedPart.current = false;
  }, [selectedElectionId]);

  useEffect(() => {
    if (selectedElectionId) {
      fetchParts();
      checkFamilyMappingCompletionStatus(); // Check if family mapping is already completed
    }
  }, [selectedElectionId, fetchParts, checkFamilyMappingCompletionStatus]);

  const handleCreateFamilyPdfExport = async () => {
    console.log("Export attempt:", {
      selectedExportFamilyId,
      selectedElectionId,
      accountId,
      exportType,
      exportFormat,
      isCrossFamily,
      exportColumns,
      exportPartNo,
      exportOrderBy,
    });

    if (exportType === "family" && !selectedExportFamilyId) {
      message.warning("Please select a family first");
      return;
    }

    if (exportType === "part" && (!exportPartNo || exportPartNo <= 0)) {
      message.warning("Please select a valid part number for part-wide export");
      return;
    }

    if (!selectedElectionId) {
      message.warning("Please select an election first");
      return;
    }

    if (!accountId || accountId === 0) {
      message.warning("Account ID not found. Please refresh and try again.");
      return;
    }

    try {
      setExportingFamily(true);
      setExportStatus("PENDING");
      setIsFamilyExportModalOpen(false);
      // Handle Excel export
      if (exportFormat === "excel") {
        console.log(
          "Starting Excel export for:",
          exportType === "part"
            ? `part ${exportPartNo}`
            : `family ${selectedExportFamilyId}`,
        );
        const payload: any = {
          electionId: parseInt(selectedElectionId),
          accountId,
          exportType,
          familyId:
            exportType === "family" ? selectedExportFamilyId! : undefined,
          partNo:
            exportType === "part" && exportPartNo ? exportPartNo : undefined,
          orderBy: exportOrderBy,
          crossFamily: exportType === "part" ? isCrossFamily : undefined,
        };

        const res = await createFamilyExcelExportJob(payload);

        if (res.status === "success" && res.data) {
          pollExcelExportJobHandler(res.data.id);
          message.success(
            `${
              exportType === "part" ? "Part" : "Family"
            } Excel export job created`,
          );
        } else {
          message.error("Failed to create Excel export job");
          setExportingFamily(false);
          setExportStatus(null);
        }
        return;
      }

      // Handle PDF export (existing logic)
      // Always use a real UUID - for part exports, use the currently selected family UUID as routing key
      const familyIdToUse =
        selectedExportFamilyId ||
        (families.length > 0 ? families[0].familyId : null);

      if (!familyIdToUse) {
        message.error(
          "No family available for export. Please ensure families are loaded.",
        );
        setExportingFamily(false);
        setExportStatus(null);
        return;
      }

      console.log(
        "Starting PDF export for:",
        exportType === "part"
          ? `part ${exportPartNo}`
          : `family ${selectedExportFamilyId}`,
      );

      const res = await createFamilyVoterCardExportJob({
        familyId: familyIdToUse,
        electionId: parseInt(selectedElectionId),
        accountId,
        partNo:
          exportType === "part" && exportPartNo ? exportPartNo : undefined,
        columns: exportColumns,
        orderBy: exportType === "part" ? exportOrderBy : undefined,
        crossFamily: exportType === "part" ? isCrossFamily : undefined,
      });

      if (res.status === "success" && res.data) {
        pollExportJob(res.data.id, familyIdToUse);
        message.success(
          `${exportType === "part" ? "Part" : "Family"} PDF export job created`,
        );
      } else {
        message.error("Failed to create export job");
        setExportingFamily(false);
        setExportStatus(null);
      }
    } catch (e) {
      console.error("Export error:", e);
      message.error(
        "Export failed: " + (e instanceof Error ? e.message : "Unknown error"),
      );
      setExportingFamily(false);
      setExportStatus(null);
    }
  };

  const handleOpenFamilyExportModal = () => {
    if (!selectedElectionId) {
      message.warning("Please select an election first");
      return;
    }
    setIsFamilyExportModalOpen(true);
    // Pre-select the currently selected family if one exists
    setSelectedExportFamilyId(selectedFamilyId);
  };

  const handleCloseFamilyExportModal = () => {
    setIsFamilyExportModalOpen(false);
    setSelectedExportFamilyId(null);
    setExportPartNo(null);
    setExportType("family");
    setExportColumns(2);
    setExportFormat("pdf");
    setExportOrderBy("family");
  };

  const pollExportJob = (jobId: string, familyId: string) => {
    if (exportPollingRef.current) clearInterval(exportPollingRef.current);
    const startedAt = Date.now();
    exportPollingRef.current = setInterval(async () => {
      if (!selectedElectionId || !accountId) return;
      if (Date.now() - startedAt > 2 * 60 * 1000) {
        // timeout 2 min
        clearInterval(exportPollingRef.current!);
        setExportingFamily(false);
        message.warning("Export polling timed out");
        return;
      }
      try {
        const statusRes = await getFamilyVoterCardExportJobStatus(
          familyId,
          parseInt(selectedElectionId),
          jobId,
          accountId,
        );
        const job = statusRes.data;
        if (!job) {
          // not found
          clearInterval(exportPollingRef.current!);
          setExportingFamily(false);
          setExportStatus(null);
          message.error("Export job not found");
          return;
        }
        setExportStatus(job.status);
        if (job.status === "COMPLETED") {
          clearInterval(exportPollingRef.current!);
          setExportingFamily(false);

          // Create proper UI label based on job type
          let exportTypeText = "Family";
          if (job.partNo) {
            exportTypeText = `Part ${job.partNo}`;
          }

          // Add layout info if 3 columns
          const layoutInfo = job.columns === 3 ? " (3 cols)" : "";

          message.success({
            content: (
              <span>
                {exportTypeText} PDF ready{layoutInfo}.{" "}
                <a
                  href={job.s3Url || undefined}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </span>
            ),
            duration: 10,
          });
          // auto open in new tab
          if (job.s3Url) {
            window.open(job.s3Url, "_blank");
          }
        } else if (job.status === "FAILED") {
          clearInterval(exportPollingRef.current!);
          setExportingFamily(false);
          message.error(job.errorMessage || "Export failed");
        }
      } catch (err) {
        // ignore transient errors
      }
    }, 2500);
  };

  const pollExcelExportJobHandler = async (jobId: number) => {
    try {
      const job = await pollExcelExportJob(jobId, accountId!, (status) => {
        setExportStatus(
          status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED",
        );
      });

      setExportingFamily(false);
      setExportStatus("COMPLETED");

      // Create proper UI label based on job type
      const exportTypeText =
        exportType === "part" ? `Part ${exportPartNo}` : "Family";

      message.success({
        content: (
          <span>
            {exportTypeText} Excel ready ({job.rowCount || 0} rows).{" "}
            <a href={job.s3Url || undefined} target="_blank" rel="noreferrer">
              Download
            </a>
          </span>
        ),
        duration: 10,
      });

      // auto open in new tab
      if (job.s3Url) {
        window.open(job.s3Url, "_blank");
      }
    } catch (error) {
      setExportingFamily(false);
      setExportStatus("FAILED");
      message.error(
        "Excel export failed: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  };

  useEffect(() => {
    return () => {
      if (exportPollingRef.current) clearInterval(exportPollingRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full p-10 pt-5">
      <h2 className="text-2xl font-semibold mb-6">Family Members</h2>
      {/* <Spin spinning={loading.families}> */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={6} md={4}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Number
              </label>
              <Select
                className="w-full custom-select"
                style={{
                  height: "45px",
                }}
                placeholder="Select Part Number"
                value={selectedPart}
                onChange={handlePartChange}
                loading={loading.families}
                disabled={loading.families || !partNumbers.length}
                showSearch
                filterOption={false}
                onSearch={(value) => setSearch(value)}
                notFoundContent={null}
                dropdownRender={(menu) => (
                  <>
                    <div style={{ padding: 8 }}>
                      <Input
                        className="placeholder:text-xs"
                        autoFocus
                        placeholder="Search Part Number"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    <div>{menu}</div>
                  </>
                )}
              >
                {partNumbers
                  .filter((part) =>
                    part
                      .toString()
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((partNo) => (
                    <Option key={partNo} value={partNo}>
                      {partNo}
                    </Option>
                  ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={10} md={14}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="primary"
                    onClick={handleRunFamily}
                    disabled={
                      !selectedElectionId ||
                      loading.families ||
                      familyMappingLoading ||
                      checkingMappingStatus ||
                      isBackgroundJobRunning ||
                      (!isSuperAdminOrAdmin && !hasUpdatePermission("family"))
                    }
                    loading={
                      !isBackgroundJobRunning &&
                      (familyMappingLoading || checkingMappingStatus)
                    }
                    style={{
                      backgroundColor: isBackgroundJobRunning
                        ? "#1D4ED8"
                        : "#1D4ED8",
                      borderColor: isBackgroundJobRunning
                        ? "#1D4ED8"
                        : "#1D4ED8",
                      height: "45px",
                      minWidth: "100px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      color: "white",
                      flex: "0 1 auto",
                    }}
                    title={
                      isBackgroundJobRunning
                        ? "Family mapping is running in the background"
                        : "Start family mapping process"
                    }
                  >
                    {isBackgroundJobRunning ? (
                      <>
                        <Spin size="small" style={{ color: "white" }} />
                        <span style={{ marginLeft: "8px", color: "white" }}>
                          Running
                        </span>
                      </>
                    ) : (
                      <>
                        <UserOutlined />
                        Run Family
                      </>
                    )}
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleOpenFamilyExportModal}
                    loading={exportingFamily}
                    style={{
                      backgroundColor: "#1D4ED8",
                      borderColor: "#1D4ED8",
                      height: "45px",
                      minWidth: "120px",
                      flex: "0 1 auto",
                    }}
                  >
                    {exportingFamily
                      ? exportStatus === "RUNNING"
                        ? "Generating..."
                        : exportStatus === "PENDING"
                          ? "Queued..."
                          : "Exporting"
                      : "Export Family"}
                  </Button>
                  <Button
                    icon={<FolderOpenOutlined />}
                    onClick={() => setIsDownloadsModalOpen(true)}
                    style={{
                      height: "45px",
                      width: "45px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="View Downloads"
                  />
                  {exportStatus && exportingFamily && (
                    <span
                      style={{
                        display: "inline-block",
                        background:
                          exportStatus === "FAILED" ? "#ffe2e2" : "#e6f4ff",
                        color:
                          exportStatus === "FAILED" ? "#d4380d" : "#0958d9",
                        padding: "4px 12px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        marginLeft: 8,
                      }}
                    >
                      {exportStatus}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 ">
                  <Button
                    type="default"
                    className="h-[45px] text-[#fff] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                    onClick={handleAdvanceSearchModal}
                  >
                    Advance Search
                  </Button>
                  <Dropdown
                    overlay={filterMenu}
                    trigger={["click"]}
                    open={filterDropdownVisible}
                    onOpenChange={(visible) =>
                      setFilterDropdownVisible(visible)
                    }
                    placement="bottomRight"
                  >
                    <Button
                      type="primary"
                      className="h-[45px] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                      icon={<FilterOutlined />}
                    >
                      Filter <DownOutlined />
                    </Button>
                  </Dropdown>
                </div>
              </div>
            </div>
          </Col>
        </Row>
        <Row className="mt-6">
          <Col span={24}>
            <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-6 py-3 rounded-lg border border-gray-300 shadow-sm">
              <span className="text-[16px] font-semibold text-[#1F2937]">
                Part Voter:{" "}
                <span className="text-[#2563EB]">
                  {headerStats.assignedPart}
                </span>{" "}
                | Total Family:{" "}
                <span className="text-[#2563EB]">
                  {headerStats.totalFamilies}
                </span>{" "}
                | Family Members:{" "}
                <span className="text-[#2563EB]">
                  {headerStats.familyMembersCount}
                </span>
              </span>
              <span className="text-[16px] font-semibold text-[#1F2937]">
                Unmapped Voters:{" "}
                <span className="text-[#2563EB]">
                  {headerStats.unmappedVotersCount || "N/A "}
                </span>{" "}
                | 1-Voter Family:{" "}
                <span className="text-[#2563EB]">
                  {headerStats.oneVoterFamilyCount || "N/A "}
                </span>
              </span>
            </div>
          </Col>
        </Row>

        {/* <Spin spinning={loading.members} > */}
        <div className="overflow-x-auto mt-10">
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <StrictModeDroppable
              droppableId="droppable"
              direction="vertical"
              type="ROW"
            >
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  <Table
                    columns={columns}
                    rowKey={"key"}
                    dataSource={families.map((family, index) => ({
                      ...family,
                      key: family.familyId,
                    }))}
                    style={{ backgroundColor: "#1D4ED85C" }}
                    className="my-4 default-list-table"
                    pagination={
                      isDragging
                        ? false
                        : {
                            current: currentPage + 1,
                            pageSize: pageSize,
                            total: totalFamilies,
                            position: ["bottomCenter"],
                            pageSizeOptions: [
                              "10",
                              "50",
                              "100",
                              "150",
                              "200",
                              "250",
                              "300",
                              "400",
                              "500",
                            ],
                            onChange: handlePageChange,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                              `Showing ${range[0]}-${range[1]} of ${total} families`,
                          }
                    }
                    loading={loading.families}
                    // Use fixed layout so column widths are respected and stay compact
                    scroll={{ x: 1100 }}
                    tableLayout="fixed"
                    bordered
                    components={{
                      body: {
                        wrapper: (props: any) => <tbody {...props} />,
                        row: (props: any) => {
                          const key = props["data-row-key"];
                          const index = families.findIndex(
                            (f) => f.familyId === props["data-row-key"],
                          );

                          return (
                            <Draggable
                              key={key}
                              draggableId={String(key)}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <tr
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  {...props}
                                  style={{
                                    ...props.style,
                                    ...provided.draggableProps.style,
                                    cursor: "move",
                                    display: "table-row",
                                    position: isDragging
                                      ? "relative"
                                      : "static", // Fix layout issue
                                    top: isDragging ? "" : undefined, // Prevents floating row
                                    left: isDragging ? "" : undefined,
                                    background: snapshot.isDragging
                                      ? "#e0f7fa"
                                      : "inherit",
                                  }}
                                  className={
                                    snapshot.isDragging ? "dragging-row" : ""
                                  }
                                >
                                  {props.children}
                                </tr>
                              )}
                            </Draggable>
                          );
                        },
                      },
                    }}
                  />
                  {provided.placeholder}
                </div>
              )}
            </StrictModeDroppable>
          </DragDropContext>
        </div>
      {/* </Spin> */}

      <Modal
        title="Voter Category Details"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        centered
      >
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Category Name">
            <Text>{selectedAvailability?.availabilityName || "N/A"}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Party">
            <Text>{selectedAvailability?.partyName || "N/A"}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="Aadhaar Number">
            <Text>{selectedAvailability?.aadhaarNumber || "N/A"}</Text>
          </Descriptions.Item>

          <Descriptions.Item label="PAN Number">
            <Text>{selectedAvailability?.panNumber || "N/A"}</Text>
          </Descriptions.Item>

          {/* <Descriptions.Item label="Availability Image">
            {selectedAvailability?.availability1?.availabilityImage ? (
              <Image
                src={selectedAvailability?.availability1?.availabilityImage}
                alt="Availability"
                width={100}
                height={100}
                style={{
                  objectFit: "contain",
                  border: "1px solid #f0f0f0",
                  borderRadius: 4,
                }}
              />
            ) : (
              <Text type="secondary">No image available</Text>
            )}
          </Descriptions.Item> */}
        </Descriptions>
      </Modal>
      <Modal
        title="Edit Family"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setFamilyMembersForEdit([]);
        }}
        onOk={handleEditFamily}
        okText="Save Changes"
        cancelText="Cancel"
        okButtonProps={{ loading: editingLoading || loadingFamilyMembers }}
        width={600}
      >
        {selectedFamilyForEdit && (
          <Form layout="vertical">
            <Form.Item label="Family Sequence Number">
              <InputNumber
                value={newFamilySequenceNumber}
                onChange={(value) => setNewFamilySequenceNumber(value || 0)}
                style={{ width: "100%" }}
                min={1}
              />
            </Form.Item>

            <Form.Item label="Family Head">
              <Select
                value={newFamilyHead}
                onChange={setNewFamilyHead}
                style={{ width: "100%" }}
                loading={loadingFamilyMembers}
                placeholder="Select family head"
              >
                {familyMembersForEdit.map((member) => (
                  <Option
                    key={member.epic_number}
                    value={member.epic_number.toString()}
                  >
                    {formatName(
                      member.voterFnameEn,
                      member.voterLnameEn || "",
                      member.voterFnameL1,
                      member.voterLnameL1 || "",
                    )}
                    {member.id.toString() === selectedFamilyForEdit.familyId
                      ? " (Current Head)"
                      : ""}
                    {member.gender &&
                      ` - ${
                        member.gender.charAt(0).toUpperCase() +
                        member.gender.slice(1)
                      }`}
                    {member.age && `, ${member.age} yrs`}
                  </Option>
                ))}
              </Select>
              {loadingFamilyMembers && (
                <div style={{ marginTop: 8 }}>
                  <Spin size="small" />
                  <span style={{ marginLeft: 8 }}>
                    Loading family members...
                  </span>
                </div>
              )}
            </Form.Item>

            <Form.Item label="Part Number">
              <Select
                value={newPartNumber}
                onChange={setNewPartNumber}
                style={{ width: "100%" }}
              >
                {partNumbers.map((partNo) => (
                  <Option key={partNo} value={partNo}>
                    {partNo}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
      {/* Removed ExportFamilyModal (client-side PDF) */}
      {/* Family Export Selection Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <DownloadOutlined style={{ color: "#1D4ED8", fontSize: "18px" }} />
            <span style={{ fontSize: "16px", fontWeight: 600 }}>
              Export Family Data
            </span>
          </div>
        }
        open={isFamilyExportModalOpen}
        onCancel={handleCloseFamilyExportModal}
        onOk={handleCreateFamilyPdfExport}
        okText={exportFormat === "pdf" ? "Export PDF" : "Export Excel"}
        cancelText="Cancel"
        width={600}
        okButtonProps={{
          disabled:
            (exportType === "family" && !selectedExportFamilyId) ||
            (exportType === "part" && (!exportPartNo || exportPartNo <= 0)),
          loading: exportingFamily,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            height: "38px",
            fontWeight: 500,
          },
        }}
      >
        <div style={{ marginTop: 16 }}>
          {/* Row 1: Format and Type Selection */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: 16,
            }}
          >
            {/* Export Format */}
            <div>
              <Text
                strong
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Export Format
              </Text>
              <CustomRadioGroup
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <Radio value="pdf" style={{ fontSize: "13px" }}>
                  📄 PDF
                </Radio>
                <Radio value="excel" style={{ fontSize: "13px" }}>
                  📊 Excel
                </Radio>
              </CustomRadioGroup>
            </div>

            {/* Export Type */}
            <div>
              <Text
                strong
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Export Scope
              </Text>
              <CustomRadioGroup
                value={exportType}
                onChange={(e) => {
                  setExportType(e.target.value);
                  if (e.target.value === "part") {
                    setSelectedExportFamilyId(null);
                  } else {
                    setExportPartNo(null);
                  }
                }}
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <Radio value="family" style={{ fontSize: "13px" }}>
                  👨‍👩‍👧‍👦 Single Family
                </Radio>
                <Radio value="part" style={{ fontSize: "13px" }}>
                  📋 Entire Part
                </Radio>
              </CustomRadioGroup>
            </div>
          </div>

          {/* Row 2: Family/Part Selection */}
          {exportType === "family" ? (
            <div style={{ marginBottom: 16 }}>
              <Text
                strong
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Select Family
              </Text>
              <Select
                className="w-full"
                style={{ width: "100%" }}
                placeholder="Choose a family"
                value={selectedExportFamilyId}
                onChange={setSelectedExportFamilyId}
                showSearch
                filterOption={(input, option) => {
                  const family = families.find(
                    (f) => f.familyId === option?.value,
                  );
                  return (
                    family?.firstMember.name
                      ?.toLowerCase()
                      .includes(input.toLowerCase()) ?? false
                  );
                }}
              >
                {families.map((family) => (
                  <Option key={family.familyId} value={family.familyId}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>
                        {family.firstMember.name}{" "}
                        <span style={{ color: "#2563eb" }}>
                          ({family.firstMember.epicNumber})
                        </span>
                      </span>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        {family.memberCount} members
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <Text
                strong
                style={{
                  fontSize: "13px",
                  color: "#374151",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Select Part Number
              </Text>
              <Select
                style={{ width: "100%" }}
                placeholder="Choose a part"
                value={exportPartNo}
                onChange={(value) => setExportPartNo(value)}
                showSearch
              >
                {partNumbers.map((partNo) => (
                  <Option key={partNo} value={partNo}>
                    Part {partNo}
                  </Option>
                ))}
              </Select>
            </div>
          )}

          {/* Row 3: Options for single family - show same options as part exports */}
          {exportType === "family" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: exportFormat === "pdf" ? "1fr 1fr" : "1fr",
                gap: "16px",
              }}
            >
              {/* PDF Layout - only for PDF */}
              {exportFormat === "pdf" && (
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "13px",
                      color: "#374151",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    PDF Layout
                  </Text>
                  <CustomRadioGroup
                    value={exportColumns}
                    onChange={(e) => setExportColumns(e.target.value)}
                    style={{ display: "flex", gap: "16px" }}
                  >
                    <Radio value={2} style={{ fontSize: "13px" }}>
                      2 Columns
                    </Radio>
                    <Radio value={3} style={{ fontSize: "13px" }}>
                      3 Columns
                    </Radio>
                  </CustomRadioGroup>
                </div>
              )}

              {/* Sort Order - for both PDF and Excel */}
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Sort Order
                </Text>
                <CustomRadioGroup
                  value={exportOrderBy}
                  onChange={(e) => setExportOrderBy(e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Radio value="family" style={{ fontSize: "13px" }}>
                    📊 Family Order
                  </Radio>
                  <Radio value="serial" style={{ fontSize: "13px" }}>
                    🔢 Serial Number
                  </Radio>
                </CustomRadioGroup>
              </div>
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Cross Booth Family
                </Text>
                <CustomRadioGroup
                  value={
                    isCrossFamily === null
                      ? "both"
                      : isCrossFamily
                        ? "yes"
                        : "no"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsCrossFamily(val === "both" ? null : val === "yes");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Radio value="yes" style={{ fontSize: "13px" }}>
                    Yes
                  </Radio>
                  <Radio value="no" style={{ fontSize: "13px" }}>
                    No
                  </Radio>
                  <Radio value="both" style={{ fontSize: "13px" }}>
                    Both
                  </Radio>
                </CustomRadioGroup>
              </div>
            </div>
          )}

          {/* Row 3: Options (PDF Layout or Sort Order) - only for part exports */}
          {exportType === "part" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: exportFormat === "pdf" ? "1fr 1fr" : "1fr",
                gap: "16px",
              }}
            >
              {/* PDF Layout - only for PDF */}
              {exportFormat === "pdf" && (
                <div>
                  <Text
                    strong
                    style={{
                      fontSize: "13px",
                      color: "#374151",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    PDF Layout
                  </Text>
                  <CustomRadioGroup
                    value={exportColumns}
                    onChange={(e) => setExportColumns(e.target.value)}
                    style={{ display: "flex", gap: "16px" }}
                  >
                    <Radio value={2} style={{ fontSize: "13px" }}>
                      2 Columns
                    </Radio>
                    <Radio value={3} style={{ fontSize: "13px" }}>
                      3 Columns
                    </Radio>
                  </CustomRadioGroup>
                </div>
              )}

              {/* Sort Order - for both PDF and Excel */}
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Sort Order
                </Text>
                <CustomRadioGroup
                  value={exportOrderBy}
                  onChange={(e) => setExportOrderBy(e.target.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Radio value="family" style={{ fontSize: "13px" }}>
                    📊 Family Order
                  </Radio>
                  <Radio value="serial" style={{ fontSize: "13px" }}>
                    🔢 Serial Number
                  </Radio>
                </CustomRadioGroup>
              </div>
              <div>
                <Text
                  strong
                  style={{
                    fontSize: "13px",
                    color: "#374151",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Cross Booth Family
                </Text>
                <CustomRadioGroup
                  value={
                    isCrossFamily === null
                      ? "both"
                      : isCrossFamily
                        ? "yes"
                        : "no"
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsCrossFamily(val === "both" ? null : val === "yes");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <Radio value="yes" style={{ fontSize: "13px" }}>
                    Yes
                  </Radio>
                  <Radio value="no" style={{ fontSize: "13px" }}>
                    No
                  </Radio>
                  <Radio value="both" style={{ fontSize: "13px" }}>
                    Both
                  </Radio>
                </CustomRadioGroup>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <FamilyMappingOtpVerification
        visible={showOtpModal}
        onCancel={handleOtpModalCancel}
        onVerify={handleOtpVerification}
        mobileNumber={mobileNumber}
        loading={otpVerificationLoading}
      />
      {/* Family Mapping Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <WarningOutlined style={{ color: "#faad14", fontSize: "20px" }} />
            <span>Confirm Family Mapping</span>
          </div>
        }
        open={isConfirmModalVisible}
        onCancel={() => setIsConfirmModalVisible(false)}
        onOk={handleConfirmFamilyMapping}
        okText="Start Family Mapping"
        cancelText="Cancel"
        okButtonProps={{
          disabled: !riskAcknowledged,
          style: {
            backgroundColor: riskAcknowledged ? "#1D4ED8" : undefined,
            borderColor: riskAcknowledged ? "#1D4ED8" : undefined,
          },
        }}
        width={500}
        centered
      >
        <div style={{ padding: "16px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <Text strong>Select Part Numbers</Text>
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Select one or more parts"
              value={selectedRunParts}
              onChange={(values) => {
                const vals = (values as (number | "ALL")[]).filter(
                  (v) => v !== "ALL",
                ) as number[];
                setSelectedRunParts(vals);
              }}
              onSelect={(val) => {
                if (val === "ALL") {
                  setSelectedRunParts(partNumbers);
                }
              }}
              options={[
                { label: "Select All Parts", value: "ALL" as any },
                ...partNumbers.map((pn) => ({ label: pn, value: pn })),
              ]}
            />
          </div>

          <div
            style={{
              background: "#fff2e8",
              border: "1px solid #ffbb96",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "20px",
            }}
          >
            <Typography.Paragraph style={{ margin: 0, color: "#d46b08" }}>
              <WarningOutlined style={{ marginRight: "8px" }} />
              <strong>Warning:</strong> This operation may modify existing
              family data. There is a possibility of data loss or changes to
              current family groupings.
            </Typography.Paragraph>
          </div>

          <Checkbox
            checked={riskAcknowledged}
            onChange={(e) => setRiskAcknowledged(e.target.checked)}
            style={{ fontSize: "14px" }}
          >
            I understand the risks and acknowledge that data loss may occur. I
            want to proceed at my own risk.
          </Checkbox>
        </div>
      </Modal>
      {/* Family Mapping Progress Modal */}
      <FamilyMappingProgressModal
        visible={isProgressModalVisible}
        onClose={handleCloseFamilyMappingProgress}
        jobData={familyMappingJob}
        loading={familyMappingLoading}
        error={familyMappingError}
        onForceCancel={handleForceCancelFamilyMapping}
        forceCancelLoading={forceCancelLoading}
      />
      <FamilyExportJobsModal
        open={isDownloadsModalOpen}
        onClose={() => setIsDownloadsModalOpen(false)}
        familyId={selectedExportFamilyId || selectedFamilyId}
        electionId={selectedElectionId ? parseInt(selectedElectionId) : null}
        accountId={accountId || null}
      />
      <Modal
        title={`Family Members - ${selectedFamilyForMembers?.firstMember.name}`}
        open={isFamilyMembersModalVisible}
        onCancel={() => setIsFamilyMembersModalVisible(false)}
        footer={null}
        width={1100}
        style={{ top: 20 }}
      >
        <Table
          columns={familyModalColumns(currentPage, pageSize)}
          dataSource={familyMembersForModal.map((member, index) => ({
            ...member,
            key: member.id.toString(),
          }))}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          tableLayout="fixed"
        />
      </Modal>
      {/* </Spin> */}
      <AdvancedSearchModal
        open={isAdvanceSearchModalVisible}
        onClose={() => setIsAdvanceSearchModalVisible(false)}
        onSearch={handleAdvanceSearch}
        onClear={clearAdvancedFilters}
      />
    </div>
  );
};

export default Family;
