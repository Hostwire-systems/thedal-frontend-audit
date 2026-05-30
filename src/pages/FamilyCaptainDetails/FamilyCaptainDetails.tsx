import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Button,
  Tag,
  Descriptions,
  Table,
  message,
  Spin,
  Space,
  Tooltip,
  Empty,
  Divider,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  TeamOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import {
  getFamilyCaptainDetails,
  updateFamilyCaptain,
  updateAssignedFamilies,
} from "../../api/familyApi";
import {
  FamilyCaptainDetails as IFamilyCaptainDetails,
  AssignedFamilyDetail,
  UpdateFamilyCaptainPayload,
} from "../../types/familyCaptain";
import EditFamilyCaptainModal from "../FamilyCaptainList/EditFamilyCaptainModal";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface FamilyCaptainDetailsPageProps {}

const FamilyCaptainDetails: React.FC<FamilyCaptainDetailsPageProps> = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isLoading: loading, setLoading } = useLoading();

  // State
  const [familyCaptain, setFamilyCaptain] = useState<IFamilyCaptainDetails | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  // Redux
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Permissions
  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");

  // Fetch family captain details
  const fetchFamilyCaptainDetails = async () => {
    if (!selectedElectionId || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getFamilyCaptainDetails(
        parseInt(selectedElectionId),
        parseInt(userId)
      );

      if (response.status==="success" && response.data) {
        // Validate election match
        if (
          response.data.election_id &&
          response.data.election_id !== parseInt(selectedElectionId)
        ) {
          message.error(
            "This family captain is not associated with the selected election"
          );
          navigate("/family-captain-list");
          return;
        }

        const details: IFamilyCaptainDetails = {
          ...response.data,
          // Add compatibility fields
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          mobileNumber: response.data.mobile_number,
          photoUrl: response.data.photo_url,
          assignedFamilies: response.data.assigned_families,
          assignedFamilyDetails: response.data.assigned_family_details,
          electionId: selectedElectionId,
        };

        setFamilyCaptain(details);
      } else {
        message.error("Failed to load family captain details");
        navigate("/family-captain-list");
      }
    } catch (error: any) {
      console.error("Error fetching family captain details:", error);
      if (error.response?.status === 404) {
        message.error("Family captain not found");
      } else {
        message.error("Failed to load family captain details");
      }
      navigate("/family-captain-list");
    } finally {
      setLoading(false);
    }
  };

  // Handle update family captain
  const handleUpdateFamilyCaptain = async (
    updatedCaptain: UpdateFamilyCaptainPayload,
    assignedFamilies: string[]
  ): Promise<void> => {
    if (!familyCaptain || !selectedElectionId) return;

    try {
      setButtonLoading(true);

      // Update personal details
      await updateFamilyCaptain(
        parseInt(selectedElectionId),
        familyCaptain.user_id,
        updatedCaptain
      );

      // Update assigned families if changed
      const currentFamilies = familyCaptain.assigned_families || [];
      const familiesChanged = 
        JSON.stringify(currentFamilies.sort()) !== JSON.stringify(assignedFamilies.sort());

      if (familiesChanged) {
        await updateAssignedFamilies(
          parseInt(selectedElectionId),
          familyCaptain.user_id,
          assignedFamilies
        );
      }

      message.success("Family captain updated successfully");
      setIsEditModalVisible(false);
      
      // Refresh data
      await fetchFamilyCaptainDetails();
    } catch (error) {
      console.error("Failed to update family captain:", error);
      message.error("Failed to update family captain");
    } finally {
      setButtonLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    return dayjs(dateString).format("DD-MMM-YYYY HH:mm");
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      default:
        return "default";
    }
  };

  // Assigned families table columns
  const familyColumns = [
    // {
    //   title: "Family No.",
    //   dataIndex: "family_sequence_number",
    //   key: "family_sequence_number",
    //   render: (value: number) => (
    //     <Text strong>F-{value}</Text>
    //   ),
    // },
    {
      title: "Head Name",
      dataIndex: "family_head_name",
      key: "family_head_name",
      render: (name: string) => (
        <Text>{name}</Text>
      ),
    },
    {
      title: "Head EPIC",
      dataIndex: "family_head_epic",
      key: "family_head_epic",
      render: (epic: string) => (
        <Text copyable={{ text: epic }} code>
          {epic}
        </Text>
      ),
    },
    {
      title: "Members",
      dataIndex: "family_count",
      key: "family_count",
      render: (count: number) => (
        <Tag color="blue">{count} members</Tag>
      ),
    },
    {
      title: "Part No.",
      dataIndex: "part_number",
      key: "part_number",
      render: (part: number) => (
        <Tag>{part}</Tag>
      ),
    },
  ];

  // Effects
  useEffect(() => {
    fetchFamilyCaptainDetails();
  }, [selectedElectionId, userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (!familyCaptain) {
    return (
      <div className="w-full h-full p-6">
        <Empty description="Family captain not found" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6">
      {/* Header */}
      <Row justify="space-between" align="middle" className="mb-6">
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/family-captain-list")}
            >
              Back to List
            </Button>
            <Title level={3} className="m-0">
              Family Captain Details
            </Title>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setIsEditModalVisible(true)}
            disabled={!isSuperAdminOrAdmin && !hasUpdatePermission("familyCaptain")}
          >
            Edit Details
          </Button>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Profile Card */}
        <Col xs={24} lg={8}>
          <Card className="h-fit">
            <div className="text-center">
              <Avatar
                size={120}
                src={familyCaptain.photo_url}
                icon={<UserOutlined />}
                className="mb-4 border-4 border-gray-200"
              />
              <Title level={4} className="mb-2">
                {`${familyCaptain.first_name} ${familyCaptain.last_name || ""}`.trim()}
              </Title>
              <Tag color={getStatusColor(familyCaptain.status)} className="mb-4">
                {familyCaptain.status?.toUpperCase()}
              </Tag>
              
              <Divider />
              
              <div className="text-left">
                <Space direction="vertical" size="middle" className="w-full">
                  <div>
                    <Text type="secondary">Captain ID</Text>
                    <br />
                    <Text strong>{familyCaptain.user_id}</Text>
                  </div>
                  
                  <div>
                    <PhoneOutlined className="text-blue-500 mr-2" />
                    <Text strong copyable={{ text: familyCaptain.mobile_number }}>
                      {familyCaptain.mobile_number}
                    </Text>
                  </div>
                  
                  {familyCaptain.email && (
                    <div>
                      <MailOutlined className="text-green-500 mr-2" />
                      <Text copyable={{ text: familyCaptain.email }}>
                        {familyCaptain.email}
                      </Text>
                    </div>
                  )}
                  
                  <div>
                    <TeamOutlined className="text-purple-500 mr-2" />
                    <Text strong>
                      {familyCaptain.assigned_families?.length || 0} families assigned
                    </Text>
                  </div>
                  
                  <div>
                    <Text type="secondary">Gender: </Text>
                    <Text className="capitalize">{familyCaptain.gender?.toLowerCase()}</Text>
                  </div>
                </Space>
              </div>
            </div>
          </Card>
        </Col>

        {/* Details and Information */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" className="w-full">
            {/* Personal Information */}
            <Card title={
              <Space>
                <UserOutlined />
                <span>Personal Information</span>
              </Space>
            }>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="First Name">
                  {familyCaptain.first_name}
                </Descriptions.Item>
                <Descriptions.Item label="Last Name">
                  {familyCaptain.last_name || "Not provided"}
                </Descriptions.Item>
                <Descriptions.Item label="Mobile Number">
                  <Text copyable={{ text: familyCaptain.mobile_number }}>
                    {familyCaptain.mobile_number}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="WhatsApp Number">
                  {familyCaptain.whats_app_number ? (
                    <Text copyable={{ text: familyCaptain.whats_app_number }}>
                      {familyCaptain.whats_app_number}
                    </Text>
                  ) : (
                    "Not provided"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={2}>
                  {familyCaptain.email ? (
                    <Text copyable={{ text: familyCaptain.email }}>
                      {familyCaptain.email}
                    </Text>
                  ) : (
                    "Not provided"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Gender">
                  <Text className="capitalize">
                    {familyCaptain.gender?.toLowerCase()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(familyCaptain.status)}>
                    {familyCaptain.status?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Address Information */}
            <Card title={
              <Space>
                <HomeOutlined />
                <span>Address Information</span>
              </Space>
            }>
              {familyCaptain.address ? (
                <Descriptions bordered>
                  <Descriptions.Item label="Street" span={3}>
                    {familyCaptain.address.street || "Not provided"}
                  </Descriptions.Item>
                  <Descriptions.Item label="City">
                    {familyCaptain.address.city}
                  </Descriptions.Item>
                  <Descriptions.Item label="State">
                    {familyCaptain.address.state}
                  </Descriptions.Item>
                  <Descriptions.Item label="Postal Code">
                    {familyCaptain.address.postal_code}
                  </Descriptions.Item>
                  <Descriptions.Item label="Country" span={2}>
                    {familyCaptain.address.country}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">Address information not provided</Text>
              )}
            </Card>

            {/* System Information */}
            {/* <Card title={
              <Space>
                <CalendarOutlined />
                <span>System Information</span>
              </Space>
            }>
              <Descriptions bordered>
                <Descriptions.Item label="Created">
                  {formatDate(familyCaptain.created_time)}
                </Descriptions.Item>
                <Descriptions.Item label="Last Modified">
                  {formatDate(familyCaptain.modified_time)}
                </Descriptions.Item>
                <Descriptions.Item label="Election">
                  Election ID: {selectedElectionId || "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Account ID">
                  {familyCaptain.account_id || "Not available"}
                </Descriptions.Item>
                <Descriptions.Item label="Remarks" span={2}>
                  {familyCaptain.remarks ? (
                    <Paragraph>{familyCaptain.remarks}</Paragraph>
                  ) : (
                    <Text type="secondary">No remarks provided</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card> */}

            {/* Assigned Families */}
            <Card title={
              <Space>
                <TeamOutlined />
                <span>Assigned Families ({familyCaptain.assigned_families?.length || 0})</span>
              </Space>
            }>
              {familyCaptain.assigned_family_details && familyCaptain.assigned_family_details.length > 0 ? (
                <Table
                  columns={familyColumns}
                  dataSource={familyCaptain.assigned_family_details.map((family, index) => ({
                    ...family,
                    key: family.family_id || index,
                  }))}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty 
                  description="No families assigned"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Edit Modal */}
      <EditFamilyCaptainModal
        visible={isEditModalVisible}
        familyCaptain={familyCaptain}
        onCancel={() => setIsEditModalVisible(false)}
        onSubmit={handleUpdateFamilyCaptain}
        loading={buttonLoading}
        electionId={selectedElectionId ? parseInt(selectedElectionId) : undefined}
      />
    </div>
  );
};

export default FamilyCaptainDetails;
