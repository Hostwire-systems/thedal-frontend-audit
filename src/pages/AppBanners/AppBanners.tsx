import React, { useEffect, useRef, useState } from "react";
import {
  Table,
  Image,
  message,
  Button,
  Modal,
  Upload,
  Popconfirm,
  Spin,
  Typography,
  Form,
  Switch,
  Input,
  Menu,
  Row,
  Col,
  Dropdown,
  Checkbox,
} from "antd";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  WhatsAppOutlined,
  SearchOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useSelector } from "react-redux";
import {
  addElectionBanner,
  getElectionBanners,
  deleteElectionBanner,
  reorderElectionBanner,
  updateWhatsappStatus,
  updateWhatsappFooter,
  getWhatsappFooter,
  updateImageStatus,
} from "../../api/electionApi";
import ImgCrop from "antd-img-crop";
import { useLoading } from "../../context/LoadingContext";
import "./AppBanners.css";
import { useForm } from "antd/es/form/Form";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const { Title } = Typography;

interface Banner {
  id: number;
  handlerType: string;
  handlerFileId: number;
  fileName: string;
  url: string;
  whatsappForward: boolean;
  isActive:boolean;
  bulkUpload: string | null;
}

const AppBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBanners, setSelectedBanners] = useState<Banner[]>([]);
  const [previewImage, setPreviewImage] = useState("");
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [footerWhatsappText, setFooterWhatsappText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const { isLoading: isLoadingBanner, setLoading: setIsLoadingBanner } =
    useLoading();

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

  const [form] = Form.useForm();
  const fetchBanners = async () => {
    try {
      setIsLoadingBanner(true);
      const response = await getElectionBanners(parseInt(selectedElectionId));
      if (response.status === "success" && Array.isArray(response.data)) {
        console.log("Banners", response.data);
        const bannersData = response.data
          ?.map((banner: Banner) => ({
            ...banner,
            key: banner.id,
          }))
          .sort((a: any, b: any) => a.orderIndex - b.orderIndex);

        setBanners(bannersData);
        setFilteredBanners(bannersData);
      } else {
        message.error(response.message || "Failed to fetch banners!");
      }
    } catch (error) {
      setBanners([]);
      setFilteredBanners([]);
      console.error("Error fetching banners:", error);
    } finally {
      setIsLoadingBanner(false);
    }
  };

  const fetchWhatsappFooter = async () => {
    try {
      const response = await getWhatsappFooter(parseInt(selectedElectionId));
      console.log("Fetched whatsapp footer", response.data);
      setFooterWhatsappText(response.data);
    } catch (error) {
      console.log("Error fetching whatsapp footer message", error);
    }
  };

  const resetUploadModal = () => {
    setFileList([]);
    form.resetFields();
  };

  const handleDelete = async (fileIds?: string[] | number[]) => {
    if (isFrozen) return;
    try {
      console.log("fileIds", fileIds);
      await deleteElectionBanner(parseInt(selectedElectionId), fileIds);
      const successMessage = fileIds?.length
        ? `${fileIds.length} Banners deleted successfully`
        : "All Banners deleted successfully";

      message.success(successMessage);
      await fetchBanners();
    } catch (error) {
      const errorMessage = fileIds?.length
        ? "Failed to delete selected Banners"
        : "Failed to delete all Banners";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedBanners([]);
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
            This action cannot be undone and will permanently delete all app
            banners.
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
            I understand that by confirming, all app banners will be permanently
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

  const handlePreview = async (file) => {
    if (!file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.readAsDataURL(file.originFileObj);
      });
    }
    Modal.info({
      title: "Preview",
      content: (
        <img
          alt="file preview"
          style={{
            width: "100%",
            background:
              "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px",
          }}
          src={file.preview}
        />
      ),
      onOk() {},
    });
  };

  const handleUpload = async () => {
    if (isFrozen) return;
    setLoading(true);
    try {
      const values = await form.validateFields();
      if (fileList.length === 0) {
        message.error("Please select an image!");
        return;
      }

      const originalFile = fileList[0].originFileObj;
      let fileToUpload = originalFile;

      if (values.fileName) {
        const extension = originalFile.name.split(".").pop(); // e.g., jpg, png
        const newFileName = `${values.fileName}.${extension}`;
        fileToUpload = new File([originalFile], newFileName, {
          type: originalFile.type,
        });
      }

      const formData = new FormData();
      formData.append("banner-image", fileToUpload);

      const response = await addElectionBanner(
        parseInt(selectedElectionId),
        formData
      );
      if (response.status === "success") {
        message.success("Banner uploaded successfully!");
        fetchBanners();
        resetUploadModal();
        setUploadModalVisible(false);
      } else {
        message.error(response.message || "Failed to upload banner!");
      }
    } catch (error) {
      console.error("Error uploading banner:", error);
      message.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (info) => {
    let newFileList = [...info.fileList];
    newFileList = newFileList.filter((file: any) => {
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
    console.log("newFileList", newFileList);
    if (newFileList.length > 1) {
      newFileList = [newFileList[newFileList.length - 1]];
    }

    setFileList(newFileList);
    form.setFieldsValue({ bannerImage: newFileList });
  };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedItems = [...banners];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setBanners(reorderedItems);
    setFilteredBanners(reorderedItems);
    const payload = reorderedItems.map((item, index) => ({
      fileId: item.id,
      newOrderIndex: index,
    }));
    try {
      await reorderElectionBanner(parseInt(selectedElectionId), payload);
      message.success("Order updated successfully!");
    } catch (error) {
      console.error("Error updating order", error);
    }
  };

  const handleUpdateWhatsappModal = async () => {
    if (isFrozen) return;
    try {
      console.log("Updated Footer:", footerWhatsappText);
      const response = await updateWhatsappFooter(
        selectedElectionId,
        footerWhatsappText
      );
      console.log("Whatsapp footer updated", response);
      message.success("Whatsapp footer updated successfully");
      handleCloseWhatsappModal();
    } catch (error) {
      console.log("Error updating whatsapp footer", error);
    }
  };

  const toggleWhatsappStatus = async (fileId: number, status: boolean) => {
    if (isFrozen) return;
    try {
      await updateWhatsappStatus(selectedElectionId, fileId, status);
      message.success("Whatsapp forward status updated");
      fetchBanners();
    } catch (error: any) {
      console.error("Error updating whatsapp forward status:", error);
    }
  };

  const handleToggleStatus = async (fileId: number, status: boolean) => {
    if (isFrozen) return;
    try {
      const payload = {
        fileId,
        isActive: status,
      };
      await updateImageStatus(selectedElectionId, payload);
      message.success("App Banner status updated");
      fetchBanners();
    } catch (error: any) {
      console.error("Error updating App Banner status:", error);
    }
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log("Query", lowerCaseQuery);

    const filteredData = banners.filter((b) =>
      b.fileName?.toString().toLowerCase().includes(lowerCaseQuery)
    );
    console.log("filteredData", filteredData);

    setFilteredBanners(filteredData);
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
        onClick={async () => {
          await handleDelete(selectedBanners.map((ban) => ban.id));
        }}
        disabled={
          selectedBanners.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("appsBanner"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedBanners.length})`}
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("appsBanner"))
        }
        danger
      >
        Delete All Banners
      </Menu.Item>
    </Menu>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Banner[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedBanners(selectedRows);
    },
  };

  const handleOpenWhatsappModal = () => {
    if (isFrozen) return;
    setIsWhatsappModalOpen(true);
  };
  const handleCloseWhatsappModal = () => setIsWhatsappModalOpen(false);

  useEffect(() => {
    if (selectedElectionId) {
      fetchBanners();
      fetchWhatsappFooter();
    }
  }, [selectedElectionId]);

  const columns = [
    {
      title: "Preview",
      dataIndex: "url",
      key: "url",
      render: (url: string) => (
        <Image
          src={url}
          alt="Banner"
          width={160}
          height={90}
          style={{ objectFit: "contain" }}
          fallback="https://via.placeholder.com/100x50?text=No+Image"
          preview={false}
        />
      ),
    },
    {
      title: "File Name",
      dataIndex: "fileName",
      key: "fileName",
      render: (value: string) => value?.split(".").slice(0, -1).join("."),
    },
    {
      title: "Whatsapp Forward",
      dataIndex: "whatsappForward",
      key: "whatsappForward",
      render: (value: boolean, record: Banner) => (
        <Switch
          checked={value}
              disabled={isFrozen}
          onChange={(checked) => toggleWhatsappStatus(record.id, checked)}
          style={{
            backgroundColor: value ? "green" : undefined,
          }}
        />
      ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (value: boolean, record: Banner) => (
        <Switch
          checked={value}
              disabled={isFrozen}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          style={{
            backgroundColor: value ? "green" : undefined,
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Banner) => (
        <div className="flex gap-2">
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => {
              setPreviewImage(record.url);
              setPreviewVisible(true);
            }}
            style={{ padding: 0 }}
          >
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this banner?"
            onConfirm={() => handleDelete([record.id])}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              style: {
                backgroundColor: "#1D4ED8",
                borderColor: "#1D4ED8",
                color: "#fff",
              },
            }}
          >
            <Button
              icon={<DeleteOutlined />}
              type="link"
              danger
              disabled={
                isFrozen ||
                (!isSuperAdminOrAdmin && !hasDeletePermission("appsBanner"))
              }
              style={{ padding: 0 }}
            >
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">App Banners</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<WhatsAppOutlined />}
            onClick={handleOpenWhatsappModal}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasUpdatePermission("appsBanner"))
            }
            className="h-[46px] rounded text-[15px] font-semibold"
          >
            Whatsapp Footer
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (isFrozen) return;
              setUploadModalVisible(true);
            }}
            disabled={isFrozen}
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
            hover:!bg-[#1D4ED8] hover:text-[#fff]"
          >
            Upload Banner
          </Button>
        </div>{" "}
      </div>

      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Banner: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Banner"
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

      {banners.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <p>You have not uploaded any banners yet.</p>
          <p>Click on "Upload Banner" to add your first banner.</p>
        </div>
      ) : (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <StrictModeDroppable
            droppableId="banner"
            direction="vertical"
            type="ROW"
          >
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <Table
                  className="my-4 default-list-table"
                  dataSource={filteredBanners}
                  columns={columns}
                  rowSelection={rowSelection}
                  style={{ backgroundColor: "#1D4ED85C" }}
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
                  rowKey={(record) => record.id.toString()}
                  components={{
                    body: {
                      wrapper: (props: any) => <tbody {...props} />,
                      row: (props: any) => {
                        const key = props["data-row-key"];
                        const index = banners.findIndex(
                          (banner) => banner.id.toString() === key
                        );

                        if (isDragging && index === -1) {
                          return <tr {...props}>{props.children}</tr>;
                        }

                        return (
                          <Draggable
                            draggableId={String(key)}
                            index={index}
                            key={key}
                            isDragDisabled={isFrozen}
                          >
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                {...props}
                                style={{
                                  ...props.style,
                                  ...provided.draggableProps.style,
                                  cursor: "move",
                                  display: "table-row",
                                  position: snapshot.isDragging
                                    ? "relative"
                                    : "static",
                                  top: snapshot.isDragging ? "" : undefined,
                                  left: snapshot.isDragging ? "" : undefined,
                                  width: "100%",
                                  background: snapshot.isDragging
                                    ? "#e0f7fa" // Change background color while dragging
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

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onClose={() => {
          resetUploadModal();
          setPreviewVisible(false);
        }}
        onCancel={() => {
          resetUploadModal();
          setPreviewVisible(false);
        }}
        width="auto"
        centered
      >
        <img
          alt="Preview"
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            background:
              "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px",
          }}
          src={previewImage}
        />
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload Banner"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setUploadModalVisible(false)}
            disabled={loading}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpload}
            loading={loading}
            disabled={isFrozen}
            className="bg-[#1D4ED8] border-[#1D4ED8] hover:!bg-[#1D4ED8]"
          >
            {loading ? "Uploading..." : "Upload"}
          </Button>,
        ]}
      >
        <Spin spinning={loading}>
          <Form
            form={form} // Linking the form instance
            layout="vertical"
            onFinish={handleUpload} // Form submission handler
          >
            <Form.Item
              label="Banner Image"
              name="bannerImage"
              // valuePropName="fileList"
              // getValueFromEvent={(e: any) => e && e.fileList} // Get fileList from event
              required
              rules={[
                { required: true, message: "Please upload a banner image!" },
              ]}
            >
              {" "}
              <ImgCrop
                rotate
                aspect={16 / 9}
                quality={0.8}
                modalWidth={500}
                showReset
                fillColor="transparent"
                okText="Confirm"
                cancelText="Cancel"
                modalTitle={
                  <div className="flex justify-between items-center">
                    <span>Crop Banner Image</span>
                    <span
                      style={{
                        color: "#999",
                        fontSize: "12px",
                        marginRight: "2rem",
                      }}
                    >
                      Size: 1920x1080 pixels
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
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  style={{
                    background:
                      "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px",
                  }}
                  customRequest={dummyRequest}
                  onChange={handleFileChange}
                  // beforeUpload={() => false}
                >
                  {fileList.length < 1 && "+ Select File"}
                </Upload>
              </ImgCrop>
            </Form.Item>
            <p className="text-sm text-gray-500 mb-2 -mt-2">
              Ensure the file size is under 1MB and the aspect ratio is 16:9.{" "}
            </p>
            <Form.Item label="File Name" name="fileName">
              <Input placeholder="Enter file name without extension" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      {/* // React quill modal */}
      <Modal
        title="Edit Whatsapp Footer"
        open={isWhatsappModalOpen}
        onCancel={handleCloseWhatsappModal}
        onOk={handleUpdateWhatsappModal}
        okButtonProps={{ disabled: isFrozen }}
        okText="Update"
        cancelText="Cancel"
        width={700}
        styles={{ body: { height: 240 } }} // You can increase this height
      >
        {" "}
        <div>
          <ReactQuill
            theme="snow"
            value={footerWhatsappText}
            onChange={setFooterWhatsappText}
            placeholder="Write your Whatsapp footer here..."
            style={{ height: "200px" }}
            modules={{
              toolbar: [
                [{ header: [1, 2, false] }],
                ["bold", "italic", "underline", "strike", "blockquote"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"],
              ],
              clipboard: {
                matchVisual: false,
              },
            }}
            formats={[
              "header",
              "bold",
              "italic",
              "underline",
              "strike",
              "blockquote",
              "list",
              "bullet",
              "link",
              "image",
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AppBanners;
