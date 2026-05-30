import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  EllipsisOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
  ImportOutlined,
  CloseOutlined,
  DownOutlined,
} from "@ant-design/icons";
import {
  Button,
  Modal,
  Menu,
  Form,
  Input,
  Table,
  Popconfirm,
  message,
  Upload,
  Dropdown,
  Col,
  Row,
  Checkbox,
  ColorPicker,
  Select,
} from "antd";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import {
  addParty,
  editParty,
  deleteParty,
  fetchParties,
  updatePartyOrder,
  getCpanelPartiesApi,
  setDefaultParty,
  getDefaultParty,
} from "../../api/partyApi";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile, UploadProps } from "antd/es/upload/interface";
import ImgCrop from "antd-img-crop";
import { useLoading } from "../../context/LoadingContext";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import ImportPartiesModal from "./ImportPartiesModal";

// Party type definition
interface Party {
  key: string;
  id: number;
  allianceName?: string;
  partyName: string;
  partyShortName: string;
  partyColor: string;
  partyImage: string; // Image URL or Base64 encoded image
}

const Party = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [partyName, setPartyName] = useState<string>("");
  const [partyColor, setPartyColor] = useState<string>("");
  const [parties, setParties] = useState<Party[]>([]);
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedParties, setSelectedParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<number | null>(null);
  const [defaultPartyId, setDefaultPartyId] = useState<number | null>(null);
  const [savingDefaultParty, setSavingDefaultParty] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();
  const inputRef = useRef(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState<RcFile | null>(null); // State for image
  const [imageFormat, setImageFormat] = useState<string | null>();
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
  const [cpanelParties, setCpanelParties] = useState<Party[]>([]);

  const navigate = useNavigate();

  const [imageDetails, setImageDetails] = useState<{
    width: number;
    height: number;
    size: number;
  } | null>(null);

  const location = useLocation();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const electionId = location.state?.electionId || selectedElectionId;
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasCreatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  // Fetch parties from cpanel
  const fetchCpanelParties = async () => {
    setLoadingPage(true);
    try {
      const response = await getCpanelPartiesApi();
      const partyData = response.data.map((party: any) => ({
        key: party.id.toString(),
        id: party.id,
        partyName: party.partyName,
        allianceName: party.allianceName,
        partyShortName: party.partyShortName,
        partyColor: party.partyColor,
        partyImage: party.partyImage,
        orderIndex: party.orderIndex,
      }));
      setCpanelParties(partyData);
      console.log("cpanelParties", partyData);
    } catch (error) {
      console.error("Error fetching cpanel parties:", error);
    } finally {
      setLoadingPage(false);
    }
  };

  // Show the modal
  const showModal = () => {
    setIsModalVisible(true);
    form.resetFields(); // Clear form values when opening the modal
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
    const isPNG = file.type === "image/png";
    const isJPEG = file.type === "image/jpeg";
    setImageFormat(isPNG ? "png" : isJPEG ? "jpeg" : "jpg"); // Set format dynamically
    setImage(file); // Save the file
    return false; // Prevent auto upload
  };

  // Handle adding a party
  const handleAdd = async () => {
    const allianceName = form.getFieldValue("allianceName");
    const partyName = form.getFieldValue("partyName");
    const partyShortName = form.getFieldValue("partyShortName");
    const partyColor = form.getFieldValue("partyColor");
    setLoading(true);

    if (partyName.trim() && partyShortName.trim() && image) {
      try {
        await addParty(
          parseInt(selectedElectionId),
          allianceName,
          partyName,
          partyShortName,
          partyColor,
          image
        ); // Add party with image
        fetchData(); // Refresh parties list
        setPartyName("");
        setPartyColor("");
        setSearchQuery("");
        setImage(null); // Reset image
        setIsModalVisible(false);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error adding party: ", error);
      }
    } else {
      message.error("Party name, short name and image are required.");
      setLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Party[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedParties(selectedRows);
    },
  };

  // Handle deleting a party
  const handleDelete = async (partyIds?: number[]) => {
    try {
      setTableLoading(true);
      console.log("partyIds", partyIds);
      await deleteParty(parseInt(selectedElectionId), partyIds);
      const successMessage = partyIds?.length
        ? `${partyIds.length} Party deleted successfully`
        : "All Parties deleted successfully";

      message.success(successMessage);
      await fetchData();
    } catch (error) {
      const errorMessage = partyIds?.length
        ? "Failed to delete selected Parties"
        : "Failed to delete all Parties";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedParties([]);
      setSelectedRowKeys([]);
      setTableLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all party data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all party
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
            I understand that by confirming, all party data will be permanently
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

  const handleEdit = (record: Party) => {
    setEditingKey(record.key);
    showModal();
  };

  const handleSaveEdit = () => {
    form
      .validateFields()
      .then(async (values) => {
        setLoading(true);
        if (editingKey) {
          const updatedImage = image ? image : imageUrl;

          try {
            await editParty(
              Number(editingKey),
              values.allianceName,
              values.partyName,
              values.partyShortName,
              values.partyColor,
              updatedImage,
              selectedElectionId
            ); // Edit party with image
            setParties(
              parties.map((party) =>
                party.key === editingKey
                  ? {
                      ...party,
                      allianceName: values.allianceName,
                      partyName: values.partyName,
                      partyShortName: values.partyShortName,
                      partyColor: values.partyColor,
                      partyImage:
                        updatedImage instanceof File
                          ? URL.createObjectURL(updatedImage)
                          : updatedImage,
                    }
                  : party
              )
            );
            await fetchData(); // Refresh parties list
            message.success("Party edited successfully");
            setSearchQuery("");
            setEditingKey(null);
            setIsModalVisible(false);
            setLoading(false);
          } catch (error) {
            console.error("Error editing party: ", error);
            setLoading(false);
          }
        }
      })
      .catch(() => {
        message.error("Please enter a valid party name.");
        setLoading(false);
      });
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = parties.filter((party) =>
      party.partyName?.toString().toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredParties(filteredData);
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
        disabled={
          isFrozen ||
          selectedParties.length === 0 ||
          loading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("party"))
        }
      >
        <Popconfirm
          title="Are you sure you want to delete the selected parties?"
          onConfirm={async () => {
            await handleDelete(selectedParties.map((party) => party.id));
          }}
          okText="Yes"
          cancelText="No"
        >
          {loading
            ? "Deleting..."
            : `Delete Selected (${selectedParties.length})`}
        </Popconfirm>
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("party"))}
        danger
      >
        Delete All Parties
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<Party> = [
    {
      title: "Alliance Name",
      dataIndex: "allianceName",
      key: "allianceName",
      render: (value: string) => <span>{value || "N/A"}</span>,
    },
    {
      title: "Party Name",
      dataIndex: "partyName",
      key: "name",
      sorter: (a, b) => a.partyName.localeCompare(b.partyName),
      //defaultSortOrder: "ascend",
    },
    {
      title: "Party Short Name",
      dataIndex: "partyShortName",
      key: "shortName",
    },
    {
      title: "Party Image",
      dataIndex: "partyImage",
      key: "image",
      render: (image: string) => (
        <img src={image} alt="Party" style={{ width: 100, height: 100 }} />
      ),
    },
    {
      title: "Party Color",
      dataIndex: "partyColor",
      key: "color",
      align: "center",
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
      title: "Default",
      key: "default",
      align: "center",
      render: (_, record) =>
        defaultPartyId === record.id ? (
          <span style={{ color: "#52c41a", fontWeight: "600" }}>✓ Default</span>
        ) : null,
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
                disabled: isFrozen || (!isSuperAdminOrAdmin && !hasUpdatePermission("party")),
                label: "Edit",
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled: isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("party")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this party?"
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

  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = async (result: any) => {
    setIsDragging(false);
    if (!result.destination) return;

    const reorderedItems = [...filteredParties];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setParties(reorderedItems); // Update state with the new order
    setFilteredParties(reorderedItems); // Update state with the new order

    const payload = reorderedItems.map((party, index) => ({
      partyId: party.id,
      newOrderIndex: index,
    }));

    try {
      await updatePartyOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  const fetchData = async () => {
    try {
      if (loadingPage) {
        setLoadingPage(true);
      }

      const response = await fetchParties(parseInt(selectedElectionId)); // Fetch parties
      console.log("Fetched Parties Response", response);
      const fetchedParties =
        response?.data
          ?.map((party: any) => ({
            key: party.id,
            orderIndex: party.orderIndex,
            id: party.id,
            allianceName: party.allianceName,
            partyName: party.partyName,
            partyShortName: party.partyShortName,
            partyColor: party.partyColor,
            partyImage: party.partyImage,
          }))
          .sort(
            (a: any, b: any) => Number(a.orderIndex) - Number(b.orderIndex)
          ) || [];
      console.log("Fetched Parties", fetchedParties);
      setParties(fetchedParties);
      setFilteredParties(fetchedParties);
    } catch (error) {
      console.error("Error fetching parties: ", error);
      setParties([]);
      setFilteredParties([]);
    } finally {
      setLoadingPage(false);
    }
  };

  // Fetch default party
  const fetchDefaultParty = async () => {
    if (!selectedElectionId) return;
    try {
      const response = await getDefaultParty(parseInt(selectedElectionId));
      if (response?.partyId) {
        setDefaultPartyId(response.partyId);
        setSelectedParty(response.partyId);
      }
    } catch (error) {
      console.error("Error fetching default party:", error);
    }
  };

  // Handle save default party
  const handleSaveDefaultParty = async () => {
    if (!selectedParty || !selectedElectionId) {
      message.warning("Please select a party first");
      return;
    }

    try {
      setSavingDefaultParty(true);
      await setDefaultParty(parseInt(selectedElectionId), selectedParty);
      setDefaultPartyId(selectedParty);
    } catch (error) {
      console.error("Error setting default party:", error);
    } finally {
      setSavingDefaultParty(false);
    }
  };

  useEffect(() => {
    if (selectedElectionId) {
      fetchData();
      fetchCpanelParties(); // Fetch cpanel parties when component mounts
      fetchDefaultParty(); // Fetch default party
    }
  }, [selectedElectionId]);

  useEffect(() => {
    if (isModalVisible && inputRef?.current) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 0);
    }

    if (isModalVisible && editingKey !== null) {
      const party = parties.find((r) => r.key === editingKey);
      if (party) {
        form.setFieldsValue({
          allianceName: party.allianceName,
          partyName: party.partyName,
          partyShortName: party.partyShortName,
          partyColor: party.partyColor,
        });
        setImageUrl(party.partyImage);
        setImage(null); // Reset image for editing
      }
    } else {
      setImageUrl("");
      setImage(null); //Reset in case of new party addition
    }
  }, [isModalVisible, editingKey, parties, form]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Party</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("party"))}
          >
            Import Parties
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={showModal}
            disabled={isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("party"))}
          >
            Add Party
          </Button>
        </div>
      </div>
      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Party: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Party"
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
        <Col>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              My Party
            </label>

            <div className="flex items-center gap-3">
              <Select
                placeholder="Select Default Party"
                allowClear
                className="input-element w-[200px] custom-select"
                value={selectedParty}
                onChange={(value) => {
                  setSelectedParty(value);
                }}
                options={parties.map((party) => ({
                  label:
                    party.id === defaultPartyId
                      ? `${party.partyName} (Current Default)`
                      : party.partyName,
                  value: party.id,
                }))}
              />

              <Button
                type="primary"
                disabled={!selectedParty || savingDefaultParty}
                loading={savingDefaultParty}
                onClick={handleSaveDefaultParty}
                className="h-[45px] bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold px-4 hover:!bg-[#1D4ED8] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
              >
                Set as Default
              </Button>
              <Dropdown overlay={actionsMenu} trigger={["click"]}>
                <Button
                  type="primary"
                  className="h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold hover:!bg-[#1D4ED8] hover:text-[#fff] hover:border-[#1D4ED8] hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
                >
                  Actions <DownOutlined />
                </Button>
              </Dropdown>
            </div>
          </div>
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
                loading={tableLoading}
                dataSource={filteredParties}
                style={{
                  backgroundColor: tableLoading ? "transparent" : "#1D4ED85C",
                }}
                rowSelection={rowSelection}
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
                rowKey="key"
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />, // Simple wrapper without ref
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredParties.findIndex(
                        (party) => party.key === key
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
                        >
                          {(provided, snapshot) => (
                            <tr
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...props.style,
                                ...provided.draggableProps.style,
                                cursor: "move", // Indicate that the row is draggable
                                display: "table-row",
                                position: isDragging ? "relative" : "static", // Fix layout issue
                                top: isDragging ? "" : undefined, // Prevents floating row
                                left: isDragging ? "" : undefined,
                                width: "100%",
                                background: snapshot.isDragging
                                  ? "#e0f7fa"
                                  : "inherit", // Highlight row when dragging
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
              {/* Important to maintain the layout consistency */}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>

      <Modal
        title={editingKey ? "Edit Party" : "Add Party"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingKey(null); // Reset editingKey
          form.resetFields();
        }}
        onOk={editingKey ? handleSaveEdit : handleAdd}
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
            label={editingKey ? "New Alliance Name" : "Alliance Name"}
            name="allianceName"
          >
            <Input
              placeholder="Enter alliance name"
              ref={inputRef}
              autoFocus={true}
            />
          </Form.Item>
          <Form.Item
            label={editingKey ? "New Party Name" : "Party Name"}
            name="partyName"
            rules={[{ required: true, message: "Please enter the party name" }]}
          >
            <Input
              placeholder="Enter party name"
              ref={inputRef}
              autoFocus={true}
            />
          </Form.Item>
          <Form.Item
            label={editingKey ? "New Party Short Name" : "Party Short Name"}
            name="partyShortName"
            rules={[
              { required: true, message: "Please enter the party short name" },
            ]}
          >
            <Input placeholder="Enter party short name" />
          </Form.Item>
          <Form.Item label="Party Color" name="partyColor">
            <ColorPicker
              showText
              onChange={(color) => {
                form.setFieldsValue({ partyColor: color.toHexString() });
              }}
            />
          </Form.Item>
          <Form.Item
            label="Party Image"
            name="partyImage"
            rules={[
              {
                required: !imageUrl && !image,
                message: "Please upload the party image",
              },
            ]}
          >
            <ImgCrop
              rotate
              aspect={1 / 1}
              quality={0.8}
              modalWidth={500}
              showReset
              fillColor="transparent"
              format={imageFormat}
              beforeCrop={validateImageBeforeCrop}
              okText="Confirm"
              cancelText="Cancel"
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop Party Image</span>
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
                listType="picture-card"
                accept="image/*"
                beforeUpload={handleImageUpload}
                className="avatar-uploader my-2"
                showUploadList={false}
              >
                {image ? (
                  <img
                    src={URL.createObjectURL(image)}
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
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
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
                ) : (
                  <div>
                    {uploading ? <UploadOutlined /> : <UserOutlined />}
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
          {!image ? (
            <p className="text-xs font-medium text-gray-400 -mt-3">
              Image size should not exceed 1 MB
            </p>
          ) : (
            <p></p>
          )}
        </Form>
      </Modal>

      {/* Import Parties Modal */}
      <ImportPartiesModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchData}
        selectedElectionId={selectedElectionId}
        cpanelParties={cpanelParties}
      />
    </div>
  );
};

export default Party;
