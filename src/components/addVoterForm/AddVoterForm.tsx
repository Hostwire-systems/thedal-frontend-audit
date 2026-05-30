import { useState, useEffect, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import dayjs from "dayjs";
import {
  Col,
  Row,
  Form,
  Input,
  DatePicker,
  Upload,
  Button,
  Select,
  Collapse,
  Modal,
  message,
  Spin,
  InputNumber,
  AutoComplete,
  Checkbox,
  Radio,
  Card,
  ColorPicker,
} from "antd";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { VoterHistory } from "../../types/history";
import { FeedbackType } from "../../types/feedback";
import {
  DownOutlined,
  PlusOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { useLocation } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { fetchReligion, addReligion } from "../../api/religionApi";
import { fetchCaste, addCaste } from "../../api/casteApi";
import { fetchSubCaste, addSubCaste } from "../../api/subCasteApi";
import { fetchParties, addParty } from "../../api/partyApi";
import { getLanguagesApi } from "../../api/languageApi";
import { indianStates as stateOptions } from "../../pages/welcome/step3/Step3";
import "./AddVoterForm.css";
import moment from "moment";
import RuralLocalBodyPanel from "../addVoterAPI/RuralLocalBodyPanel";
import { getBenefitSchemesApi } from "../../api/benefitSchemeApi";
import AddSchemeModal from "./AddSchemeModal";
import { getAvailabilityApi } from "../../api/availabilityApi";
import AddAvailabilityModal from "./AddAvailabilityModal";
import StateAndDistrictPanel from "../../components/addVoterAPI/StateAndDistrictPanel";
import PCACInfoPanel from "../../components/editVoterForm/panels/PCACInfoPanel";
import UrbanLocalBodyInfoPanel from "../../components/editVoterForm/panels/UrbanLocalBodyInfoPanel";

//Import render dropdowns
import {
  renderReligionDropdown,
  renderCasteDropdown,
  renderCasteCategoryDropdown,
  renderSubCasteDropdown,
  renderPartyDropdown,
  SchemeDropdown,
  renderAvailabilityDropdown,
  renderLanguageDropdown,
  renderFeedbackDropdown,
  renderHistoryDropdown,
} from "./RenderDropdowns";
import AddLanguageModal from "./AddLanguageModal";
import { getPartsApi } from "../../api/partApi";
import { getSectionsApi } from "../../api/sectionApi";
import { fetchHistory } from "../../api/historyApi";
import { getFeedbackApi } from "../../api/feedbackApi";
import AddFeedbackModal from "./AddFeedbackModal";
import AddHistoryModal from "./AddHistoryModal";
import { CasteCategory } from "../../types/casteCategory";
import { fetchCasteCategories } from "../../api/casteCategoryApi";
import AddCasteCategoryModal from "./AddCasteCategoryModal";
import { getSavedFieldsApi } from "../../api/dynamicFieldApi";
import { getDynamicFieldsApi } from "../../api/dynamicFieldApi";
import CustomRadioGroup from "../../components/common/CustomRadioGroup";
import { normalizeApiFieldNameForConfig } from "../../api/voterApi";
import { getFieldStatus } from "../../api/voterFieldsApi";

const { Option } = Select;
const { Panel } = Collapse;

const colWidths = { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 };

type FieldConfig = {
  span: number;
  component: string;
  required: boolean;
  status: boolean;
};

interface PartData {
  partNo: string;
  partNameEnglish: string;
  partNameL1: string;
  partNameL2?: string;
  pincode: string;
  schoolName: string;
  partLat: string;
  partLong: string;
}
interface SectionData {
  id: number;
  partNo: string;
  sectionNo: string;
  sectionNameEn: string;
  sectionNameL1: string;
}
interface Religion {
  key: string;
  religionName: string;
  religionImage: string;
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
  partyShortName: string;
  partyImage: string; // Image URL or Base64 encoded image
}

export interface Scheme {
  key: string;
  schemeName: string;
  imageUrl: string;
  schemeBy: string;
}

interface Language {
  key: string;
  languageName: string;
}

const AddVoterForm = ({
  onFinish,
  initialValues,
  setLoadingButton,
  loadingButton,
  form,
  isStandalone = false,
}) => {
  const [skipVisible, setSkipVisible] = useState(false);
  const [activeKey, setActiveKey] = useState<string[]>([]);
  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [age, setAge] = useState(null);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [googleMapLink, setGoogleMapLink] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latError, setLatError] = useState("");
  const [lngError, setLngError] = useState("");
  const [partLatError, setPartLatError] = useState("");
  const [partLngError, setPartLngError] = useState("");
  const [selectedElectionDetails, setSelectedElectionDetails]: any = useState(
    {}
  );

  // state variables for religion,caste and subcaste
  const [religions, setReligions] = useState<Religion[]>([]);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [casteCategories, setCasteCategories] = useState<CasteCategory[]>([]);
  const [religionId, setReligionId] = useState<string | undefined>(undefined);
  const [selectedReligion, setSelectedReligion] = useState<string>("");
  const [casteId, setCasteId] = useState<string | undefined>(undefined);
  const [casteName, setCasteName] = useState<string | undefined>(undefined);
  const [isReligionModalVisible, setIsReligionModalVisible] =
    useState<boolean>(false);
  const [newReligionName, setNewReligionName] = useState("");
  const [religionFileList, setReligionFileList] = useState<any[]>([]);
  const [isCasteModalVisible, setIsCasteModalVisible] =
    useState<boolean>(false);
  const [isCasteCategoryModalVisible, setIsCasteCategoryModalVisible] =
    useState<boolean>(false);
  const [subCastes, setSubCastes] = useState<SubCaste[]>([]);
  const [selectedSubCasteReligionId, setSelectedSubCasteReligionId] = useState<
    number | undefined
  >(undefined);
  const [selectedSubCasteCasteId, setSelectedSubCasteCasteId] = useState<
    number | undefined
  >(undefined);
  const [isSubCasteModalVisible, setIsSubCasteModalVisible] = useState(false);
  const [newSubCasteName, setNewSubCasteName] = useState("");
  const [newCasteName, setNewCasteName] = useState("");
  const [selectedReligionForCaste, setSelectedReligionForCaste] =
    useState(null);

  //party state variables
  const [parties, setParties] = useState<Party[]>([]);
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyShortName, setNewPartyShortName] = useState("");
    const [newAllianceName, setNewAllianceName] = useState("");
  const [isPartyModalVisible, setIsPartyModalVisible] =
    useState<boolean>(false);
  const [partyFileList, setPartyFileList] = useState<any[]>([]);

  const [addedPartyKey, setAddedPartyKey] = useState<string | null>(null); // To track the last added party
  const [voterImage, setVoterImage] = useState<RcFile | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const { setLoading } = useLoading();
  const [parts, setParts] = useState<PartData[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");

  const location = useLocation();

  // scheme variables
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState<boolean>(false);
  const [newSchemeId, setNewSchemeId] = useState<number | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

  // availability variables
  const [availabilities, setAvailabilities] = useState([]);
  const [newAvailabilityId, setNewAvailabilityId] = useState(null);
  const [newCasteCategoryId, setNewCasteCategoryId] = useState(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] =
    useState<boolean>(false);

  //language variables
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLanguageId, setNewLanguageId] = useState(null);
  const [isLanguageModalVisible, setIsLanguageModalVisible] =
    useState<boolean>(false);

  // feedback variables
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] =
    useState<boolean>(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [newFeedbackId, setNewFeedbackId] = useState(null);

  // history variables
  const [isHistoryModalVisible, setIsHistoryModalVisible] =
    useState<boolean>(false);
  const [histories, setHistories] = useState<VoterHistory[]>([]);
  const [newHistoryId, setNewHistoryId] = useState(null);

  //reorder variables for panel 2
  const [dynamicFields, setDynamicFields] = useState<any[]>([]);
  const [fieldsOrder, setFieldsOrder] = useState<any[]>([]);

  const [staticFieldsConfig, setStaticFieldsConfig] = useState<
    Record<string, FieldConfig>
  >({
    age: {
      span: 6,
      component: "age",
      required: false,
      status: true,
    },
    date_of_birth: {
      span: 6,
      component: "dateOfBirth",
      required: false,
      status: true,
    },
    mobileNo: {
      span: 6,
      component: "mobileNumber",
      required: false,
      status: true,
    },
    whatsapp_number: {
      span: 6,
      component: "whatsappNumber",
      required: false,
      status: true,
    },
    email: { span: 6, component: "email", required: false, status: true },
    voterLati: {
      span: 6,
      component: "voterLatitude",
      required: false,
      status: true,
    },
    voterLongi: {
      span: 6,
      component: "voterLongitude",
      required: false,
      status: true,
    },
    detectLocation: {
      span: 6,
      component: "detectLocationButton",
      required: false,
      status: true,
    },
    starNumber: { span: 6, component: "star", required: false, status: true },
    aadhaarNumber: {
      span: 6,
      component: "aadhaarNumber",
      required: false,
      status: true,
    },
    panNumber: {
      span: 6,
      component: "panNumber",
      required: false,
      status: true,
    },
    partyRegistrationNumber: {
      span: 6,
      component: "partyRegistrationNumber",
      required: false,
      status: true,
    },
    religion: { span: 6, component: "religion", required: false, status: true },
    caste: { span: 6, component: "caste", required: false, status: true },
    sub_caste: {
      span: 6,
      component: "subCaste",
      required: false,
      status: true,
    },
    availability: {
      span: 6,
      component: "category",
      required: false,
      status: true,
    },
    party_affiliation: {
      span: 6,
      component: "partyAffiliation",
      required: false,
      status: true,
    },
    scheme: { span: 6, component: "schemes", required: false, status: true },
    voterHistory: {
      span: 6,
      component: "votingHistory",
      required: false,
      status: true,
    },
    feedback: { span: 6, component: "feedback", required: false, status: true },
    languages: {
      span: 6,
      component: "languages",
      required: false,
      status: true,
    },
    remarks: { span: 16, component: "remarks", required: false, status: true },
    casteCategory: {
      span: 6,
      component: "casteCategory",
      required: false,
      status: true,
    },
  });

  //form variables
  const [modalReligionForm] = Form.useForm();
  const [modalCasteForm] = Form.useForm();
  const [modalSubCasteForm] = Form.useForm();
  const [modalPartyForm] = Form.useForm();

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const electionId = location.state?.electionId || selectedElectionId;
  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );

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

  const normalizeFields = (
    fieldsData: { name: string; orderIndex: number }[]
  ) => {
    return fieldsData.map((field) => ({
      ...field,
      name: fieldNameMap[field.name] || field.name,
    }));
  };

  const updateStaticFieldsRequiredStatus = (apiData: any[]) => {
    const updatedConfig = { ...staticFieldsConfig };
    const fieldNameMap: Record<string, string> = {};

    console.log("data from static get api", apiData);
    apiData.forEach((field) => {
      const normalizedFieldName = normalizeApiFieldNameForConfig(
        field.fieldName
      );
      console.log("Normalized field name and field.fieldName", {
        normalizedFieldName,
        field,
      });
      fieldNameMap[field.fieldName] = normalizedFieldName;

      // Check if this field exists in our staticFieldsConfig
      if (updatedConfig[normalizedFieldName]) {
        updatedConfig[normalizedFieldName] = {
          ...updatedConfig[normalizedFieldName],
          required: field.mandatory || false,
          status: field.status ?? true,
        };
      }
    });
    console.log("Field Name Mapping (API → Normalized):", fieldNameMap);
    console.log("updated config", updatedConfig);

    setStaticFieldsConfig(updatedConfig);
  };

  // Process and organize fields
  const organizedFields = useMemo(() => {
    const activeDynamicFields = dynamicFields.filter(
      (field) => field.status === true
    );
    const staticFieldNames = Object.keys(staticFieldsConfig);
    const dynamicFieldNames = activeDynamicFields.map(
      (field) => field.name || field.label
    );
    const orderedFields: any = [];
    const processedFieldNames = new Set();

    if (fieldsOrder && fieldsOrder.length > 0) {
      // ✅ Case 1: fieldsOrder exists → use orderIndex
      console.log("Static field names", staticFieldNames);
      console.log("Field order", fieldsOrder);
      const sortedFieldsOrder = [...fieldsOrder].sort(
        (a, b) => Number(a.orderIndex) - Number(b.orderIndex)
      );

      sortedFieldsOrder.forEach((fieldOrder) => {
        const fieldName = fieldOrder.name;

        if (staticFieldNames.includes(fieldName)) {
          orderedFields.push({
            name: fieldName,
            type: "static",
            span: staticFieldsConfig[fieldName].span,
            component: staticFieldsConfig[fieldName].component,
            required: staticFieldsConfig[fieldName].required,
            status: staticFieldsConfig[fieldName].status,
            orderIndex: fieldOrder.orderIndex,
          });
          processedFieldNames.add(fieldName);
        } else {
          const dynamicField = activeDynamicFields.find(
            (df) => df.name === fieldName || df.label === fieldName
          );

          if (dynamicField) {
            orderedFields.push({
              name: fieldName,
              type: "dynamic",
              span: 6,
              dynamicField: dynamicField,
              orderIndex: fieldOrder.orderIndex,
            });
            processedFieldNames.add(fieldName);
          }
        }
      });
    } else {
      // ✅ Case 2: No fieldsOrder → keep original staticFieldsConfig order
      console.log("static field names", staticFieldNames);
      staticFieldNames.forEach((fieldName, index) => {
        orderedFields.push({
          name: fieldName,
          type: "static",
          span: staticFieldsConfig[fieldName].span,
          component: staticFieldsConfig[fieldName].component,
          status: staticFieldsConfig[fieldName].status,
          required: staticFieldsConfig[fieldName].required,
          orderIndex: index, // preserve original config order
        });
        processedFieldNames.add(fieldName);
      });
    }

    // Add missing static fields (if fieldsOrder existed but skipped some)
    staticFieldNames.forEach((fieldName, index) => {
      if (!processedFieldNames.has(fieldName)) {
        orderedFields.push({
          name: fieldName,
          type: "static",
          span: staticFieldsConfig[fieldName].span,
          component: staticFieldsConfig[fieldName].component,
          status: staticFieldsConfig[fieldName].status,
          required: staticFieldsConfig[fieldName].required,
          orderIndex: fieldsOrder ? Infinity : index, // fallback if needed
        });
      }
    });

    // Add missing dynamic fields
    activeDynamicFields.forEach((dynamicField, index) => {
      const fieldName = dynamicField.name || dynamicField.label;
      if (!processedFieldNames.has(fieldName)) {
        orderedFields.push({
          name: fieldName,
          type: "dynamic",
          span: 6,
          dynamicField: dynamicField,
          orderIndex: fieldsOrder ? Infinity : staticFieldNames.length + index,
        });
      }
    });
    console.log("Ordered fields", orderedFields);
    return orderedFields.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  }, [dynamicFields, fieldsOrder, staticFieldsConfig]);

  // Group fields into rows
  const fieldRows = useMemo(() => {
    const rows = [];
    let currentRow: any = [];
    let currentSpan = 0;
    const visibleFields = organizedFields.filter(
      (field) => field.status !== false
    );

    visibleFields.forEach((field, index: number) => {
      // If this is voterLongitude and next field is detectLocationButton
      if (field.component === "voterLongitude") {
        // Push voterLongitude first
        if (currentSpan + field.span <= 24) {
          currentRow.push(field);
          currentSpan += field.span;
        } else {
          rows.push(currentRow);
          currentRow = [field];
          currentSpan = field.span;
        }

        // Find detectLocationButton in remaining fields
        const detectLocationField = organizedFields.find(
          (f) => f.component === "detectLocationButton"
        );

        if (detectLocationField) {
          if (currentSpan + detectLocationField.span <= 24) {
            currentRow.push(detectLocationField);
            currentSpan += detectLocationField.span;
          } else {
            rows.push(currentRow);
            currentRow = [detectLocationField];
            currentSpan = detectLocationField.span;
          }
        }
        return; // Skip to next iteration
      }

      // Normal placement logic
      if (field.component !== "detectLocationButton") {
        if (currentSpan + field.span <= 24) {
          currentRow.push(field);
          currentSpan += field.span;
        } else {
          rows.push(currentRow);
          currentRow = [field];
          currentSpan = field.span;
        }
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }, [organizedFields]);

  // Render dynamic field
  const renderDynamicField = (field) => {
    const commonProps = {
      name: field.name || field.label,
      label: field.label || field.name,
      rules: [
        {
          required: field.required,
          message: `${field.label || field.name} is required`,
        },
      ],
    };

    switch (field.type) {
      case "string":
        return (
          <Form.Item {...commonProps}>
            <Input
              placeholder={`Enter ${field.label || field.name}`}
              className="input-element"
            />
          </Form.Item>
        );
      case "number":
        return (
          <Form.Item
            {...commonProps}
            normalize={(value) => (value ? Number(value) : null)}
          >
            <Input
              type="number"
              placeholder={`Enter ${field.label || field.name}`}
              className="input-element"
            />
          </Form.Item>
        );
      case "check-box":
        return (
          <Form.Item {...commonProps} valuePropName="checked">
            <Checkbox.Group>
              {field.options?.map((option) => (
                <Checkbox key={option} value={option}>
                  {option}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>
        );
      case "radio":
        return (
          <Form.Item {...commonProps}>
            <CustomRadioGroup>
              {field.options?.map((option) => (
                <Radio key={option} value={option}>
                  {option}
                </Radio>
              ))}
            </CustomRadioGroup>
          </Form.Item>
        );
      case "select":
        return (
          <Form.Item {...commonProps}>
            <Select
              placeholder={`Select ${field.label || field.name}`}
              className="input-element custom-select"
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
            >
              {field.options?.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      case "dropdown":
        return (
          <Form.Item {...commonProps}>
            <Select
              placeholder={`Select ${field.label || field.name}`}
              className="input-element custom-select"
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
            >
              {field.options?.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      case "multi-select":
        return (
          <Form.Item {...commonProps}>
            <Select
              mode="multiple"
              placeholder={`Select ${field.label || field.name}`}
              className="input-element custom-select"
              style={{
                minHeight: "46px",
                height: "auto",
              }}
            >
              {field.options?.map((option) => (
                <Option key={option} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );
      case "image":
        return (
          <Form.Item {...commonProps}>
            <Upload
              accept="image/*"
              listType="picture-card"
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div>Upload Image</div>
              </div>
            </Upload>
          </Form.Item>
        );
      case "file":
        return (
          <Form.Item {...commonProps}>
            <Upload beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
          </Form.Item>
        );
      default:
        return (
          <Form.Item {...commonProps}>
            <Input
              placeholder={`Enter ${field.label || field.name}`}
              className="input-element"
            />
          </Form.Item>
        );
    }
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
      const validSections = Array.isArray(response.data?.data)
        ? response.data?.data
        : [];
      validSections?.sort((a, b) => a.sectionNo - b.sectionNo);
      console.log("validSections", validSections);
      setSections(validSections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldStatus = async () => {
    try {
      const statusData = await getFieldStatus(parseInt(selectedElectionId));
      if (statusData?.data) {
        updateStaticFieldsRequiredStatus(statusData.data);
      }
    } catch (error) {
      console.error("Error fetching field status:", error);
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
              categoryName,
              availabilityImage,
              description,
              orderIndex,
            })
          )
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          )
      );
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const SchemeTagRender = (props: any) => {
    const { label, value, closable, onClose } = props;

    return null;
  };
  const renderStaticField = (field: {
    component: string;
    required: boolean;
    status: boolean;
  }) => {
    const { component, required, status } = field;
    if (status === false) {
      return null;
    }

    const getRequiredRule = (message = "This field is required") =>
      required ? [{ required: true, message }] : [];

    switch (component) {
      case "age":
        return (
          <Form.Item
            name="age"
            label="Age"
            required={required}
            rules={[
              ...getRequiredRule("Age is required"),

              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const numericAge = Number(value);
                  if (isNaN(numericAge)) {
                    return Promise.reject(
                      new Error("Please enter a valid number")
                    );
                  }
                  const dob = form.getFieldValue("dateOfBirth");
                  if (!dob || !value) return Promise.resolve();
                  const ageFromDob = calculateAge(dob);
                  if (ageFromDob === null) {
                    return Promise.reject(new Error("Invalid Date of Birth"));
                  }
                  if (ageFromDob !== value) {
                    return Promise.reject(
                      new Error("Age does not match Date of Birth")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              onChange={(e) => handleAgeChange(e.target.value)}
              className="input-element"
              placeholder="Enter age"
            />
          </Form.Item>
        );

      case "dateOfBirth":
        return (
          <Form.Item
            name="dateOfBirth"
            required={required}
            rules={getRequiredRule("Date of Birth is required")}
            label="Date of Birth"
          >
            <DatePicker
              value={dateOfBirth}
              format="DD-MMM-YYYY"
              className="input-element w-full"
              onChange={handleDobChange}
              disabledDate={(current) => {
                const today = moment().endOf("day");
                return current && current > today;
              }}
            />
          </Form.Item>
        );

      case "mobileNumber":
        return (
          <Form.Item
            name="phoneNumber"
            label="Mobile Number"
            required={required}
            rules={[
              ...getRequiredRule("Mobile number is required"),

              {
                pattern: /^[0-9]{10}$/,
                message: "Mobile number must be 10 digits",
              },
            ]}
          >
            <Input
              className="input-element"
              value={phoneNumber}
              prefix={
                <span style={{ marginRight: "8px", color: "#999" }}>+91</span>
              }
              placeholder="Enter Mobile Number"
              onChange={handlePhoneNumberChange}
            />
          </Form.Item>
        );

      case "whatsappNumber":
        return (
          <Form.Item
            name="whatsappNumber"
            required={required}
            label="Whatsapp Number"
            rules={[
              ...getRequiredRule("Whatsapp number is required"),

              {
                pattern: /^[0-9]{10}$/,
                message: "Whatsapp number must be 10 digits",
              },
            ]}
          >
            <Input
              className="input-element"
              value={whatsappNumber}
              prefix={
                <span style={{ marginRight: "8px", color: "#999" }}>+91</span>
              }
              placeholder="Enter Whatsapp Number"
              onChange={handleWhatsappNumberChange}
            />
          </Form.Item>
        );

      case "email":
        return (
          <Form.Item
            name="email"
            required={required}
            label="Email"
            rules={[
              ...getRequiredRule("Email is required"),
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input className="input-element" placeholder="Enter Email" />
          </Form.Item>
        );

      case "voterLatitude":
        return (
          <Form.Item
            name="latitude"
            required={required}
            validateStatus={latError ? "error" : ""}
            help={latError}
            label="Voter Latitude"
            rules={[
              ...getRequiredRule("Latitude is required"),

              {
                pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                message: "Please enter a valid latitude (-90 to 90)",
              },
            ]}
          >
            <Input
              className="input-element"
              placeholder="Enter Latitude"
              value={latitude}
              onChange={(e) =>
                handleCoordinateChange(e.target.value, "latitude")
              }
            />
          </Form.Item>
        );

      case "voterLongitude":
        return (
          <Form.Item
            name="longitude"
            required={required}
            label="Voter Longitude"
            validateStatus={lngError ? "error" : ""}
            help={lngError}
            rules={[
              ...getRequiredRule("Longitude is required"),

              {
                pattern: /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                message: "Please enter a valid longitude (-180 to 180)",
              },
            ]}
          >
            <Input
              className="input-element"
              placeholder="Enter Longitude"
              value={longitude}
              onChange={(e) =>
                handleCoordinateChange(e.target.value, "longitude")
              }
            />
          </Form.Item>
        );

      case "detectLocationButton":
        return (
          <Button
            className="custom-select hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
            onClick={loadingLocation ? null : detectLocation}
          >
            {loadingLocation ? (
              <Spin size="small" className="custom-spin-dark mr-2" />
            ) : null}
            {loadingLocation ? "Detecting..." : "Detect Location"}
          </Button>
        );

      case "star":
        return (
          <Form.Item
            name="starNumber"
            required={required}
            rules={getRequiredRule("Please select star status")}
            label="Star"
          >
            <CustomRadioGroup>
              <Radio key="1" value={true}>
                Yes
              </Radio>
              <Radio key="2" value={false}>
                No
              </Radio>
            </CustomRadioGroup>
          </Form.Item>
        );

      case "aadhaarNumber":
        return (
          <Form.Item
            required={required}
            name="aadhaarNumber"
            label="Aadhaar Number"
            rules={[
              ...getRequiredRule("Aadhaar number is required"),

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
        );

      case "panNumber":
        return (
          <Form.Item
            required={required}
            name="panNumber"
            label="PAN Number"
            rules={[
              ...getRequiredRule("PAN number is required"),

              {
                pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                message: "Invalid PAN format",
              },
            ]}
          >
            <Input className="input-element" placeholder="Enter PAN Number" />
          </Form.Item>
        );

      case "partyRegistrationNumber":
        return (
          <Form.Item
            required={required}
            rules={getRequiredRule("Party registration number is required")}
            name="partyRegistrationNumber"
            label="Party Registration Number"
          >
            <Input
              className="input-element"
              placeholder="Enter Party Registration Number"
            />
          </Form.Item>
        );

      case "religion":
        return (
          <Form.Item
            name="religion"
            rules={getRequiredRule("Religion is required")}
            label="Religion"
            required={required}
          >
            <Select
              value={selectedReligion || undefined}
              className="input-element custom-select"
              placeholder="Select Religion"
              dropdownRender={(menu) =>
                renderReligionDropdown(menu, setIsReligionModalVisible)
              }
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              onChange={(value) => {
                const selectedReligion = religions?.find(
                  (religion) => religion.religionName === value
                );
                setReligionId(selectedReligion?.key || null);
                setSelectedReligion(value);
              }}
              showSearch
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {religions.map((religion) => (
                <Option key={religion.key} value={religion.religionName}>
                  {religion.religionName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "caste":
        return (
          <Form.Item
            name="caste"
            label="Caste"
            rules={getRequiredRule("Caste is required")}
            required={required}
          >
            <Select
              disabled={!religionId}
              className="input-element custom-select"
              dropdownRender={(menu) =>
                renderCasteDropdown(menu, setIsCasteModalVisible)
              }
              placeholder="Select Caste"
              onChange={(value) => {
                const selectedCaste = castes?.find(
                  (caste) => caste.casteName === value
                );
                setCasteName(selectedCaste?.casteName);
                setCasteId(selectedCaste?.key);
              }}
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              showSearch
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {castes
                .filter((caste) => caste.religionId === religionId)
                .map((caste) => (
                  <Option key={caste.key} value={caste.casteName}>
                    {caste.casteName}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        );

      case "subCaste":
        return (
          <Form.Item
            name="sub_caste"
            rules={getRequiredRule("Sub-caste is required")}
            required={required}
            label="Sub-Caste"
          >
            <Select
              disabled={!casteId}
              className="input-element custom-select"
              showSearch
              dropdownRender={(menu) =>
                renderSubCasteDropdown(menu, setIsSubCasteModalVisible)
              }
              placeholder="Select Sub-Caste"
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {subCastes
                .filter((subcaste) => subcaste.casteName === casteName)
                .map((subcaste) => (
                  <Option key={subcaste.key} value={subcaste.subCasteName}>
                    {subcaste.subCasteName}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        );

      case "category":
        return (
          <Form.Item
            name="availability"
            rules={getRequiredRule("Category is required")}
            required={required}
            label="Category"
          >
            <Select
              className="input-element custom-select"
              placeholder="Select Category"
              showSearch
              dropdownRender={(menu) =>
                renderAvailabilityDropdown(menu, setIsAvailabilityModalOpen)
              }
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {availabilities?.map((availability) => (
                <Option key={availability.key} value={availability.description}>
                  {availability.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "partyAffiliation":
        return (
          <Form.Item
            name="partyAffiliation"
            required={required}
            label="Party Affiliation"
            rules={getRequiredRule("Party affiliation is required")}
          >
            <Select
              className="input-element custom-select"
              placeholder="Select Party Affiliation"
              dropdownRender={(menu) =>
                renderPartyDropdown(menu, setIsPartyModalVisible)
              }
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              showSearch
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {parties.map((party) => (
                <Option key={party.key} value={party.partyName}>
                  {party.partyName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "schemes":
        return (
          <>
            <Form.Item
              name="schemeName"
              rules={getRequiredRule("Please select scheme status")}
              required={required}
              label="Schemes"
            >
              <Select
                mode="multiple"
                className="input-element custom-select"
                // open={isDropdownVisible}
                onChange={() => {}}
                // onOpenChange={(open) => setIsDropdownVisible(open)}
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
                value={form.getFieldValue("schemeName") || []}
                showSearch={false}
                suffixIcon={<DownOutlined />}
                tagRender={() => {
                  const statuses = form.getFieldValue("schemeStatuses") || [];
                  console.log("statuses", statuses);
                  const tickCount = statuses.filter(
                    (s) => s.selected === true
                  ).length;
                  const crossCount = statuses.filter(
                    (s) => s.selected === false
                  ).length;

                  console.log("Tick and cross count", {
                    tickCount,
                    crossCount,
                  });

                  return (
                    <span style={{ padding: "0 8px" }}>
                      {tickCount > 0 && (
                        <span style={{ marginRight: 8 }}>{tickCount} ✅</span>
                      )}
                      {crossCount > 0 && <span>{crossCount} ❌</span>}
                      {tickCount === 0 &&
                        crossCount === 0 &&
                        "Select Scheme Status"}
                    </span>
                  );
                }}
              />
            </Form.Item>
            <Form.Item name="schemeStatuses" noStyle>
              <Input type="hidden" />
            </Form.Item>
          </>
        );

      case "votingHistory":
        return (
          <Form.Item
            name="voterHistory"
            rules={getRequiredRule("Voting history is required")}
            required={required}
            label="Voting History"
          >
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
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {histories?.map((history) => (
                <Option key={history.key} value={history.voterHistoryName}>
                  {history.voterHistoryName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "feedback":
        return (
          <Form.Item
            name="feedback"
            rules={getRequiredRule("Feedback is required")}
            required={required}
            label="Feedback"
          >
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
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {feedbacks.map((feed) => (
                <Option key={feed.key} value={feed.issueName}>
                  {feed.issueName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "languages":
        return (
          <Form.Item
            name="languages"
            rules={getRequiredRule("Language is required")}
            required={required}
            label="Languages"
          >
            <Select
              className="input-element custom-select"
              placeholder="Select Languages"
              showSearch
              dropdownRender={(menu) =>
                renderLanguageDropdown(menu, setIsLanguageModalVisible)
              }
              style={{
                height: "46px",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {languages.map((lan) => (
                <Option key={lan.key} value={lan.languageName}>
                  {lan.languageName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "remarks":
        return (
          <Form.Item
            label="Remarks"
            rules={getRequiredRule("Remarks are required")}
            required={required}
            name="remarks"
          >
            <Input.TextArea
              className="input-element"
              placeholder="Enter any additional remarks"
              rows={4}
            />
          </Form.Item>
        );

      case "casteCategory":
        return (
          <Form.Item
            name="casteCategory"
            required={required}
            label="Caste-Category"
            rules={getRequiredRule("Caste category is required")}
          >
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
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
              }}
              filterOption={(input, option) => {
                const label =
                  typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {casteCategories?.map((category) => (
                <Option key={category.key} value={category.casteCategoryName}>
                  {category.casteCategoryName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      default:
        return null;
    }
  };

  const fetchSchemeData = async () => {
    setLoading(true);
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      const schemeData = response.data
        ?.map((scheme) => ({
          ...scheme,
          key: scheme.id,
          orderIndex: scheme?.orderIndex,
        }))
        .sort(
          (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
        );
      setSchemes(schemeData || []);
    } catch (error) {
      console.log("Error fetching benefit schemes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeAdded = async (createdSchemeId: number) => {
    setNewSchemeId(createdSchemeId); // Set the ID of the newly added scheme
    await fetchSchemeData();
  };
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

  const handleFeedbackAdded = async (createdFeedbackId) => {
    setNewFeedbackId(createdFeedbackId);
    await fetchFeedbackData();
  };

  const handleHistoryAdded = async (createdHistoryId) => {
    setNewHistoryId(createdHistoryId);
    await fetchHistoryData();
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
    console.log("Booth value changed:", value);
    console.log("Parts data:", parts);
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
      (section) => section.sectionNo?.toString() === value?.toString()
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

  // fetch party data
  const fetchPartyData = async () => {
    try {
      const response = await fetchParties(electionId); // Fetch parties
      setLoading(true);
      const fetchedParties =
        response?.data
          ?.map((party: any) => ({
            key: party.id,
            partyName: party.partyName,
            partyShortName: party.partyShortName,
            partyImage: party.partyImage,
            orderIndex: party?.orderIndex,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
      setParties(fetchedParties);
      if (newPartyName) {
        const newlyAddedParty = fetchedParties?.find(
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
      setParties([]);
    } finally {
      setLoading(false);
    }
  };

  // FETCH DYNAMIC FIELDS
  const fetchDynamicFields = async () => {
    try {
      const response = await getDynamicFieldsApi(parseInt(selectedElectionId));
      const fieldsData = response.data?.fieldsPage;
      if (fieldsData) {
        fieldsData.content.sort(
          (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
        );
      }

      console.log("Fields data", response.data);
      setDynamicFields(fieldsData?.content || []);
    } catch (error) {
      message.error("Failed to fetch fields");
    }
  };

  // FETCH SAVED FIELDS ORDER
  const fetchSavedFields = async () => {
    try {
      const response = await getSavedFieldsApi(parseInt(selectedElectionId));
      let fieldsData = response.data?.fields;
      if (fieldsData) {
        fieldsData.sort(
          (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
        );
        fieldsData = normalizeFields(fieldsData);
      }
      console.log("set fields order after fetching", fieldsData);

      console.log("Fields data", response.data);
      setFieldsOrder(fieldsData || []);
    } catch (error) {
      message.error("Failed to fetch fields");
    }
  };

  // fetch religion data
  const fetchReligionData = async (newReligionName?: string) => {
    try {
      const response = await fetchReligion(parseInt(selectedElectionId));
      const fetchedReligions =
        response?.data?.data
          ?.map((religion: any) => ({
            key: religion.religionId,
            religionName: religion.religionName,
            orderIndex: religion?.orderIndex,
          }))
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
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
      setReligions([]);
    }
  };

  // fetch castes
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
      if (newCasteName) {
        const newlyAddedCaste = fetchedCastes?.find(
          (caste) => caste.casteName === newCasteName
        );
        if (newlyAddedCaste) {
          setCasteId(newlyAddedCaste.key);
          form.setFieldsValue({
            caste: newlyAddedCaste.casteName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching castes: ", error);
      setCastes([]);
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
          .sort(
            (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
          ) || [];
      console.log("fetchedSubCastes", fetchedSubCastes);
      setSubCastes(fetchedSubCastes);
      if (newSubCasteName) {
        const newlyAddedSubCaste = fetchedSubCastes?.find(
          (subcaste) => subcaste.subCasteName === newSubCasteName
        );
        if (newlyAddedSubCaste) {
          form.setFieldsValue({
            sub_caste: newlyAddedSubCaste.subCasteName,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching sub-castes: ", error);
      setSubCastes([]);
    }
  };

  // fetch language data
  const fetchLanguageData = async () => {
    setLoading(true);
    try {
      const response = await getLanguagesApi(parseInt(selectedElectionId));
      const languageData = response.data
        .map((lang: any) => ({
          key: lang.id,
          languageName: lang.languageName,
          orderIndex: lang?.orderIndex,
        }))
        .sort(
          (a: any, b: any) => Number(a?.orderIndex) - Number(b?.orderIndex)
        );
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
          .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex)) || [];
      console.log("History data", fetchedHistories);
      setHistories(fetchedHistories);
    } catch (error) {
      console.error("Error fetching histories: ", error);
      setHistories([]);
    }
  };

  // fetch feedback data
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

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    form.setFieldValue("phoneNumber", value);
  };
  const handleWhatsappNumberChange = (e) => {
    const value = e.target.value;
    setWhatsappNumber(value);
    form.setFieldValue("whatsappNumber", value);
  };
  const calculateAge = (dob) => {
    const dateOfBirth = dayjs(dob);
    if (!dateOfBirth.isValid()) {
      return null;
    }
    return dayjs().diff(dateOfBirth, "years");
  };

  const handleDobChange = (date) => {
    console.log(date);
    setDateOfBirth(date);
    if (date) {
      const calculatedAge = dayjs().diff(date, "years");
      console.log(calculatedAge);
      form.setFieldsValue({ age: calculatedAge }); // Update age based on DOB
    }
  };

  // Handle Age change
  const handleAgeChange = (value) => {
    setAge(value);
    if (value) {
      const calculatedDob = dayjs().subtract(value, "years");
      setDateOfBirth(calculatedDob); // Set the date of birth based on entered age
      // form.setFieldsValue({ dateOfBirth: calculatedDob }); // Automatically set dateOfBirth in the form
    }
  };
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      message.error("Geolocation is not supported by your browser");
      return;
    }
    setLoadingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      setIsLocationValid(true);

      // Update form fields with string values
      form.setFieldsValue({
        latitude: lat?.toString(),
        longitude: lng?.toString(),
      });

      setLatitude(lat?.toString());
      setLongitude(lng?.toString());
      setLatError("");
      setLngError("");

      // Log for debugging
      console.log("Location detected:", { lat, lng });
      console.log(
        "Form values after setting:",
        form.getFieldsValue(["latitude", "longitude"])
      );

      message.success("Location detected successfully");
    } catch (error) {
      console.error("Location detection error:", error);
      message.error(
        "Failed to detect location. Please enter coordinates manually"
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const validateDecimalPlaces = (value, min, max, setError) => {
    if (!value) {
      setError("");
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return false;
    }

    if (numValue < min || numValue > max) {
      setError(`Value must be between ${min} and ${max}`);
      return false;
    }

    // Check decimal places (max 6)
    if (value.includes(".")) {
      const [, decimalPart] = value.split(".");
      if (decimalPart?.length > 6) {
        setError("Maximum 6 decimal places allowed");
        return false;
      }
    }
    if (!/^(-?\d+(\.\d{0,6})?)?$/.test(value)) {
      setError(
        "Invalid format. Only numbers and a single decimal point allowed"
      );

      return false;
    }

    // If everything is fine, clear the error
    setError("");
    return true;
  };

  // Updates latitude, longitude & Google Map link
  const handleCoordinateChange = (value, type) => {
    const isLatitude = type === "latitude";
    const min = isLatitude ? -90 : -180;
    const max = isLatitude ? 90 : 180;
    const setError = isLatitude ? setLatError : setLngError;

    if (validateDecimalPlaces(value, min, max, setError)) {
      if (isLatitude) setLatitude(value);
      else setLongitude(value);
    } else {
      if (isLatitude) setLatitude("");
      else setLongitude("");
    }
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    const filteredList = newFileList.filter((file: any) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg";
      const isSizeValid = file.size / 1024 / 1024 < 1;

      if (!isValidType) {
        return false;
      }
      if (!isSizeValid) {
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

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleVoterImageUpload = (file: RcFile) => {
    const isValidType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg";

    const isSizeValid = file.size / 1024 / 1024 < 1;

    if (!isValidType) {
      // message.error("Only JPG, JPEG, or PNG files are allowed!");
      return Upload.LIST_IGNORE;
    }

    if (!isSizeValid) {
      // message.error("File size must be less thann 1MB!");
      return Upload.LIST_IGNORE;
    }

    setVoterImage(file);
    setFileList([file]); // Set the file list here
    return false; // Prevent auto upload
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

  const handleFinish = (values) => {
    setLoadingButton(true);
    try {
      const formValues = form.getFieldsValue();
      console.log("VALUES", values);

      // Religion, caste, and subcaste IDs
      const casteId = getCasteId(values.caste);
      const subCasteId = getSubCasteId(values.sub_caste);
      console.log(
        "ReligionId",
        religionId,
        "CasteId",
        casteId,
        "SubcasteId",
        subCasteId
      );

      // Process relation name
      const relationName = [
        values.RLN_FNAME_EN?.trim() || "",
        values.RLN_LNAME_EN?.trim() || "",
      ]
        .filter(Boolean)
        .join(" ");

      // Get lat/long values and ensure they are parsed as numbers
      const latitude = formValues.latitude
        ? parseFloat(formValues.latitude)
        : 0;
      const longitude = formValues.longitude
        ? parseFloat(formValues.longitude)
        : 0;

      // Process languages data
      let languageData = values.languages || "";
      let languageId = null;

      if (values.languages) {
        if (typeof values.languages === "object") {
          // If it's an object, extract its name & ID
          languageData =
            values.languages.languageName ||
            values.languages.name ||
            values.languages?.toString();
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
      console.log("languages", languages);

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

      // Process availability data
      let availabilityValue = values.availability || "";
      let availabilityId = null;

      if (values.availability) {
        if (typeof values.availability === "object") {
          // If availability is an object, extract name and ID
          availabilityValue =
            values.availability.categoryName ||
            values.availability.name ||
            values.availability?.toString();
          availabilityId = values.availability.key || values.availability.id;
        } else if (availabilities && Array.isArray(availabilities)) {
          // Look up ID from availabilities array
          const matchingAvail = availabilities.find(
            (avail) =>
              avail.categoryName === values.availability ||
              avail.name === values.availability
          );
          if (matchingAvail) {
            availabilityId = matchingAvail.key || matchingAvail.id;
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

      // voter history

      console.log("Scheme values", values.schemeStatuses);
      const benefitSchemeStatuses = Array.isArray(values.schemeStatuses)
        ? values.schemeStatuses.filter(
            (s: { schemeId: number; selected: boolean | null }) =>
              s.selected !== null
          )
        : [];
      console.log("benefitSchemeStatuses", benefitSchemeStatuses);
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

      // Process party data
      let partyValue = values.partyAffiliation || "";
      let partyId = null;

      if (values.partyAffiliation) {
        if (typeof values.partyAffiliation === "object") {
          // If party is an object, extract name and ID
          partyValue =
            values.partyAffiliation.partyName ||
            values.partyAffiliation.name ||
            values.partyAffiliation?.toString();
          partyId = values.partyAffiliation.key || values.partyAffiliation.id;
        } else if (parties && Array.isArray(parties)) {
          // Look up ID from parties array
          const matchingParty = parties.find(
            (party) =>
              party.partyName === values.partyAffiliation ||
              party.name === values.partyAffiliation
          );
          if (matchingParty) {
            partyId = matchingParty.key || matchingParty.id;
          }
        }
      }

      const dynamicFieldsList: any = {};

      // Assuming you have an array of dynamic field definitions
      dynamicFields.forEach((field) => {
        if (
          values[field.name] !== undefined &&
          values[field.name] !== null &&
          values[field.name] !== ""
        ) {
          dynamicFieldsList[field.label || field.name] = values[field.name];
        }
      });

      console.log("Voter image", voterImage);

      let finalVoterImage = null;
      if (voterImage) {
        finalVoterImage = voterImage[0]?.originFileObj;
      }

      const payload = {
        electionId,
        voterImage: finalVoterImage,
        gender: values.gender,
        latitude,
        longitude,
        voterLati: latitude,
        voterLongi: longitude,
        dynamicFields: dynamicFieldsList,

        // Fixed values for availability, scheme, party, and languages
        availability: availabilityValue,
        availabilityId: availabilityId,
        partyAffiliation: partyValue,
        partyId: partyId,
        languages: languageData, //  String
        languageId: languageId, //  Single ID, not an array
        // benefitSchemeIds: benefitSchemeIds,
        benefitSchemeStatuses: benefitSchemeStatuses,
        casteCategoryId: casteCategoryId,
        feedbackIssueIds: feedbackIssueIds,
        voterHistoryIds: voterHistoryIds,

        // Include reference arrays for ID lookup
        casteCategories: casteCategoryData,
        availabilities: availabilities,
        schemes: schemes,
        parties: parties,
        languagesList: languages,

        starNumber: values.starNumber,
        panNumber: values.panNumber,
        aadhaarNumber: values.aadhaarNumber,
        partyRegistrationNumber: values.partyRegistrationNumber,

        religion: values.religion,
        religionId: religionId,
        casteId: casteId,
        subCasteId: subCasteId,
        sub_caste: values.sub_caste,
        caste: values.caste,
        remarks: values.remarks,
        partNo: parseInt(values.boothNumber) || 0,
        epic_number: values.epic_number,
        pageNumber: values.pageNumber,

        fullAddress: values.fullAddress,
        dob: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : null,
        age: values.age,
        pincode: values.pincode,
        mobileNo: values.phoneNumber || phoneNumber || null,
        whatsappNo: values.whatsappNumber,
        email: values.email,
        third_party_id: "N/A",
        photo_url: "",
        localBody: values.localBody || null,

        //state
        stateCode: values.stateCode || null,
        stateNameEn: values.state || null,
        stateNameL1: values.stateNameL1 || null,
        stateNameL2: values.stateNameL2 || null,

        //PC
        pcNo: values.pcNo || null,
        pcNameEn: values.pcNameEn || null,
        pcNameL1: values.pcNameL1 || null,
        pcNameL2: values.pcNameL2 || null,

        //AC
        acNo: values.acNo || null,
        acNameEn: values.acNameEn || null,
        acNameL1: values.acNameL1 || null,
        acNameL2: values.acNameL2 || null,

        //section
        sectionNo: values.sectionNo || null,
        sectionNameEn: values.sectionNameEn || null,
        sectionNameL1: values.sectionNameL1 || null,
        sectionNameL2: values.sectionNameL2 || null,
        serialNo: values.serialNumber || null,

        //relation
        relationName: relationName || null,
        rlnType: values.rlnType,
        rlnFnameEn: values.RLN_FNAME_EN || null,
        rlnLnameEn: values.RLN_LNAME_EN || null,
        rlnFnameL1: values.RLN_FNAME_L1 || null,
        rlnLnameL1: values.RLN_LNAME_L1 || null,
        rlnFnameL2: values.RLN_FNAME_L2 || null,
        rlnLnameL2: values.RLN_LNAME_L2 || null,

        //Urban data
        urbanNo: values.urbanNo || null,
        urbanNameEn: values.urbanNameEn || null,
        urbanNameL1: values.urbanNameL1 || null,
        urbanNameL2: values.urbanNameL2 || null,
        urbanWardNo: values.urbanWardNo || null,

        //District data
        districtCode: values.districtCode || null,
        // districtNo: values.districtNo || null,
        districtNameEn: values.districtNameEn || null,
        districtNameL1: values.districtNameL1 || null,
        districtNameL2: values.districtNameL2 || null,

        // District Union Data
        rurDistrictUnionNo: values.rurDistrictUnionNo || null,
        rurDistrictUnionNameEn: values.rurDistrictUnionNameEn || null,
        rurDistrictUnionNameL1: values.rurDistrictUnionNameL1 || null,
        rurDistrictUnionNameL2: values.rurDistrictUnionNameL2 || null,
        rurDistrictUnionWardNo: values.rurDistrictUnionWardNo || null,

        //panchayat
        panUnionNo: values.panUnionNo || null,
        panUnionNameEn: values.panUnionNameEn || null,
        panUnionNameL1: values.panUnionNameL1 || null,
        panUnionNameL2: values.panUnionNameL2 || null,
        panUnionWardNo: values.panUnionWardNo || null,

        //village
        villPanNo: values.villPanNo || null,
        villPanNameEn: values.villPanNameEn || null,
        villPanNameL1: values.villPanNameL1 || null,
        villPanWardNo: values.villPanWardNo || null,

        //part
        partNameEn: values.partNameEn || null,
        partLati: values.partLati || null,
        partLong: values.partLong || null,
        partNameL1: values.partNameL1 || null,
        partNameL2: values.partNameL2 || null,

        //scheme
        // schemeName: schemeValue || null,
        // schemeBy: values.schemeBy || null,

        //house number details
        houseNoEn: values.houseNoEn || null,
        houseNoL1: values.houseNoL1 || null,
        houseNoL2: values.houseNoL2 || null,

        //voter name details
        voterFnameEn: values.voterFnameEn,
        voterLnameEn: values.voterLnameEn,
        voterFnameL1: values.voterFnameL1 || null,
        voterLnameL1: values.voterLnameL1 || null,
        voterFnameL2: values.voterFnameL2 || null,
        voterLnameL2: values.voterLnameL2 || null,
      };

      console.log("Form Values:", {
        lat: formValues.latitude,
        lng: formValues.longitude,
      });
      console.log("Parsed Values:", { lat: latitude, lng: longitude });
      console.log("Final Payload:", payload);

      onFinish(payload);
    } catch (error) {
      setLoadingButton(false);
    }
  };

  const handleFinishFailed = ({ errorFields }: any) => {
    console.log("errorFields", errorFields);
    if (errorFields && errorFields.length > 0) {
      form.scrollToField(errorFields[0].name, {
        behavior: "smooth",
      });
    }
  };

  const handleCancelReligion = () => {
    setIsReligionModalVisible(false);
    setNewReligionName("");
    setReligionFileList([]);
  };

  const handleCancelCaste = () => {
    setIsCasteModalVisible(false);
    setNewCasteName("");
    modalCasteForm.resetFields();
  };

  const handleCancelSubCaste = () => {
    setIsSubCasteModalVisible(false);
    setNewSubCasteName("");
    modalSubCasteForm.resetFields();
  };

  const getCasteId = (casteName: string) => {
    if (casteName) {
      const caste = castes?.find((c) => c.casteName === casteName);
      console.log("selectedCaste", caste);
      setCasteId(caste?.key);
      return caste?.key;
    }
  };

  const getSubCasteId = (subCasteName: string) => {
    if (subCasteName) {
      const subcaste = subCastes?.find((c) => c.subCasteName === subCasteName);
      console.log("selected Sub-Caste", subcaste);
      return subcaste?.key;
    }
  };

  // Handle adding a party
  const handlePartyAdd = async () => {
    setLoadingForm(true);
    const file = partyFileList[0]?.originFileObj;
        const partyColor = modalPartyForm.getFieldValue("partyColor");

    if (newPartyName.trim() && file) {
      try {
        await addParty(electionId,newAllianceName, newPartyName, newPartyShortName,partyColor, file); // Add party with image
        // Reset input fields and close modal
        fetchPartyData();
        setNewPartyName("");
        setNewPartyShortName("");
              setNewAllianceName("");

        setPartyFileList([]);
        modalPartyForm.resetFields();
        setIsPartyModalVisible(false);
      } catch (error) {
        console.error("Error adding party: ", error);
        message.error("Failed to add party. Please try again.");
      } finally {
        setLoadingForm(false);
      }
    } else {
      message.error("Party name and image are required.");
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchSavedFields();
      fetchDynamicFields();
      fetchReligionData();
      fetchCasteCategoryData();
      fetchSchemeData();
      fetchHistoryData();
      fetchPartData();
      fetchFieldStatus();
      fetchSectionData();
      fetchAvailabilityData();
      fetchPartyData();
      fetchLanguageData();
      fetchFeedbackData();
      window.scrollTo(0, 0);
    }
  }, [selectedElectionId]);

  useEffect(() => {
    const phone = form.getFieldValue("phoneNumber");
    if (phone) {
      setPhoneNumber(phone);
    }
  }, [form]);

  useEffect(() => {
    if (religionId) {
      fetchCastesData(parseInt(religionId));
    } else {
      setCastes([]);
    }
    setCasteId(undefined);
    setSubCastes([]);
  }, [religionId]);

  useEffect(() => {
    if (casteId) {
      fetchSubCastesData(parseInt(casteId));
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
        state: selectedElectionDetails.state,
        stateNameEn: selectedElectionDetails.stateName,
      });
    }
  }, [selectedElectionDetails, form]);

  // USE EFFECT FOR AUTOMATIC RELIGION SELECTION
  useEffect(() => {
    if (addedPartyKey && parties.length > 0) {
      const newlyAddedParty = parties?.find(
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

  // USE EFFECT FOR AUTOMATIC CASTE SELECTION
  useEffect(() => {
    if (isCasteModalVisible) {
      setSelectedReligionForCaste(religionId);
      modalCasteForm.setFieldsValue({
        religion: religionId,
      });
    }
  }, [isCasteModalVisible, religionId, form]);

  // USE EFFECT FOR AUTOMATIC SUBCASTE SELECTION
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

  // USE EFFECT FOR AUTOMATIC SCHEME SELECTION
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

  // USE EFFECT FOR AUTOMATIC AVAILABILITY SELECTION
  useEffect(() => {
    if (newAvailabilityId) {
      const newAvailability = availabilities?.find(
        (avl) => avl?.key === newAvailabilityId
      );
      console.log("New Availability", newAvailability);
      if (newAvailability) {
        form.setFieldsValue({
          availability: newAvailability.categoryName,
        });
        console.log(
          "Availability selected: ",
          form.getFieldsValue("availability")
        );

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
        console.log(
          "Caste category selected: ",
          form.getFieldsValue("casteCategory")
        );

        setNewCasteCategoryId(null);
      }
    }
  }, [casteCategories, newCasteCategoryId]);

  // USE EFFECT FOR AUTOMATIC LANGUAGE SELECTION
  useEffect(() => {
    if (newLanguageId) {
      console.log("newLanguageId", newLanguageId);
      const newLanguage = languages?.find((lan) => lan?.key === newLanguageId);
      console.log("New Language", newLanguage);
      if (newLanguage) {
        form.setFieldsValue({
          languages: newLanguage.languageName,
        });
        console.log("Language selected: ", form.getFieldsValue("languages"));
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
        console.log("feedback selected: ", form.getFieldsValue("feedback"));
      }
      setNewFeedbackId(null);
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
        console.log("history selected: ", form.getFieldsValue("voterHistory"));
      }
      setNewHistoryId(null);
    }
  }, [histories]);

  useEffect(() => {
    if (latitude && longitude && !latError && !lngError) {
      setGoogleMapLink(
        `https://www.google.com/maps?q=${latitude},${longitude}`
      );
      setIsLocationValid(true);
    } else {
      setGoogleMapLink("");
      setIsLocationValid(false);
    }
  }, [latitude, longitude, latError, lngError]);

  return (
    <div>
      <Form
        form={form}
        onFinishFailed={handleFinishFailed}
        onFinish={handleFinish}
        // onValuesChange={(changedValues, allValues) => {
        //   console.log("Changed Values:", changedValues); // Log only the changed fields
        //   console.log("All Form Values:", allValues); // Log all form values
        // }}
        layout="vertical"
        className="w-full pb-6 pt-6 pr-6"
        initialValues={{
          ...initialValues,
          country: "India",
          phoneNumber: phoneNumber,
        }}
      >
        {/* <Row gutter={[16, 16]} className="w-full items-center">
          <Col span={24}>
            <h3 className="text-[20px] marginBottom-4px leading-5 font-semibold text-[#1C1C1C]">
              Add Voter Details
            </h3>
          </Col>
        </Row> */}
        <div className="border-gray-300">
          <Collapse
            activeKey={activeKey}
            expandIconPosition="end"
            bordered={false}
            onChange={(keys) => setActiveKey(keys as string[])}
            className="bg-transparent custom-collapse"
            expandIcon={({ isActive }) => (
              <PlusOutlined
                rotate={isActive ? 45 : 0}
                className="transition-transform  duration-200 text-gray-700"
              />
            )}
          >
            <Panel
              key="1"
              header={
                <div className="flex items-center justify-between">
                  <div className="relative flex  items-center w-full">
                    <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                      Election Commission Data
                    </span>
                  </div>
                </div>
              }
              className="bg-white "
            >
              <Row gutter={[16, 16]} className="w-full items-center pb-5 mt-4">
                <Col span={12}>
                  <Form.Item name="voterImage" label="Add Voter Photo">
                    <ImgCrop
                      rotate
                      aspect={1 / 1}
                      quality={0.8}
                      modalWidth={500}
                      showReset
                      beforeCrop={validateImageBeforeCrop}
                      okText="Confirm"
                      cancelText="Cancel"
                      modalTitle={
                        <div className="flex justify-between items-center">
                          <span>Crop Voter Image</span>
                          <span
                            style={{
                              color: "#999",
                              fontSize: "12px",
                              marginRight: "2rem",
                            }}
                          >
                            Size: 500x500 pixels
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
                        multiple={false}
                        name="voterImage"
                        listType="picture-card"
                        onPreview={handlePreview}
                        onRemove={() => setFileList([])}
                        onChange={handleFileChange}
                        customRequest={dummyRequest}
                        // beforeUpload={handleVoterImageUpload} // Handle image selection
                        accept="image/*"
                      >
                        {fileList.length < 1 && (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload Photo</div>
                          </div>
                        )}
                        {/* )} */}
                      </Upload>
                    </ImgCrop>
                  </Form.Item>
                  {fileList?.length === 0 ? (
                    <p className="text-xs font-medium text-gray-400 -mt-3">
                      Image size should not exceed 1 MB
                    </p>
                  ) : (
                    <p></p>
                  )}
                </Col>
                <Col span={12}>
                  <Form.Item name="voterVideo" label="Add Voter Video">
                    <Upload
                      name="voterVideo"
                      accept="video/*"
                      maxCount={1}
                      showUploadList={false}
                      beforeUpload={handleVoterVideoUpload}
                      onChange={handleVideoChange}
                    >
                      <Button icon={<UploadOutlined />}>Upload Video</Button>
                    </Upload>
                  </Form.Item>

                  {!videoFile && (
                    <p className="text-xs font-medium text-gray-400 -mt-3">
                      Video size should not exceed 10 MB
                    </p>
                  )}

                  {videoPreview && (
                    <Card
                      title="Video Preview"
                      bordered={false}
                      style={{
                        marginTop: 16,
                        position: "relative",
                        padding: 0,
                      }}
                    >
                      <div className="relative">
                        <video
                          src={videoPreview}
                          controls
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                        <Button
                          danger
                          type="primary"
                          size="small"
                          style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            zIndex: 10,
                          }}
                          onClick={() => {
                            setVideoFile(null);
                            setVideoPreview(null);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  )}
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col {...colWidths}>
                  {" "}
                  <Form.Item
                    name="boothNumber"
                    label="Part Number"
                    rules={[
                      {
                        required: true,
                        message: "Please select or enter a part number",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter part number"
                      onChange={(e) => {
                        const value = e.target.value;
                        handleBoothChange(value);
                      }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item
                    name="sectionNo"
                    label="Section Number"
                    rules={[
                      {
                        required: true,
                        message: "Please select or enter a section number",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter section number"
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        handleSectionChange(value);
                      }}
                      allowClear
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  {" "}
                  <Form.Item
                    name="serialNumber"
                    label="Serial Number"
                    rules={[
                      {
                        required: true,
                        message: "Please enter a Serial Number",
                      },
                      {
                        pattern: /^\d+$/,
                        message: "Please enter a valid Serial Number",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Serial Number"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col {...colWidths}>
                  {" "}
                  <Form.Item
                    name="houseNoEn"
                    label="House Number (English)"
                    rules={[
                      {
                        required: true,
                        message: "Please enter a House Number",
                      },

                      // {
                      //   validator: (_, value) => {
                      //     const numericValue = Number(value);
                      //     if (isNaN(numericValue)) {
                      //       return Promise.reject(
                      //         new Error("Please enter a valid number")
                      //       );
                      //     }
                      //     if (numericValue > 10000) {
                      //       return Promise.reject(
                      //         new Error("House Number must not exceed 10000")
                      //       );
                      //     }
                      //     return Promise.resolve();
                      //   },
                      // },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter House Number"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item
                    name="houseNoL1"
                    label="House Number (L1)"
                    rules={
                      [
                        // {
                        //   validator: (_, value) => {
                        //     if (!value) {
                        //       return Promise.resolve();
                        //     }
                        //     const numericValue = Number(value);
                        //     if (isNaN(numericValue)) {
                        //       return Promise.reject(
                        //         new Error("Please enter a valid number")
                        //       );
                        //     }
                        //     if (numericValue > 10000) {
                        //       return Promise.reject(
                        //         new Error("House Number must not exceed 10000")
                        //       );
                        //     }
                        //     return Promise.resolve();
                        //   },
                        // },
                      ]
                    }
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter House Number"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  {" "}
                  <Form.Item
                    name="houseNoL2"
                    label="House Number (L2)"
                    rules={
                      [
                        // {
                        //   validator: (_, value) => {
                        //     if (!value) {
                        //       return Promise.resolve();
                        //     }
                        //     const numericValue = Number(value);
                        //     if (isNaN(numericValue)) {
                        //       return Promise.reject(
                        //         new Error("Please enter a valid number")
                        //       );
                        //     }
                        //     if (numericValue > 10000) {
                        //       return Promise.reject(
                        //         new Error("House Number must not exceed 10000")
                        //       );
                        //     }
                        //     return Promise.resolve();
                        //   },
                        // },
                      ]
                    }
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter House Number"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col xs={24} md={12}>
                  <Form.Item
                    name="voterFnameEn"
                    label="Voter First Name (English)"
                    rules={[
                      {
                        required: true,
                        message: "Please enter the voter first name",
                      },
                      {
                        pattern: /^[A-Za-z\s]+$/,
                        message: "Please enter a valid First Name",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Voter First Name"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="voterLnameEn"
                    label="Voter Last Name (English)"
                    rules={[
                      {
                        pattern: /^[A-Za-z\s]+$/,
                        message: "Please enter a valid Last Name",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Voter Last Name"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col xs={24} md={6}>
                  <Form.Item name="voterFnameL1" label="Voter First Name (L1)">
                    <Input
                      className="input-element"
                      placeholder="Enter Voter First Name"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="voterLnameL1" label="Voter Last Name (L1)">
                    <Input
                      className="input-element"
                      placeholder="Enter Voter Last Name"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="voterFnameL2" label="Voter First Name (L2)">
                    <Input
                      className="input-element"
                      placeholder="Enter Voter First Name"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item name="voterLnameL2" label="Voter Last Name (L2)">
                    <Input
                      className="input-element"
                      placeholder="Enter Voter Last Name"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center mt-5">
                <Col xs={24} md={12}>
                  {" "}
                  <Form.Item
                    name="RLN_FNAME_EN"
                    label="Relation First Name (English)"
                    rules={[
                      {
                        required: true,
                        message: "Please enter Relation First Name",
                      },
                      {
                        pattern: /[A-Za-z\s]+$/,
                        message: "Please enter a valid Relation First Name",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation First Name"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  {" "}
                  <Form.Item
                    name="RLN_LNAME_EN"
                    label="Relation Last Name (English)"
                    rules={[
                      {
                        pattern: /[A-Za-z\s]+$/,
                        message: "Please enter a valid Relation Last Name",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation Last Name"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  {" "}
                  <Form.Item
                    name="RLN_FNAME_L1"
                    label="Relation First Name (L1)"
                    // rules={[
                    //   {
                    //     pattern: /[A-Za-z\s]+$/,
                    //     message: "Please enter a valid Relation Name",
                    //   },
                    // ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation First Name L1"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  {" "}
                  <Form.Item
                    name="RLN_LNAME_L1"
                    label="Relation Last Name (L1)"
                    // rules={[
                    //   {
                    //     pattern: /[A-Za-z\s]+$/,
                    //     message: "Please enter a valid Relation Name",
                    //   },
                    // ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation Last Name L1"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  {" "}
                  <Form.Item
                    name="RLN_FNAME_L2"
                    label="Relation First Name (L2)"
                    // rules={[
                    //   {
                    //     pattern: /[A-Za-z\s]+$/,
                    //     message: "Please enter a valid Relation Name L2",
                    //   },
                    // ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation First Name L2"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  {" "}
                  <Form.Item
                    name="RLN_LNAME_L2"
                    label="Relation Last Name (L2)"
                    // rules={[
                    //   {
                    //     pattern: /[A-Za-z\s]+$/,
                    //     message: "Please enter a valid Relation Name L2",
                    //   },
                    // ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation Last Name L2"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col xs={24} md={6}>
                  {" "}
                  <Form.Item
                    name="rlnType"
                    label="Relation Type"
                    rules={[
                      {
                        required: true,
                        message: "Please enter a Relation Type",
                      },
                      {
                        pattern: /[A-Za-z\s]+$/,
                        message: "Please enter a valid Relation Type",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Relation Type "
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="epic_number"
                    label="EPIC Id"
                    rules={[
                      { required: true, message: "Please enter the EPIC Id" },
                      // {
                      //   pattern: /^[a-zA-Z0-9]+$/,
                      //   message: "Please enter a valid input",
                      // },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter EPIC Id"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="pageNumber"
                    label="Page Number"
                    rules={[
                      {
                        pattern: /^\d+$/,
                        message: "Please enter a valid Page Number",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="Enter Page Number"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[
                      { required: true, message: "Please select the gender" },
                    ]}
                  >
                    <Select
                      className="input-element custom-select"
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
                      placeholder="Select Gender"
                      style={{
                        height: "46px",
                        border: "1px solid",
                        borderColor: "#d9d9d9",
                        borderRadius: "4px",
                      }}
                    >
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center mt-6">
                <Col {...colWidths}>
                  <Form.Item
                    name="sectionNameEn"
                    label="Section Name (English)"
                  >
                    <Input
                      disabled
                      className="input-element"
                      placeholder="Enter Section Name"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item name="sectionNameL1" label="Section Name (L1)">
                    <Input
                      disabled
                      className="input-element"
                      placeholder="Enter Section Name L1"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item name="sectionNameL2" label="Section Name (L2)">
                    <Input
                      disabled
                      className="input-element"
                      placeholder="Enter Section Name(L2)"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col xs={24} md={12}>
                  <Form.Item name="fullAddress" label="Full Postal Address">
                    <Input
                      className="input-element custom-select"
                      placeholder="Enter Full Postal Address"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col {...colWidths}>
                  <Form.Item
                    name="partNameEn"
                    label="Part Name (English)"
                    // rules={[
                    //   {
                    //     pattern: /^[\p{L}\p{N}\s.,'-]*$/u,
                    //     message: "Please entr a valid Part Name",
                    //   },
                    // ]}
                  >
                    <Input
                      disabled
                      className="input-element"
                      placeholder="Enter Part Name"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item name="partNameL1" label="Part Name (L1)">
                    <Input
                      disabled
                      className="input-element"
                      placeholder="Enter Part Name L1"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item name="partNameL2" label="Part Name (L2)">
                    <Input
                      disabled
                      className="input-element"
                      placeholder="Enter Part Name L2"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                <Col {...colWidths}>
                  <Form.Item
                    name="pincode"
                    label="Pincode"
                    rules={[
                      { message: "Please enter the Pincode" },
                      {
                        pattern: /^[0-9]{6}$/,
                        message: "Pincode must be 6 digits",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      disabled
                      placeholder="Enter Pincode"
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item
                    name="partLati"
                    label="Part Latitude"
                    // validateStatus={partLatError ? "error" : ""}
                    // help={partLatError}
                    // rules={[
                    //   { message: "Please enter latitude" },
                    //   {
                    //     pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                    //     message: "Please enter a valid latitude (-90 to 90)",
                    //   },
                    // ]}
                  >
                    <Input
                      className="input-element"
                      disabled
                      placeholder="Enter Part Latitude"
                      // onChange={(e) => {
                      //   const value = e.target.value;
                      //   console.log("Booth Latitude changed:", value); // Debug log
                      //   validateDecimalPlaces(
                      //     e.target.value,
                      //     -90,
                      //     90,
                      //     setPartLatError
                      //   );
                      // }}
                    />
                  </Form.Item>
                </Col>
                <Col {...colWidths}>
                  <Form.Item
                    name="partLong"
                    label="Part Longitude"
                    // validateStatus={partLngError ? "error" : ""}
                    // help={partLngError}
                    // rules={[
                    //   { message: "Please enter longitude" },
                    //   {
                    //     pattern:
                    //       /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                    //     message: "Please enter a valid longitude (-180 to 180)",
                    //   },
                    // ]}
                  >
                    <Input
                      className="input-element"
                      disabled
                      placeholder="Enter Part Longitude"
                      // onChange={(e) => {
                      //   const value = e.target.value;
                      //   console.log("Booth Longitude changed:", value); // Debug log
                      //   validateDecimalPlaces(
                      //     e.target.value,
                      //     -90,
                      //     90,
                      //     setPartLngError
                      //   );
                      // }}
                    />
                  </Form.Item>
                </Col>
              </Row>
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
              {fieldRows.map((row, rowIndex) => (
                <Row
                  gutter={[16, 16]}
                  className="w-full pb-5 items-center"
                  key={`row-${rowIndex}`}
                >
                  {row.map((field, fieldIndex) => (
                    <Col span={field.span} key={`${field.name}-${fieldIndex}`}>
                      {field.type === "static"
                        ? renderStaticField(field)
                        : renderDynamicField(field.dynamicField)}
                    </Col>
                  ))}
                </Row>
              ))}

              {isLocationValid && (
                <Row gutter={[16, 16]} className="w-full pb-5 items-center">
                  <Col xs={24} md={12}>
                    <Form.Item label="Google Maps Link">
                      <Input value={googleMapLink} readOnly />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="QR Code">
                      <QRCodeCanvas value={googleMapLink} size={120} />
                    </Form.Item>
                  </Col>
                </Row>
              )}
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
              <StateAndDistrictPanel stateOptions={stateOptions} />
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
              <RuralLocalBodyPanel />
            </Panel>
          </Collapse>
        </div>
        {/* --------------------------------------------------------------- */}
        <Form.Item>
          <Row gutter={[16, 16]} className="w-full mt-10" justify="center">
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                style={{ marginRight: 16 }}
                disabled={loadingButton}
              >
                {loadingButton && (
                  <Spin size="small" className="custom-spin-dark mr-2" />
                )}
                {isStandalone
                  ? loadingButton
                    ? "Submitting..."
                    : "Add Voter"
                  : "Save and Continue"}
              </Button>
            </Col>
            {/* <Col>
              {!isStandalone && skipVisible && (
                <Button
                  type="default"
                  htmlType="button"
                  className="px-10 py-4 h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
                >
                  Skip for now
                </Button>
              )}
            </Col> */}
          </Row>
        </Form.Item>
      </Form>

      <Modal
        title="Add Religion"
        open={isReligionModalVisible}
        onCancel={handleCancelReligion}
        onClose={() => setIsReligionModalVisible(false)}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
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
            return;
          }
          const religionColor =
           modalReligionForm.getFieldValue("religionColor");
          const formData = new FormData();
          formData.append("religionName", newReligionName);
          if (file) {
            formData.append("religionImage", file);
          }
            if (religionColor) {
            formData.append("religionColor", religionColor);
          }
          try {
            await addReligion(formData, parseInt(selectedElectionId));
            setIsReligionModalVisible(false);
            setReligionFileList([]);
            fetchReligionData(newReligionName);
            setNewReligionName("");
            form.setFieldValue("sub_caste", null);
            form.setFieldValue("caste", null);
          } catch (error) {
            console.error("Error adding religion:", error);
          } finally {
            setLoadingForm(false);
          }
        }}
      >
        <Form form={modalReligionForm} layout="vertical">
          <Form.Item
            label="Religion Name"
            required
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

      <Modal
        title="Add Caste"
        open={isCasteModalVisible}
        onCancel={handleCancelCaste}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
        onOk={async () => {
          setLoadingForm(true);
          if (!selectedReligionForCaste || !newCasteName.trim()) {
            message.error("Please select a religion and enter a caste name.");
            setLoadingForm(false);
            return;
          }
          try {
            console.log("newCasteName", newCasteName);
            console.log("selectedReligionForCaste", selectedReligionForCaste);
            await addCaste(
              newCasteName,
              selectedReligionForCaste,
              parseInt(selectedElectionId)
            );
            // message.success("Caste added successfully!");
            setIsCasteModalVisible(false);
            setNewCasteName("");
            console.log("religionId", religionId);
            fetchCastesData(religionId);
            form.setFieldValue("sub_caste", null);
            modalCasteForm.resetFields();
          } catch (error) {
            console.error("Error adding caste:", error);
          } finally {
            setLoadingForm(false);
          }
        }}
      >
        <Form
          form={modalCasteForm}
          layout="vertical"
          initialValues={{ religion: religionId }}
        >
          <Form.Item
            name="religion"
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
              value={religionId}
              onChange={(value) => {
                console.log(value);
                setSelectedReligionForCaste(value);
              }}
            >
              {religions
                ? religions.map((religion) => (
                    <Option key={religion.key} value={religion.key}>
                      {religion.religionName}
                    </Option>
                  ))
                : ""}
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
        onCancel={handleCancelSubCaste}
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
            modalSubCasteForm.resetFields();
          } catch (error) {
            console.error("Error adding sub-caste:", error);
          } finally {
            setLoadingForm(false);
          }
        }}
        okButtonProps={{
          loading: loadingForm,
          disabled: loadingForm,
          style: { backgroundColor: "#1D4ED8", color: "#fff" },
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
                  {religions.map((religion) => (
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
                    {castes.map((caste) => (
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

      <Modal
        title="Add Party"
        open={isPartyModalVisible}
        onCancel={() => {
          setIsPartyModalVisible(false);
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
    </div>
  );
};

export default AddVoterForm;
