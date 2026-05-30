import  { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  Row,
  Col,
  Form,
  Input,
  Upload,
  Switch,
  Select,
  Spin,
  Tooltip,
  Dropdown,
  Menu,
  Checkbox,
  Tag,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  DownOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { TemplateCard } from "./TemplateCard";
import {
  getTemplatesByElectionId,
  createTemplateApi,
  updateTemplateApi,
  updateTemplateImageApi,
  TemplateData,
  updateImageApi,
  updateTemplateOrder,
  deleteTemplateApi,
} from "../../api/electionApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import EditTemplateModal from "./EditSlipModal";

const BoothSlipPage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] =
    useState<boolean>(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null
  );
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateData[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateData[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState("");
  const [voterSlipHeader, setVoterSlipHeader] = useState("");
  const [candidateInfoImageFooter, setCandidateInfoImageFooter] = useState("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isImageActive, setIsImageActive] = useState<boolean>(true);
  const [templateOptionId, setTemplateOptionId] = useState<number | null>(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoading: isSlipLoading, setLoading: setIsSlipLoading } =
    useLoading();
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");

  useEffect(() => {
    if (selectedElectionId) {
      fetchTemplates();
    }
  }, [selectedElectionId]);

  const fetchTemplates = async () => {
    // setIsLoading(true);
    setIsSlipLoading(true);
    try {
      const fetchedTemplates = await getTemplatesByElectionId(
        selectedElectionId
      );
      const sortedTemplates = fetchedTemplates.some(
        (template) => template.newOrderIndex == null
      )
        ? fetchedTemplates
        : [...fetchedTemplates].sort(
            (a, b) => Number(a.newOrderIndex!) - Number(b.newOrderIndex!)
          );
      console.log("sortedTemplates", sortedTemplates);
      setTemplates(sortedTemplates);
      setFilteredTemplates(sortedTemplates);
    } catch (err) {
      console.error("[VoterSlipPage] fetchTemplates error:", err);
      setTemplates([]);
      setFilteredTemplates([]);
    } finally {
      // setIsLoading(false);
      setIsSlipLoading(false);
    }
  };

  const closeUpdateModal = () => {
    setIsViewModalVisible(false);
    setUploadedFile(null);
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "templateId",
      key: "templateId",
      render: (text: string, record: TemplateData, index: number) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: "Voter Slip Name",
      dataIndex: "templateName",
      key: "templateName",
    },
    {
      title: "Print Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value: boolean, record: TemplateData) => (
        <Switch
          checked={value}
              disabled={isFrozen}
          onChange={(checked) =>
            handleToggleStatus(record.templateName, checked)
          }
          style={{
            backgroundColor: value ? "green" : undefined,
          }}
        />
      ),
    },
    {
      title: "Candidate Info Image",
      dataIndex: "imageStatus",
      key: "imageStatus",
      render: (value: boolean, record: TemplateData) => (
        <Switch
          checked={value}
              disabled={isFrozen}
          onChange={(checked) =>
            handleToggleImageStatus(record.templateName, checked)
          }
          style={{
            backgroundColor: value ? "green" : undefined,
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text: string, record: TemplateData) => (
        <div className="flex space-x-2">
          <Button
            type="primary"
            icon={<EyeOutlined style={{ color: "white" }} />}
            shape="circle"
            onClick={() => handleViewTemplate(record)}
          />
          <Button
            type="primary"
            icon={<EditOutlined style={{ color: "white" }} />}
            shape="circle"
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasUpdatePermission("boothSlip"))
            }
            className="hover:opacity-50"
            onClick={() => handleEditTemplate(record)}
            style={{ backgroundColor: "#52f144", borderColor: "#52f144" }}
          />
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete([record.templateName])}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              style: {
                backgroundColor: "#1D4ED8",
                borderColor: "white",
              },
            }}
          >
            <Button
              icon={<DeleteOutlined />}
              disabled={
                isFrozen ||
                (!isSuperAdminOrAdmin &&
                  !hasDeletePermission("election-dashboard"))
              }
              shape="circle"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedItems = [...templates];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setTemplates(reorderedItems);
    setFilteredTemplates(reorderedItems);
    const payload = reorderedItems.map((template, index) => ({
      templateName: template?.templateName,
      newOrderIndex: index, // new position after dragging
    }));
    try {
      const response = await updateTemplateOrder(
        parseInt(selectedElectionId),
        payload
      );
      console.log("Response voter slip order updated", response);
      console.log("Voter-slip order updated successfully");
    } catch (error) {
      console.error("Failed to update Voter-slip order", error);
    }
  };

  const handleToggleStatus = async (name: string, newStatus: boolean) => {
    if (isFrozen) return;
    try {
      await updateTemplateApi(selectedElectionId, name, {
        isActive: newStatus,
      });
      fetchTemplates();
    } catch (err) {
      console.error("Error updating template status:", err);
      message.error("Failed to update template status");
    }
  };
  const handleToggleImageStatus = async (
    name: string,
    imageStatus: boolean
  ) => {
    if (isFrozen) return;
    try {
      await updateImageApi(selectedElectionId, name, {
        imageStatus: imageStatus,
      });

      fetchTemplates();
    } catch (err) {
      console.error("Error updating image status:", err);
      message.error("Failed to update image status");
    }
  };

  const handleViewTemplate = (template: TemplateData) => {
    setSelectedTemplate(template);
    setPreviewImageUrl(template.imageUrl || null);
    setIsViewModalVisible(true);
  };

  const handleEditTemplate = (template: TemplateData) => {
    if (isFrozen) return;
    setSelectedTemplate(template);
    setTemplateName(template.templateName.trim());
    setVoterSlipHeader(template.voterSlipHeader || "");
    setCandidateInfoImageFooter(template.candidateInfoImageFooter || "");
    setIsActive(template.isActive);
    setIsImageActive(template.imageStatus);
    setPreviewImageUrl(template.imageUrl || null);
    setIsEditModalVisible(true);
  };

  const handleImageChange = (info: any) => {
    const file = info.file;
    console.log("file", file);
    if (file.status === "removed") {
      setUploadedFile(null);
      setPreviewImageUrl(null);
      return;
    }
    const isValidType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg";
    const isSizeValid = file.size / 1024 / 1024 < 1;

    if (!isValidType) {
      message.error("Only JPG, JPEG, or PNG files are allowed!");
      return;
    }
    if (!isSizeValid) {
      message.error("File size must be less than 1MB!");
      return;
    }

    const namedFile = new File([file], file.name || "uploaded-image.png", {
      type: file.type,
    });

    setUploadedFile(namedFile);

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setPreviewImageUrl(fileReader.result as string);
    };
    fileReader.readAsDataURL(namedFile);
  };

  const handleUpdateImage = async () => {
    if (isFrozen) return;
    if (!selectedTemplate || !uploadedFile) return;
    setIsUploadLoading(true);
    console.log("Selected template name", selectedTemplate.templateName);
    try {
      const result = await updateTemplateImageApi(
        selectedElectionId,
        selectedTemplate.templateName,
        uploadedFile
      );

      if (result) {
        message.success("Template updated successfully");
        fetchTemplates();
        setIsViewModalVisible(false);
        setUploadedFile(null);
      }
    } catch (err) {
      console.error("Error updating template image:", err);
      message.error("Failed to update template image");
    } finally {
      setIsUploadLoading(false);
    }
  };

  const handleRemoveImage = () => {
    // Reset the file states when the user removes the image
    setUploadedFile(null);
    setPreviewImageUrl(null);
  };

  const handleOpenCreateModal = () => {
    if (isFrozen) return;
    setTemplateName("");
    setVoterSlipHeader("");
    setCandidateInfoImageFooter("");
    setIsActive(true);
    setUploadedFile(null);
    setPreviewImageUrl(null);
    setIsCreateModalVisible(true);

    const allTemplateIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    const blockedIds = templates.map((template) => template.templateId);

    const availableId =
      allTemplateIds.find((id) => !blockedIds.includes(id)) || null;

    setTemplateOptionId(availableId);
    setIsCreateModalVisible(true);
  };

  const handleCreateTemplate = async () => {
    if (isFrozen) return;
    if (!templateName) {
      message.error("Template name is required");
      return;
    }

    if (!templateOptionId) {
      message.error("Please select a template");
      return;
    }

    if (!selectedElectionId) {
      message.error("No election selected");
      return;
    }

    setIsUploadLoading(true);
    try {
      const templateId = templateOptionId;

      const templateData = {
        templateId: templateId,
        templateName:templateName.trim(),
        candidateInfoImageFooter: candidateInfoImageFooter,
        voterSlipHeader: voterSlipHeader,
        isActive,
        imageStatus: isImageActive,
        imageUrl: previewImageUrl || "",
      };
      console.log("templateData", templateData);
      console.log("uploadedFile", uploadedFile);
      const createdTemplate = await createTemplateApi(
        selectedElectionId,
        templateData,
        uploadedFile || undefined
      );

      if (createdTemplate) {
        message.success("Template created successfully");
        setIsCreateModalVisible(false);
        setTemplateName("");
        setUploadedFile(null);
        setPreviewImageUrl(null);
        fetchTemplates();
      }
    } catch (err) {
      console.error("[VoterSlipPage] handleCreateTemplate error:", err);
      // Show error message to help debug the issue
      message.error(
        "Failed to create template. Please check console for details."
      );
    } finally {
      setIsUploadLoading(false);
    }
  };

  const handleDelete = async (templateNames?: string[]) => {
    if (isFrozen) return;
    try {
      console.log("templateNames", templateNames);
      const response = await deleteTemplateApi(
        parseInt(selectedElectionId),
        templateNames
      );
      if (response) {
        const successMessage = templateNames?.length
          ? `${templateNames.length} Templates deleted successfully`
          : "All Templates deleted successfully";

        message.success(successMessage);
        await fetchTemplates();
      }
    } catch (error) {
      const errorMessage = templateNames?.length
        ? "Failed to delete selected Templates"
        : "Failed to delete all Templates";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedTemplates([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all template data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all
            template data.
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
            I understand that by confirming, all template data will be
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
          await handleDelete([]);
        }
      },
    });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log("Query", lowerCaseQuery);

    const filteredData = templates.filter((tem) =>
      tem.templateName?.toString().toLowerCase().includes(lowerCaseQuery)
    );
    console.log("filteredData", filteredData);

    setFilteredTemplates(filteredData);
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
            title: "Delete Selected Templates",
            content: `Are you sure you want to delete ${selectedTemplates.length} template(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedTemplates.map((temp) => temp.templateName)
              );
            },
          });
        }}
        disabled={
          selectedTemplates.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("boothSlip"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedTemplates.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("boothSlip"))
        }
        danger
      >
        Delete All Templates
      </Menu.Item>
    </Menu>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: TemplateData[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedTemplates(selectedRows);
    },
  };

  if (!selectedElectionId) {
    return (
      <div className="text-center p-6">
        <p>Please select an election to view or create voter slip templates.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[20px] font-semibold">Voter Slip Templates</h2>
        {/* {templates.length === 4 ? (
          <Tooltip
            title="A maximum of 4 voter slips can be created"
            mouseEnterDelay={0.5}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={true}
              onClick={handleOpenCreateModal}
              className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
      hover:!bg-[#1D4ED8] hover:text-[#fff]"
            >
              Create Template
            </Button>
          </Tooltip>
        ) : ( */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={
            isFrozen ||
            (!isSuperAdminOrAdmin && !hasCreatePermission("boothSlip"))
          }
          onClick={handleOpenCreateModal}
          className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
    hover:!bg-[#1D4ED8] hover:text-[#fff]"
        >
          Create Voter Slip
        </Button>
        {/* )} */}
      </div>

      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Template: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Tempate"
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
              disabled={isFrozen}
            >
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>

      {templates.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p>You have not created any voter slip templates yet.</p>
          <p>Click on "Create Voter Slip" to add your first voter slip.</p>
        </div>
      ) : (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <StrictModeDroppable
            droppableId="droppable"
            direction="vertical"
            type="ROW"
          >
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <Table
                  className="my-4 default-list-table"
                  bordered
                  style={{ backgroundColor: "#1D4ED85C" }}
                  dataSource={filteredTemplates}
                  rowSelection={rowSelection}
                  columns={columns}
                  rowKey="templateName"
                  onChange={(p: any) => {
                    setPagination({
                      current: p.current,
                      pageSize: p.pageSize,
                    });
                  }}
                  pagination={
                    isDragging
                      ? false
                      : {
                          ...pagination,
                          position: ["bottomCenter"],
                          showSizeChanger: false,
                          showQuickJumper: true,
                          showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} items`,
                        }
                  }
                  // pagination={false}
                  loading={isLoading}
                  components={{
                    body: {
                      wrapper: (props: any) => <tbody {...props} />,
                      row: (props: any) => {
                        const key = props["data-row-key"];
                        const index = templates.findIndex(
                          (template) => template.templateName === key
                        );

                        if (isDragging && index === -1) {
                          return <tr {...props}>{props.children}</tr>;
                        }

                        return (
                          <Draggable
                            key={key}
                            draggableId={String(key)}
                            index={index}
                            isDragDisabled={isFrozen}
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
      )}

      {/* View/Edit Template Modal */}
      <Modal
        title="Voter Slip Details"
        open={isViewModalVisible}
        onCancel={() => closeUpdateModal()}
        onClose={() => closeUpdateModal()}
        footer={[
          <Button key="cancel" onClick={() => closeUpdateModal()}>
            Close
          </Button>,
          uploadedFile && (
            <Button
              loading={isUploadLoading}
              key="update"
              type="primary"
              onClick={handleUpdateImage}
              disabled={isFrozen}
              className="bg-[#1D4ED8] border-[#1D4ED8] hover:!bg-[#1D4ED8]"
            >
              Update Image
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedTemplate && (
          <Row gutter={24}>
            <Col span={12}>
              <div className="mb-4">
                <h3 className="font-semibold">Voter Slip Header</h3>
                <p>{selectedTemplate.voterSlipHeader || "N/A"}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Voter Slip Name</h3>
                <p>{selectedTemplate.templateName}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Print Status</h3>
                <Tag color={selectedTemplate.isActive ? "green" : "red"}>
                  {selectedTemplate.isActive ? "Active" : "Inactive"}
                </Tag>{" "}
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Candidate Info Status</h3>
                <Tag color={selectedTemplate.imageStatus ? "green" : "red"}>
                  {selectedTemplate.imageStatus ? "Active" : "Inactive"}
                </Tag>{" "}
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Candidate Info Image Footer</h3>
                <p>{selectedTemplate.candidateInfoImageFooter || "N/A"}</p>
              </div>
              <Form.Item
                colon={false}
                label={
                  <div style={{ textAlign: "left" }}>
                    <div className="font-semibold">
                      Upload Candidate Promo Image
                    </div>
                    <div className="mb-8">
                      (Dimension 2 inch width, Size less than 1MB)
                    </div>
                  </div>
                }
                wrapperCol={{ span: 24 }}
                style={{ display: "block", width: "100%" }}
              >
                <Upload
                  listType="picture-card"
                  fileList={
                    uploadedFile
                      ? [{ uid: "-1", name: uploadedFile.name, status: "done" }]
                      : []
                  }
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                  accept="image/jpeg,image/png,image/jpg"
                >
                  {!uploadedFile && "+ Select File"}
                </Upload>
              </Form.Item>
            </Col>
            <Col
              span={12}
              style={{ display: "flex", justifyContent: "flex-start" }}
            >
              <TemplateCard
                templateVariant={selectedTemplate.templateId}
                candidateImage={previewImageUrl}
              />
            </Col>
          </Row>
        )}
      </Modal>

      {/* Create Template Modal */}
      <Modal
        title="Create New Voter Slip"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsCreateModalVisible(false)}
            disabled={isUploadLoading}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleCreateTemplate}
            loading={isUploadLoading}
            disabled={isFrozen}
            className="bg-[#1D4ED8] border-[#1D4ED8] hover:!bg-[#1D4ED8]"
          >
            {isUploadLoading ? "Creating..." : "Create"}
          </Button>,
        ]}
        width={900}
        onOk={handleCreateTemplate}
      >
        <Spin spinning={isUploadLoading}>
          <Row gutter={24}>
            <Col span={14}>
              <Form layout="vertical">
                <Form.Item label="Voter Slip Header">
                  <Input
                    value={voterSlipHeader}
                    onChange={(e) => setVoterSlipHeader(e.target.value)}
                    placeholder="Enter voter slip header"
                  />
                </Form.Item>
                <Form.Item label="Voter Slip Name" required>
                  <Input
                    value={templateName}
                    // onChange={(e) => setTemplateName(e.target?.value?.trim())}
                    onChange={(e) => setTemplateName(e.target?.value)}
                    placeholder="Enter voter slip name"
                  />
                </Form.Item>

                <Row>
                  <Col span={12}>
                    <Form.Item label="Print Status">
                      <Switch
                        checked={isActive}
                        onChange={(checked) => setIsActive(checked)}
                        style={{
                          backgroundColor: isActive ? "green" : undefined,
                        }}
                      />
                      <span style={{ marginLeft: 8 }}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Canidate Info Status">
                      <Switch
                        checked={isImageActive}
                        onChange={(checked) => setIsImageActive(checked)}
                        style={{
                          backgroundColor: isImageActive ? "green" : undefined,
                        }}
                      />
                      <span style={{ marginLeft: 8 }}>
                        {isImageActive ? "Active" : "Inactive"}
                      </span>
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="Candidate Info Image Footer">
                      <Input
                        value={candidateInfoImageFooter}
                        onChange={(e) =>
                          setCandidateInfoImageFooter(e.target.value)
                        }
                        placeholder="Enter candidate info image footer"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Select Template" required>
                  <Select
                    value={templateOptionId}
                    style={{ width: 200 }}
                    onChange={(val) => setTemplateOptionId(val)}
                    placeholder="Select a template"
                    options={[
                      { value: 1, label: "English Template #1" },
                      { value: 2, label: "English Template #2" },
                      { value: 3, label: "English Template #3" },
                      { value: 4, label: "English Template #4" },
                      { value: 5, label: "Language-1 Template #1" },
                      { value: 6, label: "Language-1 Template #2" },
                      { value: 7, label: "Language-1 Template #3" },
                      { value: 8, label: "Language-1 Template #4" },
                      { value: 9, label: "Light Template #1" },
                      { value: 10, label: "Light Template #2" },
                      { value: 11, label: "Light Template #3" },
                      { value: 12, label: "Light Template #4" },
                      { value: 13, label: "Language-1 Light Template #1" },
                      { value: 14, label: "Language-1 Light Template #2" },
                      { value: 15, label: "Language-1 Light Template #3" },
                      { value: 16, label: "Language-1 Light Template #4" },
                    ].map((option) => ({
                      ...option,
                      // disabled: templates.some(
                      //   (template) => template.templateId === option.value
                      // ),
                    }))}
                  />
                </Form.Item>
              </Form>
            </Col>

            <Col span={10}>
              <Form layout="vertical">
                <Form.Item label="Upload Candidate Promo Image">
                  <Upload
                    listType="picture-card"
                    fileList={
                      uploadedFile
                        ? [
                            {
                              uid: "-1",
                              name: uploadedFile.name,
                              status: "done",
                            },
                          ]
                        : []
                    }
                    beforeUpload={() => false}
                    onChange={handleImageChange}
                    onRemove={handleRemoveImage}
                    accept="image/jpeg,image/png,image/jpg"
                  >
                    {!uploadedFile && "+ Select File"}
                  </Upload>
                  <p className="text-sm text-gray-500 mt-2">
                    Image must be 2 inches wide and under 1MB
                  </p>
                </Form.Item>
                {previewImageUrl && (
                  <Col
                    span={24}
                    style={{ display: "flex", justifyContent: "flex-start" }}
                  >
                    <TemplateCard
                      templateVariant={templateOptionId}
                      candidateImage={previewImageUrl}
                    />
                  </Col>
                )}
              </Form>
            </Col>
          </Row>
        </Spin>
      </Modal>
      <EditTemplateModal
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        template={selectedTemplate}
        previewImageUrl={previewImageUrl}
        uploadedFile={uploadedFile}
        handleImageChange={handleImageChange}
        electionId={selectedElectionId}
        onSuccess={fetchTemplates}
      />
    </div>
  );
};

export default BoothSlipPage;
