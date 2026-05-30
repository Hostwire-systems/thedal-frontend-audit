// CreatePart.tsx
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Radio,
  message,
  Form,
  Input,
  Button,
  Upload,
  Spin,
  Modal,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { InboxOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { addPartApi, addPartBulkApi } from "../../api/partApi";
import "./CreatePart.css";
import Dragger from "antd/es/upload/Dragger";
import { QRCodeCanvas } from "qrcode.react";
import ImgCrop from "antd-img-crop";
import { RcFile } from "antd/es/upload";
import FrozenElectionBanner from "../../components/FrozenElectionBanner";

interface BoothCommitteeMember {
  name: string;
  designation: string;
  mobileNumber: string;
}

const CreatePart: React.FC = () => {
  //Error
  const [partLatError, setPartLatError] = useState("");
  const [partLngError, setPartLngError] = useState("");
  const [schoolLatError, setSchoolLatError] = useState("");
  const [schoolLngError, setSchoolLngError] = useState("");

  //Lat and Long
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [schoolLatitude, setSchoolLatitude] = useState("");
  const [schoolLongitude, setSchoolLongitude] = useState("");

  const [isLocationValid, setIsLocationValid] = useState(false);
  const [partImage, setPartImage] = useState<RcFile | null>(null);
  const [googleMapLink, setGoogleMapLink] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [method, setMethod] = useState<number>(0);
  const [fileList, setFileList] = useState<any[]>([]);

  // Booth Committee Members state
  const [committeeMembers, setCommitteeMembers] = useState<BoothCommitteeMember[]>([]);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const validateDecimalPlaces = (value, min, max, setError) => {
    if (!value) {
      setError("");
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid number");
      return false;
    }

    if (numValue < min || numValue > max) {
      setError(`Value must be between ${min} and ${max}`);
      return false;
    }

    // Check decimal places (max 5)
    if (value.includes(".")) {
      const [, decimalPart] = value.split(".");
      console.log("Decimal part length", decimalPart);
      if (decimalPart?.length > 5) {
        setError("Maximum 5 decimal places allowed");
        return false;
      }
    }

    // If everything is fine, clear the error
    setError("");
    return true;
  };

  // const validateImageBeforeCrop = (file: RcFile) => {
  //   const isValidType =
  //     file.type === "image/jpeg" ||
  //     file.type === "image/png" ||
  //     file.type === "image/jpg";

  //   const isSizeValid = file.size / 1024 / 1024 < 1;

  //   if (!isValidType) {
  //     message.error("Only JPG, JPEG, or PNG files are allowed!");
  //     return false;
  //   }

  //   if (!isSizeValid) {
  //     message.error("File size must be less than 1MB!");
  //     return false;
  //   }

  //   return true;
  // };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    const filteredList = newFileList.filter((file: any) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg";
      const isSizeValid = file.size / 1024 / 1024 < 1;

      if (!isValidType) {
        return false;
      }
      if (!isSizeValid) {
        return false;
      }
      return true;
    });
    setFileList(filteredList);
    if (filteredList.length > 0) {
      setPartImage(filteredList);
    }
    if (newFileList.length === 0) {
      setPartImage(null);
    }
  };

  const handlePreview = async (file: any) => {
    if (!file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e?.target.result);
        reader.readAsDataURL(file.originFileObj);
      });
    }
    Modal.info({
      title: "Preview",
      content: (
        <img alt="file preview" style={{ width: "100%" }} src={file.preview} />
      ),
      onOk() {},
    });
  };

  // Updates latitude, longitude & Google Map link
  const handleCoordinateChange = (value, type, isSchool = false) => {
    const isLatitude = type === "latitude";
    const min = isLatitude ? -90 : -180;
    const max = isLatitude ? 90 : 180;

    const setError = isSchool
      ? isLatitude
        ? setSchoolLatError
        : setSchoolLngError
      : isLatitude
      ? setPartLatError
      : setPartLngError;

    if (validateDecimalPlaces(value, min, max, setError)) {
      if (isSchool) {
        if (isLatitude) setSchoolLatitude(value);
        else setSchoolLongitude(value);
      } else {
        if (isLatitude) setLatitude(value);
        else setLongitude(value);
      }
    } else {
      if (isSchool) {
        if (isLatitude) setSchoolLatitude("");
        else setSchoolLongitude("");
      } else {
        if (isLatitude) setLatitude("");
        else setLongitude("");
      }
    }
  };

  // Booth Committee Members handlers
  const handleAddCommitteeMember = () => {
    if (committeeMembers.length >= 15) {
      message.warning("Maximum 15 committee members allowed");
      return;
    }
    setCommitteeMembers([
      ...committeeMembers,
      { name: "", designation: "", mobileNumber: "" },
    ]);
  };

  const handleRemoveCommitteeMember = (index: number) => {
    const updatedMembers = committeeMembers.filter((_, i) => i !== index);
    setCommitteeMembers(updatedMembers);
  };

  const handleCommitteeMemberChange = (
    index: number,
    field: keyof BoothCommitteeMember,
    value: string
  ) => {
    const updatedMembers = [...committeeMembers];
    updatedMembers[index][field] = value;
    setCommitteeMembers(updatedMembers);
  };

  const validateCommitteeMembers = () => {
    for (let i = 0; i < committeeMembers.length; i++) {
      const member = committeeMembers[i];
      
      if (!member.name || member.name.trim() === "") {
        message.error(`Committee member ${i + 1}: Name is required`);
        return false;
      }
      
      if (member.name.length > 100) {
        message.error(`Committee member ${i + 1}: Name must be less than 100 characters`);
        return false;
      }
      
      if (!/^[a-zA-Z0-9\s]+$/.test(member.name)) {
        message.error(`Committee member ${i + 1}: Name must contain only letters, numbers, and spaces`);
        return false;
      }
      
      if (!member.designation || member.designation.trim() === "") {
        message.error(`Committee member ${i + 1}: Designation is required`);
        return false;
      }
      
      if (member.designation.length > 50) {
        message.error(`Committee member ${i + 1}: Designation must be less than 50 characters`);
        return false;
      }
      
      if (member.mobileNumber && member.mobileNumber.trim() !== "") {
        if (!/^[0-9]{10}$/.test(member.mobileNumber)) {
          message.error(`Committee member ${i + 1}: Mobile number must be exactly 10 digits`);
          return false;
        }
      }
    }
    return true;
  };

  const handleFormFinish = async (values: any) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    // Validate committee members if any exist
    if (committeeMembers.length > 0) {
      if (!validateCommitteeMembers()) {
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      console.log("values", values);
      const imageFile = fileList.length > 0 ? fileList[0].originFileObj : null;

      // Prepare committee members data - filter out empty entries
      const validCommitteeMembers = committeeMembers
        .filter(member => member.name.trim() !== "" && member.designation.trim() !== "")
        .map(member => ({
          name: member.name.trim(),
          designation: member.designation.trim(),
          mobileNumber: member.mobileNumber.trim() || undefined,
        }));

      // Add committee members to values
      const partData = {
        ...values,
        boothCommitteeMembers: validCommitteeMembers.length > 0 ? validCommitteeMembers : undefined,
      };

      const response = await addPartApi(
        parseInt(selectedElectionId),
        partData,
        imageFile
      );
      if (response.status === 200) {
        form.resetFields();
        setFileList([]);
        setCommitteeMembers([]);
        message.success("Part added successfully");
        setIsLoading(false);
        navigate("/part-list");
      }
    } catch (error) {
      setIsLoading(false);
      message.error("Failed to add part");
    }
  };

  const handleUpload = async () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0]);
    console.log("FileList[0]", fileList[0]);

    try {
      const response = await addPartBulkApi(
        parseInt(selectedElectionId),
        formData
      );
      message.success("Upload successful");
      setFileList([]);
      setIsLoading(false);
      navigate("/part-list");
    } catch (error) {
      message.error("Upload failed");
      setIsLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file: any) => {
      // const isCsv = file.type === 'text/csv';
      // if (!isCsv) {
      //   message.error('You can only upload CSV files!');
      //   return false;
      // }
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/templates/part-template.xlsx";
    link.download = "Part-template.xlsx";
    link.click();
  };

  useEffect(() => {
    if (latitude && longitude && !partLatError && !partLngError) {
      setGoogleMapLink(
        `https://www.google.com/maps?q=${latitude},${longitude}`
      );
      setIsLocationValid(true);
    } else {
      setGoogleMapLink("");
      setIsLocationValid(false);
    }
  }, [latitude, longitude, partLatError, partLngError]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-lg font-bold mb-6">Create Part</h1>
      {isFrozen && (
        <div className="mb-4">
          <FrozenElectionBanner variant="inline" />
        </div>
      )}

      {!isFrozen && (
        <>
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={10}>
              <p className="text-[#6B7280] text-[16px] font-medium leading-6">
                Choose a method to add part
              </p>
              <Radio.Group
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full mt-5 custom-radio-group"
              >
                <Radio value={0}>Bulk Upload</Radio>
                <Radio value={1}>Manual</Radio>
              </Radio.Group>
            </Col>
          </Row>
          <Row gutter={[16, 16]} className="w-full items-center mt-8">
            <Col span={24}>
              {method === 1 ? (
                <Form
                  form={form}
                  onFinish={handleFormFinish}
                  layout="vertical"
                  className="w-full max-w-4xl"
                >
              <Row gutter={[16, 16]} className="w-full items-center pb-5 mt-4">
                <Col span={12}>
                  <Form.Item name="partImage" label="Add Part Image">
                    <ImgCrop
                      rotate
                      aspect={1 / 1}
                      quality={0.8}
                      modalWidth={500}
                      showReset
                      // beforeCrop={validateImageBeforeCrop}
                      okText="Confirm"
                      cancelText="Cancel"
                      modalTitle={
                        <div className="flex justify-between items-center">
                          <span>Crop Part Image</span>
                          <span
                            style={{
                              color: "#999",
                              fontSize: "12px",
                              marginRight: "2rem",
                            }}
                          >
                            Size: 500x500 pixels
                          </span>
                        </div>
                      }
                      modalProps={{
                        okButtonProps: {
                          style: {
                            backgroundColor: "#1677ff",
                            borderColor: "#1677ff",
                            color: "#fff",
                          },
                        },
                      }}
                    >
                      <Upload
                        multiple={false}
                        name="partImage"
                        listType="picture-card"
                        onPreview={handlePreview}
                        onRemove={() => setFileList([])}
                        onChange={handleFileChange}
                        beforeUpload={(file) => {
                          const isValidType =
                            file.type === "image/jpeg" ||
                            file.type === "image/png" ||
                            file.type === "image/jpg";

                          if (!isValidType) {
                            message.error(
                              "Only JPG, JPEG, or PNG files are allowed!"
                            );
                            return Upload.LIST_IGNORE;
                          }

                          const isSizeValid = file.size / 1024 / 1024 < 1;
                          if (!isSizeValid) {
                            message.error("File size must be less than 1MB!");
                            return Upload.LIST_IGNORE;
                          }

                          return true;
                        }}
                        customRequest={dummyRequest}
                        accept="image/*"
                      >
                        {fileList.length < 1 && (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload Photo</div>
                          </div>
                        )}
                        {/* )} */}
                      </Upload>
                    </ImgCrop>
                  </Form.Item>
                  {fileList?.length === 0 ? (
                    <p className="text-xs font-medium text-gray-400 -mt-3">
                      Image size should not exceed 1 MB
                    </p>
                  ) : (
                    <p></p>
                  )}
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Part No
                      </span>
                    }
                    name="partNo"
                    rules={[
                      { required: true, message: "Please enter part number" },
                    ]}
                  >
                    <Input
                      placeholder="Enter part number"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Part Name English
                      </span>
                    }
                    name="partNameEnglish"
                    rules={[
                      {
                        required: true,
                        message: "Please enter part name in English",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter part name in English"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Part Name L1
                      </span>
                    }
                    name="partNameL1"
                    // rules={[
                    //   {
                    //     required: true,
                    //     message: "Please enter part name in local language",
                    //   },
                    // ]}
                  >
                    <Input
                      placeholder="Enter part name in local language"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Part Type
                      </span>
                    }
                    name="partType"
                  >
                    <Radio.Group className="w-full">
                      <Radio value="URBAN">Urban</Radio>
                      <Radio value="RURAL">Rural</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Part Location (Lat, Long)
                      </span>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="partLat"
                          rules={[
                            // { required: true, message: "Enter latitude" },
                            {
                              pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                              message:
                                "Please enter a valid latitude (-90 to 90)",
                            },
                          ]}
                          validateStatus={partLatError ? "error" : ""}
                          help={partLatError}
                        >
                          <Input
                            placeholder="Latitude"
                            type="number"
                            step="0.000001"
                            value={latitude}
                            className="input-element h-[45px]"
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Booth Latitude changed:", value); // Debug log
                              // validateDecimalPlaces(
                              //   e.target.value,
                              //   -90,
                              //   90,
                              //   setPartLatError
                              // );
                              handleCoordinateChange(
                                e.target.value,
                                "latitude"
                              );
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="partLong"
                          rules={[
                            // { required: true, message: "Enter longitude" },
                            {
                              pattern:
                                /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                              message:
                                "Please enter a valid longitude (-180 to 180)",
                            },
                          ]}
                          validateStatus={partLngError ? "error" : ""}
                          help={partLngError}
                        >
                          <Input
                            placeholder="Longitude"
                            type="number"
                            step="0.000001"
                            value={longitude}
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Booth Longitude changed:", value); // Debug log
                              // validateDecimalPlaces(
                              //   e.target.value,
                              //   -90,
                              //   90,
                              //   setPartLngError
                              // );
                              handleCoordinateChange(
                                e.target.value,
                                "longitude"
                              );
                            }}
                            className="input-element h-[45px]"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        School Name
                      </span>
                    }
                    name="schoolName"
                    // rules={[
                    //   { required: true, message: "Please enter school name" },
                    // ]}
                  >
                    <Input
                      placeholder="Enter school name"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        School Location (Lat, Long)
                      </span>
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="schoolLat"
                          rules={[
                            // { required: true, message: "Enter latitude" },
                            {
                              pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                              message:
                                "Please enter a valid latitude (-90 to 90)",
                            },
                          ]}
                          validateStatus={schoolLatError ? "error" : ""}
                          help={schoolLatError}
                        >
                          <Input
                            placeholder="Latitude"
                            type="number"
                            step="0.000001"
                            value={schoolLatitude}
                            className="input-element h-[45px]"
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Booth Latitude changed:", value); // Debug log
                              // validateDecimalPlaces(
                              //   e.target.value,
                              //   -90,
                              //   90,
                              //   setPartLatError
                              // );
                              handleCoordinateChange(
                                e.target.value,
                                "latitude",
                                true
                              );
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="schoolLong"
                          rules={[
                            // { required: true, message: "Enter longitude" },
                            {
                              pattern:
                                /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                              message:
                                "Please enter a valid longitude (-180 to 180)",
                            },
                          ]}
                          validateStatus={schoolLngError ? "error" : ""}
                          help={schoolLngError}
                        >
                          <Input
                            placeholder="Longitude"
                            type="number"
                            step="0.000001"
                            value={schoolLongitude}
                            onChange={(e) => {
                              const value = e.target.value;
                              console.log("Booth Longitude changed:", value); // Debug log
                              // validateDecimalPlaces(
                              //   e.target.value,
                              //   -90,
                              //   90,
                              //   setPartLngError
                              // );
                              handleCoordinateChange(
                                e.target.value,
                                "longitude",
                                true
                              );
                            }}
                            className="input-element h-[45px]"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Pincode
                      </span>
                    }
                    name="pincode"
                    rules={[
                      // { required: true, message: "Please enter pincode" },
                      {
                        pattern: /^[0-9]{6}$/,
                        message: "Pincode must be 6 digits",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter pincode"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                {isLocationValid && (
                  <>
                    <Col span={12} className="mt-4">
                      <Form.Item label="Google Maps Link (Part Location)">
                        <Input value={googleMapLink} readOnly />
                      </Form.Item>
                    </Col>

                    <Col span={12} className="mt-4">
                      <Form.Item label="QR Code (Part Location)">
                        <QRCodeCanvas value={googleMapLink} size={120} />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Part Captain Name
                      </span>
                    }
                    name="partCaptainName"
                    rules={[
                      {
                        required: false,
                        message: "Please enter part captain name ",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter part captain name"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Captain Designation
                      </span>
                    }
                    name="captainDesignation"
                  >
                    <Input
                      placeholder="Enter captain's designation"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Captain Mobile Number
                      </span>
                    }
                    name="captainMobileNo"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Mobile number must be 10 digits",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter captain's mobile number"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLO Name
                      </span>
                    }
                    name="bloName"
                  >
                    <Input
                      placeholder="Enter BLO name in English"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLO Designation
                      </span>
                    }
                    name="bloDesignation"
                  >
                    <Input
                      placeholder="Enter BLO desgination in English"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLO Mobile Number
                      </span>
                    }
                    name="bloMobileNumber"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Mobile number must be 10 digits",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter BLO's mobile number"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label={
                  <span className="text-[15px] font-medium text-[#1F2937]">
                    BLA-2 Name
                  </span>
                }
                name="bla2Name"
              >
                <Input
                  placeholder="Enter BLA-2 name"
                  className="input-element h-[45px]"
                />
              </Form.Item>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLA-2 Designation
                      </span>
                    }
                    name="bla2Designation"
                  >
                    <Input
                      placeholder="Enter BLA-2 desgination"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        BLA-2 Mobile Number
                      </span>
                    }
                    name="bla2MobileNumber"
                    rules={[
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Mobile number must be 10 digits",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter BLA-2's mobile number"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Booth Level Committee Details Section */}
              <Row gutter={[16, 16]} className="mt-6">
                <Col span={24}>
                  <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[16px] font-semibold text-[#1F2937]">
                        Booth Level Committee Details
                      </h3>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={handleAddCommitteeMember}
                        disabled={committeeMembers.length >= 15}
                        className="h-[40px]"
                      >
                        Add Member {committeeMembers.length > 0 && `(${committeeMembers.length}/15)`}
                      </Button>
                    </div>

                    {committeeMembers.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No committee members added yet</p>
                        <p className="text-sm mt-2">Click "Add Member" to add up to 15 committee members</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {committeeMembers.map((member, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-sm font-medium text-gray-600">
                                Member {index + 1}
                              </span>
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleRemoveCommitteeMember(index)}
                                size="small"
                              >
                                Remove
                              </Button>
                            </div>
                            <Row gutter={[16, 16]}>
                              <Col span={8}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  placeholder="Enter name"
                                  value={member.name}
                                  onChange={(e) =>
                                    handleCommitteeMemberChange(
                                      index,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="h-[40px]"
                                  maxLength={100}
                                />
                              </Col>
                              <Col span={8}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Designation <span className="text-red-500">*</span>
                                </label>
                                <Input
                                  placeholder="Enter designation"
                                  value={member.designation}
                                  onChange={(e) =>
                                    handleCommitteeMemberChange(
                                      index,
                                      "designation",
                                      e.target.value
                                    )
                                  }
                                  className="h-[40px]"
                                  maxLength={50}
                                />
                              </Col>
                              <Col span={8}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Mobile Number
                                </label>
                                <Input
                                  placeholder="Enter mobile number"
                                  value={member.mobileNumber}
                                  onChange={(e) =>
                                    handleCommitteeMemberChange(
                                      index,
                                      "mobileNumber",
                                      e.target.value
                                    )
                                  }
                                  className="h-[40px]"
                                  maxLength={10}
                                />
                              </Col>
                            </Row>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Col>
              </Row>

                  <Form.Item className="mt-6">
                    <Button
                      type="primary"
                      disabled={isLoading}
                      htmlType="submit"
                      className="h-[45px] px-8"
                    >
                      {isLoading && (
                        <Spin size="small" className="custom-spin-dark mr-2" />
                      )}
                      {isLoading ? "Submitting..." : "Submit"}
                    </Button>
                  </Form.Item>
                </Form>
              ) : (
                <div className="p-6 bg-white rounded-lg shadow w-full">
                  <h2 className="text-2xl font-semibold mb-4">Part Bulk Upload</h2>
                  <p className="text-gray-600 mb-6">
                    Upload a CSV file with part details here.
                  </p>

                  <Dragger
                    {...uploadProps}
                    className="mb-8"
                    style={{
                      border: "2px solid #1849D6",
                      borderRadius: "8px",
                      padding: "20px",
                      background: "#E7ECFC",
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined
                        style={{ color: "#1849D6", fontSize: "48px" }}
                      />
                    </p>
                    <p className="ant-upload-text text-lg">
                      Drag your CSV file to start uploading
                    </p>
                    <p className="text-gray-500">or</p>
                    <Button className="mt-2 text-[14px] font-normal text-[#1849D6] border-2 border-[#1849D6] rounded-lg hover:!bg-[#1849D6] hover:!text-white hover:border-[#1849D6] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]">
                      Browse files
                    </Button>
                  </Dragger>

                  <div className="mb-8">
                    <h4 className="mb-2 text-lg font-semibold">
                      Download Sample File
                    </h4>
                    <Button
                      type="link"
                      onClick={handleDownload}
                      className="p-0 text-blue-600 hover:text-blue-800"
                    >
                      Download Excel Template
                    </Button>
                  </div>

                  <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0 || isLoading}
                    className="bg-blue-600 mt-4 text-white font-semibold px-8 py-2 rounded hover:!bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
                  >
                    {isLoading && (
                      <Spin size="small" className="custom-spin-dark mr-2" />
                    )}
                    {isLoading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default CreatePart;
