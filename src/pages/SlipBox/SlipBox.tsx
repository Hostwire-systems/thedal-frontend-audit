import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  SearchOutlined,
  ImportOutlined,
  DownOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Button,
  Modal,
  Table,
  Popconfirm,
  message,
  Dropdown,
  Menu,
  Col,
  Row,
  Checkbox,
  Input,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import ImportSlipBoxModal from "./ImportSlipBoxModal";
import {
  getSlipBoxApi,
  deleteSlipBoxApi,
  getCpanelSlipBoxApi,
} from "../../api/slipBoxApi";
import {
  fetchUserDetails,
  fetchProfileDetails,
} from "../../api/profileSettingsApi";

interface SlipBox {
  key: string;
  id: number;
  mobileNumber: string;
  slipBoxName: string;
  slipBoxId: string;
}

const SlipBox: React.FC = () => {
  const [slipBoxes, setSlipBoxes] = useState<SlipBox[]>([]);
  const [cpanelSlipBoxes, setCpanelSlipBoxes] = useState<SlipBox[]>([]);
  const [filteredSlipBoxes, setFilteredSlipBoxes] = useState<SlipBox[]>([]);
  const [userDetails, setUserDetails] = useState({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedSlipBoxes, setSelectedSlipBoxes] = useState<SlipBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();

  const userId = localStorage.getItem("userId");

  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  const fetchData = async () => {
    try {
      setLoadingPage(true);
      const response = await getSlipBoxApi();
      const fetchedSlipBoxes =
        response?.data?.map((slipBox: any) => ({
          key: slipBox.id.toString(),
          id: slipBox.id,
          mobileNumber: slipBox.mobileNumber,
          slipBoxName: slipBox.slipBoxName,
          slipBoxId: slipBox.slipBoxId,
        })) || [];
      console.log("Fetched Slip Boxes: ", fetchedSlipBoxes);
      setSlipBoxes(fetchedSlipBoxes);
      setFilteredSlipBoxes(fetchedSlipBoxes);
    } catch (error) {
      console.error("Error fetching slip boxes: ", error);
      setSlipBoxes([]);
      setFilteredSlipBoxes([]);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetchUserDetails();
      const data = response.data;

      const userInfo = {
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        email: data.email,
        profilePic: data?.profilePicture,
      };

      setUserDetails(userInfo);
      return userInfo.mobileNumber; // 👈 return it
    } catch (error) {
      console.error("Error fetching profile:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchCpanelData = async (mobileNumber: string | null) => {
    if (!mobileNumber) return;

    try {
      const response = await getCpanelSlipBoxApi();
      console.log("Cpanel apis fetched from api", response?.data);
      const fetchedSlipBoxes =
        response?.data
          ?.map((slipBox: any) => ({
            key: slipBox.id.toString(),
            id: slipBox.id,
            mobileNumber: slipBox.mobileNumber,
            slipBoxName: slipBox.slipBoxName,
            slipBoxId: slipBox.slipBoxId,
          }))
          .filter((slipbox: any) => slipbox.mobileNumber === mobileNumber) ||
        [];

      console.log("Filtered Cpanel Slip Boxes: ", fetchedSlipBoxes);
      setCpanelSlipBoxes(fetchedSlipBoxes);
    } catch (error) {
      console.error("Error fetching cpanel slip boxes: ", error);
      setCpanelSlipBoxes([]);
    }
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filteredData = slipBoxes.filter(
      (slipBox) =>
        slipBox.slipBoxName?.toLowerCase().includes(lowerCaseQuery) ||
        slipBox.slipBoxId?.toLowerCase().includes(lowerCaseQuery) ||
        slipBox.mobileNumber?.includes(query)
    );
    setFilteredSlipBoxes(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: SlipBox[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedSlipBoxes(selectedRows);
    },
  };

  const handleDelete = async (slipBoxIds?: number[]) => {
    try {
      await deleteSlipBoxApi(slipBoxIds);
      const successMessage = slipBoxIds?.length
        ? `${slipBoxIds.length} Slip Box deleted successfully`
        : "All Slip Boxes deleted successfully";

      setSelectedSlipBoxes([]);
      message.success(successMessage);
      await fetchData();
    } catch (error) {
      const errorMessage = slipBoxIds?.length
        ? "Failed to delete selected Slip Boxes"
        : "Failed to delete all Slip Boxes";
      console.error(errorMessage, error);
      message.error(errorMessage);
    } 
  };

  const showDeleteConfirmation = () => {
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all slip box data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all slip
            box data.
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
            I understand that by confirming, all slip box data will be
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
            title: "Delete Selected Slip Boxes",
            content: `Are you sure you want to delete ${selectedSlipBoxes.length} slip box(es)?`,
            okText: "Yes",
            cancelText: "No",
            onOk: async () => {
              await handleDelete(
                selectedSlipBoxes.map((slipBox) => slipBox.id)
              );
            },
          });
        }}
        disabled={
          selectedSlipBoxes.length === 0 ||
          loading ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("slipBox"))
        }
      >
        {loading
          ? "Deleting..."
          : `Delete Selected (${selectedSlipBoxes.length})`}
      </Menu.Item>

      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={!isSuperAdminOrAdmin && !hasDeletePermission("slipBox")}
        danger
      >
        Delete All Slip Boxes
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<SlipBox> = [
    {
      title: "S.No",
      key: "sno",
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: "Slip Box Name",
      dataIndex: "slipBoxName",
      key: "slipBoxName",
      sorter: (a, b) => a.slipBoxName.localeCompare(b.slipBoxName),
    },
    {
      title: "Slip Box ID",
      dataIndex: "slipBoxId",
      key: "slipBoxId",
    },
    {
      title: "Mobile Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to delete this slip box?"
          onConfirm={() => handleDelete([record.id])}
          okText="Yes"
          cancelText="No"
          disabled={!isSuperAdminOrAdmin && !hasDeletePermission("slipBox")}
          okButtonProps={{
            style: {
              backgroundColor: "#1D4ED8",
              borderColor: "white",
            },
          }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            disabled={!isSuperAdminOrAdmin && !hasDeletePermission("slipBox")}
          />
        </Popconfirm>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const loadUserAndCpanelData = async () => {
      const mobileNumber = await fetchUserProfile();
      console.log("Mobile number of user", mobileNumber);
      await fetchCpanelData(mobileNumber);
    };

    loadUserAndCpanelData();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Slip Box</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            icon={<ImportOutlined />}
            className="h-[46px] rounded text-[15px] font-semibold"
            onClick={() => setIsImportModalVisible(true)}
            disabled={!isSuperAdminOrAdmin}
          >
            Import Slip Boxes
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
              placeholder="Search by name, ID or mobile"
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
      <Table
        className="my-4 default-list-table"
        bordered
        pagination={{
          position: ["bottomCenter"],
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        rowSelection={rowSelection}
        dataSource={filteredSlipBoxes}
        style={{ backgroundColor: "#1D4ED85C" }}
        columns={columns}
        rowKey={"key"}
        loading={loadingPage}
      />

      <ImportSlipBoxModal
        cpanelSlipBoxes={cpanelSlipBoxes}
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
        onImportComplete={fetchData}
      />
    </div>
  );
};

export default SlipBox;
