// SignupForm.tsx - Fixed validation logic
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import { SignupFormValues } from "../../../types";
import { Form, Button, Input, message, Checkbox } from "antd";
import { 
  LoadingOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  LockOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import RegisterPerson from "../../../assets/icons/Login-person.svg";
import RegisterLock from "../../../assets/icons/Login-lock.svg";
import RegisterPhone from "../../../assets/icons/Register-phone.svg";
import { Spin } from "antd";
import { signupUser } from "../../../api/authApi";
import { updateUserData } from "../../../redux/slices/authSlice";
import PrivacyPolicyModal from "../../../components/PrivacyPolicyModal";
import TermsOfServiceModal from "../../../components/TermsOfServiceModal";
// import ReCAPTCHA from "react-google-recaptcha";

// const SITE_KEY = "6LcNeOUqAAAAAA-cdqTrToUgwJ8dCXFwl_CZKg7J";

export default function SignupForm({
  setIsOTPSent,
}: {
  setIsOTPSent: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatch: AppDispatch = useDispatch();
  const { status, error } = useSelector((state: RootState) => state.auth);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  // const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const values = Form.useWatch([], form);

  useEffect(() => {
    const checkFormValidity = async () => {
      try {
        // Check if all required fields are filled
        const fullName = values?.fullName?.trim();
        const mobile = values?.mobile?.trim();
        const password = values?.password;
        const agreement = values?.agreement;

        // Validate each field
        const nameParts = fullName ? fullName.split(' ').filter((p: string) => p) : [];
        const isFullNameValid = nameParts.length >= 2;
        const isMobileValid = mobile && /^[0-9]{10}$/.test(mobile);
        const isPasswordValid = password && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
        const isAgreementChecked = agreement === true;

        // Also check if there are no form errors
        const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);

        const allValid = isFullNameValid && 
                        isMobileValid && 
                        isPasswordValid && 
                        isAgreementChecked &&
                        !hasErrors;
        
        setIsFormValid(allValid);
      } catch (err) {
        setIsFormValid(false);
      }
    };
    
    checkFormValidity();
  }, [values, form]);

  const handleSignup = async (values: any) => {
    // if (!recaptchaToken) {
    //   message.warning("Please complete the CAPTCHA before signing up.");
    //   return;
    // }

    const trimmedValues: SignupFormValues = {
      ...values,
      firstName: values.fullName.trim().split(' ').filter((p: string) => p)[0] || "",
      lastName: values.fullName.trim().split(' ').filter((p: string) => p).slice(1).join(' ') || "",
      mobile: values.mobile,
      email: `${values.mobile}@thedal.com`,
      password: values.password
    };

    await signupUser(trimmedValues, setIsRegistering);
    dispatch(updateUserData(trimmedValues));
    setIsOTPSent(true);
  };

  return (
    <div className="signup-form-wrapper">
      <Form
        form={form}
        name="signup_form"
        layout="vertical"
        initialValues={{ remember: true, agreement: false }}
        onFinish={handleSignup}
        requiredMark={false}
        validateTrigger="onChange"
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[
            { required: true, message: "Please input your Full Name!" },
            { min: 2, message: "Name must be at least 2 characters!" },
            {
              validator: (_, value) =>
                value && value.trim().includes(' ') && value.trim().split(' ').filter((p: string) => p).length >= 2
                  ? Promise.resolve()
                  : Promise.reject(new Error("Please enter both first and last name")),
            },
          ]}
        >
          <Input 
            prefix={<img src={RegisterPerson} alt="" className="signup-input-icon-person" />} 
            placeholder="Enter your Full Name" 
          />
        </Form.Item>

        <Form.Item
          label="Mobile Number"
          name="mobile"
          rules={[
            { required: true, message: "Please input your Mobile Number!" },
            { pattern: /^[0-9]{10}$/, message: "Mobile Number must be 10 digits!" },
          ]}
        >
          <Input
            prefix={<img src={RegisterPhone} alt="" className="signup-input-icon-phone" />}
            placeholder="Enter Mobile Number"
            maxLength={10}
          />
        </Form.Item>

        <Form.Item
          label="Create password"
          name="password"
          rules={[
            { required: true, message: "Please input your Password!" },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: "Password must contain uppercase, lowercase, number and special character",
            },
          ]}
        >
          <Input.Password 
            prefix={<img src={RegisterLock} alt="" className="signup-input-icon-lock" />} 
            placeholder="••••••••" 
          />
        </Form.Item>
        <span className="password-msg">
          Password must be at least 8 characters with a number and special character
        </span>

    <Form.Item
  name="agreement"
  valuePropName="checked"
  rules={[
    {
      validator: (_, value) =>
        value
          ? Promise.resolve()
          : Promise.reject(new Error("Should accept agreement")),
    },
  ]}
  style={{ marginTop: 10, marginBottom: 6 }}
>
  <Checkbox
    style={{
      fontSize: "12px",
      lineHeight: "18px",
      color: "#6b7280",
    }}
  >
    <span   style={{
      
        fontSize: "12px",
      }}>

    I agree to the{" "}
    </span>
    <span
      style={{
        color: "#1d4ed8",
        fontWeight: 500,
        cursor: "pointer",
        fontSize: "12px",
      }}
      onClick={(e) => {
        e.preventDefault();
        setIsPrivacyModalVisible(true);
      }}
    >
      Privacy Policy
    </span>{" "}
     <span   style={{
      
        fontSize: "12px",
      }}>

     and</span>{" "}
    <span
      style={{
        color: "#1d4ed8",
        fontWeight: 500,
        cursor: "pointer",
        fontSize: "12px",
      }}
      onClick={(e) => {
        e.preventDefault();
        setIsTermsModalVisible(true);
      }}
    >
      Terms of Service
    </span>
  </Checkbox>
</Form.Item>

        {/* <div className="captcha-box">
          <ReCAPTCHA
            sitekey={SITE_KEY}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
          />
        </div> */}

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            // disabled={isRegistering || !isFormValid || !recaptchaToken}
            disabled={isRegistering || !isFormValid }
            htmlType="submit"
            className="cta-btn"
          >
            {isRegistering ? (
              <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} />
            ) : (
             <>Create MyThedal <ArrowRightOutlined /></>
            )}
          </Button>
        </Form.Item>
      </Form>

      <PrivacyPolicyModal
        isVisible={isPrivacyModalVisible}
        onClose={() => setIsPrivacyModalVisible(false)}
      />

      <TermsOfServiceModal
        isVisible={isTermsModalVisible}
        onClose={() => setIsTermsModalVisible(false)}
      />
      
      {status === "failed" && (
        <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 8, fontSize: 11 }}>Error: {error}</p>
      )}
    </div>
  );
}