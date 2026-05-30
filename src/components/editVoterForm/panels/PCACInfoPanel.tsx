import { Row, Col, Form, Input } from "antd";
interface PCACInfoPanelProps{
  type:string;
}

const colWidths = {xs: 24, sm : 12, md : 6};

const PCACInfoPanel = ({type}:PCACInfoPanelProps) => {
  return (
    <>
      <Row
        gutter={[16, 16]}
        className={`w-full items-center pb-5 ${type === "add" ? "mt-4" : ""}`}
      >
        <Col {...colWidths}>
          <Form.Item
            name="pcNo"
            label="PC Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid PC Number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter PC Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="pcNameEn"
            label="PC Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid PC Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter PC Name (English)"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="pcNameL1"
            label="PC Name (L1)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid PC Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter PC Name (L1)"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="pcNameL2"
            label="PC Name (L2)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid PC Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter PC Name (L2)"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col {...colWidths}>
          <Form.Item
            name="acNo"
            label="AC Number"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid AC Number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter AC Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="acNameEn"
            label="AC Name (English)"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid AC Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter AC Name (English)"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="acNameL1"
            label="AC Name (L1)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid AC Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter AC Name (L1)"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="acNameL2"
            label="AC Name (L2)"
            rules={[
              {
                pattern: /^[^0-9]*$/,
                message: "Please enter a valid AC Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter AC Name (L2)"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default PCACInfoPanel;
