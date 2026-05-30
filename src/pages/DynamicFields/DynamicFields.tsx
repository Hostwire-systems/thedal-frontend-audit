import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
  CheckOutlined,
  NumberOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileOutlined,
  SelectOutlined,
  CloseOutlined,
  SearchOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";

import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { useLoading } from "../../context/LoadingContext";
import {
  getDynamicFieldsApi,
  editDynamicFieldApi,
  addDynamicFieldApi,
  deleteDynamicFieldApi,
  updateDynamicFieldOrder,
} from "../../api/dynamicFieldApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

const { Title } = Typography;

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

const DynamicFields = () => {
  const [form] = useForm();
  const [fields, setFields] = useState<DynamicField[]>([]);
  const [selectedFields, setSelectedFields] = useState<DynamicField[]>([]);

  const [filteredFields, setFilteredFields] = useState<DynamicField[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<DynamicField | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { isLoading, setLoading } = useLoading();
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const selectedType = Form.useWatch("type", form);
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const userRole = localStorage.getItem("role");
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");
  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const fieldTypes = [
    {
      value: "string",
      label: "Text",
      icon: <FileTextOutlined />,
    },
    {
      value: "number",
      label: "Number",
      icon: <NumberOutlined />,
    },
    {
      value: "check-box",
      label: "Checkbox",
      icon: <CheckOutlined />,
    },
    {
      value: "radio",
      label: "Radio",
      icon: <Radio />,
    },
    {
      value: "dropdown",
      label: "Dropdown",
      icon: <SelectOutlined />,
    },
    {
      value: "multi-select",
      label: "Multi-select",
      icon: <SelectOutlined />,
    },
    // {
    //   value: "image",
    //   label: "Image Upload",
    //   icon: <FileImageOutlined />,
    // },
    // {
    //   value: "file",
    //   label: "File Upload",
    //   icon: <FileOutlined />,
    // },
  ];

  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await getDynamicFieldsApi(
        parseInt(selectedElectionId),
        pagination.current - 1, // API uses 0-based index
        pagination.pageSize
      );
      const fieldsData = response.data?.fieldsPage;
      if (fieldsData) {
        fieldsData.content.sort(
          (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
        );
      }

      console.log("Fields data", response.data);
      setFields(fieldsData?.content || []);
      setFilteredFields(fieldsData?.content || []);
      setPagination({
        ...pagination,
        total: fieldsData?.totalElements,
      });
    } catch (error) {
      message.error("Failed to fetch fields");
    } finally {
      setLoading(false);
    }
  };

  // Status toggle removed (column removed). If activation/deactivation is reintroduced,
  // restore previous handleToggle implementation.

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = fields.filter((field) =>
      field.label.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredFields(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const openCreateModal = () => {
    setEditingField(null);
    setViewOnly(false);
    setIsModalVisible(true);
    form.resetFields();
  };

  const openEditModal = (field: DynamicField) => {
    setEditingField(field);
    setViewOnly(false);
    setIsModalVisible(true);
    form.setFieldsValue({
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options || [],
    });
  };

  const openViewModal = (field: DynamicField) => {
    setEditingField(field);
    setViewOnly(true);
    setIsModalVisible(true);
    form.setFieldsValue({
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options || [],
    });
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const items = searchQuery ? [...filteredFields] : [...fields];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    if (searchQuery) {
      setFilteredFields(items);
    } else {
      setFields(items);
    }
    // Update order in backend
    try {
      const payload = items.map((field, index) => ({
        fieldId: Number(field.id),
        newOrderIndex: index,
      }));
      await updateDynamicFieldOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      message.error("Failed to update field order");
      // Revert if API call fails
      fetchFields();
    } finally {
    }
  };

  const handleSubmit = async (values: DynamicField) => {
    if (isFrozen) {
      message.warning("Election is frozen. Field modifications are disabled.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...values,
        name: editingField?.name || values.label,
        options: values.options || [],
      } as any; // dynamic field API accepts flexible shape
      if (editingField) {
        // Update existing field
        await editDynamicFieldApi(
          payload,
          parseInt(editingField.id),
          parseInt(selectedElectionId)
        );
        message.success("Field updated successfully");
        form.resetFields();
      } else {
        // Create new field
        console.log("Payload to add new dynamic field", payload);
        await addDynamicFieldApi(payload, parseInt(selectedElectionId));
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchFields(); // Refresh the list
    } catch (error) {
      message.error("Failed to save field");
    } finally {
      setLoading(false);
    }
  };

  const deleteField = async (id: string) => {
    if (isFrozen) {
      message.warning("Election is frozen. Deleting fields is disabled.");
      return;
    }
    setLoading(true);
    try {
      await deleteDynamicFieldApi(parseInt(selectedElectionId), id);
      message.success("Field deleted successfully");
      fetchFields(); // Refresh the list
    } catch (error) {
      message.error("Failed to delete field");
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all custom fields data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all custom
            fields data.
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
            I understand that by confirming, all custom fields data will be
            permanently deleted
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
          //   await handleDelete([]);
        }
      },
    });
  };
  const handleTableChange = (pagination: any) => {
    setPagination(pagination);
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "Delete Selected Languages",
            content: `Are you sure you want to delete ${selectedFields.length} language(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              //   await handleDelete(selectedFields.map((lan) => lan.id));
            },
          });
        }}
        disabled={
          selectedFields.length === 0 ||
          isLoading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("dynamic-field"))
        }
      >
        {isLoading
          ? "Deleting..."
          : `Delete Selected (${selectedFields.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        // disabled={!isSuperAdminOrAdmin && !hasDeletePermission("language")}
        danger
      >
        Delete All Fields
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const typeInfo = fieldTypes.find((t) => t.value === type);
        return (
          <Space>
            {typeInfo?.icon}
            {typeInfo?.label}
          </Space>
        );
      },
    },

    // Status column removed per requirement
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: DynamicField) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => openViewModal(record)}
          />
          <Button
            icon={<EditOutlined />}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasUpdatePermission("dynamic-field"))
            }
            onClick={() => openEditModal(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasDeletePermission("dynamic-field"))
            }
            onClick={() => deleteField(record.id)}
          />
        </Space>
      ),
    },
  ];

  const dataSource = searchQuery ? filteredFields : fields;

  useEffect(() => {
    fetchFields();
  }, [selectedElectionId, pagination.current, pagination.pageSize]);

  useEffect(() => {
    if (isModalVisible) {
      const initialOptions = editingField?.options || [];
      setOptions(initialOptions);
      form.setFieldsValue({
        options: initialOptions,
        ...(editingField || {}),
      });
    } else {
      // Reset when modal closes
      setOptions([]);
      setNewOption("");
    }
  }, [isModalVisible, editingField]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Dynamic Fields</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                    hover:!bg-[#1D4ED8] hover:text-[#fff]
                    hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={openCreateModal}
            disabled={isFrozen}
          >
            Add Custom Field
          </Button>
        </div>
      </div>

      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Language: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search fields"
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

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <StrictModeDroppable
          droppableId="droppableLanguages"
          direction="vertical"
          type="ROW"
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ backgroundColor: "#1D4ED85C" }}
            >
              {" "}
              <Table
                dataSource={dataSource}
                className="my-4 default-list-table"
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={
                  isDragging
                    ? false // Disable pagination while dragging
                    : {
                        position: ["bottomCenter"],
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} of ${total} items`,
                      }
                }
                components={{
                  body: {
                    wrapper: (props: any) => <tbody {...props} />,
                    row: (props: any) => {
                      const key = props["data-row-key"] as string;
                      const index = dataSource.findIndex(
                        (field) => String(field.id) === String(key)
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
                                position: isDragging ? "relative" : "static",
                                top: isDragging ? "" : undefined,
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

      <FieldModal
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={form.submit}
        editingField={editingField}
        viewOnly={viewOnly}
        loading={isLoading}
        form={form}
        fieldTypes={fieldTypes}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

interface FieldModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: () => void;
  editingField: DynamicField | null;
  viewOnly: boolean;
  loading: boolean;
  form: any;
  fieldTypes: any[];
  handleSubmit: (values: DynamicField) => void;
}

const FieldModal: React.FC<FieldModalProps> = ({
  visible,
  onCancel,
  onOk,
  editingField,
  viewOnly,
  loading,
  form,
  fieldTypes,
  handleSubmit,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const selectedType = Form.useWatch("type", form);

  const addOption = () => {
    if (newOption.trim()) {
      const updatedOptions = [...options, newOption.trim()];
      setOptions(updatedOptions);
      setNewOption("");
      // Update form value
      form.setFieldsValue({ options: updatedOptions });
    }
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    // Update form value
    form.setFieldsValue({ options: updatedOptions });
  };

  useEffect(() => {
    if (visible) {
      const initialOptions = editingField?.options || [];
      setOptions(initialOptions);
      form.setFieldsValue({ options: initialOptions });
    }
  }, [visible, editingField, form]);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {editingField ? (
            viewOnly ? (
              <EyeOutlined className="text-blue-500" />
            ) : (
              <EditOutlined className="text-blue-500" />
            )
          ) : (
            <PlusOutlined className="text-blue-500" />
          )}
          <Title level={4} style={{ margin: 0 }}>
            {editingField
              ? viewOnly
                ? "Viewing Field"
                : "Editing Field"
              : "Create New Field"}
          </Title>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
      footer={
        viewOnly
          ? [
              <Button key="close" onClick={onCancel}>
                Close
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onCancel}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loading}
                onClick={onOk}
                icon={editingField ? <SaveOutlined /> : <PlusOutlined />}
              >
                {editingField ? "Save Changes" : "Create Field"}
              </Button>,
            ]
      }
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ required: false }}
      >
        <Form.Item
          name="label"
          label="Field Label"
          rules={[{ required: true, message: "Please enter field label" }]}
        >
          <Input disabled={viewOnly} placeholder="Enter field label" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Field Type"
          rules={[{ required: true, message: "Please select field type" }]}
        >
          <Select
            disabled={viewOnly}
            placeholder="Select field type"
            options={fieldTypes.map((type) => ({
              value: type.value,
              label: (
                <Space>
                  {type.icon}
                  {type.label}
                </Space>
              ),
            }))}
          />
        </Form.Item>

        {["dropdown", "radio", "check-box", "multi-select"].includes(
          selectedType
        ) && (
          <Form.Item name="options" label="Options">
            {viewOnly ? (
              <div className="space-y-2">
                {options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {selectedType === "check-box" && (
                      <Checkbox disabled checked={false} />
                    )}
                    {selectedType === "radio" && (
                      <Radio disabled checked={false} />
                    )}
                    <span>{option}</span>
                  </div>
                ))}
                {options?.length === 0 && (
                  <span className="text-gray-400">No options</span>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {options?.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[index] = e.target.value;
                          setOptions(newOptions);
                          form.setFieldsValue({ options: newOptions });
                        }}
                        className="flex-1"
                      />
                      <Button
                        icon={<CloseOutlined />}
                        onClick={() => removeOption(index)}
                        danger
                        type="text"
                      />
                    </div>
                  ))}
                </div>
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    onPressEnter={addOption}
                  />
                  <Button
                    type="primary"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    Add
                  </Button>
                </Space.Compact>
              </>
            )}
          </Form.Item>
        )}

        <Form.Item name="required" valuePropName="checked">
          <Checkbox disabled={viewOnly}>Required Field</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DynamicFields;
