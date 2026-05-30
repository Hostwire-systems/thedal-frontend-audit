import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Menu,
  Modal,
  Form,
  Input,
  Table,
  Popconfirm,
  message,
  Select,
  Dropdown,
  Col,
  Checkbox,
  Row,
  InputRef,
} from "antd";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  SearchOutlined,
  ImportOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  fetchCaste,
  addCaste,
  deleteCaste,
  editCaste,
  updateCasteOrder,
  getCpanelCastesApi,
} from "../../api/casteApi";
import { fetchReligion } from "../../api/religionApi";
import { ColumnsType } from "antd/es/table";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportCastesModal from "./ImportCastesModal";
import AddCasteModal from "./AddCasteModal";

interface Caste {
  key: string;
  id: number;
  casteName: string;
  religionId: number;
  orderIndex: number;
}

const Caste: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [castes, setCastes] = useState<Caste[]>([]);
  const [filteredCastes, setFilteredCastes] = useState<Caste[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedCastes, setSelectedCastes] = useState<Caste[]>([]);
  const [religions, setReligions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [religionId, setReligionId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelCastes, setCpanelCastes] = useState<any[]>([]);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();

  const inputRef = useRef<InputRef>(null);

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

  // Fetch all religions for the dropdown
  useEffect(() => {
    const fetchReligions = async () => {
      try {
        const response = await fetchReligion(parseInt(selectedElectionId));
        const fetchedReligions = response?.data?.data?.map((religion: any) => ({
          id: religion.religionId,
          religionName: religion.religionName,
        }));
        console.log("fetchedReligions ", fetchedReligions);
        setReligions(fetchedReligions);
      } catch (error) {
        console.error("Error fetching religions: ", error);
      }
    };
    fetchReligions();
  }, []);

  // Fetch castes from cpanel
  const fetchCpanelCastes = async () => {
    setLoadingPage(true);
    try {
      const response = await getCpanelCastesApi();
      // Check if response.data exists and contains the data array
      if (response && response.data && Array.isArray(response.data)) {
        const casteData = response.data.map((caste: any) => ({
          key: caste.casteId.toString(),
          id: caste.casteId,
          casteName: caste.casteName,
          religionName: caste.religionName,
          religionId: caste.religionId,
          orderIndex: caste.orderIndex,
        }));
        setCpanelCastes(casteData);
        console.log("cpanelCastes", casteData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        // If data is nested in response.data.data
        const casteData = response.data.data.map((caste: any) => ({
          key: caste.casteId.toString(),
          id: caste.casteId,
          casteName: caste.casteName,
          orderIndex: caste.orderIndex,
        }));
        setCpanelCastes(casteData);
        console.log("cpanelCastes", casteData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelCastes([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel castes:", error);
      setCpanelCastes([]);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchCastesData = async () => {
    try {
      setLoadingPage(true);
      const response = await fetchCaste(
        parseInt(selectedElectionId),
        religionId || undefined
      );
      console.log("religionId in fetchCastesData", religionId);
      const fetchedCastes =
        response?.data?.data
          ?.map((caste: any) => ({
            key: caste.casteId,
            orderIndex: caste.orderIndex,
            id: caste.casteId,
            casteName: caste.casteName,
            religionId: caste.religionId,
          }))
          .sort(
            (a: Caste, b: Caste) => Number(a.orderIndex) - Number(b.orderIndex)
          ) || [];
      console.log("fetchedCastes", fetchedCastes);
      setCastes(fetchedCastes);
      setFilteredCastes(fetchedCastes);
    } catch (error) {
      console.error("Error fetching castes: ", error);
      setCastes([]);
      setFilteredCastes([]);
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

    const reorderedItems = [...filteredCastes];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setCastes(reorderedItems); // Update state with the new order
    setFilteredCastes(reorderedItems); // Update state with the new order

    const payload = reorderedItems.map((cst, index) => ({
      casteId: cst.id,
      newOrderIndex: index,
    }));

    try {
      await updateCasteOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  const fetchCastesDataAfterAdd = async () => {
    try {
      const response = await fetchCaste(parseInt(selectedElectionId));
      const fetchedCastes =
        response?.data?.data?.map((caste: any) => ({
          key: caste.casteId,
          id: caste.casteId,
          casteName: caste.casteName,
          religionId: caste.religionId,
        })) || [];
      console.log("fetchedCastes", fetchedCastes);
      setCastes(fetchedCastes);
      setFilteredCastes(fetchedCastes);
    } catch (error) {
      console.error("Error fetching castes: ", error);
    }
  };
  // Fetch all castes initially or based on selected religion
  useEffect(() => {
    if (selectedElectionId) {
      fetchCastesData();
      fetchCpanelCastes(); // Fetch cpanel castes when component mounts
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (isModalVisible && editingKey !== null) {
      const caste = castes.find((c) => c.key === editingKey);
      if (caste) {
        form.setFieldsValue({
          casteName: caste.casteName,
          religionId: caste.religionId,
        });
      }
    }
  }, [isModalVisible, editingKey, castes, form]);

  // Show the modal
  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields(); // Clear form values when opening the modal
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 0);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingKey(null);
    if (inputRef?.current) {
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    }
  };
  // Handle adding a caste
  const handleAddCaste = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields(); // Validate form fields
      const { casteName, religionId } = values;

      if (!religionId) {
        message.error("Please select a religion.");
        setLoading(false);
        return;
      }

      await addCaste(casteName, religionId, parseInt(selectedElectionId)); // Call API to add caste
      setIsModalVisible(false); // Close the modal after adding
      setReligionId(null);
      setSearchQuery("");
      await fetchCastesDataAfterAdd(); // Refetch castes after adding
    } catch (error) {
      console.error("Error adding caste:", error);
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Caste[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedCastes(selectedRows);
    },
  };

  // Handle deleting a caste
  const handleDelete = async (casteIds?: number[]) => {
    try {
      console.log("CasteIds", casteIds);
      await deleteCaste(parseInt(selectedElectionId), casteIds);
      const successMessage = casteIds?.length
        ? `${casteIds.length} Caste deleted successfully`
        : "All Castes deleted successfully";

      message.success(successMessage);
      await fetchCastesData();
    } catch (error) {
      const errorMessage = casteIds?.length
        ? "Failed to delete selected Castes"
        : "Failed to delete all Castes";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedCastes([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all caste data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all caste
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
            I understand that by confirming, all castes data will be permanently
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

  // Handle editing a caste
  const handleEdit = (record: Caste) => {
    setEditingKey(record.key);
    showModal();
  };

  // Handle saving caste edit
  const handleSaveEdit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (editingKey) {
          setLoading(true);

          try {
            const payload = {
              religionId: values.religionId,
              casteName: values.casteName,
            };
            await editCaste(
              Number(editingKey),
              payload,
              parseInt(selectedElectionId)
            ); // Only sending casteName
            setReligionId(null);
            setEditingKey(null);
            setSearchQuery("");
            setIsModalVisible(false);
          } catch (error) {
            console.error("Error editing caste: ", error);
          } finally {
            setLoading(false);
            await fetchCastesDataAfterAdd(); // Refetch castes after editing
          }
        }
      })
      .catch(() => {
        message.error("Please enter valid caste details.");
      });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = castes.filter((caste) =>
      caste.casteName?.toString().toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredCastes(filteredData);
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
            title: "Delete Selected Castes",
            content: `Are you sure you want to delete ${selectedCastes.length} caste(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(selectedCastes.map((caste) => caste.id));
            },
          });
        }}
        disabled={
          selectedCastes.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("caste"))
        }
      >
        {loading ? "Deleting..." : `Delete Selected (${selectedCastes.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("caste"))
        }
        danger
      >
        Delete All Castes
      </Menu.Item>
    </Menu>
  );

  // Columns for caste table
  const columns: ColumnsType<Caste> = [
    {
      title: "Caste Name",
      dataIndex: "casteName",
      key: "casteName",
      sorter: (a, b) => a?.casteName?.localeCompare(b.casteName),
      //defaultSortOrder: "ascend",
    },
    {
      title: "Religion",
      dataIndex: "religionId",
      key: "religionId",
      render: (_, record) => {
        const religion = religions.find((r) => r.id === record.religionId);
        return religion ? religion.religionName : "-";
      },
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
                  (!isSuperAdminOrAdmin && !hasUpdatePermission("caste")),
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasDeletePermission("caste")),

                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this caste?"
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
    if (isModalVisible) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 0);
    }
  }, [isModalVisible]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Caste</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={
              isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("caste"))
            }
          >
            Import Castes
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={showModal}
            disabled={
              isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("caste"))
            }
          >
            Add Caste
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
              placeholder="Search Caste"
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
                columns={columns}
                dataSource={filteredCastes}
                style={{ backgroundColor: "#1D4ED85C" }}
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
                rowKey={"key"}
                components={{
                  body: {
                    wrapper: (props: any) => (
                      <tbody {...props} /> // Simple wrapper without ref
                    ),
                    row: (props: any) => {
                      const key = props["data-row-key"];
                      const index = filteredCastes.findIndex(
                        (caste) => caste.key === key
                      );

                      // Skip rendering if the row is being dragged and index is invalid
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
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      {/* <Modal
        title={editingKey ? "Edit Caste" : "Add Caste"}
        open={isModalVisible}
        onCancel={closeModal}
        onOk={editingKey ? handleSaveEdit : handleAddCaste}
        okButtonProps={{
          loading,
          disabled: loading,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "#fff",
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="casteName"
            label={!editingKey ? "Caste Name" : "New Caste Name"}
            rules={[
              { required: true, message: "Caste name is required" },
              // {
              //   pattern: /^[A-Za-z\s]+$/,
              //   message: "Please enter a valid Caste Name",
              // },
            ]}
          >
            <Input
              ref={inputRef}
              placeholder={editingKey ? "" : "Caste name"}
            />
          </Form.Item>
          {/* {!editingKey && ( */}
      {/* <Form.Item
            name="religionId"
            label="Religion"
            rules={[{ required: true, message: "Please select a religion" }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Religion"
              onChange={(value) => setReligionId(value || null)}
              value={religionId}
              allowClear
            >
              {religions.map((religion) => (
                <Select.Option key={religion.id} value={religion.id}>
                  {religion.religionName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {/* )} */}
      {/* </Form>
      </Modal>  */}
      <AddCasteModal
        isModalVisible={isModalVisible}
        closeModal={closeModal}
        editingKey={editingKey}
        handleSaveEdit={handleSaveEdit}
        handleAddCaste={handleAddCaste}
        loading={loading}
        setLoading={setLoading}
        form={form}
        religionId={religionId}
        setReligionId={setReligionId}
        religions={religions}
        selectedElectionId={selectedElectionId}
        fetchCastesDataAfterAdd={fetchCastesDataAfterAdd}
      />

      {/* Import Castes Modal */}
      <ImportCastesModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchCastesDataAfterAdd}
        selectedElectionId={selectedElectionId}
        cpanelCastes={cpanelCastes}
        religions={religions}
      />
    </div>
  );
};

export default Caste;
