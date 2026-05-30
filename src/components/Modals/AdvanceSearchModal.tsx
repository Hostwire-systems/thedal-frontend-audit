import { Modal, Input, Button, Form, Row, Col } from "antd";
import { useState } from "react";

interface AdvancedSearchModalProps {
  open: boolean;
  onClose: () => void;
  onClear: () => void;
  onSearch: (filters: {
    epic_number?: string;
    serial_number?: string;
    mobileNo?: string;
    voterFnameEn?: string;
    voterLnameEn?: string;
    age?: string;
    relationFirstNameEn?: string;
    relationLastNameEn?: string;
    house_no?: string;
  }) => void;
}

const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  open,
  onClose,
  onSearch,
  onClear,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const inputStyle = {
    height: "45px",
    width: "100%",
    borderRadius: "5px",
    border: "1px solid #A9A9A9",
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      console.log("Values for advance search", values);
      onSearch(values);
      form.resetFields();
      onClose(); // Close modal after search
    } catch (err) {
      console.error("Validation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Advance Search"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        {/* Row 1: Mobile Number */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="mobileNo"
              rules={[
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Mobile number must be 10 digits",
                },
              ]}
            >
              <Input placeholder="Mobile Number" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Part Number and Serial Number */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item name="partNumber">
              <Input placeholder="Part Number" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="serial_number">
              <Input placeholder="Serial Number" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: EPIC Id */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item name="epic_number">
              <Input placeholder="EPIC ID" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="house_no">
              <Input placeholder="House Number" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 4: Voter First Name and Last Name */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item name="voterFnameEn">
              <Input placeholder="Voter First Name" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="voterLnameEn">
              <Input placeholder="Voter Last Name" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 5: Relation First Name and Last Name */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item name="relationFirstNameEn">
              <Input placeholder="Relation First Name" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="relationLastNameEn">
              <Input placeholder="Relation Last Name" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 6: Age */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="age"
              rules={[
                {
                  pattern: /^[0-9]+$/,
                  message: "Age must be a number",
                },
              ]}
            >
              <Input placeholder="Age" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button
              type="primary"
              className="px-10 py-4"
              loading={loading}
              onClick={handleSearch}
            >
              Search
            </Button>

            <Button className="px-10 py-4" onClick={onClose}>
              Cancel
            </Button>
            <Button danger onClick={onClear}>
              Clear Filters
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdvancedSearchModal;
