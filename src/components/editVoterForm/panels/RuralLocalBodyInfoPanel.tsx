import React from "react";
import { Row, Col, Form, Input } from "antd";

const RuralLocalBodyInfoPanel = ({  }) => {
  return (
    <>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="rurDistrictUnionNo"
            label="District Union Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid District Union Number",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="rurDistrictUnionNameEn"
            label="District Union Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid District Union Name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="rurDistrictUnionNameL1"
            label="District Union Name (L1)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid District Union Name L1",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="rurDistrictUnionNameL2"
            label="District Union Name (L2)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid District Union Name L2",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="rurDistrictUnionWardNo"
            label="District Union Ward Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid District Union Ward Number",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="panUnionNo"
            label="Panchayat Union Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Panchayat Union Number",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="panUnionNameEn"
            label="Panchayat Union Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Panchayat Union Name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="panUnionNameL1"
            label="Panchayat Union Name (L1)"
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="panUnionNameL2"
            label="Panchayat Union Name (L2)"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="panUnionWardNo"
            label="Panchayat Union Ward Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Panchayat Union Ward Number",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="villPanNo"
            label="Village Panchayat Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Village Panchayat Number",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="villPanNameEn"
            label="Village Panchayat Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Village Panchayat Name",
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="villPanNameL1"
            label="Village Panchayat Name (L1)"
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col span={12}>
          <Form.Item
            name="villPanWardNo"
            label="Village Panchayat Ward Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Village Panchayat Ward Number",
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

export default RuralLocalBodyInfoPanel;
