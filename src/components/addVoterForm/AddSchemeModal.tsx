import React, { useState } from "react";
import { Modal, Form, Input, Select, message, Upload, UploadFile } from "antd";
import { addBenefitSchemeApi } from "../../api/benefitSchemeApi";
import { UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { RcFile } from "antd/es/upload";

const { Option } = Select;

const AddSchemeModal = ({
  isOpen,
  onClose,
  onSchemeAdded,
  selectedElectionId,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = ({ fileList }: any) => {
    const filteredFileList = fileList.filter((file: any) => {
      const isSizeValid = file.size < 512 * 1024;

      if (!isSizeValid) {
        message.error("File size must be less than 512KB!");
        return false;
      }
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("You can only upload image files!");
      }
      return true;
    });
    console.log("Going to set file list",filteredFileList);
    setFileList(filteredFileList);
  };

  const handleAddScheme = async (values: any) => {
    const payload = {
      schemeName: values.schemeName,
      schemeBy: values.schemeBy,
    };
    const file = fileList[0]?.originFileObj;
    console.log("file", file);
    setLoading(true);
    try {
      const response = await addBenefitSchemeApi(
        payload,
        file,
        parseInt(selectedElectionId)
      );
      const newSchemeId = response.data?.id; // Assuming API returns the ID of the created scheme
      console.log("newSchemeId", newSchemeId);
      message.success("Benefit scheme created successfully");
      onSchemeAdded(newSchemeId);
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      console.error("Error creating benefit scheme", error);
      message.error("Failed to save benefit scheme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add Benefit Scheme"
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => handleAddScheme(values))
          .catch((errorInfo) => {
            console.error("Validation Failed:", errorInfo);
          });
      }}
      okButtonProps={{
        loading: loading,
        style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Benefit Scheme Name"
          name="schemeName"
          rules={[{ required: true, message: "Please enter the scheme name" }]}
        >
          <Input placeholder="Enter scheme name" />
        </Form.Item>
        <Form.Item
          label="Image Upload"
          name="file"
          required
          rules={[
            {
              validator: async (_, value) => {
                console.log("file list length", fileList);
                if (fileList.length === 0) {
                  throw new Error("Please upload an image");
                }
              },
            },
          ]}
        >
          <ImgCrop
            rotationSlider
            aspect={1 / 1}
            quality={0.8}
            modalWidth={512}
            // modalHeight={512}
            showReset
            okText="Confirm"
            cancelText="Cancel"
            modalTitle={
              <div className="flex justify-between items-center">
                <span>Crop Image</span>
                <span
                  style={{
                    color: "#999",
                    fontSize: "12px",
                    marginRight: "2rem",
                  }}
                >
                  Size: 512x512 pixels
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
              maxCount={1}
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => {
                return false;
              }}
              accept="image/*"
              listType="picture"
              className="image-upload-wrap"
            >
              {fileList.length === 0 && (
                <div
                  style={{
                    padding: "16px",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "4px",
                  }}
                >
                  <UploadOutlined
                    style={{ fontSize: "24px", marginBottom: "8px" }}
                  />
                  <div>Select Image</div>
                </div>
              )}
            </Upload>
          </ImgCrop>
        </Form.Item>
        {fileList?.length === 0 ? (
          <p className="text-xs font-medium text-gray-400 -mt-3 mb-2">
            Image size should not exceed 512 KB
          </p>
        ) : (
          <p></p>
        )}{" "}
        <Form.Item
          label="Scheme By"
          name="schemeBy"
          rules={[
            {
              required: true,
              message: "Please specify who offers this scheme",
            },
          ]}
        >
          <Select
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Select Scheme By"
          >
            <Option key="1" value="UNION_GOVT">
              Union Govt.
            </Option>
            <Option key="2" value="STATE_GOVT">
              State Govt.
            </Option>
            <Option key="3" value="LOCAL_BODY">
              Local Body
            </Option>
            <Option key="4" value="PARTY">
              Party
            </Option>
            <Option key="5" value="SELF">
              Self
            </Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddSchemeModal;
