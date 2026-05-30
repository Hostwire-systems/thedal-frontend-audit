import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Col,
  Row,
  Select,
  Input,
  Button,
  Dropdown,
  Checkbox,
  Radio,
  message,
  Slider,
  Modal,
  Menu,
  Progress,
  Table,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  DownOutlined,
  DeleteOutlined,
  DownloadOutlined,
  IdcardOutlined,
  UsergroupAddOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import moment from "moment";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

import { useLoading } from "../../context/LoadingContext";
import {
  getVotersApi,
  deleteVoterApi,
  updateVoterApi,
  addVoterImageApi,
  deleteVoterImageApi,
  getBulkUploadStatus,
  deleteAllVotersApi,
  getDeleteProgressApi,
  getVotersBySearch,
} from "../../api/voterApi";
import { fetchBooths } from "../../api/boothApi";
import { getSectionsApi } from "../../api/sectionApi";
import {
  generatePartWiseVoterIdCards,
  generateVoterIdCard,
} from "../../utils/voterIdCardGenerator";

import VotersTable from "./votersTable";
import EditVoterModal from "./EditVoterModal";
import FamilyModal from "./FamilyModal";
import { useLocation } from "react-router-dom";
import { useExport } from "../../context/ExportContext";
import VerifyVoterModal from "./VerifyVoterModal";
import { fetchReligion } from "../../api/religionApi";
import { getAvailabilityApi } from "../../api/availabilityApi";
import { fetchParties } from "../../api/partyApi";
import { fetchHistory } from "../../api/historyApi";
import { ReligionType } from "../../types/religion";
import { PartyType } from "../../types/party";
import { VoterHistory } from "../../types/history";
import { Availability } from "../../types/availability";
import FriendsModal from "./FriendsModal";
import SchemesModal from "./SchemesModal";
import { getPartsApi } from "../../api/partApi";
import AdvancedSearchModal from "../../components/Modals/AdvanceSearchModal";
import { fetchCasteCategories } from "../../api/casteCategoryApi";
import { fetchCaste } from "../../api/casteApi";
import { fetchSubCaste } from "../../api/subCasteApi";
import { Caste } from "../../types/voter";
import { SubCaste } from "../../types/voter";
import { CasteCategory } from "../../types/casteCategory";
import { VoterFilters } from "../../types/voterFilter";
import {
  checkDuplicateVotersApiStatus,
  runDuplicateVotersApi,
} from "../../api/duplicateVoterApi";
import { useElectionStats } from "../../hooks/useReportingSlices";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";

const { Option } = Select;

interface BenefitSchemeOption {
  key: number;
  schemeName: string;
  orderIndex?: number;
}

type BoothSelectionValue = number | "ALL";

type VoterListApiFilters = VoterFilters & {
  age?: string;
  mobileNo?: string;
  voterFnameEn?: string;
  voterLnameEn?: string;
  relationFirstNameEn?: string;
  relationLastNameEn?: string;
  photoUploadedFrom?: string | null;
  photoUploadedTo?: string | null;
};

export default function VotersList() {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Other states
  const [votersList, setVotersList] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedVoters, setSelectedVoters] = useState<any[]>([]);
  const [order, setOrder] = useState<"asc" | "desc" | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [stats, setStats] = useState({
    male: 0,
    female: 0,
    others: 0,
    total: 0,
    addressed: 0,
    notAddressed: 0,
  });
  const [photoStats, setPhotoStats] = useState<{
    votersWithPhoto: number;
    votersWithoutPhoto: number;
  } | null>(null);

  // for filters section
  const [religions, setReligions] = useState<ReligionType[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [subCastes, setSubCastes] = useState<SubCaste[]>([]);
  const [casteCategories, setCasteCategories] = useState<CasteCategory[]>([]);
  const [parties, setParties] = useState<PartyType[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [histories, setHistories] = useState<VoterHistory[]>([]);
  const [selectedReligion, setSelectedReligion] = useState<string[]>([]);
  const [selectedCaste, setSelectedCaste] = useState<string[]>([]);
  const [selectedSubcaste, setSelectedSubcaste] = useState<string[]>([]);
  const [selectedCasteCategory, setSelectedCasteCategory] = useState<string[]>(
    []
  );
  const [selectedHistory, setSelectedHistory] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedParty, setSelectedParty] = useState<string[]>([]);
  const [schemes, setSchemes] = useState<BenefitSchemeOption[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [ageRange, setAgeRange] = useState([0, 120]);
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [addressedFilter, setAddressedFilter] = useState<boolean | null>(null);
  const [hasPhotoFilter, setHasPhotoFilter] = useState<boolean | null>(null);

  const [bulkUploadId, setBulkUploadId] = useState<number | null>(null);
  const [filterDropdownVisible, setFilterDropdownVisible] =
    useState<boolean>(false);
  const [boothNumbers, setBoothNumbers] = useState<number[]>([]);
  const [selectedBoothNumber, setSelectedBoothNumber] = useState<BoothSelectionValue[]>(() => {
    const stored = localStorage.getItem("selectedBoothNumber");
    return stored ? JSON.parse(stored) : ["ALL"];
  });
  const [editingVoter, setEditingVoter] = useState<any>(null);
  const [voterData, setVoterData] = useState<any>(null);
  const [friendsVoterData, setFriendsVoterData] = useState<any>(null);
  const [includeUnknownAge, setIncludeUnknownAge] = useState<boolean>(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isAdvanceSearchModalVisible, setIsAdvanceSearchModalVisible] =
    useState<boolean>(false);
  const [isFamilyModalVisible, setIsFamilyModalVisible] =
    useState<boolean>(false);
  const [isFriendsModalVisible, setIsFriendsModalVisible] =
    useState<boolean>(false);
  const [isSchemesModalVisible, setIsSchemesModalVisible] =
    useState<boolean>(false);
  const [schemesVoterData, setSchemesVoterData] = useState<any>(null);
  const location = useLocation();
  const [uploadStatus, setUploadStatus] = useState("IN_PROGRESS");
  const [isVerifyVoterModalVisible, setIsVerifyVoterModalVisible] =
    useState<boolean>(false);
  const [isPartWiseIdCardExporting, setIsPartWiseIdCardExporting] =
    useState<boolean>(false);
  const [partWiseExportProgress, setPartWiseExportProgress] = useState<{
    currentPage: number;
    totalPages: number;
    currentPart: string | number | null;
    phase: "fetching" | "rendering";
  }>({
    currentPage: 0,
    totalPages: 0,
    currentPart: null,
    phase: "fetching",
  });
  const [selectedVoter, setSelectedVoter] = useState<any>(null);
  const [isLoadingButton, setIsLoadingButton] = useState<boolean>(false);
  const [isDeleteInProgress, setIsDeleteInProgress] = useState<boolean>(false);
  const [deleteProgressMessage, setDeleteProgressMessage] = useState<string>("");
  const [deletePercent, setDeletePercent] = useState<number>(0);
  const { isLoading, setLoading } = useLoading();
  const [loadingModal, setLoadingModal] = useState<boolean>(false);
  const [sectionsCache, setSectionsCache] = useState<any>(null);
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const statsPartNumbers = React.useMemo<number[] | undefined>(() => {
    if (!selectedBoothNumber || selectedBoothNumber.includes("ALL")) {
      return undefined;
    }

    return selectedBoothNumber.filter(
      (value): value is number => typeof value === "number"
    );
  }, [selectedBoothNumber]);

  const electionStats = useElectionStats(Number(selectedElectionId), statsPartNumbers);

  const userId = localStorage.getItem("userId");

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const { showExportModal, showPdfExcelExportModal, isExportInProgress } = useExport();
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const isElectionFrozen = (action: string) => {
    if (isFrozen) {
      message.warning(action);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchInitialData();
      fetchReligionData();
      fetchPartyData();
      fetchSchemeData();
      fetchAvailabilityData();
      fetchHistoryData();
      fetchCasteCategoryData();
      fetchBenefitSchemesData();
      fetchSectionsData(); // Cache sections for ID card generation
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (location.state && location.state.bulkUploadId) {
      setBulkUploadId(Number(location.state.bulkUploadId));
    }
  }, [location]);

  useEffect(() => {
    if (!bulkUploadId) return;

    // Function to check upload status
    const checkUploadStatus = async () => {
      const response = await getBulkUploadStatus(
        bulkUploadId,
        parseInt(selectedElectionId)
      );

      if (response.status === "COMPLETED") {
        setUploadStatus("completed");
        clearInterval(statusInterval); // Stop the interval
        fetchInitialData();
      }
    };

    // Start polling every 20 seconds
    const statusInterval = setInterval(checkUploadStatus, 20000);

    // Cleanup the interval on component unmount
    return () => clearInterval(statusInterval);
  }, [bulkUploadId]);

  useEffect(() => {
    if (!isPartWiseIdCardExporting) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Voter ID card export is in progress. Leaving may interrupt the download.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isPartWiseIdCardExporting]);

  // Fetch booth numbers and initial voters
  const fetchInitialData = async (pageNumber = 0) => {
    setLoading(true);
    try {
      let partNumbersFromResponse: number[] = [];

      try {
        const response = await getPartsApi(parseInt(selectedElectionId));
        console.log("Parts response:", response.data);

        const validParts = (
          Array.isArray(response.data) ? response.data : []
        ).map((part: any) => ({
          ...part,
          partNo: Number(part?.partNo?.trim() ?? 0),
        }));

        partNumbersFromResponse = validParts
          .map((part: any) => part.partNo)
          .filter(
            // (pn: any) =>
            //   !isNaN(pn) && pn !== null && pn !== undefined && pn !== 0
            Boolean
          )
          .sort((a: number, b: number) => a - b);

        console.log("Mapped & Sorted Part Numbers:", partNumbersFromResponse);
      } catch (error) {
        console.error("Error fetching parts:", error);
        partNumbersFromResponse = [];
      }

      setBoothNumbers(partNumbersFromResponse);
      setSelectedGender([]);
      setSortBy(null);
      setOrder(null);
      const storedBoothSelection = JSON.parse(
        localStorage.getItem("selectedBoothNumber") || "[]"
      );

      const updatedBoothSelection: BoothSelectionValue[] =
        selectedBoothNumber.filter(
          (bn: BoothSelectionValue) =>
            typeof bn === "number" && partNumbersFromResponse.includes(bn)
        ).length > 0
          ? selectedBoothNumber
          : ["ALL"];
      setSelectedBoothNumber(updatedBoothSelection);

      const filters = updatedBoothSelection.includes("ALL")
        ? {}
        : { boothNumber: updatedBoothSelection };
      await fetchVoters(pageNumber, pageSize, filters);
    } catch (error) {
      setVotersList([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch religions data
  const fetchReligionData = async () => {
    try {
      const response = await fetchReligion(parseInt(selectedElectionId));
      const fetched =
        response?.data?.data
          ?.map((r: any) => ({
            key: r.religionId,
            religionName: r.religionName,
            orderIndex: r?.orderIndex,
          }))

          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
      setReligions(fetched);
      console.log("fetched religions", fetched);
    } catch (err) {
      console.error("Error fetching religions: ", err);
    }
  };
  // Fetch castes data
  const fetchCastesData = async (religionId: number) => {
    try {
      const response = await fetchCaste(
        parseInt(selectedElectionId),
        religionId
      );
      console.log("response", response);
      const fetchedCastes =
        response?.data?.data
          ?.map((caste: any) => ({
            key: caste.casteId,
            casteName: caste.casteName,
            religionId: caste.religionId,
            orderIndex: caste?.orderIndex,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
      console.log("fetchedCastes", fetchedCastes);
      setCastes(fetchedCastes);
    } catch (error) {
      console.error("Error fetching castes: ", error);
      setCastes([]);
    }
  };

  //Fetch subcastes data
  const fetchSubCastesData = async (casteId: number) => {
    try {
      const response = await fetchSubCaste(
        parseInt(selectedElectionId),
        casteId
      );
      const fetchedSubCastes =
        response?.data?.data
          ?.map((subCaste: any) => ({
            key: subCaste.subCasteId,
            subCasteName: subCaste.subCasteName,
            casteName: subCaste.casteName,
            religionName: subCaste.religionName,
            orderIndex: subCaste.orderIndex,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
      console.log("fetchedSubCastes", fetchedSubCastes);
      setSubCastes(fetchedSubCastes);
    } catch (error) {
      console.error("Error fetching sub-castes: ", error);
      setSubCastes([]);
    }
  };

  // Fetch caste category data
  const fetchCasteCategoryData = async () => {
    try {
      const response = await fetchCasteCategories(parseInt(selectedElectionId));
      const fetchedData =
        response?.data?.map((item: any) => ({
          key: item.casteCategoryId,
          casteCategoryName: item.casteCategoryName,
        })) || [];
      setCasteCategories(fetchedData);
    } catch (error) {
      console.error("Error fetching caste categories:", error);
    }
  };

  const fetchBenefitSchemesData = async () => {
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      setBenefitSchemesList(response?.data || []);
    } catch (error) {
      console.error("Error fetching benefit schemes:", error);
    }
  };

  // Fetch parties data
  const fetchPartyData = async () => {
    try {
      const response = await fetchParties(parseInt(selectedElectionId));
      const fetched =
        response?.data
          ?.map((p: any) => ({
            key: p.id,
            partyName: p.partyName,
            partyShortName: p.partyShortName,
            partyImage: p.partyImage,
            orderIndex: p.orderIndex,
          }))

          .sort(
            (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
          ) || [];
      setParties(fetched);
    } catch (err) {
      console.error("Error fetching parties: ", err);
    }
  };

  const fetchSchemeData = async () => {
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      const fetchedSchemes =
        response?.data
          ?.map((scheme: any) => ({
            key: Number(scheme.id),
            schemeName: scheme.schemeName,
            orderIndex: scheme?.orderIndex,
          }))
          .filter(
            (scheme: BenefitSchemeOption) => Number.isFinite(scheme.key) && scheme.key > 0
          )
          .sort(
            (a: BenefitSchemeOption, b: BenefitSchemeOption) =>
              Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0)
          ) || [];

      setSchemes(fetchedSchemes);
    } catch (error) {
      console.error("Error fetching benefit schemes:", error);
      setSchemes([]);
    }
  };

  // Fetch histories data
  const fetchHistoryData = async () => {
    try {
      const response = await fetchHistory(parseInt(selectedElectionId));
      const fetchedHistories =
        response?.data?.data
          ?.map((history: any) => ({
            key: history.voterHistoryId,
            orderIndex: history.orderIndex,
            id: history.voterHistoryId,
            voterHistoryName: history.voterHistoryName,
            voterHistoryImage: history.voterHistoryImage,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
      setHistories(fetchedHistories);
    } catch (error) {
      console.error("Error fetching histories: ", error);
      setHistories([]);
    }
  };

  useEffect(() => {
    // When religion changes, fetch castes for all selected religions and reset dependent values
    const fetchAllCastes = async () => {
      if (selectedReligion.length > 0) {
        try {
          // Fetch castes for all selected religions
          const allCastesPromises = selectedReligion.map(
            async (religionName) => {
              const religionId = religions.find(
                (r) => r.religionName === religionName
              )?.key;
              if (religionId) {
                const response = await fetchCaste(
                  parseInt(selectedElectionId),
                  parseInt(religionId)
                );
                return (
                  response?.data?.data?.map((caste: any) => ({
                    key: caste.casteId,
                    casteName: caste.casteName,
                    religionId: caste.religionId,
                    orderIndex: caste?.orderIndex,
                  })) || []
                );
              }
              return [];
            }
          );

          const allCastesArrays = await Promise.all(allCastesPromises);
          // Flatten and remove duplicates based on key
          const allCastes = allCastesArrays
            .flat()
            .filter(
              (caste, index, self) =>
                index === self.findIndex((c) => c.key === caste.key)
            )
            .sort(
              (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
            );

          setCastes(allCastes);
        } catch (error) {
          console.error("Error fetching castes: ", error);
          setCastes([]);
        }
      } else {
        setCastes([]);
      }
    };

    fetchAllCastes();
    setSelectedCaste([]);
    setSelectedSubcaste([]);
  }, [selectedReligion, religions, selectedElectionId]);

  useEffect(() => {
    // When caste changes, fetch subcastes for all selected castes and reset dependent value
    const fetchAllSubCastes = async () => {
      if (selectedCaste.length > 0) {
        try {
          const allSubCastesPromises = selectedCaste.map(async (casteName) => {
            const casteId = castes.find((c) => c.casteName === casteName)?.key;
            if (casteId) {
              const response = await fetchSubCaste(
                parseInt(selectedElectionId),
                parseInt(casteId)
              );
              return (
                response?.data?.data?.map((subCaste: any) => ({
                  key: subCaste.subCasteId,
                  subCasteName: subCaste.subCasteName,
                  casteName: subCaste.casteName,
                  religionName: subCaste.religionName,
                  orderIndex: subCaste.orderIndex,
                })) || []
              );
            }
            return [];
          });

          const allSubCastesArrays = await Promise.all(allSubCastesPromises);
          // Flatten and remove duplicates based on key
          const allSubCastes = allSubCastesArrays
            .flat()
            .filter(
              (subCaste, index, self) =>
                index === self.findIndex((sc) => sc.key === subCaste.key)
            )
            .sort(
              (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
            );

          setSubCastes(allSubCastes);
        } catch (error) {
          console.error("Error fetching sub-castes: ", error);
          setSubCastes([]);
        }
      } else {
        setSubCastes([]);
      }
    };

    fetchAllSubCastes();
    setSelectedSubcaste([]);
  }, [selectedCaste, castes, selectedElectionId]);

  // Fetch availability data
  const fetchAvailabilityData = async () => {
    try {
      const response = await getAvailabilityApi(parseInt(selectedElectionId));
      setAvailabilities(
        response.data
          ?.map(
            ({
              id,
              description,
              categoryName,
              availabilityImage,
              orderIndex,
            }: {
              id: number;
              categoryName: string;
              availabilityImage: string;
              description: string;
              orderIndex: number;
            }) => ({
              key: id,
              description,
              categoryName,
              availabilityImage,
              orderIndex,
            })
          )
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || []
      );
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    }
  };

  // Fetch sections data and cache for ID card generation
  const fetchSectionsData = async () => {
    try {
      const response = await getSectionsApi(parseInt(selectedElectionId));
      console.log("Sections API response:", response);

      // Handle different response formats
      const sectionsData = response?.data?.data || response?.data || [];
      console.log("Sections data array:", sectionsData);

      // Create a map of section_no to section name for quick lookup
      const sectionsMap: { [key: string]: string } = {};

      if (Array.isArray(sectionsData)) {
        sectionsData.forEach((section: any) => {
          const sectionNo = section.sectionNo || section.section_no;
          const partNo = section.partNo || section.part_no;
          const sectionName =
            section.sectionNameEnglish ||
            section.sectionNameL1 ||
            section.section_name_english ||
            section.section_name_l1 ||
            "";
          if (sectionNo && partNo) {
            sectionsMap[`${partNo}-${sectionNo}`] = sectionName;
          } else if (sectionNo) {
            sectionsMap[String(sectionNo)] = sectionName;
          }
        });
      }

      setSectionsCache(sectionsMap);
      console.log(
        "Sections cached (count: " + Object.keys(sectionsMap).length + "):",
        sectionsMap
      );

      if (Object.keys(sectionsMap).length === 0) {
        console.warn("No sections were cached. Check the API response format.");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      // Set empty cache to prevent continuous null checks
      setSectionsCache({});
    }
  };

  const cleanName = (name: string) => {
    if (!name || name === "No Data") return "";
    return name.replace(/-/g, "").trim();
  };

  const getFullName = (
    firstName: string,
    lastName: string,
    firstNameL1: string = "",
    lastNameL1: string = ""
  ) => {
    const cleanFirstName = cleanName(firstName);
    const cleanLastName = cleanName(lastName);
    const cleanFirstNameL1 = cleanName(firstNameL1);
    const cleanLastNameL1 = cleanName(lastNameL1);

    const combinedName = [
      cleanFirstName,
      cleanLastName,
      cleanFirstNameL1,
      cleanLastNameL1,
    ]
      .filter(Boolean)
      .join(" ");

    return combinedName || "N/A";
  };

  const mapVoterToIdCardData = (voter: any) => {
    const sectionNumber = voter.sectionNo ?? voter.sectionNumber;
    const partNumber =
      voter.part_number ??
      voter.partNo ??
      voter.partNumber ??
      voter.boothNumber ??
      "";
    const serialNumber =
      voter.serial_number ??
      voter.serialNo ??
      voter.serialNumber ??
      "";

    const voterNameEn = [cleanName(voter.voterFnameEn), cleanName(voter.voterLnameEn)].filter(Boolean).join(' ');
    const voterNameTa = [cleanName(voter.voterFnameL1), cleanName(voter.voterLnameL1)].filter(Boolean).join(' ');
    const relationNameEn = [cleanName(voter.rlnFnameEn), cleanName(voter.rlnLnameEn)].filter(Boolean).join(' ');
    const relationNameTa = [cleanName(voter.rlnFnameL1), cleanName(voter.rlnLnameL1)].filter(Boolean).join(' ');
    const houseNumber = cleanName(voter.houseNoEn || voter.house_no_en || '');

    return {
      epicNumber: voter.epicNumber || voter.epic_number || "",
      partNumber,
      serialNumber,
      voterName: getFullName(
        voter.voterFnameEn,
        voter.voterLnameEn,
        voter.voterFnameL1,
        voter.voterLnameL1
      ),
      voterNameEn,
      voterNameTa,
      relationName: getFullName(
        voter.rlnFnameEn,
        voter.rlnLnameEn,
        voter.rlnFnameL1,
        voter.rlnLnameL1
      ),
      relationNameEn,
      relationNameTa,
      houseNumber,
      age: voter.age || 0,
      gender: voter.gender || "",
      sectionName:
        sectionsCache?.[`${partNumber}-${sectionNumber}`] ||
        sectionsCache?.[String(sectionNumber)] ||
        (sectionNumber !== undefined && sectionNumber !== null
          ? `Section ${sectionNumber}`
          : "N/A"),
      photoUrl: voter.photo_url || "",
    };
  };

  const fetchVotersForPart = async (
    partNumber: string | number,
    onPageProgress?: (
      currentPage: number,
      totalPages: number,
      currentPart: string | number
    ) => void
  ) => {
    const voters: any[] = [];
    const size = 100;
    let page = 0;
    let totalPages = 1;

    const activeFilters: any = {
      electionId: selectedElectionId,
      boothNumber: [partNumber],
      page,
      size,
      sortBy: "part_number,serial_number",
      order: "asc",
      includeUnknownAge,
    };

    if (selectedGender.length > 0) activeFilters.gender = selectedGender;
    if (!includeUnknownAge) {
      activeFilters.minAge = ageRange[0];
      activeFilters.maxAge = ageRange[1];
    }
    if (selectedReligion.length > 0) activeFilters.religion = selectedReligion;
    if (selectedCaste.length > 0) activeFilters.casteName = selectedCaste;
    if (selectedSubcaste.length > 0) activeFilters.subcaste = selectedSubcaste;
    if (selectedCasteCategory.length > 0) {
      activeFilters.casteCategoryName = selectedCasteCategory;
    }
    if (selectedParty.length > 0) activeFilters.party = selectedParty;
    if (selectedHistory.length > 0)
      activeFilters.voterHistoryName = selectedHistory;
    if (selectedCategory.length > 0)
      activeFilters.categoryDescription = selectedCategory;
    if (selectedSchemeId !== null) activeFilters.schemeId = selectedSchemeId;
    if (typeof addressedFilter === "boolean") {
      activeFilters.addressed = addressedFilter;
    }

    do {
      const response = await getVotersApi({
        ...activeFilters,
        page,
      });

      const content = response?.data?.voters?.content || [];
      voters.push(...content);

      totalPages = response?.data?.voters?.totalPages || 1;
      onPageProgress?.(page + 1, totalPages, partNumber);
      page += 1;
    } while (page < totalPages);

    return voters;
  };

  const handleGeneratePartWiseIdCards = async () => {
    const selectedParts = (selectedBoothNumber || []).filter(
      (part: BoothSelectionValue) => part !== "ALL"
    );

    if (!selectedElectionId) {
      message.error("Election is not selected.");
      return;
    }

    if (selectedParts.length === 0) {
      message.warning(
        "Please select one or more booth/part numbers to export ID cards."
      );
      return;
    }

    try {
      setIsPartWiseIdCardExporting(true);

      const sortedParts = [...selectedParts].sort(
        (a, b) => Number(a) - Number(b)
      );

      setPartWiseExportProgress({
        currentPage: 0,
        totalPages: Math.max(sortedParts.length, 1),
        currentPart: null,
        phase: "fetching",
      });
      message.loading({
        content:
          "Preparing part-wise voter ID cards. Do not close or navigate away...",
        key: "part-wise-id-card-export",
        duration: 0,
      });

      const partWiseData = [];
      let processedPages = 0;
      let knownTotalPages = 0;

      for (const partNumber of sortedParts) {
        let hasRegisteredPartTotal = false;
        const partVoters = await fetchVotersForPart(
          partNumber,
          (currentPage, totalPages, currentPart) => {
            if (!hasRegisteredPartTotal) {
              knownTotalPages += totalPages;
              hasRegisteredPartTotal = true;
            }
            processedPages += 1;

            setPartWiseExportProgress({
              currentPage: processedPages,
              totalPages: Math.max(knownTotalPages, processedPages),
              currentPart,
              phase: "fetching",
            });
          }
        );
        partWiseData.push({
          partNumber,
          voters: partVoters.map((voter) => mapVoterToIdCardData(voter)),
        });
      }

      setPartWiseExportProgress((previous) => ({
        ...previous,
        currentPage: previous.totalPages,
        phase: "rendering",
      }));

      await generatePartWiseVoterIdCards(partWiseData);

      const totalCards = partWiseData.reduce(
        (total, part) => total + part.voters.length,
        0
      );

      message.success({
        content: `Generated ${totalCards} voter ID cards from ${sortedParts.length} part(s).`,
        key: "part-wise-id-card-export",
      });
    } catch (error) {
      console.error("Error generating part-wise ID cards:", error);
      message.error({
        content: "Failed to generate part-wise voter ID cards. Please try again.",
        key: "part-wise-id-card-export",
      });
    } finally {
      setIsPartWiseIdCardExporting(false);
      setPartWiseExportProgress({
        currentPage: 0,
        totalPages: 0,
        currentPart: null,
        phase: "fetching",
      });
    }
  };

  // Handler to generate voter ID card
  const handleGenerateIdCard = async (voter: any) => {
    try {
      console.log("Generate ID card clicked for voter:", voter);
      console.log("Current sectionsCache:", sectionsCache);

      if (!sectionsCache) {
        message.error("Sections data not loaded. Please refresh the page.");
        console.error("sectionsCache is null or undefined");
        return;
      }

      if (Object.keys(sectionsCache).length === 0) {
        console.warn(
          "Sections cache is empty. Proceeding with default section name."
        );
      }

      // Log the actual voter fields for debugging
      console.log("Voter field values:", {
        voterFnameEn: voter.voterFnameEn,
        voterLnameEn: voter.voterLnameEn,
        voterFnameL1: voter.voterFnameL1,
        voterLnameL1: voter.voterLnameL1,
        rlnFnameEn: voter.rlnFnameEn,
        rlnLnameEn: voter.rlnLnameEn,
        rlnFnameL1: voter.rlnFnameL1,
        rlnLnameL1: voter.rlnLnameL1,
        age: voter.age,
        gender: voter.gender,
      });

      const voterData = mapVoterToIdCardData(voter);

      console.log("Generating ID card with data:", voterData);
      await generateVoterIdCard(voterData);
      message.success("Voter ID card generated successfully!");
    } catch (error) {
      console.error("Error generating ID card:", error);
      message.error("Failed to generate ID card. Please try again.");
    }
  };

  // const runDuplicateVotersCheck = async () => {
  //   try {
  //     if (!selectedElectionId || !userId) {
  //       message.error("Election ID or User ID is missing");
  //       return;
  //     }
  //     const response = await runDuplicateVotersApi(
  //       parseInt(selectedElectionId),
  //       parseInt(userId!)
  //     );
  //     console.log("Response of run duplicate voters check", response);
  //   } catch (error) {
  //     console.error("Error fetching histories: ", error);
  //   }
  // };

  // Fetch voters with filters and pagination
  const fetchVoters = async (
    page: number = 0,
    size: number = pageSize,
    filters: VoterListApiFilters = {}
  ) => {
    if (!selectedElectionId) return;

    try {
      setLoading(true);
      console.log("Fetching voters with filters:", filters);

      const params: any = {
        electionId: selectedElectionId,
        page,
        size,
        ...filters,
      };

      // Handle local filters and API parameters
      if (filters.gender && filters.gender.length > 0) {
        params.gender = filters.gender.map((g) => g.toLowerCase());
      }

      if (filters.includeUnknownAge) {
        params.includeUnknownAge = true;
      } else {
        if (filters.minAge !== undefined) {
          params.minAge = filters.minAge;
        }
        if (filters.maxAge !== undefined) {
          params.maxAge = filters.maxAge;
        }
      }
      if (filters.age) {
        params.age = filters.age;
      }
      if (filters.mobileNo) {
        params.mobileNo = filters.mobileNo;
      }

      if (filters.search !== undefined) {
        params.search = filters.search;
      } else if (searchQuery) {
        params.search = searchQuery;
      }

      if (filters.voterId) {
        params.voterId = filters.voterId;
      }
      if (filters.epic_number) {
        params["epic_number"] = filters.epic_number;
      }
      if (filters.serial_number) {
        params["serial_number"] = filters.serial_number;
      }
      // if (filters.voterName) {
      //   params["voterName"] = filters.voterName;
      // }
      // if (filters.relationName) {
      //   params["relationName"] = filters.relationName;
      // }
      if (filters.voterFnameEn?.trim()) {
        params["voterFnameEn"] = filters.voterFnameEn.trim();
      }
      if (filters.voterLnameEn?.trim()) {
        params["voterLnameEn"] = filters.voterLnameEn.trim();
      }
      if (filters.relationFirstNameEn?.trim()) {
        params["relationFirstNameEn"] = filters.relationFirstNameEn.trim();
      }
      if (filters.relationLastNameEn?.trim()) {
        params["relationLastNameEn"] = filters.relationLastNameEn.trim();
      }
      if (filters.house_no?.trim()) {
        params["house_no"] = filters.house_no.trim();
      }
      if (filters.boothNumber && filters.boothNumber.length > 0) {
        params.boothNumber = filters.boothNumber;
      }
      if (filters.religion) {
        params.religion = filters.religion;
      }
      if (filters.casteName) {
        params.casteName = filters.casteName;
      }
      if (filters.subcaste) {
        params.subcaste = filters.subcaste;
      }
      if (filters.casteCategoryName) {
        params.casteCategoryName = filters.casteCategoryName;
      }

      if (filters.party) {
        params.party = filters.party;
      }

      if (filters.voterHistoryName) {
        params.voterHistoryName = filters.voterHistoryName;
      }

      if (filters.categoryDescription) {
        params.categoryDescription = filters.categoryDescription;
      }

      if (filters.scheme) {
        params.scheme = filters.scheme;
      }

      if (typeof filters.addressed === "boolean") {
        params.addressed = filters.addressed;
      }

      if (filters.hasPhoto !== null && filters.hasPhoto !== undefined) {
        params.hasPhoto = filters.hasPhoto;
      }

      if (filters.photoUploadedFrom) {
        params.photoUploadedFrom = filters.photoUploadedFrom;
      }
      if (filters.photoUploadedTo) {
        params.photoUploadedTo = filters.photoUploadedTo;
      }

      if (filters.schemeId !== null && filters.schemeId !== undefined) {
        params.schemeId = filters.schemeId;
      }

      console.log("params", params);
      console.log("Booth numbers", filters.boothNumber);
      const response = await getVotersApi(params);
      const votersData = response.data?.voters?.content;
      console.log("votersData", votersData);

      //Check for booth stats
      let statsSource = response.data.genderStats;

      // If genderStats is null
      if (!statsSource && response.data.boothGenderStats?.length > 0) {
        statsSource = response.data.boothGenderStats.reduce(
          (acc: any, booth: any) => ({
            maleCount: acc.maleCount + (booth.maleCount || 0),
            femaleCount: acc.femaleCount + (booth.femaleCount || 0),
            otherCount: acc.otherCount + (booth.otherCount || 0),
            totalCount: acc.totalCount + (booth.totalCount || 0),
          }),
          { maleCount: 0, femaleCount: 0, otherCount: 0, totalCount: 0 }
        );
      }

      // Ensure statsSource is not null
      statsSource = statsSource || {
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
        totalCount: 0,
      };

      // Set Gender Stats
      setStats({
        male: statsSource.maleCount,
        female: statsSource.femaleCount,
        others: statsSource.otherCount,
        total: statsSource.totalCount,
        addressed: response.data.addressedVoterStats?.addressedCount || 0,
        notAddressed: response.data.addressedVoterStats?.notAddressedCount || 0,
      });
      setPhotoStats(
        response.data.photoStats
          ? {
              votersWithPhoto: response.data.photoStats.votersWithPhoto || 0,
              votersWithoutPhoto: response.data.photoStats.votersWithoutPhoto || 0,
            }
          : null
      );

      // Update Gender Stats State
      // setStats({
      //   male: maleCount,
      //   female: femaleCount,
      //   others: otherCount,
      //   total: totalCount,
      // });

      let mappedData = votersData.map((voter: any, index: number) => ({
        ...voter,
        key: `${page}-${index}`,
        // sno: page * size + index + 1,
        epicNumber: `${voter.epic_number || "No data"}`,
        voterName:
          `${voter.first_name || ""} ${voter.last_name || ""}`.trim() ||
          "No Data",
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
        relativeName:
          [voter.rlnFnameEn, voter.rlnLnameEn, voter.relationNameL1]
            .filter(Boolean)
            .join(" ")
            .trim() || "No Data",
        partNumber: voter.partNo ?? "No data",
        sectionNumber:
          voter.sectionNo !== null && voter.sectionNo !== undefined
            ? voter.sectionNo
            : "No data",
        familyCount: voter.familyCount ?? "1",
        friendCount: voter.friendCount ?? "0",
        slipCount: voter.voterSlipPrintCount ?? 0,
        serialNumber: voter.serialNumber ?? "No data",
        pinCode: `${voter?.partManager?.pincode || "No Data"}`,
        schemeCount: Array.isArray(voter.voterBenefitSchemes)
          ? voter.voterBenefitSchemes.length
          : 0,
        benefitSchemes: Array.isArray(voter.voterBenefitSchemes)
          ? voter.voterBenefitSchemes
          : [],
      }));

      // mappedData.sort(
      //   (a, b) => (Number(a.partNumber) || 0) - (Number(b.partNumber) || 0)
      // );

      mappedData = mappedData.map((voter: any, index: number) => ({
        ...voter,
        sno: page * size + index + 1,
      }));

      console.log("Mapped Data in VoterList:", mappedData);
      console.log(
        "Selected Booth Numbers:",
        filters.boothNumber || selectedBoothNumber
      );

      // Apply booth number filter (if necessary)
      const boothFilter = filters.boothNumber || selectedBoothNumber;
      if (boothFilter.length > 0 && !boothFilter.includes("ALL")) {
        mappedData = mappedData.filter((voter: any) =>
          boothFilter.includes(voter.partNumber)
        );
      }

      // Apply search filter
      if (searchQuery && filters.search === undefined) {
        const query = searchQuery.toLowerCase();
        mappedData = mappedData.filter((voter: any) => {
          const addressString = [
            voter.address?.street,
            voter.address?.city,
            voter.address?.state,
            voter.address?.postal_code,
            voter.address?.country,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          const epicNumber = (voter.epic_number || "").toLowerCase();
          const voterId = (voter.voter_id || "").toLowerCase();

          return (
            voter.voterFnameEn.toLowerCase().includes(query) ||
            voter.relativeName.toLowerCase().includes(query) ||
            addressString.includes(query) ||
            epicNumber.includes(query) ||
            voterId.includes(query)
          );
        });
      }

      setVotersList(mappedData);
      setTotalElements(response.data?.voters?.totalElements);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      setVotersList([]);
      setStats({
        male: 0,
        female: 0,
        others: 0,
        addressed: 0,
        notAddressed: 0,
        total: 0,
      });
      setPhotoStats(null);
      console.error("Error fetching voters:", error);
    } finally {
      setLoading(false);
    }
  };

  //Fetch voters by search
  const fetchVotersBySearch = async (query: string, page = 0, size = 10) => {
    if (!selectedElectionId || !query) return;

    try {
      setLoading(true);

      const params = {
        electionId: selectedElectionId,
        query,
        page,
        size,
      };

      const response = await getVotersBySearch({ ...params, signal: undefined });
      console.log("Response from getVotersBySearch:", response);
      const votersData = response.data?.voters?.content || [];

      let statsSource = response.data.genderStats;

      if (!statsSource && response.data.boothGenderStats?.length > 0) {
        statsSource = response.data.boothGenderStats.reduce(
          (acc: any, booth: any) => ({
            maleCount: acc.maleCount + (booth.maleCount || 0),
            femaleCount: acc.femaleCount + (booth.femaleCount || 0),
            otherCount: acc.otherCount + (booth.otherCount || 0),
            totalCount: acc.totalCount + (booth.totalCount || 0),
          }),
          { maleCount: 0, femaleCount: 0, otherCount: 0, totalCount: 0 }
        );
      }

      statsSource = statsSource || {
        maleCount: 0,
        femaleCount: 0,
        otherCount: 0,
        totalCount: 0,
      };

      setStats({
        male: statsSource.maleCount,
        female: statsSource.femaleCount,
        others: statsSource.otherCount,
        total: statsSource.totalCount,
        addressed: response.data.addressedVoterStats?.addressedCount || 0,
        notAddressed: response.data.addressedVoterStats?.notAddressedCount || 0,
      });
      setPhotoStats(
        response.data.photoStats
          ? {
              votersWithPhoto: response.data.photoStats.votersWithPhoto || 0,
              votersWithoutPhoto: response.data.photoStats.votersWithoutPhoto || 0,
            }
          : null
      );

      let mappedData = votersData.map((voter: any, index: number) => ({
        ...voter,
        key: `${page}-${index}`,
        epicNumber: `${voter.epic_number || "No data"}`,
        voterName:
          `${voter.first_name || ""} ${voter.last_name || ""}`.trim() ||
          "No Data",
        age:
          voter.age ||
          (voter.date_of_birth
            ? moment().diff(moment(voter.date_of_birth), "years")
            : "No Data"),
        gender: voter.gender
          ? voter.gender.charAt(0).toUpperCase() +
            voter.gender.slice(1).toLowerCase()
          : "No data",
        relativeName:
          [voter.rlnFnameEn, voter.rlnLnameEn, voter.relationNameL1]
            .filter(Boolean)
            .join(" ")
            .trim() || "No Data",
        partNumber: voter.partNo ?? "No data",
        sectionNumber:
          voter.sectionNo !== null && voter.sectionNo !== undefined
            ? voter.sectionNo
            : "No data",
        familyCount: voter.familyCount ?? "1",
        serialNumber: voter.serialNumber ?? "No data",
        pinCode: `${voter?.partManager?.pincode || voter?.pincode || "No Data"}`,
        schemeCount: Array.isArray(voter.voterBenefitSchemes)
          ? voter.voterBenefitSchemes.length
          : 0,
        benefitSchemes: Array.isArray(voter.voterBenefitSchemes)
          ? voter.voterBenefitSchemes
          : [],
      }));

      mappedData.sort(
        (a: any, b: any) => (Number(a.partNumber) || 0) - (Number(b.partNumber) || 0)
      );

      mappedData = mappedData.map((voter: any, index: number) => ({
        ...voter,
        sno: page * size + index + 1,
      }));

      setVotersList(mappedData);
      setTotalElements(response.data?.voters?.totalElements);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error("Error fetching voters by search:", error);
      setVotersList([]);
      setStats({
        male: 0,
        female: 0,
        others: 0,
        addressed: 0,
        notAddressed: 0,
        total: 0,
      });
      setPhotoStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const buildCurrentFilters = React.useCallback(
    (overrides: Partial<VoterFilters> = {}): VoterFilters => ({
      boothNumber: selectedBoothNumber.includes("ALL") ? [] : selectedBoothNumber,
      gender: selectedGender,
      minAge: ageRange[0],
      maxAge: ageRange[1],
      includeUnknownAge,
      religion: selectedReligion,
      casteName: selectedCaste,
      subcaste: selectedSubcaste,
      casteCategoryName: selectedCasteCategory,
      party: selectedParty,
      voterHistoryName: selectedHistory,
      categoryDescription: selectedCategory,
      sortBy,
      order,
      addressed: addressedFilter,
      hasPhoto: hasPhotoFilter,
      schemeId: selectedSchemeId,
      ...overrides,
    }),
    [
      addressedFilter,
      ageRange,
      hasPhotoFilter,
      includeUnknownAge,
      order,
      selectedBoothNumber,
      selectedCaste,
      selectedCasteCategory,
      selectedCategory,
      selectedGender,
      selectedHistory,
      selectedParty,
      selectedReligion,
      selectedSchemeId,
      selectedSubcaste,
      sortBy,
    ]
  );

  const handlePageChange = (page: number, pageSize: number) => {
    fetchVoters(page - 1, pageSize, buildCurrentFilters());
  };
  // Handle search
  const handleSearch = (clearAll: boolean = false) => {
    setCurrentPage(0);

    if (clearAll) {
      console.log("Clear all triggered, resetting search");

      fetchVoters(0, pageSize, buildCurrentFilters({ search: "" }));
      return;
    }

    const effectiveQuery = searchQuery.trim();
    console.log("Effective Query:", effectiveQuery);

    if (effectiveQuery) {
      console.log("Fetching voters by search with query:", effectiveQuery);
      fetchVotersBySearch(effectiveQuery);
    }
    // else {
    //   console.log("Fetching voters without search query");
    //   fetchVoters(0, pageSize, {
    //     boothNumber: selectedBoothNumber.includes("ALL")
    //       ? []
    //       : selectedBoothNumber,
    //     gender: selectedGender,
    //     minAge: ageRange[0],
    //     maxAge: ageRange[1],
    //     includeUnknownAge,
    //     religion: selectedReligion,
    //  caste: selectedCaste,
    //         subcaste: selectedSubcaste,
    //         casteCategoryName: selectedCasteCategory,
    //     party: selectedParty,
    //     voterHistoryName: selectedHistory,
    //     categoryDescription: selectedCategory,
    //     sortBy,
    //     order,
    //   });
    // }
  };

  const handleAdvanceSearchModal = () => {
    setIsAdvanceSearchModalVisible(true);
  };

  const handleAdvanceSearch = (filters: any) => {
    fetchVoters(currentPage, pageSize, filters);
  };

  // Handle booth filter remains the same (server-side filtering)
  const handleBoothChange = (selectedValues: BoothSelectionValue[]) => {
    let updatedSelection = [...selectedValues];
    const lastSelectedBooth = updatedSelection[updatedSelection.length - 1];

    if (lastSelectedBooth === "ALL") {
      updatedSelection = ["ALL"];
    } else if (selectedBoothNumber.includes("ALL")) {
      updatedSelection = updatedSelection.filter(
        (booth: BoothSelectionValue) => booth !== "ALL"
      );
    }

    // Prevent request if previous selection was "ALL" and now nothing is selected
    if (selectedBoothNumber.includes("ALL") && updatedSelection.length === 0) {
      setSelectedBoothNumber(updatedSelection);
      return;
    }

    setSelectedBoothNumber(updatedSelection);
    localStorage.setItem(
      "selectedBoothNumber",
      JSON.stringify(updatedSelection)
    );

    const boothFilter =
      updatedSelection.includes("ALL") || updatedSelection.length === 0
        ? []
        : updatedSelection;

    setCurrentPage(0);
    fetchVoters(0, pageSize, buildCurrentFilters({ boothNumber: boothFilter }));
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all voters?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all voter
            data.
          </p>
          <Checkbox
            onChange={(e) => {
              const isChecked = e.target.checked;
              // Update the modal's OK button directly
              modal.update({
                okButtonProps: {
                  disabled: !isChecked,
                  className: !isChecked ? "opacity-50 cursor-not-allowed" : "",
                },
              });
              // Store the checkbox state in a custom property for onOk access
              modal._isDeleteConfirmed = isChecked;
            }}
            style={{ marginTop: 16 }}
          >
            I understand that by confirming, all voter data will be permanently
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
      onOk() {
        // Check the stored confirmation state
        if (modal._isDeleteConfirmed) {
          showFinalDeleteModal();
        }
      },
    });
  };
  const showFinalDeleteModal = () => {
    let inputValue = "";

    let finalModal: any;

    finalModal = Modal.confirm({
      title: "Final Confirmation",
      content: (
        <div>
          <p>
            To confirm, please type <strong>delete</strong> in the box below and
            press Enter.
          </p>
          <Input
            placeholder='Type "delete" to confirm'
            onChange={(e) => {
              inputValue = e.target.value;
              finalModal.update({
                okButtonProps: {
                  disabled: inputValue.toLowerCase() !== "delete",
                  className:
                    inputValue.toLowerCase() !== "delete"
                      ? "opacity-50 cursor-not-allowed"
                      : "",
                },
              });
            }}
            onPressEnter={() => {
              if (inputValue.toLowerCase() === "delete") {
                finalModal.destroy();
                handleDeleteAllVoters(
                  selectedVoters.map((voter) => voter.epicNumber)
                );
              }
            }}
          />
        </div>
      ),
      okText: "Delete All",
      okType: "danger",
      okButtonProps: {
        disabled: true,
        className: "opacity-50 cursor-not-allowed",
      },
      cancelText: "Cancel",
      onOk() {
        if (inputValue.toLowerCase() === "delete") {
          handleDeleteAllVoters();
        }
      },
    });
  };

  // Delete voter
  const handleDeleteVoter = async (voterId: any) => {
    if (isElectionFrozen("Election is frozen. Deletions are disabled.")) {
      return;
    }
    try {
      await deleteVoterApi(voterId, selectedElectionId);
      message.success("Voter deleted successfully");
      fetchVoters(currentPage, pageSize, buildCurrentFilters());
    } catch (error) {
      message.error("Failed to delete voter");
    }
  };

  // Delete All Voters
  const handleDeleteAllVoters = async (epicNumbers?: number[] | string[]) => {
    if (isElectionFrozen("Election is frozen. Deletions are disabled.")) {
      return;
    }
    const isSelective = !!(epicNumbers && epicNumbers.length > 0);
    const electionId = parseInt(selectedElectionId);

    try {
      setIsLoadingButton(true);
      setDeletePercent(0);
      setDeleteProgressMessage("Queuing deletion job…");
      setIsDeleteInProgress(true);

      // Fire the delete — backend returns immediately with an operationId
      const response = await deleteAllVotersApi(electionId, epicNumbers);
      const operationId: string | undefined = response?.data?.operationId;

      if (!operationId) {
        // Fallback: backend responded synchronously (old behaviour)
        const successMessage = isSelective
          ? `${epicNumbers!.length} voter${epicNumbers!.length !== 1 ? "s" : ""} deleted successfully`
          : "All voters deleted successfully";
        message.success(successMessage);
        setSelectedRowKeys([]);
        fetchVoters(currentPage, pageSize);
        return;
      }

      // Poll for real progress every 1 s
      await new Promise<void>((resolve, reject) => {
        const MAX_POLLS = 600; // 10 minutes max
        let polls = 0;
        const interval = setInterval(async () => {
          polls++;
          if (polls > MAX_POLLS) {
            clearInterval(interval);
            reject(new Error("Delete timed out after 10 minutes."));
            return;
          }
          try {
            const progress = await getDeleteProgressApi(electionId, operationId);
            setDeletePercent(progress.percent ?? 0);
            setDeleteProgressMessage(progress.message ?? "Working…");

            if (progress.status === "COMPLETED") {
              clearInterval(interval);
              resolve();
            } else if (progress.status === "FAILED" || progress.status === "NOT_FOUND") {
              clearInterval(interval);
              reject(new Error(progress.errorMessage || progress.message || "Deletion failed."));
            }
          } catch (pollErr) {
            // Network hiccup — keep polling
            console.warn("Progress poll error (will retry):", pollErr);
          }
        }, 1000);
      });

      const successMessage = isSelective
        ? `${epicNumbers!.length} voter${epicNumbers!.length !== 1 ? "s" : ""} deleted successfully`
        : "All voters deleted successfully";
      message.success(successMessage);
      setSelectedRowKeys([]);
      fetchVoters(currentPage, pageSize);
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        (isSelective ? "Failed to delete selected voters" : "Failed to delete all voters");
      console.error("handleDeleteAllVoters error:", error);
      message.error(errorMessage);
    } finally {
      setIsLoadingButton(false);
      setIsDeleteInProgress(false);
      setDeleteProgressMessage("");
      setDeletePercent(0);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: any[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedVoters(selectedRows);
    },
  };

  // Edit voter
  const handleEditVoter = (voter: any) => {
    if (isElectionFrozen("Election is frozen. Edits are disabled.")) {
      return;
    }
    setEditingVoter(voter);
    setIsEditModalVisible(true);
  };
  const handleFamilyMapping = async (voter: any) => {
    // const voterId = voter?.epic_number;
    // const electionId = selectedElectionId;
    // const response = await getVotersApi({ electionId, voterId });
    // console.log("got response");
    // setVoterData(response?.data?.content[0]);
    setVoterData(voter);
    setIsFamilyModalVisible(true);
  };
  const handleFriendsMapping = async (voter: any) => {
    // const voterId = voter?.epic_number;
    // const electionId = selectedElectionId;
    // const response = await getVotersApi({ electionId, voterId });
    // console.log("got response");
    // setVoterData(response?.data?.content[0]);
    setFriendsVoterData(voter);
    setIsFriendsModalVisible(true);
  };
  const handleSchemesOpen = (voter: any) => {
    setSchemesVoterData(voter);
    setIsSchemesModalVisible(true);
  };

  // Handle photo/no-photo filter
  const handlePhotoClick = (hasPhoto: boolean) => {
    const newFilter = hasPhotoFilter === hasPhoto ? null : hasPhoto;
    setHasPhotoFilter(newFilter);
    setCurrentPage(0);
    fetchVoters(0, pageSize, {
      ...buildCurrentFilters({
        boothNumber:
          selectedBoothNumber && selectedBoothNumber.length > 0
            ? selectedBoothNumber.filter(
                (booth: BoothSelectionValue) => booth !== "ALL"
              )
            : undefined,
        addressed: addressedFilter,
      }),
      hasPhoto: newFilter,
    });
  };

  // Handle addressed/unaddressed filter
  const handleAddressedClick = (isAddressed: boolean) => {
    const newFilter = addressedFilter === isAddressed ? null : isAddressed;
    setAddressedFilter(newFilter);
    setCurrentPage(0);
    fetchVoters(0, pageSize, {
      ...buildCurrentFilters({
        boothNumber:
          selectedBoothNumber && selectedBoothNumber.length > 0
            ? selectedBoothNumber.filter(
                (booth: BoothSelectionValue) => booth !== "ALL"
              )
            : undefined,
        hasPhoto: hasPhotoFilter,
      }),
      addressed: newFilter,
    });
  };

  // Update voter
  const handleUpdateVoter = async (updatedVoter: any) => {
    if (isElectionFrozen("Election is frozen. Updates are disabled.")) {
      return;
    }
    try {
      console.log("Updated Voter", updatedVoter);

      // Call deleteVoterImageApi if image is removed and no new image is uploaded
      if (updatedVoter.imageRemoved && !updatedVoter.voterImage) {
        try {
          await deleteVoterImageApi(
            parseInt(selectedElectionId),
            updatedVoter.prev_epic_number || updatedVoter.epic_number
          );
          console.log("Voter image deleted successfully");
        } catch (deleteError) {
          console.error("Failed to delete voter image:", deleteError);
        }
      }

      await updateVoterApi(
        updatedVoter.prev_epic_number || updatedVoter.epic_number,
        selectedElectionId,
        updatedVoter
      );
      if (updatedVoter.voterImage) {
        await addVoterImageApi(
          updatedVoter.epic_number,
          parseInt(selectedElectionId),
          updatedVoter.voterImage
        );
      } else {
        console.log("No new image uploaded. Retaining previous image.");
      }
      setIsEditModalVisible(false);
      message.success("Voter updated successfully");
      // fetchVoters(currentPage, pageSize);
      if (searchQuery) {
        fetchVotersBySearch(searchQuery, currentPage, pageSize);
      } else {
        fetchInitialData(currentPage);
      }
    } catch (error) {
      message.error("Failed to update voter");
    } finally {
      setLoadingModal(false);
    }
  };

  const handleVerifyVoter = (voter: any) => {
    setSelectedVoter(voter);
    setIsVerifyVoterModalVisible(true);
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={async () => {
          await handleDeleteAllVoters(
            selectedVoters.map((voters) => voters.epicNumber)
          );
        }}
        disabled={
          isFrozen ||
          selectedVoters.length === 0 ||
          isLoadingButton ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("votersList"))
        }
      >
        {isLoadingButton
          ? "Deleting..."
          : `Delete Selected (${selectedVoters.length})`}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("votersList"))
        }
        danger
      >
        Delete All Voters
      </Menu.Item>
      <Menu.Item
        key="export"
        icon={
          isExportInProgress ? <LoadingOutlined spin /> : <DownloadOutlined />
        }
        disabled={isExportInProgress}
        onClick={() => {
          // Collect all current filter values
          const filters: VoterFilters = {
            gender: selectedGender,
            minAge: ageRange[0],
            maxAge: ageRange[1],
            includeUnknownAge: includeUnknownAge,
            religion: selectedReligion,
            casteName: selectedCaste,
            subcaste: selectedSubcaste,
            casteCategoryName: selectedCasteCategory,
            party: selectedParty,
            voterHistoryName: selectedHistory,
            categoryDescription: selectedCategory,
            sortBy: order ? "firstname,lastname" : null,
            order: order,
            schemeId: selectedSchemeId,
          };
          console.log("filters before filtering", filters);
          // Remove undefined/null/empty values for cleaner params
          Object.keys(filters).forEach((key) => {
            const filterKey = key as keyof VoterFilters;
            const value = filters[filterKey];

            if (
              value === undefined ||
              value === null ||
              value === "" ||
              (Array.isArray(value) && value.length === 0)
            ) {
              delete filters[filterKey];
            }
          });
          console.log("filters", filters);
          showPdfExcelExportModal(
            parseInt(selectedElectionId),
            boothNumbers,
            {
              title: "Export Voters",
              filters: filters,
              showColumnSelection: true,
              allowAllParts: true,
            }
          );
        }}
      >
        {isExportInProgress ? "Export In Progress..." : "Export Voters"}
      </Menu.Item>

      {/* <Menu.Item
        key="run-check"
        icon={<UsergroupAddOutlined />}
        onClick={runDuplicateVotersCheck}
      >
        Run Duplicate Voters
      </Menu.Item> */}
    </Menu>
  );

  // Filter menu for additional filters (such as gender)
  const filterMenu = (
    <div className="bg-[#f9f9f9] p-3 rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.1)] max-h-[700px] overflow-y-auto w-[320px]">
      <div>
        <div className="mb-3">
          <span className="block mb-2 font-medium">Photo:</span>
          <Radio.Group
            value={hasPhotoFilter === null ? "all" : hasPhotoFilter ? "with" : "without"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") setHasPhotoFilter(null);
              else if (v === "with") setHasPhotoFilter(true);
              else setHasPhotoFilter(false);
            }}
          >
            <Radio value="all">All</Radio>
            <Radio value="with">With Photo</Radio>
            <Radio value="without">Without Photo</Radio>
          </Radio.Group>
        </div>
        <span className="block my-4 font-medium">Gender:</span>
        <Checkbox.Group
          options={["Male", "Female", "Other"]}
          value={selectedGender}
          onChange={(values) => setSelectedGender(values as string[])}
        />
      </div>
      {/* Age Range Filter */}
      <div className="mt-4">
        <span className="block mb-2 font-medium">Age Range:</span>
        <div className="flex gap-2 items-center mb-2">
          <input
            type="number"
            min="0"
            max="120"
            value={ageRange[0]}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setAgeRange([newValue, ageRange[1]]);
            }}
            className="border rounded px-2 py-1 w-20"
          />
          <span>to</span>
          <input
            type="number"
            min="0"
            max="120"
            value={ageRange[1]}
            onChange={(e) => {
              const newValue = Number(e.target.value);
              setAgeRange([ageRange[0], newValue]);
            }}
            className="border rounded px-2 py-1 w-20"
          />
        </div>
        <Slider
          range
          min={0}
          max={120}
          step={1}
          value={ageRange}
          onChange={(values) => setAgeRange(values)}
          className="custom-slider"
        />
        <div className="text-center mt-1 text-sm">
          {ageRange[0]} - {ageRange[1]} years
        </div>
        <Checkbox
          checked={includeUnknownAge}
          onChange={(e) => setIncludeUnknownAge(e.target.checked)}
        >
          Include Unknown Age
        </Checkbox>
      </div>
      {/* New sorting filter */}
      <div className="mt-4">
        <span className="block mb-2 font-medium">Sort by Name:</span>
        <Select
          placeholder="Select sorting order"
          className="w-full"
          value={order}
          onChange={(value) => setOrder(value)}
        >
          <Option value="asc">A-Z (Ascending)</Option>
          <Option value="desc">Z-A (Descending)</Option>
        </Select>
      </div>

      <div className="mt-4">
        <span className="block mb-2 font-medium">Religion:</span>
        <Select
          mode="multiple"
          placeholder="Select Religion"
          className="w-full"
          value={selectedReligion}
          onChange={(value) => setSelectedReligion(value)}
          allowClear
        >
          {religions?.map((r) => (
            <Option key={r.key} value={r.religionName}>
              {r.religionName}
            </Option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <span className="block mb-2 font-medium">Caste:</span>
        <Select
          mode="multiple"
          placeholder={
            selectedReligion.length > 0
              ? "Select Caste"
              : "Select Religion first"
          }
          className="w-full"
          value={selectedCaste}
          onChange={(value) => setSelectedCaste(value)}
          disabled={selectedReligion.length === 0}
          allowClear
        >
          {castes?.map((c) => (
            <Option key={c.key} value={c.casteName}>
              {c.casteName}
            </Option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <span className="block mb-2 font-medium">Subcaste:</span>
        <Select
          mode="multiple"
          placeholder={
            selectedCaste.length > 0 ? "Select Subcaste" : "Select Caste first"
          }
          className="w-full"
          value={selectedSubcaste}
          onChange={(value) => setSelectedSubcaste(value)}
          disabled={selectedCaste.length === 0}
          allowClear
        >
          {subCastes?.map((sc) => (
            <Option key={sc.key} value={sc.subCasteName}>
              {sc.subCasteName}
            </Option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <span className="block mb-2 font-medium">Caste Category:</span>
        <Select
          mode="multiple"
          placeholder="Select Caste Category"
          className="w-full"
          value={selectedCasteCategory}
          onChange={(value) => setSelectedCasteCategory(value)}
          allowClear
        >
          {casteCategories?.map((cc) => (
            <Option key={cc.key} value={cc.casteCategoryName}>
              {cc.casteCategoryName}
            </Option>
          ))}
        </Select>
      </div>

      {/* Voting History Filter */}
      <div className="mt-4">
        <span className="block mb-2 font-medium">Voting History:</span>
        <Select
          mode="multiple"
          placeholder="Select History"
          className="w-full"
          value={selectedHistory}
          onChange={(value) => setSelectedHistory(value)}
          allowClear
        >
          {histories?.map((h) => (
            <Option key={h.key} value={h.voterHistoryName}>
              {h.voterHistoryName}
            </Option>
          ))}
        </Select>
      </div>

      {/* Voter Category Filter */}
      <div className="mt-4">
        <span className="block mb-2 font-medium">Voter Category:</span>
        <Select
          mode="multiple"
          placeholder="Select Category"
          className="w-full"
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
          allowClear
        >
          {availabilities?.map((a) => (
            <Option key={a.key} value={a.description}>
              {a.description}
            </Option>
          ))}
        </Select>
      </div>

      {/* Party Filter */}
      <div className="mt-4">
        <span className="block mb-2 font-medium">Party:</span>
        <Select
          mode="multiple"
          placeholder="Select Party"
          className="w-full"
          value={selectedParty}
          onChange={(value) => setSelectedParty(value)}
          allowClear
        >
          {parties?.map((p) => (
            <Option key={p.key} value={p.partyName}>
              {p.partyName}
            </Option>
          ))}
        </Select>
      </div>
      <div className="mt-4">
        <span className="block mb-2 font-medium">Scheme:</span>
        <Select
          placeholder="Select Scheme"
          className="w-full"
          value={selectedSchemeId ?? undefined}
          onChange={(value: number | undefined) => setSelectedSchemeId(value ?? null)}
          allowClear
          showSearch
          optionFilterProp="children"
        >
          {schemes?.map((scheme) => (
            <Option key={scheme.key} value={scheme.key}>
              {scheme.schemeName}
            </Option>
          ))}
        </Select>
      </div>
      <Button
        type="primary"
        onClick={() => {
          // Apply the pending filters when button is clicked
          // setSelectedGender(pendingGender);
          setAgeRange(ageRange);
          setIncludeUnknownAge(includeUnknownAge);
          setFilterDropdownVisible(false);
          const finalSortBy = order ? "firstname,lastname" : null;
          setSortBy(finalSortBy);

          // Trigger the API call with the new filters
          fetchVoters(
            0,
            pageSize,
            buildCurrentFilters({
              sortBy: finalSortBy,
              order: order,
              hasPhoto: hasPhotoFilter,
              schemeId: selectedSchemeId,
            })
          );
          setFilterDropdownVisible(false);
        }}
        block
        className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)] mt-4"
      >
        Apply Filters
      </Button>
      <Button
        onClick={() => {
          setSelectedGender([]);
          setSelectedReligion([]);
          setSelectedCaste([]);
          setSelectedSubcaste([]);
          setSelectedCasteCategory([]);
          setSelectedHistory([]);
          setSelectedCategory([]);
          setSelectedParty([]);
          setSelectedSchemes([]);
          setAgeRange([0, 120]);
          setOrder(null);
          setIncludeUnknownAge(true);
          setSortBy("part_number,serial_number");
          setAddressedFilter(null);
          setHasPhotoFilter(null);
          setSelectedSchemeId(null);
          fetchVoters(0, pageSize, {
            boothNumber: selectedBoothNumber.includes("ALL")
              ? []
              : selectedBoothNumber,
            gender: [],
            minAge: 0,
            maxAge: 120,
            includeUnknownAge: true,
            order: "asc",
            sortBy: "part_number,serial_number",
            addressed: null,
            hasPhoto: null,
            schemeId: null,
          });

          setFilterDropdownVisible(false);
        }}
        block
        className="h-[46px] mt-2 bg-gray-200 border-gray-300  hover:bg-gray-300"
      >
        Clear Filters
      </Button>
    </div>
  );

  // *** Compute the filtered voters list based on gender ***
  // If one or more genders are selected, only include voters whose gender is in that list.
  const filteredVoters = votersList
    .filter((voter: any) => {
      const isGenderMatch = selectedGender.length
        ? selectedGender.some(
            (gender: string) => gender.toLowerCase() === voter.gender.toLowerCase()
          )
        : true;

      const isAgeMatch =
        voter.age != null && !isNaN(voter.age)
          ? voter.age >= ageRange[0] && voter.age <= ageRange[1]
          : includeUnknownAge;
      return isGenderMatch && isAgeMatch;
    })
    .sort((a: any, b: any) => {
      if (order === "asc") {
        return a.voterFnameEn.localeCompare(b.voterFnameEn);
      } else if (order === "desc") {
        return b.voterFnameEn.localeCompare(a.voterFnameEn);
      }
      return 0; // No sorting if order is not selected
    });

  useEffect(() => {
    console.log("Voters list passed in table", filteredVoters);
  }, []);

  return (
    <div className="w-full h-full p-10 pt-5">
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={24}>
          <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
            Voters List
          </h3>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="w-full items-end mt-10">
        <Col xs={24} sm={12} md={6}>
          <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
            Choose Booth Number
          </label>
          <Select
            mode="multiple"
            placeholder="Choose Booth number(s)"
            onChange={handleBoothChange}
            className="w-full custom-select"
            showSearch
            filterOption={(input, option) =>
              option?.children
                ?.toString()
                .toLowerCase()
                .includes(input.toLowerCase()) ?? false
            }
            style={{
              minHeight: "45px",
              height: "auto",
            }}
            value={selectedBoothNumber}
            allowClear
          >
            <Option value="ALL">All Booths</Option>
            {boothNumbers.map((boothNumber) => (
              <Option key={boothNumber} value={boothNumber}>
                {boothNumber}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
            Search Voter
          </label>
          <div className="flex items-center gap-2">
            <Input
              placeholder={`Search Voter`}
              className="flex-1 h-[45px] rounded-lg border border-gray-300 px-4 focus:ring-0 focus:outline-none focus:border-[#1D4ED8]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={() => handleSearch()}
            />
            <Button
              type="primary"
              icon={<SearchOutlined style={{ color: "#fff", fontSize: 20 }} />}
              className="bg-[#1D4ED8] border-none rounded-lg flex items-center justify-center"
              style={{ height: 45, width: 45 }}
              onClick={() => handleSearch()}
            />
          </div>
        </Col>

        <Col xs={24} md={12}>
          {/* Buttons Row (flex) */}
          <div className="flex flex-wrap justify-between gap-3 mt-4 md:mt-0">
            <Button
              type="default"
              className="h-[45px] text-sm px-4"
              onClick={() => {
                setSearchQuery("");
                handleSearch(true);
              }}
            >
              Clear
            </Button>
            <div className="flex flex-wrap gap-3 ">
              <Button
                type="default"
                className="h-[45px] text-[#fff] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                onClick={handleAdvanceSearchModal}
              >
                Advance Search
              </Button>

              <Dropdown overlay={actionsMenu} trigger={["click"]}>
                <Button
                  type="primary"
                  className="h-[45px] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>

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
            </div>
          </div>
        </Col>
      </Row>
    <Row className="mt-6">
      <Col span={24}>
        <div className="w-full bg-[#F3F4F6] px-6 py-4 rounded-lg border border-gray-300 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4 text-center">
            
            <div className="flex flex-col min-w-[80px]">
              <span className="text-[13px] text-black font-semibold uppercase tracking-wider mb-1">Male</span>
              <span className="text-[18px] font-bold text-[#2563EB]">{stats.male}</span>
            </div>

            <div className="flex flex-col min-w-[80px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Female</span>
              <span className="text-[18px] font-bold text-[#2563EB]">{stats.female}</span>
            </div>

            <div className="flex flex-col min-w-[80px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Others</span>
              <span className="text-[18px] font-bold text-[#2563EB]">{stats.others}</span>
            </div>

            <div className="flex flex-col min-w-[80px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Total</span>
              <span className="text-[18px] font-bold text-[#059669]">{stats.total}</span>
            </div>

            <div className="flex flex-col min-w-[120px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Addressed Voter</span>
              <span
                className="text-[18px] font-bold text-[#2563EB] cursor-pointer hover:underline"
                style={{
                  textDecoration: addressedFilter === true ? "underline" : "none",
                  fontWeight: addressedFilter === true ? "bold" : "normal"
                }}
                onClick={() => handleAddressedClick(true)}
              >
                {stats.addressed}
              </span>
            </div>

            <div className="flex flex-col min-w-[140px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Unaddressed Voter</span>
              <span
                className="text-[18px] font-bold text-[#2563EB] cursor-pointer hover:underline"
                style={{
                  textDecoration: addressedFilter === false ? "underline" : "none",
                  fontWeight: addressedFilter === false ? "bold" : "normal"
                }}
                onClick={() => handleAddressedClick(false)}
              >
                {stats.notAddressed}
              </span>
            </div>

            <div className="flex flex-col min-w-[140px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Voters With Photo</span>
              <span
                className="text-[18px] font-bold text-[#2563EB] cursor-pointer hover:underline"
                style={{
                  textDecoration: hasPhotoFilter === true ? "underline" : "none",
                  fontWeight: hasPhotoFilter === true ? "bold" : "normal"
                }}
                onClick={() => handlePhotoClick(true)}
              >
                {photoStats?.votersWithPhoto ?? electionStats.data?.votersWithPhoto ?? 0}
              </span>
            </div>

            <div className="flex flex-col min-w-[160px]">
              <span className="text-[13px]  font-semibold uppercase tracking-wider mb-1">Voters Without Photo</span>
              <span
                className="text-[18px] font-bold text-[#2563EB] cursor-pointer hover:underline"
                style={{
                  textDecoration: hasPhotoFilter === false ? "underline" : "none",
                  fontWeight: hasPhotoFilter === false ? "bold" : "normal"
                }}
                onClick={() => handlePhotoClick(false)}
              >
                {photoStats?.votersWithoutPhoto ?? electionStats.data?.votersWithoutPhoto ?? 0}
              </span>
            </div>

          </div>
        </div>
      </Col>
    </Row>

      <Row className="mt-10">
        <Col span={24}>
          <VotersTable
            // Pass the locally filtered list to the table
            rowSelection={isFrozen ? undefined : rowSelection}
            filteredVotersList={votersList}
            onDeleteVoter={handleDeleteVoter}
            handleFamilyMapping={handleFamilyMapping}
            handleFriendsMapping={handleFriendsMapping}
            handleSchemesOpen={handleSchemesOpen}
            onEditVoter={handleEditVoter}
            onVerifyVoter={handleVerifyVoter}
            onGenerateIdCard={handleGenerateIdCard}
            currentPage={currentPage}
            pageSize={pageSize}
            totalElements={totalElements}
            onPageChange={handlePageChange}
          />
        </Col>
      </Row>

      <EditVoterModal
        visible={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
        }}
        onUpdate={handleUpdateVoter}
        voter={editingVoter}
        loadingModal={loadingModal}
        setLoadingModal={setLoadingModal}
      />

      <FamilyModal
        voterData={voterData}
        currentPage={currentPage}
        pageSize={pageSize}
        fetchVoters={fetchVoters}
        visible={isFamilyModalVisible}
        onCancel={() => setIsFamilyModalVisible(false)}
      />

      <FriendsModal
        visible={isFriendsModalVisible}
        onCancel={() => setIsFriendsModalVisible(false)}
        voterData={friendsVoterData}
        fetchVoters={fetchVoters}
      />
      <SchemesModal
        visible={isSchemesModalVisible}
        onCancel={() => {
          setIsSchemesModalVisible(false);
          setSchemesVoterData(null);
        }}
        schemes={schemesVoterData?.benefitSchemes || []}
      />

      <VerifyVoterModal
        visible={isVerifyVoterModalVisible}
        onClose={() => setIsVerifyVoterModalVisible(false)}
        voter={selectedVoter}
      />

      <AdvancedSearchModal
        open={isAdvanceSearchModalVisible}
        onClose={() => setIsAdvanceSearchModalVisible(false)}
        onClear={() => {
          setIsAdvanceSearchModalVisible(false);
          fetchVoters(0, pageSize, buildCurrentFilters({ search: "" }));
        }}
        onSearch={handleAdvanceSearch}
      />

      {/* ── Delete Progress Modal ── */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LoadingOutlined spin style={{ color: "#dc2626", fontSize: 20 }} />
            <span>Deleting Voters</span>
          </div>
        }
        open={isDeleteInProgress}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        width={460}
        centered
      >
        <div style={{ padding: "12px 0" }}>
          <Progress
            percent={deletePercent}
            status={deletePercent === 100 ? "success" : "active"}
            strokeColor={deletePercent === 100 ? "#16a34a" : "#dc2626"}
            format={(pct) => `${pct}%`}
          />
          <div style={{ marginTop: 14, color: "#334155", fontSize: 14 }}>
            {deleteProgressMessage}
          </div>
          <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
            Please wait — do not close this page or navigate away.
          </div>
        </div>
      </Modal>

      <Modal
        title="Generating Voter ID Cards"
        open={isPartWiseIdCardExporting}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        width={520}
      >
        <div style={{ paddingTop: "8px" }}>
          <Progress
            percent={
              partWiseExportProgress.totalPages > 0
                ? Math.round(
                    (partWiseExportProgress.currentPage /
                      partWiseExportProgress.totalPages) *
                      100
                  )
                : 0
            }
            status="active"
          />
          <div style={{ marginTop: "10px", color: "#334155", fontSize: "13px" }}>
            {partWiseExportProgress.phase === "rendering"
              ? "All pages fetched. PDF is generating... download will start shortly."
              : partWiseExportProgress.currentPart !== null
              ? `Processing Part ${partWiseExportProgress.currentPart} — Page ${partWiseExportProgress.currentPage} of ${partWiseExportProgress.totalPages}`
              : "Preparing export..."}
          </div>
          <div style={{ marginTop: "8px", color: "#dc2626", fontSize: "12px" }}>
            Do not close this page or navigate away until download completes.
          </div>
        </div>
      </Modal>
    </div>
  );
}
