import React, { useState, useEffect } from "react";
import {
  Table,
  Dropdown,
  Menu,
  Modal,
  Avatar,
  Image,
  Popconfirm,
  Input,
} from "antd";
import {
  EllipsisOutlined,
  EditOutlined,
  DeleteOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { SortOrder } from "antd/es/table/interface";
import { useSelector } from "react-redux";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";

const VotersTable = ({
  filteredVotersList,
  onDeleteVoter,
  onEditVoter,
  onVerifyVoter,
  onGenerateIdCard,
  currentPage,
  pageSize,
  totalElements,
  handleFamilyMapping,
  handleFriendsMapping,
  handleSchemesOpen,
  rowSelection,
  onPageChange,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

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

  // Function to clean names by removing hyphens and trimming
  const cleanName = (name) => {
    if (!name) return "";
    return name.replace(/-/g, "").trim();
  };

  // Function to combine first and last names
  const getFullName = (
    firstName,
    lastName,
    firstNameL1 = "",
    lastNameL1 = ""
  ) => {
    const cleanFirstName = cleanName(firstName);
    const cleanLastName = cleanName(lastName);
    const cleanFirstNameL1 = cleanName(firstNameL1);
    const cleanLastNameL1 = cleanName(lastNameL1);

    return [cleanFirstName, cleanLastName, cleanFirstNameL1, cleanLastNameL1]
      .filter(Boolean)
      .join(" ");
  };

  const showDeleteConfirm = (record: any) => {
    Modal.confirm({
      title: "Are you sure you want to delete this voter?",
      content: `Voter ID: ${record.epic_number}`,
      okText: "Yes, delete",
      okType: "danger",
      cancelText: "No",
      onOk: () => onDeleteVoter(record.epic_number),
    });
  };

  const handlePreview = (photo_url: string) => {
    if (photo_url) {
      setPreviewImage(photo_url);
      setPreviewVisible(true);
    }
  };

  const columns = [
    {
      title: "Index No",
      dataIndex: "sno",
      key: "sno",
    },
    {
      title: "Image",
      key: "image",
      render: (record: any) =>
        record.photo_url ? (
          <Image
            src={record.photo_url}
            alt="Voter Preview"
            style={{ width: "70px", height: "70px" }}
          />
        ) : (
          <div
            style={{
              width: "70px",
              height: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f0f0f0",
            }}
          >
            <UserOutlined style={{ fontSize: "36px", color: "#8c8c8c" }} />
          </div>
        ),
    },

    {
      title: "EPIC Number",
      dataIndex: "epicNumber",
      key: "epicNumber",
    },
    {
      title: "Name",
      key: "voterName",
      render: (record: any) =>
        getFullName(
          record.voterFnameEn,
          record.voterLnameEn,
          record.voterFnameL1,
          record.voterLnameL1
        ),
      width: 60,
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Relative Name",
      key: "relativeName",
      render: (record: any) =>
        getFullName(
          record.rlnFnameEn,
          record.rlnLnameEn,
          record.rlnFnameL1,
          record.rlnLnameL1
        ),
      width: 60,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Part Number",
      dataIndex: "partNumber",
      key: "partNumber",
      // sorter: (a: any, b: any) => (a.partNumber || 0) - (b.partNumber || 0),
      // sortDirections: ["ascend", "descend"] as SortOrder[],
      // defaultSortOrder: "ascend",
      render: (partNumber) =>
        typeof partNumber === "number" ? partNumber.toString() : "No data",
      width: 30,
    },
    {
      title: "Section No",
      dataIndex: "sectionNumber",
      key: "sectionNumber",
      render: (sectionNumber) => {
        // Check if section number is null/undefined, otherwise convert to string
        // This will show 0 as "0" instead of "No data"
        return sectionNumber !== null && sectionNumber !== undefined
          ? sectionNumber.toString()
          : "No data";
      },
      width: 30,
    },
    {
      title: "Serial No",
      dataIndex: "serialNo",
      key: "serialNumber",
      sortDirections: ["ascend", "descend"] as SortOrder[],
    },
    {
      title: "Pin Code",
      dataIndex: "pinCode",
      key: "pinCode",
    },
    {
      title: "Family Count",
      dataIndex: "familyCount",
      key: "family",
      render: (familyCount, record: any) => (
        <span
          style={{
            cursor: "pointer",
            color: "#1D4ED8",
          }}
          onClick={() => handleFamilyMapping(record)}
        >
          {familyCount}
        </span>
      ),
    },
    {
      title: "Friends Count",
      dataIndex: "friendCount",
      key: "friend",
      render: (friendCount, record: any) => (
        <span
          style={{
            cursor: "pointer",
            color: "#1D4ED8",
          }}
          onClick={() => handleFriendsMapping(record)}
        >
          {friendCount || 0}
        </span>
      ),
    },
    {
      title: "Scheme",
      dataIndex: "schemeCount",
      key: "schemeCount",
      render: (schemeCount, record: any) => (
        <span
          style={{
            cursor: "pointer",
            color: "#1D4ED8",
          }}
          onClick={() => handleSchemesOpen(record)}
        >
          {schemeCount || 0}
        </span>
      ),
    },
    {
      title: "Slip Count",
      dataIndex: "slipCount",
      key: "slipCount",
      render: (slipCount) => slipCount ?? 0,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: any) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                disabled={
                  isFrozen || (!isSuperAdminOrAdmin && !hasUpdatePermission("votersList"))
                }
                onClick={() => onEditVoter(record)}
              >
                <EditOutlined /> Edit
              </Menu.Item>
              <Menu.Item
                key="delete"
                disabled={
                  isFrozen || (!isSuperAdminOrAdmin && !hasDeletePermission("votersList"))
                }
                onClick={() => showDeleteConfirm(record)}
              >
                <DeleteOutlined /> Delete
              </Menu.Item>
              <Menu.Item
                key="verify"
                disabled={isFrozen}
                onClick={() => onVerifyVoter(record)}
              >
                <CheckCircleOutlined /> Verify
              </Menu.Item>
              <Menu.Item
                key="generateIdCard"
                onClick={() => onGenerateIdCard(record)}
              >
                <IdcardOutlined /> Generate ID Card
              </Menu.Item>
              {/* <Menu.Item
                key="family"
                //  onClick={() => onVerifyVoter(record)}
                onClick={() => {
                  let inputValue="";
                  Modal.confirm({
                    title: "Map Family Members",
                    content: (
                      <div>
                        <p>
                          Are you sure you want to map Family members using
                          House number? Type "yes" to confirm
                        </p>
                        <Input placeholder='Type "yes" to confirm' 
                        onChange={(e)=>{
                          inputValue=e.target.value;
                        }
                        
                        }
                        onPressEnter={()=>{
                          if(inputValue==="yes"){
                            //handleFamliyMapByHouse(record);
                          }
                        }}
                        />
                      </div>
                    ),
                    okText: "Yes",
                    cancelText: "No",
                    onOk: () => {},
                  });
                }}
              >
                <UsergroupAddOutlined /> Family Mapping by House Number
              </Menu.Item> */}
            </Menu>
          }
          trigger={["click"]}
        >
          <EllipsisOutlined style={{ cursor: "pointer" }} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={filteredVotersList}
        rowSelection={rowSelection}
        bordered
        rowClassName="table-header"
        style={{ backgroundColor: "#1D4ED85C" }}
        className="voters-list-table"
        pagination={{
          current: currentPage + 1,
          pageSize: pageSize,
          total: totalElements,
          onChange: onPageChange,
          position: ["bottomCenter"],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        scroll={{ x: "max-content" }}
      />
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={300}
        bodyStyle={{ padding: 0, display: "flex", justifyContent: "center" }}
      >
        <Image
          alt="Voter Preview"
          src={previewImage}
          className=" max-h-[70vh] w-auto h-auto rounded-lg shadow-lg"
        />
      </Modal>
    </>
  );
};

export default VotersTable;
