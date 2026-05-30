import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  SearchOutlined,
  UserOutlined,
  ImportOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Button,
  Modal,
  Form,
  Input,
  Table,
  Popconfirm,
  message,
  Upload,
  Dropdown,
  Menu,
  Col,
  Row,
  Checkbox,
  ColorPicker,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { RcFile } from "antd/es/upload";
import ImgCrop from "antd-img-crop";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import {
  fetchReligion,
  addReligion,
  deleteReligion,
  editReligion,
  updateReligionOrder,
  getCpanelReligionsApi,
} from "../../api/religionApi";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportReligionsModal from "./ImportReligionsModal";

interface Religion {
  key: string;
  id: number;
  religionName: string;
  religionColor: string;
  religionImage: string | null | File;
}

const Religion: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [religionImage, setReligionImage] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<File | string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedReligions, setSelectedReligions] = useState<Religion[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [fileList, setFileList] = useState([]);
  const [filteredReligions, setFilteredReligions] = useState<Religion[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { loading: loadingPage, setLoading: setLoadingPage } = useLoading();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelReligions, setCpanelReligions] = useState<any[]>([]);

  const [form] = Form.useForm();
  const inputRef = useRef(null);
  // Show the modal
  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields(); // Clear form values when opening the modal
    setReligionImage(null);
    setEditingImage(null);
    setFileList([]);
  };

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const userRole = localStorage.getItem("role");
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  // Fetch religions from cpanel
  const fetchCpanelReligions = async () => {
    setLoadingPage(true);
    try {
      const response = await getCpanelReligionsApi();
      // Check if response.data exists and contains the data array
      if (response && response.data && Array.isArray(response.data)) {
        const religionData = response.data.map((religion: any) => ({
          key: religion.religionId.toString(),
          id: religion.religionId,
          religionName: religion.religionName,
          religionColor: religion.religionColor,
          religionImage: religion.religionImage,
          orderIndex: religion.orderIndex,
        }));
        setCpanelReligions(religionData);
        console.log("cpanelReligions", religionData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        // If data is nested in response.data.data
        const religionData = response.data.data.map((religion: any) => ({
          key: religion.religionId.toString(),
          id: religion.religionId,
          religionName: religion.religionName,
          religionColor: religion.religionColor,
          religionImage: religion.religionImage,
          orderIndex: religion.orderIndex,
        }));
        setCpanelReligions(religionData);
        console.log("cpanelReligions", religionData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelReligions([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel religions:", error);
      setCpanelReligions([]);
    } finally {
      setLoadingPage(false);
    }
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

  const handleImageUpload = (file: RcFile) => {
    const isValidType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg";

    const isSizeValid = file.size / 1024 / 1024 < 1;

    if (!isValidType) {
      return Upload.LIST_IGNORE;
    }

    if (!isSizeValid) {
      return Upload.LIST_IGNORE;
    }
    setReligionImage(file);
    form.setFieldValue("religionImage", file);
    return false; // Prevent auto upload
  };

  // Handle adding a religion
  const handleAdd = async () => {
    setLoading(true); // Start loading
    try {
      console.log("religionName", form.getFieldValue("religionName"));
      const religionName = form.getFieldValue("religionName");
      const religionColor = form.getFieldValue("religionColor");
      if (!religionName.trim()) {
        message.error("Religion name cannot be empty.");
        setLoading(false); // Stop loading
        return;
      }
      if (!religionImage) {
        message.error("Religion image cannot be empty.");
        setLoading(false); // Stop loading
        return;
      }

      const formData = new FormData();
      formData.append("religionName", religionName);
      formData.append("religionColor", religionColor);
      formData.append("religionImage", religionImage);

      await addReligion(formData, parseInt(selectedElectionId));
      //  message.success("Religion added successfully!");
      fetchData(); // Refresh the data

      setIsModalVisible(false);
      setReligionImage(null);
      setFileList([]);
      form.resetFields();
    } catch (error) {
      console.log("Error adding religion", error);
      //  message.error("Failed to add religion");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Religion[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedReligions(selectedRows);
    },
  };

  // Handle deleting a religion
  const handleDelete = async (religionIds?: number[]) => {
    try {
      console.log("religionIds", religionIds);
      await deleteReligion(parseInt(selectedElectionId), religionIds);
      const successMessage = religionIds?.length
        ? `${religionIds.length} Religion deleted successfully`
        : "All Religions deleted successfully";

      message.success(successMessage);
      await fetchData();
    } catch (error) {
      const errorMessage = religionIds?.length
        ? "Failed to delete selected Religions"
        : "Failed to delete all Religions";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedReligions([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all religion data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all
            religion data.
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
            I understand that by confirming, all religion data will be
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

  const handleEdit = (record: Religion) => {
    setEditingKey(record.key);
    console.log("handle edit record", record);
    // form.setFieldsValue({ religionName: record.religionName });
    showModal();
  };

  const handleSaveEdit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (editingKey) {
          setLoading(true);
          const formData = new FormData();
          formData.append("religionName", values.religionName);
          formData.append("religionColor", values.religionColor);
          if (religionImage) formData.append("religionImage", religionImage);
          else if (editingImage) {
            formData.append("religionImage", editingImage);
          }
          try {
            await editReligion(
              formData,
              Number(editingKey),
              parseInt(selectedElectionId)
            ); // Pass FormData to API
            setReligions(
              religions.map((religion) =>
                religion.key === editingKey
                  ? {
                      ...religion,
                      religionName: values.religionName,
                      religionColor: values.religionColor,
                      religionImage: religionImage || editingImage,
                    }
                  : religion
              )
            );
            setFilteredReligions(
              filteredReligions.map((religion) =>
                religion.key === editingKey
                  ? {
                      ...religion,
                      religionName: values.religionName,
                      religionColor: values.religionColor,
                      religionImage: religionImage || editingImage,
                    }
                  : religion
              )
            );
            fetchData();

            setEditingKey(null);
            setIsModalVisible(false);
            setEditingImage(null);
            setReligionImage(null);
            setFileList([]);
            setSearchQuery("");
          } catch (error) {
            console.error("Error editing religion: ", error);
          } finally {
            setLoading(false);
          }
        }
      })
      .catch(() => {
        message.error("Please enter a valid religion name.");
      });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = religions.filter((religion) =>
      religion.religionName?.toString().toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredReligions(filteredData);
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
            title: "Delete Selected Religions",
            content: `Are you sure you want to delete ${selectedReligions.length} religion(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedReligions.map((religion) => religion.id)
              );
            },
          });
        }}
        disabled={
          selectedReligions.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("religion"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedReligions.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("religion"))
        }
        danger
      >
        Delete All Religions
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<Religion> = [
    {
      title: "Religion Name",
      dataIndex: "religionName",
      key: "religionName",
      sorter: (a, b) => a?.religionName?.localeCompare(b.religionName),
      //defaultSortOrder: "ascend",
    },
    {
      title: "Religion Image",
      key: "image",
      render: (_, record) => (
        <div>
          {record.religionImage ? (
            <img
              src={
                record.religionImage instanceof File
                  ? URL.createObjectURL(record.religionImage)
                  : record.religionImage
              }
              alt="Religion"
              style={{ width: 100, height: 100, objectFit: "cover" }}
            />
          ) : (
            <span>No Image</span>
          )}
        </div>
      ),
    },
     {
      title: "Religion Color",
      dataIndex: "religionColor",
      key: "color",
      align:"center",
      render: (color: string) => (
        <div
          style={{
            width: 30,
            height: 30,
            margin: "0 auto",
            backgroundColor: color || "#f5f5f5",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      ),
    },
    {
      title: "Action",
      key: "edit",
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasUpdatePermission("religion")),
                label: "Edit",
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasDeletePermission("religion")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this religion?"
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
  const fetchData = async () => {
    try {
      setLoadingPage(true);
      const response = await fetchReligion(parseInt(selectedElectionId));
      console.log("Fetched Relgions", response?.data?.data);
      const fetchedReligions =
        response?.data?.data
          ?.map((religion: any) => ({
            key: religion.religionId,
            orderIndex: religion.orderIndex,
            id: religion.religionId,
            religionName: religion.religionName,
            religionColor: religion.religionColor,
            religionImage: religion.religionImage,
          }))
          .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex)) || [];
      console.log("fetchedReligions", fetchedReligions);
      setReligions(fetchedReligions);
      setFilteredReligions(fetchedReligions);
    } catch (error) {
      console.error("Error fetching religions: ", error);
      setReligions([]);
      setFilteredReligions([]);
    } finally {
      setLoadingPage(false);
    }
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedItems = [...filteredReligions];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setReligions(reorderedItems);
    setFilteredReligions(reorderedItems);

    const payload = reorderedItems.map((rel, index) => ({
      religionId: rel.id,
      newOrderIndex: index,
    }));

    try {
      await updateReligionOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchData();
      fetchCpanelReligions(); // Fetch cpanel religions when component mounts
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (isModalVisible && inputRef?.current) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 0);
    }

    if (isModalVisible && editingKey !== null) {
      const religion = religions.find((r) => r.key === editingKey);
      if (religion) {
        console.log("religion", religion);
        if (religion?.religionImage) {
          form.setFieldsValue({
            religionName: religion.religionName,
            religionColor: religion.religionColor,
            religionImage: religion?.religionImage,
          });
        } else {
          form.setFieldsValue({
            religionName: religion.religionName,
            religionColor: religion.religionColor,
          });
        }
        setEditingImage(religion?.religionImage);
        setReligionImage(null);
      }
    }
  }, [isModalVisible, editingKey, religions, form]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Religion</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={
              isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("religion"))
            }
          >
            Import Religions
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={showModal}
            disabled={
              isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("religion"))
            }
          >
            Add Religion
          </Button>
        </div>
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
              placeholder="Search Religion"
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
          droppableId="droppable"
          direction="vertical"
          type="ROW"
        >
          {(provided) => (
            <div
              ref={provided.innerRef} // Attach Droppable ref here
              {...provided.droppableProps}
            >
              <Table
                className="my-4 default-list-table"
                bordered
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
                // pagination={false}
                rowSelection={rowSelection}
                dataSource={filteredReligions}
                style={{ backgroundColor: "#1D4ED85C" }}
                columns={columns}
                rowKey={"key"}
                components={{
                  body: {
                    wrapper: (props) => (
                      <tbody {...props} /> // Simple wrapper without ref
                    ),
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredReligions.findIndex(
                        (item) => item.key === key
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
              {provided.placeholder} {/* Required for spacing */}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      <Modal
        title={editingKey ? "Edit Religion" : "Add Religion"}
        open={isModalVisible}
        okButtonProps={{
          loading,
          disabled: loading,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingKey(null); // Reset editingKey
          setReligionImage(null); // Reset image on cancel
          setEditingImage(null);
          setFileList([]);
          form.resetFields();
        }}
        onOk={editingKey ? handleSaveEdit : handleAdd}
        okText={editingKey ? "Save" : "Add"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={!editingKey ? "Religion Name" : "New Religion Name"}
            name="religionName"
            rules={[
              { required: true, message: "Please enter the religion name" },
              // {
              //   pattern: /^[A-Za-z\s]+$/,
              //   message: "Please enter a valid Religion Name",
              // },
            ]}
          >
            <Input
              placeholder="Enter religion name"
              ref={inputRef}
              autoFocus={true}
            />
          </Form.Item>
          <Form.Item label="Religion Color" name="religionColor">
            <ColorPicker
              showText
              onChange={(color) => {
                form.setFieldsValue({ religionColor: color.toHexString() });
              }}
            />
          </Form.Item>
          <Form.Item
            label="Religion Image"
            name="religionImage"
            rules={
              editingKey === null
                ? [
                    {
                      required: true,
                      message: "Please upload the religion image",
                    },
                  ]
                : []
            }
          >
            <ImgCrop
              rotate
              aspect={1 / 1}
              quality={0.8}
              modalWidth={500}
              showReset
              beforeCrop={validateImageBeforeCrop}
              fillColor="transparent"
              okText="Confirm"
              cancelText="Cancel"
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop Religion Image</span>
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
                name="religionImage"
                fileList={fileList}
                listType="picture-card"
                // onChange={handleUploadChange}
                beforeUpload={handleImageUpload} // Handle image selection
                accept="image/*"
              >
                {religionImage ? (
                  <img
                    src={URL.createObjectURL(religionImage)}
                    alt="avatar"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background:
                        "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px",
                    }}
                  />
                ) : editingImage ? (
                  <img
                    src={
                      editingImage instanceof File
                        ? URL.createObjectURL(editingImage)
                        : editingImage
                    }
                    alt="avatar"
                    style={{
                      width: "100px",
                      height: "100px",
                      padding: "8px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      background:
                        "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px",
                    }}
                  />
                ) : (
                  <div>
                    {<UserOutlined />}
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
          {!religionImage ? (
            <p className="text-xs font-medium text-gray-400 -mt-3">
              Image size should not exceed 1 MB
            </p>
          ) : (
            <p></p>
          )}
        </Form>
      </Modal>

      {/* Import Religions Modal */}
      <ImportReligionsModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchData}
        selectedElectionId={selectedElectionId}
        cpanelReligions={cpanelReligions}
      />
    </div>
  );
};

export default Religion;
