import { Button, Col, Form, Row, Steps } from "antd";
import { SignupFormValues } from "../../../types";

interface Props {
  onFinish: (values: SignupFormValues) => void;
}

const items = [
  {
    title: "Profile Setting",
  },
  {
    title: "Role Creation",
  },
  {
    title: "Campaign Setting",
  },
];

export default function Step6({ onFinish }: Props) {
  return (
    <Row gutter={[16, 16]} className="h-full p-5">
      <Col
        span={24}
        className="flex flex-col justify-center items-center gap-4"
      >
        <h2 className="font-bold text-[31px] leading-8 mb-6">Completed</h2>
        <Steps
          current={3}
          items={items}
          labelPlacement="vertical"
          className="custom-steps"
        />
        <p className="text-[#6B7280] text-[16px] font-medium leading-6">
          You have successfully setup your profile{" "}
        </p>
        <Form
          name="signup_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item className="!mb-0">
            <Button
              type="primary"
              htmlType="submit"
              className="hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2
          hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] px-20 w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5"
            >
              Setup Election
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );
}
