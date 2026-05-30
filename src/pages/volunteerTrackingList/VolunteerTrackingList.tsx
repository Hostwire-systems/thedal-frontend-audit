import React, { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { useLoading } from "../../context/LoadingContext";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Col,
  Row,
  Select,
  Input,
  Button,
  Tabs,
  Avatar,
  message,
  Tooltip,
} from "antd";
import {
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { getCadresApi, extractCadreList } from "../../api/cadreApi";
import { RootState } from "../../redux/store";

const { Option } = Select;
const { TabPane } = Tabs;

interface Volunteer {
  volunteerId: number;
  userId: number;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  location: string | null;
  assignedBooths: number[]; // Updated to array
  status: string;
}

interface ApiResponse {
  content: Volunteer[];
  totalElements: number;
  // ... other pagination fields
}

export default function VolunteerTrackingList(): JSX.Element {
  const navigate = useNavigate();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [boothNumbers, setBoothNumbers] = useState<string[]>([]);
  const [selectedBoothNumber, setSelectedBoothNumber] = useState<string | null>(
    null
  );
  const userId = localStorage.getItem("userId");
  const [activeTab, setActiveTab] = useState<string>("all");
  const { isLoading, setLoading } = useLoading();

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  useEffect(() => {
    if (selectedElectionId) {
      fetchVolunteers();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    applyFilters();
  }, [selectedBoothNumber, searchQuery, volunteers, activeTab]);

  const fetchVolunteers = async (): Promise<void> => {
    if (!selectedElectionId) return;

    setLoading(true);
    try {
  const response = await getCadresApi(parseInt(selectedElectionId), parseInt(userId!));
  const raw = extractCadreList(response);
  const volunteersData: Volunteer[] = raw.map((volunteer: any) => ({
        volunteerId: volunteer.volunteerId,
        userId: volunteer.userId,
        firstName: volunteer.firstName,
        lastName: volunteer.lastName,
        mobileNumber: volunteer.mobileNumber,
        location: volunteer.address
          ? `${volunteer.address.street}, ${volunteer.address.city}, ${volunteer.address.state}, ${volunteer.address.postalCode}, ${volunteer.address.country}`
          : null,
        assignedBooths: volunteer.assignedBooths,
        status: volunteer.status,
        // Include other fields if necessary
      }));
      setVolunteers(volunteersData);

      const uniqueBoothNumbers = Array.from(
        new Set(
          volunteersData
            .map((volunteer: Volunteer) => volunteer.assignedBooths || [])
            .flat()
            .filter((n: any) => n !== null && n !== undefined)
        )
      )
        .sort((a: any, b: any) => a - b)
        .map(String);
      console.log("uniqueBoothNumbers", uniqueBoothNumbers);
      setBoothNumbers(uniqueBoothNumbers);
    } catch (error) {
  console.error("Error fetching cadres for tracking list:", error);
      // message.error("Failed to fetch cadres data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (): void => {
    let filtered = volunteers;

    if (selectedBoothNumber) {
      const boothNumber = parseInt(selectedBoothNumber, 10);
      filtered = filtered.filter((volunteer) =>
        volunteer.assignedBooths.includes(boothNumber)
      );
    }

    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((volunteer) => {
        const fullName = `${volunteer.firstName} ${volunteer.lastName}`.toLowerCase();
        return (
          fullName.includes(query) || volunteer.mobileNumber.includes(query)
        );
      });
    }

    if (activeTab !== "all") {
      filtered = filtered.filter(
        (volunteer) => volunteer.status.toLowerCase() === activeTab
      );
    }

    setFilteredVolunteers(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleBoothChange = (value: string | null): void => {
    console.log("selectedBoothNumber", value);
    setSelectedBoothNumber(value);
  };

  const handleTabChange = (key: string): void => {
    setActiveTab(key.toLowerCase());
  };

  const handlePhoneDial = (phoneNumber: string): void => {
    if (isMobile) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      navigator.clipboard.writeText(phoneNumber);
      message.success(`Phone number ${phoneNumber} copied to clipboard`);
    }
  };

  const handleTrackingClick = (userId: number): void => {
    navigate(`/cadre-details/${userId}`);
  };

  const getVolunteerCountByStatus = (status: string): number => {
    return volunteers.filter(
      (volunteer) =>
        status === "all" || volunteer.status.toLowerCase() === status
    ).length;
  };

  return (
    <div className="w-full h-full p-10">
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={24}>
          <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
            Cadre Tracking
          </h3>
        </Col>
      </Row>

      {/* Filters Section */}
      <Row gutter={[16, 16]} className="w-full items-end mt-10">
        <Col span={8}>
          <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
            Choose Booth Number
          </label>
          <Select
            placeholder="Choose Booth number"
            className="w-full h-[45px] custom-select"
            onChange={handleBoothChange}
            value={selectedBoothNumber}
            allowClear
          >
            <Option value={null}>All Booths</Option>
            {boothNumbers.map((boothNumber) => (
              <Option key={boothNumber} value={boothNumber}>
                Booth {boothNumber}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <label className="block text-[15px] font-medium text-[#1F2937] mb-2">
            Search by name or mobile number
          </label>
          <Input
            placeholder="Search by name or mobile number"
            className="input-element"
            suffix={<SearchOutlined />}
            value={searchQuery}
            onChange={handleSearch}
          />
        </Col>
      </Row>

      {/* Tabs Section */}
      <Row className="mt-10">
        <Col span={24}>
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            className="volunteer-tabs"
          >
            <TabPane
              tab={`Active Cadres (${getVolunteerCountByStatus("active")})`}
              key="active"
            />
            <TabPane
              tab={`Inactive Cadres (${getVolunteerCountByStatus("inactive")})`}
              key="inactive"
            />
            <TabPane
              tab={`All Cadres (${getVolunteerCountByStatus("all")})`}
              key="all"
            />
          </Tabs>
        </Col>
      </Row>

      {/* Volunteers List */}
      <Row className="mt-5">
        {filteredVolunteers.map((volunteer) => (
          <Col span={24} key={volunteer.volunteerId}>
            <div className="flex p-4 mb-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <Avatar
                  size={64}
                  style={{
                    backgroundColor:
                      volunteer.status.toLowerCase() === "active"
                        ? "#87d068"
                        : "#d9d9d9",
                  }}
                  icon={<UserOutlined />}
                />
              </div>
              <div className="ml-4 flex-grow">
                <h3 className="font-medium text-[16px]">
                  {volunteer.firstName} {volunteer.lastName}
                </h3>
                <p className="text-gray-500 text-[14px]">
                  {volunteer.mobileNumber}
                </p>
                <p className="font-medium text-[14px]">
                  <span className="text-[#005D9D]">Booth Number(s):</span>{" "}
                  {volunteer.assignedBooths.join(", ")}
                </p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${
                    volunteer.status.toLowerCase() === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {volunteer.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Tooltip title="Call Volunteer">
                  <Button
                    type="link"
                    icon={<PhoneOutlined />}
                    onClick={() => handlePhoneDial(volunteer.mobileNumber)}
                    className="text-lg text-[#1D4ED8] hover:text-[#1D4ED8]/80"
                  />
                </Tooltip>
                <Tooltip title="Track Volunteer">
                  <Button
                    type="link"
                    icon={<EnvironmentOutlined />}
                    onClick={() => handleTrackingClick(volunteer.userId)}
                    className="text-lg text-[#1D4ED8] hover:text-[#1D4ED8]/80"
                  />
                </Tooltip>
              </div>
            </div>
          </Col>
        ))}

        {/* Empty State */}
  {filteredVolunteers.length === 0 && !isLoading && (
          <Col span={24}>
            <div className="text-center py-8">
              <p className="text-gray-500">
                No cadres found matching your criteria.
              </p>
            </div>
          </Col>
        )}

        {/* Loading State */}
  {isLoading && (
          <Col span={24}>
            <div className="text-center py-8">
              <p className="text-gray-500">Loading cadres...</p>
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
}
