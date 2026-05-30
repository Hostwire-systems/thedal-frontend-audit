import React, { useMemo } from "react";
import { Table, Button, Switch } from "antd";
import "./VotersTable.css";
import { useSelector } from "react-redux";

const VotersTable = ({
  votersList,
  onViewVoter,
  onVote,
  currentPage,
  pageSize,
  totalElements,
  onPageChange,
}) => {
  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasUpdatePermission = (module: string) =>
    isSuperAdminOrAdmin || rolesPermission?.[module]?.includes("U");

  const cleanName = useMemo(
    () => (name) => {
      if (!name) return "";
      return name.replace(/-/g, "").trim();
    },
    []
  );

  const getFullName = (
    firstName: string,
    lastName: string = "",
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

  const formatContactValue = useMemo(
    () => (value) => {
      if (!value || String(value).trim() === "") {
        return "No data";
      }

      return value;
    },
    []
  );

  const columns = useMemo(
    () => [
      {
        title: "Index No",
        dataIndex: "sno",
        key: "sno",
        fixed: "left",
        width: 80,
      },
      {
        title: "EPIC Number",
        dataIndex: "epicNumber",
        key: "epicNumber",
        fixed: "left",
        width: 140,
      },
      {
        title: "Mobile / WhatsApp",
        key: "contactNumbers",
        width: 170,
        render: (_, record) => (
          <div className="flex flex-col leading-5">
            <span>{formatContactValue(record.mobileNo)}</span>
            <span>{formatContactValue(record.whatsappNo)}</span>
          </div>
        ),
      },
      {
        title: "Voter Name",
        key: "voterName",
        width: 180,
        render: (record) =>
          getFullName(
            record.voterFnameEn,
            record.voterLnameEn,
            record.voterFnameL1,
            record.voterLnameL1
          ),
      },
      {
        title: "Age",
        dataIndex: "age",
        key: "age",
        width: 80,
      },
      {
        title: "Relative Name",
        key: "relativeName",
        width: 180,
        render: (record) =>
          getFullName(
            record.rlnFnameEn,
            record.rlnLnameEn,
            record.rlnFnameL1,
            record.rlnLnameL1
          ),
      },
      {
        title: "Gender",
        dataIndex: "gender",
        key: "gender",
        width: 100,
        render:(gender:string)=>(gender.slice(0,1).toUpperCase() + gender.slice(1))
      },
      {
        title: "Part Number",
        dataIndex: "partNumber",
        key: "partNumber",
        width: 110,
        render: (partNumber) => {
          return partNumber !== null && partNumber !== undefined
            ? partNumber.toString()
            : "No data";
        },
      },
      {
        title: "Section No",
        dataIndex: "sectionNumber",
        key: "sectionNumber",
        width: 110,
        render: (sectionNumber) => {
          return sectionNumber !== null && sectionNumber !== undefined
            ? sectionNumber.toString()
            : "No data";
        },
      },
      {
        title: "Serial No",
        dataIndex: "serialNo",
        key: "serialNumber",
        width: 100,
        sorter: {
          compare: (a, b) => {
            const aVal = a.serialNo !== null && a.serialNo !== undefined ? Number(a.serialNo) : -1;
            const bVal = b.serialNo !== null && b.serialNo !== undefined ? Number(b.serialNo) : -1;
            return aVal - bVal;
          },
          multiple: 1,
        },
        sortDirections: ["ascend", "descend"],
      },
      {
        title: "Pin Code",
        dataIndex: "pinCode",
        key: "pinCode",
        width: 110,
      },
      // {
      //   title: "Vote",
      //   key: "vote",
      //   fixed: "right",
      //   width: 80,
      //   render: (_, record) => (
      //     <Switch
      //       checked={record.hasVoted}
      //       disabled={!hasUpdatePermission("vote")}
      //       onChange={() => onVote(record.epicNumber, record.hasVoted)}
      //       style={{
      //         backgroundColor: record.hasVoted ? "green" : undefined,
      //       }}
      //     />
      //   ),
      // },
      {
        title: "View",
        key: "view",
        fixed: "right",
        width: 80,
        render: (_, record) => (
          <Button onClick={() => onViewVoter(record)} className="view-button">
            View
          </Button>
        ),
      },
    ],
    [formatContactValue, getFullName, onViewVoter, onVote]
  );

  const paginationConfig = useMemo(
    () => ({
      current: currentPage + 1,
      pageSize,
      total: totalElements,
      onChange: onPageChange,
      position: ["bottomCenter"],
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      className: "voters-pagination",
    }),
    [currentPage, pageSize, totalElements, onPageChange]
  );

  return (
    <div className="table-container">
      <Table
        rowKey={(record) => record.epicNumber}
        columns={columns}
        dataSource={votersList}
        bordered
        rowClassName={(record) =>
          record.hasVoted ? "row-voted" : "row-not-voted"
        }
        className="voters-list-table"
        pagination={paginationConfig}
        scroll={{
          x: "100%",
          // y: "calc(100vh - 350px)",
        }}
      />
    </div>
  );
};

export default React.memo(VotersTable);
