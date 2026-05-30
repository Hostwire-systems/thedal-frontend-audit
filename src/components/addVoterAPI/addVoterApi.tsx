import React, { useState, useEffect } from "react";
import { UploadFile } from "antd/es/upload/interface";
import {
  Col,
  Row,
  Input,
  Button,
  Spin,
  message,
  Modal,
  Form,
  Select,
  DatePicker,
  Upload,
  Collapse,
  Radio,
} from "antd";
import ImgCrop from "antd-img-crop";
import type { RcFile } from "antd/es/upload/interface";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import {
  SearchOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLoading } from "../../context/LoadingContext";
import moment from "moment";
import { RootState } from "../../redux/store";

// Import API functions
import { indianStates as stateOptions } from "../../pages/welcome/step3/Step3";
import { getVoterDetailsFromThirdPartyApi } from "../../api/voterApi";
import { fetchReligion, addReligion } from "../../api/religionApi";
import { fetchCaste, addCaste } from "../../api/casteApi";
import { fetchSubCaste, addSubCaste } from "../../api/subCasteApi";
import { fetchParties, addParty } from "../../api/partyApi";
import RuralLocalBodyPanel from "./RuralLocalBodyPanel";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";
import AddSchemeModal from "../../components/addVoterForm/AddSchemeModal";
import { getAvailabilityApi } from "../../api/availabilityApi";
import AddAvailabilityModal from "../../components/addVoterForm/AddAvailabilityModal";
import PCACInfoPanel from "../../components/editVoterForm/panels/PCACInfoPanel";
import StateAndDistrictPanel from "./StateAndDistrictPanel";
import UrbanLocalBodyInfoPanel from "../../components/editVoterForm/panels/UrbanLocalBodyInfoPanel";
import {
  renderReligionDropdown,
  renderCasteDropdown,
  renderSubCasteDropdown,
  renderPartyDropdown,
  // renderSchemeDropdown,
  renderAvailabilityDropdown,
  renderLanguageDropdown,
  renderHistoryDropdown,
  renderFeedbackDropdown,
  renderCasteCategoryDropdown,
  SchemeDropdown,
} from "../addVoterForm/RenderDropdowns";
import ElectionCommissionDataPanel from "../../components/editVoterForm/panels/ElectionCommissionDataPanel";
import { getLanguagesApi } from "../../api/languageApi";
import AddLanguageModal from "../../components/addVoterForm/AddLanguageModal";
import { getPartsApi } from "../../api/partApi";
import { getSectionsApi } from "../../api/sectionApi";
import { fetchHistory } from "../../api/historyApi";
import { VoterHistory } from "../../types/history";
import { BenefitScheme } from "../../pages/BenefitScheme/BenefitScheme";
import { FeedbackType } from "../../types/feedback";
import { getFeedbackApi } from "../../api/feedbackApi";
import AddFeedbackModal from "../../components/addVoterForm/AddFeedbackModal";
import AddHistoryModal from "../../components/addVoterForm/AddHistoryModal";
import { fetchCasteCategories } from "../../api/casteCategoryApi";
import { CasteCategory } from "../../types/casteCategory";
import AddCasteCategoryModal from "../../components/addVoterForm/AddCasteCategoryModal";

const { Option } = Select;
const { Panel } = Collapse;

const spinIcon = (
  <LoadingOutlined style={{ fontSize: 14, color: "black" }} spin />
);

interface Religion {
  key: string;
  religionName: string;
}

interface Caste {
  key: string;
  casteName: string;
  religionId: number;
}

interface SubCaste {
  key: string;
  subCasteName: string;
  casteName: string;
  religionName: string;
}

interface Party {
  key: string;
  partyName: string;
  partyImage: string; // Image URL or Base64 encoded image
}

export interface PartData {
  partNo: string;
  partNameEnglish: string;
  partNameL1: string;
  partNameL2?: string;
  pincode: string;
  schoolName: string;
  partLat: string;
  partLong: string;
}

export interface SectionData {
  id: number;
  partNo: string;
  sectionNo: string;
  sectionNameEn: string;
  sectionNameL1: string;
}

interface AddVoterAPIProps {
  onFinish: (data: any) => void;
  isStandalone?: boolean;
}

export default function AddVoterAPI({
  onFinish,
  isStandalone = false,
}: AddVoterAPIProps) {
  const [loadingForm, setLoadingForm] = useState(false);
  const [epicNumber, setEpicNumber] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [voterDetails, setVoterDetails] = useState<any>(null);
  const [isDataFetched, setIsDataFetched] = useState<boolean>(false);
  const [selectedElectionDetails, setSelectedElectionDetails]: any = useState(
    {}
  );
  const [latError, setLatError] = useState("");
  const [lngError, setLngError] = useState("");

  const [showForm, setShowForm] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [modalCasteForm] = Form.useForm();
  const [modalSubCasteForm] = Form.useForm();
  const [modalPartyForm] = Form.useForm();

  //states for scheme
  const [schemes, setSchemes] = useState<BenefitScheme[]>([]);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [newSchemeId, setNewSchemeId] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

  //voter image
  const [voterImage, setVoterImage] = useState<RcFile | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // States for religion, caste dynamic data
  const [religions, setReligions] = useState<Religion[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [casteCategories, setCasteCategories] = useState<CasteCategory[]>([]);
  const [religionId, setReligionId] = useState<string | undefined>(undefined);
  const [selectedReligion, setSelectedReligion] = useState<string>("");

  // States for adding new religion/caste
  const [isReligionModalVisible, setIsReligionModalVisible] = useState(false);
  const [isCasteModalVisible, setIsCasteModalVisible] = useState(false);
  const [religionFileList, setReligionFileList] = useState<any[]>([]);

  const [newReligionName, setNewReligionName] = useState("");
  const [newCasteName, setNewCasteName] = useState("");
  const [selectedReligionForCaste, setSelectedReligionForCaste] = useState<
    string | null
  >(null);
  const [casteId, setCasteId] = useState<string | undefined>(undefined);
  const [casteName, setCasteName] = useState<string | undefined>(undefined);
  const [selectedCaste, setSelectedCaste] = useState<string>("");

  const [subCasteId, setSubCasteId] = useState<string | undefined>(undefined);
  const [subCastes, setSubCastes] = useState<SubCaste[]>([]);
  const [selectedSubCaste, setSelectedSubCaste] = useState<string>("");

  const [selectedSubCasteReligionId, setSelectedSubCasteReligionId] = useState<
    number | undefined
  >(undefined);
  const [selectedSubCasteCasteId, setSelectedSubCasteCasteId] = useState<
    number | undefined
  >(undefined);
  const [isSubCasteModalVisible, setIsSubCasteModalVisible] = useState(false);
  const [newSubCasteName, setNewSubCasteName] = useState("");

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [isPartyModalVisible, setIsPartyModalVisible] =
    useState<boolean>(false);
  const [addedPartyKey, setAddedPartyKey] = useState<string | null>(null); // To track the last added party
  const [newPartyName, setNewPartyName] = useState("");
  const [partyFileList, setPartyFileList] = useState<any[]>([]);

  const [newPartyShortName, setNewPartyShortName] = useState("");

  //availability variables
  const [availabilities, setAvailabilities] = useState([]);
  const [newAvailabilityId, setNewAvailabilityId] = useState(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);

  //language variables
  const [languages, setLanguages] = useState([]);
  const [newLanguageId, setNewLanguageId] = useState(null);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  // feedback variables
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] =
    useState<boolean>(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [newFeedbackId, setNewFeedbackId] = useState(null);

  // history variables
  const [isHistoryModalVisible, setIsHistoryModalVisible] =
    useState<boolean>(false);
  const [newHistoryId, setNewHistoryId] = useState(null);
  const [histories, setHistories] = useState<VoterHistory[]>([]);

  //part and section variables
  const [parts, setParts] = useState<PartData[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [newCasteCategoryId, setNewCasteCategoryId] = useState(null);

  const { loading, setLoading } = useLoading();
  const [activeKey, setActiveKey] = useState<string[]>([]);

  const location = useLocation();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );
  const electionId = location.state?.electionId || selectedElectionId;

  const handleGetVoterDetails = async () => {
    if (!epicNumber.trim()) {
      message.error("Please enter EPIC number");
      return;
    }

    setIsDataFetched(false);
    setIsSearching(true);

    try {
      const response = await getVoterDetailsFromThirdPartyApi(
        { epicNumber: epicNumber.trim() },
        setIsSearching
      );

      if (response && response.length > 0) {
        setVoterDetails(response[0].content);
        setIsDataFetched(true);
      } else {
        message.warning("No voter details found");
      }
    } catch (error) {
      message.error("Failed to fetch voter details");
      setIsSearching(false);
    }
  };

  const handlePreview = async (file) => {
    if (!file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e?.target.result);
        reader.readAsDataURL(file.originFileObj);
      });
    }
    Modal.info({
      title: "Preview",
      content: (
        <img alt="file preview" style={{ width: "100%" }} src={file.preview} />
      ),
      onOk() {},
    });
  };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleVoterImageUpload = (file: RcFile) => {
    setVoterImage(file);
    return false; // Prevent auto upload
  };

  const validateImageBeforeCrop = (file: RcFile) => {
    const isValidType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg";

    const isSizeValid = file.size / 1024 / 1024 < 1;

    if (!isValidType) {
      message.error("Only JPG, JPEG, or PNG files are allowed!");
      return false;
    }

    if (!isSizeValid) {
      message.error("File size must be less than 1MB!");
      return false;
    }

    return true;
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    const filteredList = newFileList.filter((file: any) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg";
      const isSizeValid = file.size / 1024 / 1024 < 1;

      if (!isValidType) {
        message.error("Only JPG, JPEG, or PNG files are allowed!");
        return false;
      }
      if (!isSizeValid) {
        message.error("File size must be less than 1MB!");
        return false;
      }
      return true;
    });
    setFileList(filteredList);
  };

  const handleOpenForm = () => {
    if (!voterDetails) {
      message.error("No voter details available");
      return;
    }
    console.log("voterDetails", voterDetails);

    const [latitude, longitude] = (voterDetails.partLatLong || "0,0")
      .split(",")
      .map(Number);
    const [rlnFnameEn = "", rlnLnameEn = ""] =
      voterDetails?.relationName?.trim()?.split(" ").filter(Boolean) || [];

    const [rlnFnameL1 = "", rlnLnameL1 = ""] =
      voterDetails?.relationNameL1?.trim()?.split(" ").filter(Boolean) || [];

    const [rlnFnameL2 = "", rlnLnameL2 = ""] =
      voterDetails?.relationNameL2?.trim()?.split(" ").filter(Boolean) || [];

    let dateOfBirth = null;
    if (voterDetails.birthYear) {
      dateOfBirth = moment(`${voterDetails.birthYear}-01-01`);
    } else if (voterDetails.age) {
      const currentYear = new Date().getFullYear();
      dateOfBirth = moment(`${currentYear - voterDetails.age}-01-01`);
    }

    // Pre-fill form
    form.setFieldsValue({
      boothNumber: parseInt(voterDetails.partNumber) || null,
      epic_number: voterDetails.epicNumber || "",
      voterFnameEn: voterDetails.applicantFirstName || "",
      voterLnameEn:
        voterDetails.applicantLastName === "-"
          ? ""
          : voterDetails.applicantLastName || "",
      voterFnameL1:
        voterDetails.applicantFirstNameL1 === "-"
          ? ""
          : voterDetails.applicantFirstNameL1 || "",
      voterLnameL1:
        voterDetails.applicantLastNameL1 === "-"
          ? ""
          : voterDetails.applicantLastNameL1 || "",
      voterFnameL2:
        voterDetails.applicantFirstNameL2 === "-"
          ? ""
          : voterDetails.applicantFirstNameL2 || "",
      voterLnameL2:
        voterDetails.applicantLastNameL2 === "-"
          ? ""
          : voterDetails.applicantLastNameL2 || "",
      houseNoEn: voterDetails.houseNoEn || null,
      houseNoL1: voterDetails.houseNoEn || null,
      houseNoL2: voterDetails.houseNoEn || null,
      gender:
        voterDetails.gender === "M"
          ? "male"
          : voterDetails.gender === "F"
          ? "female"
          : "other",
      dateOfBirth: dateOfBirth || null,
      age: voterDetails?.age || null,
      voterLatitude: "",
      voterLongitude: "",
      // street: voterDetails.psbuildingName || "",
      fullAddress: voterDetails?.fullAddress || "",
      city: voterDetails?.districtValue || "",
      state: voterDetails?.stateName || voterDetails?.state || "",
      pincode: "",
      availability: "Available",
      partyAffiliation: "Independent",
      localBody: voterDetails?.localBody || "",

      //state
      stateCode: voterDetails?.stateCd || "",
      // stateNameEn: voterDetails?.stateName || "",
      // stateNameL1: voterDetails?.stateNameL1 || "",
      // stateNameL2: voterDetails?.stateNameL2 || "",

      //parliament
      pcNo: voterDetails?.prlmntNo || "",
      pcNameEn: voterDetails?.prlmntName || "",
      pcNameL1: voterDetails?.prlmntNameL1 || "",
      pcNameL2: voterDetails?.prlmntNameL2 || "",

      //assembly
      acNo: voterDetails?.acNumber || "",
      acNameEn: voterDetails?.asmblyName || "",
      acNameL1: voterDetails?.asmblyNameL1 || "",
      acNameL2: voterDetails?.asmblyNameL2 || "",

      //section
      sectionNo: voterDetails?.sectionNo || "",
      sectionNameEn: voterDetails?.sectionName || "",
      serialNo: voterDetails?.serialNumber || "",

      //relation
      rlnFnameEn: rlnFnameEn || "",
      rlnLnameEn: rlnLnameEn || "",
      rlnFnameL1: rlnFnameL1 || "",
      rlnFnameL2: rlnFnameL2 || "",
      rlnLnameL1: rlnLnameL1 || "",
      rlnLnameL2: rlnLnameL2 || "",
      rlnType: voterDetails?.relationType || "",

      //urban
      urbanNameEn: voterDetails?.urbanName || "",
      urbanNo: voterDetails?.urbanNo || "",
      urbanNameL1: voterDetails?.urbanNameL1 || "",
      urbanNameL2: voterDetails?.urbanNameL2 || "",
      urbanWardNo: voterDetails?.urbanWardNo || "",

      //district
      districtCode: voterDetails?.districtCode || "",
      districtNameEn: voterDetails?.districtValue || "",
      districtNameL1: voterDetails?.districtValueL1 || "",
      districtNameL2: voterDetails?.districtValueL2 || "",
      districtUnionNameEn: voterDetails?.districtUnionValue || "",
      districtUnionNameL1: voterDetails?.districtUnionValueL1 || "",
      districtUnionNameL2: voterDetails?.districtUnionValueL2 || "",
      districtUnionWardNo: voterDetails?.districtUnionValueNo || "",

      //panchayat
      panUnionNo: voterDetails.rurPanchayatUnionNo || "",
      panUnionNameEn: voterDetails?.panchayatUnionName || "",
      panUnionNameL1: voterDetails?.panchayatUnionNameL1 || "",
      panUnionNameL2: voterDetails?.panchayatUnionNameL2 || "",
      panUnionWardNo: voterDetails?.panchayatUnionWardNo || "",

      //village
      villPanNameEn: voterDetails?.villagePanchayatName || "",
      villPanNameL1: voterDetails?.villagePanchayatNameL1 || "",
      villPanNameL2: voterDetails?.villagePanchayatNameL2 || "",
      villPanWardNo: voterDetails?.villagePanchayatWardNo || "",

      //part
      partNo: voterDetails?.partNumber || "",
      partNameEn: voterDetails?.partName || "",
      partNameL1: voterDetails?.partNameL1 || "",
      partLatLong: voterDetails?.partLatLong || "",
      partLati: voterDetails?.partLat || "",
      partLong: voterDetails?.partLong || "",
      partSerialNumber: voterDetails?.partSerialNumber || "",
      latitude: latitude ? latitude.toString() : 0,
      longitude: longitude ? longitude.toString() : 0, //Values for booth co-ordinates
    });
    console.log("form", form);
    setShowForm(true);
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);

    if (!navigator.geolocation) {
      message.error("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      form.setFieldsValue({
        latitude: lat.toString(),
        longitude: lng.toString(),
      });

      message.success("Location detected successfully");
    } catch (error) {
      console.error("Location detection error:", error);
      message.error(
        "Failed to detect location. Please enter coordinates manually"
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const validateDecimalPlaces = (value, min, max, setError) => {
    if (!value) {
      setError("");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return;
    }

    if (numValue < min || numValue > max) {
      setError(`Value must be between ${min} and ${max}`);
      return;
    }

    // Check decimal places (max 6)
    if (value.includes(".")) {
      const [, decimalPart] = value.split(".");
      if (decimalPart?.length > 6) {
        setError("Maximum 6 decimal places allowed");
        return;
      }
    }

    setError("");
  };

  const SchemeTagRender = (props: any) => {
    const { label, value, closable, onClose } = props;

    return null;
  };

  const fetchSchemeData = async () => {
    setLoading(true);
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      const schemeData = response.data
        ?.map((scheme) => ({
          ...scheme,
          key: scheme.id,
          orderIndex: scheme.orderIndex,
        }))
        .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex);
      setSchemes(schemeData);
    } catch (error) {
      console.log("Error fetching benefit schemes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeAdded = async (createdSchemeId) => {
    setNewSchemeId(createdSchemeId); // Set the ID of the newly added scheme
    await fetchSchemeData();
  };
  const [isCasteCategoryModalVisible, setIsCasteCategoryModalVisible] =
    useState<boolean>(false);

  const handleCasteCategoryAdded = async (createdCasteCategoryId) => {
    setNewCasteCategoryId(createdCasteCategoryId); // Set the ID of the newly added caste category
    await fetchCasteCategoryData();
  };

  const handleAvailabilityAdded = async (createdAvailabilityId) => {
    setNewAvailabilityId(createdAvailabilityId);
    await fetchAvailabilityData();
  };
  const handleLanguageAdded = async (createdLanguageId) => {
    setNewLanguageId(createdLanguageId);
    await fetchLanguageData();
  };
  // ADD FEEDBACK
  const handleFeedbackAdded = async (createdFeedbackId) => {
    setNewFeedbackId(createdFeedbackId);
    await fetchFeedbackData();
  };

  // ADD HISTORY
  const handleHistoryAdded = async (createdHistoryId) => {
    setNewHistoryId(createdHistoryId);
    await fetchHistoryData();
  };

  const fetchPartData = async (): Promise<void> => {
    if (!selectedElectionId) return;
    try {
      setLoading(true);
      const response = await getPartsApi(parseInt(selectedElectionId));
      let validParts = Array.isArray(response.data) ? response.data : [];
      validParts.sort(
        (a, b) => Number(a.partNo.trim()) - Number(b.partNo.trim())
      );
      setParts(validParts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionData = async () => {
    if (!selectedElectionId) return;
    try {
      setLoading(true);
      const response = await getSectionsApi(parseInt(selectedElectionId));
      console.log(response);
      const validSections = Array.isArray(response.data?.data)
        ? response.data?.data
        : [];
      validSections?.sort((a, b) => a.sectionNo - b.sectionNo);
      setSections(validSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilityData = async () => {
    setLoading(true);
    try {
      const response = await getAvailabilityApi(parseInt(selectedElectionId));
      setAvailabilities(
        response.data
          ?.map(
            ({
              id,
              categoryName,
              availabilityImage,
              description,
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
          .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex)
      );
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    } finally {
      setLoading(false);
    }
  };

  // fetch language data
  const fetchLanguageData = async () => {
    setLoading(true);
    try {
      const response = await getLanguagesApi(parseInt(selectedElectionId));
      const languageData = response.data
        ?.map((lang: any) => ({
          key: lang.id,
          orderIndex: lang.orderIndex,
          languageName: lang.languageName,
        }))
        .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex);
      setLanguages(languageData);
    } catch (error) {
      //message.error('Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  // fetch history data
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
          .sort((a, b) => a.orderIndex - b.orderIndex) || [];
      setHistories(fetchedHistories);
    } catch (error) {
      console.error("Error fetching histories: ", error);
      setHistories([]);
    }
  };

  //fetch feedback data
  const fetchFeedbackData = async () => {
    try {
      const response = await getFeedbackApi(parseInt(selectedElectionId));
      const feedbackData = response.data.map((feedback: any) => ({
        key: feedback.id.toString(),
        id: feedback.id,
        issueName: feedback.issueName,
      }));
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error("Failed to fetch feedbacks", error);
    } finally {
    }
  };

  const fetchReligionData = async (newReligionName?: string) => {
    try {
      const response = await fetchReligion(parseInt(selectedElectionId));
      const fetchedReligions =
        response?.data?.data
          ?.map((religion: any) => ({
            key: religion.religionId,
            religionName: religion.religionName,
            orderIndex: religion.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex) || [];
      console.log("fetchedReligions", fetchedReligions);
      setReligions(fetchedReligions);
      if (newReligionName) {
        const newlyAddedReligion = fetchedReligions?.find(
          (religion) => religion.religionName === newReligionName
        );
        if (newlyAddedReligion) {
          setSelectedReligion(newReligionName);
          setReligionId(newlyAddedReligion.key);
          form.setFieldsValue({
            religion: newlyAddedReligion.religionName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching religions: ", error);
    }
  };

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
            orderIndex: caste.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex) || [];
      console.log("fetchedCastes", fetchedCastes);
      setCastes(fetchedCastes);
      if (newCasteName) {
        const newlyAddedCaste = fetchedCastes?.find(
          (caste) => caste.casteName === newCasteName
        );
        if (newlyAddedCaste) {
          setSelectedCaste(newCasteName);
          setCasteId(newlyAddedCaste.key);
          form.setFieldsValue({
            caste: newlyAddedCaste.casteName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching castes: ", error);
    }
  };

  //fetch caste category data
  const fetchCasteCategoryData = async () => {
    try {
      const response = await fetchCasteCategories(parseInt(selectedElectionId));
      const fetchedCasteCategories =
        response?.data
          ?.map((caste: any) => ({
            key: caste.casteCategoryId,
            orderIndex: caste.orderIndex,
            id: caste.casteCategoryId,
            casteCategoryName: caste.casteCategoryName,
          }))
          .sort(
            (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
          ) || [];
      console.log("fetchedCasteCategories", fetchedCasteCategories);
      setCasteCategories(fetchedCasteCategories);
    } catch (error) {
      console.error("Error fetching caste categories: ", error);
      setCasteCategories([]);
    }
  };

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
          .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex) || [];
      console.log("fetchedSubCastes", fetchedSubCastes);
      setSubCastes(fetchedSubCastes);
      if (newSubCasteName) {
        const newlyAddedSubCaste = fetchedSubCastes?.find(
          (subcaste) => subcaste.subCasteName === newSubCasteName
        );
        if (newlyAddedSubCaste) {
          setSelectedSubCaste(newSubCasteName);
          setSubCasteId(newlyAddedSubCaste.key);
          form.setFieldsValue({
            sub_caste: newlyAddedSubCaste.subCasteName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching sub-castes: ", error);
    }
  };

  const getReligionId = (religionName: string) => {
    if (religionName) {
      const religion = religions?.find((r) => r.religionName === religionName);
      return religion?.key;
    }
    return undefined;
  };

  const getCasteId = (casteName: string) => {
    if (casteName) {
      const caste = castes?.find((c) => c.casteName === casteName);
      return caste?.key;
    }
    return undefined;
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const dobDate = dob.toDate();
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();

    const hasBirthdayPassed =
      today.getMonth() > dobDate.getMonth() ||
      (today.getMonth() === dobDate.getMonth() &&
        today.getDate() >= dobDate.getDate());

    if (!hasBirthdayPassed) {
      age--;
    }

    return age;
  };

  const fetchPartyData = async () => {
    try {
      const response = await fetchParties(electionId); // Fetch parties
      setLoading(true);
      const fetchedParties =
        response?.data
          ?.map((party: any) => ({
            key: party.id,
            partyName: party.partyName,
            partyImage: party.partyImage,
            orderIndex: party.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.ordrerIndex) || [];
      setParties(fetchedParties);
      if (newPartyName) {
        const newlyAddedParty = fetchedParties.find(
          (party) => party.partyName === newPartyName
        );
        if (newlyAddedParty) {
          setAddedPartyKey(newlyAddedParty.key);
          form.setFieldsValue({
            partyAffiliation: newlyAddedParty.partyName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching parties: ", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a party
  const handlePartyAdd = async () => {
    setLoadingForm(true);
    const file = partyFileList[0]?.originFileObj;

    if (newPartyName.trim() && file) {
      try {
        const response = await addParty(
          electionId,
          newPartyName,
          newPartyShortName,
          file
        ); // Add party with image
        const newParty = {
          key: response?.data.id,
          partyName: response?.data.partyName,
          partyShortName: response?.data.partyShortName,
          partyImage: response?.data.partyImage,
        };
        fetchPartyData(); // Refresh parties list
        setNewPartyName("");
        setPartyFileList([]); // Reset image
        modalPartyForm.resetFields();

        setIsPartyModalVisible(false);
      } catch (error) {
        console.error("Error adding party: ", error);
      } finally {
        setLoadingForm(false);
      }
    } else {
      message.error("Party name and image are required.");
    }
  };

  const handleFinishFailed = ({ errorFields }) => {
    if (errorFields && errorFields.length > 0) {
      form.scrollToField(errorFields[0].name, {
        behavior: "smooth",
      });
    }
  };

  const clearDependentFields = () => {
    form.setFieldsValue({
      partNameEn: undefined,
      partNameL1: undefined,
      pincode: undefined,
      partLati: undefined,
      partLong: undefined,
    });
  };

  const handleBoothChange = (value: number | string | null) => {
    if (value === null || value === "") {
      clearDependentFields();
    }

    const selectedPart = parts.find((part) => part.partNo === value);

    if (selectedPart) {
      form.setFieldsValue({
        partNameEn: selectedPart.partNameEnglish || "",
        partNameL1: selectedPart.partNameL1 || "",
        pincode: selectedPart.pincode || "",
        partLati: selectedPart.partLat || "",
        partLong: selectedPart.partLong || "",
      });
    } else {
      // Clear fields when custom/new part number is entered
      clearDependentFields();
    }
  };

  const handleSectionChange = (value: number | string | null) => {
    // Handle clear/removal case
    if (value === null || value === "") {
      form.setFieldsValue({
        sectionNameEn: undefined,
        sectionNameL1: undefined,
      });
      return;
    }

    const selectedSection = sections.find(
      (section) => section.sectionNo.toString() === value.toString()
    );

    if (selectedSection) {
      form.setFieldsValue({
        sectionNameEn: selectedSection.sectionNameEn || "",
        sectionNameL1: selectedSection.sectionNameL1 || "",
      });
    } else {
      // Clear fields when custom/new section number is entered
      form.setFieldsValue({
        sectionNameEn: undefined,
        sectionNameL1: undefined,
      });
    }
  };

  const handleFormSubmit = async (values) => {
    const formValues = form.getFieldsValue();
    const { voterLatitude, voterLongitude } = formValues;

    const relId = getReligionId(values.religion);
    const cId = getCasteId(values.caste);

    const relationName = [
      values.rlnFnameEn?.trim() || "",
      values.rlnLnameEn?.trim() || "",
    ]
      .filter(Boolean)
      .join(" ");
    const relationNameL1 = [
      values.rlnFnameL1?.trim() || "",
      values.rlnLnameL2?.trim() || "",
    ]
      .filter(Boolean)
      .join(" ");

    const latitude = formValues.latitude ? parseFloat(formValues.latitude) : 0;
    const longitude = formValues.longitude
      ? parseFloat(formValues.longitude)
      : 0;

    const dob = values.dateOfBirth
      ? values.dateOfBirth.format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");
    const age = calculateAge(values.dateOfBirth);

    let languageData = values.language || "";
    let languageId = null;

    if (values.language) {
      if (typeof values.language === "object") {
        // If it's an object, extract its name & ID
        languageData =
          values.language.languageName ||
          values.language.name ||
          values.language.toString();
        languageId = values.language.key || values.language.id || null;
      } else if (languages && Array.isArray(languages)) {
        // Find the matching language ID
        const matchingLang = languages.find(
          (lang) =>
            lang.languageName === values.language ||
            lang.name === values.language
        );
        if (matchingLang) {
          languageId = matchingLang.key || matchingLang.id || null;
        }
      }
    }

    // Process scheme data
    // let benefitSchemeIds = [];

    // if (values.schemeName) {
    //   if (Array.isArray(values.schemeName)) {
    //     // If multiple schemes are selected as strings, find their IDs from the schemes array
    //     benefitSchemeIds = values.schemeName
    //       .map((schemeName) => {
    //         const matchingScheme = schemes.find(
    //           (scheme) => scheme.schemeName === schemeName
    //         );
    //         return matchingScheme
    //           ? matchingScheme.key || matchingScheme.id
    //           : null;
    //       })
    //       .filter((id) => id !== null && id !== undefined);
    //   } else if (typeof values.schemeName === "object") {
    //     // If it's a single object, extract ID
    //     benefitSchemeIds = [
    //       values.schemeName.key || values.schemeName.id,
    //     ].filter(Boolean);
    //   } else if (schemes && Array.isArray(schemes)) {
    //     // If it's a single string, find the matching scheme and extract ID
    //     const matchingScheme = schemes.find(
    //       (scheme) =>
    //         scheme.schemeName === values.schemeName ||
    //         scheme.name === values.schemeName
    //     );
    //     if (matchingScheme) {
    //       benefitSchemeIds = [matchingScheme.key || matchingScheme.id].filter(
    //         Boolean
    //       );
    //     }
    //   }
    // }

    console.log("Scheme values", values.schemeStatuses);
    const benefitSchemeStatuses = Array.isArray(values.schemeStatuses)
      ? values.schemeStatuses.filter(
          (s: { schemeId: number; selected: boolean | null }) =>
            s.selected !== null
        )
      : [];
    console.log("benefitSchemeStatuses", benefitSchemeStatuses);

    // voter history
    let voterHistoryIds = [];

    if (values.voterHistory) {
      if (Array.isArray(values.voterHistory)) {
        // If multiple voterHistory are selected as strings, find their IDs from the voterHistory array
        voterHistoryIds = values.voterHistory
          .map((voterHistoryName) => {
            const matchingVoterHistory = histories.find(
              (history) => history.voterHistoryName === voterHistoryName
            );
            return matchingVoterHistory
              ? matchingVoterHistory.key || matchingVoterHistory.id
              : null;
          })
          .filter((id) => id !== null && id !== undefined);
      } else if (typeof values.voterHistory === "object") {
        // If it's a single object, extract ID
        voterHistoryIds = [
          values.voterHistory.key || values.voterHistory.id,
        ].filter(Boolean);
      } else if (histories && Array.isArray(histories)) {
        // If it's a single string, find the matching voterHistory and extract ID
        const matchingVoterHistory = histories.find(
          (voterHistory) =>
            voterHistory.voterHistoryName === values.voterHistory ||
            voterHistory.name === values.voterHistory
        );
        if (matchingVoterHistory) {
          voterHistoryIds = [
            matchingVoterHistory.key || matchingVoterHistory.id,
          ].filter(Boolean);
        }
      }
    }

    //feedback
    let feedbackIssueIds = [];

    if (values.feedback) {
      if (Array.isArray(values.feedback)) {
        // If multiple feedbacks are selected as strings, find their IDs from the feedbacks array
        feedbackIssueIds = values.feedback
          .map((feedback) => {
            const matchingFeedback = feedbacks.find(
              (feed) => feed.issueName === feedback
            );
            return matchingFeedback
              ? matchingFeedback.key || matchingFeedback.id
              : null;
          })
          .filter((id) => id !== null && id !== undefined);
      } else if (typeof values.feedback === "object") {
        // If it's a single object, extract ID
        feedbackIssueIds = [values.feedback.key || values.feedback.id].filter(
          Boolean
        );
      } else if (feedbacks && Array.isArray(feedbacks)) {
        // If it's a single string, find the matching feedback and extract ID
        const matchingFeedback = feedbacks.find(
          (feedback) =>
            feedback.issueName === values.feedback ||
            feedback.issueName === values.feedback
        );
        if (matchingFeedback) {
          feedbackIssueIds = [
            matchingFeedback.key || matchingFeedback.id,
          ].filter(Boolean);
        }
      }
    }
    feedbackIssueIds = feedbackIssueIds.map(Number);
    const finalVoterImage = voterImage[0].originFileObj;

    const data = {
      gender: values.gender,
      voterImage: finalVoterImage,
      voterLati: latitude,
      voterLongi: longitude,
      availability: values.availability,
      religion: values.religion,
      religionId: relId,
      casteId: cId,
      caste: values.caste,
      remarks: values.remarks || "No remarks",
      electionId: parseInt(electionId),
      partNo: parseInt(values.boothNumber) || 0,
      epic_number: values.epic_number || "",
      voterFnameEn: values.voterFnameEn || "",
      voterLnameEn: values.voterLnameEn || "",
      voterFnameL1: values.voterFnameL1 || "",
      voterLnameL1: values.voterLnameL1 || "",
      voterFnameL2: values.voterFnameL2 || "",
      voterLnameL2: values.voterLnameL2 || "",
      dob: dob,
      age: age || 18,
      pincode: values.pincode,
      fullAddress: values.fullAddress,
      //dynamic data
      languages: languageData, //  String
      languageId: languageId, //  Single ID, not an array
      // benefitSchemeIds: benefitSchemeIds,
      benefitSchemeStatuses: benefitSchemeStatuses,

      feedbackIssueIds: feedbackIssueIds,
      voterHistoryIds: voterHistoryIds,

      starNumber: values.starNumber,
      panNumber: values.panNumber,
      aadhaarNumber: values.aadhaarNumber,
      partyRegistrationNumber: values.partyRegistrationNumber,

      mobileNo: values.mobileNo,
      whatsappNo: values.whatsappNumber,
      alternate_phone_number: values.alternatePhoneNumber || null,
      secondary_email: values.secondaryEmail || null,
      email: values.email,
      partyAffiliation: values.partyAffiliation,
      third_party_id: voterDetails?.id || "",
      photo_url: "",
      stateCode: values.stateCode || null,
      // stateNameEn: values.stateNameEn || values.state || null,
      stateNameL1: values.stateNameL1 || null,
      stateNameL2: values.stateNameL2 || null,
      pcNo: values.pcNo || null,
      pcNameEn: values.pcNameEn || null,
      pcNameL1: values.pcNameL1 || null,
      pcNameL2: values.pcNameL2 || null,
      acNo: values.acNo || null,
      acNameEn: values.acNameEn || null,
      acNameL1: values.acNameL1 || null,
      acNameL2: values.acNameL2 || null,
      sectionNo: values.sectionNo || null,
      sectionNameEn: values.sectionNameEn || null,
      sectionNameL1: values.sectionNameL1 || null,
      sectionNameL2: values.sectionNameL2 || null,
      serialNo: values.serialNo || null,
      relationName: relationName || null,
      rlnFnameEn: values.rlnFnameEn || null,
      rlnLnameEn: values.rlnLnameEn || null,
      rlnFnameL1: values.rlnFnameL1 || null,
      rlnLnameL1: values.rlnLnameL1 || null,
      rlnFnameL2: values.rlnFnameL2 || null,
      rlnLnameL2: values.rlnLnameL2 || null,
      rlnType: values.rlnType || null,
      urbanNo: values.urbanNo || null,
      urbanNameEn: values.urbanNameEn || null,
      urbanNameL1: values.urbanNameL1 || null,
      urbanNameL2: values.urbanNameL2 || null,
      urbanWardNo: values.urbanWardNo || null,
      districtCode: values.districtCode || null,
      districtNameEn: values.districtNameEn || null,
      districtNameL1: values.districtNameL1 || null,
      districtNameL2: values.districtNameL2 || null,
      rurDistrictUnionNameEn: values.rurDistrictUnionNameEn || null,
      rurDistrictUnionNameL1: values.rurDistrictUnionNameL1 || null,
      rurDistrictUnionNameL2: values.rurDistrictUnionNameL2 || null,
      rurDistrictUnionNo: values.rurDistrictUnionNo || null,
      rurDistrictUnionWardNo: values.rurDistrictUnionWardNo || null,
      panUnionNameEn: values.panUnionNameEn || null,
      panUnionNo: values.panUnionNo || null,
      panUnionNameL1: values.panUnionNameL1 || null,
      panUnionNameL2: values.panUnionNameL2 || null,
      panUnionWardNo: values.panUnionWardNo || null,
      villPanNo: values.villPanNo || null,
      villPanNameEn: values.villPanNameEn || null,
      villPanNameL1: values.villPanNameL1 || null,
      villPanNameL2: values.villPanNameL2 || null,
      villPanWardNo: values.villPanWardNo || null,
      partNameEn: values.partNameEn || null,
      partNameL1: values.partNameL1 || null,
      partNameL2: values.partNameL2 || null,
      partLati: values.partLati || null,
      partLong: values.partLong || null,
      //house number
      houseNoEn: values.houseNoEn || null,
      houseNoL1: values.houseNoL1 || null,
      houseNoL2: values.houseNoL2 || null,
      latitude,
      longitude,
    };
    console.log("Voter data in addvoterapi", data);
    onFinish(data);
  };

  useEffect(() => {
    // Fetch religions on mount
    if (selectedElectionId) {
      fetchSchemeData();
      fetchAvailabilityData();
      fetchReligionData();
      fetchCasteCategoryData();
      fetchPartyData();
      fetchPartData();
      fetchSectionData();
      fetchLanguageData();
      fetchHistoryData();
      fetchFeedbackData();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (newSchemeId) {
      const newlyAddedScheme = schemes?.find(
        (scheme) => scheme.key === newSchemeId
      );
      console.log("newlyAddedScheme", newlyAddedScheme);
      if (newlyAddedScheme) {
        const existingSchemes = form.getFieldValue("schemeName") || [];
        const updatedSchemes = Array.from(
          new Set([...existingSchemes, newlyAddedScheme.schemeName])
        );
        form.setFieldsValue({
          schemeName: updatedSchemes,
          schemeBy:
            newlyAddedScheme.schemeBy === "Union Govt."
              ? "UNION_GOVT"
              : newlyAddedScheme.schemeBy === "State Govt."
              ? "STATE_GOVT"
              : newlyAddedScheme.schemeBy === "Local Body"
              ? "LOCAL_BODY"
              : newlyAddedScheme.schemeBy,
        });
        setNewSchemeId(null);
      }
    }
  }, [schemes, newSchemeId]);

  useEffect(() => {
    if (selectedElectionId) {
      console.log(allElections);
      const selectedElection = allElections?.find(
        (election) => election.id === selectedElectionId
      );
      console.log("selectedElection", selectedElection);
      setSelectedElectionDetails(selectedElection);
    }
  }, [selectedElectionId, allElections]);

  useEffect(() => {
    if (selectedElectionDetails) {
      form.setFieldsValue({
        stateNameEn: selectedElectionDetails.state,
      });
    }
  }, [selectedElectionDetails, form]);

  useEffect(() => {
    if (religionId) {
      fetchCastesData(parseInt(religionId));
    } else {
      setCastes([]);
    }
  }, [religionId]);

  useEffect(() => {
    if (casteId) {
      fetchSubCastesData(casteId);
    } else {
      setSubCastes([]);
    }
  }, [casteId]);

  useEffect(() => {
    if (selectedSubCasteReligionId && selectedSubCasteCasteId) {
      fetchSubCastesData(selectedSubCasteCasteId);
    } else {
      setSubCastes([]);
    }
  }, [selectedSubCasteReligionId, selectedSubCasteCasteId]);

  useEffect(() => {
    if (addedPartyKey && parties.length > 0) {
      const newlyAddedParty = parties.find(
        (party) => party.key === addedPartyKey
      );
      if (newlyAddedParty) {
        form.setFieldsValue({
          partyAffiliation: newlyAddedParty.partyName,
        });
      }

      setAddedPartyKey(null);
    }
  }, [parties, addedPartyKey, form]);

  useEffect(() => {
    if (isCasteModalVisible) {
      setSelectedReligionForCaste(religionId);
      modalCasteForm.setFieldsValue({
        religion: religionId,
      });
    }
  }, [isCasteModalVisible, religionId, form]);

  useEffect(() => {
    if (isSubCasteModalVisible) {
      setSelectedSubCasteReligionId(religionId);
      setSelectedSubCasteCasteId(casteId);
      modalSubCasteForm.setFieldsValue({
        religionId: religionId,
        casteId: casteId,
      });
    }
  }, [isSubCasteModalVisible, religionId, casteId, form]);

  useEffect(() => {
    if (newAvailabilityId) {
      const newAvailability = availabilities?.find(
        (avl) => avl.key === newAvailabilityId
      );
      console.log("New Availability", newAvailability);
      if (newAvailability) {
        form.setFieldsValue({
          availability: newAvailability.description,
        });
        setNewAvailabilityId(null);
      }
    }
  }, [availabilities, newAvailabilityId]);

  // USE EFFECT FOR AUTOMATIC CASTE CATEGORY SELECTION
  useEffect(() => {
    if (newCasteCategoryId) {
      const newCasteCategory = casteCategories?.find(
        (cst) => cst?.key === newCasteCategoryId
      );
      console.log("New Caste category", newCasteCategory);
      if (newCasteCategory) {
        form.setFieldsValue({
          casteCategory: newCasteCategory.casteCategoryName,
        });

        setNewCasteCategoryId(null);
      }
    }
  }, [casteCategories, newCasteCategoryId]);

  useEffect(() => {
    if (newLanguageId) {
      console.log("newLanguageId", newLanguageId);
      const newLanguage = languages?.find((lan) => lan?.key === newLanguageId);
      console.log("New Language", newLanguage);
      if (newLanguage) {
        form.setFieldsValue({
          languages: newLanguage.languageName,
        });
      }
      setNewLanguageId(null);
    }
  }, [languages]);

  // USE EFFECT FOR AUTOMATIC FEEDBACK SELECTION
  useEffect(() => {
    if (newFeedbackId) {
      console.log("newFeedbackId", newFeedbackId);
      const newfeedback = feedbacks?.find(
        (feed) => feed?.key === newFeedbackId
      );
      console.log("New Feedback", newfeedback);
      if (newfeedback) {
        const existingFeedbacks = form.getFieldValue("feedback") || [];
        const updatedFeedbacks = Array.from(
          new Set([...existingFeedbacks, newfeedback.issueName])
        );
        form.setFieldsValue({
          feedback: updatedFeedbacks,
        });
        setNewFeedbackId(null);
      }
    }
  }, [feedbacks]);

  // USE EFFECT FOR AUTOMATIC HISTORY SELECTION
  useEffect(() => {
    if (newHistoryId) {
      console.log("newHistoryId", newHistoryId);
      const newHistory = histories?.find((his) => his?.id === newHistoryId);
      console.log("New History", newHistory);
      if (newHistory) {
        const existingHistories = form.getFieldValue("voterHistory") || [];
        const updatedHistories = Array.from(
          new Set([...existingHistories, newHistory.voterHistoryName])
        );

        form.setFieldsValue({
          voterHistory: updatedHistories,
        });
        setNewHistoryId(null);
      }
    }
  }, [histories]);

  return (
    <>
      {!showForm && (
        <>
          <Row gutter={[16, 16]} className="my-5">
            <Col span={24}>
              <h3 className="text-[15px] leading-5 font-medium text-[#1F2937]">
                Enter EPIC Number:
              </h3>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <Input
                value={epicNumber}
                onChange={(e) => setEpicNumber(e.target.value)}
                placeholder="Enter EPIC Number"
                className="input-element"
              />
            </Col>
            <Col span={6}>
              <Button
                type="primary"
                disabled={isSearching}
                icon={
                  isSearching ? (
                    <Spin indicator={spinIcon} />
                  ) : (
                    <SearchOutlined />
                  )
                }
                className={`text-[15px] h-full font-semibold leading-4 bg-[#2563EB] px-10 py-4 ${
                  isSearching
                    ? ""
                    : "hover:!bg-[#2563EB] hover:!text-white hover:border-[#2563EB] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
                }`}
                onClick={handleGetVoterDetails}
              >
                {isSearching ? "Loading..." : "Search"}
              </Button>
            </Col>
          </Row>

          {voterDetails && (
            <Row gutter={[16, 16]} className="mt-10">
              <Col span={10}>
                {voterDetails.photo_url ? (
                  <img
                    src={voterDetails.photo_url}
                    alt="Voter"
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.src = "/api/placeholder/150/150";
                      e.currentTarget.onerror = null;
                    }}
                  />
                ) : (
                  <div className="bg-gray-100 w-full aspect-square flex items-center justify-center">
                    <svg
                      className="w-24 h-24 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </Col>

              <Col span={14}>
                <div className="text-left space-y-2">
                  <div>
                    <strong>Name:</strong>{" "}
                    <span>
                      {voterDetails.applicantFirstName}{" "}
                      {voterDetails.applicantLastName !== "-"
                        ? voterDetails.applicantLastName
                        : ""}
                    </span>
                  </div>

                  {(voterDetails.applicantFirstNameL1 ||
                    voterDetails.applicantLastNameL1) && (
                    <div>
                      <strong>Regional Name:</strong>{" "}
                      <span>
                        {voterDetails.applicantFirstNameL1 || ""}{" "}
                        {voterDetails.applicantLastNameL1 &&
                        voterDetails.applicantLastNameL1 !== "-"
                          ? voterDetails.applicantLastNameL1
                          : ""}
                      </span>
                    </div>
                  )}

                  <div>
                    <strong>Relation Name:</strong>{" "}
                    <span>
                      {voterDetails.relationName || "N/A"}{" "}
                      {voterDetails.relationLName &&
                      voterDetails.relationLName !== "-"
                        ? voterDetails.relationLName
                        : ""}
                    </span>
                  </div>

                  {(voterDetails.relationNameL1 ||
                    voterDetails.relationLNameL1) && (
                    <div>
                      <strong>Relation Name (Local Language):</strong>{" "}
                      <span>
                        {voterDetails.relationNameL1 || ""}{" "}
                        {voterDetails.relationLNameL1 &&
                        voterDetails.relationLNameL1 !== "-"
                          ? voterDetails.relationLNameL1
                          : ""}
                      </span>
                    </div>
                  )}

                  <div>
                    <strong>City (District):</strong>{" "}
                    <span>{voterDetails.districtValue || "N/A"}</span>
                  </div>

                  {voterDetails.districtValueL1 && (
                    <div>
                      <strong>City (District, Local Language):</strong>{" "}
                      <span>{voterDetails.districtValueL1}</span>
                    </div>
                  )}

                  <div>
                    <strong>Booth No:</strong>{" "}
                    <span>{voterDetails.partNumber || "N/A"}</span>
                  </div>

                  <div>
                    <strong>Sr. No:</strong>{" "}
                    <span>{voterDetails.partSerialNumber || "N/A"}</span>
                  </div>

                  <div>
                    <strong>EPIC Number:</strong>{" "}
                    <span>{voterDetails.epicNumber || epicNumber}</span>
                  </div>

                  <div>
                    <strong>Age:</strong>{" "}
                    <span>{voterDetails.age || "N/A"}</span>
                  </div>

                  <div>
                    <strong>Address:</strong>{" "}
                    <span>{voterDetails.psbuildingName || "N/A"}</span>
                  </div>

                  <div>
                    <strong>Polling Station:</strong>{" "}
                    <span>{voterDetails.partName || "N/A"}</span>
                  </div>

                  {voterDetails.partNameL1 && (
                    <div>
                      <strong>Polling Station (Local Language):</strong>{" "}
                      <span>{voterDetails.partNameL1}</span>
                    </div>
                  )}

                  <div>
                    <strong>State:</strong>{" "}
                    <span>{voterDetails.stateName || "N/A"}</span>
                  </div>

                  {voterDetails.stateNameL1 && (
                    <div>
                      <strong>State (Local Language):</strong>{" "}
                      <span>{voterDetails.stateNameL1}</span>
                    </div>
                  )}

                  <div>
                    <strong>Assembly Constituency:</strong>{" "}
                    <span>{voterDetails.asmblyName || "N/A"}</span>
                  </div>

                  {voterDetails.asmblyNameL1 && (
                    <div>
                      <strong>Assembly Constituency (Local Language):</strong>{" "}
                      <span>{voterDetails.asmblyNameL1}</span>
                    </div>
                  )}

                  <div>
                    <strong>Parliamentary Constituency:</strong>{" "}
                    <span>{voterDetails.prlmntName || "N/A"}</span>
                  </div>

                  {voterDetails.prlmntNameL1 && (
                    <div>
                      <strong>
                        Parliamentary Constituency (Local Language):
                      </strong>{" "}
                      <span>{voterDetails.prlmntNameL1}</span>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          )}

          {isDataFetched && (
            <Row gutter={[16, 16]} className="w-full my-10" justify="center">
              <Col>
                <Button
                  type="primary"
                  className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                  style={{ marginRight: 16 }}
                  onClick={handleOpenForm}
                >
                  {isStandalone ? "Add Voter" : "Save and Continue"}
                </Button>
              </Col>
              {!isStandalone && (
                <Col>
                  <Button
                    type="default"
                    htmlType="button"
                    className="px-10 py-4 h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
                  >
                    Skip for now
                  </Button>
                </Col>
              )}
            </Row>
          )}
        </>
      )}

      {showForm && (
        <Form
          form={form}
          onFinishFailed={handleFinishFailed}
          onFinish={handleFormSubmit}
          onValuesChange={(changedValues, allValues) => {
            console.log("Changed Values:", changedValues); // Log only the changed fields
            console.log("All Form Values:", allValues); // Log all form values
          }}
          layout="vertical"
          className="w-full pb-6 pt-6 pr-6"
        >
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={24}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Complete Voter Details
              </h3>
            </Col>
          </Row>
          <Collapse
            activeKey={activeKey}
            expandIconPosition="end"
            bordered={false}
            onChange={(keys) => setActiveKey(keys as string[])}
            className="bg-transparent custom-collapse"
            expandIcon={({ isActive }) => (
              <PlusOutlined
                rotate={isActive ? 45 : 0}
                className="transition-transform duration-200 text-gray-700"
              />
            )}
          >
            <Panel
              key="1"
              header={
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      Election Commission Data
                    </span>
                  </div>
                </div>
              }
              className="bg-white "
            >
              <ElectionCommissionDataPanel
                handleBoothChange={handleBoothChange}
                handleSectionChange={handleSectionChange}
                handlePreview={handlePreview}
                setFileList={setFileList}
                fileList={fileList}
                handleFileChange={handleFileChange}
                handleVoterImageUpload={handleVoterImageUpload}
                type={"add"}
                validateDecimalPlaces={validateDecimalPlaces}
              />
            </Panel>
            <Panel
              key="2"
              header={
                <div className="flex  items-center justify-between">
                  <div className="relative flex items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      Voter Personal Information
                    </span>
                  </div>
                </div>
              }
              className="bg-white rounded-lg "
            >
              <Row gutter={[16, 16]} className="w-full items-center mt-5">
                <Col span={6}>
                  <Form.Item
                    name="age"
                    label="Age"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) {
                            return Promise.resolve(); // Allow empty field
                          }

                          const numericAge = Number(value); // Convert string to number
                          if (isNaN(numericAge)) {
                            return Promise.reject(
                              new Error("Please enter a valid number")
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <Input className="input-element" placeholder="Enter age" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <DatePicker
                      format="DD-MMM-YYYY"
                      className="input-element w-full"
                      disabledDate={(current) =>
                        current && current > moment().endOf("day")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="mobileNo"
                    label="Mobile Number"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Phone number must be 10 digits",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      prefix={
                        <span style={{ marginRight: "8px", color: "#999" }}>
                          +91
                        </span>
                      }
                      placeholder="Enter Phone Number"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="whatsappNumber"
                    label="Whatsapp Number"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Whatsapp number must be 10 digits",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      prefix={
                        <span style={{ marginRight: "8px", color: "#999" }}>
                          +91
                        </span>
                      }
                      placeholder="Enter Whatsapp Number"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { type: "email", message: "Please enter a valid email" },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Email"
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="latitude"
                    label="Latitude"
                    validateStatus={latError ? "error" : ""}
                    help={latError}
                    rules={[
                      {
                        pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]+)?$/,
                        message: "Please enter a valid latitude (-90 to 90)",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Latitude"
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setFieldValue("latitude", value);
                        validateDecimalPlaces(
                          e.target.value,
                          -90,
                          90,
                          setLatError
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    name="longitude"
                    label="Longitude"
                    validateStatus={lngError ? "error" : ""}
                    help={lngError}
                    rules={[
                      {
                        pattern: /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]+)?$/,
                        message: "Please enter a valid longitude (-180 to 180)",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Longitude"
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setFieldValue("longitude", value);
                        validateDecimalPlaces(
                          e.target.value,
                          -90,
                          90,
                          setLngError
                        );
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Button
                    className="custom-select hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                    onClick={isDetectingLocation ? null : detectLocation}
                  >
                    {isDetectingLocation ? (
                      <Spin size="small" className="custom-spin-dark mr-2" />
                    ) : null}
                    {isDetectingLocation ? "Detecting..." : "Detect Location"}
                  </Button>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col xs={24} md={6}>
                  <Form.Item name="starNumber" label="Star">
                    <Radio.Group className="custom-radio-group">
                      <Radio key="1" value={true}>
                        Yes
                      </Radio>
                      <Radio key="2" value={false}>
                        No
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="aadhaarNumber"
                    label="Aadhaar Number"
                    rules={[
                      {
                        pattern: /^[0-9]{12}$/,
                        message: "Aadhaar number must be 12 digits",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Aadhaar Number"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="panNumber"
                    label="PAN Number"
                    rules={[
                      {
                        pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                        message: "Invalid PAN format",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter PAN Number"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    label="Party Registration Number"
                    name="partyRegistrationNumber"
                    rules={
                      [
                        // {
                        //   pattern: /^[0-9]*$/,
                        //   message: "Only numbers are allowed",
                        // },
                      ]
                    }
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Party Registration Number"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full items-center">
                <Col span={8}>
                  <Form.Item name="religion" label="Religion">
                    {religions.length > 0 ? (
                      <Select
                        className="input-element custom-select"
                        value={selectedReligion || undefined}
                        placeholder="Select Religion"
                        showSearch
                        filterOption={(input, option) =>
                          option?.children
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        dropdownRender={(menu) =>
                          renderReligionDropdown(
                            menu,
                            setIsReligionModalVisible
                          )
                        }
                        onChange={(value) => {
                          const selectedReligion = religions?.find(
                            (religion) => religion.religionName === value
                          );
                          form.setFieldValue("caste", null);
                          form.setFieldValue("sub_caste", null);
                          setReligionId(selectedReligion?.key || undefined);
                        }}
                      >
                        {religions?.map((religion) => (
                          <Option
                            key={religion.key}
                            value={religion.religionName}
                          >
                            {religion.religionName}
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 8,
                          backgroundColor: "#f0f0f0 ",
                          border: "1px solid #d9d9d9",
                          borderRadius: "4px",
                        }}
                      >
                        <Button
                          type="link"
                          onClick={() => setIsReligionModalVisible(true)}
                          style={{ padding: 0 }}
                        >
                          Click to Add.
                        </Button>
                      </div>
                    )}
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="caste" label="Caste">
                    <Select
                      disabled={!religionId}
                      className="input-element custom-select"
                      dropdownRender={(menu) =>
                        renderCasteDropdown(menu, setIsCasteModalVisible)
                      }
                      showSearch
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                      placeholder="Select Caste"
                      onChange={(value) => {
                        const selectedCaste = castes?.find(
                          (caste) => caste.casteName === value
                        );
                        form.setFieldValue("sub_caste", null);
                        setCasteName(selectedCaste?.casteName);
                        setCasteId(selectedCaste?.key);
                      }}
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                    >
                      {castes
                        .filter((caste) => caste.religionId === religionId)
                        ?.map((caste) => (
                          <Option key={caste.key} value={caste.casteName}>
                            {caste.casteName}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="sub_caste" label="Sub-Caste">
                    <Select
                      disabled={!casteId}
                      className="input-element custom-select"
                      dropdownRender={(menu) =>
                        renderSubCasteDropdown(menu, setIsSubCasteModalVisible)
                      }
                      placeholder="Select Sub-Caste"
                      showSearch
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                    >
                      {subCastes
                        .filter((subcaste) => subcaste.casteName === casteName)
                        ?.map((subcaste) => (
                          <Option
                            key={subcaste.key}
                            value={subcaste.subCasteName}
                          >
                            {subcaste.subCasteName}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="availability" label="Category">
                    <Select
                      className="input-element custom-select"
                      showSearch
                      dropdownRender={(menu) =>
                        renderAvailabilityDropdown(
                          menu,
                          setIsAvailabilityModalOpen
                        )
                      }
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                    >
                      {availabilities?.map((availability) => (
                        <Option
                          key={availability.key}
                          value={availability.description}
                        >
                          {availability.description}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="partyAffiliation" label="Party Affiliation">
                    <Select
                      className="input-element custom-select"
                      placeholder="Select Party Affiliation"
                      showSearch
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                      dropdownRender={(menu) =>
                        renderPartyDropdown(menu, setIsPartyModalVisible)
                      }
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                    >
                      {parties?.map((party) => (
                        <Option key={party.key} value={party.partyName}>
                          {party.partyName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="schemeName" label="Schemes">
                    <Select
                      className="input-element custom-select"
                      open={isDropdownVisible}
                      onOpenChange={setIsDropdownVisible}
                      popupRender={() => (
                        <SchemeDropdown
                          schemes={schemes}
                          form={form}
                          onAddNewScheme={() => {
                            setIsDropdownVisible(false);
                            setIsSchemeModalOpen(true);
                          }}
                        />
                      )}
                      placeholder="Select Scheme Status"
                      style={{
                        minHeight: "46px",
                        height: "auto",
                      }}
                      value={form.getFieldValue("scheme") || []}
                      showSearch={false}
                      suffixIcon={null}
                      tagRender={SchemeTagRender}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="voterHistory" label="Voting History">
                    <Select
                      className="input-element custom-select"
                      placeholder="Select Voting History"
                      mode="multiple"
                      showSearch
                      dropdownRender={(menu) =>
                        renderHistoryDropdown(menu, setIsHistoryModalVisible)
                      }
                      style={{
                        minHeight: "46px",
                        height: "auto",
                      }}
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                    >
                      {histories?.map((history) => (
                        <Option
                          key={history.key}
                          value={history.voterHistoryName}
                        >
                          {history.voterHistoryName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="feedback" label="Feedback">
                    <Select
                      className="input-element custom-select"
                      placeholder="Select Feedback/Issues"
                      mode="multiple"
                      showSearch
                      dropdownRender={(menu) =>
                        renderFeedbackDropdown(menu, setIsFeedbackModalVisible)
                      }
                      style={{
                        minHeight: "46px",
                        height: "auto",
                      }}
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                    >
                      {feedbacks.map((feed) => (
                        <Option key={feed.key} value={feed.issueName}>
                          {feed.issueName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="language" label="Language">
                    <Select
                      className="input-element custom-select"
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                      dropdownRender={(menu) =>
                        renderLanguageDropdown(menu, setIsLanguageModalVisible)
                      }
                      placeholder="Select Language"
                      showSearch
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                    >
                      {" "}
                      {languages?.map((language: any) => (
                        <Option
                          key={language.key}
                          value={language.languageName}
                        >
                          {language.languageName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Form.Item label="Remarks" name="remarks">
                    <Input.TextArea
                      className="input-element"
                      placeholder="Enter any additional remarks"
                      rows={4}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="casteCategory" label="Caste-Category">
                    <Select
                      className="input-element custom-select"
                      placeholder="Select Caste Category"
                      showSearch
                      dropdownRender={(menu) =>
                        renderCasteCategoryDropdown(
                          menu,
                          setIsCasteCategoryModalVisible
                        )
                      }
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                      filterOption={(input, option) => {
                        const label =
                          typeof option?.children === "string"
                            ? option.children
                            : "";
                        return label
                          .toLowerCase()
                          .includes(input.toLowerCase());
                      }}
                    >
                      {casteCategories?.map((category) => (
                        <Option
                          key={category.key}
                          value={category.casteCategoryName}
                        >
                          {category.casteCategoryName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Panel>
            <Panel
              key="3"
              header={
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      State & District Information
                    </span>
                  </div>
                </div>
              }
              className="bg-white rounded-lg "
            >
              {" "}
              <StateAndDistrictPanel type={"add"} stateOptions={stateOptions} />
            </Panel>
            <Panel
              key="4"
              header={
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      PC & AC Information
                    </span>
                  </div>
                </div>
              }
              className="bg-white rounded-lg "
            >
              {" "}
              <PCACInfoPanel type="add" />
            </Panel>
            <Panel
              key="5"
              header={
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      Urban Local Body Information
                    </span>
                  </div>
                </div>
              }
              className="bg-white rounded-lg "
            >
              {" "}
              <UrbanLocalBodyInfoPanel type="add" />
            </Panel>
            <Panel
              key="6"
              header={
                <div className="flex items-center justify-between">
                  <div className="relative flex items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      Rural Local Body Information
                    </span>
                  </div>
                </div>
              }
              className="bg-white rounded-lg "
            >
              {" "}
              <RuralLocalBodyPanel />
            </Panel>
          </Collapse>
          {/* Alternate Phone, Secondary Email, Latitude/Longitude + Detect Location, Address, Availability, Religion, Caste, PartyAffiliation, Remarks */}
          {/* Due to size constraints, not re-pasting every single field, but you would add them here with similar validation rules as shown before. */}
          {/* Ensure city, state, postalCode, religion, caste, etc. are also required fields with patterns if needed. */}
          {/* Example for City, State, Postal Code */}

          {/* Include other optional fields as needed (assembly, parliament, localBody, remarks, etc.) */}
          <Row gutter={[16, 16]} className="w-full mt-10" justify="center">
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                style={{ marginRight: 16 }}
              >
                {isStandalone ? "Add Voter" : "Save and Continue"}
              </Button>
            </Col>
            {!isStandalone && (
              <Col>
                <Button
                  type="default"
                  htmlType="button"
                  className="px-10 py-4 h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
                >
                  Skip for now
                </Button>
              </Col>
            )}
          </Row>
        </Form>
      )}

      {/* Modal for Add Religion */}
      <Modal
        title="Add Religion"
        open={isReligionModalVisible}
        onCancel={() => {
          setIsReligionModalVisible(false);
          setNewReligionName("");
          setReligionFileList([]);
        }}
        onClose={() => setIsReligionModalVisible(false)}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
        }}
        onOk={async () => {
          setLoadingForm(true);
          if (!newReligionName.trim()) {
            message.error("Religion name cannot be empty.");
            setLoadingForm(false);
            return;
          }
          const file = religionFileList[0]?.originFileObj;
          if (!file) {
            message.error("Religion image cannot be empty.");
            setLoadingForm(false);
            return;
          }
          const formData = new FormData();
          formData.append("religionName", newReligionName);
          if (file) {
            formData.append("religionImage", file);
          }
          try {
            await addReligion(formData, parseInt(selectedElectionId));
            // message.success("Religion added successfully!");
            setSelectedReligion(newReligionName);
            setIsReligionModalVisible(false);
            setReligionFileList([]);
            setNewReligionName("");
            fetchReligionData(newReligionName);
          } catch (error) {
            console.error("Error adding religion:", error);
          } finally {
            setLoadingForm(false);
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item
            label="Religion Name"
            rules={[
              { required: true, message: "Please enter the religion name" },
              // {
              //   pattern: /^[A-Za-z\s]+$/,
              //   message: "Please enter a valid Religion Name",
              // },
            ]}
          >
            <Input
              value={newReligionName}
              onChange={(e) => setNewReligionName(e.target.value)}
              placeholder="Enter religion name"
            />
          </Form.Item>
          <Form.Item label="Religion Image" required>
            <ImgCrop
              rotationSlider
              aspect={1 / 1}
              quality={0.8}
              modalWidth={512}
              beforeCrop={validateImageBeforeCrop}
              showReset
              okText="Confirm"
              cancelText="Cancel"
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop Image</span>
                  <span
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      marginRight: "2rem",
                    }}
                  >
                    Size: 512x512 pixels
                  </span>
                </div>
              }
              modalProps={{
                okButtonProps: {
                  style: {
                    backgroundColor: "#1677ff",
                    borderColor: "#1677ff",
                    color: "#fff",
                  },
                },
              }}
            >
              <Upload
                accept="image/*"
                maxCount={1}
                fileList={religionFileList}
                onChange={({ fileList }) => setReligionFileList(fileList)}
                customRequest={dummyRequest}
                listType="picture"
              >
                {religionFileList.length === 0 && (
                  <div
                    style={{
                      padding: "16px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    <UploadOutlined
                      style={{ fontSize: "24px", marginBottom: "8px" }}
                    />
                    <div>Select Image</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for Add Caste */}
      <Modal
        title="Add Caste"
        open={isCasteModalVisible}
        onCancel={() => {
          setIsCasteModalVisible(false);
          setNewCasteName("");
          modalCasteForm.resetFields();
        }}
        onOk={async () => {
          setLoadingForm(true);

          if (!selectedReligionForCaste || !newCasteName.trim()) {
            message.error("Please select a religion and enter a caste name.");
            setLoadingForm(false);

            return;
          }
          try {
            await addCaste(
              newCasteName,
              selectedReligionForCaste,
              parseInt(selectedElectionId)
            );
            setIsCasteModalVisible(false);
            setNewCasteName("");
            if (religionId) {
              fetchCastesData(parseInt(religionId));
            }
          } catch (error) {
            console.error("Error adding caste:", error);
          } finally {
            setLoadingForm(false);
          }
        }}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: { backgroundColor: "#1D4ED8", color: "white" },
        }}
      >
        <Form
          form={modalCasteForm}
          layout="vertical"
          initialValues={{
            religion: religionId, // Pass the selected religionId as initial value
          }}
        >
          <Form.Item
            label="Select Religion"
            rules={[{ required: true, message: "Please select a religion" }]}
          >
            <Select
              placeholder="Select a religion"
              disabled
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              value={selectedReligionForCaste || religionId}
              onChange={(value) => setSelectedReligionForCaste(value)}
            >
              {religions?.map((religion) => (
                <Option key={religion.key} value={religion.key}>
                  {religion.religionName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Caste Name"
            rules={[
              { required: true, message: "Caste name is required" },
              // {
              //   pattern: /^[A-Za-z\s]+$/,
              //   message: "Please enter a valid Caste Name",
              // },
            ]}
          >
            <Input
              value={newCasteName}
              onChange={(e) => setNewCasteName(e.target.value)}
              placeholder="Enter caste name"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={"Add Sub-Caste"}
        open={isSubCasteModalVisible}
        onCancel={() => {
          setIsSubCasteModalVisible(false);
          setNewSubCasteName("");
          modalSubCasteForm.resetFields();
        }}
        onClose={() => setIsSubCasteModalVisible(false)}
        onOk={async () => {
          setLoadingForm(true);
          if (
            !selectedSubCasteReligionId ||
            !selectedSubCasteCasteId ||
            !newSubCasteName.trim()
          ) {
            message.error(
              "Please select a religion, caste and enter a subcaste name."
            );
            setLoadingForm(false);

            return;
          }
          try {
            console.log("newSubCasteName", newSubCasteName);
            console.log(
              "selectedSubCasteReligionId",
              selectedSubCasteReligionId
            );
            await addSubCaste(
              newSubCasteName,
              selectedSubCasteCasteId,
              selectedSubCasteReligionId,
              parseInt(selectedElectionId)
            );
            // message.success("Caste added successfully!");
            setIsSubCasteModalVisible(false);
            setNewSubCasteName("");
            fetchSubCastesData(selectedSubCasteCasteId);
          } catch (error) {
            console.error("Error adding sub-caste:", error);
          } finally {
            setLoadingForm(false);
          }
        }}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: { backgroundColor: "#1D4ED8", color: "white" },
        }}
      >
        <Form
          form={modalSubCasteForm}
          initialValues={{ religionId: religionId, casteId: casteId }}
          layout="vertical"
        >
          <Form.Item
            name="subCasteName"
            label={"Sub-Caste Name"}
            rules={[
              { required: true, message: "Sub-caste name is required" },
              // {
              //   pattern: /^[A-Za-z\s]+$/,
              //   message: "Please enter a valid Sub-Caste Name",
              // },
            ]}
          >
            <Input
              value={newSubCasteName}
              onChange={(e) => setNewSubCasteName(e.target.value)}
              placeholder={"Subcaste name"}
            />
          </Form.Item>
          {
            <>
              <Form.Item
                name="religionId"
                label="Religion"
                rules={[
                  { required: true, message: "Please select a religion" },
                ]}
              >
                <Select
                  placeholder="Select Religion"
                  disabled
                  showSearch
                  filterOption={(input, option) =>
                    option?.children
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  value={religionId}
                  onChange={(value) => setSelectedSubCasteReligionId(value)}
                >
                  {religions?.map((religion) => (
                    <Select.Option key={religion.key} value={religion.key}>
                      {religion.religionName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="casteId"
                label="Caste"
                rules={[{ required: true, message: "Please enter the caste" }]}
              >
                {castes.length > 0 ? (
                  <Select
                    disabled
                    value={casteId}
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    onChange={(value) => setSelectedSubCasteCasteId(value)}
                    placeholder="Select Caste"
                  >
                    {castes?.map((caste) => (
                      <Select.Option key={caste.key} value={caste.key}>
                        {caste.casteName}
                      </Select.Option>
                    ))}
                  </Select>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      border: "1px solid #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    <Button
                      type="link"
                      disabled={!selectedSubCasteReligionId}
                      onClick={() => setIsCasteModalVisible(true)}
                      style={{ padding: 0 }}
                    >
                      Click to Add.
                    </Button>
                  </div>
                )}
              </Form.Item>
            </>
          }
        </Form>
      </Modal>

      {/* Modal for add party */}
      <Modal
        title="Add Party"
        open={isPartyModalVisible}
        onCancel={() => {
          setIsPartyModalVisible(false);
          setNewPartyName("");
          setNewPartyShortName("");
          setPartyFileList([]);
          modalPartyForm.resetFields();
        }}
        onOk={() => {
          handlePartyAdd();
        }}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
      >
        <Form form={modalPartyForm} layout="vertical">
          <Form.Item
            label={"New Party Name"}
            name="partyName"
            rules={[{ required: true, message: "Please enter the party name" }]}
          >
            <Input
              placeholder="Enter party name"
              value={newPartyName}
              onChange={(e) => {
                setNewPartyName(e.target.value);
              }}
              autoFocus={true}
            />
          </Form.Item>
          <Form.Item
            label={"Party Short Name"}
            name="partyShortName"
            rules={[
              { required: true, message: "Please enter the party short name" },
            ]}
          >
            <Input
              onChange={(e) => {
                setNewPartyShortName(e.target.value);
              }}
              placeholder="Enter party short name"
            />
          </Form.Item>
          <Form.Item
            label="Party Image"
            name="partyImage"
            required
            rules={[
              {
                validator: async () => {
                  if (partyFileList.length === 0) {
                    throw new Error("Please upload a party image");
                  }
                },
              },
            ]}
          >
            <ImgCrop
              rotationSlider
              aspect={1}
              quality={0.8}
              showReset
              beforeCrop={validateImageBeforeCrop}
              modalTitle="Crop Party Image"
              modalWidth={512}
              modalProps={{
                okButtonProps: {
                  style: {
                    backgroundColor: "#1677ff",
                    borderColor: "#1677ff",
                    color: "#fff",
                  },
                },
              }}
            >
              <Upload
                maxCount={1}
                listType="picture"
                accept="image/*"
                fileList={partyFileList}
                onChange={({ fileList }) => setPartyFileList(fileList)}
                customRequest={dummyRequest}
              >
                {partyFileList.length === 0 && (
                  <div
                    style={{
                      padding: "16px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "4px",
                    }}
                  >
                    <UploadOutlined
                      style={{ fontSize: "24px", marginBottom: "8px" }}
                    />
                    <div>Select Party Image</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
        </Form>
      </Modal>
      <AddSchemeModal
        isOpen={isSchemeModalOpen}
        onClose={() => setIsSchemeModalOpen(false)}
        onSchemeAdded={handleSchemeAdded}
        selectedElectionId={selectedElectionId}
      />
      <AddCasteCategoryModal
        isOpen={isCasteCategoryModalVisible}
        onClose={() => setIsCasteCategoryModalVisible(false)}
        onCasteCategoryAdded={handleCasteCategoryAdded}
        selectedElectionId={selectedElectionId}
      />
      <AddAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onAvailabilityAdded={handleAvailabilityAdded}
        selectedElectionId={selectedElectionId}
      />
      <AddLanguageModal
        isOpen={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
        onLanguageAdded={handleLanguageAdded}
        selectedElectionId={selectedElectionId}
      />
      <AddFeedbackModal
        isOpen={isFeedbackModalVisible}
        onClose={() => setIsFeedbackModalVisible(false)}
        onFeedbackAdded={handleFeedbackAdded}
        selectedElectionId={selectedElectionId}
      />
      <AddHistoryModal
        isOpen={isHistoryModalVisible}
        onClose={() => setIsHistoryModalVisible(false)}
        onHistoryAdded={handleHistoryAdded}
        selectedElectionId={selectedElectionId}
      />
    </>
  );
}
