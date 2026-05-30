import {
  Button,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Table,
  Upload,
  Image,
  Checkbox,
  Menu,
  Row,
  Col,
} from "antd";
import { useState, useEffect } from "react";
import type { ColumnsType } from "antd/es/table";
import ImgCrop from "antd-img-crop";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  SearchOutlined,
  UploadOutlined,
  ImportOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  addAvailabilityApi,
  deleteAvailabilityApi,
  getAvailabilityApi,
  updateAvailabilityApi,
  updateAvailabilityOrder,
  getCpanelAvailabilityApi,
} from "../../api/availabilityApi";
import { useLoading } from "../../context/LoadingContext";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportAvailabilityModal from "./ImportAvailabilityModal";
import { RcFile } from "antd/es/upload";

interface Availability {
  key: string;
  description: string;
  categoryName: string;
  availabilityImage?: string | null;
  orderIndex: number | null;
}

const Availability = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [selectedAvailability, setSelectedAvailability] =
    useState<Availability | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<
    Availability[]
  >([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [filteredAvailabilities, setFilteredAvailabilities] = useState<
    Availability[]
  >([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cpanelAvailabilities, setCpanelAvailabilities] = useState<any[]>([]);
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { setLoading } = useLoading();

  // Fetch cpanel availabilities
  const fetchCpanelAvailabilities = async () => {
    setLoading(true);
    try {
      const response = await getCpanelAvailabilityApi();
      // Check if response.data exists and contains the data array
      if (response && response.data && Array.isArray(response.data)) {
        console.log("API response for cpanel availabilities:", response?.data);
        const availabilityData = response.data.map((avail: any) => ({
          key: avail.availabilityId.toString(),
          id: avail.availabilityId,
          description: avail.description,
          categoryName: avail.categoryName,
          availabilityImage: avail.imageUrl,
          orderIndex: avail.orderIndex,
        }));
        setCpanelAvailabilities(availabilityData);
        console.log("cpanelAvailabilities", availabilityData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        // If data is nested in response.data.data
        const availabilityData = response.data.data.map((avail: any) => ({
          key: avail.availabilityId.toString(),
          id: avail.availabilityId,
          description: avail.description,
          categoryName: avail.categoryName,
          availabilityImage: avail.imageUrl,
          orderIndex: avail.orderIndex,
        }));
        setCpanelAvailabilities(availabilityData);
        console.log("cpanelAvailabilities", availabilityData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelAvailabilities([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel availabilities:", error);
      setCpanelAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const response = await getAvailabilityApi(parseInt(selectedElectionId));
      console.log("API response for availabilities:", response);
      const mappedData = response.data
        ?.map(
          ({
            id,
            description,
            categoryName,
            availabilityImage,
            orderIndex,
          }: any) => ({
            key: id,
            description,
            categoryName,
            availabilityImage,
            orderIndex,
          })
        )
        .sort((a: any, b: any) => a.orderIndex - b.orderIndex);
      console.log("Mapped data", mappedData);
      setAvailabilities(mappedData);
      setFilteredAvailabilities(mappedData);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      setAvailabilities([]);
      setFilteredAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicateDescription = (
    description: string,
    currentKey?: string
  ): boolean => {
    return availabilities.some(
      (item) =>
        item.description.toLowerCase() === description.toLowerCase() &&
        item.key !== currentKey
    );
  };

  const handleSubmit = async (values: any) => {
    if (isFrozen) return;
    setIsSubmitting(true);
    console.log("Submit handler started with values:", values);

    const DTO = {
      description: values.description,
      categoryName: values.categoryName,
    };
    console.log("Prepared DTO:", DTO);

    try {
      if (isEdit && selectedAvailability) {
        console.log("Updating existing availability:", {
          selectedAvailability,
          electionId: selectedElectionId,
          newDescription: DTO.description,
          newCategoryName: DTO.categoryName,
        });
        let file: File | null = null;
        if (fileList && fileList.length > 0) {
          file = fileList[0]?.originFileObj;
        }
        console.log("AvailabilityId", selectedAvailability.key);
        const response = await updateAvailabilityApi(
          DTO,
          parseInt(selectedElectionId),
          parseInt(selectedAvailability.key),
          file
        );

        console.log("Update API response:", response);

        if (response?.status === "error") {
          console.log("Update failed with error:", response);
          message.error(response.message || "Failed to update Voter Category");
          return;
        }

        message.success("Voter Category updated successfully!");
      } else {
        // For new availability, we need file
        const file = fileList[0]?.originFileObj;
        if (!file) {
          message.error("Please upload an image");
          return;
        }
        console.log("Creating new availability:", {
          description: DTO.description,
          categoryName: DTO.categoryName,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });

        const response = await addAvailabilityApi(
          DTO,
          file,
          parseInt(selectedElectionId)
        );

        console.log("Create API response:", response);

        if (response?.status === "error") {
          console.log("Create failed with error:", response);
          message.error(response.message || "Failed to add Voter Category");
          return;
        }

        message.success("Voter Category added successfully!");
      }

      console.log("Operation completed successfully, cleaning up...");
      setIsModalVisible(false);
      setSearchQuery("");
      setFileList([]);
      fetchAvailabilities();
      form.resetFields();
    } catch (error: any) {
      console.error("Error in submit handler:", {
        error: error.message,
        details: error.response?.data,
        stack: error.stack,
      });
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save Voter Category. Please try again.";
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Availability[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedAvailabilities(selectedRows);
    },
  };

  // Handle deleting a availability
  const handleDelete = async (ids?: number[]) => {
    if (isFrozen) return;
    setIsLoading(true);
    try {
      console.log("availabilityIds", ids);
      await deleteAvailabilityApi(parseInt(selectedElectionId), ids);
      const successMessage = ids?.length
        ? `${ids.length} Categories deleted successfully`
        : "All Categories deleted successfully";

      message.success(successMessage);
      await fetchAvailabilities();
    } catch (error) {
      const errorMessage = ids?.length
        ? "Failed to delete selected Categories"
        : "Failed to delete all Categories";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedAvailabilities([]);
      setSelectedRowKeys([]);
      setIsLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all availability data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all
            availability data.
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
            I understand that by confirming, all availability data will be
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
    const filteredData = availabilities.filter((availability) =>
      availability.description.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredAvailabilities(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const validateImageBeforeCrop = (file: RcFile) => {
    const isSizeValid = file.size < 512 * 1024;

    if (file.type && !file.type.startsWith("image/")) {
      message.error(`${file.name} is not an image file`);
      return false;
    }

    if (!isSizeValid) {
      message.error("File size must be less than 512KB!");
      return false;
    }

    return true;
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    // Filter out any non-image files
    const filteredFileList = newFileList.filter((file: any) => {
      const isSizeValid = file.size < 512 * 1024;

      if (!isSizeValid) {
        // message.error("File size must be less than 512KB!");
        return false;
      }
      if (file.type && !file.type.startsWith("image/")) {
        // message.error(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    // Update form field
    form.setFieldsValue({ file: filteredFileList });
    setFileList(filteredFileList);
  };

  const openModal = (record: Availability | null = null) => {
    if (isFrozen) return;
    setIsEdit(!!record);
    setSelectedAvailability(record);
    setIsModalVisible(true);

    // If editing and there's an image URL, create a file list entry for it

    if (record?.availabilityImage) {
      const mockFile = [
        {
          uid: "-1",
          name: "Current Image",
          status: "done",
          url: record.availabilityImage,
        },
      ];
      setFileList(mockFile);

      form.setFieldsValue({
        ...record,
        file: mockFile,
      });
    } else {
      setFileList([]);
      form.setFieldsValue({
        ...record,
        file: [],
      });
    }

    form.setFieldsValue(record || { description: "" });
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedItems = [...filteredAvailabilities];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setFilteredAvailabilities(reorderedItems);
    const payload = reorderedItems.map((avl, index) => ({
      availabilityId: avl.key,
      newOrderIndex: index,
    }));
    try {
      await updateAvailabilityOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "Delete Selected Availabilities",
            content: `Are you sure you want to delete ${selectedAvailabilities.length} item(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedAvailabilities.map((availability) =>
                  parseInt(availability.key)
                )
              );
            },
          });
        }}
        disabled={
          selectedAvailabilities.length === 0 ||
          isLoading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("availability"))
        }
      >
        {isLoading
          ? "Deleting..."
          : `Delete Selected (${selectedAvailabilities.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("availability"))
        }
        danger
      >
        Delete All Availabilities
      </Menu.Item>
    </Menu>
  );

  useEffect(() => {
    if (selectedElectionId) {
      fetchAvailabilities();
      fetchCpanelAvailabilities(); // Fetch cpanel availabilities when component mounts
    }
  }, [selectedElectionId]);

  const columns: ColumnsType<Availability> = [
    {
      title: "Category Image",
      dataIndex: "availabilityImage",
      key: "availabilityImage",
      width: 100,
      render: (availabilityImage: string) =>
        availabilityImage ? (
          <Image
            src={availabilityImage}
            alt="Category"
            width={50}
            height={50}
            style={{ objectFit: "cover", borderRadius: "4px" }}
            fallback="/placeholder-image.png"
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              background: "#f0f0f0",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            No Image
          </div>
        ),
    },
    {
      title: "Category Name",
      dataIndex: "categoryName",
      key: "categoryName",
      sorter: (a, b) => a.categoryName?.localeCompare(b.categoryName),
    },
    {
      title: "Category Description",
      dataIndex: "description",
      key: "description",
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
                label: "Edit",
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasUpdatePermission("availability")),
                onClick: () => openModal(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasDeletePermission("availability")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this availability?"
                    onConfirm={() => handleDelete([parseInt(record.key)])}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{
                      style: {
                        backgroundColor: "#1D4ED8",
                        borderColor: "#1D4ED8",
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
          <span>
            <EllipsisOutlined style={{ cursor: "pointer" }} />
          </span>
        </Dropdown>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Voter Category</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("availability"))
            }
          >
            Import Categories
          </Button>
          <Button
            type="primary"
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("availability"))
            }
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                  hover:!bg-[#1D4ED8] hover:text-[#fff]
                  hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={() => openModal()}
          >
            Add
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
              placeholder="Search Voter Category"
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
                style={{ backgroundColor: "#1D4ED85C" }}
                dataSource={filteredAvailabilities}
                columns={columns}
                rowSelection={rowSelection}
                rowKey="key"
                components={{
                  body: {
                    wrapper: (props: any) => <tbody {...props} />,
                    row: (props: any) => {
                      const key = props["data-row-key"];
                      const index = filteredAvailabilities?.findIndex(
                        (availability) => availability.key === key
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
        title={isEdit ? "Edit Voter Category" : "Add Voter Category"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setFileList([]);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okButtonProps={{
          style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
          loading: isSubmitting,
        }}
        confirmLoading={isSubmitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Category Name"
            name="categoryName"
            rules={[
              { required: true, message: "Please enter the category name" },
            ]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item
            label="Category Description"
            name="description"
            rules={[
              { required: true, message: "Please enter the description" },
            ]}
          >
            <Input placeholder="Enter description" />
          </Form.Item>
          <Form.Item
            label={isEdit ? "Category Image" : "Category Image Upload"}
            name="file"
            validateTrigger={["onChange", "onBlur"]}
            rules={[
              { required: true, message: "Please upload an image" },
              // {
              //   validator: async (_, fileList) => {
              //     if (!isEdit && (!fileList || fileList.length === 0)) {
              //       throw new Error("Please upload an image");
              //     }
              //   },
              // },
            ]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <ImgCrop
              rotationSlider
              aspect={1 / 1}
              quality={0.8}
              modalWidth={512}
              fillColor="transparent"
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
              >
                <Button icon={<UploadOutlined />}>
                  {isEdit ? "Change Image" : "Select Image"}
                </Button>
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

      {/* Import Availability Modal */}
      <ImportAvailabilityModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchAvailabilities}
        selectedElectionId={selectedElectionId}
        cpanelAvailabilities={cpanelAvailabilities}
      />
    </div>
  );
};

export default Availability;
