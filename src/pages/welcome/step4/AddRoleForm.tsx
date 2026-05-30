import React, { useState } from "react";
import { Button, Checkbox, Col, Form, Input, Row, message } from "antd";
import { useLoading } from "../../../context/LoadingContext";

interface AddRoleFormProps {
  onSave: (role: { roleName: string; permission: string[], description: string }) => void;
  onCancel: () => void;
}

export default function AddRoleForm({ onSave, onCancel }: AddRoleFormProps) {
  const [form] = Form.useForm();
  const {loading, setLoading} = useLoading();

  const getRoleDescription = (permissions: string[]) => {
    const allPermissions = ["BOOTH_MANAGEMENT", "CADRE_MANAGEMENT", "POLLING_MANAGEMENT", "VOTER_MANAGEMENT"];
    
    if (permissions.length === allPermissions.length) {
      return "Highest level of access";
    }
    if (permissions.includes("BOOTH_MANAGEMENT") && permissions.includes("CADRE_MANAGEMENT") && permissions.length === 2) {
      return "Full Constituency access";
    }
    if (permissions.includes("BOOTH_MANAGEMENT") && permissions.length === 1) {
      return "Manager with booth-level access";
    }
    return "Multiple booth Access";
  };

  const handleSubmit = async (values: any) => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      const description = getRoleDescription(values.permission);
      const payload = {
        roleName: values.roleName,
        permission: values.permission,
        description: description,
      };

      await onSave(payload);
      form.resetFields();
    } catch (error: any) {
      console.error('Role Save Error:', error.message);
      message.error("Failed to add role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#66666626] rounded-lg p-4">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Enter Role Name"
          name="roleName"
          rules={[{ required: true, message: "Please enter the role name!" }]}
        >
          <Input placeholder="Enter new role name" className="input-element" />
        </Form.Item>

        <Form.Item
          label="Select Role Responsibilities"
          className="text-[15px] text-[#1F2937] font-medium"
          name="permission"
          rules={[{ required: true, message: "Please select at least one responsibility!" }]}
        >
          <Checkbox.Group style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '10px' }}>
              <Checkbox value="BOOTH_MANAGEMENT" className="custom-checkbox">
                Booth management
              </Checkbox>
              <div className="text-[#666] text-[13px] ml-5">
                Manage booths and resources at the booth level.
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Checkbox value="CADRE_MANAGEMENT" className="custom-checkbox">
                Cadre management
              </Checkbox>
              <div className="text-[#666] text-[13px] ml-5">
                Manage political cadres and team members.
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Checkbox value="POLLING_MANAGEMENT" className="custom-checkbox">
                Polling management
              </Checkbox>
              <div className="text-[#666] text-[13px] ml-5">
                Manage polling data and operations.
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <Checkbox value="VOTER_MANAGEMENT" className="custom-checkbox">
                Voter management
              </Checkbox>
              <div className="text-[#666] text-[13px] ml-5">
                Manage voter data and registration.
              </div>
            </div>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
        <div className="sticky bottom-0 w-full bg-white p-4">
          <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
            <Col xs = {12} sm={6}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2
                hover:shadow-[0px_8px_16px_rgba(47,53,56,0.16)] text-white bg-[#2F3538] w-full h-[46px] border rounded text-[15px] font-medium leading-4"
              >
                Save
              </Button>
            </Col>
            <Col xs={12} sm={6}>
              <Button
                onClick={onCancel}
                className="hover:bg-[#F3F4F6] hover:text-[#1F2937] hover:border-[#D1D5DB] border-2
                hover:shadow-[0px_4px_6px_rgba(0,0,0,0.1)] text-[#1F2937] bg-white w-full h-[46px] border rounded text-[15px] font-medium leading-4"
              >
                Cancel
              </Button>
            </Col>
          </Row>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
}