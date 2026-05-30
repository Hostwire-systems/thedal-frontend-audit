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
  Radio,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  SearchOutlined,
  ImportOutlined,
  DownOutlined,
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { fetchCaste } from "../../api/casteApi";
import { fetchReligion } from "../../api/religionApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { addCaste } from "../../api/casteApi";
import {
  addSubCaste,
  editSubCaste,
  deleteSubCaste,
  fetchSubCaste,
  updateSubCasteOrder,
  getCpanelSubCastesApi,
} from "../../api/subCasteApi";
import { ColumnsType } from "antd/es/table";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportSubCastesModal from "./ImportSubCastesModal";
import AddSubCasteModal from "./AddSubCasteModal";

interface SubCaste {
  key: string;
  id: number;
  subCasteName: string;
  casteId: number;
  religionId: number;
}

const SubCaste: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [subCastes, setSubCastes] = useState<SubCaste[]>([]);
  const [filteredSubCastes, setFilteredSubCastes] = useState<SubCaste[]>([]);
  const [religions, setReligions] = useState<any[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSubCastes, setSelectedSubCastes] = useState<SubCaste[]>([]);
  const [castes, setCastes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReligionId, setSelectedReligionId] = useState<any>(null);
  const [newCasteName, setNewCasteName] = useState<string>("");
  const [isCasteModalVisible, setIsCasteModalVisible] = useState(false);
  const [selectedCasteId, setSelectedCasteId] = useState<number | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelSubCastes, setCpanelSubCastes] = useState<any[]>([]);
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();
  const [method, setMethod] = useState<0 | 1>(1);

  const [form] = Form.useForm();
  const inputRef = useRef(null);
  const { Option } = Select;

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
  const hasUpdatePermission = (module: string) => {
    return rolesPermission?.[module]?.includes("U");
  };
  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  // Fetch religions
  useEffect(() => {
    const fetchReligions = async () => {
      try {
        const response = await fetchReligion(parseInt(selectedElectionId));
        const fetchedReligions = response?.data?.data?.map((religion: any) => ({
          id: religion.religionId,
          religionName: religion.religionName,
        }));
        console.log("fetchedReligions", fetchedReligions);
        setReligions(fetchedReligions);
      } catch (error) {
        console.error("Error fetching religions: ", error);
      }
    };
    fetchReligions();
  }, []);

  // Fetch subcastes from cpanel
  const fetchCpanelSubCastes = async () => {
    setLoadingPage(true);
    try {
      const response = await getCpanelSubCastesApi();
      // Check if response.data exists and contains the data array
      if (response && response.data && Array.isArray(response.data)) {
        const subCasteData = response.data.map((subcaste: any) => ({
          key: subcaste.subCasteId.toString(),
          subCasteId: subcaste.subCasteId,
          id: subcaste.subCasteId,
          subCasteName: subcaste.subCasteName,
          casteName: subcaste.casteName,
          religionName: subcaste.religionName,
          orderIndex: subcaste.orderIndex,
        }));
        setCpanelSubCastes(subCasteData);
        console.log("cpanelSubCastes", subCasteData);
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.data)
      ) {
        // If data is nested in response.data.data
        const subCasteData = response.data.data.map((subcaste: any) => ({
          key: subcaste.subCasteId.toString(),
          subCasteId: subcaste.subCasteId,
          id: subcaste.subCasteId,
          subCasteName: subcaste.subCasteName,
          casteName: subcaste.casteName,
          religionName: subcaste.religionName,
          orderIndex: subcaste.orderIndex,
        }));
        setCpanelSubCastes(subCasteData);
        console.log("cpanelSubCastes", subCasteData);
      } else {
        console.error("Unexpected API response structure:", response);
        setCpanelSubCastes([]);
      }
    } catch (error) {
      console.error("Error fetching cpanel subcastes:", error);
      setCpanelSubCastes([]);
    } finally {
      setLoadingPage(false);
    }
  };

  // Fetch castes when religion changes
  const fetchCasteData = async () => {
    console.log("selectedReligionId", selectedReligionId);
    if (selectedReligionId) {
      try {
        const response = await fetchCaste(
          parseInt(selectedElectionId),
          selectedReligionId
        );
        console.log(response.data);
        const fetchedCastes = response?.data?.data?.map((caste: any) => ({
          id: caste.casteId,
          casteName: caste.casteName,
        }));
        console.log("fetchedCastes", fetchedCastes);
        setCastes(fetchedCastes);
      } catch (error) {
        setCastes([]);
        console.error("Error fetching castes: ", error);
      }
    } else {
      setCastes([]);
    }
  };
  useEffect(() => {
    fetchCasteData();
  }, [selectedReligionId, selectedElectionId]);

  // Fetch sub-castes

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedReligionId(null);
    setSelectedCasteId(null);
    setEditingKey(null);
    if (inputRef?.current) {
      inputRef.current.blur();
    }
  };
  const closeCasteModal = () => {
    setIsCasteModalVisible(false);
  };
  const fetchSubCastesData = async () => {
    try {
      setLoadingPage(true);
      const response = await fetchSubCaste(parseInt(selectedElectionId));
      const fetchedSubCastes =
        response?.data?.data
          ?.map((subCaste: any) => ({
            key: subCaste.subCasteId,
            orderIndex: subCaste.orderIndex,
            id: subCaste.subCasteId,
            subCasteName: subCaste.subCasteName,
            casteName: subCaste.casteName,
            religionName: subCaste.religionName,
          }))
          .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex)) || [];
      console.log("fetchedSubCastes", fetchedSubCastes);
      setSubCastes(fetchedSubCastes);
      setFilteredSubCastes(fetchedSubCastes);
    } catch (error) {
      console.error("Error fetching sub-castes: ", error);
      setSubCastes([]);
      setFilteredSubCastes([]);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchSubCastesData();
      fetchCpanelSubCastes(); // Fetch cpanel subcastes when component mounts
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (isModalVisible && inputRef?.current) {
      inputRef.current.focus();
    }

    if (isModalVisible && editingKey !== null) {
      const subCaste = subCastes.find((c) => c.key === editingKey);
      console.log("subCaste", subCaste);
      if (subCaste) {
        const religion = religions?.find(
          (r) => r.religionName === subCaste.religionName
        );
        console.log("religion", religion);
        setSelectedReligionId(religion?.id);
      }
    }
  }, [isModalVisible, editingKey, subCastes, form]);

  // Separate useEffect to wait for castes to load before selecting the caste
  useEffect(() => {
    if (isModalVisible && selectedReligionId && editingKey !== null) {
      const subCaste = subCastes.find((c) => c.key === editingKey);
      if (subCaste) {
        const caste = castes?.find((c) => c.casteName === subCaste.casteName);
        console.log("caste", caste);

        if (caste) {
          setSelectedCasteId(caste.id);
          form.setFieldsValue({
            subCasteName: subCaste.subCasteName,
            religionId: selectedReligionId,
            casteId: caste.id,
          });
        }
      }
    }
  }, [castes, selectedReligionId, isModalVisible, editingKey, subCastes, form]);

  // Show the modal
  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields();
    setTimeout(() => {
      inputRef?.current?.focus();
    }, 0);
  };

  const handleAddCaste = async () => {
    try {
      setLoading(true);
      await addCaste(
        newCasteName,
        selectedReligionId,
        parseInt(selectedElectionId)
      );
      setIsCasteModalVisible(false);
      await fetchCasteData();
    } catch (error) {
      console.log("Error Adding Caste", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a sub-caste
  const handleAddSubCaste = async () => {
    try {
      const values = await form.validateFields();
      const { subCasteName, casteId, religionId } = values;

      if (!religionId || !casteId) {
        message.error("Please select both religion and caste.");
        return;
      }

      await addSubCaste(
        subCasteName,
        casteId,
        religionId,
        parseInt(selectedElectionId)
      );
      setSearchQuery("");
      setIsModalVisible(false);
      setSelectedReligionId(null);
      setSelectedCasteId(null);
      fetchSubCastesData();
    } catch (error) {
      console.error("Error adding sub-caste:", error);
    }
  };

  const handleDelete = async (subcasteIds?: number[]) => {
    try {
      console.log("subcasteIds", subcasteIds);
      await deleteSubCaste(parseInt(selectedElectionId), subcasteIds);
      const successMessage = subcasteIds?.length
        ? `${subcasteIds.length} subcaste deleted successfully`
        : "All subcastes deleted successfully";

      message.success(successMessage);
      await fetchSubCastesData();
    } catch (error) {
      const errorMessage = subcasteIds?.length
        ? "Failed to delete selected subcastes"
        : "Failed to delete all subcastes";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedSubCastes([]);
      setSelectedRowKeys([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all subcaste data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all
            subcaste data.
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
            I understand that by confirming, all subcaste data will be
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: SubCaste[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedSubCastes(selectedRows);
    },
  };

  // Handle editing a sub-caste
  const handleEdit = (record: SubCaste) => {
    setEditingKey(record.key);
    showModal();
  };

  // Handle saving sub-caste edit
  const handleSaveEdit = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);

        if (editingKey) {
          try {
            const { religionId, casteId, subCasteName } = values;
            const payload = {
              subCasteName,
              religionId,
              casteId,
            };
            await editSubCaste(
              Number(editingKey),
              payload,
              parseInt(selectedElectionId)
            );
            fetchSubCastesData();
            setSearchQuery("");
            setEditingKey(null);
            setIsModalVisible(false);
          } catch (error) {
            console.error("Error editing sub-caste: ", error);
          }
        }
      })
      .catch(() => {
        message.error("Please enter valid sub-caste details.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = subCastes.filter((subcaste) =>
      subcaste.subCasteName?.toString().toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredSubCastes(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };
  const onDragStart = () => {
    if (isFrozen) return;
    setIsDragging(true);
  };
  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (isFrozen || !result.destination) return;

    const reorderedSubCastes = [...filteredSubCastes];
    const [movedItem] = reorderedSubCastes.splice(result.source.index, 1);
    reorderedSubCastes.splice(result.destination.index, 0, movedItem);
    setSubCastes(reorderedSubCastes); // Update state with the new order
    setFilteredSubCastes(reorderedSubCastes); // Update state with the new order

    const payload = reorderedSubCastes.map((sbcst, index) => ({
      subCasteId: sbcst.id,
      newOrderIndex: index,
    }));

    try {
      await updateSubCasteOrder(parseInt(selectedElectionId), payload);
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
            title: "Delete Selected Sub Castes",
            content: `Are you sure you want to delete ${selectedSubCastes.length} sub-caste(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedSubCastes.map((subcaste) => subcaste.id)
              );
            },
          });
        }}
        disabled={
          selectedSubCastes.length === 0 ||
          loading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("subCaste"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedSubCastes.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("subCaste"))
        }
        danger
      >
        Delete All Subcastes
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<SubCaste> = [
    {
      title: "Sub-Caste Name",
      dataIndex: "subCasteName",
      key: "subCasteName",
      sorter: (a, b) => {
        const nameA = a?.subCasteName || "";
        const nameB = b?.subCasteName || "";
        return nameA.localeCompare(nameB);
      },
      //defaultSortOrder:"ascend"
    },
    {
      title: "Religion",
      dataIndex: "religionName",
      key: "religionName",
    },
    {
      title: "Caste",
      dataIndex: "casteName",
      key: "casteName",
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
                  !isSuperAdminOrAdmin && !hasUpdatePermission("subCaste"),
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  !isSuperAdminOrAdmin && !hasDeletePermission("subCaste"),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this sub-caste?"
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

  useEffect(() => {
    if (isModalVisible && selectedReligionId) {
      form.setFieldsValue({ casteId: undefined });
      fetchCasteData();
    }
  }, [selectedReligionId, isModalVisible, form]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Sub-Caste</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={
              isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("subCaste"))
            }
          >
            Import Sub-Castes
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={showModal}
            disabled={
              isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("subCaste"))
            }
          >
            Add Sub-Caste
          </Button>
        </div>
      </div>
      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Subcaste: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Sub-Caste"
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
                dataSource={filteredSubCastes}
                rowSelection={rowSelection}
                style={{ backgroundColor: "#1D4ED85C" }}
                rowKey="key"
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
                    wrapper: (props: any) => (
                      <tbody {...props} /> // Simple wrapper without ref
                    ),
                    row: (props: any) => {
                      const key = props["data-row-key"];
                      const index = filteredSubCastes.findIndex(
                        (sc) => sc.key === key
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
                                cursor: "move", // Indicate draggable rows
                                display: "table-row",
                                position: isDragging ? "relative" : "static", // Fix layout issue
                                top: isDragging ? "" : undefined, // Prevents floating row
                                left: isDragging ? "" : undefined,
                                width: "100%",
                                background: snapshot.isDragging
                                  ? "#e0f7fa" // Highlight the row when dragging
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
              {provided.placeholder}{" "}
              {/* This is important to maintain layout consistency */}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      {/* <Modal
        title={editingKey ? "Edit Sub-Caste" : "Add Sub-Caste"}
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        <div className="container mx-auto p-4">
          <Row gutter={[16, 16]} className="w-full items-center mt-4">
            <Col span={10}>
              <p className="text-[#6B7280] text-[16px] font-medium leading-6">
                Choose a method to add sub-caste
              </p>
              <Radio.Group
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full mt-5 custom-radio-group"
              >
                <Radio value={0}>Bulk Upload</Radio>
                <Radio value={1}>Manual</Radio>
              </Radio.Group>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="w-full items-center mt-4">
            <Col span={24}>
              {method === 1 && (
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="subCasteName"
                    label={
                      !editingKey ? "Sub-Caste Name" : "New Sub-Caste Name"
                    }
                    rules={[
                      { required: true, message: "Sub-caste name is required" },
                    ]}
                  >
                    <Input ref={inputRef} placeholder="Subcaste name" />
                  </Form.Item>

                  <Form.Item
                    name="religionId"
                    label="Religion"
                    rules={[
                      { required: true, message: "Please select a religion" },
                    ]}
                  >
                    <Select
                      showSearch
                      filterOption={(input, option) =>
                        option?.children
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      placeholder="Select Religion"
                      onChange={(value) => setSelectedReligionId(value)}
                    >
                      {religions.map((religion) => (
                        <Select.Option key={religion.id} value={religion.id}>
                          {religion.religionName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="casteId"
                    label="Caste"
                    rules={[
                      { required: true, message: "Please enter the caste" },
                    ]}
                  >
                    {castes.length > 0 ? (
                      <Select
                        showSearch
                        filterOption={(input, option) =>
                          option?.children
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        disabled={!selectedReligionId}
                        placeholder="Select Caste"
                      >
                        {castes.map((caste) => (
                          <Select.Option key={caste.id} value={caste.id}>
                            {caste.casteName}
                          </Select.Option>
                        ))}
                      </Select>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          border: "1px solid #d9d9d9",
                          borderRadius: "4px",
                        }}
                      >
                        <Button
                          type="link"
                          disabled={!selectedReligionId}
                          onClick={() => setIsCasteModalVisible(true)}
                          style={{ padding: 0 }}
                        >
                          Click to Add.
                        </Button>
                      </div>
                    )}
                  </Form.Item>

                  <div className="flex justify-end gap-4">
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button
                      type="primary"
                      onClick={editingKey ? handleSaveEdit : handleAddSubCaste}
                      loading={loading}
                      disabled={loading}
                      style={{ backgroundColor: "#1D4ED8", color: "white" }}
                    >
                      {editingKey ? "Save Changes" : "Add Sub-Caste"}
                    </Button>
                  </div>
                </Form>
              )}

              {method === 0 && (
                <div className="p-4">
                  <Dragger
                    {...uploadProps}
                    style={{
                      border: "2px dashed #1D4ED8",
                      borderRadius: "8px",
                      padding: "20px",
                      background: "#f0f5ff",
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined
                        style={{ color: "#1D4ED8", fontSize: "48px" }}
                      />
                    </p>
                    <p className="ant-upload-text">
                      Drag & drop your CSV/Excel file here
                    </p>
                    <p className="ant-upload-hint">or</p>
                    <Button className="mt-2">Browse Files</Button>
                  </Dragger>

                  <div className="mt-6">
                    <Button
                      icon={<DownloadOutlined />}
                      type="link"
                      onClick={handleDownloadTemplate}
                    >
                      Download Template
                    </Button>
                  </div>

                  <div className="flex justify-end gap-4 mt-6">
                    <Button onClick={closeModal}>Cancel</Button>
                    <Button
                      type="primary"
                      onClick={handleBulkUpload}
                      loading={loading}
                      disabled={fileList.length === 0 || loading}
                      style={{ backgroundColor: "#1D4ED8", color: "white" }}
                    >
                      Upload
                    </Button>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </Modal> */}
      <Modal
        title="Add Caste"
        open={isCasteModalVisible}
        onOk={handleAddCaste}
        onCancel={closeCasteModal}
        okButtonProps={{
          style: { backgroundColor: "#1D4ED8", color: "white" },
        }}
      >
        <Form layout="vertical">
          <Form.Item
            name="newCasteName"
            label="Add New Caste"
            rules={[
              { required: true, message: "Sub-caste name is required" },
              {
                pattern: /^[A-Za-z\s]+$/,
                message: "Please enter a valid Sub-Caste Name",
              },
            ]}
          >
            <Input
              value={newCasteName}
              onChange={(e) => {
                setNewCasteName(e.target.value);
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <AddSubCasteModal
        isModalVisible={isModalVisible}
        closeModal={closeModal}
        selectedElectionId={selectedElectionId}
        setIsCasteModalVisible={setIsCasteModalVisible}
        editingKey={editingKey}
        handleSaveEdit={handleSaveEdit}
        handleAddSubCaste={handleAddSubCaste}
        loading={loading}
        setLoading={setLoading}
        form={form}
        religions={religions}
        castes={castes}
        selectedReligionId={selectedReligionId}
        setSelectedReligionId={setSelectedReligionId}
        fetchSubCastesDataAfterAdd={fetchSubCastesData}
      />

      {/* Import SubCastes Modal */}
      <ImportSubCastesModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchSubCastesData}
        selectedElectionId={selectedElectionId}
        cpanelSubCastes={cpanelSubCastes}
        religions={religions}
      />
    </div>
  );
};

export default SubCaste;
