import React from "react";
import { Button, Col, Form, Row, Spin } from "antd";

interface Props {
  onSkip: () => void;
  skipVisible?:boolean;
  step?: string;
  loading?: boolean;
}

export default function SubmitButton({step, onSkip,skipVisible=true, loading = false }: Props) {
  return (
    <Form.Item style={{ width: "100%" }}>
      <Row gutter={[16, 16]} className="sticky md:w-[70%] w-full">
        <Col xs={24} sm={12} md={10} lg={10} xl={10}>
          <Button
            type="primary"
            htmlType="submit"
            className="hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2
            hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] w-full my-[15px] h-[46px] border rounded text-[15px] font-medium leading-4"
            disabled={loading}
          >
            {loading ? (
              <Spin className="custom-spin-dark" size="small" />
            ) : step === "step1" ? (
              "Setup"
            ) : (
              "Next"
            )}
          </Button>
        </Col>
        {skipVisible && (
          <Col xs={24} sm={12} md={14} xl={14} lg={14}>
            <Button
              type="default"
              htmlType="button"
              onClick={onSkip}
              disabled={loading}
              className="w-full px-10 my-[15px] h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
            >
              Skip for now
            </Button>
          </Col>
        )}
      </Row>
    </Form.Item>
  );
}