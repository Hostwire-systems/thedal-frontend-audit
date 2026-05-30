import React, { useState } from "react";
import { Modal, Form, Input, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { RcFile } from "antd/es/upload";
import { addHistory } from "../../api/historyApi";

interface AddHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHistoryAdded: (historyId: number) => void;
  selectedElectionId: number | string;
}

const AddHistoryModal: React.FC<AddHistoryModalProps> = ({
  isOpen,
  onClose,
  onHistoryAdded,
  selectedElectionId,
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = ({ fileList }: { fileList: any[] }) => {
    const filtered = fileList.filter((file) => {
      const isValidSize = file.size && file.size < 1024 * 1024; // 1MB
      const isImage = file.type?.startsWith("image/");
      if (!isValidSize) message.error("File size must be less than 1MB!");
      if (!isImage) message.error("Only image files allowed!");
      return isValidSize && isImage;
    });
    setFileList(filtered);
  };

  const handleAddHistory = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (fileList.length === 0) {
        message.error("Please upload an image");
        return;
      }

      const file = fileList[0]?.originFileObj as RcFile;
      const formData = new FormData();
      formData.append("voterHistoryName", values.voterHistoryName);
      formData.append("voterHistoryImage", file);

      const res = await addHistory(
        formData,
        parseInt(selectedElectionId as string)
      );
      onHistoryAdded(res?.data?.data?.id);
      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      console.error("Failed to add history", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add History"
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
        setFileList([]);
      }}
      onOk={handleAddHistory}
      okButtonProps={{
        loading,
        style: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8" },
      }}
      okText="Add"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="History Name"
          name="voterHistoryName"
          rules={[{ required: true, message: "Please enter history name" }]}
        >
          <Input placeholder="Enter history name" />
        </Form.Item>

        <Form.Item label="History Image" required>
          <ImgCrop
            rotate
            aspect={1 / 1}
            quality={0.8}
            modalWidth={512}
            showReset
            okText="Confirm"
            cancelText="Cancel"
            modalTitle={
              <div className="flex justify-between items-center">
                <span>Crop History Image</span>
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
              maxCount={1}
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              accept="image/*"
              listType="picture"
            >
              {fileList.length === 0 && (
                <div
                  style={{
                    padding: "16px",
                    border: "1px dashed #d9d9d9",
                    borderRadius: "4px",
                  }}
                >
                  <UploadOutlined style={{ fontSize: "24px" }} />
                  <div>Select Image</div>
                </div>
              )}
            </Upload>
          </ImgCrop>
          {fileList?.length === 0 && (
            <p className="text-xs font-medium text-gray-400 mt-1">
              Image size should not exceed 1 MB
            </p>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddHistoryModal;
