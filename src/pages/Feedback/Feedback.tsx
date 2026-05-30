import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  SearchOutlined,
  ImportOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  AutoComplete,
  Button,
  Checkbox,
  Col,
  Dropdown,
  Form,
  Input,
  Menu,
  message,
  Modal,
  Popconfirm,
  Row,
  Table,
} from "antd";
import { useForm } from "antd/es/form/Form";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useLoading } from "../../context/LoadingContext";
import {
  getFeedbackApi,
  addFeedbackApi,
  updateFeedbackApi,
  deleteFeedbackApi,
  updateFeedbackOrder,
  getCpanelFeedbackApi,
} from "../../api/feedbackApi";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { FeedbackType } from "../../types/feedback";
import ImportFeedbackModal from "./ImportFeedbackModal";

const Feedback = () => {
  const [form] = useForm();
  const [feedbacks, setFeedbacks] = useState<FeedbackType[]>([]);
  const [cpanelFeedbacks, setCpanelFeedbacks] = useState<FeedbackType[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<FeedbackType[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<FeedbackType[]>(
    []
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { isLoading, setLoading } = useLoading();
  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

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

  useEffect(() => {
    if (selectedElectionId) {
      fetchFeedbacks();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    fetchCpanelFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await getFeedbackApi(parseInt(selectedElectionId));
      const feedbackData = response.data
        .map((feedback: any) => ({
          key: feedback.id.toString(),
          id: feedback.id,
          issueName: feedback.issueName,
          orderIndex: feedback.orderIndex,
        })) || []
        .sort((a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex));
      setFeedbacks(feedbackData);
      // Apply current search filter to new data
      const filtered = feedbackData.filter((feedback: FeedbackType) =>
        feedback.issueName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFeedbacks(filtered);
    } catch (error) {
      console.error("Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const fetchCpanelFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await getCpanelFeedbackApi();
      const feedbackData = response.data.map((feedback: any) => ({
        key: feedback.id.toString(),
        id: feedback.id,
        issueName: feedback.issueName,
        orderIndex: feedback.orderIndex,
      }));
      console.log("response",response);
      setCpanelFeedbacks(feedbackData);
    } catch (error) {
      console.error("Failed to fetch cpanel feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = feedbacks.filter((feedback) =>
      feedback.issueName.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredFeedbacks(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  // const handleOptionsSearch = (value: any) => {
  //   if (!value) {
  //     setOptions([]);
  //     return;
  //   }

  //   const existingOptions = feedbacks
  //     .filter((feedback) =>
  //       feedback.issueName.toLowerCase().includes(value.toLowerCase())
  //     )
  //     .map((feedback) => ({ value: feedback.issueName }));

  //   setOptions(existingOptions);
  // };

  const openModal = (record: FeedbackType | null = null) => {
    if (isFrozen) return;
    if (record) {
      form.setFieldsValue({ issueName: record.issueName });
      setEditingId(record.id);
    } else {
      form.resetFields();
      setEditingId(null);
    }
    setIsModalVisible(true);
  };

  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedItems = [...filteredFeedbacks];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setFeedbacks(reorderedItems);
    setFilteredFeedbacks(reorderedItems);
    const payload = reorderedItems.map((feedback, index) => ({
      issueId: feedback.id,
      newOrderIndex: index,
    }));

    try {
      await updateFeedbackOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  const handleSubmit = async (values: { issueName: string }) => {
    if (isFrozen) return;
    setIsButtonLoading(true);
    try {
      const payload = { issueName: values.issueName };

      if (editingId) {
        await updateFeedbackApi(
          payload,
          parseInt(selectedElectionId),
          editingId
        );
        message.success("Feedback updated successfully");
      } else {
        await addFeedbackApi(payload, parseInt(selectedElectionId));
        message.success("Feedback created successfully");
      }

      await fetchFeedbacks();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Error creating feedback");
    } finally {
      setIsButtonLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: FeedbackType[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedFeedbacks(selectedRows);
    },
  };

  const handleDelete = async (feedbackIds?: number[]) => {
    if (isFrozen) return;
    setIsButtonLoading(true);
    try {
      await deleteFeedbackApi(parseInt(selectedElectionId), feedbackIds);
      const successMessage = feedbackIds?.length
        ? `${feedbackIds.length} Feedback deleted successfully`
        : "All Feedbacks deleted successfully";

      message.success(successMessage);
      await fetchFeedbacks();
    } catch (error) {
      const errorMessage = feedbackIds?.length
        ? "Failed to delete selected Feedbacks"
        : "Failed to delete all Feedbacks";
      console.error(errorMessage, error);
      throw error;
    } finally {
      setSelectedFeedbacks([]);
      setSelectedRowKeys([]);
      setIsButtonLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all feedback data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all
            feedback data.
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
            I understand that by confirming, all feedback data will be
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

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={() => {
          Modal.confirm({
            title: "Delete Selected Feedback",
            content: `Are you sure you want to delete ${selectedFeedbacks.length} feedback(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedFeedbacks.map((feedback) => feedback.id)
              );
            },
          });
        }}
        disabled={
          selectedFeedbacks.length === 0 ||
          isLoading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("feedback"))
        }
      >
        {isLoading
          ? "Deleting..."
          : `Delete Selected (${selectedFeedbacks.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("feedback"))
        }
        danger
      >
        Delete All Feedbacks
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Issue Name",
      dataIndex: "issueName",
      key: "issueName",
      sorter: (a: FeedbackType, b: FeedbackType) =>
        a.issueName.localeCompare(b.issueName),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: FeedbackType) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit",
                onClick: () => openModal(record),
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasUpdatePermission("feedback")),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this feedback?"
                    onConfirm={() => handleDelete([parseInt(record.key)])}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{
                      loading: isButtonLoading,
                      disabled: isButtonLoading,
                      style: {
                        backgroundColor: "#1D4ED8",
                        borderColor: "#1D4ED8",
                        color: "white",
                      },
                    }}
                  >
                    <span>Delete</span>
                  </Popconfirm>
                ),
                danger: true,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasDeletePermission("feedback")),
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

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Feedback</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={isFrozen}
          >
            Import Feedbacks
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                    hover:!bg-[#1D4ED8] hover:text-[#fff]
                    hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={() => openModal()}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("feedback"))
            }
          >
            Add Feedback Issue
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
              placeholder="Search Feedback"
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
          droppableId="droppableFeedbacks"
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
                dataSource={filteredFeedbacks}
                columns={columns}
                rowKey="key"
                loading={isLoading}
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
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredFeedbacks.findIndex(
                        (feedback) => feedback.key === key
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
        title={editingId ? "Edit Feedback Issue" : "Add Feedback Issue"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        onOk={() => form.submit()}
        okButtonProps={{
          loading: isButtonLoading,
          disabled: isButtonLoading || isFrozen,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "white",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Issue Name"
            name="issueName"
            rules={[{ required: true, message: "Please enter the issue name" }]}
          >
            {/* <AutoComplete
              options={options}
              onSearch={handleOptionsSearch}
              placeholder="Enter Issue name"
              filterOption={false}
            > */}
            <Input placeholder="Enter Issue name" />
            {/* </AutoComplete> */}
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Feedback Modal */}
      <ImportFeedbackModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchFeedbacks}
        selectedElectionId={selectedElectionId}
        cpanelFeedbacks={cpanelFeedbacks}
      />
    </div>
  );
};

export default Feedback;
