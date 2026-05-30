import React, { useState, useRef } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Row,
  Col,
  Upload,
  Button,
  message,
} from "antd";
import { InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import type { FormInstance, InputRef, UploadFile } from "antd";
import { addSubcasteBulkApi } from "../../api/subCasteApi";

const { Dragger } = Upload;

interface AddSubCasteModalProps {
  isModalVisible: boolean;
  setIsCasteModalVisible: (visible: boolean) => void;
  closeModal: () => void;
  editingKey: string | null;
  handleSaveEdit: (values: any) => void;
  handleAddSubCaste: (values: any) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  form: FormInstance;
  selectedReligionId: string | null;
  setSelectedReligionId: (id: string | null) => void;
  religions: Religion[];
  castes: Caste[];
  selectedElectionId: string;
  fetchSubCastesDataAfterAdd: () => void;
}
interface Caste {
  key: string;
  id: number;
  casteName: string;
  religionId: number;
  orderIndex: number;
}

interface Religion {
  key: string;
  id: number;
  religionName: string;
  religionImage: string | null | File;
}

const AddSubCasteModal = ({
  isModalVisible,
  closeModal,
  editingKey,
  handleSaveEdit,
  handleAddSubCaste,
  loading,
  setLoading,
  form,
  religions,
  castes,
  selectedReligionId,
  setSelectedReligionId,
  setIsCasteModalVisible,
  selectedElectionId,
  fetchSubCastesDataAfterAdd,
}: AddSubCasteModalProps) => {
  const inputRef = useRef<InputRef>(null);
  const [method, setMethod] = useState<number>(1); // 1 = Manual, 0 = Bulk Upload
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps = {
    name: "file",
    multiple: false,
    maxCount: 1,
    fileList,
    beforeUpload: (file: UploadFile) => {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      const isValid = file.type ? validTypes.includes(file.type) : false;
      if (!isValid) {
        message.error(`${file.name} is not a valid CSV/Excel file.`);
      }
      return isValid || Upload.LIST_IGNORE;
    },
    onChange: (info: { fileList: UploadFile[] }) => {
      setFileList(info.fileList);
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "/templates/subcaste-template.csv";
    link.download = "subcaste-template.csv";
    link.click();
  };

  const handleBulkUpload = async () => {
    if (fileList.length === 0) {
      message.error("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", fileList[0].originFileObj as File);

      await addSubcasteBulkApi(parseInt(selectedElectionId), formData);
      message.success("Sub-Castes uploaded successfully");
      closeModal();
      fetchSubCastesDataAfterAdd();
    } catch (error: any) {
      message.error(error.message || "Failed to upload sub-castes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editingKey ? "Edit Sub-Caste" : "Add Sub-Caste"}
      open={isModalVisible}
      onCancel={closeModal}
      footer={null}
      width={800}
    >
      <div className="container mx-auto p-4">
        <Row gutter={[16, 16]} className="w-full items-center mt-4">
          <Col span={10}>
            <p className="text-[#6B7280] text-[16px] font-medium leading-6">
              Choose a method to add sub-caste
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
                  name="subCasteName"
                  label={!editingKey ? "Sub-Caste Name" : "New Sub-Caste Name"}
                  rules={[
                    { required: true, message: "Sub-caste name is required" },
                  ]}
                >
                  <Input ref={inputRef} placeholder="Subcaste name" />
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
                    onChange={(value) => setSelectedReligionId(value)}
                  >
                    {religions.map((religion) => (
                      <Select.Option key={religion.id} value={religion.id}>
                        {religion.religionName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="casteId"
                  label="Caste"
                  rules={[
                    { required: true, message: "Please enter the caste" },
                  ]}
                >
                  {castes.length > 0 ? (
                    <Select
                      showSearch
                      filterOption={(input, option) =>
                        option?.children
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      disabled={!selectedReligionId}
                      placeholder="Select Caste"
                    >
                      {castes.map((caste) => (
                        <Select.Option key={caste.id} value={caste.id}>
                          {caste.casteName}
                        </Select.Option>
                      ))}
                    </Select>
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        border: "1px solid #d9d9d9",
                        borderRadius: "4px",
                      }}
                    >
                      <Button
                        type="link"
                        disabled={!selectedReligionId}
                        onClick={() => setIsCasteModalVisible(true)}
                        style={{ padding: 0 }}
                      >
                        Click to Add.
                      </Button>
                    </div>
                  )}
                </Form.Item>

                <div className="flex justify-end gap-4">
                  <Button onClick={closeModal}>Cancel</Button>
                  <Button
                    type="primary"
                    onClick={editingKey ? handleSaveEdit : handleAddSubCaste}
                    loading={loading}
                    disabled={loading}
                    style={{ backgroundColor: "#1D4ED8", color: "white" }}
                  >
                    {editingKey ? "Save Changes" : "Add Sub-Caste"}
                  </Button>
                </div>
              </Form>
            )}

            {method === 0 && (
              <div className="p-4">
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
                    style={{ backgroundColor: "#1D4ED8", color: "white" }}
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

export default AddSubCasteModal;
