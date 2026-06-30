import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { SignupFormValues } from "../../../types";
import { Form, Modal, Button, Input, Divider, message } from "antd";
import GoogleIcon from "../../../assets/icons/google.svg";
import { signupUser, googleAuth } from "../../../api/authApi";
import { updateUserData } from "../../../redux/slices/authSlice";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { BASE_URL } from "../../../config";
import PrivacyPolicyModal from "../../../components/PrivacyPolicyModal";
import TermsOfServiceModal from "../../../components/TermsOfServiceModal";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = "6LcNeOUqAAAAAA-cdqTrToUgwJ8dCXFwl_CZKg7J";
const SECRET_KEY = "6LcNeOUqAAAAAKG2ssz53DYZBxXyEXv8gadm1QAW";

// Correctly type the dispatch function
export default function SignupForm({
  setIsOTPSent: setIsOTPSent,
}: {
  setIsOTPSent: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch: AppDispatch = useDispatch();
  const { status, error } = useSelector((state: RootState) => state.auth);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
   const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
   const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  

  // const userData = useSelector((state: RootState) => state.auth.user);

  // console.log(userData);
  const [form] = Form.useForm(); // Form instance for validation

  const showTermsModal = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleGoogleSignup = async () => {
    console.log("handleGoogle called");

    try {
      location.href = `${BASE_URL}/oauth2/authorization/google`;
    } catch (error) {
      console.error("Error during Google Signup:", error);
    }
  };


  const validateRecaptcha = async (token: string) => {
    try {
      const response = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: SECRET_KEY,
            response: token,
          }).toString(),
        }
      );

      const data = await response.json();
      console.log("reCAPTCHA verification result:", data);

      if (data.success) {
        setRecaptchaVerified(true);
        // message.success("reCAPTCHA verified successfully!");
      } else {
        setRecaptchaVerified(false);
        message.error("reCAPTCHA verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying reCAPTCHA:", error);
      setRecaptchaVerified(false);
    }
  };

  const handleSignup = async (values: SignupFormValues) => {
      if (!recaptchaToken) {
           message.warning("Please complete the CAPTCHA before logging in.");
           return;
         }
    const trimmedValues = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    };
    console.log("trimmedValues", trimmedValues);

    const response = await signupUser(trimmedValues, setIsRegistering);
    dispatch(updateUserData(trimmedValues));
    setIsOTPSent(true);
  };

  const handleFormChange = () => {
    // Check if all fields are filled and valid
    const values = form.getFieldsValue(); // Correctly define values here

    const isFieldValid = form
      .getFieldsError()
      .every(({ errors }) => errors.length === 0);

    const isAllFieldsFilled = Object.values(values).every(
      (value) => value !== undefined && value !== ""
    );
    setIsFormValid(isFieldValid && isAllFieldsFilled);
  };
  return (
    <div>
      <h2 className="font-bold text-[31px] leading-8">
        Start Your 30-Day Free Trial Today.
      </h2>
      <p className="text-[12px] font-normal leading-5 mt-1">
        NO CREDIT CARD REQUIRED!
      </p>
      <Button
        type="default"
        onClick={handleGoogleSignup}
        className="w-full my-[15px] h-[46px] border rounded text-[15px] font-medium leading-4 border-[#E5E7EB] hover:!bg-[#E5E7EB] hover:!text-[#2F3538] hover:!border-[#E5E7EB]"
      >
        <img src={GoogleIcon} alt="Google Icon" />
        Continue with Google
      </Button>
      <Divider orientation="center" className="!font-normal !text-[12px]">
        or with email
      </Divider>
      <Form
        form={form}
        name="signup_form"
        initialValues={{ remember: true }}
        onFieldsChange={handleFormChange}
        onFinish={handleSignup}
      >
        <Form.Item
          name="firstName"
          rules={[
            { required: true, message: "Please input your First Name!" },
            {
              pattern: /^[A-Za-z\s]+$/,
              message: "First Name can only contain letters",
            },
          ]}
        >
          <Input placeholder="First Name" className="input-element" />
        </Form.Item>
        <Form.Item
          name="lastName"
          rules={[
            { required: true, message: "Please input your Last Name!" },
            {
              pattern: /^[A-Za-z\s]+$/,
              message: "Last Name can only contain letters",
            },
          ]}
        >
          <Input placeholder="Last Name" className="input-element" />
        </Form.Item>
        <Form.Item
          name="mobile"
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
            placeholder="Mobile Number"
            className="input-element"
          />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: "Please input your Email ID!" },
            {
              type: "email",
              required: true,
              message: "Please enter a valid email address!",
            },
          ]}
        >
          <Input
            type="email"
            placeholder="Email ID"
            className="input-element"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Please input your Password!" },
            {
              pattern:
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message:
                "Password must contain uppercase, lowercase, number and special character",
            },
          ]}
        >
          <Input.Password placeholder="Password" className="input-element" />
        </Form.Item>
        <div className="flex justify-center my-4">
          <ReCAPTCHA
            sitekey={SITE_KEY}
            onChange={(token) => {
              setRecaptchaToken(token);
              validateRecaptcha(token);
            }}
            onExpired={() => {
              setRecaptchaVerified(false);
              setRecaptchaToken(null);
              handleFormChange();
            }}
          />
        </div>
        <Button
          type="primary"
          disabled={isRegistering || !isFormValid}
          htmlType="submit"
          className={`w-full bg-[#2F3538] h-[55px] font-bold text-[16px] leading-5 ${
            isFormValid
              ? `hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2
          hover:shadow-[0px_8px_16px_rgba(47,53,56,0.16)]`
              : `bg-[#d9d9d9] text-[#a3a3a3] cursor-not-allowed`
          }
        `}
        >
          {isRegistering ? (
            <Spin indicator={<LoadingOutlined spin />} size="large" />
          ) : (
            "Start My Free Trial"
          )}
        </Button>
      </Form>
      <p className="text-[10px] font-normal leading-5 mt-1">
        By Signing up to TEAM App, you agree to our{" "}
        <button
          type="button"
          className="text-blue-600 underline hover:text-blue-400"
          onClick={() => setIsPrivacyModalVisible(true)}
        >
          Privacy Policy
        </button>{" "}
        and{" "}
        <button
          type="button"
          className="text-blue-600 underline hover:text-blue-400"
          onClick={() => setIsTermsModalVisible(true)}
        >
          Terms of Service
        </button>
        .
      </p>

      <PrivacyPolicyModal
        isVisible={isPrivacyModalVisible}
        onClose={() => setIsPrivacyModalVisible(false)}
      />

      <TermsOfServiceModal
        isVisible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
      />
      {status === "loading" && <p>Signing up...</p>}
      {status === "failed" && <p>Error: {error}</p>}
    </div>
  );
}
