import { Modal, Form, Input, message, Upload, Button } from "antd";
import { addAvailabilityApi } from "../../api/availabilityApi";
import { UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { useState } from "react";
import { RcFile } from "antd/es/upload";
interface AddSchemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvailabilityAdded: (availabilityId: number) => void;
  selectedElectionId: number | string;
}

const AddAvailabilityModal: React.FC<AddSchemeModalProps> = ({
  isOpen,
  onClose,
  onAvailabilityAdded,
  selectedElectionId, // Pass this from getAvailabilityApi
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const validateImageBeforeCrop = (file: RcFile) => {
    const isValidType =
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/jpg";

    const isSizeValid = file.size / 1024 / 1024 < 1;

    if (!isValidType) {
      message.error("Only JPG, JPEG, or PNG files are allowed!");
      return false;
    }

    if (!isSizeValid) {
      message.error("File size must be less than 1MB!");
      return false;
    }

    return true;
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    // Filter out any non-image files

    const filteredFileList = newFileList.filter((file: any) => {
      const isSizeValid = file.size < 512 * 1024;

      if (!isSizeValid) {
        message.error("File size must be less than 512KB!");
        return false;
      }
      if (file.type && !file.type.startsWith("image/")) {
        message.error(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });

    // Update form field
    form.setFieldsValue({ file: filteredFileList });
    setFileList(filteredFileList);
  };

  const handleAddAvailability = async (values: any) => {
    const dto = {
      description: values.description,
      categoryName: values.categoryName,
    };
    const file = fileList[0]?.originFileObj;
    setLoading(true);
    try {
      const response = await addAvailabilityApi(dto, file, selectedElectionId);
      if (response?.status === "success" && response?.code === 90134) {
        message.success(response?.message || "Availability added successfully");
        console.log("Add availability response", response.message);
        console.log("newAvailabilityId", response.data?.id);
        onAvailabilityAdded(response.data?.id); // Callback to refresh availability list or update state
        form.resetFields();
        setFileList([]);
        onClose();
      } else {
        message.error(response?.message || "Failed to add availability");
      }
    } catch (error) {
      console.error("Error adding availability:", error);
      message.error("An error occurred while adding availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add Category"
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      onOk={() => {
        form
          .validateFields()
          .then((values) => handleAddAvailability(values))
          .catch((errorInfo) => {
            console.error("Validation Failed:", errorInfo);
          });
      }}
      okButtonProps={{
        style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
        loading: loading,
        disabled: loading,
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={"Category Image"}
          name="file"
          required
          validateTrigger={["onChange", "onBlur"]}
          rules={[
            {
              validator: async (_, fileList) => {
                if (!fileList || fileList.length === 0) {
                  throw new Error("Please upload an image");
                }
              },
            },
          ]}
          valuePropName="fileList"
          getValueFromEvent={(e) => {
            if (Array.isArray(e)) {
              return e;
            }
            return e?.fileList;
          }}
        >
          {" "}
          <ImgCrop
            rotationSlider
            aspect={1 / 1}
            quality={0.8}
            modalWidth={512}
            beforeCrop={validateImageBeforeCrop}
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
              customRequest={dummyRequest}
              accept="image/*"
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>{"Select Image"}</Button>
            </Upload>
          </ImgCrop>
        </Form.Item>
        <Form.Item
          label="Category Name"
          name="categoryName"
          rules={[
            { required: true, message: "Please enter the category name" },
          ]}
        >
          <Input placeholder="Enter category name" />
        </Form.Item>
        <Form.Item
          label="Category Description"
          name="description"
          rules={[{ required: true, message: "Please enter the description" }]}
        >
          <Input placeholder="Enter category description" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddAvailabilityModal;
