import { Row, Col, Form, Input, Select } from "antd";
interface StateAndDistrictPanelProps {
  stateOptions: string[];
  type: string;
}

const { Option } = Select;

const colWidths = { xs: 24, sm: 12, md: 6 };

const StateAndDistrictPanel = ({
  stateOptions,
  type = "add",
}: StateAndDistrictPanelProps) => {
  return (
    <>
      <Row gutter={[16, 16]} className="w-full mt-4 items-center pb-5">
        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="stateCode"
            label="State Code"
            rules={[
              {
                pattern: /^\d+$/,
                message: "Please enter a valid State Code",
              },
            ]}
          >
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter State Code"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item name="state" label="State Name (English)">
            <Select
              showSearch
              filterOption={(input, option) =>
                option?.children?.toLowerCase().includes(input.toLowerCase())
              }
              disabled={type !== "add-member" && type !== "edit-member"}
              className={
                type === "add" || type === "add-member"
                  ? "input-element custom-select"
                  : ""
              }
              placeholder="Select State"
            >
              {stateOptions.map((state: string) => (
                <Option key={state} value={state}>
                  {state}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="stateNameL1"
            label="State Name (L1)"
            rules={
              [
                // {
                //   pattern: /[A-Za-z\s]+$/,
                //   message: "Please enter a valid State Name",
                // },
              ]
            }
          >
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter State Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item
            name="stateNameL2"
            label="State Name (L2)"
            rules={
              [
                // {
                //   pattern: /[A-Za-z\s]+$/,
                //   message: "Please enter a valid State Name",
                // },
              ]
            }
          >
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter State Name"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full items-center pb-5">
        <Col {...colWidths}>
          <Form.Item
            name="districtCode"
            label="District Code"
            rules={
              [
                // {
                //   pattern: /^\d+$/,
                //   message: "Please enter a valid District Code",
                // },
              ]
            }
          >
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter District Code"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
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
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter District Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item name="districtNameL1" label="District Name (L1)">
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter District Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          {" "}
          <Form.Item name="districtNameL2" label="District Name (L2)">
            <Input
              className={
                type === "add" || type === "add-member" ? "input-element" : ""
              }
              placeholder="Enter District Name"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default StateAndDistrictPanel;
