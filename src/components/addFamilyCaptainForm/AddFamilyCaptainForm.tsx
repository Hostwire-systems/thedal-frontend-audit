import {
  UserOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import styled from "styled-components";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import {
  Avatar,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  message,
  Radio,
  Spin,
} from "antd";
import { getFamiliesSummary } from "../../api/familyApi";
import { getPartsApi } from "../../api/partApi";
const { Option } = Select;

// Interface definitions
interface Election {
  electionId: number;
  state: string;
  stateName: string;
  electionName: string;
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

interface AddFamilyCaptainFormProps {
  onFinish: (values: any) => void;
  initialValues?: Partial<any>;
  form: any;
  buttonLoading: boolean;
  setButtonLoading: (values: any) => void;
  plainOptions: string[];
}

// Type definitions
interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password: string;
  whats_app_number: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  familyIds: string[];
  remarks: string;
  gender: string;
  electionName: string;
}

// State options array
const stateOptions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
].sort();

const CustomRadioGroup = styled(Radio.Group)`
  .ant-radio-checked .ant-radio-inner {
    border-color: blue;
  }

  .ant-radio-checked .ant-radio-inner::after {
    background-color: blue;
  }
`;

export default function AddFamilyCaptainForm({
  onFinish,
  form,
  initialValues,
  buttonLoading,
  setButtonLoading,
  plainOptions,
}: AddFamilyCaptainFormProps) {
  // State declarations
  const [families, setFamilies] = useState<Family[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [totalFamilies, setTotalFamilies] = useState(0);
  const [partNumbers, setPartNumbers] = useState<number[]>([]);
  const [selectedPart, setSelectedPart] = useState<number>(1);
  const [loadingParts, setLoadingParts] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const location = useLocation();

  // Redux selectors
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const electionId = location.state?.electionId || selectedElectionId;
  const electionData = useSelector(
    (state: RootState) => state.election.allElections
  );
  const election: Election = electionData.find(
    (election) => String(election.id) === String(electionId)
  );

  const [electionName, setElectionName] = useState(
    election?.electionName || ""
  );

  // Fetch part numbers
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
        .filter((pn: any) => !isNaN(pn) && pn !== null && pn !== undefined && pn!==0)
        .sort((a: number, b: number) => a - b);

      setPartNumbers(partNumbersFromResponse);

      // Set first part as default only on initial load
      if (partNumbersFromResponse.length > 0 && isInitialLoad) {
        setSelectedPart(partNumbersFromResponse[0]);
        setIsInitialLoad(false);
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
      }
    },
    [selectedElectionId, selectedPart]
  );

  useEffect(() => {
    setElectionName(election?.electionName || "");
    console.log("Election updated:", election?.electionName);
    form.setFieldsValue({
      state: election?.state,
    });
  }, [election]);

  // Fetch parts when election changes
  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Fetch families when electionId or selectedPart changes
  useEffect(() => {
    if (partNumbers.length > 0) {
      fetchFamilies();
    }
  }, [electionId, selectedPart, fetchFamilies, partNumbers]);

  // Handle part change
  const handlePartChange = (part: number) => {
    setSelectedPart(part);
    setFamilies([]); // Clear current families
  };

  // Debug logs
  useEffect(() => {
    console.log("Election Data:", electionData);
    console.log("Selected Election ID:", electionId);
    console.log("Found Election:", election);
    console.log(election?.state);
    if (election) {
      form.setFieldsValue({
        electionName: election.electionName,
        state: election?.state,
      });
    }
    console.log("Families:", families);
    console.log("Selected Part:", selectedPart);
    console.log("Part Numbers:", partNumbers);
    stateOptions.includes(election?.state)
      ? console.log("true")
      : console.log("false");
  }, [electionData, electionId, election, selectedElectionId, families, selectedPart, partNumbers]);

  const handleFinish = async (values: any) => {
    setButtonLoading(true);
    try {
      // Prepare the form data
      const formData = {
        first_name: values.first_name,
        last_name: values.last_name,
        electionId: electionId,
        email: values.email,
        mobile_number: values.mobile_number,
        password: values.password,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
        status: values.status,
        country: "India",
        assigned_families: values.familyIds,
        remarks: values.remarks,
        whats_app_number: values.whats_app_number,
        gender: values.gender,
      };

      // Validations
      if (
        !formData.mobile_number ||
        !formData.password ||
        !formData.first_name ||
        !formData.status ||
        !formData.assigned_families
      ) {
        message.error("Please fill all required fields");
        setButtonLoading(false);
        return;
      }

      // Password validation
      // const passwordRegex =
      //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!validatePassword(formData.password)) {
        message.error(
          "Password must contain uppercase, lowercase, number and special character"
        );
        setButtonLoading(false);
        return;
      }

      // Mobile number validation
      // const mobileRegex = /^[0-9]{10}$/;
      if (!validateMobileNumber(formData.mobile_number)) {
        message.error("Please enter a valid 10-digit mobile number");
        setButtonLoading(false);
        return;
      }

      console.log("formData", formData);
      onFinish(formData);
    } catch (error: any) {
      console.error("Form submission error:", error);
      setButtonLoading(false);
    }
  };

  const handleFinishFailed = ({ errorFields }: any) => {
    console.log("errorFields", errorFields);
    if (errorFields && errorFields.length > 0) {
      form.scrollToField(errorFields[0].name, {
        behavior: "smooth",
      });
    }
  };

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      onFinishFailed={handleFinishFailed}
      layout="vertical"
      className="w-full pt-6 pb-6 pr-6"
      initialValues={{
        ...initialValues,
        state: election?.state || "",
        country: "India",
        electionName: election?.electionName || "Default Election Name",
      }}
      scrollToFirstError
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Enter Election name"
            name="electionName"
            rules={[{ required: true, message: "Please input election name!" }]}
          >
            <Input disabled value={electionName} className="input-element" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="First name"
            name="first_name"
            rules={[{ required: true, message: "Please input first name!" }]}
          >
            <Input className="input-element" placeholder="Enter First name" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Last name" name="last_name" rules={[]}>
            <Input className="input-element" placeholder="Enter last name" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please input your password!" },
              {
                min: 8,
                message: "Password must be at least 8 characters long",
              },
              {
                pattern:
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message:
                  "Password must contain uppercase, lowercase, number and special character",
              },
            ]}
            hasFeedback
          >
            <Input.Password
              className="input-element"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              placeholder="Enter your password"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The passwords do not match!")
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              className="input-element"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              placeholder="Confirm your password"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Enter mobile number"
            name="mobile_number"
            rules={[
              { required: true, message: "Please input mobile number!" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Please enter a valid 10-digit mobile number",
              },
            ]}
          >
            <Input
              className="input-element"
              prefix={
                <span
                  style={{
                    marginRight: "8px",
                    color: "#999",
                    borderColor: "#d9d9d9",
                  }}
                >
                  +91
                </span>
              }
              placeholder="Enter mobile number"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Enter WhatsApp number"
            name="whats_app_number"
            rules={[
              {
                pattern: /^[0-9]{10}$/,
                message: "Please enter a valid 10-digit WhatsApp number",
              },
            ]}
          >
            <Input
              className="input-element"
              prefix={
                <span
                  style={{
                    marginRight: "8px",
                    color: "#999",
                    borderColor: "#d9d9d9",
                  }}
                >
                  +91
                </span>
              }
              placeholder="Enter WhatsApp number"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Enter email ID"
            name="email"
            rules={[
              {
                type: "email",
                message: "Please enter a valid email address!",
              },
            ]}
          >
            <Input
              className="input-element"
              placeholder="Enter email address"
            />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Choose Gender"
            name="gender"
            rules={[{ required: true, message: "Please select a gender!" }]}
          >
            <CustomRadioGroup>
              {plainOptions.map((option) => (
                <Radio key={option} value={option}>
                  {option}
                </Radio>
              ))}
            </CustomRadioGroup>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="Part Number"
            help="Select part number to load families from that part"
          >
            <Select
              className="input-element custom-select"
              placeholder={loadingParts ? "Loading parts..." : "Select part number"}
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
            label="Family Allocation"
            name="familyIds"
            rules={[
              { required: true, message: "Please select at least one family!" },
            ]}
          >
            <Select
              mode="multiple"
              className="input-element custom-select"
              placeholder={
                loadingFamilies ? "Loading families..." : "Select families"
              }
              loading={loadingFamilies}
              disabled={loadingFamilies}
            >
              {families.map((family, index) => {
                const displayNumber = family.familySequenceNumber ?? index + 1;
                return (
                  <Option key={family.familyId} value={family.familyId}>
                    {`${displayNumber} - ${family.firstMember.name}`}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="City"
            name="city"
            rules={[
              {
                pattern: /^[A-Za-z\s]+$/,
                message: "City can only contain letters",
              },
            ]}
          >
            <Input className="input-element" placeholder="Enter city" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="State"
            name="state"
            rules={[{ required: true, message: "Please select a state!" }]}
          >
            <Select
              className="input-element custom-select"
              placeholder="Select State"
              showSearch
              disabled
            >
              {stateOptions.map((state) => (
                <Option key={state} value={state}>
                  {state}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Postal Code"
            name="postal_code"
            rules={[
              {
                pattern: /^[0-9]{6}$/,
                message: "Please enter a valid 6-digit postal code!",
              },
            ]}
          >
            <Input className="input-element" placeholder="Enter postal code" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please select a status!" }]}
          >
            <Select
              placeholder="Select a status"
              className="input-element custom-select"
            >
              <Option key="Active" value="Active">
                Active
              </Option>
              <Option key="Inactive" value="Inactive">
                Inactive
              </Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item label="Remarks (optional)" name="remarks">
            <Input.TextArea
              className="input-element"
              placeholder="Enter any additional remarks"
              rows={4}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row align="middle" justify="end">
        <Col>
          <Button
            type="primary"
            htmlType="submit"
            disabled={buttonLoading}
            className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
          >
            {buttonLoading && (
              <Spin size="small" className="custom-spin-dark mr-2" />
            )}
            {buttonLoading ? "Submitting..." : "Add Family Captain"}
          </Button>
        </Col>
      </Row>
    </Form>
  );
}

// Validation functions
const validatePassword = (password: string): boolean => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateMobileNumber = (number: string): boolean => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(number);
};

const validatePostalCode = (code: string): boolean => {
  const postalRegex = /^[0-9]{6}$/;
  return postalRegex.test(code);
};

// Default form values
const defaultFormValues: Partial<FormData> = {
  country: "India",
  state: "",
  city: "",
  postal_code: "",
  remarks: "",
  gender: "",
};

export type { FormData, Family };
export {
  validatePassword,
  validateMobileNumber,
  validatePostalCode,
  defaultFormValues,
};
