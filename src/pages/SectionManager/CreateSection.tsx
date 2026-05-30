import React, { useState } from "react";
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
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import { addSectionApi, addSectionBulkApi } from "../../api/sectionApi";
import "./CreateSection.css";
import Dragger from "antd/es/upload/Dragger";
import FrozenElectionBanner from "../../components/FrozenElectionBanner";

const CreateSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [method, setMethod] = useState<number>(0);
  const [fileList, setFileList] = useState<any[]>([]);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const handleFormFinish = async (values: any) => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    setIsLoading(true);

    if (!selectedElectionId) {
      message.error("Please select an election first.");
      setIsLoading(false);

      return;
    }

    try {
      console.log("Form Values:", values);
      console.log("Election ID:", selectedElectionId);

      const response = await addSectionApi(
        parseInt(selectedElectionId),
        values
      );

      if (response.status === 200) {
        form.resetFields();
        message.success("Section added successfully");
        setIsLoading(true);

        navigate("/section-list");
      } else {
        message.error("Unexpected response status");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Failed to add section", error.response || error);
      message.error("Failed to add section");
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (isFrozen) {
      message.info("Current election is frozen. Changes are disabled.");
      return;
    }

    const formData = new FormData();
    setIsLoading(true);
    formData.append("file", fileList[0]);
    try {
      const response = await addSectionBulkApi(
        parseInt(selectedElectionId),
        formData
      );
      if (response.status === 200) {
        message.success("Upload successful");
        setFileList([]);
        setIsLoading(false);
        navigate("/section-list");
      }
    } catch (error) {
      setIsLoading(false);
      message.error("Upload failed");
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
    link.href = "/templates/Section Bulk Upload.xlsx";
    link.download = "Section Bulk Upload.xlsx";
    link.click();
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-lg font-bold mb-6">Add Section</h1>
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
                Choose a method to add section
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
                        Section No
                      </span>
                    }
                    name="sectionNo"
                    rules={[
                      {
                        required: true,
                        message: "Please enter section number",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter section number"
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
                        Section Name English
                      </span>
                    }
                    name="sectionNameEn"
                    rules={[
                      {
                        required: true,
                        message: "Please enter section name in English",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Enter section name in English"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <span className="text-[15px] font-medium text-[#1F2937]">
                        Section Name L1
                      </span>
                    }
                    name="sectionNameL1"
                  >
                    <Input
                      placeholder="Enter section name in local language"
                      className="input-element h-[45px]"
                    />
                  </Form.Item>
                </Col>
              </Row>
                  <Form.Item className="mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="h-[45px] px-8"
                      disabled={isLoading}
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
                  <h2 className="text-2xl font-semibold mb-4">
                    Section Bulk Upload
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Upload a CSV file with section details here.
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
                    <h4 className="text-lg font-semibold mb-2">
                      Download Sample File
                    </h4>
                    <Button
                      type="link"
                      onClick={handleDownload}
                      className="text-blue-600 hover:text-blue-800 p-0"
                    >
                      Download Excel Template
                    </Button>
                  </div>

                  <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0 || isLoading}
                    className="bg-blue-600 mt-4 hover:bg-blue-700 text-white font-semibold px-8 py-2 rounded  hover:text-white hover:border-blue-700 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)]"
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

export default CreateSection;
