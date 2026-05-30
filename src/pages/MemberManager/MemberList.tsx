import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { indianStates as stateOptions } from "../../pages/welcome/step3/Step3";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  SearchOutlined,
  DownOutlined,
  EditOutlined,
  DeleteOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import {
  Button,
  Table,
  Popconfirm,
  message,
  Dropdown,
  Menu,
  Col,
  Row,
  Input,
  Modal,
  Form,
  Checkbox,
  Collapse,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { useLoading } from "../../context/LoadingContext";
import { getMembersApi, deleteMember, updateMemberApi } from "../../api/memberApi";
import { Member } from "../../types/member";
import StateAndDistrictPanel from "../../components/addVoterAPI/StateAndDistrictPanel";
import MemberInfoPanel from "../../pages/CreateMemberManager/MemberInfoPanel";
import PCACInfoPanel from "../../components/editVoterForm/panels/PCACInfoPanel";
import UrbanLocalBodyInfoPanel from "../../components/editVoterForm/panels/UrbanLocalBodyInfoPanel";
import RuralLocalBodyInfoPanel from "../../components/editVoterForm/panels/RuralLocalBodyInfoPanel";

const MemberList: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const { isLoading: loadingPage, setLoading: setLoadingPage } = useLoading();
  const [form] = Form.useForm();
  const { Panel } = Collapse;
  
  dayjs.extend(utc);
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
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

  const fetchMembersData = async () => {
    try {
      setLoadingPage(true);
      const response = await getMembersApi(parseInt(selectedElectionId));
      console.log("response", response);
      const fetchedMembers =
        response?.data?.map((member: any, index: number) => ({
          key: member.id.toString(),
          id: member.id,
          sNo: index + 1,
          memberName: member.memberName,
          age: member.age,
          gender: member.gender,
          dateOfBirth: member.dateOfBirth,
          occupation: member.occupation,
          education: member.education,
          fullAddress: member.fullAddress,
          mobileNumber: member.mobileNumber,
          memberSinceYear: member.memberSinceYear,
          membershipNo: member.membershipNo,
          relationName: member.relationName,
          relationType: member.relationType,
          epicNumber: member.epicNumber,

          // State
          stateNameEn: member.stateNameEn,
          stateNameL1: member.stateNameL1,
          stateNameL2: member.stateNameL2,

          // District
          districtCode: member.districtCode,
          districtNameEn: member.districtNameEn,
          districtNameL1: member.districtNameL1,
          districtNameL2: member.districtNameL2,

          // PC
          pcNo: member.pcNo,
          pcNameEn: member.pcNameEn,
          pcNameL1: member.pcNameL1,
          pcNameL2: member.pcNameL2,

          // AC
          acNo: member.acNo,
          acNameEn: member.acNameEn,
          acNameL1: member.acNameL1,
          acNameL2: member.acNameL2,

          // Urban
          urbanNo: member.urbanNo,
          urbanNameEn: member.urbanNameEn,
          urbanNameL1: member.urbanNameL1,
          urbanWardNo: member.urbanWardNo,

          // Rural District Union
          rurDistrictUnionNo: member.rurDistrictUnionNo,
          rurDistrictUnionNameEn: member.rurDistrictUnionNameEn,
          rurDistrictUnionNameL1: member.rurDistrictUnionNameL1,
          rurDistrictUnionNameL2: member.rurDistrictUnionNameL2,
          rurDistrictUnionWardNo: member.rurDistrictUnionWardNo,

          // Panchayat
          panUnionNo: member.panUnionNo,
          panUnionNameEn: member.panUnionNameEn,
          panUnionNameL1: member.panUnionNameL1,
          panUnionNameL2: member.panUnionNameL2,
          panUnionWardNo: member.panUnionWardNo,

          // Village
          villPanNo: member.villPanNo,
          villPanNameEn: member.villPanNameEn,
          villPanNameL1: member.villPanNameL1,
          villPanWardNo: member.villPanWardNo,
        })) || [];

      setMembers(fetchedMembers);
      setFilteredMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching members: ", error);
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setLoadingPage(false);
    }
  };

  const handleSearch = (query: string): void => {
    const lowerCaseQuery = query.toLowerCase();
    const filteredData = members.filter(
      (member) =>
        member.memberName?.toLowerCase().includes(lowerCaseQuery) ||
        member.relationName?.toLowerCase().includes(lowerCaseQuery) ||
        member.mobileNumber?.includes(query) ||
        // Add EPIC number to search criteria
        member.epicNumber?.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredMembers(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleDelete = async (memberIds?: number[]) => {
    try {
      await deleteMember(parseInt(selectedElectionId), memberIds);
      const successMessage = memberIds?.length
        ? `${memberIds.length} Member(s) deleted successfully`
        : "All Members deleted successfully";

      message.success(successMessage);
      await fetchMembersData();
    } catch (error) {
      const errorMessage = memberIds?.length
        ? "Failed to delete selected Members"
        : "Failed to delete all Members";
      console.error(errorMessage, error);
      message.error(errorMessage);
      throw error;
    } finally {
      setSelectedMembers([]);
    }
  };

  const showDeleteConfirmation = () => {
    let modal: any;

    modal = Modal.confirm({
      title: "Are you sure you want to delete all member data?",
      content: (
        <div>
          <p>
            This action cannot be undone and will permanently delete all member
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
            I understand that by confirming, all member data will be permanently
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

  const handleEdit = (record: Member) => {
    console.log("record", record);
    setEditingKey(record.key);
    form.setFieldsValue({
      id: record.key,
      memberName: record.memberName,
      relationName: record.relationName,
      relationType: record.relationType,
      gender: record.gender,
      epicNumber: record.epicNumber,
      dateOfBirth: record.dateOfBirth
        ? dayjs.utc(record.dateOfBirth).local().startOf("day")
        : null,
      age: record.age,
      occupation: record.occupation,
      education: record.education,
      fullAddress: record.fullAddress,
      mobileNumber: record.mobileNumber,
      memberSinceYear: record.memberSinceYear,
      membershipNo: record.membershipNo,
      // State
      state: record.stateNameEn, // Mapped from stateNameEn to state
      stateNameL1: record.stateNameL1,
      stateNameL2: record.stateNameL2,

      // District
      districtCode: record.districtCode,
      districtNameEn: record.districtNameEn,
      districtNameL1: record.districtNameL1,
      districtNameL2: record.districtNameL2,

      // PC
      pcNo: record.pcNo,
      pcNameEn: record.pcNameEn,
      pcNameL1: record.pcNameL1,
      pcNameL2: record.pcNameL2,

      // AC
      acNo: record.acNo,
      acNameEn: record.acNameEn,
      acNameL1: record.acNameL1,
      acNameL2: record.acNameL2,

      // Urban
      urbanNo: record.urbanNo,
      urbanNameEn: record.urbanNameEn,
      urbanNameL1: record.urbanNameL1,
      urbanWardNo: record.urbanWardNo,

      // Rural District Union
      rurDistrictUnionNo: record.rurDistrictUnionNo,
      rurDistrictUnionNameEn: record.rurDistrictUnionNameEn,
      rurDistrictUnionNameL1: record.rurDistrictUnionNameL1,
      rurDistrictUnionNameL2: record.rurDistrictUnionNameL2,
      rurDistrictUnionWardNo: record.rurDistrictUnionWardNo,

      // Panchayat
      panUnionNo: record.panUnionNo,
      panUnionNameEn: record.panUnionNameEn,
      panUnionNameL1: record.panUnionNameL1,
      panUnionNameL2: record.panUnionNameL2,
      panUnionWardNo: record.panUnionWardNo,

      // Village
      villPanNo: record.villPanNo,
      villPanNameEn: record.villPanNameEn,
      villPanNameL1: record.villPanNameL1,
      villPanWardNo: record.villPanWardNo,
    });
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();
      // Create the data object with the correct field mapping
      const formData = {...values, id: editingKey};
      
      const data = {
        ...formData,
        epicNumber: formData.epicNumber,
      };
      
      console.log("data to be sent to API", data);
      const response = await updateMemberApi(selectedElectionId, data);
      message.success("Member updated successfully");
      setIsEditModalVisible(false);
      setEditingKey(null);
      fetchMembersData();
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[], selectedRows: Member[]) => {
      setSelectedRowKeys(selectedKeys);
      setSelectedMembers(selectedRows);
    },
  };

  const actionsMenu = (
    <Menu>
      <Menu.Item
        key="delete-selected"
        icon={<DeleteOutlined />}
        onClick={async () => {
          await handleDelete(selectedMembers.map((member) => member.id));
        }}
        disabled={
          isFrozen ||
          selectedMembers.length === 0 ||
          (!isSuperAdminOrAdmin && !hasDeletePermission("member"))
        }
      >
        Delete Selected ({selectedMembers.length})
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={showDeleteConfirmation}
        disabled={isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("member"))}
        danger
      >
        Delete All Members
      </Menu.Item>
    </Menu>
  );

  const columns: ColumnsType<Member> = [
    {
      title: "S.No",
      dataIndex: "sNo",
      key: "sNo",
      width: 80,
    },
    {
      title: "Member Name",
      dataIndex: "memberName",
      key: "memberName",
    },
    {
      title: "EPIC Number",
      dataIndex: "epicNumber",
      key: "epicNumber",
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
      width: 100,
    },
    {
      title: "Member Since Year",
      dataIndex: "memberSinceYear",
      key: "memberSinceYear",
      width: 150,
    },
    {
      title: "Relation Name",
      dataIndex: "relationName",
      key: "relationName",
    },
    {
      title: "Relation Type",
      dataIndex: "relationType",
      key: "relationType",
    },
    {
      title: "Mobile Number",
      dataIndex: "mobileNumber",
      key: "mobileNumber",
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                icon: <EditOutlined />,
                disabled:
                  isFrozen || (!isSuperAdminOrAdmin && !hasUpdatePermission("member")),
                label: "Edit",
                onClick: () => handleEdit(record),
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                disabled:
                  isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("member")),
                label: (
                  <Popconfirm
                    title="Are you sure you want to delete this member?"
                    onConfirm={() => handleDelete([record.id])}
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
    if (selectedElectionId) {
      fetchMembersData();
    }
  }, [selectedElectionId]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Member Manager</h2>
        <div style={{ display: "flex", gap: "10px" }}>
        
          <Button
            type="primary"
            className="text-white px-10 h-[46px] rounded bg-[#1D4ED8] border-[#1D4ED8] text-[15px] font-semibold
                hover:!bg-[#1D4ED8] hover:text-[#fff]
                hover:!shadow-[0px_8px_16px_rgba(29,78,216,0.50)]"
            onClick={() => navigate("/add-member")}
            disabled={isFrozen || (!isSuperAdminOrAdmin && !hasCreatePermission("member"))}
          >
            Add Member
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
              placeholder="Search Member"
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
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        rowSelection={rowSelection}
        dataSource={filteredMembers}
        columns={columns}
        rowKey={"key"}
        loading={loadingPage}
      />

      {/* Edit Member Modal */}
      <Modal
        title="Edit Member"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingKey(null);
          form.resetFields();
        }}
        onOk={handleSaveEdit}
        okText="Update"
        okButtonProps={{
          style: {
            backgroundColor: "#1677ff",
            borderColor: "#1677ff",
            color: "#fff",
          },
        }}
        width={1200}
        style={{ top: 20 }}
        forceRender
      >
        <Form form={form} layout="vertical">
          <div className="border-gray-300">
            <Collapse
              bordered={false}
              expandIconPosition="end"
              className="bg-transparent custom-collapse"
              defaultActiveKey={["1", "2", "3", "4", "5", "6"]}
            >
              <Panel
                key="1"
                header={
                  <div className="flex items-center justify-between">
                    <div className="relative flex items-center w-full">
                      <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                        Member Information
                      </span>
                    </div>
                  </div>
                }
                className="bg-white rounded-lg"
              >
                <MemberInfoPanel type={"edit"} form={form} />
              </Panel>
              <Panel
                key="2"
                header={
                  <div className="flex items-center justify-between">
                    <div className="relative flex items-center w-full">
                      <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                        State & District Information
                      </span>
                    </div>
                  </div>
                }
                className="bg-white rounded-lg "
              >
                <StateAndDistrictPanel
                  type={"edit-member"}
                  stateOptions={stateOptions}
                />
              </Panel>
              <Panel
                key="3"
                header={
                  <div className="flex items-center justify-between">
                    <div className="relative flex items-center w-full">
                      <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                        PC & AC Information
                      </span>
                    </div>
                  </div>
                }
                className="bg-white rounded-lg "
              >
                <PCACInfoPanel type="edit" />
              </Panel>
              <Panel
                key="5"
                header={
                  <div className="flex items-center justify-between">
                    <div className="relative flex items-center w-full">
                      <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                        Urban Local Body Information
                      </span>
                    </div>
                  </div>
                }
                className="bg-white rounded-lg "
              >
                {" "}
                <UrbanLocalBodyInfoPanel type="edit" />
              </Panel>
              <Panel
                key="6"
                header={
                  <div className="flex items-center justify-between">
                    <div className="relative flex items-center w-full">
                      <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                        Rural Local Body Information
                      </span>
                    </div>
                  </div>
                }
                className="bg-white rounded-lg "
              >
                <RuralLocalBodyInfoPanel />
              </Panel>
            </Collapse>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberList;