import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  FamilyCaptainDetails,
  UpdateFamilyCaptainPayload,
  FamilyOption,
} from "../../types/familyCaptain";
import { getFamiliesSummary, getFamilyOptions } from "../../api/familyApi";
import { getPartsApi } from "../../api/partApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface EditFamilyCaptainModalProps {
  visible: boolean;
  familyCaptain: FamilyCaptainDetails | null;
  onCancel: () => void;
  onSubmit: (
    updatedCaptain: UpdateFamilyCaptainPayload,
    assignedFamilies: string[]
  ) => Promise<void>;
  loading: boolean;
  electionId?: number;
}

interface Family {
  familyId: string;
  memberCount: number;
  familySequenceNumber: number;
  firstMember: {
    name: string;
    epicNumber: string;
    age: number;
    gender: string;
    partNo: number;
  };
}

interface FamilySummaryResponse {
  status: string;
  data: {
    families: {
      content: Family[];
      totalElements: number;
    };
  };
}

const EditFamilyCaptainModal: React.FC<EditFamilyCaptainModalProps> = ({
  visible,
  familyCaptain,
  onCancel,
  onSubmit,
  loading,
  electionId,
}) => {
  const [form] = Form.useForm();
  const [familyOptions, setFamilyOptions] = useState<FamilyOption[]>([]);
  const [familySearchTerm, setFamilySearchTerm] = useState("");

  const [families, setFamilies] = useState<Family[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [partNumbers, setPartNumbers] = useState<number[]>([]);
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [loadingParts, setLoadingParts] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [initialAssignedFamilies, setInitialAssignedFamilies] = useState<
    string[]
  >([]);
  const [shouldFetchFamilies, setShouldFetchFamilies] = useState(false);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Fetch family options for the dropdown
  // const fetchFamilyOptions = async (searchTerm = "") => {
  //   if (!electionId) return;

  //   try {
  //     setLoadingFamilies(true);
  //     const response = await getFamilyOptions(electionId, searchTerm, 0, 100);

  //     if (response.success && response.data?.content) {
  //       setFamilyOptions(response.data.content);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching family options:", error);
  //     message.error("Failed to load family options");
  //   } finally {
  //     setLoadingFamilies(false);
  //   }
  // };

  const fetchParts = useCallback(async () => {
    if (!selectedElectionId) return;

    try {
      setLoadingParts(true);
      const response = await getPartsApi(parseInt(selectedElectionId));
      console.log("Parts response:", response.data);

      const validParts = (
        Array.isArray(response.data) ? response.data : []
      ).map((part: any) => ({
        ...part,
        partNo: Number(part?.partNo?.trim() ?? 0),
      }));

      const partNumbersFromResponse = validParts
        .map((part: any) => part.partNo)
        .filter(
          (pn: any) => !isNaN(pn) && pn !== null && pn !== undefined && pn !== 0
        )
        .sort((a: number, b: number) => a - b);

      setPartNumbers(partNumbersFromResponse);

      // Set first part as default only on initial load
      if (partNumbersFromResponse.length > 0 && isInitialLoad) {
        console.log("setting part initial load", partNumbersFromResponse[0]);
        setSelectedPart(partNumbersFromResponse[0]);
        setIsInitialLoad(false);
        setShouldFetchFamilies(true);
      }
    } catch (error) {
      console.error("Error fetching parts:", error);
      setPartNumbers([]);
      message.error("Failed to fetch part numbers. Please try again.");
    } finally {
      setLoadingParts(false);
    }
  }, [selectedElectionId, isInitialLoad]);

  // Fetch families
  const fetchFamilies = useCallback(
    async (page = 1, size = 100, resetList = true) => {
      if (!selectedElectionId) return;

      try {
        console.log("calling fetch families");
        setLoadingFamilies(true);
        const response: FamilySummaryResponse = await getFamiliesSummary(
          parseInt(selectedElectionId),
          undefined, // boothNumbers
          selectedPart.toString(), // partNumbers - use selected part
          page,
          size
        );

        console.log("Families response:", response);

        if (
          response.status === "success" &&
          response.data &&
          response.data.families
        ) {
          const familiesData = response.data.families.content || [];
          console.log("Families Data", familiesData);

          if (resetList) {
            setFamilies(familiesData);
          } else {
            setFamilies((prev) => [...prev, ...familiesData]);
          }

          setTotalFamilies(response.data.families.totalElements || 0);
        } else {
          console.warn("Invalid response structure:", response);
          if (resetList) {
            setFamilies([]);
            setTotalFamilies(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch families:", error);
        if (resetList) {
          setFamilies([]);
          setTotalFamilies(0);
        }
        message.error("Failed to fetch families. Please try again.");
      } finally {
        setLoadingFamilies(false);
        setShouldFetchFamilies(false);
      }
    },
    [selectedElectionId, selectedPart]
  );

  // Handle part change
  const handlePartChange = (part: number) => {
    setSelectedPart(part);
    setFamilies([]); // Clear current families
    setShouldFetchFamilies(true);
  };

  const initializeForm = useCallback(() => {
    if (visible && familyCaptain) {
      // Store initial assigned families
      const assignedFamilies = familyCaptain.assigned_families || [];
      setInitialAssignedFamilies(assignedFamilies);

      form.setFieldsValue({
        first_name: familyCaptain.first_name,
        last_name: familyCaptain.last_name,
        email: familyCaptain.email,
        mobile_number: familyCaptain.mobile_number,
        whats_app_number: familyCaptain.whats_app_number,
        gender: familyCaptain.gender,
        status: familyCaptain.status,
        remarks: familyCaptain.remarks,
        street: familyCaptain.address?.street || "",
        city: familyCaptain.address?.city || "",
        state: familyCaptain.address?.state || "",
        postal_code: familyCaptain.address?.postal_code || "",
        country: familyCaptain.address?.country || "",
        assigned_families: assignedFamilies,
      });

      // If family captain has assigned families with part numbers,
      // try to set the part number based on the first assigned family
      if (
        assignedFamilies.length > 0 &&
        familyCaptain.assigned_family_details?.[0]?.part_number
      ) {
        const firstFamilyPart =
          familyCaptain.assigned_family_details[0].part_number;
        if (partNumbers.includes(firstFamilyPart)) {
          setSelectedPart(firstFamilyPart);
          setShouldFetchFamilies(true);
        }
      }
    }
  }, [visible, familyCaptain, form, partNumbers]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  useEffect(() => {
    if (partNumbers.length > 0 && selectedPart && shouldFetchFamilies) {
      fetchFamilies();
    }
  }, [selectedPart, shouldFetchFamilies, fetchFamilies]);

  useEffect(() => {
    if (visible && familyCaptain && partNumbers.length > 0) {
      initializeForm();
    }
  }, [visible, familyCaptain, partNumbers, initializeForm]);

  // Initialize form with family captain data
  // useEffect(() => {
  //   if (visible && familyCaptain) {
  //     form.setFieldsValue({
  //       first_name: familyCaptain.first_name,
  //       last_name: familyCaptain.last_name,
  //       email: familyCaptain.email,
  //       mobile_number: familyCaptain.mobile_number,
  //       whats_app_number: familyCaptain.whats_app_number,
  //       gender: familyCaptain.gender,
  //       status: familyCaptain.status,
  //       remarks: familyCaptain.remarks,
  //       street: familyCaptain.address?.street || "",
  //       city: familyCaptain.address?.city || "",
  //       state: familyCaptain.address?.state || "",
  //       postal_code: familyCaptain.address?.postal_code || "",
  //       country: familyCaptain.address?.country || "",
  //       assigned_families: (familyCaptain.assigned_families || []).filter(
  //         (id: string) => families.some((f) => f.familyId === id) // only keep valid IDs
  //       ),
  //     });
  //   }
  // }, [visible, familyCaptain, form, electionId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setFamilies([]);
      setFamilySearchTerm("");
      setInitialAssignedFamilies([]);
      setIsInitialLoad(true);
      setShouldFetchFamilies(false); // CHANGE: Reset fetch trigger
    }
  }, [visible, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const updatedCaptain: UpdateFamilyCaptainPayload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        mobile_number: values.mobile_number,
        whats_app_number: values.whats_app_number,
        gender: values.gender,
        status: values.status,
        remarks: values.remarks,
        address: {
          street: values.street || "",
          city: values.city,
          state: values.state,
          postal_code: values.postal_code,
          country: values.country,
        },
      };

      await onSubmit(updatedCaptain, values.assigned_families || []);
    } catch (error) {
      console.error("Form validation failed:", error);
    }
  };

  const renderFamilyOptions = () => {
    return families.map((family, index) => {
      const displayNumber = family.familySequenceNumber ?? index + 1;
      const isInitiallyAssigned = initialAssignedFamilies.includes(
        family.familyId
      );

      return (
        <Select.Option
          key={family.familyId}
          value={family.familyId}
          style={
            isInitiallyAssigned
              ? { fontWeight: "bold", backgroundColor: "#f0f8ff" }
              : {}
          }
        >
          {`${displayNumber} - ${family.firstMember?.name} (${family.memberCount} members)`}
          {isInitiallyAssigned && " ✓"}{" "}
        </Select.Option>
      );
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <UserOutlined />
          <span>Edit Family Captain</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Save Changes
        </Button>,
      ]}
      width={800}
      destroyOnClose
      maskClosable={false}
    >
      <Form form={form} layout="vertical" scrollToFirstError className="mt-4">
        {/* Personal Information */}
        <Title level={5} className="mb-3">
          <UserOutlined className="mr-2" />
          Personal Information
        </Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[
                { required: true, message: "Please enter first name" },
                { max: 50, message: "First name cannot exceed 50 characters" },
              ]}
            >
              <Input placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[
                { max: 50, message: "Last name cannot exceed 50 characters" },
              ]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Please select gender" }]}
            >
              <Select placeholder="Select gender">
                <Option value="Male">Male</Option>
                <Option value="Female">Female</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status" }]}
            >
              <Select placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        {/* Contact Information */}
        <Title level={5} className="mb-3">
          <PhoneOutlined className="mr-2" />
          Contact Information
        </Title>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="mobile_number"
              label="Mobile Number"
              rules={[
                { required: true, message: "Please enter mobile number" },
                {
                  pattern: /^[6-9]\d{9}$/,
                  message: "Please enter a valid 10-digit mobile number",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter mobile number"
                maxLength={10}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="whats_app_number"
              label="WhatsApp Number (Optional)"
              rules={[
                {
                  pattern: /^[6-9]\d{9}$/,
                  message: "Please enter a valid 10-digit WhatsApp number",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter WhatsApp number"
                maxLength={10}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Enter email address" />
        </Form.Item>

        <Divider />

        {/* Address Information */}
        <Title level={5} className="mb-3">
          <HomeOutlined className="mr-2" />
          Address Information
        </Title>

        <Form.Item name="street" label="Street Address">
          <Input placeholder="Enter street address" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input placeholder="Enter city" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="state"
              label="State"
              rules={[{ required: true, message: "Please enter state" }]}
            >
              <Input placeholder="Enter state" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="postal_code"
              label="Postal Code"
              rules={[
                { required: true, message: "Please enter postal code" },
                {
                  pattern: /^\d{5,6}$/,
                  message: "Please enter a valid postal code",
                },
              ]}
            >
              <Input placeholder="Enter postal code" maxLength={6} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="country"
          label="Country"
          rules={[{ required: true, message: "Please enter country" }]}
        >
          <Input placeholder="Enter country" />
        </Form.Item>

        <Divider />

        {/* Family Assignment */}
        <Title level={5} className="mb-3">
          <TeamOutlined className="mr-2" />
          Assigned Families
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Part Number"
              help="Select part number to load families from that part"
            >
              <Select
                placeholder={
                  loadingParts ? "Loading parts..." : "Select part number"
                }
                value={selectedPart}
                onChange={handlePartChange}
                loading={loadingParts}
                disabled={loadingParts}
                style={{ width: "100%" }}
              >
                {partNumbers.map((partNo) => (
                  <Option key={partNo} value={partNo}>
                    Part {partNo}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="assigned_families"
              label="Select Families"
              help="Families with ✓ are already assigned to this captain"
            >
              <Select
                mode="multiple"
                placeholder="Search and select families..."
                loading={loadingFamilies}
                notFoundContent={
                  loadingFamilies ? "Loading families..." : "No families found"
                }
                style={{ width: "100%" }}
                optionFilterProp="children" // tells Select to search in option labels
                filterOption={(input, option) =>
                  (option?.children as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {renderFamilyOptions()}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Remarks */}
        <Divider />
        <Form.Item name="remarks" label="Remarks (Optional)">
          <TextArea
            rows={3}
            placeholder="Enter any additional remarks or notes..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditFamilyCaptainModal;
