import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  message,
  Radio,
  Tabs,
  Upload,
  Button,
  FormInstance,
  Row,
  Col,
} from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { RcFile, UploadFile } from "antd/es/upload";
import { addCasteBulkApi } from "../../api/casteApi";

const { TabPane } = Tabs;
const { Dragger } = Upload;

interface Religion {
  key: string;
  id: number;
  religionName: string;
  religionImage: string | null | File;
}

interface AddCasteModalProps {
  isModalVisible: boolean;
  closeModal: () => void;
  editingKey: string | null;
  handleSaveEdit: (values: any) => void;
  handleAddCaste: (values: any) => void;
  loading: boolean;
  form: FormInstance;
  religionId: string | null;
  setReligionId: (id: string | null) => void;
  setLoading: (value: boolean) => void;
  religions: Religion[];
  selectedElectionId: string;
  fetchCastesDataAfterAdd: () => void;
}

const AddCasteModal = ({
  isModalVisible,
  closeModal,
  editingKey,
  handleSaveEdit,
  handleAddCaste,
  loading,
  setLoading,
  form,
  religionId,
  setReligionId,
  religions,
  selectedElectionId,
  fetchCastesDataAfterAdd,
}: AddCasteModalProps) => {
  const [method, setMethod] = useState<0 | 1>(1);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      const isValid = validTypes.includes(file.type);
      if (!isValid) {
        message.error(`${file.name} is not a valid CSV/Excel file.`);
      }
      return isValid || Upload.LIST_IGNORE;
    },
    onChange: ({ fileList: updatedFileList }) => {
      setFileList(updatedFileList);
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/caste-template.csv";
    link.download = "caste-template.csv";
    link.click();
  };

  const handleBulkUpload = async () => {
    setLoading(true);
    if (fileList.length === 0) {
      message.error("Please select a file to upload");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", fileList[0]?.originFileObj as File);

      await addCasteBulkApi(parseInt(selectedElectionId), formData);
      message.success("Castes uploaded successfully");
      closeModal();
      fetchCastesDataAfterAdd();
    } catch (error: any) {
      message.error(error.message || "Failed to upload castes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingKey ? "Edit Caste" : "Add Caste"}
      open={isModalVisible}
      onCancel={closeModal}
      footer={null}
      width={800}
    >
      <div className="container mx-auto p-4">
        <Row gutter={[16, 16]} className="w-full items-center ">
          <Col span={10}>
            <p className="text-[#6B7280] text-[16px] font-medium leading-6">
              Choose a method to add caste
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

        <Row gutter={[16, 16]} className="w-full items-center mt-4">
          <Col span={24}>
            {method === 1 && (
              <Form form={form} layout="vertical">
                <Form.Item
                  name="casteName"
                  label={!editingKey ? "Caste Name" : "New Caste Name"}
                  rules={[
                    { required: true, message: "Caste name is required" },
                  ]}
                >
                  <Input placeholder={editingKey ? "" : "Caste name"} />
                </Form.Item>
                <Form.Item
                  name="religionId"
                  label="Religion"
                  rules={[
                    { required: true, message: "Please select a religion" },
                  ]}
                >
                  <Select
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    placeholder="Select Religion"
                    onChange={(value) => setReligionId(value || null)}
                    value={religionId}
                    allowClear
                  >
                    {religions.map((religion) => (
                      <Select.Option key={religion.id} value={religion.id}>
                        {religion.religionName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <div className="flex justify-end gap-4">
                  <Button onClick={closeModal}>Cancel</Button>
                  <Button
                    type="primary"
                    onClick={editingKey ? handleSaveEdit : handleAddCaste}
                    loading={loading}
                    disabled={loading}
                    style={{
                      backgroundColor: "#1D4ED8",
                      borderColor: "#1D4ED8",
                      color: "#fff",
                    }}
                  >
                    {editingKey ? "Save Changes" : "Add Caste"}
                  </Button>
                </div>
              </Form>
            )}

            {method === 0 && (
              <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4">
                  Caste Bulk Upload
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload your XLSX file containing caste records here.
                </p>
                <Dragger
                  {...uploadProps}
                  style={{
                    border: "2px dashed #1D4ED8",
                    borderRadius: "8px",
                    padding: "20px",
                    background: "#f0f5ff",
                  }}
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined
                      style={{ color: "#1D4ED8", fontSize: "48px" }}
                    />
                  </p>
                  <p className="ant-upload-text">
                    Drag & drop your CSV/Excel file here
                  </p>
                  <p className="ant-upload-hint">or</p>
                  <Button className="mt-2">Browse Files</Button>
                </Dragger>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">
                    Download Sample File
                  </h4>

                  <Button
                    icon={<DownloadOutlined />}
                    type="link"
                    onClick={handleDownloadTemplate}
                  >
                    Download Template
                  </Button>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <Button onClick={closeModal}>Cancel</Button>
                  <Button
                    type="primary"
                    onClick={handleBulkUpload}
                    loading={loading}
                    disabled={fileList.length === 0 || loading}
                    style={{
                      backgroundColor: "#1D4ED8",
                      borderColor: "#1D4ED8",
                      color: "#fff",
                    }}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default AddCasteModal;
