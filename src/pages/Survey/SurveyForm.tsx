import { useEffect, useRef, useState } from "react";
import {
  Button,
  Input,
  Form,
  Select,
  Table,
  Modal,
  Popconfirm,
  Switch,
  Typography,
  message,
  Spin,
  Checkbox,
  Radio,
  Dropdown,
  Menu,
  Row,
  Col,
  notification,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  PlusCircleOutlined,
  EllipsisOutlined,
  SearchOutlined,
  DownOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import {
  getForms,
  toggleFormStatus,
  editForm,
  deleteForm,
  addForm,
  updateFormOrder,
  updateCustomFieldOrderApi,
} from "../../api/formApi";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { DraggableFieldItem } from "./DraggableFieldItem";
import {
  initializeSurveyExport,
  checkSurveyExportStatus,
} from "../../api/exportApi";

const CustomRadioGroup = styled(Radio.Group)`
  .ant-radio-checked .ant-radio-inner {
    border-color: blue;
  }

  .ant-radio-checked .ant-radio-inner::after {
    background-color: blue;
  }
`;

const { Title, Text } = Typography;

// Standard field definitions
const STANDARD_FIELDS = [
  { label: "Your Name", type: "string", required: false },
  { label: "Your Mobile Number", type: "number", required: false },
  { label: "Your Age", type: "number", required: false },
  { label: "Your City/Village", type: "string", required: false },
  { label: "Your Voter Id", type: "string", required: false },
];

const SurveyForm = () => {
  const [form] = Form.useForm();
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loadingButton, setLoadingButton] = useState<boolean>(false);
  const [formName, setFormName] = useState("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [formDescription, setFormDescription] = useState("");
  const [forms, setForms] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [filteredForms, setFilteredForms] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedForms, setSelectedForms] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const { setLoading: setLoadingPage } = useLoading();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const userRole = localStorage.getItem("role");
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const navigate = useNavigate();

  const fetchForms = async () => {
    try {
      setLoadingPage(true);
      const response = await getForms(parseInt(selectedElectionId));
      console.log("Forms data", response.data);
      let forms = response.data.forms || [];
      const submissionCounts = response.data.submissionCounts || {};
      let updatedFormData =
        forms
          .map((formData: any) => ({
            ...formData,
            submissionCount: submissionCounts[formData.id] || 0,
          }))
          .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex)) || [];
      setForms(updatedFormData);
      setFilteredForms(updatedFormData || []);
    } catch (error) {
      //message.error("Failed to fetch forms");
      console.error("Error fetching forms:", error);
    } finally {
      setLoadingPage(false);
    }
  };

  // Separate standard fields from custom fields
  const getStandardFields = (fields: any[]) => {
    return fields.filter((field) =>
      STANDARD_FIELDS.some((stdField) => stdField.label === field.label)
    );
  };

  const getNonStandardFields = (fields: any[]) => {
    return fields.filter(
      (field) =>
        !STANDARD_FIELDS.some((stdField) => stdField.label === field.label)
    );
  };

  // Add a new custom field
  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: Date.now(),
        label: "",
        type: "string",
        options: [],
        orderIndex: customFields.length,
        required: false,
      },
    ]);
  };

  // Handle adding new dropdown option
  const addFieldOption = (index: number) => {
    const updatedFields = [...customFields];
    updatedFields[index].options = [
      ...(updatedFields[index].options || []),
      "",
    ];
    console.log("updated fields", updatedFields);
    setCustomFields(updatedFields);
  };

  const deleteCustomField = (indexToDelete: number) => {
    const updatedFields = [...customFields];
    updatedFields.splice(indexToDelete, 1);
    setCustomFields(updatedFields);
  };

  const updateFieldOption = (
    index: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedFields = [...customFields];
    updatedFields[index].options[optionIndex] = value;
    console.log("updated fields", updatedFields);
    setCustomFields(updatedFields);
  };

  const deleteFieldOption = (index: number, optionIndex: number) => {
    const updatedFields = [...customFields];
    updatedFields[index].options.splice(optionIndex, 1);
    console.log("updated fields", updatedFields);
    setCustomFields(updatedFields);
  };

  // Toggle Form Status (Active/Inactive)
  const handleToggleStatus = async (formId: string, isActive: boolean) => {
    try {
      await toggleFormStatus(parseInt(selectedElectionId), formId, {
        isActive,
      });
      const updatedForms = forms.map((form) =>
        form.id === formId ? { ...form, isActive } : form
      );
      setForms(updatedForms);
      setFilteredForms(updatedForms);
      message.success(
        `Form ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      message.error("Failed to update form status");
      console.error("Error updating form status:", error);
    }
  };

  const handleFieldLabelChange = (id: number, newLabel: string) => {
    setCustomFields((prevFields) =>
      prevFields.map((field) =>
        field.id === id ? { ...field, label: newLabel } : field
      )
    );
  };

  const handleEdit = (formData: any) => {
    console.log("Form data", formData);
    setEditingForm(formData);
    setFormName(formData.formName);
    const fieldsWithIdsAndOrder = formData.customFields.map(
      (field: any, index: number) => ({
        ...field,
        id:
          field.id ||
          `field-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        // orderIndex: field.orderIndex !== undefined ? field.orderIndex : index,
      })
    );
    setCustomFields(fieldsWithIdsAndOrder);
    form.setFieldsValue({
      formName: formData.formName,
      formDescription: formData.formDescription,
    });
    setIsModalVisible(true);
  };

  const handleView = (formData: any) => {
    setEditingForm(formData);
    setFormName(formData.formName);
    setFormDescription(formData.formDescription);
    setCustomFields(formData.customFields);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    console.log("close modal called");
    setEditingForm(null);
    setCustomFields([]);
    setFormName("");
    setFormDescription("");
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleSurveyExport = async (formId: string) => {
    if (!formId || !selectedElectionId) {
      notification.warning({
        message: "Missing Data",
        description: "Election ID or Form ID is missing.",
      });
      return;
    }

    try {
      setIsExporting(true);
      console.log(
        "Starting export for formId:",
        formId,
        "electionId:",
        selectedElectionId
      );
      const res = await initializeSurveyExport(
        Number(selectedElectionId),
        formId
      );
      const jobId = res.data?.jobId;
      console.log("Job ID", jobId);

      if (!jobId) throw new Error("No jobId received.");

      notification.info({
        message: "Export Started",
        description:
          "Survey form export has been initiated. You will be notified once it's ready.",
      });
      await new Promise((resolve, reject) => setTimeout(resolve, 2000));
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(async () => {
        try {
          const statusRes = await checkSurveyExportStatus(
            parseInt(selectedElectionId),
            jobId
          );
          const jobData = statusRes.data.find(
            (job: any) => job.jobId === jobId
          );

          const downloadUrl = jobData.downloadUrl || jobData.awsS3DownloadUrl;

          if (jobData?.status === "COMPLETED" && downloadUrl) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            // Create download function
            const handleDownload = () => {
              try {
                const link = document.createElement("a");
                link.href = downloadUrl;

                // Extract filename from URL or use a default name
                const urlParts = downloadUrl.split("/");
                const filename =
                  urlParts[urlParts.length - 1] || "survey-export.xlsx";

                link.download = filename;
                link.style.display = "none";

                // Append to body, click, and remove
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (error) {
                console.error("Download failed:", error);
                // Fallback to opening in new tab if download fails
                window.open(downloadUrl, "_blank");
              }
            };

            notification.success({
              message: "Survey Export Completed",
              description: (
                <div className="flex flex-col gap-2">
                  <p className="text-gray-700">
                    Your export is ready. Click the button below to download the
                    file:
                  </p>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow transition-all duration-200 border-none cursor-pointer"
                  >
                    <DownloadOutlined className="mr-2" />
                    Download Exported File
                  </button>
                </div>
              ),
              duration: 0,
              placement: "topRight",
            });
          } else if (jobData?.status === "FAILED") {
            // Clear the interval when failed
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            notification.error({
              message: "Export Failed",
              description: "The export job failed to complete.",
            });
          }
        } catch (err) {
          console.error("Polling error", err);
          // Clear the interval on error
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Check for unauthorized error (401)
          if (err.response?.status === 401) {
            console.log("Session expired 401");
            // notification.error({
            //   message: "Session Expired",
            //   description: "Please login again to continue.",
            // });
          }
        }
      }, 5000);
    } catch (error) {
      console.error("Export error", error);
      // Clear interval on initial error
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      notification.error({
        message: "Export Failed",
        description: "Something went wrong while exporting the survey form.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const saveCustomFieldOrder = async (
    formId: string,
    fields = customFields
  ) => {
    try {
      const payload = [
        // Standard fields with fixed order
        ...STANDARD_FIELDS.map((stdField, index) => {
          const existingField = fields.find((f) => f.label === stdField.label);
          return {
            fieldLabel: stdField.label,
            newOrderIndex: index, // Fixed order for standard fields
            ...(existingField || {}), // Include any existing field data
          };
        }),
        // Custom fields with their current order
        ...fields
          .filter(
            (field) =>
              !STANDARD_FIELDS.some(
                (stdField) => stdField.label === field.label
              )
          )
          .map((field, index) => ({
            fieldLabel: field.label,
            newOrderIndex: STANDARD_FIELDS.length + index, // Continue numbering after standard fields
            type: field.type,
            required: field.required,
            options: field.options,
          })),
      ];
      console.log("Payload for custom field order", payload);

      const response = await updateCustomFieldOrderApi(
        parseInt(selectedElectionId),
        formId,
        payload
      );
      console.log("Response from updateCustomFieldOrderApi", response);
      message.success("Field order saved successfully");
    } catch (error) {
      message.error("Failed to save field order");
      console.error("Error saving field order:", error);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCustomFields((items) => {
        const oldIndex = items.findIndex(
          (item) => item.id.toString() === active.id
        );
        const newIndex = items.findIndex(
          (item) => item.id.toString() === over.id
        );
        const newItems = arrayMove(items, oldIndex, newIndex);

        if (editingForm && !editingForm.viewOnly) {
          saveCustomFieldOrder(editingForm.id, newItems);
        }

        return newItems;
      });
    }
  };

  const onFormsDragEnd = async (result: any) => {
    setIsDragging(false);
    if (!result.destination) return;

    const reorderedItems = [...filteredForms];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setFilteredForms(reorderedItems);
    setForms(reorderedItems);

    const payload = reorderedItems.map((form, index) => ({
      formId: form.id,
      newOrderIndex: index,
    }));
    console.log("Payload for form order update", payload);

    try {
      await updateFormOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update form order", error);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoadingButton(true);
      console.log("Values", values);
      // const payload = {
      //   formName: values.formName,
      //   formDescription: values.formDescription,
      //   customFields: [
      //     // Include standard fields first
      //     ...STANDARD_FIELDS.map((stdField) => ({
      //       ...stdField,
      //       // Preserve any existing standard field data if editing
      //       ...(editingForm?.customFields.find(
      //         (f: any) => f.label === stdField.label
      //       ) || {}),
      //       // orderIndex: STANDARD_FIELDS.findIndex(
      //       //   (f) => f.label === stdField.label
      //       // ),
      //     })),
      //     ...customFields
      //       .filter(
      //         (field) =>
      //           !STANDARD_FIELDS.some(
      //             (stdField) => stdField.label === field.label
      //           ) && field.label.trim() !== ""
      //       )
      //       .map((field, index) => ({
      //         label: field.label,
      //         type: field.type,
      //         required: field.required || false,
      //         options:
      //           field.type === "dropdown" ||
      //           field.type === "multi-select" ||
      //           field.type === "check-box" ||
      //           field.type === "radio"
      //             ? (field.options || []).filter(
      //                 (opt: string) => opt.trim() !== ""
      //               )
      //             : undefined,
      //         ...(editingForm && {
      //           orderIndex: getStandardFields(customFields).length + index,
      //         }),
      //       })),
      //   ],
      //   isActive: editingForm ? editingForm.isActive : true,
      // };

      // Include standard fields first
      const standardFieldsWithOrder = STANDARD_FIELDS.map((stdField, index) => {
        const existingField =
          // Preserve any existing standard field data if editing
          editingForm?.customFields.find(
            (f: any) => f.label === stdField.label
          ) || {};
        return {
          ...stdField,
          ...existingField,
          orderIndex:
            existingField.orderIndex !== undefined
              ? existingField.orderIndex
              : index, // Default: 0,1,2,3
        };
      });

      const startingIndex = standardFieldsWithOrder.length;

      const filteredCustomFields = customFields
        .filter(
          (field) =>
            !STANDARD_FIELDS.some(
              (stdField) => stdField.label === field.label
            ) && field.label.trim() !== ""
        )
        .map((field, index) => ({
          label: field.label,
          type: field.type,
          required: field.required || false,
          options:
            field.type === "dropdown" ||
            field.type === "multi-select" ||
            field.type === "check-box" ||
            field.type === "radio"
              ? (field.options || []).filter((opt: string) => opt.trim() !== "")
              : undefined,
          orderIndex: startingIndex + index,
        }));

      const payload = {
        formName: values.formName,
        formDescription: values.formDescription,
        customFields: [...standardFieldsWithOrder, ...filteredCustomFields],
        isActive: editingForm ? editingForm.isActive : true,
      };
      if (editingForm) {
        const editPayload = { ...payload, id: editingForm.id };
        console.log("Payload edit", editPayload);
        // Update existing form
        const res = await editForm(
          parseInt(selectedElectionId),
          editingForm.id,
          editPayload
        );
        console.log("Response", res);
      } else {
        // Add new form
        console.log("Payload add", payload);
        const response = await addForm(parseInt(selectedElectionId), payload);

        console.log("Response", response);
        if (response.status === "success") {
          message.success("Survey created successfully");
        }
      }
      fetchForms();
      setIsModalVisible(false);
      setEditingForm(null);
      setCustomFields([]);
      setFormName("");
      setFormDescription("");
      form.resetFields();
    } catch (error) {
      console.error("Error creating or updating form", error);
    } finally {
      setLoadingButton(false);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all survey form data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all survey
            form data.
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
            I understand that by confirming, all form data will be permanently
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
          await handleDelete([]);
        }
      },
    });
  };

  const handleDelete = async (formIds?: number[]) => {
    try {
      await deleteForm(parseInt(selectedElectionId), formIds);
      const successMessage = formIds?.length
        ? `${formIds.length} Form deleted successfully`
        : "All Forms deleted successfully";
      message.success(successMessage);
      fetchForms(); // Refresh the forms list
    } catch (error) {
      const errorMessage = formIds?.length
        ? "Failed to delete selected Forms"
        : "Failed to delete all Forms";
      console.error(errorMessage, error);
    }
  };

  const columns = [
    { title: "Form Name", dataIndex: "formName", key: "formName" },
    {
      title: "Form Description",
      dataIndex: "formDescription",
      key: "formDescription",
      ellipsis: true,
      render: (text: string) => (
        <div
          style={{
            maxHeight: "3em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
          }}
        >
          {text}
        </div>
      ),

      width: 400,
    },
    {
      title: "Total Form Submissions",
      dataIndex: "submissionCount",
      key: "submissionCount",
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value: boolean, record: any) => (
        <Switch
          checked={value}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          style={{
            backgroundColor: value ? "#52c41a" : "",
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => {
        const handleMenuClick = ({ key }: { key: string }) => {
          if (key === "view") {
            handleView({ ...record, viewOnly: true });
          } else if (key === "edit") {
            handleEdit(record);
          } else if (key === "export") {
            handleSurveyExport(record.id);
          } else if (key === "view-submission") {
            navigate(`/surveyForm/${record.id}`);
          }
        };

        const menuItems = [
          {
            key: "view",
            label: "View Form",
            icon: <EyeOutlined />,
          },
          {
            key: "view-submission",
            label: "View Form Submissions",
            icon: <EyeOutlined />,
          },
          {
            key: "edit",
            label: "Edit",
            icon: <EditOutlined />,
            disabled:
              !isSuperAdminOrAdmin && !hasDeletePermission("surveyForm"),
          },
          {
            key: "export",
            label: "Export Form",
            icon: <DownloadOutlined />,
          },
          {
            key: "delete",
            label: (
              <Popconfirm
                title="Are you sure you want to delete this form?"
                onConfirm={() => handleDelete([record.id])}
                okText="Yes"
                cancelText="No"
                disabled={
                  !isSuperAdminOrAdmin && !hasDeletePermission("surveyForm")
                }
              >
                <span>Delete</span>
              </Popconfirm>
            ),
            icon: <DeleteOutlined />,
            danger: true,
          },
        ];

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleMenuClick,
            }}
            trigger={["click"]}
          >
            <EllipsisOutlined style={{ cursor: "pointer" }} />
          </Dropdown>
        );
      },
    },
  ];
  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = forms.filter((form) =>
      form.formName?.toString().toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredForms(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "Delete Selected Forms",
            content: `Are you sure you want to delete ${selectedForms.length} form(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(selectedForms.map((form) => form.id));
            },
          });
        }}
        disabled={
          selectedForms.length === 0 || loading
          // ||
          // (!isSuperAdminOrAdmin && !hasDeletePermission("form"))
        }
      >
        {loading ? "Deleting..." : `Delete Selected (${selectedForms.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={!isSuperAdminOrAdmin && !hasDeletePermission("surveyForm")}
        danger
      >
        Delete All Forms
      </Menu.Item>
    </Menu>
  );
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: any[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedForms(selectedRows);
    },
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchForms();
    }
  }, [selectedElectionId]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Title level={2} style={{ margin: 0 }}>
          Forms
        </Title>
        <Button
          type="primary"
          className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                    hover:!bg-[#1D4ED8] hover:text-[#fff]
                    hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
          onClick={() => setIsModalVisible(true)}
          disabled={!isSuperAdminOrAdmin && !hasDeletePermission("surveyForm")}
        >
          Create Form
        </Button>
      </div>
      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Religion: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Forms"
              className="input-element"
              value={searchQuery}
              onChange={handleInputChange}
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
          <Dropdown overlay={actionsMenu} trigger={["click"]}>
            <Button
              type="primary"
              className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            >
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>

      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={onFormsDragEnd}
      >
        <StrictModeDroppable
          droppableId="forms-droppable"
          direction="vertical"
          type="ROW"
        >
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Table
                className="my-4 default-list-table"
                dataSource={filteredForms}
                columns={columns}
                rowSelection={rowSelection}
                rowKey="id"
                pagination={
                  isDragging
                    ? false
                    : {
                        position: ["bottomCenter"],
                        defaultPageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} of ${total} items`,
                      }
                }
                style={{ backgroundColor: "#1D4ED85C" }}
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredForms.findIndex(
                        (item) => item.id === key
                      );

                      if (isDragging && index === -1) {
                        return <tr {...props}>{props.children}</tr>;
                      }

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
                              style={{
                                ...props.style,
                                ...provided.draggableProps.style,
                                cursor: "move",
                                display: "table-row",
                                position: isDragging ? "relative" : "static", // Fix layout issue
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

      {/* Modal for Creating/Editing/Viewing Form */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {editingForm ? (
              editingForm.viewOnly ? (
                <EyeOutlined className="text-blue-500" />
              ) : (
                <EditOutlined className="text-blue-500" />
              )
            ) : (
              <PlusCircleOutlined className="text-blue-500" />
            )}
            <Title level={4} style={{ margin: 0 }}>
              {editingForm
                ? editingForm.viewOnly
                  ? "Viewing Form"
                  : "Editing Form"
                : "Create New Form"}
            </Title>
          </div>
        }
        open={isModalVisible}
        onCancel={() => closeModal()}
        onClose={() => closeModal()}
        footer={
          editingForm?.viewOnly
            ? [
                <Button key="close" onClick={() => setIsModalVisible(false)}>
                  Close
                </Button>,
              ]
            : [
                <Button key="cancel" onClick={() => setIsModalVisible(false)}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  loading={loadingButton}
                  disabled={loadingButton}
                  onClick={() => form.submit()}
                  className="bg-blue-500 hover:bg-blue-600"
                  icon={editingForm ? <SaveOutlined /> : <PlusOutlined />}
                >
                  {editingForm ? "Save Changes" : "Create Form"}
                </Button>,
              ]
        }
        width={800}
        className="form-creation-modal"
      >
        <Spin spinning={loadingButton} tip="Processing...">
          {editingForm?.viewOnly ? (
            // View mode - Google Forms preview style
            <div className="bg-white p-6 rounded-lg">
              <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 mb-2">
                  {formName || "Untitled Form"}
                </h1>
                {formDescription && (
                  <p className="text-gray-600">{formDescription}</p>
                )}
              </div>

              {/* Standard fields */}
              {getStandardFields(customFields).map((field, index) => (
                <div
                  key={field.label}
                  className="mb-6 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-gray-500 mr-2">{index + 1}.</span>
                    <h3 className="text-base font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                  </div>
                  <div className="ml-6">
                    <div className="text-gray-500 text-sm mb-1">
                      {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                    </div>
                    {(field.type === "dropdown" ||
                      field.type === "multi-select" ||
                      field.type === "radio" ||
                      field.type === "check-box") && (
                      <div className="mt-2">
                        {field.options?.map((option, idx) => (
                          <div key={idx} className="flex items-center mb-2">
                            {field.type === "check-box" ? (
                              <Checkbox disabled className="mr-2" />
                            ) : field.type === "radio" ? (
                              <CustomRadioGroup>
                                <Radio disabled className="mr-2" />
                              </CustomRadioGroup>
                            ) : null}
                            <span className="text-gray-700">{option}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {![
                      "dropdown",
                      "multi-select",
                      "radio",
                      "check-box",
                    ].includes(field.type) && (
                      <Input
                        placeholder="Your answer"
                        disabled
                        className="bg-white ml-2"
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Custom fields */}
              {getNonStandardFields(customFields).length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Custom Fields
                  </h2>
                  {getNonStandardFields(customFields).map((field, index) => (
                    <div
                      key={field.id}
                      className="mb-6 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-gray-500 mr-2">
                          {getStandardFields(customFields).length + index + 1}.
                        </span>
                        <h3 className="text-base font-medium text-gray-900">
                          {field.label}
                        </h3>
                      </div>
                      <div className="ml-6">
                        <div className="text-gray-500 text-sm mb-1">
                          {field.type.charAt(0).toUpperCase() +
                            field.type.slice(1)}
                        </div>
                        {(field.type === "dropdown" ||
                          field.type === "multi-select" ||
                          field.type === "radio" ||
                          field.type === "check-box") && (
                          <div className="mt-2">
                            {field.options?.map((option, idx) => (
                              <div key={idx} className="flex items-center mb-2">
                                {field.type === "check-box" ? (
                                  <Checkbox disabled className="mr-2" />
                                ) : field.type === "radio" ? (
                                  <CustomRadioGroup>
                                    <Radio disabled className="mr-2" />
                                  </CustomRadioGroup>
                                ) : null}
                                <span className="text-gray-700">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {![
                          "dropdown",
                          "multi-select",
                          "radio",
                          "check-box",
                        ].includes(field.type) && (
                          <Input
                            placeholder="Your answer"
                            disabled
                            className="bg-white ml-2"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Edit mode - Google Forms creation style
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ formName, formDescription }}
            >
              <div className="bg-white p-6 rounded-lg mb-4">
                <Form.Item
                  name="formName"
                  label="Form Name"
                  rules={[{ required: true, message: "Form name is required" }]}
                >
                  <Input
                    size="large"
                    placeholder="Form Name"
                    className="text-base border hover:bg-gray-50 focus:bg-gray-50 "
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </Form.Item>
                <Form.Item label="Form Description" name="formDescription">
                  <Input
                    size="large"
                    placeholder="Form description"
                    className="text-base border hover:bg-gray-50 focus:bg-gray-50 "
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </Form.Item>
              </div>

              <div className="bg-white p-6 rounded-lg mb-4">
                <h3 className="text-base font-medium text-gray-900 mb-4">
                  Standard Fields
                </h3>

                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-500 mr-2">1.</span>
                    <h3 className="text-base font-medium text-gray-900">
                      Your Name
                    </h3>
                  </div>
                  <Input size="large" placeholder="Your Name" disabled />
                </div>

                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-500 mr-2">2.</span>
                    <h3 className="text-base font-medium text-gray-900">
                      Your City/Village
                    </h3>
                  </div>
                  <Input
                    size="large"
                    placeholder="Your City/Village"
                    disabled
                  />
                </div>

                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-500 mr-2">3.</span>
                    <h3 className="text-base font-medium text-gray-900">
                      Your Mobile Number
                    </h3>
                  </div>
                  <Input
                    size="large"
                    placeholder="Your Mobile Number"
                    disabled
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center mb-2">
                    <span className="text-gray-500 mr-2">4.</span>
                    <h3 className="text-base font-medium text-gray-900">
                      Your Voter Id
                    </h3>
                  </div>
                  <Input size="large" placeholder="Your Voter Id" disabled />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium text-gray-900">
                    Custom Fields
                  </h3>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addCustomField}
                    className="flex items-center"
                  >
                    Add Field
                  </Button>
                </div>
                <DndContext
                  sensors={sensors}
                  onDragStart={() => console.log("Drag started")}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  // modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                >
                  <SortableContext
                    items={getNonStandardFields(customFields).map((field) =>
                      field.id.toString()
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {getNonStandardFields(customFields).map((field, index) => {
                      const actualIndex = customFields.findIndex(
                        (f) => f.id === field.id
                      );
                      return (
                        <DraggableFieldItem key={field.id} id={field.id}>
                          <div className="mb-6 p-4 border rounded-lg hover:border-gray-300">
                            <div className="flex items-start mb-3">
                              <span className="text-gray-500 mr-2 mt-2">
                                {getStandardFields(customFields).length +
                                  index +
                                  1}
                                .
                              </span>
                              <div className="flex-1">
                                <Input
                                  size="large"
                                  placeholder="Field Label"
                                  value={field.label}
                                  onChange={(e) =>
                                    handleFieldLabelChange(
                                      field.id,
                                      e.target.value
                                    )
                                  } // Updated this line
                                  className="text-base font-medium border-none hover:bg-gray-50 focus:bg-gray-50 px-0"
                                  bordered={false}
                                />
                              </div>
                              <Select
                                defaultValue="string"
                                value={field.type}
                                onChange={(value) => {
                                  const updatedFields = [...customFields];
                                  updatedFields[actualIndex].type = value;
                                  if (
                                    [
                                      "dropdown",
                                      "radio",
                                      "check-box",
                                      "multi-select",
                                    ].includes(value)
                                  ) {
                                    updatedFields[actualIndex].options =
                                      field.options || [];
                                  } else {
                                    updatedFields[actualIndex].options = [];
                                  }
                                  setCustomFields(updatedFields);
                                }}
                                className="w-40"
                                options={[
                                  { value: "string", label: "Text" },
                                  { value: "number", label: "Number" },
                                  {
                                    value: "multi-select",
                                    label: "Multiple choice",
                                  },
                                  { value: "dropdown", label: "Dropdown" },
                                  { value: "radio", label: "Radio" },
                                  { value: "check-box", label: "Checkbox" },
                                  { value: "image", label: "Image upload" },
                                  { value: "file", label: "File upload" },
                                ]}
                              />
                            </div>

                            {(field.type === "dropdown" ||
                              field.type === "radio" ||
                              field.type === "multi-select" ||
                              field.type === "check-box") && (
                              <div className="ml-6 mt-2">
                                {field.options?.map(
                                  (option: any, optionIndex: any) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-center mb-2"
                                    >
                                      {field.type === "check-box" ? (
                                        <Checkbox disabled className="mr-2" />
                                      ) : field.type === "radio" ? (
                                        <CustomRadioGroup>
                                          <Radio disabled className="mr-2" />
                                        </CustomRadioGroup>
                                      ) : null}
                                      <Input
                                        value={option}
                                        onChange={(e) =>
                                          updateFieldOption(
                                            actualIndex,
                                            optionIndex,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Option"
                                        className="w-64 ml-2"
                                      />
                                      <Button
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() =>
                                          deleteFieldOption(
                                            actualIndex,
                                            optionIndex
                                          )
                                        }
                                        className="ml-2"
                                      />
                                    </div>
                                  )
                                )}
                                <Button
                                  type="text"
                                  icon={<PlusOutlined />}
                                  onClick={() => addFieldOption(actualIndex)}
                                  className="flex items-center mt-1"
                                >
                                  Add option
                                </Button>
                              </div>
                            )}

                            {![
                              "dropdown",
                              "radio",
                              "multi-select",
                              "check-box",
                            ].includes(field.type) && (
                              <div className="ml-6 mt-2">
                                <Input
                                  placeholder={
                                    field.type === "string"
                                      ? "Text"
                                      : field.type === "number"
                                      ? "Number"
                                      : field.type === "image"
                                      ? "Image upload placeholder"
                                      : "File upload placeholder"
                                  }
                                  disabled
                                />
                              </div>
                            )}

                            <div className="flex justify-end mt-4">
                              <Button
                                danger
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={() => deleteCustomField(actualIndex)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </DraggableFieldItem>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              </div>
            </Form>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default SurveyForm;
