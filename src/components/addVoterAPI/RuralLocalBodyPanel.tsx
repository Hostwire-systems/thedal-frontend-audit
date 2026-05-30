import { Col, Form, Input, Row } from 'antd';
import React from 'react'

const colWidths = {xs : 24, md : 12};

const RuralLocalBodyPanel = () => {
  return (
    <>
      <Row gutter={[16, 16]} className="w-full items-center mt-5 pb-5">
        <Col {...colWidths}>
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
            <Input
              className="input-element"
              placeholder="Enter District Union Number"
            />
          </Form.Item>
        </Col>

        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="rurDistrictUnionNameEn"
            label="District Union Name"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid District Union Name",
              },
            ]}
          >
            <Input
              className="input-element"
              placeholder="Enter District Union Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="rurDistrictUnionNameL1"
            label="District Union Name (L1)"
          >
            <Input
              className="input-element"
              placeholder="Enter District Union Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="rurDistrictUnionNameL2"
            label="District Union Name (L2)"
          >
            <Input
              className="input-element"
              placeholder="Enter District Union Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
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
            <Input
              className="input-element"
              placeholder="Enter District Union Ward Number"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col {...colWidths}>
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
            <Input
              className="input-element"
              placeholder="Enter Panchayat Union Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
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
            <Input
              className="input-element"
              placeholder="Enter Panchayat Union Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item name="panUnionNameL1" label="Panchayat Union Name (L1)">
            <Input
              className="input-element"
              placeholder="Enter Panchayat Union Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item name="panUnionNameL2" label="Panchayat Union Name (L2)">
            <Input
              className="input-element"
              placeholder="Enter Panchayat Union Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
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
            <Input
              className="input-element"
              placeholder="Enter Panchayat Union Ward Number"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col {...colWidths}>
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
            <Input
              className="input-element"
              placeholder="Enter Village Panchayat Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="villPanNameEn"
            label=" Village Panchayat Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Village Panchayat Name",
              },
            ]}
          >
            <Input
              className="input-element"
              placeholder="Enter Village Panchayat Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item name="villPanNameL1" label="Village Panchayat Name (L1)">
            <Input
              className="input-element"
              placeholder="Enter Village Panchayat Name"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col {...colWidths}>
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
            <Input
              className="input-element"
              placeholder="Enter Village Panchayat Ward Number"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

export default RuralLocalBodyPanel