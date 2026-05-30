import { Row, Col, Form, Input } from "antd";
interface UrbanLocalBodyInfoPanel{
  type:string;
}

const colWidths = {xs : 24, sm : 12, md : 6};

const UrbanLocalBodyInfoPanel = ({ type }: UrbanLocalBodyInfoPanel) => {
  return (
    <>
      <Row
        gutter={[16, 16]}
        className={`w-full items-center pb-5 ${type === "add" ? "mt-4" : ""}`}
      >
        <Col {...colWidths}>
          <Form.Item
            name="urbanNo"
            label="Urban Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Urban Number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Urban Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="urbanNameEn"
            label="Urban Name"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Urban Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Urban Name (English)"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item name="urbanNameL1" label="Urban Name (L1)">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Urban Name (L1)"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="urbanWardNo"
            label="Urban Ward Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid Urban Ward Number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Urban Ward Number"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default UrbanLocalBodyInfoPanel;
