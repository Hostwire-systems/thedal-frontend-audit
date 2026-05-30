import React, { useEffect, useState } from "react";
import { Scheme } from "../../components/addVoterForm/AddVoterForm";
import {
  Modal,
  Form,
  Upload,
  message,
  Button,
  Input,
  Select,
  DatePicker,
  Collapse,
  ColorPicker,
} from "antd";
import moment from "moment";
import type { UploadFile } from "antd/es/upload/interface";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { fetchReligion, addReligion } from "../../api/religionApi";
import { useLoading } from "../../context/LoadingContext";
import { fetchCaste, addCaste } from "../../api/casteApi";
import { fetchSubCaste, addSubCaste } from "../../api/subCasteApi";
import { fetchParties, addParty } from "../../api/partyApi";
import { RcFile } from "antd/es/upload";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";

// Child panels
import ElectionCommissionDataPanel from "../../components/editVoterForm/panels/ElectionCommissionDataPanel";
import VoterPersonalInfoPanel from "../../components/editVoterForm/panels/VoterPersonalInfoPanel";
import StateDistrictInfoPanel from "../../components/editVoterForm/panels/StateDistrictInfoPanel";
import PCACInfoPanel from "../../components/editVoterForm/panels/PCACInfoPanel";
import UrbanLocalBodyInfoPanel from "../../components/editVoterForm/panels/UrbanLocalBodyInfoPanel";
import RuralLocalBodyInfoPanel from "../../components/editVoterForm/panels/RuralLocalBodyInfoPanel";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";
import { getAvailabilityApi } from "../../api/availabilityApi";
import AddSchemeModal from "../../components/addVoterForm/AddSchemeModal";
import AddAvailabilityModal from "../../components/addVoterForm/AddAvailabilityModal";
import AddLanguageModal from "../../components/addVoterForm/AddLanguageModal";
import { getLanguagesApi } from "../../api/languageApi";
import { PartData } from "../../components/addVoterAPI/addVoterApi";
import { SectionData } from "../../components/addVoterAPI/addVoterApi";
import { getSectionsApi } from "../../api/sectionApi";
import { getPartsApi } from "../../api/partApi";
import { VoterHistory } from "../../types/history";
import { fetchHistory } from "../../api/historyApi";
import { getFeedbackApi } from "../../api/feedbackApi";
import { FeedbackType } from "../../types/feedback";
import AddFeedbackModal from "../../components/addVoterForm/AddFeedbackModal";
import AddHistoryModal from "../../components/addVoterForm/AddHistoryModal";
import ImgCrop from "antd-img-crop";
import { fetchCasteCategories } from "../../api/casteCategoryApi";
import { CasteCategory } from "../../types/casteCategory";
import AddCasteCategoryModal from "../../components/addVoterForm/AddCasteCategoryModal";
import { Caste } from "../../types/voter";
import { ReligionType } from "../../types/religion";
import { SubCaste } from "../../types/voter";
import {
  getDynamicFieldsApi,
  getSavedFieldsApi,
  updateDynamicFieldOrder,
} from "../../api/dynamicFieldApi";
import {
  getFieldStatus,
  updateFieldStatus,
  updateStaticFieldsOrder,
} from "../../api/voterFieldsApi";

const { Option } = Select;
const { Panel } = Collapse;

const EditVoterModal = ({
  visible,
  onCancel,
  onUpdate,
  voter,
  loadingModal,
  setLoadingModal,
}) => {
  const [form] = Form.useForm();
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedElectionDetails, setSelectedElectionDetails]: any = useState(
    {}
  );
  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );

  // Data arrays
  const [religions, setReligions] = useState([]);
  const [castes, setCastes] = useState([]);
  const [casteCategories, setCasteCategories] = useState<CasteCategory[]>([]);
  const [subCastes, setSubCastes] = useState([]);
  const [parties, setParties] = useState([]);

  // IDs
  const [prevVoterId, setPrevVoterId] = useState<string | null>(null);
  const [religionId, setReligionId] = useState<number | null>(null);
  const [casteId, setCasteId] = useState<number | null>(null);
  const [subCasteId, setSubCasteId] = useState<number | null>(null);

  // For modals
  const [isPartyModalVisible, setIsPartyModalVisible] = useState(false);
  const [isReligionModalVisible, setIsReligionModalVisible] = useState(false);
  const [isCasteModalVisible, setIsCasteModalVisible] = useState(false);
  const [isCasteCategoryModalVisible, setIsCasteCategoryModalVisible] =
    useState<boolean>(false);
  const [isSubCasteModalVisible, setIsSubCasteModalVisible] = useState(false);

  // Fields used in modals
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [savedFields, setSavedFields] = useState<any[]>([]);

  const [newReligionName, setNewReligionName] = useState("");
  const [religionFileList, setReligionFileList] = useState<any[]>([]);
  const [partyFileList, setPartyFileList] = useState<any[]>([]);
  const [selectedReligionForCaste, setSelectedReligionForCaste] =
    useState(null);
  const [selectedReligion, setSelectedReligion] = useState("");
  const [newCasteName, setNewCasteName] = useState("");
  const [selectedCaste, setSelectedCaste] = useState("");
  const [newPartyName, setNewPartyName] = useState("");
  const [newAllianceName, setNewAllianceName] = useState("");
  const [partyImage, setPartyImage] = useState<RcFile | null>(null);
  const [newSubCasteName, setNewSubCasteName] = useState("");
  const [newPartyShortName, setNewPartyShortName] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [partyImageUploading, setPartyImageUploading] = useState(false);
  const [addedPartyKey, setAddedPartyKey] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  //voterImage
  const [voterImage, setVoterImage] = useState<RcFile | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  //voter video
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [selectedSubCaste, setSelectedSubCaste] = useState("");
  const [selectedSubCasteReligionId, setSelectedSubCasteReligionId] = useState<
    number | undefined
  >(undefined);
  const [selectedSubCasteCasteId, setSelectedSubCasteCasteId] = useState<
    number | undefined
  >(undefined);

  //Availability
  // scheme variables
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [newSchemeId, setNewSchemeId] = useState(null);
  const [newCasteCategoryId, setNewCasteCategoryId] = useState(null);

  // availability variables
  const [availabilities, setAvailabilities] = useState([]);
  const [newAvailabilityId, setNewAvailabilityId] = useState<number | null>(
    null
  );
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

  const { loading, setLoading } = useLoading();
  const location = useLocation();

  // Additional forms
  const [modalReligionForm] = Form.useForm();
  const [modalCasteForm] = Form.useForm();
  const [modalSubCasteForm] = Form.useForm();
  const [modalPartyForm] = Form.useForm();

  // Redux
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const electionId = location.state?.electionId || selectedElectionId;

  const fieldNameMap: Record<string, string> = {
    dateOfBirth: "date_of_birth",
    whatsappNumber: "whatsapp_number",
    subCaste: "sub_caste",
    mobileNumber: "mobileNo",
    voterLatitude: "voterLati",
    voterLongitude: "voterLongi",
    star: "starNumber",
    category: "availability",
    partyAffiliation: "party_affiliation",
    schemes: "scheme",
    votingHistory: "voterHistory",
  };

  // 1. DETECT LOCATION
  const detectLocation = async () => {
    setIsDetectingLocation(true);
    if (!navigator.geolocation) {
      message.error("Geolocation is not supported by your browser");
      setIsDetectingLocation(false);
      return;
    }
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const lat = position?.coords?.latitude.toFixed(6);
      const lng = position?.coords?.longitude.toFixed(6);
      form.setFieldsValue({
        voterLati: lat.toString(),
        voterLongi: lng.toString(),
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
    if (!/^(-?\d+(\.\d{0,6})?)?$/.test(value)) {
      setError(
        "Invalid format. Only numbers and a single decimal point allowed"
      );
      return;
    }

    setError("");
  };

  const normalizeFields = (
    fieldsData: { name: string; orderIndex: number }[]
  ) => {
    return fieldsData.map((field) => ({
      ...field,
      name: fieldNameMap[field.name] || field.name,
    }));
  };

  // Static fields definition aligned with saved order API (exclude voterName & match exact saved keys)
  // OrderIndex values here are only fallbacks; saved order (if present) will override them.
  const STATIC_FIELDS = [
    {
      id: "sub_caste",
      name: "sub_caste",
      label: "Sub Caste",
      orderIndex: 1,
      isStatic: true,
    },
    {
      id: "mobileNo",
      name: "mobileNo",
      label: "Mobile Number",
      orderIndex: 2,
      isStatic: true,
    },
    {
      id: "voterLati",
      name: "voterLati",
      label: "Voter Latitude",
      orderIndex: 3,
      isStatic: true,
    },
    {
      id: "whatsapp_number",
      name: "whatsapp_number",
      label: "Whatsapp Number",
      orderIndex: 4,
      isStatic: true,
    },
    {
      id: "voterLongi",
      name: "voterLongi",
      label: "Voter Longitude",
      orderIndex: 5,
      isStatic: true,
    },
    {
      id: "partyRegistrationNumber",
      name: "partyRegistrationNumber",
      label: "Party Registration Number",
      orderIndex: 6,
      isStatic: true,
    },
    {
      id: "date_of_birth",
      name: "date_of_birth",
      label: "Date of Birth",
      orderIndex: 7,
      isStatic: true,
    },
    {
      id: "email",
      name: "email",
      label: "Email",
      orderIndex: 8,
      isStatic: true,
    },
    {
      id: "aadhaarNumber",
      name: "aadhaarNumber",
      label: "Aadhaar Number",
      orderIndex: 9,
      isStatic: true,
    },
    {
      id: "panNumber",
      name: "panNumber",
      label: "PAN Number",
      orderIndex: 10,
      isStatic: true,
    },
    {
      id: "religion",
      name: "religion",
      label: "Religion",
      orderIndex: 11,
      isStatic: true,
    },
    {
      id: "caste",
      name: "caste",
      label: "Caste",
      orderIndex: 12,
      isStatic: true,
    },
    {
      id: "availability",
      name: "availability",
      label: "Category",
      orderIndex: 13,
      isStatic: true,
    },
    {
      id: "party_affiliation",
      name: "party_affiliation",
      label: "Party Affiliation",
      orderIndex: 14,
      isStatic: true,
    },
    {
      id: "scheme",
      name: "scheme",
      label: "Schemes",
      orderIndex: 15,
      isStatic: true,
    },
    {
      id: "feedback",
      name: "feedback",
      label: "Feedback",
      orderIndex: 16,
      isStatic: true,
    },
    {
      id: "voterHistory",
      name: "voterHistory",
      label: "Voting History",
      orderIndex: 17,
      isStatic: true,
    },
    {
      id: "languages",
      name: "languages",
      label: "Language",
      orderIndex: 18,
      isStatic: true,
    },
    {
      id: "casteCategory",
      name: "casteCategory",
      label: "Caste-Category",
      orderIndex: 19,
      isStatic: true,
    },
    {
      id: "remarks",
      name: "remarks",
      label: "Remarks",
      orderIndex: 20,
      isStatic: true,
    },
  ];

  // COMBINE AND FETCH ALL FIELD ORDERS (same logic as FieldsOrder page)
  const fetchCombinedFieldOrder = async () => {
    try {
      // Fetch saved order (contains name and orderIndex)
      const savedResponse = await getSavedFieldsApi(
        parseInt(selectedElectionId)
      );
      const savedFields: Array<{ name: string; orderIndex: number }> =
        savedResponse.data?.fields || [];

      // Fetch current dynamic fields (full field definitions)
      const dynamicResponse = await getDynamicFieldsApi(
        parseInt(selectedElectionId)
      );
      const currentDynamicFields: any[] =
        dynamicResponse.data?.fieldsPage?.content || [];

      console.log("Saved fields for edit modal:", savedFields);
      console.log(
        "Current dynamic fields for edit modal:",
        currentDynamicFields
      );

      let combinedFields: any[] = [];

      // Build ordering map only if we actually have saved order data
      const hasSavedOrder = savedFields.length > 0;
      const fieldOrderMap = new Map<string, number>();
      if (hasSavedOrder) {
        savedFields.forEach((f) => fieldOrderMap.set(f.name, f.orderIndex));
      }

      // 1. Static fields (apply saved order if available)
      const staticFieldsProcessed = STATIC_FIELDS.map((sf) => ({
        ...sf,
        orderIndex: fieldOrderMap.get(sf.name) ?? sf.orderIndex,
      }));

      // Determine max static order to anchor dynamic fields behind (prevents overlap)
      const maxStaticOrder = staticFieldsProcessed.reduce(
        (max, f) => Math.max(max, Number(f.orderIndex) || 0),
        0
      );

      // 2. Dynamic fields (only active ones)
      const activeDynamic = currentDynamicFields.filter((df) => df.status);
      // Sort by their internal orderIndex first to keep relative ordering
      activeDynamic.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      const dynamicStartIndex = maxStaticOrder + 1; // Always append after last static
      const dynamicFieldsProcessed = activeDynamic.map((df, idx) => ({
        ...df,
        name: df.name || df.label || `dynamic_${df.id}`,
        orderIndex: hasSavedOrder
          ? dynamicStartIndex + idx // saved order only covers static fields → append
          : dynamicStartIndex + idx, // no saved order yet → treat the same (static fallbacks already sequential)
        isStatic: false,
      }));

      combinedFields = [...staticFieldsProcessed, ...dynamicFieldsProcessed];

      // Sort combined list to ensure sequential ordering
      const sortedFields = combinedFields
        .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex))
        .map((f, idx) => ({ ...f, visualIndex: idx })); // optional visual index for debugging

      console.log(
        "[EditModal] Combined field order (normalized):",
        sortedFields
      );
      setSavedFields(sortedFields);
      setDynamicFields(currentDynamicFields);
    } catch (error) {
      console.error("Failed to fetch combined field order:", error);
      message.error("Failed to fetch field configuration");
    }
  };

  // 4. FETCH RELIGION
  const fetchReligionData = async (newRelName?: string) => {
    try {
      const response = await fetchReligion(parseInt(selectedElectionId));
      const fetched =
        response?.data?.data
          ?.map((r: any) => ({
            key: r.religionId,
            religionName: r.religionName,
            orderIndex: r?.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex) || [];
      setReligions(fetched);
      if (newRelName) {
        const newlyAdded = fetched.find((r) => r.religionName === newRelName);
        console.log("Newly added religion", newlyAdded);
        console.log("ReligionId inside fetch religion data", religionId);
        if (newlyAdded) {
          setSelectedReligion(newRelName);
          // setReligionId(newlyAdded.key);
          setSelectedReligionForCaste(newlyAdded.key);
          form.setFieldsValue({ religion: newlyAdded.religionName });
        }
      }
    } catch (err) {
      console.error("Error fetching religions: ", err);
    }
  };

  // 5. FETCH CASTES
  const fetchCastesData = async (relId: number) => {
    try {
      const response = await fetchCaste(parseInt(selectedElectionId), relId);
      const fetched =
        response?.data?.data
          ?.map((c: any) => ({
            key: c.casteId,
            casteName: c.casteName,
            religionId: c.religionId,
            orderIndex: c.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex) || [];

      setCastes(fetched);
      if (newCasteName) {
        const newlyAdded = fetched.find((ct) => ct.casteName === newCasteName);
        if (newlyAdded) {
          setSelectedCaste(newCasteName);
          setCasteId(newlyAdded.key);
          setSelectedSubCasteCasteId(newlyAdded.key);
          form.setFieldsValue({ caste: newlyAdded.casteName });
        }
      }
    } catch (err) {
      console.log("About to set caste as empty");
      setCastes([]);
      console.error("Error fetching castes: ", err);
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
      setCasteCategories(fetchedCasteCategories);
    } catch (error) {
      console.error("Error fetching caste categories: ", error);
      setCasteCategories([]);
    }
  };

  // 6. FETCH SUBCASTES
  const fetchSubCastesData = async (cId: number) => {
    try {
      const response = await fetchSubCaste(parseInt(selectedElectionId), cId);
      const fetched =
        response?.data?.data
          ?.map((sc: any) => ({
            key: sc.subCasteId,
            subCasteName: sc.subCasteName,
            casteName: sc.casteName,
            religionName: sc.religionName,
            orderIndex: sc.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex) || [];
      setSubCastes(fetched);
      if (newSubCasteName) {
        const newlyAdded = fetched.find(
          (sub) => sub.subCasteName === newSubCasteName
        );
        if (newlyAdded) {
          setSelectedSubCaste(newSubCasteName);
          setSubCasteId(newlyAdded.key);
          form.setFieldsValue({ sub_caste: newlyAdded.subCasteName });
        }
      }
    } catch (err) {
      console.error("Error fetching sub-castes: ", err);
      setSubCastes([]);
    }
  };

  // 7. FETCH AVAILABILITY
  const fetchAvailabilityData = async () => {
    // setLoading(true);
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
          .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex)
      );
    } catch (error) {
      console.error("Error fetching availabilities:", error);
    } finally {
      // setLoading(false);
    }
  };

  // 8. FETCH BENEFIT-SCHEMES
  const fetchSchemeData = async () => {
    // setLoading(true);
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      const schemeData = response.data
        ?.map((scheme) => ({
          key: scheme.id,
          schemeName: scheme.schemeName,
          imageUrl: scheme.imageUrl,
          schemeBy: scheme.schemeBy,
          orderIndex: scheme?.orderIndex,
        }))
        .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex);
      setSchemes(schemeData);
    } catch (error) {
      console.log("Error fetching benefit schemes", error);
    } finally {
      // setLoading(false);
    }
  };

  // FETCH LANGUAGE
  const fetchLanguageData = async () => {
    // setLoading(true);
    try {
      const response = await getLanguagesApi(parseInt(selectedElectionId));
      const languageData = response.data
        .map((lang: any) => ({
          key: lang.id,
          languageName: lang.languageName,
          orderIndex: lang?.orderIndex,
        }))
        .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex);
      setLanguages(languageData);
    } catch (error) {
      //message.error('Failed to fetch languages');
    } finally {
      // setLoading(false);
    }
  };

  // FETCH HISTORY
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

  //FETCH FEEDBACK
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

  // 9. FETCH PARTIES
  const fetchPartyData = async () => {
    try {
      // setLoading(true);
      const response = await fetchParties(electionId);
      const fetched =
        response?.data
          ?.map((p: any) => ({
            key: p.id,
            partyName: p.partyName,
            partyShortName: p.partyShortName,
            partyImage: p.partyImage,
            orderIndex: p.orderIndex,
          }))
          .sort((a: any, b: any) => a?.orderIndex - b?.orderIndex) || [];
      setParties(fetched);
      if (newPartyName) {
        const newlyAdded = fetched.find((p2) => p2.partyName === newPartyName);
        if (newlyAdded) {
          setSelectedParty(newPartyName);
          setAddedPartyKey(newlyAdded.key);
          form.setFieldsValue({ party_affiliation: newlyAdded.partyName });
        }
      }
    } catch (err) {
      console.error("Error fetching parties: ", err);
    } finally {
      // setLoading(false);
    }
  };

  // FETCH PART DATA
  const fetchPartData = async (): Promise<void> => {
    if (!selectedElectionId) return;
    try {
      // setLoading(true);
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
      // setLoading(false);
    }
  };

  // FETCH SECTION DATA
  const fetchSectionData = async () => {
    if (!selectedElectionId) return;
    try {
      // setLoading(true);
      const response = await getSectionsApi(parseInt(selectedElectionId));
      const validSections = Array.isArray(response.data?.data)
        ? response.data?.data
        : [];
      validSections?.sort((a, b) => a.sectionNo - b.sectionNo);
      setSections(validSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
    } finally {
      // setLoading(false);
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

    const currentPartNo = form.getFieldValue("boothNumber");
    const selectedSection = sections.find(
      (section) => section.sectionNo?.toString() === value.toString() && section.partNo?.toString() === currentPartNo?.toString()
    );

    console.log("selected section", selectedSection);

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

  // 10. ADD PARTY
  const handlePartyAdd = async () => {
    setModalLoading(true);
    const file = partyFileList[0]?.originFileObj;
    const partyColor = modalPartyForm.getFieldValue("partyColor");

    if (!newPartyName.trim() || !file) {
      message.error("Party name and image are required.");
      return;
    }
    try {
      await addParty(
        electionId,
        newAllianceName,
        newPartyName,
        newPartyShortName,
        partyColor,
        file
      );
      fetchPartyData();
      setNewPartyName("");
      setNewAllianceName("");
      setNewPartyShortName("");
      setPartyFileList([]);
      setIsPartyModalVisible(false);
    } catch (err) {
      console.error("Error adding party: ", err);
      message.error("Failed to add party. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };
  //11. ADD SCHEME
  const handleSchemeAdded = async (createdSchemeId) => {
    console.log("createdSchemeId", createdSchemeId);
    setNewSchemeId(createdSchemeId); // Set the ID of the newly added scheme
    await fetchSchemeData();
  };
  // 12. ADD AVAILABILITY
  const handleAvailabilityAdded = async (createdAvailabilityId: number) => {
    console.log("newAvailabilityId", newAvailabilityId);
    setNewAvailabilityId(createdAvailabilityId);
    await fetchAvailabilityData();
  };

  // 13. ADD LANGUAGE
  const handleLanguageAdded = async (createdLanguageId) => {
    setNewLanguageId(createdLanguageId);
    await fetchLanguageData();
  };

  const handleCasteCategoryAdded = async (createdCasteCategoryId) => {
    setNewCasteCategoryId(createdCasteCategoryId); // Set the ID of the newly added caste category
    await fetchCasteCategoryData();
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

  // 14. EFFECTS
  useEffect(() => {
    console.log("Useeffect 1");
    if (!visible) return;
    const fetchAllData = async () => {
      try {
        setLoadingModal(true);
        await Promise.all([
          fetchPartData(),
          fetchCombinedFieldOrder(),
          fetchCasteCategoryData(),
          fetchSectionData(),
          fetchReligionData(),
          fetchPartyData(),
          fetchSchemeData(),
          fetchAvailabilityData(),
          fetchLanguageData(),
          fetchHistoryData(),
          fetchFeedbackData(),
        ]);
      } catch (error) {
        console.error("Error loading modal data:", error);
      } finally {
        setLoadingModal(false);
      }
    };

    fetchAllData();
  }, [visible]);

  useEffect(() => {
    console.log("Useeffect 2");

    if (religionId) {
      console.log("Calling fetchCastesData inside useEffect");
      fetchCastesData(religionId);
    } else {
      setCastes([]);
    }
    console.log("ReligionId", religionId);
    setCasteId(null);
    setSubCastes([]);
  }, [religionId]);

  useEffect(() => {
    console.log("Useeffect 3");

    if (casteId) {
      fetchSubCastesData(Number(casteId));
    } else {
      setSubCastes([]);
    }
    setSubCasteId(null);
  }, [casteId]);

  useEffect(() => {
    console.log("Useeffect 4");

    if (selectedSubCasteReligionId && selectedSubCasteCasteId) {
      fetchSubCastesData(selectedSubCasteCasteId);
    } else {
      setSubCastes([]);
    }
  }, [selectedSubCasteReligionId, selectedSubCasteCasteId]);

  useEffect(() => {
    if (addedPartyKey && parties.length > 0) {
      const newlyAddedParty = parties.find((p) => p.key === addedPartyKey);
      if (newlyAddedParty) {
        form.setFieldsValue({ party_affiliation: newlyAddedParty.partyName });
      }
      setAddedPartyKey(null);
    }
    console.log("Form values after setFieldsValue:", form.getFieldsValue()); // Debugging
  }, [parties, addedPartyKey, form]);

  useEffect(() => {
    if (newSchemeId) {
      const newlyAddedScheme = schemes?.find(
        (scheme) => scheme.key === newSchemeId
      );
      console.log("newlyAddedScheme", newlyAddedScheme);
      if (newlyAddedScheme) {
        const existingSchemes = form.getFieldValue("scheme") || [];
        const updatedSchemes = Array.from(
          new Set([...existingSchemes, newlyAddedScheme.schemeName])
        );
        console.log("updatedSchemes", updatedSchemes);
        form.setFieldsValue({
          scheme: updatedSchemes,
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
    if (newAvailabilityId) {
      const newAvailability = availabilities.find(
        (avl) => avl.key === newAvailabilityId
      );
      console.log("New Availability", newAvailability);
      if (newAvailability) {
        form.setFieldsValue({
          availability: newAvailability.categoryName,
        });
        setNewAvailabilityId(null);
      }
    }
  }, [availabilities, newAvailabilityId]);

  useEffect(() => {
    console.log("Useeffect 5");

    if (isCasteModalVisible) {
      setSelectedReligionForCaste(religionId);
      console.log("ReligionId", religionId);
      modalCasteForm.setFieldsValue({ religion: religionId });
    }
  }, [isCasteModalVisible, religionId, form]);

  useEffect(() => {
    console.log("Useeffect 6");

    if (isSubCasteModalVisible) {
      setSelectedSubCasteReligionId(religionId);
      setSelectedSubCasteCasteId(Number(casteId));
      console.log("CasteId", casteId);

      modalSubCasteForm.setFieldsValue({
        religionId: religionId,
        casteId: casteId,
      });
    }
  }, [isSubCasteModalVisible, religionId, casteId, form]);

  useEffect(() => {
    if (selectedElectionId) {
      console.log(allElections);
      const selectedElection = allElections.find(
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
    if (newLanguageId) {
      console.log("newLanguageId", newLanguageId);
      const newLanguage = languages.find((lan) => lan?.key === newLanguageId);
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
      const newfeedback = feedbacks?.find((feed) => feed?.id === newFeedbackId);
      console.log("New Feedback", newfeedback);
      if (newfeedback) {
        const existingFeedbacks = form.getFieldValue("feedback") || [];
        const updatedFeedbacks = Array.from(
          new Set([...existingFeedbacks, newfeedback.issueName])
        );
        form.setFieldsValue({
          feedback: updatedFeedbacks,
        });
      }
      setNewFeedbackId(null);
    }
  }, [feedbacks]);

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
      }
      setNewHistoryId(null);
    }
  }, [histories]);

  // Pre-fill
  useEffect(() => {
    console.log("Useeffect 7");

    if (voter) {
      console.log("Voter Details", voter);
      console.log("Scheme Name", voter.scheme);
      setVoterImage(null);
      const initialFileList = voter.photo_url
        ? [
            {
              uid: "-1",
              name: "voterImage.jpg",
              status: "done",
              url: voter.photo_url,
            },
          ]
        : [];
      console.log("initialFileList", initialFileList);
      setPrevVoterId(voter.epic_number);
      setFileList(initialFileList);

      const matchedReligion = voter.religion
        ? religions.find(
            (rel: ReligionType) =>
              rel.id === voter.religion?.id ||
              rel.religionName === voter.religion?.religionName
          )
        : undefined;
      const matchedCaste = voter.caste
        ? castes.find(
            (c: Caste) =>
              c.key === voter.caste?.id ||
              c.casteName === voter.caste?.casteName
          )
        : undefined;
      const matchedSubCaste = voter.subCaste
        ? subCastes.find(
            (sub: SubCaste) =>
              sub.id === voter.subCaste?.id ||
              sub.subCasteName === voter.subCaste?.subCasteName
          )
        : undefined;

      const boothNumberStr =
        voter.boothNumber?.toString() ||
        voter.partNo?.toString() ||
        voter.partNumber?.toString();

      const sectionNoStr = voter.sectionNo?.toString();

      // Debug logging for religion values
      console.log("Debug religion values:", {
        voterReligion: voter.religion,
        matchedReligion: matchedReligion,
        religionFieldValue: matchedReligion
          ? { value: matchedReligion.key, label: matchedReligion.religionName }
          : voter.religion
          ? {
              value: voter.religion.id,
              label: voter.religion.religionName || String(voter.religion.id),
            }
          : undefined,
      });

      form.setFieldsValue({
        electionId: voter.electionId,
        gender: voter.gender,
        voterLati:
          voter.latitude || voter.voterLati === 0 ? null : voter.voterLati,
        voterLongi:
          voter.longitude || voter.voterLongi === 0 ? null : voter.voterLongi,
        epic_number: voter.epic_number,
        pageNumber: voter.pageNumber,
        voterFnameEn: voter.voterFnameEn,
        voterFnameL1: voter.voterFnameL1,
        voterLnameL1: voter.voterLnameL1,
        voterFnameL2: voter.voterFnameL2,
        voterLnameL2: voter.voterLnameL2,
        voterLnameEn: voter.voterLnameEn,
        //voter name
        date_of_birth: voter.dob ? moment(voter.dob) : null,
        anniversaryDate: voter.anniversaryDate
          ? moment(voter.anniversaryDate)
          : null,
        age: voter.age,
        mobileNo: voter.mobileNo,
        whatsapp_number: voter.whatsappNo,
        alternate_phone_number: voter.alternate_phone_number,
        email: voter.email,
        secondary_email: voter.secondary_email,
        fullAddress: voter.fullAddress,
        remarks: voter.remarks,
        // city: voter.address?.city || voter.city,
        state: voter.state,
        pincode: voter.pincode,
        availability: voter.availability1
          ? voter.availability1?.categoryName
          : null,
        starNumber: voter.starNumber,
        panNumber: voter.panNumber,
        aadhaarNumber: voter.aadhaarNumber,
        partyRegistrationNumber: voter.partyRegistrationNumber,
        religion: matchedReligion
          ? { value: matchedReligion.key, label: matchedReligion.religionName }
          : voter.religion
          ? {
              value: voter.religion.id,
              label: voter.religion.religionName || String(voter.religion.id),
            }
          : undefined, // Changed from null to undefined

        caste: matchedCaste
          ? { value: matchedCaste.key, label: matchedCaste.casteName }
          : voter.caste
          ? {
              value: voter.caste.id,
              label: voter.caste.casteName || String(voter.caste.id),
            }
          : undefined, // Changed from null to undefined
        sub_caste: matchedSubCaste
          ? { value: matchedSubCaste.key, label: matchedSubCaste.subCasteName }
          : voter.subCaste
          ? {
              value: voter.subCaste.id,
              label: voter.subCaste.subCasteName || String(voter.subCaste.id),
            }
          : undefined, // Changed from null to undefined
        // religion: voter.religion?.id,
        // // religionId: JSON.stringify(voter.religionId),
        // caste: voter.caste?.id,
        // // casteId: JSON.stringify(voter.casteId),
        // sub_caste: voter.subCaste?.id,
        boothNumber:
          voter.boothNumber?.toString() ||
          voter.partNo?.toString() ||
          voter.partNumber?.toString(),
        party_affiliation: voter.party?.partyName || voter.party_affiliation,
        // scheme: Array.isArray(voter.voterBenefitSchemes)
        //   ? voter.voterBenefitSchemes.map((item) => ({
        //       schemeId: item.benefitScheme.id,
        //       selected: item.selected,
        //     }))
        //   : [],
        // schemeStatuses: voter.voterBenefitSchemes.map((item) => ({
        //   schemeId: item.benefitScheme.id,
        //   selected: item.selected,
        // })),
        // scheme: voter.voterBenefitSchemes
        //   .filter((item) => item.selected !== null)
        //   .map((item) => item.benefitScheme.schemeName),
        feedback: Array.isArray(voter.feedbackIssues)
          ? voter.feedbackIssues.map((feed) => feed.issueName)
          : voter.feedbackIssues
          ? [voter.feedbackIssues.issueName]
          : [],
        voterHistory: Array.isArray(voter.voterHistories)
          ? voter.voterHistories.map((his) => his.voterHistoryName)
          : voter.voterHistories
          ? [voter.voterHistories.voterHistoryName]
          : [],
        // languages: voter.languages.map((lang) => lang.languageName),
        languages: voter.languages[0]?.languageName,
        casteCategory: voter.casteCategory?.casteCategoryName,
        third_party_id: voter.third_party_id,
        photo_url: voter.photo_url,
        pcNo: voter.pcNo || voter.pcNo,
        pcNameEn: voter.pcNameEn,
        pcNameL1: voter.pcNameL1,
        pcNameL2: voter.pcNameL2,
        localBody: voter.localBody,
        stateCode: voter.stateCode,
        // stateNameEn: voter.stateNameEn,
        stateNameL1: voter.stateNameL1,
        stateNameL2: voter.stateNameL2,
        acNo: voter.acNo,
        acNameEn: voter.acNameEn,
        acNameL1: voter.acNameL1,
        acNameL2: voter.acNameL2,
        sectionNo: voter.sectionNo?.toString(),
        serialNo: voter.serialNo,
        rlnFnameEn: voter.rlnFnameEn,
        rlnLnameEn: voter.rlnLnameEn,
        rlnFnameL1: voter.rlnFnameL1,
        rlnLnameL1: voter.rlnLnameL1,
        rlnFnameL2: voter.rlnFnameL2,
        rlnLnameL2: voter.rlnLnameL2,
        rlnType: voter.rlnType,
        urbanNameEn: voter.urbanNameEn || voter.urbanName,
        urbanNo: voter.urbanNo,
        urbanNameL1: voter.urbanNameL1,
        urbanNameL2: voter.urbanNameL2,
        urbanWardNo: voter.urbanWardNo,
        districtCode: voter.districtCode,
        // districtNo: voter.districtNo,
        districtNameEn: voter.districtNameEn,
        districtNameL1: voter.districtNameL1,
        districtNameL2: voter.districtNameL2,
        rurDistrictUnionNo: voter.rurDistrictUnionNo,
        rurDistrictUnionNameEn: voter.rurDistrictUnionNameEn,
        rurDistrictUnionNameL1: voter.rurDistrictUnionNameL1,
        rurDistrictUnionNameL2: voter.rurDistrictUnionNameL2,
        rurDistrictUnionWardNo: voter.rurDistrictUnionWardNo,
        panUnionNo: voter.panUnionNo,
        panUnionNameEn: voter.panUnionNameEn,
        panUnionNameL1: voter.panUnionNameL1,
        panUnionNameL2: voter.panUnionNameL2,
        panUnionWardNo: voter.panUnionWardNo,
        villPanNo: voter.villPanNo,
        villPanNameEn: voter.villPanNameEn,
        villPanNameL1: voter.villPanNameL1,
        villPanNameL2: voter.villPanNameL2,
        villPanWardNo: voter.villPanWardNo,
        partLati: voter.partLati,
        partLong: voter.partLong,
        partNo: voter.partNo || voter.boothNumber || voter.booth_number,
        partNameEn: voter.partNameEn,
        partNameL1: voter.partNameL1,
        partNameL2: voter.partNameL2,
        houseNoEn: voter.houseNoEn,
        houseNoL1: voter.houseNoL1,
        houseNoL2: voter.houseNoL2,
      });

      if (voter?.voterBenefitSchemes) {
        const initialSchemeStatuses = voter.voterBenefitSchemes.map((item) => ({
          schemeId: item.benefitScheme.id,
          selected: item.selected,
        }));

        const initialSchemeIds = voter.voterBenefitSchemes
          .filter((item) => item.selected)
          .map((item) => item.benefitScheme.id);

        form.setFieldsValue({
          schemeStatuses: initialSchemeStatuses,
          scheme: initialSchemeIds,
        });
      }

      //  Fill dependent fields for boothNumber (part)
      const selectedPart = parts?.find(
        (part) => part.partNo?.toString() === boothNumberStr
      );
      if (selectedPart) {
        form.setFieldsValue({
          partNameEn: selectedPart.partNameEnglish || "",
          partNameL1: selectedPart.partNameL1 || "",
          pincode: selectedPart.pincode || "",
          partLati: selectedPart.partLat || "",
          partLong: selectedPart.partLong || "",
        });
      } else {
        form.setFieldsValue({
          partNameEn: undefined,
          partNameL1: undefined,
          pincode: undefined,
          partLati: undefined,
          partLong: undefined,
        });
      }

      // Fill dependent fields for sectionNo
      const selectedSection = sections?.find(
        (s) => s.sectionNo?.toString() === sectionNoStr && s.partNo?.toString() === boothNumberStr
      );
      if (selectedSection) {
        form.setFieldsValue({
          sectionNameEn: selectedSection.sectionNameEn || "",
          sectionNameL1: selectedSection.sectionNameL1 || "",
          sectionNameL2: selectedSection.sectionNameL2 || "",
        });
      } else {
        form.setFieldsValue({
          sectionNameEn: undefined,
          sectionNameL1: undefined,
          sectionNameL2: undefined,
        });
      }

      // Set the state variables for religion, caste, and subcaste
      if (matchedReligion) {
        setReligionId(matchedReligion.key || matchedReligion.id);
      } else {
        setReligionId(null);
      }

      if (matchedCaste) {
        setCasteId(matchedCaste.key || matchedCaste.id);
      } else {
        setCasteId(null);
      }

      if (matchedSubCaste) {
        setSubCasteId(matchedSubCaste.key || matchedSubCaste.id);
      } else {
        setSubCasteId(null);
      }

      //setting dynamic fields
      if (voter.dynamicFields && typeof voter.dynamicFields === "object") {
        const parsedFields: Record<string, any> = {};

        for (const [key, value] of Object.entries(voter.dynamicFields)) {
          if (typeof value === "string" && value.includes(",")) {
            // convert comma-separated string to array
            parsedFields[key] = value.split(",").map((v) => v.trim());
          } else {
            parsedFields[key] = value;
          }
        }
        console.log("Parsed values", parsedFields);

        form.setFieldsValue(parsedFields);
      }

      // Explicitly clear religion-related form fields if there's no data
      // if (!voter.religion) {
      //   console.log("Explicitly clearing religion field because voter.religion is null");
      //   form.setFieldValue("religion", undefined);
      //   form.resetFields(["religion"]);
      //   // Force clear after a small delay to ensure Select component is properly cleared
      //   setTimeout(() => {
      //     form.setFieldValue("religion", undefined);
      //   }, 100);
      // }
      // if (!voter.caste) {
      //   console.log("Explicitly clearing caste field because voter.caste is null");
      //   form.setFieldValue("caste", undefined);
      //   form.resetFields(["caste"]);
      //   setTimeout(() => {
      //     form.setFieldValue("caste", undefined);
      //   }, 100);
      // }
      // if (!voter.subCaste) {
      //   console.log("Explicitly clearing sub_caste field because voter.subCaste is null");
      //   form.setFieldValue("sub_caste", undefined);
      //   form.resetFields(["sub_caste"]);
      //   setTimeout(() => {
      //     form.setFieldValue("sub_caste", undefined);
      //   }, 100);
      // }
    }
  }, [
    voter,
    form,
    parts,
    sections,
    //  religions, castes, subCastes
  ]);

  useEffect(() => {
    console.log("Useeffect 8");

    if (voter?.religion && religions.length > 0 && !religionId) {
      const matchedReligion = religions.find(
        (religion) => religion.religionName === voter.religion.religionName
      );
      console.log("Matched religion", matchedReligion);
      if (matchedReligion) {
        setReligionId(matchedReligion.key); // Assuming the religion object has an `key`
      }
    }
    // else {
    //   // Reset religionId when voter.religion is null
    //   setReligionId(null);
    // }
  }, [voter?.religion, religions]);

  useEffect(() => {
    console.log("Useeffect 9");
    if (voter?.caste && castes.length > 0) {
      const matchedCaste = castes.find(
        (caste) => caste.casteName === voter.caste.casteName
      );
      if (matchedCaste) {
        setCasteId(matchedCaste.key); // Assuming the caste object has an `key`
      }
    }
    // else {
    //   // Reset casteId when voter.caste is null
    //   setCasteId(null);
    // }
  }, [voter?.caste, castes]);

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
        // message.error("Only JPG, JPEG, or PNG files are allowed!");
        return false;
      }
      if (!isSizeValid) {
        // message.error("File size must be less than 1MB!");
        return false;
      }
      return true;
    });
    setFileList(filteredList);
    if (filteredList.length > 0) {
      setVoterImage(filteredList);
    }
    if (newFileList.length === 0) {
      setVoterImage(null);
    }
  };

  const handlePreview = async (file) => {
    let preview = file.url || file.preview;

    // If the file is a new upload and doesn't have a preview URL, generate one
    if (!preview && file.originFileObj) {
      preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e?.target.result);
        reader.readAsDataURL(file.originFileObj);
      });
    }

    Modal.info({
      title: "Preview",
      content: (
        <img alt="file preview" style={{ width: "100%" }} src={preview} />
      ),
      onOk() {},
    });
  };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleVoterVideoUpload = (file) => {
    setVideoFile(file);
    return false; // Prevent auto-upload
  };

  const handleVideoChange = ({ file }: any) => {
    const realFile = file.originFileObj || file;

    const isLt10M = realFile.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("Video must be smaller than 10MB!");
      return;
    }

    const previewUrl = URL.createObjectURL(realFile);
    setVideoPreview(previewUrl);
  };

  const handleOk = async () => {
    setLoadingModal(true);
    form
      .validateFields()
      .then((values) => {
        console.log("Values submitted in form", values);

        // Only include voterImage if a new image has been uploaded
        const voterImageToUse = fileList[0]?.originFileObj || voterImage;

        const relationName = [
          values.rlnFnameEn?.trim() || "",
          values.rlnLnameEn?.trim() || "",
        ]
          .filter(Boolean)
          .join(" ");

        console.log("Image url", fileList[0]?.originFileObj);

        const dynamicFieldsList: any = {};

        // Assuming you have an array of dynamic field definitions
        dynamicFields.forEach((field) => {
          if (
            values[field.name] !== undefined &&
            values[field.name] !== null &&
            values[field.name] !== ""
          ) {
            dynamicFieldsList[field.name || field.label] = values[field.name];
          }
        });
        console.log("Dynamic fields list", dynamicFieldsList);

        let religionData = values.religion || "";
        let religionId = null;
        let religionObject = null;

        if (values.religion) {
          if (typeof values.religion === "object") {
            // If it's already an object, use it directly
            religionData =
              values.religion.religionName ||
              values.religion.name ||
              values.religion.toString();
            religionId = values.religion.key || values.religion.id || null;
            religionObject = values.religion;
          } else if (religions && Array.isArray(religions)) {
            // Find the matching religion object
            const matchingReligion = religions.find(
              (rel) =>
                rel.religionName === values.religion ||
                rel.name === values.religion
            );
            if (matchingReligion) {
              religionData = matchingReligion.religionName;
              religionId = matchingReligion.key || matchingReligion.id || null;
              religionObject = matchingReligion;
            }
          }
        }

        // Process caste data
        let casteData = values.caste || "";
        let casteId = null;
        let casteObject = null;

        if (values.caste) {
          if (typeof values.caste === "object") {
            // If it's already an object, use it directly
            casteData =
              values.caste.casteName ||
              values.caste.name ||
              values.caste.toString();
            casteId = values.caste.key || values.caste.id || null;
            casteObject = values.caste;
          } else if (castes && Array.isArray(castes)) {
            // Find the matching caste object
            const matchingCaste = castes.find(
              (cst) =>
                cst.casteName === values.caste || cst.name === values.caste
            );
            if (matchingCaste) {
              casteData = matchingCaste.casteName;
              casteId = matchingCaste.key || matchingCaste.id || null;
              casteObject = matchingCaste;
            }
          }
        }

        // Process subcaste data
        let subcasteData = values.sub_caste || "";
        let subcasteId = null;
        let subcasteObject = null;

        if (values.sub_caste) {
          if (typeof values.sub_caste === "object") {
            // If it's already an object, use it directly
            subcasteData =
              values.sub_caste.subCasteName ||
              values.sub_caste.name ||
              values.sub_caste.toString();
            subcasteId = values.sub_caste.key || values.sub_caste.id || null;
            subcasteObject = values.sub_caste;
          } else if (subCastes && Array.isArray(subCastes)) {
            // Find the matching subcaste object
            const matchingSubCaste = subCastes.find(
              (sub) =>
                sub.subCasteName === values.sub_caste ||
                sub.name === values.sub_caste
            );
            if (matchingSubCaste) {
              subcasteData = matchingSubCaste.subCasteName;
              subcasteId = matchingSubCaste.key || matchingSubCaste.id || null;
              subcasteObject = matchingSubCaste;
            }
          }
        }

        // Process availability data
        const availabilityValue = values.availability
          ? typeof values.availability === "object"
            ? values.availability?.categoryName ||
              values.availability?.name ||
              values.availability?.value ||
              null
            : values.availability
          : null;

        // Extract availability ID
        let availabilityId = null;
        if (typeof values.availability === "object") {
          availabilityId =
            values.availability?.key || values.availability?.id || null;
          console.log("Got availability ID from object:", availabilityId);
        } else if (availabilities && Array.isArray(availabilities)) {
          const matchingAvailability = availabilities.find(
            (avail) =>
              avail?.categoryName === availabilityValue ||
              avail?.name === availabilityValue
          );
          if (matchingAvailability) {
            availabilityId =
              matchingAvailability.key || matchingAvailability.id || null;
            console.log("Found availability ID from array:", availabilityId);
          }
        }

        let benefitSchemeIds = [];

        // if (values.scheme) {
        //   if (Array.isArray(values.scheme)) {
        //     // If multiple schemes are selected as strings, find their IDs from the schemes array
        //     benefitSchemeIds = values.scheme
        //       .map((schemeName) => {
        //         const matchingScheme = schemes.find(
        //           (scheme) => scheme.schemeName === schemeName
        //         );
        //         return matchingScheme
        //           ? matchingScheme.key || matchingScheme.id
        //           : null;
        //       })
        //       .filter((id) => id !== null && id !== undefined);
        //   } else if (typeof values.scheme === "object") {
        //     // If it's a single object, extract ID
        //     benefitSchemeIds = [values.scheme.key || values.scheme.id].filter(
        //       Boolean
        //     );
        //   } else if (schemes && Array.isArray(schemes)) {
        //     // If it's a single string, find the matching scheme and extract ID
        //     const matchingScheme = schemes.find(
        //       (scheme) =>
        //         scheme.schemeName === values.scheme ||
        //         scheme.name === values.scheme
        //     );
        //     if (matchingScheme) {
        //       benefitSchemeIds = [
        //         matchingScheme.key || matchingScheme.id,
        //       ].filter(Boolean);
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

        // Process caste category data
        let casteCategoryData = values.casteCategory || "";
        let casteCategoryId = null;

        if (values.casteCategory) {
          if (typeof values.casteCategory === "object") {
            // If it's an object, extract its name & ID
            casteCategoryData =
              values.casteCategory.casteCategoryName ||
              values.casteCategory.name ||
              values.casteCategory?.toString();
            casteCategoryId =
              values.casteCategory.key || values.casteCategory.id || null;
          } else if (casteCategories && Array.isArray(casteCategories)) {
            // Find the matching language ID
            const matchingCasteCategory = casteCategories.find(
              (cst) =>
                cst.casteCategoryName === values.casteCategory ||
                cst.name === values.casteCategory
            );
            if (matchingCasteCategory) {
              casteCategoryId =
                matchingCasteCategory.key || matchingCasteCategory.id || null;
            }
          }
        }
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
            feedbackIssueIds = [
              values.feedback.key || values.feedback.id,
            ].filter(Boolean);
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

        // Process party affiliation
        const partyValue =
          typeof values.party_affiliation === "object"
            ? values.party_affiliation?.partyName ||
              values.party_affiliation?.name ||
              values.party_affiliation?.value ||
              ""
            : values.party_affiliation || "";

        // Extract party ID
        let partyId = null;
        if (typeof values.party_affiliation === "object") {
          partyId =
            values.party_affiliation?.key ||
            values.party_affiliation?.id ||
            null;
          console.log("Got party ID from object:", partyId);
        } else if (parties && Array.isArray(parties)) {
          const matchingParty = parties.find(
            (party) =>
              party.partyName === partyValue || party.name === partyValue
          );
          if (matchingParty) {
            partyId = matchingParty.key || matchingParty.id || null;
            console.log("Found party ID from array:", partyId);
          }
        }

        // Process languages data
        let languageData = values.languages || "";
        let languageId = null;

        if (values.languages) {
          if (typeof values.languages === "object") {
            // If it's an object, extract its name & ID
            languageData =
              values.languages.languageName ||
              values.languages.name ||
              values.languages.toString();
            languageId = values.languages.key || values.languages.id || null;
          } else if (languages && Array.isArray(languages)) {
            // Find the matching language ID
            const matchingLang = languages.find(
              (lang) =>
                lang.languageName === values.languages ||
                lang.name === values.languages
            );
            if (matchingLang) {
              languageId = matchingLang.key || matchingLang.id || null;
            }
          }
        }

        const updatedVoter = {
          ...values,
          age: parseInt(values.age),
          electionId: selectedElectionId,
          prev_epic_number: prevVoterId,
          epic_number: values.epic_number,
          pageNumber: values.pageNumber,
          dob: values.date_of_birth
            ? values.date_of_birth.format("YYYY-MM-DD")
            : null,
          partyAffiliation: partyValue,
          partyId: partyId,
          languages: languageData, //  String
          languageId: languageId, //  Single ID, not an array
          // benefitSchemeIds: benefitSchemeIds,
          benefitSchemeStatuses: benefitSchemeStatuses,
          casteCategoryId: casteCategoryId,
          feedbackIssueIds: feedbackIssueIds,
          voterHistoryIds: voterHistoryIds,
          availability: availabilityValue,
          availabilityId: availabilityId,
          email: values.email,
          fullAddress: values.fullAddress,
          mobileNo: values.mobileNo,
          whatsappNo: values.whatsapp_number,
          booth_number: values.boothNumber,
          partNo: values.boothNumber,
          serialNo: values.serialNo,
          remarks: values.remarks,

          starNumber: values.starNumber,
          panNumber: values.panNumber,
          aadhaarNumber: values.aadhaarNumber,
          partyRegistrationNumber: values.partyRegistrationNumber,

          // religion,caste and subcaste
          // religion: values.religion,
          // religionId: values.religionId ? JSON.parse(values.religionId) : {},
          // caste: values.caste,
          // casteId: values.casteId ? JSON.parse(values.casteId) : {},
          // subcaste: values.sub_caste,
          religion: religionObject || religionData,
          religionId: religionId,
          caste: casteObject || casteData,
          casteId: casteId,
          subcaste: subcasteObject || subcasteData,
          subcasteId: subcasteId,

          // latitude and longitude
          latitude: values.voterLati,
          voterLongi: values.voterLongi,
          voterLati: values.voterLati,
          // voterImage: voterImage || fileList[0]?.originFileObj,
          voterImage: voterImageToUse,
          imageRemoved: fileList.length === 0 && voter?.photo_url ? true : false,

          // --------------------------------
          // pc values
          pcNo: values.pcNo,
          pcNameEn: values.pcNameEn,
          pcNameL1: values.pcNameL1,
          pcNameL2: values.pcNameL2,

          // ac values
          acNo: values.acNo,
          acNameEn: values.acNameEn,
          acNameL1: values.acNameL1,
          acNameL2: values.acNameL2,

          //state values
          stateCode: values.stateCode,
          state: values.state,
          stateNameEn: values.stateNameEn,
          stateNameL1: values.stateNameL1,
          stateNameL2: values.stateNameL2,

          //section values
          sectionNo: values.sectionNo,
          sectionNameEn: values.sectionNameEn,
          sectionNameL1: values.sectionNameL1,
          sectionNameL2: values.sectionNameL2,

          //relation values
          relationName: relationName,
          rlnType: values.rlnType,
          rlnFnameEn: values.rlnFnameEn,
          rlnLnameEn: values.rlnLnameEn,
          rlnFnameL1: values.rlnFnameL1,
          rlnLnameL1: values.rlnLnameL1,
          rlnFnameL2: values.rlnFnameL2,
          rlnLnameL2: values.rlnLnameL2,

          //urban values
          urbanNameEn: values.urbanNameEn,
          urbanNo: values.urbanNo,
          urbanNameL1: values.urbanNameL1,
          urbanNameL2: values.urbanNameL2,
          urbanWardNo: values.urbanWardNo,
          // district values
          districtCode: values.districtCode,
          districtNameEn: values.districtNameEn,
          districtNameL1: values.districtNameL1,
          districtNameL2: values.districtNameL2,
          // district union values
          rurDistrictUnionNo: values.rurDistrictUnionNo,
          rurDistrictUnionNameEn: values.rurDistrictUnionNameEn,
          rurDistrictUnionNameL1: values.rurDistrictUnionNameL1,
          rurDistrictUnionNameL2: values.rurDistrictUnionNameL2,
          rurDistrictUnionWardNo: values.rurDistrictUnionWardNo,
          // panchayat union values
          panUnionNo: values.panUnionNo,
          panUnionNameEn: values.panUnionNameEn,
          panUnionNameL1: values.panUnionNameL1,
          panUnionNameL2: values.panUnionNameL2,
          panUnionWardNo: values.panUnionWardNo,

          // village panchayat values
          villPanNo: values.villPanNo,
          villPanNameEn: values.villPanNameEn,
          villPanNameL1: values.villPanNameL1,
          villPanNameL2: values.villPanNameL2,
          villPanWardNo: values.villPanWardNo,

          //part values
          partLati: values.partLati,
          partLong: values.partLong,
          partNameEn: values.partNameEn,
          partNameL1: values.partNameL1,
          partNameL2: values.partNameL2,

          //house number values
          houseNoEn: values.houseNoEn,
          houseNoL1: values.houseNoL1,
          houseNoL2: values.houseNoL2,
          dynamicFields: dynamicFieldsList,
        };

        console.log("Final updated voter data:", updatedVoter);
        onUpdate(updatedVoter);
      })
      .catch((errorInfo) => {
        console.error("Validation Failed:", errorInfo);
        setLoadingModal(false);

        if (errorInfo?.errorFields?.length > 0) {
          const errorMessages = errorInfo.errorFields
            .map((field: any, index: number) => {
              const errorText = field.errors?.[0] || "Invalid input";
              return `${index + 1}. ${errorText}`;
            })
            .join("\n");

          message.error({
            content: `Please correct the following errors:\n${errorMessages}`,
            duration: 6,
            style: { whiteSpace: "pre-line" }, // Makes \n work
          });
        } else {
          message.error("Please correct the errors in the form.");
        }
      });
  };

  return (
    <>
      <Modal
        open={visible}
        title="Edit Voter Details"
        onCancel={onCancel}
        onOk={handleOk}
        okText="Update"
        okButtonProps={{
          loading: loadingModal,
          disabled: loadingModal,
          style: {
            backgroundColor: "#1677ff",
            borderColor: "#1677ff",
            color: "#fff",
          },
        }}
        width={1200}
        style={{ top: 20 }}
        forceRender
      >
        <Form
          form={form}
          className="mt-8"
          onValuesChange={(changedValues, allValues) => {
            console.log("Changed Values:", changedValues);
            console.log("All Form Values:", allValues);
          }}
          layout="vertical"
          scrollToFirstError
        >
          <Collapse
            bordered={false}
            expandIconPosition="end"
            className="bg-transparent custom-collapse"
            defaultActiveKey={["1", "2", "3", "4", "5", "6"]}
          >
            {/* Panel 1: ELECTION COMMISSION DATA */}
            <Panel
              key="1"
              header={
                <h3 className="text-[18px] leading-5 underline font-semibold text-[#1C1C1C]">
                  Election Commission Data
                </h3>
              }
            >
              <ElectionCommissionDataPanel
                handleBoothChange={handleBoothChange}
                handleSectionChange={handleSectionChange}
                handlePreview={handlePreview}
                setFileList={setFileList}
                validateImageBeforeCrop={validateImageBeforeCrop}
                fileList={fileList}
                handleFileChange={handleFileChange}
                dummyRequest={dummyRequest}
                type={"edit"}
                validateDecimalPlaces={validateDecimalPlaces}
                handleVoterVideoUpload={handleVoterVideoUpload}
                handleVideoChange={handleVideoChange}
                videoFile={videoFile}
                videoPreview={videoPreview}
                setVideoFile={setVideoFile}
                setVideoPreview={setVideoPreview}
              />
            </Panel>

            {/* Panel 2: VOTER PERSONAL INFORMATION */}
            <Panel
              key="2"
              header={
                <h3 className="text-[18px] leading-5 underline font-semibold text-[#1C1C1C]">
                  Voter Personal Information
                </h3>
              }
            >
              <VoterPersonalInfoPanel
                form={form}
                selectedElectionId={selectedElectionId}
                detectLocation={detectLocation}
                dynamicFields={dynamicFields}
                validateDecimalPlaces={validateDecimalPlaces}
                isDetectingLocation={isDetectingLocation}
                religions={religions}
                religionId={religionId}
                setReligionId={setReligionId}
                setSelectedReligion={setSelectedReligion}
                castes={castes}
                casteCategories={casteCategories}
                subCastes={subCastes}
                casteId={casteId}
                setCasteId={setCasteId}
                subCasteId={subCasteId}
                setSubCasteId={setSubCasteId}
                parties={parties}
                availabilities={availabilities}
                schemes={schemes}
                feedbacks={feedbacks}
                languages={languages}
                histories={histories}
                fieldsOrder={savedFields}
                setIsSchemeModalOpen={setIsSchemeModalOpen}
                setIsAvailabilityModalOpen={setIsAvailabilityModalOpen}
                setIsReligionModalVisible={setIsReligionModalVisible}
                setIsCasteModalVisible={setIsCasteModalVisible}
                setIsCasteCategoryModalVisible={setIsCasteCategoryModalVisible}
                setIsSubCasteModalVisible={setIsSubCasteModalVisible}
                setIsPartyModalVisible={setIsPartyModalVisible}
                setIsLanguageModalVisible={setIsLanguageModalVisible}
                setIsFeedbackModalVisible={setIsFeedbackModalVisible}
                setIsHistoryModalVisible={setIsHistoryModalVisible}
              />
            </Panel>

            {/* Panel 3: STATE & DISTRICT INFO */}
            <Panel
              key="3"
              header={
                <h3 className="text-[18px] leading-5 underline font-semibold text-[#1C1C1C]">
                  State & District Information
                </h3>
              }
            >
              <StateDistrictInfoPanel />
            </Panel>

            {/* Panel 4: PC & AC INFO */}
            <Panel
              key="4"
              header={
                <h3 className="text-[18px] leading-5 underline font-semibold text-[#1C1C1C]">
                  PC & AC Information
                </h3>
              }
            >
              <PCACInfoPanel type="edit" />
            </Panel>

            {/* Panel 5: URBAN */}
            <Panel
              key="5"
              header={
                <h3 className="text-[18px] leading-5 underline font-semibold text-[#1C1C1C]">
                  Urban Local Body Information
                </h3>
              }
            >
              <UrbanLocalBodyInfoPanel type="edit" />
            </Panel>

            {/* Panel 6: RURAL */}
            <Panel
              key="6"
              header={
                <h3 className="text-[18px] leading-5 underline font-semibold text-[#1C1C1C]">
                  Rural Local Body Information
                </h3>
              }
            >
              <RuralLocalBodyInfoPanel />
            </Panel>
          </Collapse>
        </Form>
      </Modal>

      {/* Add Religion Modal */}
      <Modal
        title="Add Religion"
        open={isReligionModalVisible}
        onCancel={() => {
          setIsReligionModalVisible(false);
          setReligionFileList([]);
          setNewReligionName("");
        }}
        onClose={() => setIsReligionModalVisible(false)}
        okButtonProps={{
          loading: modalLoading,
          disabled: modalLoading,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
        onOk={async () => {
          setModalLoading(true);

          if (!newReligionName.trim()) {
            message.error("Religion name cannot be empty.");
            return;
          }
          const file = religionFileList[0]?.originFileObj;
          if (!file) {
            message.error("Religion image cannot be empty.");
            return;
          }
          const religionColor =
            modalReligionForm.getFieldValue("religionColor");

          const formData = new FormData();
          formData.append("religionName", newReligionName);
          formData.append("religionImage", file);
          if (religionColor) {
            formData.append("religionColor", religionColor);
          }

          try {
            const response = await addReligion(
              formData,
              parseInt(selectedElectionId)
            );
            let content = response?.data?.data;
            console.log("response after creating a new religion", content);
            setReligionId(content?.id);
            setSelectedReligionForCaste(content?.id);
            setIsReligionModalVisible(false);
            setReligionFileList([]);
            await fetchReligionData(newReligionName);
            setNewReligionName("");
            modalCasteForm.setFieldsValue({ religion: content?.id });
            form.setFieldValue("sub_caste", null);
            form.setFieldValue("caste", null);
          } catch (error) {
            console.error("Error adding religion:", error);
          } finally {
            setModalLoading(false);
          }
        }}
      >
        <Form form={modalReligionForm} layout="vertical">
          <Form.Item label="Religion Name" required>
            <Input
              placeholder="Enter Religion Name"
              value={newReligionName}
              onChange={(e) => setNewReligionName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Religion Color" name="religionColor">
            <ColorPicker
              showText
              onChange={(color) => {
                modalReligionForm.setFieldsValue({
                  religionColor: color.toHexString(),
                });
              }}
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

      {/* Add Caste Modal */}
      <Modal
        title="Add Caste"
        open={isCasteModalVisible}
        onCancel={() => {
          setIsCasteModalVisible(false);
          setNewCasteName("");
        }}
        okButtonProps={{
          style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
        }}
        onOk={async () => {
          if (!selectedReligionForCaste || !newCasteName.trim()) {
            message.error("Please select a religion and enter a caste name.");
            return;
          }
          try {
            console.log("electionId", selectedElectionId);
            await addCaste(
              newCasteName,
              selectedReligionForCaste,
              parseInt(selectedElectionId)
            );

            setIsCasteModalVisible(false);
            setNewCasteName("");
            if (religionId) {
              console.log("Calling fetchCastesData inside add caste modal");
              fetchCastesData(religionId);
              const latestCaste = castes.find(
                (c) => c.casteName === newCasteName
              );
              if (latestCaste) {
                setCasteId(latestCaste.key);
                setSelectedSubCasteCasteId(latestCaste.key);
              }
            }

            form.setFieldValue("sub_caste", null);
            modalCasteForm.resetFields();
          } catch (error) {
            console.error("Error adding caste:", error);
          }
        }}
      >
        <Form
          form={modalCasteForm}
          layout="vertical"
          initialValues={{ religion: religionId }}
        >
          <Form.Item name="religion" label="Select Religion">
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              disabled
            >
              {religions.map((r) => (
                <Option key={r.key} value={r.key}>
                  {r.religionName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Caste Name">
            <Input
              placeholder="Enter Caste Name"
              value={newCasteName}
              onChange={(e) => setNewCasteName(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Sub-Caste Modal */}
      <Modal
        title="Add Sub-Caste"
        open={isSubCasteModalVisible}
        onCancel={() => {
          setIsSubCasteModalVisible(false);
          setNewSubCasteName("");
          modalSubCasteForm.resetFields();
        }}
        onClose={() => setIsSubCasteModalVisible(false)}
        onOk={async () => {
          if (
            !selectedSubCasteReligionId ||
            !selectedSubCasteCasteId ||
            !newSubCasteName.trim()
          ) {
            message.error(
              "Please select a religion, caste and enter a subcaste name."
            );
            return;
          }
          try {
            await addSubCaste(
              newSubCasteName,
              selectedSubCasteCasteId,
              selectedSubCasteReligionId,
              parseInt(selectedElectionId)
            );
            setIsSubCasteModalVisible(false);
            setNewSubCasteName("");
            fetchSubCastesData(selectedSubCasteCasteId);
            modalSubCasteForm.resetFields();
          } catch (error) {
            console.error("Error adding sub-caste:", error);
          }
        }}
        okButtonProps={{
          style: { backgroundColor: "#1D4ED8", color: "white" },
        }}
      >
        <Form
          form={modalSubCasteForm}
          initialValues={{ religionId: religionId, casteId: casteId }}
          layout="vertical"
        >
          <Form.Item name="subCasteName" label="Sub-Caste Name">
            <Input
              placeholder="Enter Sub-Caste Name"
              value={newSubCasteName}
              onChange={(e) => setNewSubCasteName(e.target.value)}
            />
          </Form.Item>
          <Form.Item name="religionId" label="Religion">
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              disabled
            >
              {religions.map((r) => (
                <Option key={r.key} value={r.key}>
                  {r.religionName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="casteId" label="Caste">
            {castes.length > 0 ? (
              <Select
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase().includes(input.toLowerCase())
                }
                disabled
              >
                {castes.map((c) => (
                  <Option key={c.key} value={c.key}>
                    {c.casteName}
                  </Option>
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
        </Form>
      </Modal>

      {/* Add Party Modal */}
      <Modal
        title="Add Party"
        open={isPartyModalVisible}
        onCancel={() => {
          setIsPartyModalVisible(false);
          setPartyImage(null);
          modalPartyForm.resetFields();
        }}
        onOk={handlePartyAdd}
        okButtonProps={{
          loading: modalLoading,
          disabled: modalLoading,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
      >
        <Form form={modalPartyForm} layout="vertical">
          <Form.Item label={"New Alliance Name"} name="allianceName">
            <Input
              placeholder="Enter alliance name"
              value={newAllianceName}
              autoFocus={true}
            />
          </Form.Item>
          <Form.Item label="New Party Name" required name="partyName">
            <Input
              placeholder="Enter Party Name"
              value={newPartyName}
              onChange={(e) => setNewPartyName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Party Short Name" required name="partyShortName">
            <Input
              placeholder="Enter Party Short Name"
              value={newPartyShortName}
              onChange={(e) => setNewPartyShortName(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Party Color" name="partyColor">
            <ColorPicker
              showText
              onChange={(color) => {
                modalPartyForm.setFieldsValue({
                  partyColor: color.toHexString(),
                });
              }}
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
                  loading: modalLoading,
                  disabled: modalLoading,
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
};

export default EditVoterModal;
