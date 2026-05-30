import React from "react";
import { Row, Col, Form, Input, Select } from "antd";

const { Option } = Select;

const StateDistrictInfoPanel = () => {
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Delhi",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  const sortedStates = indianStates.sort();

  return (
    <>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={6}>
          <Form.Item
            name="stateCode"
            label="State Code"
            rules={[
              {
                pattern: /^[A-Za-z0-9\s]+$/,
                message: "Please enter a valid State Code",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="stateNameEn" label="State Name (English)">
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              disabled
            >
              {sortedStates.map((state) => (
                <Option key={state} value={state}>
                  {state}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="stateNameL1" label="State Name (L1)">
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="stateNameL2" label="State Name (L2)">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={6}>
          <Form.Item
            name="districtCode"
            label="District Number"
            rules={[
              // {
              //   pattern: /^\d+$/,
              //   message: "Please enter a valid District Number",
              // },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="districtNameEn"
            label="District Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid District Name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="districtNameL1"
            label="District Name (L1)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid District Name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name="districtNameL2"
            label="District Name (L2)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid District Name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StateDistrictInfoPanel;
