import React, { useState } from "react";
import { Typography, Row, Col, Layout, message } from "antd";
import { useNavigate } from "react-router-dom";
import RightImage from "../../assets/images/image1.svg";
import logo from "../../assets/images/Thedal Logo Dec2024-cropped.svg";
import LoginForm from "./loginForm";
import ForgotPassword from "./forgotPassword";
import OtpVerification from "./otpVerification";
import { useDispatch } from "react-redux";
import { updateMobileNumber } from "../../redux/slices/authSlice";
import "./Login.css";

const { Title } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [isLoginPressed, setIsLoginPressed] = useState<boolean>(false);
  const [isLoginWithPass, setLoginWithPass] = useState<boolean>(false);

 

  const onFinish = (values: { mobileNumber: string }) => {
    
    // Dispatch the mobile number to Redux state
    dispatch(updateMobileNumber(values.mobileNumber));
    setLoginWithPass(true); // Indicate Login with password is set to be true by default on clicking login
    setIsLoginPressed(true); // Indicate Login button on first page was pressed
  };

  const handleOTPVerification = async (values: { otp: string }) => {
    console.log("OTP Verified:", values.otp);
  };

  return (
    <Layout style={{ height: "95vh", width: "100%", background: "#fff" }}>
      <Row gutter={[16, 16]} className="h-full p-3">
        <Col xs={24} md={12} style={{ padding: "10px" }}>
          <Row gutter={[16, 16]} className="w-full h-full justify-center">
            <Col span={24}>
              <Title
                level={2}
                onClick={() => navigate("/")}
                style={{ cursor: "pointer" }}
                className="logo"
              >
                <img src={logo} alt="Logo" className="logo-img" />
              </Title>
            </Col>
            <Col xs={24} md={12}>
              {!isLoginPressed && !isForgotPassword && (
                <>
                  <LoginForm onFinish={onFinish} />
                 
                </>
              )}
              {isLoginPressed && !isForgotPassword && (
                <OtpVerification
                  setIsLoginPressed={setIsLoginPressed}
                  isForgotPassword={isForgotPassword}
                  setIsForgotPassword={setIsForgotPassword}
                  isLoginWithPass={isLoginWithPass}
                  setLoginWithPass={setLoginWithPass}
                  handleOTPVerification={handleOTPVerification}
                />
              )}
              {isForgotPassword && (
                <ForgotPassword
                  setIsForgotPassword={setIsForgotPassword}
                  setIsLoginPressed={setIsLoginPressed}
                />
              )}
            </Col>
          </Row>
        </Col>
        <Col
          xs={0}
          md={12}
          style={{ height: "100%", overflow: "hidden", padding: "0" }}
          className="right-image-desktop"
        >
          <img
            src={RightImage}
            alt="image"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </Col>
      </Row>
    </Layout>
  );
};

export default Login;
