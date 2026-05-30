import React, { useState, useEffect } from "react";
import { RootState } from "../../redux/store";
import {
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Image,
  Input,
  Menu,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  addBenefitSchemeApi,
  deleteBenefitSchemesApi,
  getBenefitSchemesApi,
  updateBenefitSchemeApi,
  updateOrder,
  getCpanelBenefitSchemesApi,
} from "../../api/benefitSchemeApi";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  SearchOutlined,
  UploadOutlined,
  ImportOutlined,
  DownOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useLoading } from "../../context/LoadingContext";
import { useSelector } from "react-redux";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImgCrop from "antd-img-crop";
import ImportBenefitSchemesModal from "./ImportBenefitSchemesModal";
import { RcFile } from "antd/es/upload";
import { getActiveBackendUrl } from "../../config";

export interface BenefitScheme {
  id?: number;
  key: string;
  schemeName: string;
  imageUrl: string;
  schemeBy: string;
  qrPopup?: boolean
}

const BenefitScheme = () => {
  const [schemes, setSchemes] = useState<BenefitScheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<BenefitScheme[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<BenefitScheme | null>(
    null
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSchemes, setSelectedSchemes] = useState<BenefitScheme[]>([]);
  const [loadingQRPopup, setLoadingQRPopup] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { setLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelBenefitSchemes, setCpanelBenefitSchemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");
  const [form] = Form.useForm();
  const { Option } = Select;

  // Helper function: ensures that schemeBy is always in the expected uppercase enum format.
  const formatSchemeByForForm = (value: string): string => {
    if (value.toLowerCase() === "local body") {
      return "LOCAL_BODY";
    }
    if (value.toLowerCase() === "party") {
      return "PARTY";
    }
    if (value.toLowerCase() === "self") {
      return "SELF";
    }
    if (
      value.toLowerCase() === "union govt." ||
      value.toLowerCase() === "union govt"
    ) {
      return "UNION_GOVT";
    }
    if (
      value.toLowerCase() === "state govt." ||
      value.toLowerCase() === "state govt"
    ) {
      return "STATE_GOVT";
    }
    // Fallback: convert whatever is provided to uppercase
    return value.toUpperCase();
  };

  // Fetch cpanel benefit schemes
  const fetchCpanelBenefitSchemes = async () => {
    setLoading(true);
    try {
      const response = await getCpanelBenefitSchemesApi();
      // Check if response.data exists and contains the data array
      if (response && response.data && Array.isArray(response.data)) {
        const schemeData = response.data.map((scheme: any) => ({
          key: scheme.id.toString(),
          id: scheme.id,
          schemeName: scheme.schemeName,
          imageUrl: scheme.imageUrl,
          schemeBy: scheme.schemeBy,
          schemeValue: scheme.schemeValue,
          orderIndex: scheme.orderIndex,
        }));
        setCpanelBenefitSchemes(schemeData);
        console.log("cpanelBenefitSchemes", schemeData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        // If data is nested in response.data.data
        const schemeData = response.data.data.map((scheme: any) => ({
          key: scheme.id.toString(),
          id: scheme.id,
          schemeName: scheme.schemeName,
          imageUrl: scheme.imageUrl,
          schemeBy: scheme.schemeBy,
          schemeValue: scheme.schemeValue,

          orderIndex: scheme.orderIndex,
        }));
        setCpanelBenefitSchemes(schemeData);
        console.log("cpanelBenefitSchemes", schemeData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelBenefitSchemes([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel benefit schemes:", error);
      setCpanelBenefitSchemes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemeData = async () => {
    setLoading(true);
    try {
      const response = await getBenefitSchemesApi(parseInt(selectedElectionId));
      const schemeData = response.data
        ?.map((scheme: BenefitScheme) => ({
          ...scheme,
          qrPopup: scheme.qrPopup || false,
          key: scheme.id,
        }))
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex) ||[];
      setSchemes(schemeData);
      setFilteredSchemes(schemeData);
    } catch (error) {
      console.log("Error fetching benefit schemes", error);
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedSchemes = [...filteredSchemes];
    const [movedItem] = reorderedSchemes.splice(result.source.index, 1);
    reorderedSchemes.splice(result.destination.index, 0, movedItem);
    setSchemes(reorderedSchemes);
    setFilteredSchemes(reorderedSchemes);
    const payload = reorderedSchemes.map((scheme, index) => ({
      schemeId: scheme.id,
      newOrderIndex: index, // new position after dragging
    }));
    try {
      await updateOrder(parseInt(selectedElectionId), payload);
      console.log("Order updated successfully");
    } catch (error) {
      console.error("Failed to update order", error);
      // await fetchSchemeData();
    }
  };

  const S3_BASE = "https://thedalnew.s3.ap-south-1.amazonaws.com";

  // Utility function to convert image URL to File object via backend S3 proxy
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const fetchUrl = url.startsWith(S3_BASE)
      ? `${getActiveBackendUrl()}/api/s3-proxy?url=${encodeURIComponent(url)}`
      : url;
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  };

  const handleToggleQRPopup = async (scheme: BenefitScheme, checked: boolean) => {
  if (isFrozen) return;
  
  setLoadingQRPopup(true);
  try {
    const payload = {
      schemeName: scheme.schemeName,
      schemeValue: scheme.schemeValue,
      schemeBy: formatSchemeByForForm(scheme.schemeBy),
      qrPopup: checked,
    };

    await updateBenefitSchemeApi(
      payload,
      parseInt(selectedElectionId),
      scheme.id!,
      undefined
    );

    // Update local state
    setSchemes(prev => prev.map(s => 
      s.id === scheme.id ? { ...s, qrPopup: checked } : s
    ));
    setFilteredSchemes(prev => prev.map(s => 
      s.id === scheme.id ? { ...s, qrPopup: checked } : s
    ));

    message.success(`QR Popup ${checked ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    console.error("Error toggling QR Popup:", error);
    message.error("Failed to update QR Popup status");
  } finally {
    setLoadingQRPopup(false);
  }
};

  const handleEditScheme = async (record: BenefitScheme) => {
    if (isFrozen) return;
    console.log("Record before editing scheme", record);
    setSelectedScheme(record);
    form.setFieldsValue({
      schemeName: record.schemeName,
      schemeValue: record.schemeValue,
      schemeBy: formatSchemeByForForm(record.schemeBy),
       qrPopup: record.qrPopup || false,
    });

    // Create a mock file entry for the existing image
    if (record.imageUrl) {
      try {
        // Try to convert URL to File object using CORS proxy
        const file = await urlToFile(record.imageUrl, "existing-image.jpg");

        const mockFile = {
          uid: "-1",
          name: "existing-image.jpg",
          status: "done",
          url: record.imageUrl,
          originFileObj: file, // Attach the File object
        };
        console.log("Mock file with downloaded image", mockFile);
        setFileList([mockFile]);
        setPreviewImage(record.imageUrl);
      } catch (error) {
        console.error("Error loading existing image:", error);
        // Fallback: Don't download the image, just show the preview
        // This allows updating scheme name/value without re-uploading the image
        const mockFile = {
          uid: "-1",
          name: "existing-image.jpg",
          status: "done",
          url: record.imageUrl,
          // Don't set originFileObj so the update API won't try to re-upload
        };
        setFileList([mockFile]);
        setPreviewImage(record.imageUrl);
        console.log("Using fallback mock file without download");
      }
    } else {
      setFileList([]);
      setPreviewImage("");
    }

    setIsModalOpen(true);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: BenefitScheme[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedSchemes(selectedRows);
    },
  };

  const handleDelete = async (schemeIds?: number[]) => {
    if (isFrozen) return;
    try {
      console.log("schemeIds", schemeIds);
      await deleteBenefitSchemesApi(parseInt(selectedElectionId), schemeIds);
      const successMessage = schemeIds?.length
        ? `${schemeIds.length} Scheme deleted successfully`
        : "All Schemes deleted successfully";

      message.success(successMessage);
      setSearchQuery("");
      await fetchSchemeData();
    } catch (error) {
      const errorMessage = schemeIds?.length
        ? "Failed to delete selected Schemes"
        : "Failed to delete all Schemes";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedSchemes([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all scheme data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all scheme
            data.
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
            I understand that by confirming, all scheme data will be permanently
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

  const handleAddOrEditScheme = async (values: any) => {
    if (isFrozen) return;
    // Map the schemeBy value to the expected enum format
    console.log("values", values);
    const payload = {
      schemeName: values.schemeName,
      schemeValue: values.schemeValue,
      schemeBy: formatSchemeByForForm(values.schemeBy),
       qrPopup: values.qrPopup || false,
    };

    setIsSubmitting(true);
    try {
      console.log(fileList[0]?.originFileObj);
      if (selectedScheme) {
        const file = fileList[0]?.originFileObj;
        // if (file) {
        await updateBenefitSchemeApi(
          payload,
          parseInt(selectedElectionId),
          parseInt(selectedScheme.key),
          file
        );
        // }
        // else {
        //   await updateBenefitSchemeApi(
        //     payload,
        //     parseInt(selectedElectionId),
        //     parseInt(selectedScheme.key)
        //   );
        // }
        message.success("Benefit scheme updated successfully");
      } else {
        const file = fileList[0]?.originFileObj;
        if (!file) {
          message.error("Please upload an image");
          return;
        }
        await addBenefitSchemeApi(payload, file, parseInt(selectedElectionId));
        message.success("Benefit scheme created successfully");
      }
      fetchSchemeData();
      setSearchQuery("");
      setIsModalOpen(false);
      form.resetFields();
      setSelectedScheme(null);
      setFileList([]);
      setPreviewImage("");
    } catch (error) {
      console.error("Error creating/updating benefit scheme", error);
      message.error("Failed to save benefit scheme");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filteredData = schemes.filter((scheme) =>
      scheme.schemeName.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredSchemes(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const validateImageBeforeCrop = (file: RcFile) => {
    const isSizeValid = file.size < 512 * 1024;

    if (!isSizeValid) {
      message.error("File size must be less than 512KB!");
      return false;
    }

    return true;
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    const filteredFileList = newFileList.filter((file: any) => {
      const isSizeValid = file.size < 512 * 1024;

      if (!isSizeValid) {
        // message.error("File size must be less than 512KB!");
        return false;
      }
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
      }
      return true;
    });
    setFileList(filteredFileList);
    form.setFieldsValue({ file: filteredFileList });

    // Clear preview image when a new file is uploaded
    setPreviewImage("");
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "Delete Selected Benefit Schemes",
            content: `Are you sure you want to delete ${selectedSchemes.length} scheme(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(selectedSchemes.map((scheme) => scheme.id));
            },
          });
        }}
        disabled={
          selectedSchemes.length === 0 ||
          isLoading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("benefitScheme"))
        }
      >
        {isLoading
          ? "Deleting..."
          : `Delete Selected (${selectedSchemes.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("benefitScheme"))
        }
        danger
      >
        Delete All Schemes
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<BenefitScheme> = [
    {
      title: "Scheme Name",
      dataIndex: "schemeName",
      key: "schemeName",
      sorter: (a, b) => a.schemeName.localeCompare(b.schemeName),
    },
    {
      title: "Scheme By",
      dataIndex: "schemeBy",
      key: "schemeBy",
    },
    {
      title: "Image",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (text: string) =>
        text ? (
          <Image
            src={text}
            alt="scheme"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: "4px" }}
            fallback="/placeholder-image.png"
          />
        ) : (
          "No image"
        ),
    },
    {
      title: "Scheme Value",
      dataIndex: "schemeValue",
      key: "schemeValue",
      render: (value) =>
        value ? `₹ ${Number(value).toLocaleString("en-IN")}` : "",
    },
    {
      title: "QR Code Display",
      dataIndex: "qrPopup",
      key: "qrPopup",
      width: 100,
      render: (_: any, record: any) => (
        <Space
          direction="vertical"
          size="small"
          style={{ alignItems: "center" }}
        >
        <Switch
  checked={record.qrPopup || false}
  onChange={(checked) => handleToggleQRPopup(record, checked)}
  loading={loadingQRPopup}
  disabled={isFrozen}
  style={{
    backgroundColor: record.qrPopup ? "#52c41a" : "#d9d9d9",
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
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin &&
                    !hasUpdatePermission("benefitScheme")),
                label: "Edit",
                onClick: () => handleEditScheme(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin &&
                    !hasDeletePermission("benefitScheme")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this scheme?"
                    onConfirm={() => handleDelete([parseInt(record.key)])}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{
                      style: {
                        backgroundColor: "#1D4ED8",
                        borderColor: "white",
                      },
                    }}
                  >
                    <span>Delete</span>
                  </Popconfirm>
                ),
                danger: true,
              },
            ],
          }}
          trigger={["click"]}
        >
          <EllipsisOutlined style={{ cursor: "pointer" }} />
        </Dropdown>
      ),
    },
  ];

  useEffect(() => {
    if (selectedElectionId) {
      fetchSchemeData();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    fetchCpanelBenefitSchemes(); // runs only once when the component mounts
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Schemes</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("benefitScheme"))
            }
          >
            Import Schemes
          </Button>
          <Button
            type="primary"
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("benefitScheme"))
            }
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={() => {
              if (isFrozen) return;
              setIsModalOpen(true);
              form.resetFields();
              setSelectedScheme(null);
              setFileList([]);
              setPreviewImage("");
              setIsSubmitting(false); // Reset loading state when opening modal
            }}
          >
            Add Scheme
          </Button>
        </div>
      </div>
      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Scheme: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Scheme"
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
          </div>{" "}
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
                style={{ backgroundColor: "#1D4ED85C" }}
                dataSource={filteredSchemes}
                columns={columns}
                rowSelection={rowSelection}
                pagination={
                  isDragging
                    ? false
                    : {
                        position: ["bottomCenter"],
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                          `${range[0]}-${range[1]} of ${total} items`,
                      }
                }
                rowKey="key"
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredSchemes.findIndex(
                        (scheme) => scheme.key === key
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

      <Modal
        title={selectedScheme ? "Edit Scheme" : "Add Scheme"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSelectedScheme(null);
          setFileList([]);
          setPreviewImage("");
          setIsSubmitting(false); // Reset loading state when closing modal
        }}
        onOk={() => {
          form
            .validateFields()
            .then((values) => {
              handleAddOrEditScheme(values);
            })
            .catch((errorInfo) => {
              console.error("Validation Failed:", errorInfo);
            });
        }}
        okButtonProps={{
          style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
          disabled: isFrozen,
          loading: isSubmitting,
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Scheme Name"
            name="schemeName"
            rules={[
              { required: true, message: "Please enter the scheme name" },
            ]}
          >
            <Input placeholder="Enter scheme name" />
          </Form.Item>
          <Form.Item
            label="Scheme Value"
            getValueProps={(value) => ({
              value:
                typeof value === "number"
                  ? `${value.toLocaleString("en-IN")}`
                  : value,
            })}
            normalize={(value) => {
              // Strip out ₹ and commas, then convert to number
              const cleaned = value.replace(/[₹,\s]/g, "");
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) || parsed < 0 ? undefined : parsed;
            }}
            name="schemeValue"
          >
            <Input
              addonBefore="₹"
              placeholder="Enter scheme value"
              inputMode="decimal"
              onBeforeInput={(e) => {
                const allowed = /^[0-9]$/;
                if (!allowed.test(e.data)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("Text");
                if (pasted.includes("-") || /[^\d.,₹]/.test(pasted)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="Scheme By"
            name="schemeBy"
            rules={[
              {
                required: true,
                message: "Please specify who offers this scheme",
              },
            ]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Scheme By"
            >
              <Option value="UNION_GOVT">Union Govt.</Option>
              <Option value="STATE_GOVT">State Govt.</Option>
              <Option value="LOCAL_BODY">Local Body</Option>
              <Option value="PARTY">Party</Option>
              <Option value="SELF">Self</Option>
            </Select>
          </Form.Item>
           <Form.Item
      label="QR Popup"
      name="qrPopup"
      valuePropName="checked"
    >
      <Switch
        checkedChildren="Enabled"
        unCheckedChildren="Disabled"
      />
    </Form.Item>
          <Form.Item
            label="Image Upload"
            name="file"
            rules={[
              {
                required: !selectedScheme, // Only required when not editing
                message: "Please upload an image",
              },
            ]}
          >
            <ImgCrop
              rotationSlider
              aspect={1 / 1}
              quality={0.8}
              fillColor="transparent"
              modalWidth={512}
              // modalHeight={512}
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
                maxCount={1}
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept="image/*"
                listType="picture"
                className="image-upload-wrap"
              >
                {fileList.length === 0 &&
                  (previewImage ? (
                    <img
                      src={previewImage}
                      alt="Current scheme"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "200px",
                        objectFit: "contain",
                        marginBottom: "8px",
                      }}
                    />
                  ) : (
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
                  ))}
              </Upload>
            </ImgCrop>
          </Form.Item>
          {fileList?.length === 0 ? (
            <p className="text-xs font-medium text-gray-400 -mt-3">
              Image size should not exceed 512 KB
            </p>
          ) : (
            <p></p>
          )}{" "}
        </Form>
      </Modal>

      {/* Import Benefit Schemes Modal */}
      <ImportBenefitSchemesModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchSchemeData}
        selectedElectionId={selectedElectionId}
        cpanelBenefitSchemes={cpanelBenefitSchemes}
      />
    </div>
  );
};

export default BenefitScheme;
