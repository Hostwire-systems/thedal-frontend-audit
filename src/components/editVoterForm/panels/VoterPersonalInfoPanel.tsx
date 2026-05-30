import React, { useEffect, useState, useMemo } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Radio,
  FormInstance,
  Upload,
  Checkbox,
} from "antd";
import moment from "moment";
import {
  renderReligionDropdown,
  renderCasteDropdown,
  renderSubCasteDropdown,
  renderPartyDropdown,
  renderAvailabilityDropdown,
  renderLanguageDropdown,
  renderFeedbackDropdown,
  renderHistoryDropdown,
  renderCasteCategoryDropdown,
  SchemeDropdown,
} from "../../../components/addVoterForm/RenderDropdowns";
import { UploadOutlined } from "@ant-design/icons";

import {
  Caste,
  Religion,
  SubCaste,
  Party,
  BenefitScheme,
  LanguageType,
} from "../../../types/voter";
import { VoterHistory } from "../../../types/history";
import { FeedbackType } from "../../../types/feedback";
import { Availability } from "../../../types/availability";
import { CasteCategory } from "../../../types/casteCategory";
import { DynamicField } from "../../../types/dynamicField";
import CustomRadioGroup from "../../../components/common/CustomRadioGroup";
import { normalizeApiFieldNameForConfig } from "../../../api/voterApi";
import { getFieldStatus } from "../../../api/voterFieldsApi";
type SetState<T> = React.Dispatch<React.SetStateAction<T>>;

interface VoterPersonalInfoPanelInterface {
  detectLocation: () => void;
  selectedElectionId?: string;
  validateDecimalPlaces: (
    value: any,
    min: any,
    max: any,
    setError: any
  ) => void;
  isDetectingLocation: boolean;
  setSelectedReligion: SetState<string | null>;
  setReligionId: SetState<number | string | null>;
  setCasteId: SetState<number | string | null>;
  setSubCasteId: SetState<number | string | null>;
  setIsReligionModalVisible: SetState<boolean>;
  setIsCasteModalVisible: SetState<boolean>;
  setIsSubCasteModalVisible: SetState<boolean>;
  setIsAvailabilityModalOpen: SetState<boolean>;
  setIsPartyModalVisible: SetState<boolean>;
  setIsSchemeModalOpen: SetState<boolean>;
  setIsHistoryModalVisible: SetState<boolean>;
  setIsFeedbackModalVisible: SetState<boolean>;
  setIsLanguageModalVisible: SetState<boolean>;
  setIsCasteCategoryModalVisible: SetState<boolean>;
  dynamicFields: DynamicField[];
  religions: Religion[];
  castes: Caste[];
  subCastes: SubCaste[];
  availabilities: Availability[];
  parties: Party[];
  schemes: BenefitScheme[];
  histories: VoterHistory[];
  feedbacks: FeedbackType[];
  languages: LanguageType[];
  casteCategories: CasteCategory[];
  religionId: number | string;
  casteId: number | string;
  subCasteId: number | string;
  form: FormInstance;
  fieldsOrder: any;
}
type FieldConfig = {
  span: number;
  component: string;
  required: boolean;
  status: boolean;
};

const { Option } = Select;

const VoterPersonalInfoPanel = ({
  form,
  selectedElectionId,
  detectLocation,
  isDetectingLocation,
  validateDecimalPlaces,
  dynamicFields,
  religions,
  castes,
  casteCategories,
  subCastes,
  parties,
  availabilities,
  schemes,
  histories,
  feedbacks,
  languages,
  religionId,
  setReligionId,
  setSelectedReligion,
  casteId,
  setCasteId,
  setSubCasteId,
  setIsReligionModalVisible,
  setIsCasteModalVisible,
  setIsCasteCategoryModalVisible,
  setIsSubCasteModalVisible,
  setIsSchemeModalOpen,
  setIsAvailabilityModalOpen,
  setIsPartyModalVisible,
  setIsLanguageModalVisible,
  setIsHistoryModalVisible,
  setIsFeedbackModalVisible,
  fieldsOrder = [],
}: VoterPersonalInfoPanelInterface) => {
  const [latError, setLatError] = useState("");
  const [lngError, setLngError] = useState("");

  // Define static fields with their default column spans and configurations
  const [staticFieldsConfig, setStaticFieldsConfig] = useState<
    Record<string, FieldConfig>
  >({
    age: { span: 4, component: "age", required: false, status: true },
    date_of_birth: {
      span: 4,
      component: "dateOfBirth",
      required: false,
      status: true,
    },
    mobileNo: {
      span: 8,
      component: "mobileNumber",
      required: false,
      status: true,
    },
    whatsapp_number: {
      span: 8,
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
    }, // Special handling
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
      span: 8,
      component: "casteCategory",
      required: false,
      status: true,
    },
  });

  type staticFieldKeys = keyof typeof staticFieldsConfig;

  const fetchFieldStatus = async () => {
    try {
      const statusData = await getFieldStatus(parseInt(selectedElectionId!));
      if (statusData?.data) {
        updateStaticFieldsRequiredStatus(statusData.data);
      }
    } catch (error) {
      console.error("Error fetching field status:", error);
    }
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

  // Process and organize fields based on the ordering requirements
  const organizedFields = useMemo(() => {
    // Step 1: Create active dynamic fields (only status: true)
    const activeDynamicFields = dynamicFields.filter(
      (field) => field.status === true
    );

    // Step 2: Create field mapping for easy lookup
    const staticFieldNames = Object.keys(staticFieldsConfig);
    const dynamicFieldNames = activeDynamicFields.map(
      (field) => field.name || field.label
    );

    // Step 3: Process fieldsOrder array
    const orderedFields: any = [];
    const processedFieldNames = new Set();

    if (fieldsOrder && fieldsOrder.length > 0) {
      // Sort fieldsOrder by orderIndex
      const sortedFieldsOrder = [...fieldsOrder].sort(
        (a, b) => Number(a.orderIndex) - Number(b.orderIndex)
      );

      sortedFieldsOrder.forEach((fieldOrder) => {
        const fieldName = fieldOrder.name;

        // Check if it's a static field
        if (staticFieldNames.includes(fieldName)) {
          let key = fieldName as staticFieldKeys;
          orderedFields.push({
            name: key,
            type: "static",
            span: staticFieldsConfig[key].span,
            component: staticFieldsConfig[key].component,
            required: staticFieldsConfig[fieldName].required,
            status: staticFieldsConfig[fieldName].status,
            orderIndex: fieldOrder.orderIndex,
          });
          processedFieldNames.add(fieldName);
        }
        // Check if it's a dynamic field
        else {
          const dynamicField = activeDynamicFields.find(
            (df) => df.name === fieldName || df.label === fieldName
          );

          if (dynamicField) {
            orderedFields.push({
              name: fieldName,
              type: "dynamic",
              span: 6, // Dynamic fields always take span 6
              dynamicField: dynamicField,
              orderIndex: fieldOrder.orderIndex,
            });
            processedFieldNames.add(fieldName);
          }
        }
      });
    }

    // Step 4: Add remaining static fields (not in fieldsOrder)
    staticFieldNames.forEach((fieldName) => {
      if (!processedFieldNames.has(fieldName)) {
        orderedFields.push({
          name: fieldName,
          type: "static",
          span: staticFieldsConfig[fieldName].span,
          component: staticFieldsConfig[fieldName].component,
          status: staticFieldsConfig[fieldName].status,
          required: staticFieldsConfig[fieldName].required,
          orderIndex: Infinity, // Will be sorted to end
        });
      }
    });

    // Step 5: Add remaining dynamic fields (not in fieldsOrder)
    activeDynamicFields.forEach((dynamicField) => {
      const fieldName = dynamicField.name || dynamicField.label;
      if (!processedFieldNames.has(fieldName)) {
        orderedFields.push({
          name: fieldName,
          type: "dynamic",
          span: 6,
          dynamicField: dynamicField,
          orderIndex: Infinity, // Will be sorted to end
        });
        processedFieldNames.add(fieldName);
      }
    });

    // Step 6: Final sort by orderIndex
    return orderedFields.sort((a, b) => a.orderIndex - b.orderIndex);
  }, [dynamicFields, fieldsOrder, staticFieldsConfig]);

  // Group fields into rows with proper span management
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

  const SchemeTagRender = () => null;

  const renderDynamicField = (field) => {
    const commonProps = {
      name: field.name,
      label: field.label,
      rules: [
        {
          required: field.required,
          message: `${field.label} is required`,
        },
      ],
    };

    switch (field.type) {
      case "string":
        return (
          <Form.Item {...commonProps}>
            <Input placeholder={`Enter ${field.label}`} />
          </Form.Item>
        );

      case "number":
        return (
          <Form.Item
            {...commonProps}
            normalize={(value) => (value ? Number(value) : null)}
          >
            <Input type="number" placeholder={`Enter ${field.label}`} />
          </Form.Item>
        );

      case "check-box":
        return (
          <Form.Item {...commonProps}>
            <Checkbox.Group>
              {field.options?.map((option) => (
                <Checkbox key={option} value={option}>
                  {option}
                </Checkbox>
              )) || []}
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
              )) || []}
            </CustomRadioGroup>
          </Form.Item>
        );

      case "select":
        return (
          <Form.Item {...commonProps}>
            <Select placeholder={`Select ${field.label}`}>
              {field.options?.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              )) || []}
            </Select>
          </Form.Item>
        );
      case "dropdown":
        return (
          <Form.Item {...commonProps}>
            <Select placeholder={`Select ${field.label}`}>
              {field.options?.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              )) || []}
            </Select>
          </Form.Item>
        );

      case "multi-select":
        return (
          <Form.Item {...commonProps}>
            <Select mode="multiple" placeholder={`Select ${field.label}`}>
              {field.options?.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              )) || []}
            </Select>
          </Form.Item>
        );

      // case "image":
      //   return (
      //     <Form.Item {...commonProps}>
      //       <Upload
      //         accept="image/*"
      //         listType="picture-card"
      //         beforeUpload={() => false}
      //       >
      //         <div>
      //           <UploadOutlined />
      //           <div>Upload Image</div>
      //         </div>
      //       </Upload>
      //     </Form.Item>
      //   );

      // case "file":
      //   return (
      //     <Form.Item {...commonProps}>
      //       <Upload beforeUpload={() => false}>
      //         <Button icon={<UploadOutlined />}>Upload File</Button>
      //       </Upload>
      //     </Form.Item>
      //   );

      default:
        return (
          <Form.Item {...commonProps}>
            <Input placeholder={`Enter ${field.label}`} />
          </Form.Item>
        );
    }
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
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="Enter age" />
          </Form.Item>
        );

      case "dateOfBirth":
        return (
          <Form.Item
            name="date_of_birth"
            required={required}
            rules={getRequiredRule("Date of Birth is required")}
            label="Date of Birth"
          >
            <DatePicker
              className="w-full"
              format="DD-MMM-YYYY"
              placeholder="Select date"
              disabledDate={(current) =>
                current && current > moment().endOf("day")
              }
            />
          </Form.Item>
        );

      case "mobileNumber":
        return (
          <Form.Item
            name="mobileNo"
            required={required}
            label="Mobile Number"
            rules={[
              ...getRequiredRule("Mobile number is required"),

              {
                pattern: /^[0-9]{10}$/,
                message: "Phone number must be 10 digits",
              },
            ]}
          >
            <Input
              placeholder="+91  Enter Mobile Number"
              style={{ width: "100%" }}
            />
          </Form.Item>
        );

      case "whatsappNumber":
        return (
          <Form.Item
            name="whatsapp_number"
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
              placeholder="+91  Enter Whatsapp Number"
              style={{ width: "100%" }}
            />
          </Form.Item>
        );

      case "email":
        return (
          <Form.Item
            name="email"
            label="Email"
            required={required}
            rules={[
              ...getRequiredRule("Email is required"),

              {
                type: "email",
                message: "Please enter a valid email",
              },
            ]}
          >
            <Input placeholder="Enter Email" />
          </Form.Item>
        );

      case "voterLatitude":
        return (
          <Form.Item
            name="voterLati"
            label="Voter Latitude"
            required={required}
            validateStatus={latError ? "error" : ""}
            help={latError}
            rules={[
              ...getRequiredRule("Latitude is required"),

              {
                pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                message: "Please enter a valid latitude (-90 to 90)",
              },
            ]}
          >
            <Input
              placeholder="Enter Latitude"
              onChange={(e) =>
                validateDecimalPlaces(e.target.value, -90, 90, setLatError)
              }
            />
          </Form.Item>
        );

      case "voterLongitude":
        return (
          <Form.Item
            name="voterLongi"
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
              placeholder="Enter Longitude"
              onChange={(e) =>
                validateDecimalPlaces(e.target.value, -180, 180, setLngError)
              }
            />
          </Form.Item>
        );

      case "detectLocationButton":
        return (
          <Button
            className="custom-select hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
            onClick={detectLocation}
            loading={isDetectingLocation}
          >
            Detect Location
          </Button>
        );

      case "star":
        return (
          <Form.Item
            name="starNumber"
            rules={getRequiredRule("Please select star status")}
            required={required}
            label="Star"
          >
            <CustomRadioGroup>
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </CustomRadioGroup>
          </Form.Item>
        );

      case "aadhaarNumber":
        return (
          <Form.Item
            name="aadhaarNumber"
            required={required}
            label="Aadhaar Number"
            rules={[
              ...getRequiredRule("Aadhaar number is required"),

              {
                pattern: /^[0-9]{12}$/,
                message: "Aadhaar number must be 12 digits",
              },
            ]}
          >
            <Input placeholder="Enter Aadhaar Number" />
          </Form.Item>
        );

      case "panNumber":
        return (
          <Form.Item
            name="panNumber"
            label="PAN Number"
            required={required}
            rules={[
              ...getRequiredRule("PAN number is required"),

              {
                pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                message: "Invalid PAN format",
              },
            ]}
          >
            <Input placeholder="Enter PAN Number" />
          </Form.Item>
        );

      case "partyRegistrationNumber":
        return (
          <Form.Item
            label="Party Registration Number"
            name="partyRegistrationNumber"
            rules={getRequiredRule("Party registration number is required")}
            required={required}
          >
            <Input placeholder="Enter Party Registration Number" />
          </Form.Item>
        );

      case "religion":
        return (
          <Form.Item
            name="religion"
            rules={getRequiredRule("Religion is required")}
            required={required}
            label="Religion"
          >
            <Select
              labelInValue
              showSearch
              allowClear
              value={form.getFieldValue("religion")}
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              dropdownRender={(menu) =>
                renderReligionDropdown(menu, setIsReligionModalVisible)
              }
              placeholder="Select Religion"
              style={{ width: "100%" }}
              notFoundContent="No religions found"
              onChange={(selected) => {
                if (!selected) {
                  form.setFieldValue("religion", null);
                  form.setFieldValue("caste", null);
                  form.setFieldValue("sub_caste", null);
                  setReligionId(null);
                  setSelectedReligion("");
                  return;
                }
                const selectedRel = religions.find(
                  (r) => r.religionName === selected.label
                );
                form.setFieldValue("religion", selectedRel);
                form.setFieldValue("caste", null);
                form.setFieldValue("sub_caste", null);
                setReligionId(selectedRel?.key || null);
                setSelectedReligion(selected.label);
              }}
            >
              {religions.map((rel) => (
                <Option key={rel.key} value={rel.key}>
                  {rel.religionName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "caste":
        return (
          <Form.Item
            name="caste"
            rules={getRequiredRule("Caste is required")}
            required={required}
            label="Caste"
          >
            <Select
              labelInValue
              allowClear
              dropdownRender={(menu) =>
                renderCasteDropdown(menu, setIsCasteModalVisible)
              }
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Caste"
              style={{ width: "100%" }}
              onChange={(selected) => {
                if (!selected) {
                  form.setFieldValue("caste", null);
                  form.setFieldValue("sub_caste", null);
                  setCasteId(null);
                  return;
                }
                const selectedCasteObj = castes.find(
                  (c) => c.casteName === selected.label
                );
                form.setFieldValue("caste", selectedCasteObj);
                form.setFieldValue("sub_caste", null);
                setCasteId(selectedCasteObj?.key);
              }}
            >
              {castes
                .filter((c) => c.religionId === religionId)
                .map((c) => (
                  <Option key={c.key} value={c.key}>
                    {c.casteName}
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
              labelInValue
              allowClear
              dropdownRender={(menu) =>
                renderSubCasteDropdown(menu, setIsSubCasteModalVisible)
              }
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Sub-Caste"
              style={{ width: "100%" }}
              onChange={(selected) => {
                if (!selected) {
                  setSubCasteId(null);
                  return;
                }
                const subObj = subCastes.find(
                  (sub) => sub.key === selected.value
                );
                setSubCasteId(subObj?.key);
                form.setFieldValue("sub_caste", subObj);
              }}
            >
              {subCastes
                .filter((sub) => {
                  const cObj = castes.find((c) => c.key === casteId);
                  return sub.casteName === cObj?.casteName;
                })
                .map((sub) => (
                  <Option key={sub.key} value={sub.key}>
                    {sub.subCasteName}
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
              dropdownRender={(menu) =>
                renderAvailabilityDropdown(menu, setIsAvailabilityModalOpen)
              }
              placeholder="Select Category"
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availabilities?.map((availability) => (
                <Option
                  key={availability.key}
                  value={availability.categoryName}
                >
                  {availability.categoryName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "partyAffiliation":
        return (
          <Form.Item
            name="party_affiliation"
            required={required}
            rules={getRequiredRule("Party affiliation is required")}
            label="Party Affiliation"
          >
            <Select
              dropdownRender={(menu) =>
                renderPartyDropdown(menu, setIsPartyModalVisible)
              }
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Party"
              style={{ width: "100%" }}
            >
              {parties?.map((p) => (
                <Option key={p.key} value={p.partyName}>
                  {p.partyName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "schemes":
        return (
          <>
            <Form.Item
              name="scheme"
              rules={getRequiredRule("Please select scheme status")}
              required={required}
              label="Schemes"
            >
              <Select
                mode="multiple"
                value={form.getFieldValue("scheme") || []}
                onChange={() => {}}
                popupRender={() => (
                  <SchemeDropdown
                    schemes={schemes}
                    form={form}
                    onAddNewScheme={() => setIsSchemeModalOpen(true)}
                  />
                )}
                placeholder="Select Scheme Status"
                style={{ width: "100%" }}
                showSearch={false}
                // suffixIcon={null}
                maxTagCount={0} // hide default overflow tags
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
            <Form.Item name="schemeStatuses" required={required} noStyle>
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
              placeholder="Select Voting History"
              mode="multiple"
              showSearch
              dropdownRender={(menu) =>
                renderHistoryDropdown(menu, setIsHistoryModalVisible)
              }
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
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
              placeholder="Select Feedback/Issues"
              mode="multiple"
              showSearch
              dropdownRender={(menu) =>
                renderFeedbackDropdown(menu, setIsFeedbackModalVisible)
              }
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
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
            label="Language"
          >
            <Select
              dropdownRender={(menu) =>
                renderLanguageDropdown(menu, setIsLanguageModalVisible)
              }
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Language"
              style={{ width: "100%" }}
            >
              {languages?.map((lan) => (
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
            name="remarks"
            rules={getRequiredRule("Remarks are required")}
            required={required}
            label="Remarks"
          >
            <Input.TextArea
              placeholder="Enter Remarks"
              rows={3}
              style={{ width: "100%" }}
            />
          </Form.Item>
        );

      case "casteCategory":
        return (
          <Form.Item
            name="casteCategory"
            rules={getRequiredRule("Caste category is required")}
            label="Caste-Category"
          >
            <Select
              placeholder="Select Caste Category"
              showSearch
              dropdownRender={(menu) =>
                renderCasteCategoryDropdown(
                  menu,
                  setIsCasteCategoryModalVisible
                )
              }
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
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
  useEffect(() => {
    fetchFieldStatus();
  }, [selectedElectionId]);

  useEffect(() => {
    console.log("Fields order", fieldsOrder);
  }, [fieldsOrder]);

  return (
    <>
      {fieldRows.map((row, rowIndex) => (
        <Row
          gutter={[16, 16]}
          className="w-full items-center pb-5"
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
    </>
  );
};

export default VoterPersonalInfoPanel;
