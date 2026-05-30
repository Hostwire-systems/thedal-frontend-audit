import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Spin, Radio, Checkbox } from "antd";
import { getBoothsByElectionId } from "../../api/electionApi";
import styled from "styled-components";
import { useLoading } from "../../context/LoadingContext";
import { fetchRolesApi } from "../../api/roleApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Election } from "../../types";
import { getPartsApi } from "../../api/partApi";
import { Part } from "../../types/part";
import { getFamilyNumbersByBooth } from "../../api/familyApi";
import { getSectionsByBooths, SectionInfoOld, BoothSectionData } from "../../api/sectionApi";

const { Option } = Select;

// Interface definitions
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
}

interface BoothSectionAssignment {
  boothNumber: number;
  sectionNumbers: number[];
  fullBoothAssignment: boolean;
}

interface Cadre {
  volunteerId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  whatsAppNumber: string;
  roleName?: string;
  address: {
    // street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  assignedBooths: [];
  assignedBoothSections?: BoothSectionAssignment[];
  assignedFamilies?: number[];
  gender: string;
  status: string;
  role: string;
  photoUrl: string | null;
  remarks: string;
}

interface EditCadreModalProps {
  visible: boolean;
  buttonLoading: boolean;
  setButtonLoading: (button: boolean) => void;
  onCancel: () => void;
  onUpdate: (cadre: Cadre) => void;
  cadre: Cadre | null;
  electionId: string; // Add electionId prop
}

const normalizeElectionId = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const getElectionStateValue = (election?: any, fallbackState?: string) =>
  election?.stateName || election?.state || fallbackState || "";

const CustomRadioGroup = styled(Radio.Group)`
  .ant-radio-checked .ant-radio-inner {
    border-color: blue;
  }

  .ant-radio-checked .ant-radio-inner::after {
    background-color: blue;
  }
`;

// Indian states array
const stateOptions = [
  "Andhra Pradesh",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Arunachal Pradesh",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
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

const EditCadreModal: React.FC<EditCadreModalProps> = ({
  buttonLoading,
  setButtonLoading,
  visible,
  onCancel,
  onUpdate,
  cadre,
  electionId,
}) => {
  const [form] = Form.useForm();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingBooths, setLoadingBooths] = useState(false);
  const { isLoading, setLoading } = useLoading();
  const [roles, setRoles] = useState<Role[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [sections, setSections] = useState<BoothSectionData>({});
  const [loadingSections, setLoadingSections] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | undefined>();
  const plainOptions = ["Male", "Female", "Other"];

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const resolvedElectionId = normalizeElectionId(electionId || selectedElectionId);

  const electionData = useSelector(
    (state: RootState) => state.election.allElections
  );
  const election: Election | undefined = electionData.find(
    (currentElection: any) =>
      normalizeElectionId(currentElection.id ?? currentElection.electionId) ===
      resolvedElectionId
  );
  const electionState = getElectionStateValue(election, cadre?.address?.state);

  const fetchRoles = async () => {
    if (!selectedElectionId) return;
    try {
      const response = await fetchRolesApi();
      const mappedRoles = response.data
        .filter((role: any) => role.roleName !== "SUPER_ADMIN")
        .map((role: any) => ({
          id: role.id,
          roleName: role.roleName,
          description: role.description,
          permissions: role.rolePermission,
        }));
      console.log("Roles", mappedRoles);
      setRoles(mappedRoles);
    } catch (error) {
      console.error("Failed to fetch roles", error);
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

  // Fetch booths when modal becomes visible
  useEffect(() => {
    // const fetchBooths = async () => {
    //   if (!electionId || !visible) return;

    //   setLoadingBooths(true);
    //   setLoading(true);
    //   try {
    //     const response = await getBoothsByElectionId(electionId);
    //     console.log("Fetched Booths", response.data.content);
    //     const booths=response.data.content;
    //     setBooths(
    //       booths.sort(
    //         (a: any, b: any) => Number(a.boothNumber) - Number(b.boothNumber)
    //       )
    //     );
    //   } catch (error) {
    //     console.error("Error fetching booths:", error);
    //   } finally {
    //     setLoadingBooths(false);
    //     setLoading(false);
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
  }, [electionId, visible]);

  useEffect(() => {
    if (cadre) {
      console.log("Cadre Details", cadre);
      
      // Extract booth numbers from either assignedBooths or assignedBoothSections
      let boothNumbers: number[] = [];
      if (cadre.assignedBooths && cadre.assignedBooths.length > 0) {
        boothNumbers = cadre.assignedBooths;
      } else if (cadre.assignedBoothSections && cadre.assignedBoothSections.length > 0) {
        // Extract unique booth numbers from assignedBoothSections
        boothNumbers = Array.from(
          new Set(cadre.assignedBoothSections.map(assignment => assignment.boothNumber))
        );
      }
      
      const boothLabels = boothNumbers.map((booth) => ({
        label: `Part ${booth}`,
        value: booth,
      }));
      
      // Convert gender to Male,Female or Other
      const normalizedGender = cadre.gender
        ? ["male", "female", "other"].includes(cadre.gender.toLowerCase())
          ? cadre.gender.charAt(0).toUpperCase() +
            cadre.gender.slice(1).toLowerCase()
          : ""
        : "";
      
      // Set selected role for conditional rendering
      setSelectedRole(cadre.roleName);
      
      // Map assignedBoothSections to boothSections form field
      const boothSectionsMap: any = {};
      if (cadre.assignedBoothSections && cadre.assignedBoothSections.length > 0) {
        cadre.assignedBoothSections.forEach(assignment => {
          if (!assignment.fullBoothAssignment && assignment.sectionNumbers && assignment.sectionNumbers.length > 0) {
            boothSectionsMap[assignment.boothNumber] = assignment.sectionNumbers;
          }
        });
      }
      
      // Directly use the roleName from the cadre object
      form.setFieldsValue({
        volunteerId: cadre.volunteerId,
        userId: cadre.userId,
        firstName: cadre.firstName,
        lastName: cadre.lastName,
        mobileNumber: cadre.mobileNumber,
        whatsAppNumber: cadre.whatsAppNumber,
        email: cadre.email,
        assignedBooths: boothLabels.length > 0 ? boothLabels : null,
        boothSections: boothSectionsMap,
        assignedFamilies: cadre.assignedFamilies?.map((familyNo) => String(familyNo)) || undefined,
        gender: normalizedGender,
        status: cadre.status,
        roleName: cadre.roleName,
        remarks: cadre.remarks === "string" ? "" : cadre.remarks,
        "address.city": cadre.address?.city || "",
        "address.state": electionState,
        "address.postalCode": cadre.address?.postalCode || "",
      });
    } else {
      form.resetFields();
      setSelectedRole(undefined);
    }
  }, [cadre, form, election]);

  useEffect(() => {
    console.log("Election Data", election);
    console.log("Election", election?.electionName);
    console.log("Election state", electionState);
    form.setFieldsValue({
      "address.state": electionState,
    });
  }, [election, electionState, form]);

  // Fetch sections when booth is selected (for Booth Captain or Poll Captain roles)
  useEffect(() => {
    const fetchSections = async () => {
      const assignedBooths = form.getFieldValue('assignedBooths');
      console.log('fetchSections triggered:', { 
        selectedElectionId, 
        assignedBooths, 
        selectedRole,
        roleIncludesBooth: selectedRole?.toUpperCase().includes('BOOTH') || selectedRole?.toUpperCase().includes('POLL')
      });

      // Only fetch sections for Booth Captain or Poll Captain roles
      if (!selectedElectionId || !assignedBooths || !selectedRole || 
          !(selectedRole.toUpperCase().includes('BOOTH') || selectedRole.toUpperCase().includes('POLL'))) {
        setSections({});
        return;
      }

      try {
        setLoadingSections(true);
        let partNumbers: number[] = [];
        
        if (assignedBooths.some((b: any) => b.value === 'ALL')) {
          partNumbers = parts.map(part => Number(part.partNo));
        } else {
          partNumbers = assignedBooths.map((b: any) => Number(b.value));
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
  }, [form.getFieldValue('assignedBooths'), selectedRole, selectedElectionId, parts]);

  // Fetch families when booth/part is selected and role is Family Captain
  useEffect(() => {
    const fetchFamilies = async () => {
      const assignedBooths = form.getFieldValue('assignedBooths');
      console.log('fetchFamilies triggered:', { 
        selectedElectionId, 
        assignedBooths, 
        selectedRole,
        roleIncludesFamily: selectedRole?.toUpperCase().includes('FAMILY')
      });

      if (!selectedElectionId || !assignedBooths || !selectedRole || !selectedRole.toUpperCase().includes('FAMILY')) {
        setFamilies([]);
        return;
      }

      try {
        setLoadingFamilies(true);
        let partNumbers: number[] = [];
        
        if (assignedBooths.some((b: any) => b.value === 'ALL')) {
          partNumbers = parts.map(part => Number(part.partNo));
        } else {
          partNumbers = assignedBooths.map((b: any) => Number(b.value));
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
  }, [form.getFieldValue('assignedBooths'), selectedRole, selectedElectionId, parts]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        setButtonLoading(true);
        if (cadre) {
          let assignedBooths = values.assignedBooths?.map((b: any) => b.value);
          if (assignedBooths?.includes("ALL")) {
            assignedBooths = parts.map((p) => p.partNo);
          }

          // Construct assignedBoothSections if sections are specified
          let assignedBoothSections = undefined;
          if (values.boothSections && Object.keys(values.boothSections).length > 0) {
            assignedBoothSections = assignedBooths.map((boothNum: number) => ({
              boothNumber: boothNum,
              sectionNumbers: values.boothSections[boothNum] || [] // Empty array = entire booth
            }));
          }

          const updatedCadre: Cadre = {
            ...cadre,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            mobileNumber: values.mobileNumber,
            whatsAppNumber: values.whatsAppNumber,
            gender: values.gender,
            assignedBooths: assignedBooths,
            assignedBoothSections: assignedBoothSections,
            assignedFamilies: values.roleName?.toUpperCase().includes('FAMILY')
              ? (values.assignedFamilies || [])
                  .map((familyNo: string | number) => Number(familyNo))
                  .filter((familyNo: number) => !Number.isNaN(familyNo))
              : undefined,
            roleName: values.roleName,
            status: values.status,
            remarks: values.remarks || "",
            address: {
              // street: values["address.street"],
              city: values["address.city"],
              state: values["address.state"],
              postalCode: values["address.postalCode"],
              country: "India",
            },
          };
          onUpdate(updatedCadre);
        }
      })
      .catch((error) => {
        setButtonLoading(false);
      });
  };

  return (
    <>
      <Modal
        open={visible}
        title="Edit Cadre Details"
        onCancel={onCancel}
        onOk={handleOk}
        okText="Update"
        cancelText="Cancel"
        width={800}
        okButtonProps={{
          loading: buttonLoading,
          disabled: buttonLoading,
          style: {
            backgroundColor: "#1D4ED8",
            borderColor: "#1D4ED8",
            color: "white",
          },
        }}
        cancelButtonProps={{
          style: {
            backgroundColor: "#fff",
            color: "#000",
            borderColor: "#6B7280",
          },
        }}
      >
        <Form form={form} layout="vertical" onFinishFailed={handleFinishFailed}>
          <div className="grid grid-cols-2 gap-4">
            {/* First Row */}
            <Form.Item
              name="volunteerId"
              label={
                <>
                  Cadre ID <span className="text-red-500">*</span>
                </>
              }
            >
              <Input disabled className="input-element" />
            </Form.Item>

            <Form.Item
              name="mobileNumber"
              label={
                <>
                  Mobile Number <span className="text-red-500">*</span>
                </>
              }
            >
              <Input
                disabled
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
                className="input-element"
              />
            </Form.Item>

            <Form.Item
              label="Enter WhatsApp number"
              name="whatsAppNumber"
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

            {/* Second Row */}
            <Form.Item
              name="firstName"
              label={
                <>
                  First Name <span className="text-red-500">*</span>
                </>
              }
              rules={
                [
                  // {
                  //   pattern: /^[a-zA-Z\s]+$/,
                  //   message: "First name should only contain letters",
                  // },
                ]
              }
            >
              <Input className="input-element" />
            </Form.Item>

            <Form.Item
              name="lastName"
              label={
                <>
                  Last Name
                  {/* <span className="text-red-500">*</span> */}
                </>
              }
              rules={
                [
                  // {
                  //   pattern: /^[a-zA-Z\s]+$/,
                  //   message: "Last name should only contain letters",
                  // },
                ]
              }
            >
              <Input className="input-element" />
            </Form.Item>

            {/* Third Row */}
            <Form.Item
              name="email"
              label={
                <>
                  Email
                  {/* <span className="text-red-500">*</span> */}
                </>
              }
              rules={[
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <Input className="input-element" />
            </Form.Item>

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

            <Form.Item
              name="assignedBooths"
              label={
                <>
                  Booth Allocation <span className="text-red-500">*</span>
                </>
              }
              rules={[{ required: true, message: "Please select a booth!" }]}
            >
              <Select
                className="input-element"
                loading={loadingBooths}
                mode="multiple"
                placeholder={
                  loadingBooths ? "Loading booths..." : "Select a booth"
                }
                labelInValue
                value={
                  form
                    .getFieldValue("assignedBooths")
                    ?.some((b: any) => b.value === "ALL")
                    ? [{ key: "ALL", label: "All parts" }] // ✅ show only one label - match create form
                    : form
                        .getFieldValue("assignedBooths")
                        ?.map((boothNumber: number | string) => ({
                          key: boothNumber,
                          label: `Part ${boothNumber}`, // ✅ match create form label
                        }))
                }
                onChange={(values) => {
                  let updated = [...values];
                  const lastSelected = updated[updated.length - 1];

                  if (lastSelected?.value === "ALL") {
                    // If ALL picked → keep only ALL
                    updated = [
                      { key: "ALL", value: "ALL", label: "All parts" },
                    ];
                  } else if (
                    form
                      .getFieldValue("assignedBooths")
                      ?.some((b: any) => b.value === "ALL")
                  ) {
                    // If ALL was already selected → remove it
                    updated = updated.filter((v) => v.value !== "ALL");
                  }

                  form.setFieldsValue({ assignedBooths: updated });
                  
                  // Clear assignedFamilies when booth changes
                  if (selectedRole && selectedRole.toUpperCase().includes('FAMILY')) {
                    form.setFieldsValue({ assignedFamilies: undefined });
                  }
                }}
                showSearch
                filterOption={(input, option) =>
                  option?.children
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                }
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

            {/* Fourth Row */}
            <Form.Item
              name="status"
              label={
                <>
                  Status <span className="text-red-500">*</span>
                </>
              }
              // rules={[{ required: true, message: "Please select the status!" }]}
            >
              <Select className="input-element" placeholder="Select Status">
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Role"
              name="roleName"
              rules={[{ required: true, message: "Please select a role!" }]}
            >
              <Select
                placeholder={
                  loadingBooths ? "Loading Roles..." : "Select a Role"
                }
                className="input-element custom-select"
                onChange={(value) => {
                  setSelectedRole(value);
                  // Clear assignedFamilies when role changes
                  form.setFieldsValue({ assignedFamilies: undefined });
                }}
              >
                {roles.map((role) => (
                  <Option key={role.id} value={role.roleName}>
                    <strong> {role.roleName}</strong> - {role.description}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* Show family numbers dropdown only for Family Captain */}
            {selectedRole && selectedRole.toUpperCase().includes('FAMILY') && (
              <Form.Item
                label="Alloted Family Numbers"
                name="assignedFamilies"
                rules={[
                  {
                    required: true,
                    message: "Please select family numbers!",
                  },
                ]}
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
                    const optionText = String(option?.children ?? "").toLowerCase();
                    return optionText.includes(input.toLowerCase());
                  }}
                >
                  {families.map((family) => (
                    <Option key={family.familyId} value={String(family.familySequenceNumber)}>
                      {family.familySequenceNumber} - {family.firstMember?.name || 'Unknown'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </div>

          {/* Section Selection - Show only for Booth/Poll Captain roles */}
          {selectedRole && (selectedRole.toUpperCase().includes('BOOTH') || selectedRole.toUpperCase().includes('POLL')) && 
           form.getFieldValue('assignedBooths') && form.getFieldValue('assignedBooths').length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Select Sections (Optional - Leave empty to assign entire booth)
              </h4>
              {loadingSections ? (
                <div className="text-center py-4">
                  <Spin size="small" /> Loading sections...
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {form.getFieldValue('assignedBooths')
                    ?.filter((b: any) => b.value !== 'ALL')
                    .map((booth: any) => {
                      const boothNum = booth.value;
                      const sectionsForBooth = sections[boothNum] || [];
                      
                      if (sectionsForBooth.length === 0) return null;
                      
                      return (
                        <div key={boothNum} className="border border-gray-200 rounded p-3">
                          <div className="font-medium text-gray-800 mb-2">
                            Booth {boothNum} - Sections:
                          </div>
                          <Form.Item 
                            name={['boothSections', boothNum]} 
                            className="mb-0"
                          >
                            <Checkbox.Group className="flex flex-wrap gap-2">
                              {sectionsForBooth.map((section: SectionInfoOld) => (
                                <Checkbox 
                                  key={section.sectionNo} 
                                  value={section.sectionNo}
                                  className="border border-gray-300 rounded px-2 py-1"
                                >
                                  Section {section.sectionNo} ({section.voterCount} voters)
                                </Checkbox>
                              ))}
                            </Checkbox.Group>
                          </Form.Item>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea
              className="input-element"
              placeholder="Enter any remarks about the cadre"
              rows={4}
            />
          </Form.Item>

          {/* Address Section */}
          <div className="mt-4 mb-2 text-base font-medium">Address Details</div>

          {/* <Form.Item
          name="address.street"
          label="Street Address"
          // rules={[{ required: true, message: "Please input address!" }]}
        >
          <Input className="input-element" />
        </Form.Item> */}

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="address.city"
              label="City"
              rules={[
                // { required: true, message: "Please input city!" },
                {
                  pattern: /^[a-zA-Z\s]+$/,
                  message: "City should only contain letters",
                },
              ]}
            >
              <Input placeholder="Enter City" className="input-element" />
            </Form.Item>

            <Form.Item
              name="address.state"
              label="State"
              rules={[{ required: true, message: "Please select a state!" }]}
            >
              <Select
                className="input-element"
                placeholder="Select state"
                showSearch
                disabled
                filterOption={(input, option) =>
                  String(option?.children ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {stateOptions.map((state) => (
                  <Option key={state} value={state}>
                    {state}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="address.postalCode"
              label="Postal Code"
              rules={[
                // { required: true, message: "Please input postal code!" },

                {
                  pattern: /^[0-9]{6}$/,
                  message: "Please enter a valid 6-digit postal code",
                },
              ]}
            >
              <Input
                placeholder="Enter Postal Code"
                className="input-element"
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default EditCadreModal;
