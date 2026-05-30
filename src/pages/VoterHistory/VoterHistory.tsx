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
  fetchHistory,
  addHistory,
  deleteHistory,
  editHistory,
  updateHistoryOrder,
  getCpanelHistoriesApi,
} from "../../api/historyApi";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportHistoryModal from "./ImportHistoryModal";
// import ImportHistoryModal from "./ImportHistoryModal";
import { VoterHistory as VoterHistoryType } from "../../types/history";

const VoterHistory: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [voterHistoryImage, setVoterHistoryImage] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<File | string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedHistories, setSelectedHistories] = useState<
    VoterHistoryType[]
  >([]);
  const [histories, setHistories] = useState<VoterHistoryType[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<
    VoterHistoryType[]
  >([]);
  const [fileList, setFileList] = useState([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelHistories, setCpanelHistories] = useState<any[]>([]);

  const [form] = Form.useForm();
  const inputRef = useRef(null);

  const showModal = () => {
    if (isFrozen) return;
    setIsModalVisible(true);
    // form.resetFields();
    if (!editingKey) {
      form.resetFields();
      setVoterHistoryImage(null);
      setEditingImage(null);
      setFileList([]);
    }
    // setVoterHistoryImage(null);
    // setEditingImage(null);
    // setFileList([]);
  };

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

  const fetchCpanelHistories = async () => {
    setLoadingPage(true);
    try {
      const response = await getCpanelHistoriesApi();
      if (response && response.data && Array.isArray(response.data)) {
        const historyData = response.data.map((history: any) => ({
          key: history.voterHistoryId.toString(),
          id: history.voterHistoryId,
          voterHistoryName: history.voterHistoryName,
          voterHistoryImage: history.voterHistoryImage,
          orderIndex: history.orderIndex,
        }));
        setCpanelHistories(historyData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        const historyData = response.data.data.map((history: any) => ({
          key: history.voterHistoryId.toString(),
          id: history.voterHistoryId,
          voterHistoryName: history.voterHistoryName,
          voterHistoryImage: history.voterHistoryImage,
          orderIndex: history.orderIndex,
        }));
        setCpanelHistories(historyData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelHistories([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel histories:", error);
      setCpanelHistories([]);
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
    setVoterHistoryImage(file);
    form.setFieldValue("voterHistoryImage", file);
    return false;
  };

  const handleAdd = async () => {
    if (isFrozen) return;
    setLoading(true);
    try {
      const voterHistoryName = form.getFieldValue("voterHistoryName");
      if (!voterHistoryName.trim()) {
        message.error("Voting History name cannot be empty.");
        setLoading(false);
        return;
      }
      if (!voterHistoryImage) {
        message.error("Voting History image cannot be empty.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("voterHistoryName", voterHistoryName);
      formData.append("voterHistoryImage", voterHistoryImage);

      await addHistory(formData, parseInt(selectedElectionId));

      fetchHistoryData();
      setIsModalVisible(false);
      setVoterHistoryImage(null);
      setFileList([]);
      form.resetFields();
    } catch (error: any) {
      console.log("Error adding history", error);
      message.error(
        error.response.data.message || "Unable to create a voting history"
      );
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: VoterHistoryType[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedHistories(selectedRows);
    },
  };

  const handleDelete = async (voterHistoryIds?: number[]) => {
    if (isFrozen) return;
    try {
      await deleteHistory(parseInt(selectedElectionId), voterHistoryIds);
      const successMessage = voterHistoryIds?.length
        ? `${voterHistoryIds.length} Voting Histories deleted successfully`
        : "All Voting Histories deleted successfully";

      message.success(successMessage);
      await fetchHistoryData();
    } catch (error) {
      const errorMessage = voterHistoryIds?.length
        ? "Failed to delete selected Voting Histories"
        : "Failed to delete all Voting Histories";
      console.error(errorMessage, error);
      throw error;
    } finally {
      setSelectedHistories([]);
    }
  };

  const showDeleteConfirmation = () => {
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all history data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all history
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
            I understand that by confirming, all history data will be
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

  const handleEdit = (record: VoterHistory) => {
    if (isFrozen) return;
    setEditingKey(record.key);

    if (record.voterHistoryImage) {
      const mockFile = [
        {
          uid: "-1",
          name: "Current Image",
          status: "done",
          url: record.voterHistoryImage,
        },
      ];
      setFileList(mockFile);
      setEditingImage(record.voterHistoryImage); // Store the URL for reference
    } else {
      setFileList([]);
      setEditingImage(null);
    }

    // Set form values
    form.setFieldsValue({
      voterHistoryName: record.voterHistoryName,
      voterHistoryImage: record.voterHistoryImage ? fileList : [],
    });
    showModal();
  };

  const handleSaveEdit = () => {
    if (isFrozen) return;
    form
      .validateFields()
      .then(async (values) => {
        if (editingKey) {
          setLoading(true);
          const formData = new FormData();
          formData.append("voterHistoryName", values.voterHistoryName);
          if (voterHistoryImage)
            formData.append("voterHistoryImage", voterHistoryImage);
          else if (editingImage) {
            formData.append("voterHistoryImage", editingImage);
          }
          try {
            await editHistory(
              formData,
              Number(editingKey),
              parseInt(selectedElectionId)
            );
            setHistories(
              histories.map((history) =>
                history.key === editingKey
                  ? {
                      ...history,
                      voterHistoryName: values.voterHistoryName,
                      voterHistoryImage: voterHistoryImage || editingImage,
                    }
                  : history
              )
            );
            setFilteredHistories(
              filteredHistories.map((history) =>
                history.key === editingKey
                  ? {
                      ...history,
                      voterHistoryName: values.voterHistoryName,
                      voterHistoryImage: voterHistoryImage || editingImage,
                    }
                  : history
              )
            );
            fetchHistoryData();

            setEditingKey(null);
            setIsModalVisible(false);
            setEditingImage(null);
            setVoterHistoryImage(null);
            setFileList([]);
            setSearchQuery("");
          } catch (error) {
            console.error("Error editing history: ", error);
          } finally {
            setLoading(false);
          }
        }
      })
      .catch(() => {
        message.error("Please enter a valid history name.");
      });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filteredData = histories.filter((history) =>
      history.voterHistoryName
        ?.toString()
        .toLowerCase()
        .includes(lowerCaseQuery)
    );
    setFilteredHistories(filteredData);
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
            title: "Delete Selected Histories",
            content: `Are you sure you want to delete ${selectedHistories.length} history item(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedHistories.map((history) => history.id)
              );
            },
          });
        }}
        disabled={
          selectedHistories.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("history"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedHistories.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("history"))
        }
        danger
      >
        Delete All Histories
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<VoterHistory> = [
    {
      title: "History Name",
      dataIndex: "voterHistoryName",
      key: "voterHistoryName",
      sorter: (a, b) => a?.voterHistoryName?.localeCompare(b.voterHistoryName),
    },
    {
      title: "History Image",
      key: "image",
      render: (_, record) => (
        <div>
          {record.voterHistoryImage ? (
            <img
              src={
                record.voterHistoryImage instanceof File
                  ? URL.createObjectURL(record.voterHistoryImage)
                  : record.voterHistoryImage
              }
              alt="History"
              style={{ width: 100, height: 100, objectFit: "cover" }}
            />
          ) : (
            <span>No Image</span>
          )}
        </div>
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
                  (!isSuperAdminOrAdmin && !hasUpdatePermission("history")),
                label: "Edit",
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasDeletePermission("history")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this history?"
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

  const fetchHistoryData = async () => {
    try {
      setLoadingPage(true);
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
          .sort((a, b) => a.orderIndex - b.orderIndex) || [];
      setHistories(fetchedHistories);
      setFilteredHistories(fetchedHistories);
    } catch (error) {
      console.error("Error fetching histories: ", error);
      setHistories([]);
      setFilteredHistories([]);
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

    const reorderedItems = [...filteredHistories];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setHistories(reorderedItems);
    setFilteredHistories(reorderedItems);

    const payload = reorderedItems.map((hist, index) => ({
      voterHistoryId: hist.id,
      newOrderIndex: index,
    }));
    console.log("payload", payload);

    try {
      await updateHistoryOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchHistoryData();
      fetchCpanelHistories();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (isModalVisible && inputRef?.current) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 0);
    }

    if (isModalVisible && editingKey !== null) {
      const history = histories.find((r) => r.key === editingKey);
      if (history) {
        if (history?.voterHistoryImage) {
          form.setFieldsValue({
            voterHistoryName: history.voterHistoryName,
            voterHistoryImage: history?.voterHistoryImage,
          });
        } else {
          form.setFieldsValue({
            voterHistoryName: history.voterHistoryName,
          });
        }
        setEditingImage(history?.voterHistoryImage);
        setVoterHistoryImage(null);
      }
    }
  }, [isModalVisible, editingKey, histories, form]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Voting History</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("history"))
            }
          >
            Import Histories
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={showModal}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("history"))
            }
          >
            Add History
          </Button>
        </div>
      </div>
      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search History"
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
                rowSelection={rowSelection}
                dataSource={filteredHistories}
                style={{ backgroundColor: "#1D4ED85C" }}
                columns={columns}
                rowKey={"key"}
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredHistories.findIndex(
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
        title={editingKey ? "Edit History" : "Add History"}
        open={isModalVisible}
        okButtonProps={{
          loading,
          disabled: loading || isFrozen,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingKey(null);
          setVoterHistoryImage(null);
          setEditingImage(null);
          setFileList([]);
          form.resetFields();
        }}
        onClose={() => {
          setIsModalVisible(false);
          setEditingKey(null);
          setVoterHistoryImage(null);
          setEditingImage(null);
          setFileList([]);
          form.resetFields();
        }}
        onOk={editingKey ? handleSaveEdit : handleAdd}
        okText={editingKey ? "Save" : "Add"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={!editingKey ? "History Name" : "New History Name"}
            name="voterHistoryName"
            rules={[
              { required: true, message: "Please enter the history name" },
            ]}
          >
            <Input
              placeholder="Enter history name"
              ref={inputRef}
              autoFocus={true}
            />
          </Form.Item>
          <Form.Item
            label="History Image"
            name="voterHistoryImage"
            rules={
              editingKey === null
                ? [
                    {
                      required: true,
                      message: "Please upload the history image",
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
              fillColor="transparent"
              okText="Confirm"
              cancelText="Cancel"
              beforeCrop={validateImageBeforeCrop}
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop History Image</span>
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
                name="voterHistoryImage"
                fileList={fileList}
                listType="picture-card"
                beforeUpload={handleImageUpload}
                accept="image/*"
              >
                {voterHistoryImage ? (
                  <img
                    src={URL.createObjectURL(voterHistoryImage)}
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
          {!voterHistoryImage ? (
            <p className="text-xs font-medium text-gray-400 -mt-3">
              Image size should not exceed 1 MB
            </p>
          ) : (
            <p></p>
          )}
        </Form>
      </Modal>

      <ImportHistoryModal
        isOpen={isImportModalVisible}
        onClose={() => {
          setIsImportModalVisible(false);
        }}
        onImportComplete={fetchHistoryData}
        selectedElectionId={selectedElectionId}
        cpanelHistories={cpanelHistories}
      />
    </div>
  );
};

export default VoterHistory;
