import { Button, Col, Collapse, Form, message, Radio, Row, Spin } from "antd";
import { useState } from "react";
import Dragger from "antd/es/upload/Dragger";
import { InboxOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { indianStates as stateOptions } from "../../pages/welcome/step3/Step3";
import StateAndDistrictPanel from "../../components/addVoterAPI/StateAndDistrictPanel";
import PCACInfoPanel from "../../components/editVoterForm/panels/PCACInfoPanel";
import UrbanLocalBodyInfoPanel from "../../components/editVoterForm/panels/UrbanLocalBodyInfoPanel";
import RuralLocalBodyPanel from "../../components/addVoterAPI/RuralLocalBodyPanel";
import MemberInfoPanel from "./MemberInfoPanel";
import { addMemberApi, addMemberBulkApi } from "../../api/memberApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const { Panel } = Collapse; // Correct way to import Panel

const CreateMemberManager = () => {
  const [method, setMethod] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [activeKey, setActiveKey] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [form] = Form.useForm();
  const navigate = useNavigate();

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file: any) => {
      setFileList([file]);
      return false;
    },
    fileList,
  };

  const handleUpload = async () => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", fileList[0]);
    console.log("FileList[0]", fileList[0]);

    try {
      const response = await addMemberBulkApi(parseInt(selectedElectionId),formData);
      console.log("Response after bulk upload member",response);
      message.success("Upload successful");
      navigate("/memberList");
      setFileList([]);
      setIsLoading(false);
    } catch (error) {
      message.error("Upload failed");
      setIsLoading(false);
    }
  };

  const handleFinishFailed = ({ errorFields }: any) => {
    if (errorFields && errorFields.length > 0) {
      form.scrollToField(errorFields[0].name, {
        behavior: "smooth",
      });
    }
  };

  const handleFinish = async (values: any) => {
    setIsLoading(true);
    try {
      if (values) {
        let stateNameEn = values.state;
        const formData = { ...values, stateNameEn };
        const response = await addMemberApi(
          formData,
          parseInt(selectedElectionId)
        );

        form.resetFields();
        message.success("Member added successfully");
        setIsLoading(false);
        navigate("/memberList");
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5">
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={24}>
          <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
            Create Member
          </h3>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="w-full items-center mt-4">
        <Col xs={16} md={16}>
          <p className="text-[#6B7280] text-[16px] font-medium leading-6">
            Choose a method to add member
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
          {method === 0 ? (
            <div className="p-6 bg-white rounded-lg shadow w-full">
              <h2 className="text-2xl font-semibold mb-4">
                Member Bulk Upload
              </h2>
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
                {isLoading && <Spin size="small" className="custom-spin-dark mr-2" />}
                {isLoading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          ) : (
            <Form
              form={form}
              onFinishFailed={handleFinishFailed}
              onFinish={handleFinish}
              layout="vertical"
              className="w-full pb-6 pt-6 pr-6"
            >
              <div className="border-gray-300">
                <Collapse
                  activeKey={activeKey}
                  expandIconPosition="end"
                  bordered={false}
                  onChange={(keys) => setActiveKey(keys as string[])}
                  className="bg-transparent custom-collapse"
                  expandIcon={({ isActive }) => (
                    <PlusOutlined
                      rotate={isActive ? 45 : 0}
                      className="transition-transform  duration-200 text-gray-700"
                    />
                  )}
                >
                  <Panel
                    key="1"
                    header={
                      <div className="flex items-center justify-between">
                        <div className="relative flex items-center w-full">
                          <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                            Member Information
                          </span>
                        </div>
                      </div>
                    }
                    className="bg-white rounded-lg"
                  >
                    <MemberInfoPanel type={"add"} form={form} />
                  </Panel>
                  <Panel
                    key="2"
                    header={
                      <div className="flex items-center justify-between">
                        <div className="relative flex items-center w-full">
                          <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                            State & District Information
                          </span>
                        </div>
                      </div>
                    }
                    className="bg-white rounded-lg "
                  >
                    <StateAndDistrictPanel
                      type={"add-member"}
                      stateOptions={stateOptions}
                    />
                  </Panel>
                  <Panel
                    key="3"
                    header={
                      <div className="flex items-center justify-between">
                        <div className="relative flex items-center w-full">
                          <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                            PC & AC Information
                          </span>
                        </div>
                      </div>
                    }
                    className="bg-white rounded-lg "
                  >
                    <PCACInfoPanel type="add" />
                  </Panel>
                  <Panel
                    key="5"
                    header={
                      <div className="flex items-center justify-between">
                        <div className="relative flex items-center w-full">
                          <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                            Urban Local Body Information
                          </span>
                        </div>
                      </div>
                    }
                    className="bg-white rounded-lg "
                  >
                    {" "}
                    <UrbanLocalBodyInfoPanel type="add" />
                  </Panel>
                  <Panel
                    key="6"
                    header={
                      <div className="flex items-center justify-between">
                        <div className="relative flex items-center w-full">
                          <span className="relative header-text bg-transparent px-4 text-lg font-semibold text-gray-800 z-10">
                            Rural Local Body Information
                          </span>
                        </div>
                      </div>
                    }
                    className="bg-white rounded-lg "
                  >
                    <RuralLocalBodyPanel />
                  </Panel>
                </Collapse>
              </div>
              <Row gutter={[16, 16]} className="w-full mt-10" justify="center">
                <Col>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                    style={{ marginRight: 16 }}
                    disabled={isLoading}
                  >
                    {isLoading && <Spin size="small" className="custom-spin-dark mr-2" />}
                    {isLoading ? "Submitting..." : "Add Member"}
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default CreateMemberManager;
