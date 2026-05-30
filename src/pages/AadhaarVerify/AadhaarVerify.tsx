import React, { useState, useEffect } from "react";
import {
  Table,
  Popconfirm,
  message,
  Input,
  Button,
  Image,
  Row,
  Col,
} from "antd";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { deleteAadhaar, getAadhaarDetails } from "../../api/aadhaarApi";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { useLoading } from "../../context/LoadingContext";

interface AadhaarData {
  dob: string;
  name: string;
  gender: string;
  email: string;
  ref_id: string;
  address: string;
  photo_link: string;
  split_address: {
    house: string;
    street: string;
    landmark: string;
    locality: string;
    po: string;
    vtc: string;
    status: string;
    subdist: string;
    dist: string;
    state: string;
    country: string;
    pincode: string;
  };
}

interface AadhaarRecord {
  id: number;
  accountId: number;
  electionId: number;
  aadhaarData: AadhaarData;
  aadhaarVerified: boolean;
}

const AadhaarVerify: React.FC = () => {
  const [aadhaarData, setAadhaarData] = useState<AadhaarRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AadhaarRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { setLoading } = useLoading();

   const userRole = localStorage.getItem("role");
    const rolesPermission = useSelector(
       (state: any) => state.auth.user?.rolePermission || {}
     );
   const isSuperAdminOrAdmin =
     userRole === "ADMIN" || userRole === "SUPER_ADMIN";

   const hasDeletePermission = (module: string) =>
     rolesPermission?.[module]?.includes("D");


  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const fetchAadhaarData = async () => {
    try {
      setLoading(true);
      const response = await getAadhaarDetails(parseInt(selectedElectionId));
      let aadhaarData = response?.data || [];
      let finalData = aadhaarData.map((item, index: number) => ({
        ...item,
        key: index,
      }));
      console.log("Fetched aadhaar data", finalData);
      setAadhaarData(finalData);
      setFilteredData(finalData);
    } catch (error) {
      console.error("Error fetching verified aadhaar details", error);
      setAadhaarData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string): void => {
    const lowerCaseQuery = value.toLowerCase();
    console.log(lowerCaseQuery);

    const filteredData = aadhaarData.filter(
      (record) =>
        record.aadhaarData.name.toLowerCase().includes(value.toLowerCase()) ||
        record.aadhaarData.ref_id.includes(value) ||
        record.aadhaarData.address.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredData(filteredData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAadhaar(parseInt(selectedElectionId), id);
      const newData = aadhaarData.filter((item) => item.id !== id);
      setAadhaarData(newData);
      setFilteredData(newData);
      message.success("Aadhaar record deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const formatAddress = (record: AadhaarRecord) => {
    const addr = record.aadhaarData?.split_address;

    if (!addr || typeof addr !== "object") return "No Address";

    const parts = [
      addr.house,
      addr.street,
      addr.locality,
      addr.vtc,
      addr.dist,
      addr.state,
      addr.pincode,
    ].filter(Boolean); 

    // Grouping two words per line
    const grouped: string[] = [];
    for (let i = 0; i < parts.length; i += 2) {
      const pair = parts[i + 1] ? `${parts[i]}, ${parts[i + 1]}` : parts[i];
      grouped.push(pair);
    }

    return grouped.join("\n"); // breaks line after every two address parts
  };

  const base64ToBlobUrl = (base64String: string): string => {
    const byteString = atob(base64String); // decode base64
    const mimeString = "image/jpeg";

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type: mimeString });
    return URL.createObjectURL(blob); // returns a Blob URL
  };

  const columns: ColumnsType<AadhaarRecord> = [
    {
      title: "Photo",
      dataIndex: ["aadhaarData", "photo_link"],
      key: "photo",
      width: 100,
      render: (photo) => {
        if (!photo) {
          return (
            <div
              style={{
                width: 80,
                height: 80,
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              No Photo
            </div>
          );
        }

        const imageUrl = base64ToBlobUrl(photo);

        return (
          <Image
            src={imageUrl}
            width={80}
            height={80}
            loading="lazy"
            style={{ objectFit: "cover", borderRadius: "4px" }}
            alt="Aadhaar photo"
          />
        );
      },
    },
    {
      title: "Name",
      dataIndex: ["aadhaarData", "name"],
      key: "name",
      sorter: (a, b) => a.aadhaarData.name.localeCompare(b.aadhaarData.name),
    },
    {
      title: "Address",
      key: "address",
      ellipsis: true,
      render: (_, record) => (
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {formatAddress(record)}
        </div>
      ),
      width: 160,
    },
    {
      title: "Gender",
      dataIndex: ["aadhaarData", "gender"],
      key: "gender",
      render: (gender) =>
        gender === "M" ? "Male" : gender === "F" ? "Female" : "Other",
      width: 100,
    },
    {
      title: "Aadhaar No",
      dataIndex: ["aadhaarData", "aadhaarNumber"],
      key: "aadhaar_no",
      width: 150,
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to delete this record?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            disabled={!isSuperAdminOrAdmin && !hasDeletePermission("aadhaar-verified")}
            danger
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      ),
    },
  ];

  useEffect(() => {
    if (selectedElectionId) {
      fetchAadhaarData();
    }
  }, [selectedElectionId]);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 className="font-bold text-[31px] leading-8">Aadhaar Details</h2>
      </div>
      <Row
        gutter={[16, 16]}
        className="w-full items-center mt-5"
        justify="space-between"
      >
        {/* Left Aadhaar: Search Input & Clear Button */}
        <Col>
          <div style={{ display: "flex", gap: "8px", width: "25vw" }}>
            <Input
              placeholder="Search Aadhaar"
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
      </Row>

      <Table
        columns={columns}
        className="my-4 default-list-table"
        dataSource={filteredData}
        rowKey="id"
        style={{ backgroundColor: "#1D4ED85C" }}
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
      />
    </div>
  );
};

export default AadhaarVerify;
