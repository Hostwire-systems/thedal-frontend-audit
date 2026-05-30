// familyColumns.tsx
import { Avatar, Button, Image } from "antd";
import {
  UserOutlined,
  EyeOutlined,
  TeamOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { FamilyMemberDetail } from "../../types/family"; // adjust import as per your project

// Base columns without "Action"
const formatName = (
  firstName: string = "",
  lastName: string = "",
  firstNameL1: string = "",
  lastNameL1: string = ""
) => {
  const clean = (name: string) => (name ? name.replace(/-/g, "").trim() : "");
  return [
    clean(firstName),
    clean(lastName),
    clean(firstNameL1),
    clean(lastNameL1),
  ]
    .filter(Boolean)
    .join(" ");
};
const baseFamilyColumns = (currentPage: number, pageSize: number) => [
  {
    title: "Family No.",
    key: "familyNo",
    dataIndex: "familySequenceNumber",
    render: (value: number | undefined, _: any, index: number) =>
      value ?? currentPage * pageSize + index + 1,
    width: 90,
  },
  {
    title: "Image",
    key: "image",
    dataIndex: "photo_url",
    render: (url: any, record: FamilyMemberDetail) => {
      let imageUrl = url;
      if (typeof url === 'object' && url?.image) {
        imageUrl = url.image;
      } else if (typeof url === 'object' && url?.name) {
        imageUrl = null;
      }
      return (
        <div
          style={{
            width: 70,
            height: 70,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Voter Preview"
              style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: 4 }}
              preview={false}
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
                borderRadius: 4,
              }}
            >
              <UserOutlined style={{ fontSize: "36px", color: "#8c8c8c" }} />
            </div>
          )}
        </div>
      );
    },
    width: 90,
  },
  {
    title: "EPIC Number",
    dataIndex: "epic_number",
    key: "epic_number",
    sorter: true,
    render: (value: any) => {
      if (!value) return "N/A";
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value.name) return value.name;
      return "N/A";
    },
    width: 110,
  },
  {
    title: "Name",
    key: "voterFnameEn",
    sorter: true,
    render: (record: FamilyMemberDetail) => (
      <span style={{ display: "inline-block", maxWidth: 160 }}>
        {formatName(
          record.voterFnameEn,
          record.voterLnameEn || "",
          record.voterFnameL1,
          record.voterLnameL1 || ""
        )}
      </span>
    ),
    ellipsis: true,
    width: 140,
  },
  {
    title: "Age",
    key: "age",
    sorter: true,
    render: (record: FamilyMemberDetail) => record.age || "N/A",
    width: 90,
  },
  {
    title: "Relative Name",
    key: "relativeName",
    render: (record: FamilyMemberDetail) => (
      <span style={{ display: "inline-block", maxWidth: 160 }}>
        {formatName(
          record.rlnFnameEn,
          record.rlnLnameEn || "",
          record.rlnFnameL1,
          record.rlnLnameL1 || ""
        )}
      </span>
    ),
    ellipsis: true,
    width: 140,
  },
  {
    title: "Relationship",
    dataIndex: "rlnType",
    key: "rlnType",
    render: (value: any) => {
      if (!value) return "N/A";
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value.name) return value.name;
      return "N/A";
    },
    width: 120,
  },
  {
    title: "Gender",
    key: "gender",
    render: (record: FamilyMemberDetail) => {
      if (!record.gender) return "N/A";
      return (
        record.gender.charAt(0).toUpperCase() +
        record.gender.slice(1).toLowerCase()
      );
    },
    width: 90,
  },
  {
    title: "Part No.",
    dataIndex: "partNo",
    key: "partNo",
    sorter: true,
    render: (value: any) => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value.name) return value.name;
      return "N/A";
    },
    width: 90,
  },
  {
    title: "Serial No.",
    dataIndex: "serialNo",
    key: "serialNo",
    sorter: true,
    render: (value: any) => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value.name) return value.name;
      return "N/A";
    },
    width: 90,
  },

  {
    title: "Mobile",
    dataIndex: "mobileNo",
    key: "mobileNo",
    render: (mobile: any) => {
      if (!mobile) return "N/A";
      if (typeof mobile === 'string' || typeof mobile === 'number') return mobile;
      if (typeof mobile === 'object' && mobile.name) return mobile.name;
      return "N/A";
    },
    width: 100,
  },
  // {
  //   title: "Verification Status",
  //   key: "verification",
  //   render: (record: FamilyMemberDetail) => (
  //     <div>
  //       <div>Voter: {record.memberVerified ? "✓" : "✗"}</div>
  //       <div>Aadhaar: {record.aadhaarVerified ? "✓" : "✗"}</div>
  //     </div>
  //   ),
  //   width: 110,
  // },
  {
      title: "Voting History",
      dataIndex:  "voterHistories",
      key: "voterHistories",
      render: (value: any) => {
        // voterHistories may be a string, an object, or an array of items
        if (!value) return "N/A";
        if (typeof value === "string") return value;
        if (Array.isArray(value)) {
          const names = value
            .map((v: any) => (v && typeof v === "object" ? v.voterHistoryName || "" : String(v)))
            .filter(Boolean);
          return names.length > 0 ? names.join(", ") : "N/A";
        }
        if (typeof value === "object" && value.voterHistoryName) return value.voterHistoryName;
        return "N/A";
      },
      width: 125,
    },
];

// Columns with "Action"
export const familyColumns = (
  currentPage: number,
  pageSize: number,
  showAvailabilityModal: (record: FamilyMemberDetail) => void,
  showFamilyMembers?: (record: FamilyMemberDetail) => void,
  editFamily?: (record: FamilyMemberDetail) => void
) => [
  ...baseFamilyColumns(currentPage, pageSize),
  {
    title: "Action",
    key: "action",
    render: (record: FamilyMemberDetail) => (
      <div className="flex gap-2">
        <Button
          type="primary"
          icon={<EyeOutlined style={{ color: "white" }} />}
          shape="circle"
          onClick={() => showAvailabilityModal(record)}
          disabled={!record}
        />
        <Button
          type="default"
          icon={<TeamOutlined />}
          shape="circle"
          onClick={() => showFamilyMembers?.(record)}
          disabled={!record}
        />
        <Button
          type="dashed"
          icon={<EditOutlined />}
          shape="circle"
          onClick={() => editFamily?.(record)}
          disabled={!record}
        />
      </div>
    ),
    width: 150,
  },
];

// Columns without "Action" (for modal table)
export const familyModalColumns = (currentPage: number, pageSize: number) =>
  baseFamilyColumns(currentPage, pageSize);
