import {
  UserOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import {
  Avatar,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  message,
  Radio,
  Spin,
} from "antd";
import { getBoothsByElectionId } from "../../api/electionApi";
import { fetchRolesApi } from "../../api/roleApi";
import { ElectionStep1FormValues } from "../../types/election";
import { getBoothDataApi, getPartsApi } from "../../api/partApi";
import { getFamilyNumbersByBooth } from "../../api/familyApi";
import { getSectionsApi, getSectionsByBooths, SectionInfo, BoothSectionData } from "../../api/sectionApi";
import CustomRadioGroup from "../../components/common/CustomRadioGroup";
const { Option } = Select;

// Interface definitions
interface Election {
  id?: number | string;
  electionId: number;
  state: string;
  stateName: string;
  electionName: string;
}

interface Booth {
  electionId: number;
  boothId: number;
  boothNumber: number;
}

interface Role {
  id: number;
  roleName: string;
  permission: number;
  description: string;
  permissions?: Record<string, string[]>;
}

interface Part {
  id: number;
  partNo: string;
  partNameEnglish: string;
  partNameL1: string;
  schoolName: string;
  partLat: number;
  partLong: number;
  pincode: string;
}

interface AddCadreFormProps {
  onFinish: (values: any) => void;
  initialValues?: Partial<any>;
  form: any;
  isStandalone?: boolean;
  onChange?: any;
  checkedList?: any;
  buttonLoading: boolean;
  setButtonLoading: (values: any) => void;
  cadreList?: any;
  plainOptions: string[];
}

// State options array
const stateOptions = [
  "Andhra Pradesh",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Arunachal Pradesh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
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
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
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

const normalizeElectionId = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const getElectionStateValue = (election?: Election) =>
  election?.stateName || election?.state || "";



export default function AddCadreForm({
  onFinish,
  form,
  isStandalone = false,
  onChange,
  checkedList,
  cadreList,
  initialValues,
  buttonLoading,
  setButtonLoading,
  plainOptions,
}: AddCadreFormProps) {
  // State declarations

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [booths, setBooths] = useState<Booth[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [sections, setSections] = useState<BoothSectionData>({});
  const [sectionsCache, setSectionsCache] = useState<any>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [skipVisible, setSkipVisible] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Watch role field for conditional rendering
  const selectedRole = Form.useWatch('role', form);
  const assignedBooth = Form.useWatch('assignedBooth', form);

  const selectedRoleConfig = roles.find((role) => role.roleName === selectedRole);
  const normalizedRoleName = selectedRole?.toUpperCase() || "";
  const selectedRolePermissionKeys = Object.keys(selectedRoleConfig?.permissions || {}).map((key) => key.toLowerCase());
  const hasRolePermissionKey = (...keys: string[]) =>
    keys.some((key) => selectedRolePermissionKeys.includes(key.toLowerCase()));

  const isSuperAdminRole = normalizedRoleName === 'SUPER_ADMIN';
  const shouldShowBoothDropdown = !!selectedRole && !isSuperAdminRole;
  const shouldShowFamilyAssignment =
    !!selectedRole &&
    (
      normalizedRoleName.includes('FAMILY') ||
      hasRolePermissionKey('family', 'familyPollStatus', 'family-captain', 'family-captain-map')
    );
  const shouldShowSectionAssignment =
    !!selectedRole &&
    (
      normalizedRoleName.includes('BOOTH') ||
      normalizedRoleName.includes('POLL') ||
      hasRolePermissionKey('polldayVote', 'voterMap', 'voterList', 'newVoter', 'new-voters', 'sectionList')
    );

  // Debug: Log selected role changes
  useEffect(() => {
    console.log('Selected role changed:', selectedRole);
  }, [selectedRole]);

  // Redux selectors
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const electionId = normalizeElectionId(
    location.state?.electionId || selectedElectionId
  );
  const electionData = useSelector(
    (state: RootState) => state.election.allElections
  );
  const election: Election | undefined = electionData.find(
    (currentElection: Election) =>
      normalizeElectionId(currentElection.id ?? currentElection.electionId) ===
      electionId
  );
  const loading = useSelector((state: RootState) => state.election.loading);
  const electionState = getElectionStateValue(election);

  const [electionName, setElectionName] = useState(
    election?.electionName || ""
  );

  const fetchRoles = async () => {
    if (!selectedElectionId) return;
    try {
      const response = await fetchRolesApi();
      const mappedRoles = response.data
        .filter((role) => role.roleName !== "SUPER_ADMIN")
        .map((role) => ({
          id: role.id,
          roleName: role.roleName,
          description: role.description,
          permissions: role.rolePermission,
        }));
      console.log("Roles", mappedRoles);
      setRoles(mappedRoles);
    } catch (error) {
      message.error("Failed to fetch roles");
    }
  };

  useEffect(() => {
    setElectionName(election?.electionName || "");
    console.log("Election updated:", election?.electionName);
    form.setFieldsValue({
      state: electionState,
    });
  }, [election, electionState, form]);

  // Fetch booths when electionId changes
  useEffect(() => {
    // const fetchBooths = async () => {
    //   if (!electionId) return;

    //   setLoadingBooths(true);

    //   try {
    //     const response = await getBoothsByElectionId(electionId);
    //     const booths = response.data.content;
    //     setBooths(
    //       booths.sort(
    //         (a: any, b: any) => Number(a.boothNumber) - Number(b.boothNumber)
    //       )
    //     );
    //   } catch (error) {
    //     console.error("Error fetching booths:", error);
    //   } finally {
    //     setLoadingBooths(false);
    //   }
    // };

    // fetchBooths();
    const fetchParts = async (): Promise<void> => {
      if (!selectedElectionId) return;
      try {
        setLoadingBooths(true);
        const response = await getPartsApi(parseInt(selectedElectionId));
        console.log("Parts response:", response.data);
        let validParts = Array.isArray(response.data) ? response.data : [];
        validParts = validParts.map((part) => ({
          ...part,
          partNo: Number(part?.partNo?.trim() ?? 0),
        }));

        validParts.sort((a, b) => {
          return a.partNo - b.partNo;
        });
        setParts(validParts);
      } catch (error) {
        console.error("Error fetching parts:", error);
        setParts([]);
      } finally {
        setLoadingBooths(false);
      }
    };
    fetchParts();
    fetchRoles();
  }, [electionId]);

  // Fetch families when booth/part is selected and role is Family Captain
  useEffect(() => {
    const fetchFamilies = async () => {
      console.log('fetchFamilies triggered:', {
        selectedElectionId,
        assignedBooth,
        selectedRole,
        roleIncludesFamily: selectedRole?.toUpperCase().includes('FAMILY')
      });

      if (!selectedElectionId || !assignedBooth || !shouldShowFamilyAssignment) {
        setFamilies([]);
        return;
      }

      try {
        setLoadingFamilies(true);
        let partNumbers: number[] = [];

        if (Array.isArray(assignedBooth) && assignedBooth.includes('ALL')) {
          partNumbers = parts.map(part => Number(part.partNo));
        } else if (Array.isArray(assignedBooth)) {
          partNumbers = assignedBooth.map((num: any) => Number(num));
        }

        console.log('Fetching families for part numbers:', partNumbers);

        if (partNumbers.length > 0) {
          const response = await getFamilyNumbersByBooth(parseInt(selectedElectionId), partNumbers);
          console.log('Full API response:', response);
          const familyData = response?.data?.families?.content || response?.data?.content || response?.content || [];
          console.log('Fetched families:', familyData);
          console.log('Total families fetched:', familyData.length);
          setFamilies(familyData);
        }
      } catch (error) {
        console.error('Error fetching families:', error);
        setFamilies([]);
      } finally {
        setLoadingFamilies(false);
      }
    };

    fetchFamilies();
  }, [assignedBooth, selectedRole, selectedElectionId, parts, shouldShowFamilyAssignment]);


  // Fetch sections when booth is selected (for Booth Captain or Poll Captain roles)
  useEffect(() => {
    const fetchSections = async () => {
      console.log('fetchSections triggered:', {
        selectedElectionId,
        assignedBooth,
        selectedRole,
        roleIncludesBooth: selectedRole?.toUpperCase().includes('BOOTH') || selectedRole?.toUpperCase().includes('POLL')
      });

      // Only fetch sections for Booth Captain or Poll Captain roles
      if (!selectedElectionId || !assignedBooth || !shouldShowSectionAssignment) {
        setSections({});
        return;
      }

      try {
        setLoadingSections(true);
        let partNumbers: number[] = [];

        if (Array.isArray(assignedBooth) && assignedBooth.includes('ALL')) {
          partNumbers = parts.map(part => Number(part.partNo));
        } else if (Array.isArray(assignedBooth)) {
          partNumbers = assignedBooth.map((num: any) => Number(num));
        }

        console.log('Fetching sections for part numbers:', partNumbers);

        if (partNumbers.length > 0) {
          const response = await getSectionsByBooths(parseInt(selectedElectionId), partNumbers);
          console.log('Fetched sections:', response);
          const sectionData = response?.data || {};
          console.log('Total sections fetched for', Object.keys(sectionData).length, 'booths');
          setSections(sectionData);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSections({});
      } finally {
        setLoadingSections(false);
      }
    };

    fetchSections();
  }, [assignedBooth, selectedRole, selectedElectionId, parts, shouldShowSectionAssignment]);

  useEffect(() => {
    const fetchSectionsDataForNames = async () => {
      if (!selectedElectionId) return;
      try {
        const response = await getSectionsApi(parseInt(selectedElectionId));
        const sectionsData = response?.data?.data || response?.data || [];
        const sectionsMap: { [key: string]: string } = {};

        if (Array.isArray(sectionsData)) {
          sectionsData.forEach((section: any) => {
            const sectionNo = section.sectionNo || section.section_no;
            const partNo = section.partNo || section.part_no;
            const sectionName =
              section.sectionNameEnglish ||
              section.sectionNameL1 ||
              section.section_name_english ||
              section.section_name_l1 ||
              "";
            if (sectionNo && partNo) {
              sectionsMap[`${partNo}-${sectionNo}`] = sectionName;
            } else if (sectionNo) {
              sectionsMap[String(sectionNo)] = sectionName;
            }
          });
        }
        setSectionsCache(sectionsMap);
      } catch (error) {
        console.error("Error fetching sections map:", error);
      }
    };
    fetchSectionsDataForNames();
  }, [selectedElectionId]);


  // Debug logs
  useEffect(() => {
    console.log("Election Data:", electionData);
    console.log("Selected Election ID:", electionId);
    console.log("Found Election:", election);
    console.log(electionState);
    if (election) {
      form.setFieldsValue({
        electionName: election.electionName,
        state: electionState,
      });
    }
    console.log("Booths:", booths);
    stateOptions.includes(electionState)
      ? console.log("true")
      : console.log("false");
  }, [electionData, electionId, election, electionState, selectedElectionId, booths, form]);

  const handleFinish = async (values: any) => {
    setButtonLoading(true);
    try {
      let assignedBooth = values.assignedBooth?.includes("ALL")
        ? parts.map((part) => part.partNo)
        : values.assignedBooth;

      // Prepare the form data
      const formData: any = {
        firstName: values.firstName,
        lastName: values.lastName,
        electionId: electionId,
        emailId: values.emailId,
        mobileNumber: values.mobileNumber,
        password: values.password,
        // street: values.street || "string",
        city: values.city,
        roleName: values.role,
        state: values.state,
        postalCode: values.postalCode,
        status: values.status,
        country: "India",
        remarks: values.remarks,
        whatsAppNumber: values.whatsappNumber,
        gender: values.gender,
      };

      // Handle booth-section assignments
      // If sections are specified, use the new assignedBoothSections structure
      // Otherwise, use the old assignedBooth structure for backward compatibility
      if (values.boothSections && Object.keys(values.boothSections).length > 0) {
        // New section-level assignment format
        formData.assignedBoothSections = assignedBooth.map((boothNum: number) => ({
          boothNumber: boothNum,
          sectionNumbers: values.boothSections[boothNum] || [] // Empty array = entire booth
        }));
      } else {
        // Backward compatible: full booth assignment
        formData.assignedBooth = assignedBooth;
      }

      // Add assignedFamilies if Family Captain role is selected
      if (values.role && values.role.toUpperCase().includes('FAMILY') && values.assignedFamilies) {
        formData.assignedFamilies = values.assignedFamilies;
      }

      // Validations
      if (
        !formData.mobileNumber ||
        !formData.password ||
        !formData.firstName ||
        !formData.status
      ) {
        message.error("Please fill all required fields");
        setButtonLoading(false);
        return;
      }

      // Password validation
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        message.error(
          "Password must contain uppercase, lowercase, number and special character"
        );
        setButtonLoading(false);
        return;
      }

      // Mobile number validation
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobileNumber)) {
        message.error("Please enter a valid 10-digit mobile number");
        return;
      }
      console.log("formData", formData);
      await onFinish(formData);

      if (isStandalone) {
        message.success("Cadre added successfully");
        form.resetFields();
      }
    } catch (error: any) {
      // message.error(error.message || "Failed to add cadre");
      // message.error(error.message || "Failed to add cadre");
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

  const handleUploadButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("You can only upload image files!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
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
        state: electionState,
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
            name="firstName"
            rules={[
              { required: true, message: "Please input first name!" },
              // {
              //   pattern: /^[A-Za-z\s]+$/,
              //   message: "Name can only contain letters",
              // },
            ]}
          >
            <Input className="input-element" placeholder="Enter First name" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Last name"
            name="lastName"
            rules={
              [
                // { required: true, message: "Please input last name!" },
                // {
                //   pattern: /^[A-Za-z\s]+$/,
                //   message: "Name can only contain letters",
                // },
              ]
            }
          >
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
            name="mobileNumber"
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
            name="whatsappNumber"
            rules={[
              // { required: true, message: "Please input WhatsApp number!" },
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
            name="emailId"
            rules={[
              {
                type: "email",
                // required: true,
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
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role!" }]}
          >
            <Select
              placeholder="Select a Role"
              className="input-element custom-select"
              onChange={(value) => {
                console.log('Selected role:', value);
                // Clear booth and family selections when role changes
                form.setFieldsValue({
                  assignedBooth: undefined,
                  assignedFamilies: undefined,
                  boothSections: undefined
                });
              }}
            >
              {roles.map((role) => (
                <Option key={role.id} value={role.roleName}>
                  <strong> {role.roleName}</strong> - {role.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {/* Show booth dropdown for booth-scoped roles including custom Mandala roles */}
      {shouldShowBoothDropdown && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Alloted Booth"
              name="assignedBooth"
              rules={[{ required: true, message: "Please select a booth!" }]}
            >
              <Select
                mode="multiple"
                className="input-element custom-select"
                placeholder={
                  loadingBooths ? "Loading booths..." : "Select a booth"
                }
                loading={loadingBooths}
                disabled={loadingBooths}
                value={
                  form.getFieldValue("assignedBooth")?.includes("ALL")
                    ? ["ALL"]
                    : form.getFieldValue("assignedBooth")
                }
                onChange={(values) => {
                  let updated = [...values];
                  const lastSelected = updated[updated.length - 1];

                  if (lastSelected === "ALL") {
                    updated = ["ALL"];
                  } else if (
                    form.getFieldValue("assignedBooth")?.includes("ALL")
                  ) {
                    updated = updated.filter((val) => val !== "ALL");
                  }

                  form.setFieldsValue({ assignedBooth: updated });

                  // Clear assignedFamilies and boothSections when booth changes
                  if (shouldShowFamilyAssignment) {
                    form.setFieldsValue({ assignedFamilies: undefined });
                  }
                  // Clear section selections when booths change
                  form.setFieldsValue({ boothSections: undefined });
                }}
              >
                <Option key="ALL" value="ALL">
                  All parts
                </Option>
                {parts.map((part) => (
                  <Option key={part.id} value={part.partNo}>
                    Part {part.partNo}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Show section selection for Booth Captain or Poll Captain roles */}
          {shouldShowSectionAssignment &&
            assignedBooth &&
            assignedBooth.length > 0 &&
            !assignedBooth.includes('ALL') &&
            Object.keys(sections).length > 0 && (
              <Col span={24}>
                <div className="border rounded p-4 mt-4 bg-gray-50">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">
                    Section Assignment (Optional - Leave empty to assign entire booth)
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Select specific sections within each booth, or leave empty to assign the entire booth to this cadre.
                  </p>
                  {assignedBooth.map((boothNum: number) => {
                    const boothSections = sections[boothNum] || [];
                    if (boothSections.length === 0) return null;

                    return (
                      <div key={boothNum} className="mb-3">
                        <Form.Item
                          label={`Booth ${boothNum} - Sections`}
                          name={['boothSections', boothNum]}
                          className="mb-2"
                        >
                          <Select
                            mode="multiple"
                            className="input-element custom-select"
                            placeholder="Leave empty for entire booth or select specific sections"
                            loading={loadingSections}
                            disabled={loadingSections}
                            allowClear
                          >
                            {boothSections.map((section: SectionInfo) => {
                              const mapKey1 = `${boothNum}-${section.sectionNo}`;
                              const mapKey2 = String(section.sectionNo);
                              const sectionName = sectionsCache[mapKey1] || sectionsCache[mapKey2] || "";
                              return (
                                <Option key={section.sectionNo} value={section.sectionNo}>
                                  Section {section.sectionNo} ({section.voterCount} voters) {sectionName}
                                </Option>
                              );
                            })}
                          </Select>
                        </Form.Item>
                      </div>
                    );
                  })}
                </div>
              </Col>
            )}

          {/* Show family numbers dropdown only for Family Captain */}
          {shouldShowFamilyAssignment && (
            <Col span={12}>
              <Form.Item
                label="Alloted Family Numbers"
                name="assignedFamilies"
              >
                <Select
                  mode="multiple"
                  className="input-element custom-select"
                  placeholder={
                    loadingFamilies
                      ? "Loading families..."
                      : "Select family numbers"
                  }
                  loading={loadingFamilies}
                  disabled={loadingFamilies || families.length === 0}
                  showSearch
                  filterOption={(input, option) => {
                    const children = option?.children;
                    if (typeof children === 'string') {
                      return children.toLowerCase().includes(input.toLowerCase());
                    }
                    if (Array.isArray(children) && children.length > 0 && typeof children[0] === 'string') {
                      return (children[0] as string).toLowerCase().includes(input.toLowerCase());
                    }
                    return false;
                  }}
                >
                  {families.map((family) => (
                    <Option key={family.familyId} value={family.familySequenceNumber}>
                      {family.familySequenceNumber} - {family.firstMember?.name || 'Unknown'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>
      )}

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="City"
            name="city"
            rules={[
              // { required: true, message: "Please input city!" },
              {
                pattern: /^[A-Za-z\s]+$/,
                message: "City can only contain letters",
              },
            ]}
          >
            <Input className="input-element" placeholder="Enter city" />
          </Form.Item>
        </Col>
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
            name="postalCode"
            rules={[
              // { required: true, message: "Please input postal code!" },
              {
                pattern: /^[0-9]{6}$/,
                message: "Please enter a valid 6-digit postal code!",
              },
            ]}
          >
            <Input className="input-element" placeholder="Enter postal code" />
          </Form.Item>
        </Col>
        <Col span={12}>
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
            {" "}
            {buttonLoading && (
              <Spin size="small" className="custom-spin-dark mr-2" />
            )}
            {isStandalone
              ? loading
                ? "Submitting..."
                : "Add Cadre"
              : "Save and Continue"}
          </Button>
          {/* {!isStandalone && skipVisible && (
            <Button
              type="default"
              htmlType="button"
              className="ml-4 px-10 py-4 h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
            >
              Skip for now
            </Button>
          )} */}
        </Col>
      </Row>

      {cadreList && cadreList.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Existing Cadres</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cadreList.map((cadre: any, index: number) => (
              <li
                key={index}
                className="bg-white shadow-md rounded-lg p-6 text-center transition-transform transform hover:scale-105"
              >
                <div className="flex justify-center mb-4">
                  <Avatar
                    size={64}
                    style={{ backgroundColor: "#87d068" }}
                    icon={<UserOutlined />}
                  />
                </div>
                {/* <h2 className="text-xl font-semibold mb-2">{cadre.fullName}</h2> */}
                <h2 className="text-xl font-semibold mb-2">{`${cadre.firstName} ${cadre.lastName}`}</h2>
                <p className="text-gray-600">Booth {cadre.boothAllocation}</p>
                <p className="text-gray-500 text-sm">{cadre.mobileNumber}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
      />
    </Form>
  );
}

// Type definitions
interface FormData {
  firstName: string;
  lastName: string;
  emailId: string;
  mobileNumber: string;
  password: string;
  whatsappNumber: string;
  // street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  boothAllocation: string;
  remarks: string;
  gender: string;
  electionName: string;
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
  // street: "",
  postalCode: "",
  remarks: "",
  gender: "",
};

export type { FormData, Booth };
export {
  validatePassword,
  validateMobileNumber,
  validatePostalCode,
  defaultFormValues,
};
