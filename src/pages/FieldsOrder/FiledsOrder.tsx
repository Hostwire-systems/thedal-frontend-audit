import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Row,
  Col,
  Switch,
  Modal,
  message,
  Space,
  Dropdown,
} from "antd";
import {
  SearchOutlined,
  InfoCircleOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import {
  getDynamicFieldsApi,
  getSavedFieldsApi,
  updateFieldsOrderApi,
  updateDynamicFieldOrder,
  updateDynamicFieldStatus,
  editDynamicFieldApi,
  updateAllDynamicFieldsRequired,
  updateAllDynamicFieldsStatus,
} from "../../api/dynamicFieldApi";
import {
  getFieldStatus,
  updateFieldStatus,
  updateStaticFieldsOrder,
  getApiFieldRequiredCode,
  getApiFieldCode,
  type StaticFieldStatus,
  type StaticFieldStatusResponse,
  updateFieldRequiredStatus,
  updateAllStaticFieldsRequired,
  updateAllStaticFieldsStatus,
} from "../../api/voterFieldsApi";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";

interface Field {
  id: string | number;
  name: string;
  label?: string;
  orderIndex: number;
  isActive?: boolean;
  isStatic: boolean;
  enabled?: boolean;
  required?: boolean;
  fillPercentage?: number;
  fillCount?: number;
  emptyCount?: number;
  type?: string;
  isLocationPair?: boolean; // Flag to identify the longitude field that pairs with latitude
}

interface DynamicField {
  id: string; // backend id returned as number but used as string key in UI
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  name?: string; // some APIs return a separate internal name; optional
  status?: boolean; // kept for backend consistency though column removed
  orderIndex?: number;
}

// Static fields configuration with default order
const STATIC_FIELDS: Field[] = [
  {
    id: "voterHistory",
    name: "voterHistory",
    label: "Voting History",
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
    id: "whatsapp_number",
    name: "whatsapp_number",
    label: "Whatsapp Number",
    orderIndex: 3,
    isStatic: true,
  },
  {
    id: "voterLati",
    name: "voterLati",
    label: "Location",
    orderIndex: 4,
    isStatic: true,
  },
  {
    id: "voterLongi",
    name: "voterLongi",
    label: "Location",
    orderIndex: 5,
    isStatic: true,
    isLocationPair: true, // Mark this as the hidden pair field
  },
  {
    id: "date_of_birth",
    name: "date_of_birth",
    label: "Date of Birth",
    orderIndex: 6,
    isStatic: true,
  },
  {
    id: "email",
    name: "email",
    label: "Email",
    orderIndex: 7,
    isStatic: true,
  },
  {
    id: "religion",
    name: "religion",
    label: "Religion",
    orderIndex: 8,
    isStatic: true,
  },
  {
    id: "casteCategory",
    name: "casteCategory",
    label: "Caste Category",
    orderIndex: 9,
    isStatic: true,
  },
  {
    id: "caste",
    name: "caste",
    label: "Caste",
    orderIndex: 10,
    isStatic: true,
  },
  {
    id: "sub_caste",
    name: "sub_caste",
    label: "Sub Caste",
    orderIndex: 11,
    isStatic: true,
  },
  {
    id: "party_affiliation",
    name: "party_affiliation",
    label: "Party Affiliation",
    orderIndex: 12,
    isStatic: true,
  },
  {
    id: "availability",
    name: "availability",
    label: "Voter Category",
    orderIndex: 13,
    isStatic: true,
  },
  {
    id: "scheme",
    name: "scheme",
    label: "Benefit Schemes",
    orderIndex: 14,
    isStatic: true,
  },
  {
    id: "languages",
    name: "languages",
    label: "Mother Tongue",
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
    id: "aadhaarNumber",
    name: "aadhaarNumber",
    label: "Aadhar Card",
    orderIndex: 17,
    isStatic: true,
  },
  {
    id: "panNumber",
    name: "panNumber",
    label: "Pan Card",
    orderIndex: 18,
    isStatic: true,
  },
  {
    id: "partyRegistrationNumber",
    name: "partyRegistrationNumber",
    label: "Membership Number",
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

// Mapping of static field name → possible saved field names
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

const FieldsOrder: React.FC = () => {
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId,
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);
  const LAT_LONG_IDS = ["voterLati", "voterLongi"];

  const [allFields, setAllFields] = useState<Field[]>([]);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [allRequired, setAllRequired] = useState<boolean>(false);
  const [allShowStatus, setAllShowStatus] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [actionDropdownVisible, setActionDropdownVisible] =
    useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [fieldStatusData, setFieldStatusData] =
    useState<StaticFieldStatusResponse | null>(null);
  const [loadingFieldStatus, setLoadingFieldStatus] = useState<boolean>(false);

  // Normalize saved fields → match static field naming
  const normalizeFields = (
    fieldsData: { name: string; orderIndex: number }[],
  ) => {
    return fieldsData.map((field) => ({
      ...field,
      name: fieldNameMap[field.name] || field.name,
    }));
  };

  // Fetch field status data
  const fetchFieldStatus = async () => {
    if (!selectedElectionId) return;

    setLoadingFieldStatus(true);
    try {
      const statusData = await getFieldStatus(parseInt(selectedElectionId));
      console.log("Fields status data", statusData);
      setFieldStatusData(statusData);
      setLoadingFieldStatus(false);
      return statusData;
    } catch (error) {
      console.error("Error fetching field status:", error);
      // Don't show error message as this is optional data
      setLoadingFieldStatus(false);
    }
  };

  const handleToggleAllFields = async (
    status: boolean,
    type: "status" | "required",
  ) => {
    if (isFrozen) {
      message.warning(
        "Election is frozen. Field configuration changes are disabled.",
      );
      return;
    }
    if (!selectedElectionId) return;

    try {
      setLoadingFieldStatus(true);
      console.log("Status passed for all the fields:", status);

      const electionId = parseInt(selectedElectionId);

      if (type === "required") {
        //  Call both required APIs in parallel
        const [dynamicResponse, staticResponse] = await Promise.all([
          updateAllDynamicFieldsRequired(electionId, { status }),
          updateAllStaticFieldsRequired(electionId, { status }),
        ]);

        console.log("Dynamic Required Response:", dynamicResponse);
        console.log("Static Required Response:", staticResponse);

        setAllRequired(status);
      } else {
        //  Call both status APIs in parallel
        const [dynamicResponse, staticResponse] = await Promise.all([
          updateAllDynamicFieldsStatus(electionId, { status }),
          updateAllStaticFieldsStatus(electionId, { status }),
        ]);

        console.log("Dynamic Status Response:", dynamicResponse);
        console.log("Static Status Response:", staticResponse);
        setAllShowStatus(true);
      }

      message.success(
        `${type === "required" ? "Required" : "Status"} ${
          status ? "enabled" : "disabled"
        } for all fields successfully`,
      );
      fetchFields();
    } catch (error: any) {
      console.error("Error toggling fields:", error);
      message.error(
        error?.response?.data?.message ||
          `Failed to update ${type} for all fields`,
      );
    } finally {
      setLoadingFieldStatus(false);
    }
  };

  // Toggle field required status (handles both static and dynamic fields)
  const handleToggleRequiredField = async (
    fieldName: string,
    value: boolean,
  ) => {
    if (isFrozen) {
      message.warning(
        "Election is frozen. Field configuration changes are disabled.",
      );
      return;
    }
    if (!selectedElectionId) return;

    try {
      setLoadingFieldStatus(true);
      console.log("value", value);

      // Find the field to determine if it's static or dynamic
      const currentField = allFields.find((f) => f.name === fieldName);

      // If it's voterLati (Location), also update voterLongi
      const fieldsToUpdate =
        fieldName === "voterLati" ? ["voterLati", "voterLongi"] : [fieldName];

      for (const fName of fieldsToUpdate) {
        const field = allFields.find((f) => f.name === fName);

        if (field?.isStatic) {
          // Handle static field using static fields API
          const apiFieldCode = getApiFieldRequiredCode(fName);
          await updateFieldRequiredStatus(
            parseInt(selectedElectionId),
            apiFieldCode,
            value,
          );
        } else {
          // Handle dynamic field using dynamic fields API
          const dynamicField = dynamicFields.find(
            (field) => field.name === fName,
          );

          if (dynamicField) {
            const payload = {
              ...dynamicField,
              required: value, // updating the required status
            } as any;
            console.log(
              "Payload before dynamic field required status",
              payload,
            );
            await editDynamicFieldApi(
              payload,
              parseInt(dynamicField.id),
              parseInt(selectedElectionId),
            );
          }
        }
      }

      // Refresh field status for static fields
      await fetchFieldStatus();

      message.success(
        `Field mandatory status ${value ? "enabled" : "disabled"} successfully`,
      );

      // Update local field state for all affected fields
      setAllFields((prev) =>
        prev.map((field) =>
          fieldsToUpdate.includes(field.name)
            ? { ...field, required: value }
            : field,
        ),
      );
      setFilteredFields((prev) =>
        prev.map((field) =>
          fieldsToUpdate.includes(field.name)
            ? { ...field, required: value }
            : field,
        ),
      );
    } catch (error: any) {
      console.error("Error toggling field:", error);
      message.error(
        error?.message || "Failed to update field mandatory status",
      );
    } finally {
      setLoadingFieldStatus(false);
    }
  };

  // Toggle field enabled status (handles both static and dynamic fields)
  const handleToggleField = async (
    fieldName: string,
    property: "enabled",
    value: boolean,
  ) => {
    if (isFrozen) {
      message.warning(
        "Election is frozen. Field configuration changes are disabled.",
      );
      return;
    }
    if (!selectedElectionId) return;

    try {
      setLoadingFieldStatus(true);

      // If it's voterLati (Location), also update voterLongi
      const fieldsToUpdate =
        fieldName === "voterLati" ? ["voterLati", "voterLongi"] : [fieldName];

      for (const fName of fieldsToUpdate) {
        const field = allFields.find((f) => f.name === fName);

        if (field?.isStatic) {
          // Handle static field using static fields API
          const apiFieldCode = getApiFieldCode(fName);
          await updateFieldStatus(
            parseInt(selectedElectionId),
            apiFieldCode,
            value,
          );
        } else {
          // Handle dynamic field using dynamic fields API
          const fieldId = field?.id;
          if (fieldId) {
            await updateDynamicFieldStatus(
              parseInt(selectedElectionId),
              Number(fieldId),
              { status: value },
            );
          }
        }
      }

      // Refresh field status for static fields
      await fetchFieldStatus();

      message.success(`Field ${value ? "enabled" : "disabled"} successfully`);

      // Update local field state for all affected fields
      setAllFields((prev) =>
        prev.map((field) =>
          fieldsToUpdate.includes(field.name)
            ? { ...field, enabled: value }
            : field,
        ),
      );
      setFilteredFields((prev) =>
        prev.map((field) =>
          fieldsToUpdate.includes(field.name)
            ? { ...field, enabled: value }
            : field,
        ),
      );
    } catch (error: any) {
      console.error("Error toggling field:", error);
      message.error(error?.message || "Failed to update field status");
    } finally {
      setLoadingFieldStatus(false);
    }
  };

  // Get field status for a specific field
  const getFieldStatusInfo = (
    fieldName: string,
  ): StaticFieldStatus | undefined => {
    if (!fieldStatusData) return undefined;
    const apiFieldCode = getApiFieldCode(fieldName);
    return fieldStatusData.data.find(
      (f: StaticFieldStatus) => f.fieldName === apiFieldCode,
    );
  };

  // Fetch fields data and handle the 3 cases
  const fetchFields = async () => {
    setIsLoading(true);
    try {
      // First fetch field status data
      const statusData = await fetchFieldStatus();

      // Fetch saved order (only contains name and orderIndex)
      const savedResponse = await getSavedFieldsApi(
        parseInt(selectedElectionId),
      );
      const savedFields: Array<{ name: string; orderIndex: number }> =
        savedResponse.data?.fields || [];

      // Check if this is a default/first-time response (id is null and contains firstName/lastName/age)
      const isDefaultResponse =
        savedResponse.data?.id === null &&
        savedFields.some(
          (f) =>
            f.name === "firstName" || f.name === "lastName" || f.name === "age",
        );

      // If default response, trigger initialization with correct order
      if (isDefaultResponse) {
        console.log(
          "Default response detected. Initializing correct field order...",
        );

        // Prepare payload with correct default order (excluding firstName, lastName, age)
        const initializationPayload = {
          fields: STATIC_FIELDS.map((field, index) => ({
            name: field.name,
            newOrderIndex: index + 1,
          })),
        };

        try {
          // Call reorder API to save correct default order
          await updateStaticFieldsOrder(
            parseInt(selectedElectionId),
            initializationPayload,
          );

          message.success("Field order initialized successfully");

          // Reload the page to fetch the newly saved order
          await fetchFields();
          return;
        } catch (error) {
          console.error("Failed to initialize field order:", error);
          message.error("Failed to initialize field order");
        }
      }

      // Fetch current dynamic fields (full field definitions)
      const dynamicResponse = await getDynamicFieldsApi(
        parseInt(selectedElectionId),
      );
      const currentDynamicFields: any[] =
        dynamicResponse.data?.fieldsPage?.content || [];
      setDynamicFields(currentDynamicFields);

      console.log("Saved fields:", savedFields);
      console.log("Current dynamic fields:", currentDynamicFields);

      // ===== CASE 1: No saved order exists =====
      if (savedFields.length === 0) {
        const staticFieldsProcessed = STATIC_FIELDS.map((f, index) => ({
          ...f,
          orderIndex: index, // Maintain static order
        }));

        const dynamicFieldsProcessed = currentDynamicFields
          .filter((df) => df.status) // Only active fields
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map((df, index) => ({
            ...df,
            name: df.name || df.label || `dynamic_${df.id}`, // Ensure name exists
            orderIndex: staticFieldsProcessed.length + index, // Append after static
            isStatic: false,
            required: df.required,
          }));

        const combinedFields = [
          ...staticFieldsProcessed,
          ...dynamicFieldsProcessed,
        ];
        console.log("Combined fields", combinedFields);
        setAllFields(combinedFields);
        setFilteredFields(combinedFields);
        return;
      }

      // ===== CASES 2-4: Saved order exists =====
      // Process static fields - use saved order if available
      const normalizedSavedFields = normalizeFields(savedFields);

      const staticFieldsProcessed = STATIC_FIELDS.map((staticField) => {
        const savedField = normalizedSavedFields.find(
          (f) => f.name === staticField.name,
        );
        return savedField
          ? { ...staticField, orderIndex: savedField.orderIndex }
          : staticField;
      });

      // Process dynamic fields - match saved order with current fields
      const savedDynamicFields = savedFields
        .filter(
          (savedField) =>
            !STATIC_FIELDS.some((sf) => sf.name === savedField.name), // Only dynamic
        )
        .map((savedField) => {
          // Find matching dynamic field (match by label or empty name)
          const dynamicField = currentDynamicFields.find(
            (df) =>
              (df.status && // Only active
                df.name === savedField.name) ||
              (df.name === "unknown" &&
                !currentDynamicFields.some(
                  (other) => other.label === savedField.name,
                )),
          );
          return dynamicField
            ? {
                ...dynamicField,
                name: dynamicField.name || savedField.name,
                orderIndex: savedField.orderIndex,
                isStatic: false,
              }
            : null;
        })
        .filter(Boolean) // Remove nulls (fields that don't exist anymore)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      // Get unsaved dynamic fields (new fields not in saved order)
      const unsavedDynamicFields = currentDynamicFields
        .filter(
          (df) =>
            // df.status && // Active
            !savedFields.some((sf) => sf.name === df.name) && // Not in saved order
            !STATIC_FIELDS.some((sf) => sf.name === df.name), // Not static
        )
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      // Combine all fields
      const combinedFields = [
        ...staticFieldsProcessed,
        ...savedDynamicFields,
        ...unsavedDynamicFields.map((df, index) => ({
          ...df,
          name: df.name || df.label || `dynamic_${df.id}`,
          required: df.required,
          orderIndex:
            (savedDynamicFields[savedDynamicFields.length - 1]?.orderIndex ||
              staticFieldsProcessed.length) +
            index +
            1,
          isStatic: false,
        })),
      ].sort((a, b) => a.orderIndex - b.orderIndex);
      console.log("Combined fields", combinedFields);

      // Merge field status data
      const fieldsWithStatus = combinedFields.map((field) => {
        if (field.isStatic) {
          // For static fields, use static fields API data
          console.log("Field name received", field.name);
          const apiFieldCode = getApiFieldCode(field.name);
          const statusInfo = statusData?.data?.find(
            (f: StaticFieldStatus) => f.fieldName === apiFieldCode,
          );
          console.log(`status info of ${field.name}`, statusInfo);
          console.log("Before combining static fields", {
            ...field,
            enabled: statusInfo ? statusInfo.status : true,
            required: statusInfo ? statusInfo.mandatory : false,
            fillPercentage: 0,
            fillCount: 0,
            emptyCount: 0,
            type: "TEXT",
          });
          return {
            ...field,
            enabled: statusInfo ? statusInfo.status : true,
            required: statusInfo ? statusInfo.mandatory : false,
            fillPercentage: 0,
            fillCount: 0,
            emptyCount: 0,
            type: "TEXT",
          };
        } else {
          // For dynamic fields, use the status from the API directly
          console.log("Before combining static fields", {
            ...field,
            enabled: field.status !== undefined ? field.status : true,
            required: field.required,
            fillPercentage: 0,
            fillCount: 0,
            emptyCount: 0,
            type: "TEXT",
          });
          return {
            ...field,
            enabled: field.status !== undefined ? field.status : true,
            required: field.required,
            fillPercentage: 0,
            fillCount: 0,
            emptyCount: 0,
            type: "TEXT",
          };
        }
      });

      setAllFields(fieldsWithStatus);
      // Filter out voterLongi for display only
      setFilteredFields(fieldsWithStatus.filter((f) => !f.isLocationPair));

      const allStatusTrue = fieldsWithStatus.every(
        (field) => field.enabled === true,
      );
      const allRequiredTrue = fieldsWithStatus.every(
        (field) => field.required === true,
      );

      setAllShowStatus(allStatusTrue);
      setAllRequired(allRequiredTrue);
    } catch (error) {
      console.error("Error fetching fields:", error);
      message.error("Failed to load fields");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchFields();
    }
  }, [selectedElectionId]);

  const handleSearch = (query: string) => {
    if (!query) {
      // Filter out voterLongi for display
      setFilteredFields(allFields.filter((f) => !f.isLocationPair));
      return;
    }
    const filtered = allFields.filter(
      (field) =>
        !field.isLocationPair && // Exclude voterLongi from display
        (field.name.toLowerCase().includes(query.toLowerCase()) ||
          (field.label &&
            field.label.toLowerCase().includes(query.toLowerCase()))),
    );
    setFilteredFields(filtered);
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = (result: DropResult) => {
    setIsDragging(false);
    if (isFrozen) return;

    if (!result.destination) return;

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    const items = Array.from(filteredFields);
    const draggedItem = items[startIndex];

    // Check if we are dragging the Location field (voterLati)
    if (draggedItem.id === "voterLati") {
      // Location field - need to move both lat and long together
      const [reorderedItem] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, reorderedItem);

      // Update orderIndex for filtered items (displayed items)
      const updatedFilteredItems = items.map((item, index) => ({
        ...item,
        orderIndex: index,
      }));

      // Now reconstruct allFields with voterLongi inserted right after voterLati
      const updatedAllFields = updatedFilteredItems.flatMap((item) => {
        if (item.id === "voterLati") {
          // Insert both lat and long with consecutive orderIndex
          const longiField = allFields.find((f) => f.id === "voterLongi");
          return [
            { ...item, orderIndex: item.orderIndex },
            { ...longiField!, orderIndex: item.orderIndex + 0.5 }, // Temporary fractional index
          ];
        }
        return [item];
      });

      // Re-normalize orderIndex to be sequential integers
      const normalizedAllFields = updatedAllFields
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item, index) => ({
          ...item,
          orderIndex: index,
        }));

      setFilteredFields(updatedFilteredItems);
      setAllFields(normalizedAllFields);

      // Save with all fields including voterLongi
      saveFieldsOrder(normalizedAllFields);
    } else {
      // Normal drag behavior for non-location fields
      const [reorderedItem] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, reorderedItem);

      // Update orderIndex for filtered items
      const updatedFilteredItems = items.map((item, index) => ({
        ...item,
        orderIndex: index,
      }));

      // Reconstruct allFields with voterLongi positioned right after voterLati
      const updatedAllFields = updatedFilteredItems.flatMap((item) => {
        if (item.id === "voterLati") {
          const longiField = allFields.find((f) => f.id === "voterLongi");
          return [
            { ...item, orderIndex: item.orderIndex },
            { ...longiField!, orderIndex: item.orderIndex + 0.5 },
          ];
        }
        return [item];
      });

      // Re-normalize orderIndex
      const normalizedAllFields = updatedAllFields
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((item, index) => ({
          ...item,
          orderIndex: index,
        }));

      console.log("Updated items", normalizedAllFields);

      setFilteredFields(updatedFilteredItems);
      setAllFields(normalizedAllFields);

      // Save with all fields
      saveFieldsOrder(normalizedAllFields);
    }
  };

  const saveFieldsOrder = async (fieldsToSave: Field[]) => {
    setIsLoading(true);
    try {
      // Get current dynamic fields for validation
      const dynamicResponse = await getDynamicFieldsApi(
        parseInt(selectedElectionId),
      );
      const currentDynamicFields =
        dynamicResponse.data?.fieldsPage?.content || [];

      console.log("=== DEBUG: Dual API Approach ===");
      console.log("Fields to save:", fieldsToSave);

      // Separate static and dynamic fields
      const staticFields: { name: string; newOrderIndex: number }[] = [];
      const dynamicFields: { fieldId: number; newOrderIndex: number }[] = [];

      fieldsToSave.forEach((field) => {
        if (field.isStatic) {
          // Static fields - use field name for the static fields API
          staticFields.push({
            name: field.name,
            newOrderIndex: field.orderIndex,
          });
          console.log(
            `Static field: ${field.name} -> position ${field.orderIndex}`,
          );
        } else {
          // Dynamic fields - use fieldId for the dynamic fields API
          const dynamicField = currentDynamicFields.find(
            (df: any) => df.id === field.id,
          );
          if (dynamicField) {
            const numericId = parseInt(field.id as string);
            if (!isNaN(numericId)) {
              dynamicFields.push({
                fieldId: numericId,
                newOrderIndex: field.orderIndex,
              });
              console.log(
                `Dynamic field: ${field.name} -> ID ${numericId} at position ${field.orderIndex}`,
              );
            }
          }
        }
      });

      // Call both APIs in parallel
      const promises = [];

      if (staticFields.length > 0) {
        const staticPayload = { fields: staticFields };
        console.log("Static fields payload:", staticPayload);
        promises.push(
          updateStaticFieldsOrder(parseInt(selectedElectionId), staticPayload),
        );
      }

      if (dynamicFields.length > 0) {
        console.log("Dynamic fields payload:", dynamicFields);
        promises.push(
          updateDynamicFieldOrder(parseInt(selectedElectionId), dynamicFields),
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        message.success("Fields order updated successfully!");
      } else {
        console.warn("No fields to reorder");
      }
    } catch (error) {
      console.error("Error saving fields order:", error);
      message.error("Failed to update fields order");
    } finally {
      setIsLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => setSelectedRowKeys(selectedKeys),
  };

  const columns = [
    {
      title: "Order",
      dataIndex: "orderIndex",
      key: "orderIndex",
      width: 80,
      render: (text: number) => `#${text}`,
    },
    {
      title: "Field Name",
      dataIndex: "label", // Changed from "name" to "label"
      key: "label",
      render: (text: string, record: Field) => (
        <div>
          <span style={{ textTransform: "capitalize" }}>
            {text || record.name.replace(/_/g, " ")}{" "}
            {/* Fallback to name if no label */}
          </span>
          {record.isStatic && (
            <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>
              (Static)
            </span>
          )}
        </div>
      ),
    },
    {
      title: (
        <Space>
          Status
          <InfoCircleOutlined
            style={{ color: "#1890ff", cursor: "help" }}
            title="Enable/disable field visibility"
          />
        </Space>
      ),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (_: any, record: Field) => (
        <Space
          direction="vertical"
          size="small"
          style={{ alignItems: "center" }}
        >
          <Switch
            checked={record.enabled}
            onChange={(checked) =>
              handleToggleField(record.name, "enabled", checked)
            }
            loading={loadingFieldStatus}
            disabled={isFrozen}
            style={{
              backgroundColor: record.enabled ? "#52c41a" : "#d9d9d9",
            }}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
          <span
            style={{
              fontSize: "12px",
              color: record.enabled ? "#52c41a" : "#999",
              fontWeight: "500",
            }}
          >
            {record.enabled ? "Enabled" : "Disabled"}
          </span>
        </Space>
      ),
    },
    {
      title: (
        <Space>
          Mandatory
          <InfoCircleOutlined
            style={{ color: "#1890ff", cursor: "help" }}
            title="Enable/disable field required"
          />
        </Space>
      ),
      dataIndex: "required",
      key: "required",
      width: 100,
      render: (_: any, record: Field) => (
        <Space
          direction="vertical"
          size="small"
          style={{ alignItems: "center" }}
        >
          <Switch
            checked={record.required}
            onChange={(checked) =>
              handleToggleRequiredField(record.name, checked)
            }
            loading={loadingFieldStatus}
            disabled={isFrozen}
            style={{
              backgroundColor: record.required ? "#52c41a" : "#d9d9d9",
            }}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
          <span
            style={{
              fontSize: "12px",
              color: record.required ? "#52c41a" : "#999",
              fontWeight: "500",
            }}
          >
            {record.required ? "Enabled" : "Disabled"}
          </span>
        </Space>
      ),
    },
  ];

  const actionsMenu = (
    <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 w-[220px] max-h-[450px] overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* 🔹 All Status Section */}
        <div>
          <span className="block mb-3 text-sm font-semibold text-gray-700 tracking-wide">
            All Status
          </span>
          <div className="flex items-center justify-between bg-gray-50 py-2 px-3 rounded-lg border border-gray-100 hover:border-gray-200 transition">
            <Space align="center" size="small">
              <Switch
                checked={allShowStatus}
                onChange={(checked) => handleToggleAllFields(checked, "status")}
                loading={loadingFieldStatus}
                disabled={isFrozen}
                style={{
                  backgroundColor: allShowStatus ? "#52c41a" : "#d9d9d9",
                }}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
              <span
                style={{
                  fontSize: "13px",
                  color: allShowStatus ? "#52c41a" : "#888",
                  fontWeight: 600,
                }}
              >
                {allShowStatus ? "Enabled" : "Disabled"}
              </span>
            </Space>
          </div>
        </div>

        {/* 🔹 All Required Section */}
        <div>
          <span className="block mb-3 text-sm font-semibold text-gray-700 tracking-wide">
            All Required
          </span>
          <div className="flex items-center justify-between bg-gray-50 py-2 px-3 rounded-lg border border-gray-100 hover:border-gray-200 transition">
            <Space align="center" size="small">
              <Switch
                checked={allRequired}
                onChange={(checked) =>
                  handleToggleAllFields(checked, "required")
                }
                loading={loadingFieldStatus}
                disabled={isFrozen}
                style={{
                  backgroundColor: allRequired ? "#1890ff" : "#d9d9d9",
                }}
                checkedChildren="ON"
                unCheckedChildren="OFF"
              />
              <span
                style={{
                  fontSize: "13px",
                  color: allRequired ? "#1890ff" : "#888",
                  fontWeight: 600,
                }}
              >
                {allRequired ? "Enabled" : "Disabled"}
              </span>
            </Space>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Voter Basic Info</h2>
      </div>

      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Fields"
              className="input-element"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={() => handleSearch(searchQuery)}
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
        <Col className="text-right">
        <div className="flex flex-row gap-3">

          <Button
            type="default"
                className="h-[45px] text-[#fff] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            // onClick={}
            >
            Refresh
          </Button>
          {/* Buttons Row (flex) */}
          <div className="flex flex-wrap justify-between gap-3 mt-4 md:mt-0">
            <Dropdown
              overlay={actionsMenu}
              trigger={["click"]}
              open={actionDropdownVisible}
              onOpenChange={(visible) => setActionDropdownVisible(visible)}
              >
              <Button
                type="primary"
                className="h-[45px] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-3 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                >
                Actions <DownOutlined />
              </Button>
            </Dropdown>
          </div>
                </div>
        </Col>
      </Row>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <StrictModeDroppable
          droppableId="droppableFields"
          direction="vertical"
          type="ROW"
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ backgroundColor: "#1D4ED85C" }}
            >
              <Table
                className="my-4 default-list-table"
                dataSource={filteredFields}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                rowSelection={rowSelection}
                pagination={
                  isDragging
                    ? false
                    : {
                        position: ["bottomCenter"],
                        defaultPageSize: 30,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total: number, range: number[]) =>
                          `${range[0]}-${range[1]} of ${total} items`,
                      }
                }
                components={{
                  body: {
                    wrapper: (props: any) => <tbody {...props} />,
                    row: (props: any) => {
                      const key = props["data-row-key"];
                      const rowIndex = filteredFields.findIndex(
                        (field) => field.id === key,
                      );

                      if (isDragging && rowIndex === -1) {
                        return <tr {...props}>{props.children}</tr>;
                      }

                      return (
                        <Draggable
                          key={key}
                          draggableId={String(key)}
                          index={rowIndex}
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...props.style,
                                ...provided.draggableProps.style,
                                cursor: "move",
                                display: "table-row",
                                position: isDragging ? "relative" : "static",
                                top: isDragging ? "" : undefined, // Prevents floating row
                                left: isDragging ? "" : undefined,
                                width: "100%",
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
  );
};

export default FieldsOrder;
