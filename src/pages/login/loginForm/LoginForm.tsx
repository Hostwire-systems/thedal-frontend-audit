// src/components/LoginForm.tsx

import { GoogleOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Input, Spin } from "antd";
import { IoIosArrowForward } from "react-icons/io";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { sendLoginOtp, googleAuth } from "../../../api/authApi";
import { updateMobileNumber } from "../../../redux/slices/authSlice";
import { AppDispatch } from "../../../redux/store";
import { BASE_URL, getBackendUrl, setActiveBackendUrl } from "../../../config";
import { LoadingOutlined } from "@ant-design/icons";
import GoogleIcon from "../../../assets/icons/google.svg";

interface Props {
  onFinish: (values: { mobileNumber: string }) => void;
}

export default function LoginForm({ onFinish }: Props) {
  const dispatch: AppDispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (values: { mobileNumber: string }) => {
    try {
      // Determine which backend to use based on phone number
      const backendUrl = getBackendUrl(values.mobileNumber);
      setActiveBackendUrl(backendUrl);
      
      // Call API to send OTP
      // await sendLoginOtp(values.mobileNumber, setIsLoading);
      // Store mobile number in Redux state
      dispatch(updateMobileNumber(values.mobileNumber));
      // Call the provided onFinish handler
      onFinish(values);
    } catch (error) {
      console.error("Error during login", error);
    }
  };

  const handleGoogleSignup = async () => {
    console.log("handleGoogle called");

    try {
      location.href = `${BASE_URL}/oauth2/authorization/google`;
    } catch (error) {
      console.error("Error during Google Signup:", error);
    } };

  return (
    <div className="w-full flex flex-col gap-3">
      <h2 className="!text-left font-bold text-[31px] leading-8">
        Welcome Back!
      </h2>
      <Form
        name="w-full signup_form"
        initialValues={{ remember: true }}
        onFinish={handleLogin}
      >
        <Form.Item
          name="mobileNumber"
          rules={[
            {
              required: true,
              message: "Please input your Mobile Number!",
            },
            {
              pattern: /^[0-9]{10}$/,
              message:
                "Mobile Number must be 10 digits and contain only numbers!",
            },
          ]}
        >
          <Input
            placeholder="Mobile Number"
            prefix={
              <span
                style={{
                  marginRight: "8px",
                  color: "#999",
                  borderColor: "#d9d9d9",
                }}
              >
                +91
              </span>
            }
            className="input-element"
          />
        </Form.Item>
        <Form.Item className="!mb-0">
          <Button
            type="primary"
            htmlType="submit"
            className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2
            hover:shadow-[0px_8px_16px_rgba(47,53,56,0.16)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spin indicator={<LoadingOutlined spin />} size="large" />
            ) : (
              "Login"
            )}
            <IoIosArrowForward className="ml-5" />
          </Button>
        </Form.Item>
      </Form>
      <p className="text-[10px] font-normal text-center leading-5 mt-1">
        For any support write to <a>contact@thedal.co.in</a>
      </p>
      <Divider orientation="center" className="!font-normal !text-[12px]">
        Or login via
      </Divider>
      <Button
        type="default"
        onClick={handleGoogleSignup}
        className="text-w-full my-[15px] h-[46px] border rounded text-[15px] font-medium leading-4 border-[#E5E7EB]
        hover:!bg-[#E5E7EB] hover:!text-[#2F3538] hover:!border-[#E5E7EB]"
      >
        <img src={GoogleIcon} alt="Google Icon" />
        Sign in with Google
      </Button>
    </div>
  );
}
