import React, { useState } from "react";
import {
  Row,
  Col,
  Form,
  Input,
  Button,
  Upload,
  Select,
  AutoComplete,
  Card,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";

const ElectionCommissionDataPanel = ({
  handleBoothChange,
  handleSectionChange,
  handlePreview,
  setFileList,
  fileList,
  handleFileChange,
  validateImageBeforeCrop,
  dummyRequest,
  type,
  validateDecimalPlaces,
  //data for video
  handleVoterVideoUpload,
  handleVideoChange,
  videoFile,
  videoPreview,
  setVideoFile,
  setVideoPreview,
}) => {
  const [partLatError, setPartLatError] = useState("");
  const [partLngError, setPartLngError] = useState("");

  return (
    <>
      <Row gutter={[16, 16]} className="w-full items-center pb-5 mt-4">
        <Col span={12}>
          <Form.Item name="voterImage" label="Add Voter Photo">
            <ImgCrop
              rotate
              aspect={1 / 1}
              quality={0.8}
              modalWidth={500}
              beforeCrop={validateImageBeforeCrop}
              showReset
              okText="Confirm"
              cancelText="Cancel"
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop Voter Image</span>
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
                name="voterImage"
                listType="picture-card"
                fileList={fileList}
                onPreview={handlePreview}
                customRequest={dummyRequest}
                onRemove={() => setFileList([])}
                onChange={handleFileChange}
                // Handle image selection
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
        <Col span={12}>
          <Form.Item name="voterVideo" label="Add Voter Video">
            <Upload
              name="voterVideo"
              accept="video/*"
              maxCount={1}
              showUploadList={false}
              beforeUpload={handleVoterVideoUpload}
              onChange={handleVideoChange}
            >
              <Button icon={<UploadOutlined />}>Upload Video</Button>
            </Upload>
          </Form.Item>

          {!videoFile && (
            <p className="text-xs font-medium text-gray-400 -mt-3">
              Video size should not exceed 10 MB
            </p>
          )}

          {videoPreview && (
            <Card
              title="Video Preview"
              bordered={false}
              style={{
                marginTop: 16,
                position: "relative",
                padding: 0,
              }}
            >
              <div className="relative">
                <video
                  src={videoPreview}
                  controls
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "8px",
                    display: "block",
                  }}
                />
                <Button
                  danger
                  type="primary"
                  size="small"
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    zIndex: 10,
                  }}
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            </Card>
          )}
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={8}>
          <Form.Item
            name="boothNumber"
            label="Part Number"
            rules={[
              {
                required: true,
                message: "Please select or enter a part number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter part number"
              onChange={(e) => {
                const value = e.target.value;
                handleBoothChange(value);
              }}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="sectionNo"
            label="Section Number"
            rules={[
              {
                required: true,
                message: "Please select or enter a section number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter section number"
              onChange={(e) => {
                const value = e.target.value.trim();
                handleSectionChange(value);
              }}
              allowClear
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="serialNo"
            label="Serial Number"
            rules={[
              {
                required: true,
                message: "Please enter a Serial Number",
              },

              {
                pattern: /^\d+$/,
                message: "Please enter a valid Serial Number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Serial Number"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={8}>
          <Form.Item
            name="houseNoEn"
            label="House Number (English)"
            rules={[
              {
                required: true,
                message: "Please enter a House Number",
              },
              // {
              //   validator: (_, value) => {
              //     const numericValue = Number(value);
              //     if (isNaN(numericValue)) {
              //       return Promise.reject(
              //         new Error("Please enter a valid number")
              //       );
              //     }
              //     if (numericValue > 10000) {
              //       return Promise.reject(
              //         new Error("House Number must not exceed 10000")
              //       );
              //     }
              //     return Promise.resolve();
              //   },
              // },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter House Number"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="houseNoL1"
            label="House Number (L1)"
            rules={
              [
                // {
                //   validator: (_, value) => {
                //     if (!value) {
                //       return Promise.resolve();
                //     }
                //     const numericValue = Number(value);
                //     if (isNaN(numericValue)) {
                //       return Promise.reject(
                //         new Error("Please enter a valid number")
                //       );
                //     }
                //     if (numericValue > 10000) {
                //       return Promise.reject(
                //         new Error("House Number must not exceed 10000")
                //       );
                //     }
                //     return Promise.resolve();
                //   },
                // },
              ]
            }
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter House Number"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="houseNoL2"
            label="House Number (L2)"
            rules={
              [
                // {
                //   validator: (_, value) => {
                //     if (!value) {
                //       return Promise.resolve();
                //     }
                //     const numericValue = Number(value);
                //     if (isNaN(numericValue)) {
                //       return Promise.reject(
                //         new Error("Please enter a valid number")
                //       );
                //     }
                //     if (numericValue > 10000) {
                //       return Promise.reject(
                //         new Error("House Number must not exceed 10000")
                //       );
                //     }
                //     return Promise.resolve();
                //   },
                // },
              ]
            }
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter House Number"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="voterFnameEn"
            label="Voter First Name (English)"
            rules={[
              {
                required: true,
                message: "Please enter the voter first name",
              },
              type === "add"
                ? {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Please enter a valid First Name",
                  }
                : {},
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Voter First Name"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="voterLnameEn" label="Voter Last Name (English)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Voter Last Name"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={6}>
          <Form.Item name="voterFnameL1" label="Voter First Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Voter First Name"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="voterLnameL1" label="Voter Last Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Voter Last Name"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="voterFnameL2" label="Voter First Name (L2)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Voter First Name"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="voterLnameL2" label="Voter Last Name (L2)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Voter Last Name"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="rlnFnameEn"
            label="Relation First Name (English)"
            rules={[
              {
                required: true,
                message: "Please enter Relation First Name",
              },
              type === "add"
                ? {
                    pattern: /[A-Za-z\s]+$/,
                    message: "Please enter a valid Relation First Name",
                  }
                : {},
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation First Name"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="rlnLnameEn"
            label="Relation Last Name (English)"
            rules={[
              type === "add"
                ? {
                    pattern: /[A-Za-z\s]+$/,
                    message: "Please enter a valid Relation First Name",
                  }
                : {},
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation Last Name"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="rlnFnameL1" label="Relation First Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation First Name L1"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="rlnLnameL1" label="Relation Last Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation Last Name L1"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="rlnFnameL2" label="Relation First Name (L2)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation First Name L2"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="rlnLnameL2" label="Relation Last Name (L2)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation Last Name L2"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={6}>
          <Form.Item
            name="rlnType"
            label="Relation Type"
            rules={
              [
                // {
                //   required: true,
                //   message: "Please enter a Relation Type",
                // },
              ]
            }
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation Type "
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="epic_number"
            label="EPIC Id"
            rules={[
              { required: true, message: "Please enter the EPIC Id" },
              // {
              //   pattern: /^[a-zA-Z0-9]+$/,
              //   message: "Please enter a valid input",
              // },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              // disabled
              placeholder="Enter EPIC Id"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="pageNumber"
            label="Page Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Page Number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Page Number"
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: "Please select the gender" }]}
          >
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              placeholder="Select Gender"
              className={type === "add" ? "input-element custom-select" : ""}
            >
              <Select.Option value="male">Male</Select.Option>
              <Select.Option value="female">Female</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={8}>
          <Form.Item name="sectionNameEn" label="Section Name (English)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Section Name"
              disabled
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="sectionNameL1" label="Section Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Section Name L1"
              disabled
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="sectionNameL2" label="Section Name (L2)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Section Name(L2)"
              disabled
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item name="fullAddress" label="Full Postal Address">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Full Postal Address"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={8}>
          <Form.Item
            name="partNameEn"
            label="Part Name (English)"
            // rules={[
            //   type === "add"
            //     ? {
            //         pattern: /^[\p{L}\p{N}\s.,'-]*$/u,
            //         message: "Please entr a valid Part Name",
            //       }
            //     : {},
            // ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Part Name"
              disabled
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="partNameL1" label="Part Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Part Name L1"
              disabled
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="partNameL2" label="Part Name (L2)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Part Name L2"
              disabled
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={8}>
          <Form.Item
            name="pincode"
            label="Pincode"
            rules={[
              {
                pattern: /^[0-9]{6}$/,
                message: "Pincode must be 6 digits",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Pincode"
              disabled
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="partLati"
            label="Part Latitude"
            validateStatus={partLatError ? "error" : ""}
            help={partLatError}
            rules={[
              {
                pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/,
                message: "Please enter a valid latitude (-90 to 90)",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              onChange={(e) => {
                validateDecimalPlaces(e.target.value, -90, 90, setPartLatError);
              }}
              disabled
              placeholder="Enter Part Latitude"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="partLong"
            label="Part Longitude"
            validateStatus={partLngError ? "error" : ""}
            help={partLngError}
            rules={[
              {
                pattern: /^-?((1?[0-7]?|[0-9]?)[0-9]|180)(\.[0-9]{1,6})?$/,
                message: "Please enter a valid longitude (-180 to 180)",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Part Longitude"
              disabled
              onChange={(e) => {
                validateDecimalPlaces(e.target.value, -90, 90, setPartLngError);
              }}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default ElectionCommissionDataPanel;
