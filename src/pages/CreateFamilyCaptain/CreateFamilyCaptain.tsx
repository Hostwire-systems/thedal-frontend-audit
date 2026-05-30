import React, { useState, useEffect } from "react";
import { Row, Col, Select, message, Radio } from "antd";
import AddFamilyCaptainForm from "../../components/addFamilyCaptainForm/AddFamilyCaptainForm";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "antd/es/form/Form";
import FamilyCaptainBulkUpload from "../../components/familyCaptainBulkUpload/FamilyCaptainBulkUpload";
import { createFamilyCaptain } from "../../api/familyApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

const { Option } = Select;
const defaultCheckedList = ["Option 1", "Option 2"];
const plainOptions = ["Male", "Female", "Others"];

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  password: string;
  whats_app_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  assigned_families: string[];
  status: string;
  remarks: string;
  gender: string;
}

const CreateFamilyCaptain: React.FC = ({  }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = useForm();
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);
  const [method, setMethod] = useState<number>(0);
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const handleFinish = async (values: any) => {
    setButtonLoading(true);
    try {
      if (method === 1) {
        // Manual entry → call API directly
        if (!selectedElectionId) {
          message.error("Election ID missing!");
          return;
        }

        const payload: FormData = {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          mobile_number: values.mobile_number,
          whats_app_number: values.whats_app_number,
          password:values.password,
          gender: values.gender,
          status: values.status,
          remarks: values.remarks,
          assigned_families: values.assigned_families || [],
          address: {
            street: values.street || "",
            city: values.city,
            state: values.state,
            postal_code: values.postal_code,
            country: values.country,
          },
        };

        const response = await createFamilyCaptain(
          parseInt(selectedElectionId),
          payload
        );
        console.log("API response:", response);
        form.resetFields();
        navigate("/family-captain-list")
      } else if (method === 0) {
        // Bulk Upload → delegate to the bulk upload component
        form.resetFields();
      }
    } catch (error: any) {
      console.error("Error creating family captain:", error);
      message.error(
        error.response?.data?.message || "Failed to create Family Captain"
      );
    } finally {
      setButtonLoading(false);
    }
  };

  const onChange = (list: string[]) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  const onCheckAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedList(e.target.checked ? plainOptions : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-lg font-bold">Step 3 : Create Family Captain</h1>
      <Row gutter={[16, 16]} className="w-full items-center mt-4">
        <Col span={10}>
          <p className="text-[#6B7280] text-[16px] font-medium leading-6">
            Choose a method to add family captain
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
            <AddFamilyCaptainForm
              onFinish={handleFinish}
              form={form}
              checkedList={checkedList}
              plainOptions={plainOptions}
              setButtonLoading={setButtonLoading}
              buttonLoading={buttonLoading}
            />
          )}
          {method === 0 && <FamilyCaptainBulkUpload onFinish={handleFinish} />}
        </Col>
      </Row>
    </div>
  );
};

export default CreateFamilyCaptain;
