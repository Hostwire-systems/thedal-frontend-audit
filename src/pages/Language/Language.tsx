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
  getLanguagesApi,
  addLanguageApi,
  updateLanguageApi,
  deleteLanguageApi,
  updateLanguageOrder,
  getCpanelLanguagesApi,
} from "../../api/languageApi";
import { StrictModeDroppable } from "../../components/StrictModeDroppable";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import ImportLanguagesModal from "./ImportLanguagesModal";

interface LanguageType {
  id: number;
  key: string;
  languageName: string;
}

const Language = () => {
  const [form] = useForm();
  const [languages, setLanguages] = useState<LanguageType[]>([]);
  const [cpanelLanguages, setCpanelLanguages] = useState<LanguageType[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<LanguageType[]>(
    []
  );
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<LanguageType[]>(
    []
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [options, setOptions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isImportModalVisible, setIsImportModalVisible] =
    useState<boolean>(false);
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
      fetchLanguages();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    fetchCpanelLanguages();
  }, []);

  const fetchCpanelLanguages = async () => {
    setLoading(true);
    try {
      const response = await getCpanelLanguagesApi();
      const languageData = response.data.map((lang: any) => ({
        key: lang.id.toString(),
        id: lang.id,
        languageName: lang.languageName,
      }));
      setCpanelLanguages(languageData);
      console.log("languageData", languageData);
    } catch (error) {
      //message.error('Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const response = await getLanguagesApi(parseInt(selectedElectionId));
      const languageData = response.data
        .map((lang: any) => ({
          key: lang.id.toString(),
          id: lang.id,
          languageName: lang.languageName,
          orderIndex: lang.orderIndex,
        }))
        .sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex));
      setLanguages(languageData);
      // Apply current search filter to new data
      const filtered = languageData.filter((lang) =>
        lang.languageName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLanguages(filtered);
    } catch (error) {
      //message.error('Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = languages.filter((lang) =>
      lang.languageName.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredLanguages(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleOptionsSearch = (value) => {
    if (!value) {
      setOptions([]);
      return;
    }
    // Filter languages based on the languageName property
    const filteredOptions = cpanelLanguages
      .filter((lang) =>
        lang.languageName.toLowerCase().includes(value.toLowerCase())
      )
      .map((lang) => ({ value: lang.languageName }));

    if (
      !cpanelLanguages.some(
        (lang) => lang.languageName.toLowerCase() === value.toLowerCase()
      )
    ) {
      filteredOptions.push({
        value,
        label: (
          <span>
            Create new language:{" "}
            <span style={{ color: "#1D4ED8" }}>{value}</span>
          </span>
        ),
      });
    }

    setOptions(filteredOptions);
  };

  const openModal = (record: LanguageType | null = null) => {
    if (isFrozen) return;
    if (record) {
      form.setFieldsValue({ languageName: record.languageName });
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

    const reorderedItems = [...filteredLanguages];
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
    setLanguages(reorderedItems); // Update state with the new order
    setFilteredLanguages(reorderedItems); // Update state with the new order
    const payload = reorderedItems.map((lan, index) => ({
      languageId: lan.id,
      newOrderIndex: index,
    }));

    try {
      await updateLanguageOrder(parseInt(selectedElectionId), payload);
    } catch (error) {
      console.log("Failed to update order", error);
    }
  };

  const handleSubmit = async (values: { languageName: string }) => {
    if (isFrozen) return;
    setIsButtonLoading(true);
    try {
      const payload = { languageName: values.languageName };

      if (editingId) {
        await updateLanguageApi(
          payload,
          parseInt(selectedElectionId),
          editingId
        );
        message.success("Language updated successfully");
      } else {
        await addLanguageApi(payload, parseInt(selectedElectionId));
        message.success("Language created successfully");
      }

      await fetchLanguages();
      setIsModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsButtonLoading(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: LanguageType[]) => {
      console.log("selectedRows", selectedRows);
      setSelectedRowKeys(selectedKeys);
      setSelectedLanguages(selectedRows);
    },
  };

  const handleDelete = async (languageIds?: number[]) => {
    if (isFrozen) return;
    try {
      console.log("languageIds", languageIds);
      await deleteLanguageApi(parseInt(selectedElectionId), languageIds);
      const successMessage = languageIds?.length
        ? `${languageIds.length} Language deleted successfully`
        : "All Languages deleted successfully";

      message.success(successMessage);
      await fetchLanguages();
    } catch (error) {
      const errorMessage = languageIds?.length
        ? "Failed to delete selected Languages"
        : "Failed to delete all Languages";
      console.error(errorMessage, error);
      // message.error(errorMessage);
      throw error;
    } finally {
      setSelectedLanguages([]);
      setSelectedRowKeys([]);
    }
  };

  const showDeleteConfirmation = () => {
    // Create a modal instance reference
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all language data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all
            language data.
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
            I understand that by confirming, all language data will be
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
            title: "Delete Selected Languages",
            content: `Are you sure you want to delete ${selectedLanguages.length} language(s)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(selectedLanguages.map((lan) => lan.id));
            },
          });
        }}
        disabled={
          selectedLanguages.length === 0 ||
          isLoading ||
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("language"))
        }
      >
        {isLoading
          ? "Deleting..."
          : `Delete Selected (${selectedLanguages.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={
          isFrozen ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("language"))
        }
        danger
      >
        Delete All Languages
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Language Name",
      dataIndex: "languageName",
      key: "languageName",
      sorter: (a: LanguageType, b: LanguageType) =>
        a.languageName.localeCompare(b.languageName),
      //defaultSortOrder: "ascend" as const,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: LanguageType) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasUpdatePermission("language")),
                label: "Edit",
                onClick: () => openModal(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen ||
                  (!isSuperAdminOrAdmin && !hasDeletePermission("language")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this language?"
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
        <h2 className="font-bold text-[31px] leading-8">Voter Languages</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={isFrozen}
          >
            Import Languages
          </Button>
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                    hover:!bg-[#1D4ED8] hover:text-[#fff]
                    hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={() => openModal()}
            disabled={
              isFrozen ||
              (!isSuperAdminOrAdmin && !hasCreatePermission("language"))
            }
          >
            Add Language
          </Button>
        </div>
      </div>

      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Language: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Languages"
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
          droppableId="droppableLanguages"
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
                dataSource={filteredLanguages}
                columns={columns}
                rowKey="key"
                loading={isLoading}
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
                components={{
                  body: {
                    wrapper: (props) => <tbody {...props} />,
                    row: (props) => {
                      const key = props["data-row-key"];
                      const index = filteredLanguages.findIndex(
                        (lang) => lang.key === key
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
        title={editingId ? "Edit Language" : "Add Language"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        onOk={() => form.submit()}
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
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Language Name"
            name="languageName"
            rules={[
              { required: true, message: "Please enter the language name" },
            ]}
          >
            <AutoComplete
              options={options}
              onSearch={handleOptionsSearch}
              placeholder="Enter Language name"
              filterOption={false} // Prevents default filtering, allowing us to control the behavior
            >
              <Input placeholder="Enter Language name" />
            </AutoComplete>
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Languages Modal */}
      <ImportLanguagesModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchLanguages}
        selectedElectionId={selectedElectionId}
        cpanelLanguages={cpanelLanguages}
      />
    </div>
  );
};

export default Language;
