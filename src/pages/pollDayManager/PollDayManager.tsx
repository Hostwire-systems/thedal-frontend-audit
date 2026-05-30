import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSelector } from "react-redux";
import {
  Col,
  Row,
  Select,
  Input,
  Button,
  Dropdown,
  Checkbox,
  message,
  Modal,
  Slider,
  Spin,
  Space,
  Menu,
} from "antd";
import {
  SearchOutlined,
  DownOutlined,
  DownloadOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import {
  getVotersApi,
  getVotersBySearch,
  markVoterAsVoted,
} from "../../api/voterApi";
import moment from "moment";
import ViewVoterModal from "./ViewVoterModal";
import VotersTable from "./votersTable";
import { useLoading } from "../../context/LoadingContext";
import { RootState } from "../../redux/store";
import { getPartsApi } from "../../api/partApi";
import { fetchBooths } from "../../api/boothApi";
import { fetchReligion } from "../../api/religionApi";
import { fetchCaste } from "../../api/casteApi";
import { fetchSubCaste } from "../../api/subCasteApi";
import { fetchCasteCategories } from "../../api/casteCategoryApi";
import { fetchParties } from "../../api/partyApi";
import { getAvailabilityApi } from "../../api/availabilityApi";
import { fetchHistory } from "../../api/historyApi";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";
import { ReligionType } from "../../types/religion";
import { Caste } from "../../types/voter";
import { SubCaste } from "../../types/voter";
import { CasteCategory } from "../../types/casteCategory";
import { Availability } from "../../types/voter";
import { PartyType } from "../../types/party";
import { VoterHistory } from "../../types/history";
import { useLocation, useSearchParams } from "react-router-dom";
import { useExport } from "../../context/ExportContext";
import { VoterFilters } from "../../types/voterFilter";

const { Option } = Select;

const API_PARAMS = {
  VOTER_ID: {
    client: "voterId",
    api: "voter-id",
  },
  BOOTH_NUMBER: {
    client: "boothNumber",
    api: "booth-number",
  },
};

export default function PollDayManager() {
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Data states
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = useMemo(() => {
    const queryStatus = searchParams.get("status");
    const stateStatus = location.state?.status;
    const rawStatus =
      typeof stateStatus === "string" && stateStatus.trim().length > 0
        ? stateStatus
        : queryStatus;

    if (!rawStatus) {
      return null;
    }

    const normalizedStatus = rawStatus.toLowerCase();
    if (normalizedStatus === "voted") {
      return "voted";
    }
    if (normalizedStatus === "notvoted") {
      return "notVoted";
    }

    return null;
  }, [location.state, searchParams]);
  const [votersList, setVotersList] = useState([]);
  const [stats, setStats] = useState({
    totalVote: 0,
    voted: 0,
    notVoted: 0,
    percentOfTurnout: 0,
  });
  const [filteredVotersList, setFilteredVotersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("voterId"); // Default is EPIC ID search
  const [filterDropdownVisible, setFilterDropdownVisible] = useState(false);

  // Booth states
  const [boothNumbers, setBoothNumbers] = useState([]);
  const [allBoothNumbers, setAllBoothNumbers] = useState([]);
  const [selectedBoothNumber, setSelectedBoothNumber] = useState(["ALL"]);

  //Filter states
  const [religions, setReligions] = useState<ReligionType[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [subCastes, setSubCastes] = useState<SubCaste[]>([]);
  const [casteCategories, setCasteCategories] = useState<CasteCategory[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [parties, setParties] = useState<PartyType[]>([]);
  const [histories, setHistories] = useState<VoterHistory[]>([]);
  const [selectedReligion, setSelectedReligion] = useState<string | null>(null);
  const [selectedCaste, setSelectedCaste] = useState<string | null>(null);
  const [selectedSubcaste, setSelectedSubcaste] = useState<string | null>(null);
  const [selectedCasteCategory, setSelectedCasteCategory] = useState<
    string | null
  >(null);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [order, setOrder] = useState<"asc" | "desc" | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [selectedVoteStatus, setSelectedVoteStatus] = useState([]);
  const [ageRange, setAgeRange] = useState([0, 120]);
  const [selectedGender, setSelectedGender] = useState([]);
  const [includeUnknownAge, setIncludeUnknownAge] = useState<boolean>(true);
  const [hasMobileNumber, setHasMobileNumber] = useState(false);
  const [hasWhatsappNumber, setHasWhatsappNumber] = useState(false);

  // Modal states
  const [viewingVoter, setViewingVoter] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const initialLoadRef = useRef(true);
  const { isLoading, setLoading } = useLoading();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const accountId = useMemo(
    () =>
      Number(localStorage.getItem("accountId")) ||
      Number(localStorage.getItem("userId")) ||
      0,
    []
  );

  // Fetch initial data on mount
  useEffect(() => {
    if (selectedElectionId) {
      if (initialLoadRef.current) {
        fetchInitialData();
        initialLoadRef.current = false;
      }

      fetchReligionData();
      fetchPartyData();
      fetchAvailabilityData();
      fetchHistoryData();
      fetchCasteCategoryData();
      fetchSchemeData();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (!initialLoadRef.current && selectedElectionId && statusFilter) {
      console.log("URL parameter changed:", statusFilter);
      applyUrlFilters();
    }
  }, [statusFilter, selectedElectionId]);

  const applyUrlFilters = async () => {
    let voteStatus = [];

    switch (statusFilter) {
      case "voted":
        voteStatus = ["Voted"];
        break;
      case "notVoted":
        voteStatus = ["Not Voted"];
        break;
      default:
        voteStatus = [];
        break;
    }

    setSelectedVoteStatus(voteStatus);

    const filters: any = {
      boothNumber: selectedBoothNumber.includes("ALL")
        ? []
        : selectedBoothNumber,
    };

    if (voteStatus.length > 0) {
      filters.pollStatus = voteStatus;
    }

    setCurrentPage(0);
    await fetchVoters(0, pageSize, filters);
  };

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
          .filter((pn: any) => !isNaN(pn) && pn !== null && pn !== undefined)
          .sort((a: number, b: number) => a - b);

        console.log("Mapped & Sorted Part Numbers:", partNumbersFromResponse);
      } catch (error) {
        console.error("Error fetching parts:", error);
        partNumbersFromResponse = [];
      }

      setBoothNumbers(partNumbersFromResponse);
      setSelectedBoothNumber(["ALL"]);

      await applyUrlFilters();
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
        response?.data?.map((item) => ({
          key: item.casteCategoryId,
          casteCategoryName: item.casteCategoryName,
        })) || [];
      setCasteCategories(fetchedData);
    } catch (error) {
      console.error("Error fetching caste categories:", error);
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
            (scheme: any) => Number.isFinite(scheme.key) && scheme.key > 0
          )
          .sort(
            (a: any, b: any) =>
              Number(a?.orderIndex ?? 0) - Number(b?.orderIndex ?? 0)
          ) || [];

      setSchemes(fetchedSchemes);
    } catch (error) {
      console.error("Error fetching benefit schemes:", error);
    }
  };

 // Optimized fetch voters function
const fetchVoters = async (
  page = currentPage,
  size = pageSize,
  filters: {
    boothNumber?: string[];
    gender?: string[];
    minAge?: number;
    maxAge?: number;
    includeUnknownAge?: boolean;
    religion?: string | null;
    casteName?: string | null;
    subcaste?: string | null;
    casteCategoryName?: string | null;
    party?: string | null;
    voterHistoryName?: string | null;
    categoryDescription?: string | null;
    search?: string;
    voterId?: string;
    epic_number?: string;
    serial_number?: string;
    voterFnameEn?: string;
    voterLnameEn?: string;
    relationFirstNameEn?: string;
    relationLastNameEn?: string;
    pollStatus?: string[];
    hasMobileNo?: boolean;
    hasWhatsappNo?: boolean;
    sortBy?: string | null;
    order?: "asc" | "desc" | null;
    schemeId?: number | null;
  } = {}
) => {
  if (!selectedElectionId) return;

  try {
    setLoading(true);

    const apiParams: any = {
      page,
      size,
      electionId: selectedElectionId,
      includePollStats: true,
      ...filters,
    };
    console.log("filters", filters);
    console.log("pollStatus in fetchVoters", filters.pollStatus);

    if (filters.schemeId) {
      apiParams.schemeId = filters.schemeId;
    }

    if (filters.gender && filters.gender.length > 0) {
      apiParams.gender = filters.gender.map((g) => g.toLowerCase());
    }

    if (filters.includeUnknownAge) {
      apiParams.includeUnknownAge = true;
    } else {
      if (filters.minAge !== undefined) {
        apiParams.minAge = filters.minAge;
      }
      if (filters.maxAge !== undefined) {
        apiParams.maxAge = filters.maxAge;
      }
    }
    if (filters.religion) {
      apiParams.religion = filters.religion;
    }
    if (filters.casteName) {
      apiParams.casteName = filters.casteName;
    }
    if (filters.subcaste) {
      apiParams.subcaste = filters.subcaste;
    }
    if (filters.casteCategoryName) {
      apiParams.casteCategoryName = filters.casteCategoryName;
    }

    if (filters.party) {
      apiParams.party = filters.party;
    }

    if (filters.voterHistoryName) {
      apiParams.voterHistoryName = filters.voterHistoryName;
    }

    if (filters.categoryDescription) {
      apiParams.categoryDescription = filters.categoryDescription;
    }

    if (filters.hasMobileNo) {
      apiParams.hasMobileNo = true;
    }

    if (filters.hasWhatsappNo) {
      apiParams.hasWhatsappNo = true;
    }

    if (filters.boothNumber && filters.boothNumber.length > 0) {
      apiParams.boothNumber = filters.boothNumber;
    }
    if (filters.voterFnameEn) {
      apiParams.voterFnameEn = filters.voterFnameEn;
    }
    if (filters.voterId) {
      apiParams.voterId = filters.voterId;
    }

    // 🔴 FIX: Handle pollStatus parameter - MOVED OUTSIDE nested if
    if (filters.pollStatus && filters.pollStatus.length > 0) {
      const statuses = filters.pollStatus;
      console.log("Processing pollStatus:", statuses);

      // If both selected → don't send pollStatus param (show all)
      if (!(statuses.includes("Voted") && statuses.includes("Not Voted"))) {
        apiParams.pollStatus = statuses.map((s) =>
          s === "Voted" ? "voted" : "notVoted"
        );
        console.log("Sending pollStatus to API:", apiParams.pollStatus);
      } else {
        console.log("Both statuses selected, not sending pollStatus");
      }
    } else {
      console.log("No pollStatus filter applied");
    }

    const response = await getVotersApi(apiParams);
    const responsePayload = response?.data ?? response;
    console.log(
      "API Response total elements:",
      responsePayload?.voters?.totalElements
    );

    const votersContent = responsePayload?.voters?.content || [];

    let mappedData = votersContent.map((voter, index) => ({
      ...voter,
      key: `${page}-${index}`,
      sno: page * size + index + 1,
      epicNumber: voter.epic_number || "No data",
      voterFnameEn: voter.voterFnameEn || "",
      voterLnameEn: voter.voterLnameEn || "",
      age:
        voter.age ||
        (voter.date_of_birth
          ? moment().diff(moment(voter.date_of_birth), "years")
          : "No Data"),
      gender: voter.gender || "No data",
      rlnFnameEn: voter.rlnFnameEn || "",
      rlnLnameEn: voter.rlnLnameEn || "",
      partNumber: (voter.partNo !== null && voter.partNo !== undefined) ? voter.partNo : "No data",
      sectionNumber:
        voter.sectionNo !== null && voter.sectionNo !== undefined
          ? voter.sectionNo
          : "No data",
      serialNo: (voter.serialNumber !== null && voter.serialNumber !== undefined) ? voter.serialNumber : 
                (voter.serialNo !== null && voter.serialNo !== undefined) ? voter.serialNo : "No data",
      mobileNo: voter.mobileNo || "",
      whatsappNo: voter.whatsappNo || "",
      pinCode:
        voter?.pincode ||
        (voter.address && voter.address.postal_code) ||
        "No Data",
    }));

    console.log("Mapped Data count:", mappedData.length);

    // Apply booth number filter (if necessary)
    const boothFilter = filters.boothNumber || selectedBoothNumber;
    if (boothFilter.length > 0 && !boothFilter.includes("ALL")) {
      mappedData = mappedData.filter((voter) =>
        boothFilter.includes(voter.partNumber)
      );
    }

    setVotersList(mappedData);
    setFilteredVotersList(mappedData);
    setTotalElements(responsePayload?.voters?.totalElements || 0);
    setCurrentPage(page);
    setPageSize(size);

    const pollStats = responsePayload?.pollStats;
    setStats({
      totalVote: pollStats?.totalVoters || 0,
      voted: pollStats?.votedCount || 0,
      notVoted: pollStats?.notVotedCount || 0,
      percentOfTurnout: Number(pollStats?.turnoutPercentage || 0),
    });

  } catch (error) {
    console.error("Error fetching voters:", error);
    message.error("Failed to fetch voters data");
    setVotersList([]);
    setFilteredVotersList([]);
  } finally {
    setLoading(false);
  }
};

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
      console.log("params", params);
      const response = await getVotersBySearch(params);
      const responsePayload = response?.data ?? response;
      console.log("response of searching voter", responsePayload);
      const votersData = responsePayload?.voters?.content || [];

      let mappedData = votersData.map((voter, index) => ({
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
        mobileNo: voter.mobileNo || "",
        whatsappNo: voter.whatsappNo || "",
        pinCode: `${
          voter?.pincode || voter?.address?.postal_code || "No Data"
        }`,
      }));

      mappedData = mappedData.map((voter, index) => ({
        ...voter,
        sno: page * size + index + 1,
      }));
      setVotersList(mappedData);
      setFilteredVotersList(mappedData);
      setTotalElements(responsePayload?.voters?.totalElements || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error("Error fetching voters by search:", error);
      setVotersList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    console.log("Filters applied to fetch voters", {
      voteStatus: selectedVoteStatus,
      gender: selectedGender,
      religion: selectedReligion,
      casteName: selectedCaste,
      subcaste: selectedSubcaste,
      casteCategoryName: selectedCasteCategory,
      party: selectedParty,
      voterHistoryName: selectedHistory,
      categoryDescription: selectedCategory,
      minAge: ageRange[0],
      maxAge: ageRange[1],
      includeUnknownAge: includeUnknownAge,
      hasMobileNo: hasMobileNumber,
      hasWhatsappNo: hasWhatsappNumber,
      order: order,
      genders: selectedGender,
      ageRange,
    });
    const finalSortBy = order ? "firstname,lastname" : null;
    setSortBy(finalSortBy);
    const filters = {
      boothNumber: selectedBoothNumber.includes("ALL")
        ? []
        : selectedBoothNumber,
      gender: selectedGender,
      religion: selectedReligion,
      casteName: selectedCaste,
      subcaste: selectedSubcaste,
      casteCategoryName: selectedCasteCategory,
      party: selectedParty,
      voterHistoryName: selectedHistory,
      categoryDescription: selectedCategory,
      minAge: ageRange[0],
      maxAge: ageRange[1],
      includeUnknownAge: includeUnknownAge,
      hasMobileNo: hasMobileNumber,
      hasWhatsappNo: hasWhatsappNumber,
      order: order,
      sortBy: finalSortBy,
      pollStatus: selectedVoteStatus,
      schemeId: selectedSchemeId,
    };
    if (selectedVoteStatus.length > 0) {
      filters.pollStatus = selectedVoteStatus;

      const statusParam =
        selectedVoteStatus[0] === "Voted"
          ? "voted"
          : selectedVoteStatus[0] === "Not Voted"
          ? "notVoted"
          : null;

      if (statusParam) {
        setSearchParams({ status: statusParam });
      }
    } else {
      setSearchParams({});
    }
    fetchVoters(0, pageSize, filters);
    setFilterDropdownVisible(false);
  };

  const handleClear = () => {
    setSelectedParty(null);
    setSelectedReligion(null);
    setSelectedCasteCategory(null);
    setSelectedCaste(null);
    setSelectedSubcaste(null);
    setSelectedGender([]);
    setSelectedSchemeId(null);
    setHasMobileNumber(false);
    setHasWhatsappNumber(false);
    setSearchParams({});
    setAgeRange([18, 120]);
    setSortBy("part_number,serial_number");
    setSelectedVoteStatus([]);
    setIncludeUnknownAge(true);
    fetchVoters(0, pageSize, {
      boothNumber: selectedBoothNumber.includes("ALL")
        ? []
        : selectedBoothNumber,
      gender: [],
      minAge: 0,
      maxAge: 120,
      includeUnknownAge: true,
      hasMobileNo: false,
      hasWhatsappNo: false,
      order: "asc",
      sortBy: "part_number,serial_number",
      pollStatus: [],
      schemeId: null,
    });
    setFilterDropdownVisible(false);
  };

  const getStatusFilterText = () => {
    switch (statusFilter) {
      case "voted":
        return "Showing: Voted Voters Only";
      case "notVoted":
        return "Showing: Not Voted Voters Only";
      default:
        return selectedVoteStatus.length > 0
          ? `Showing: ${selectedVoteStatus.join(", ")} Voters`
          : "Showing: All Voters";
    }
  };

  // Update filters when vote status changes
  useEffect(() => {
    setFilteredVotersList(votersList);
  }, [votersList]);

  useEffect(() => {
    // When religion changes, fetch castes and reset dependent values
    if (selectedReligion) {
      const religionId = religions.find(
        (r) => r.religionName === selectedReligion
      )?.key;
      if (religionId) {
        fetchCastesData(parseInt(religionId));
      }
    } else {
      setCastes([]);
    }
    setSelectedCaste(null);
    setSelectedSubcaste(null);
  }, [selectedReligion]);

  useEffect(() => {
    // When caste changes, fetch subcastes and reset dependent value
    if (selectedCaste) {
      const casteId = castes.find((c) => c.casteName === selectedCaste)?.key;
      if (casteId) {
        fetchSubCastesData(parseInt(casteId));
      }
    } else {
      setSubCastes([]);
    }
    setSelectedSubcaste(null);
  }, [selectedCaste]);

  // Optimized vote handling
  const handleVote = useCallback(
    async (voterId, currentStatus) => {
      const newStatus = !currentStatus;
      const votedTimeStamp = newStatus ? new Date().toISOString() : null;

      try {
        await markVoterAsVoted(selectedElectionId, voterId, {
          hasVoted: newStatus,
          votedTimeStamp,
        });

        // Update local state instead of refetching
        setVotersList((prevList) =>
          prevList.map((voter) =>
            voter.epic_number === voterId
              ? { ...voter, hasVoted: newStatus, votedTimeStamp }
              : voter
          )
        );

        message.success(
          `Voter marked as ${newStatus ? "voted" : "not voted"} successfully`
        );
      } catch (error) {
        console.error("Error in handleVote:", error);
        message.error(error?.message || "Failed to update voter status");

        // Refresh the data in case of error
        await fetchVoters(currentPage, pageSize);
      }
    },
    [selectedElectionId, currentPage, pageSize]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery(""); // Clear the search query
    setCurrentPage(0); // Reset to first page
    fetchVoters(0, pageSize, {
      // Fetch fresh data without search filters
      boothNumber: selectedBoothNumber.includes("ALL")
        ? []
        : selectedBoothNumber,
    });
  }, [pageSize, selectedBoothNumber, fetchVoters]);

  const handleSearch = () => {
    const newQuery = searchQuery.trim();
    setCurrentPage(0);
    if (newQuery) {
      fetchVotersBySearch(newQuery);
    } else {
      fetchVoters(0, pageSize, {
        boothNumber: selectedBoothNumber.includes("ALL")
          ? []
          : selectedBoothNumber,
      });
    }
    handleClear();
  };

  // Handle pagination
  const handlePageChange = (page: number, pageSize: number) => {
    fetchVoters(page - 1, pageSize, {
      boothNumber: selectedBoothNumber.includes("ALL")
        ? []
        : selectedBoothNumber,
      gender: selectedGender,
      minAge: ageRange[0],
      maxAge: ageRange[1],
      includeUnknownAge,
      hasMobileNo: hasMobileNumber,
      hasWhatsappNo: hasWhatsappNumber,
      religion: selectedReligion,
      casteName: selectedCaste,
      subcaste: selectedSubcaste,
      casteCategoryName: selectedCasteCategory,
      party: selectedParty,
      voterHistoryName: selectedHistory,
      categoryDescription: selectedCategory,
      sortBy,
      pollStatus: selectedVoteStatus,
      order,
    });
  };

  const handleViewVoter = useCallback((voter) => {
    setViewingVoter(voter);
    setIsViewModalVisible(true);
  }, []);

  const handleVoteStatusChange = useCallback((checkedValues) => {
    setSelectedVoteStatus(checkedValues);
  }, []);

  const handleBoothChange = async (selectedValues: any) => {
    let updatedSelection = Array.isArray(selectedValues)
      ? [...selectedValues]
      : [];
    const lastSelectedBooth = updatedSelection[updatedSelection.length - 1];

    if (lastSelectedBooth === "ALL") {
      updatedSelection = ["ALL"];
    } else if (selectedBoothNumber.includes("ALL")) {
      updatedSelection = updatedSelection.filter((booth) => booth !== "ALL");
    }
    setSelectedBoothNumber(updatedSelection);

    const boothFilter =
      updatedSelection.includes("ALL") || updatedSelection.length === 0
        ? []
        : updatedSelection;

    setCurrentPage(0);
    fetchVoters(0, pageSize, { boothNumber: boothFilter });
  };

  const {
    showExportModal,
    showPdfExcelExportModal,
    isExportInProgress,
  } = useExport();

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="export"
        icon={
          isExportInProgress ? <LoadingOutlined spin /> : <DownloadOutlined />
        }
        disabled={isExportInProgress}
        onClick={() => {
          // Collect all current filter values
          let pollStatusValue: boolean | null = null;
          if (selectedVoteStatus.length === 1) {
            pollStatusValue = selectedVoteStatus[0] === "Voted";
          }

          const filters: VoterFilters = {
            gender: selectedGender,
            minAge: ageRange[0],
            maxAge: ageRange[1],
            includeUnknownAge: includeUnknownAge,
            religion: selectedReligion ? [selectedReligion] : [],
            casteName: selectedCaste ? [selectedCaste] : [],
            subcaste: selectedSubcaste ? [selectedSubcaste] : [],
            casteCategoryName: selectedCasteCategory ? [selectedCasteCategory] : [],
            party: selectedParty ? [selectedParty] : [],
            voterHistoryName: selectedHistory ? [selectedHistory] : [],
            categoryDescription: selectedCategory ? [selectedCategory] : [],
            pollStatus: pollStatusValue !== null ? [pollStatusValue.toString()] : [],
            hasMobileNo: hasMobileNumber || undefined,
            hasWhatsappNo: hasWhatsappNumber || undefined,
            schemeId: selectedSchemeId,
          };
          console.log("filters before cleaning", filters);

          // Remove undefined/null/empty values
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

          console.log("Exporting with filters", filters);

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
    </Menu>
  );

  const filterMenu = (
    //  = useMemo(
    //   () => (
    <div
      className="bg-[#f9f9f9] rounded-lg shadow-[0_4px_8px_rgba(0,0,0,0.1)] w-[350px] flex flex-col"
      style={{ maxHeight: "400px" }}
    >
      {" "}
      <div className="flex-1 overflow-y-auto p-4 pb-0 bg-[#f9f9f9]">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div>
              <span className="block mb-2 font-medium">Vote Status:</span>
              <Checkbox.Group
                options={["Voted", "Not Voted"]}
                value={selectedVoteStatus}
                onChange={handleVoteStatusChange}
              />
            </div>
            <div className="mt-4">
              <span className="block mb-2 font-medium">Gender:</span>
              <Checkbox.Group
                options={["Male", "Female", "Other"]}
                value={selectedGender}
                onChange={(values) => setSelectedGender(values)}
              />
            </div>
            <div className="mt-4">
              <span className="block mb-2 font-medium">Contact Details:</span>
              <Space direction="vertical" size={8}>
                <Checkbox
                  checked={hasMobileNumber}
                  onChange={(e) => setHasMobileNumber(e.target.checked)}
                >
                  Mobile Number
                </Checkbox>
                <Checkbox
                  checked={hasWhatsappNumber}
                  onChange={(e) => setHasWhatsappNumber(e.target.checked)}
                >
                  WhatsApp Number
                </Checkbox>
              </Space>
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
                placeholder={
                  selectedReligion ? "Select Caste" : "Select Religion first"
                }
                className="w-full"
                value={selectedCaste}
                onChange={(value) => setSelectedCaste(value)}
                disabled={!selectedReligion}
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
                placeholder={
                  selectedCaste ? "Select Subcaste" : "Select Caste first"
                }
                className="w-full"
                value={selectedSubcaste}
                onChange={(value) => setSelectedSubcaste(value)}
                disabled={!selectedCaste}
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

            {/* Scheme Filter */}
            <div className="mt-4">
              <span className="block mb-2 font-medium">Scheme:</span>
              <Select
                placeholder="Select Scheme"
                className="w-full"
                value={selectedSchemeId}
                onChange={(value) => setSelectedSchemeId(value)}
                allowClear
              >
                {schemes?.map((s) => (
                  <Option key={s.key} value={s.key}>
                    {s.schemeName}
                  </Option>
                ))}
              </Select>
            </div>
          </>
        )}
        <div className="sticky bottom-0 mt-4 bg-white border-t border-gray-200 z-10 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] backdrop-blur-sm">
          <div className="p-4">
            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                onClick={handleApply}
                block
                className="h-[40px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[14px] font-semibold hover:!bg-[#1D4ED8] hover:!border-[#1D4ED8]"
              >
                Apply Filters
              </Button>
              <Button
                onClick={handleClear}
                block
                className="h-[40px] bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300 hover:border-gray-400"
              >
                Clear All Filters
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </div>
  );
  //   ),
  //   [selectedVoteStatus, handleVoteStatusChange,]
  // );

  return (
    <div className="w-full h-full p-10">
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={24}>
          <div className="flex items-center gap-4">
            <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
              Poll Day Manager
            </h3>
            {(statusFilter || selectedVoteStatus.length > 0) && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {getStatusFilterText()}
              </span>
            )}
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="w-full mt-10">
        {/* Booth Number Selection */}
        <Col span={6}>
          <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
            Choose Booth Number
          </label>
          <Select
            mode="multiple"
            placeholder="Choose Booth number"
            className="w-full h-[45px] custom-select"
            onChange={handleBoothChange}
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

        {/* Voter Search Input and Clear Button */}
        <Col span={10}>
          <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
            Search Voter
          </label>
          <div className="flex gap-2">
            {/* Search Box */}
            <div className="flex items-center gap-2 bg-[#f5f5f5] border border-gray-300 rounded-lg px-3 h-[45px] flex-grow">
              <Input
                placeholder="Search Voter"
                className="bg-[#f5f5f5] border-none focus:ring-0 focus:outline-none shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
                style={{
                  backgroundColor: "#f5f5f5",
                  boxShadow: "none",
                  border: "none",
                }}
              />
              <Button
                type="primary"
                icon={<SearchOutlined style={{ color: "#fff" }} />}
                className="h-8 w-8 bg-[#1D4ED8] border-none"
                onClick={handleSearch}
              />
            </div>

            {/* Clear Button */}
            <Button
              type="default"
              className="h-[45px] px-4"
              onClick={() => {
                setSearchQuery("");
                handleClearSearch();
              }}
            >
              Clear
            </Button>
          </div>
        </Col>

        {/* Actions and Filter Dropdowns */}
        <Col span={8} className="flex justify-end items-end gap-2">
          <Dropdown overlay={actionsMenu} trigger={["click"]}>
            <Button
              type="primary"
              className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
        hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8]
        hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
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
              className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
        hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8]
        hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            >
              Filter <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>
      <Row className="mt-6">
        <Col span={24}>
          <div className="w-full flex justify-between items-center bg-[#F3F4F6] px-6 py-3 rounded-lg border border-gray-300 shadow-sm">
            <span className="text-[16px] font-semibold text-[#1F2937]">
              Total Vote:{" "}
              <span className="text-[#2563EB]">{stats.totalVote}</span> | Voted:{" "}
              <span className="text-[#2563EB]">{stats.voted}</span> | Not Voted:{" "}
              <span className="text-[#2563EB]">{stats.notVoted}</span> | % of
              Turnout:{" "}
              <span className="text-[#059669]">{stats.percentOfTurnout}</span>
            </span>
          </div>
        </Col>
      </Row>

      <Row className="mt-10">
        <Col span={24}>
          <VotersTable
            votersList={filteredVotersList}
            onViewVoter={handleViewVoter}
            onVote={handleVote}
            currentPage={currentPage}
            pageSize={pageSize}
            totalElements={totalElements}
            onPageChange={handlePageChange}
          />
        </Col>
      </Row>

      {viewingVoter && (
        <ViewVoterModal
          visible={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          voter={viewingVoter}
          onVote={handleVote}
        />
      )}
    </div>
  );
}
