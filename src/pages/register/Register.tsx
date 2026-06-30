import React, { useState } from "react";
import { Typography, Row, Col, Layout } from "antd";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/images/Thedal Logo Dec2024-cropped.svg";
import RightImage from "../../assets/images/image1.svg";
import SignupForm from "./signupForm/SignupForm";
import { SignupFormValues } from "../../types";
import OtpVerification from "./otpVerification";
import "./Register.css"

const { Title } = Typography;

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false);

  const onFinish = (values: SignupFormValues) => {
    console.log("Received values:", values);
    setIsOTPSent(true);
  };

  const handleOTPVerification = async (values: { otp: string }) => {};

  return (
    <Layout style={{ height: "100vh", width: "100%", background: "#fff" }}>
      <Row gutter={[16, 16]} className="h-full p-5">
        <Col xs = {24} md = {12}>
          <Row gutter={[16, 16]} className="w-full h-full justify-center">
            <Col span={24}>
              <Title level={2}><img src={logo} alt="Logo" className="logo-img"/></Title>
            </Col>
            <Col xs={24} md={12}>
              {!isOTPSent && <SignupForm setIsOTPSent={setIsOTPSent} />}
              {isOTPSent && (
                <OtpVerification
                  handleOTPVerification={handleOTPVerification}
                  setIsOTPSent={setIsOTPSent}
                />
              )}
            </Col>
            <Col span={24} className="text-center mb-6">
              <p className="text-[#616161]">
                Already a Member? <Link to="/login" className="font-medium text-[#212121]">LOG IN</Link>
              </p>
            </Col>
          </Row>
        </Col>
        <Col xs = {0} md = {12} style={{ height: "100vh", overflow: "hidden" }} className = "right-image-desktop">
          <img
            src={RightImage}
            alt="image"
            style={{ height: "100%", width: "100%", objectFit: "cover", display:"block"}}
          />
        </Col>
      </Row>
    </Layout>
  );
};

export default Signup;
