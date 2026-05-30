import React, { useState, useEffect } from "react";
import { Row, Col, Select, message, Radio } from "antd";
import { useSelector } from "react-redux";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import AddCadreForm from "../../components/addCadreForm";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "antd/es/form/Form";
import CadreBulkUpload from "../../components/cadreBulkUpload";
import FrozenElectionBanner from "../../components/FrozenElectionBanner";
import { addCadreFormApi } from "../../api/cadreApi";
import "./createCadre.css";
import { getAllElectionsApi } from "../../api/electionApi";
import axios from "axios";

const { Option } = Select;
const defaultCheckedList = ["Option 1", "Option 2"];
const plainOptions = ["Male", "Female", "Others"];

const CreateCadre: React.FC = ({ onFinish }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = useForm();
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);
  const [method, setMethod] = useState<number>(0);
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [cadreList, setCadreList] = useState<Array<any>>([]);
  const [buttonLoading, setButtonLoading] = useState<boolean>(false);
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const isFromSidebar = location.pathname === "/add-voter";

  const handleFinish = async (values) => {
    try {
      if (window.location.href.includes("/add-cadre")) {
        const response = await addCadreFormApi(values);
        console.log("response", response);
        if (response.status === "success") {
          form.resetFields();
          message.success(response.message);
          navigate("/cadre-list");
        }
      } else {
        onFinish(values);
        form.resetFields();
      }
    } catch (error) {
      console.error("Error", error);
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
      <h1 className="text-lg font-bold">Step 3 : Create Cadre</h1>
      {isFrozen && (
        <div className="mb-4 mt-4">
          <FrozenElectionBanner variant="inline" />
        </div>
      )}
      {!isFrozen && (
        <>
          <Row gutter={[16, 16]} className="w-full items-center mt-4">
            <Col span={10}>
              <p className="text-[#6B7280] text-[16px] font-medium leading-6">
                Choose a method to add cadre
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
                <AddCadreForm
                  onFinish={handleFinish}
                  form={form}
                  isStandalone={isFromSidebar}
                  onChange={onChange}
                  checkedList={checkedList}
                  cadreList={cadreList}
                  plainOptions={plainOptions}
                  setButtonLoading={setButtonLoading}
                  buttonLoading={buttonLoading}
                />
              )}
              {method === 0 && <CadreBulkUpload onFinish={handleFinish} />}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default CreateCadre;
