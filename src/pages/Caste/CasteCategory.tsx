import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
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
} from "antd";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { RootState } from "../../redux/store";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  DownOutlined,
  ImportOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  fetchCaste,
  addCaste,
  deleteCaste,
  editCaste,
  updateCasteOrder,
  getCpanelCastesApi,
} from "../../api/casteApi";
import { ColumnsType } from "antd/es/table";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportCastesModal from "./ImportCastesModal";
import ImportCasteCategoriesModal from "./ImportCasteCategoriesModal";
import {
  updateCasteCategoryOrder,
  fetchCasteCategories,
  getCpanelCasteCategoriesApi,
  editCasteCategory,
  deleteCasteCategory,
  addCasteCategory,
} from "../../api/casteCategoryApi";

interface Caste {
  key: string;
  id: number;
  casteCategoryName: string;
}

const CasteCategory: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [casteCategories, setCasteCategories] = useState<Caste[]>([]);
  const [filteredCasteCategories, setFilteredCasteCategories] = useState<
    Caste[]
  >([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedCasteCategories, setSelectedCasteCategories] = useState<
    Caste[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelCasteCategories, setCpanelCasteCategories] = useState<any[]>([]);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();

  const inputRef = useRef(null);

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

  // Fetch castes from cpanel
  const fetchCpanelCasteCategories = async () => {
    try {
      const response = await getCpanelCasteCategoriesApi();
      // Check if response.data exists and contains the data array
      if (response && response.data && Array.isArray(response.data)) {
        const casteData = response.data.map((caste: any) => ({
          key: caste.casteCategoryId.toString(),
          id: caste.casteCategoryId,
          casteCategoryName: caste.casteCategoryName,
          orderIndex: caste.orderIndex,
        }));
        setCpanelCasteCategories(casteData);
        console.log("cpanelCasteCategories", casteData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        // If data is nested in response.data.data
        const casteData = response.data.data.map((caste: any) => ({
          key: caste.casteCategoryId.toString(),
          id: caste.casteCategoryId,
          casteCategoryName: caste.casteCategoryName,
          orderIndex: caste.orderIndex,
        }));
        setCpanelCasteCategories(casteData);
        console.log("cpanelCasteCategories", casteData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelCasteCategories([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel castes:", error);
      setCpanelCasteCategories([]);
    } finally {
    }
  };

  const fetchCasteCategoriesData = async () => {
    try {
      setLoadingPage(true);
      const response = await fetchCasteCategories(parseInt(selectedElectionId));
      const fetchedCasteCategories =
        response?.data
          ?.map((caste: any) => ({
            key: caste.casteCategoryId,
            orderIndex: caste.orderIndex,
            id: caste.casteCategoryId,
            casteCategoryName: caste.casteCategoryName,
          }))
          .sort(
            (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
          ) || [];
      console.log("fetchedCasteCategories", fetchedCasteCategories);
      setCasteCategories(fetchedCasteCategories);
      setFilteredCasteCategories(fetchedCasteCategories);
    } catch (error) {
      console.error("Error fetching caste categories: ", error);
      setCasteCategories([]);
      setFilteredCasteCategories([]);
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

    const reorderedItems = [...filteredCasteCategories];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setCasteCategories(reorderedItems); // Update state with the new order
    setFilteredCasteCategories(reorderedItems); // Update state with the new order

    const payload = reorderedItems.map((cst, index) => ({
      casteCategoryId: cst.id,
      newOrderIndex: index,
    }));

    try {
      await updateCasteCategoryOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  const fetchCastesDataAfterAdd = async () => {
    try {
      const response = await fetchCasteCategories(parseInt(selectedElectionId));
      const fetchedCastes =
        response?.data?.map((caste: any) => ({
          key: caste.casteCategoryId,
          id: caste.casteCategoryId,
          casteCategoryName: caste.casteCategoryName,
        })) || [];
      console.log("fetchedCastes", fetchedCastes);
      setCasteCategories(fetchedCastes);
      setFilteredCasteCategories(fetchedCastes);
    } catch (error) {
      console.error("Error fetching caste categories: ", error);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchCasteCategoriesData();
      fetchCpanelCasteCategories(); // Fetch cpanel castes when component mounts
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (isModalVisible && editingKey !== null) {
      const caste = casteCategories.find((c) => c.key === editingKey);
      if (caste) {
        form.setFieldsValue({
          casteCategoryName: caste.casteCategoryName,
        });
      }
    }
  }, [isModalVisible, editingKey, casteCategories, form]);

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
  // Handle adding a caste category
  const handleAddCaste = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields(); // Validate form fields
      const { casteCategoryName } = values;

      await addCasteCategory(casteCategoryName, parseInt(selectedElectionId));
      setIsModalVisible(false); // Close the modal after adding
      setSearchQuery("");
      await fetchCastesDataAfterAdd(); // Refetch caste categories after adding
    } catch (error) {
      console.error("Error adding caste category:", error);
    } finally {
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Caste[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedCasteCategories(selectedRows);
    },
  };

  // Handle deleting a caste category
  const handleDelete = async (casteCategoryIds?: number[]) => {
    try {
      console.log("casteCategoryIds", casteCategoryIds);
      await deleteCasteCategory(parseInt(selectedElectionId), casteCategoryIds);
      const successMessage = casteCategoryIds?.length
        ? `${casteCategoryIds.length} Caste category deleted successfully`
        : "All Caste categories deleted successfully";

      message.success(successMessage);
      await fetchCasteCategoriesData();
    } catch (error) {
      const errorMessage = casteCategoryIds?.length
        ? "Failed to delete selected Caste categories"
        : "Failed to delete all Caste categories";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedCasteCategories([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all caste category data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all caste
            category data.
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
            I understand that by confirming, all caste categories data will be
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

  // Handle editing a caste category
  const handleEdit = (record: Caste) => {
    setEditingKey(record.key);
    showModal();
  };

  // Handle saving caste category edit
  const handleSaveEdit = () => {
    form
      .validateFields()
      .then(async (values) => {
        if (editingKey) {
          setLoading(true);

          try {
            const payload = {
              casteCategoryName: values.casteCategoryName,
            };
            await editCasteCategory(
              Number(editingKey),
              payload,
              parseInt(selectedElectionId)
            );
            setEditingKey(null);
            setSearchQuery("");
            setIsModalVisible(false);
          } catch (error) {
            console.error("Error editing caste category: ", error);
          } finally {
            setLoading(false);
            await fetchCastesDataAfterAdd(); // Refetch caste categories after editing
          }
        }
      })
      .catch(() => {
        message.error("Please enter valid caste category details.");
      });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = casteCategories.filter((caste) =>
      caste.casteCategoryName?.toString().toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredCasteCategories(filteredData);
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
            title: "Delete Selected Caste Categories",
            content: `Are you sure you want to delete ${selectedCasteCategories.length} caste category(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedCasteCategories.map((caste) => caste.id)
              );
            },
          });
        }}
        disabled={
          selectedCasteCategories.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("caste"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedCasteCategories.length})`}
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
        Delete All Caste Categories
      </Menu.Item>
    </Menu>
  );

  // Columns for caste category table
  const columns: ColumnsType<Caste> = [
    {
      title: "Caste Category Name",
      dataIndex: "casteCategoryName",
      key: "casteCategoryName",
      sorter: (a, b) =>
        a?.casteCategoryName?.localeCompare(b.casteCategoryName),
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
                disabled: !isSuperAdminOrAdmin && !hasUpdatePermission("caste"),
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled: !isSuperAdminOrAdmin && !hasDeletePermission("caste"),

                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this caste category?"
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
        <h2 className="font-bold text-[31px] leading-8">Caste Category</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={!isSuperAdminOrAdmin && !hasCreatePermission("caste")}
          >
            Import Caste Categories
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
            Add Caste Category
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
              placeholder="Search Caste Category"
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
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <Table
                className="my-4 default-list-table"
                columns={columns}
                dataSource={filteredCasteCategories}
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
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredCasteCategories.findIndex(
                        (caste) => caste.key === key
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
        title={editingKey ? "Edit Caste Category" : "Add Caste Category"}
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
            name="casteCategoryName"
            label={
              !editingKey ? "Caste Category Name" : "New Caste Category Name"
            }
            rules={[
              { required: true, message: "Caste category name is required" },
            ]}
          >
            <Input
              ref={inputRef}
              placeholder={editingKey ? "" : "Caste category name"}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Caste Categories Modal */}
      <ImportCasteCategoriesModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchCastesDataAfterAdd}
        selectedElectionId={selectedElectionId}
        cpanelCastes={cpanelCasteCategories}
      />
    </div>
  );
};

export default CasteCategory;
