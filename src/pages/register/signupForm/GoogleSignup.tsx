import React, { useEffect, useState } from "react";
import {
  Typography,
  Row,
  Col,
  Layout,
  Form,
  Input,
  Button,
  Spin,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import logo from "../../../assets/images/Thedal Logo Dec2024-cropped.svg";
import RightImage from "../../../assets/images/image1.svg";
import "../Register.css";
import {
  googleProfileUpdate,
  verifyMobileOtp,
  resendOtp,
} from "../../../api/authApi";
import { updateUserData } from "../../../redux/slices/authSlice";
import { useDispatch } from "react-redux";

const { Title } = Typography;

const GoogleSignup: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [userData, setUserData] = useState<{ mobile: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [mobile,setMobile]=useState<string|null>(null);
  const [timer, setTimer] = useState(30);
  const dispatch= useDispatch();

  useEffect(() => {
    if (resendDisabled) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        if (timer === 0) setResendDisabled(false);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendDisabled, timer]);

  useEffect(() => {
    console.log("Form values changed:", form.getFieldsValue());
  }, [form]);

  const onFinish = async (payload: {
    password: string;
    mobile: string;
    email: string;
  }) => {
    setIsLoggingIn(true);
    console.log("payload", payload);
    try {
      await form.validateFields();
      await googleProfileUpdate(payload);
      setMobile(payload.mobile);
      setUserData({ mobile: payload.mobile });
      setStep(2);
    } catch (error) {
      console.error("Error setting password", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        document.getElementById(`otp-input-${index + 1}`)?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join("");
    try {
      if (!userData) {
        console.error("User data not found");
        return;
      }
      const response = await verifyMobileOtp(
        userData.mobile,
        otpValue,
        setIsVerifying
      );

      console.log("response after verifying otp", response?.data);
       if (response.success) {
                //message.success("OTP verified successfully!");
      
                // Store JWT in localStorage
                console.log(response.data);
                localStorage.setItem("jwtToken", response.data.accessToken);
                localStorage.setItem("userId", response.data.userId);
                const onBoardStatus = response.data.onBoardStatus;
      
                // Dispatch userData to Redux
                dispatch(updateUserData(response.data));
                console.log("onBoardStatus: ", onBoardStatus);
      
                if (onBoardStatus === 2) {
                  navigate("/welcome");
                } else {
                  // Navigate to the welcome page
                  navigate("/elections");
                }
              } else {
                message.error(response.message || "OTP verification failed");
              }
      navigate("/elections");
    } catch (error) {
      console.error("OTP verification failed", error);
    }
  };

  return (
    <Layout style={{ height: "95vh", background: "#fff", overflow: "hidden" }}>
      <Row gutter={[16, 16]} className="h-full p-5">
        <Col xs={24} md={12}>
          <Row gutter={[16, 16]} className="w-full h-full justify-center">
            <Col span={24}>
              <Title level={2}>
                <img src={logo} alt="Logo" className="logo-img" />
              </Title>
            </Col>

            <Col xs={24} md={12}>
              {step === 1 ? (
                <>
                  <Title level={3} className="mb-4">
                    Register a new Account
                  </Title>
                  <Form
                    form={form}
                    name="login_form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                  >
                    {/* Mobile Number */}
                    <Form.Item
                      name="mobile"
                      rules={[
                        {
                          required: true,
                          message: "Please input your Mobile Number!",
                        },
                        {
                          pattern: /^[0-9]{10}$/,
                          message: "Mobile Number must be 10 digits!",
                        },
                      ]}
                    >
                      <Input
                        prefix={
                          <span style={{ marginRight: "8px", color: "#999" }}>
                            +91
                          </span>
                        }
                        placeholder="Mobile Number"
                        className="input-element"
                      />
                    </Form.Item>

                    {/* email */}
                    <Form.Item
                      name="email"
                      rules={[
                        {
                          type: "email",
                          required: true,
                          message: "Please enter a valid email address!",
                        },
                      ]}
                    >
                      <Input
                        className="input-element"
                        placeholder="Enter email address"
                      />
                    </Form.Item>
                    {/* Password */}
                    <Form.Item
                      name="password"
                      rules={[
                        {
                          required: true,
                          message: "Please input your Password!",
                        },
                        {
                          pattern:
                            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                          message:
                            "Password must contain uppercase, lowercase, number and special character",
                        },
                      ]}
                    >
                      <Input.Password
                        placeholder="Password"
                        className="input-element"
                      />
                    </Form.Item>

                    {/* Login Button */}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={isLoggingIn}
                      className={`w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 ${
                        isLoggingIn
                          ? "bg-[#d9d9d9] text-[#a3a3a3] cursor-not-allowed"
                          : `hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.16)]`
                      }`}
                    >
                      {isLoggingIn ? (
                        <Spin indicator={<LoadingOutlined spin />} />
                      ) : (
                        "Signup"
                      )}
                    </Button>
                  </Form>
                </>
              ) : (
                <>
                  <h2 className="font-bold text-[32px] leading-8 mb-6">
                    Welcome!
                  </h2>
                  <p className="text-[16px] font-normal leading-5 mb-6">
                    <>
                      A text with One Time Password (OTP) has been sent to your
                      mobile number +91-{mobile}.{" "}
                    </>
                  </p>
                  <Form name="otp_form" onFinish={handleSubmit}>
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`otp-input-${index}`}
                          value={digit}
                          onChange={(e) => handleChange(e, index)}
                          maxLength={1}
                          className="otp-input text-center h-[62px] bg-[#F3F4F6]"
                          autoComplete="off"
                          inputMode="numeric"
                        />
                      ))}
                    </div>
                    <Button
                      type="primary"
                      htmlType="submit"
                      className="w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 mt-4"
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <Spin
                          indicator={<LoadingOutlined spin />}
                          size="large"
                        />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </Form>
                </>
              )}
            </Col>
          </Row>
        </Col>

        <Col xs={0} md={12} className="right-image-desktop">
          <img
            src={RightImage}
            alt="Side Image"
            className="w-full h-full object-cover"
          />
        </Col>
      </Row>
    </Layout>
  );
};

export default GoogleSignup;
