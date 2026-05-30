import { useState } from "react";
import { useDispatch } from "react-redux";
import { Form, Button, Input, message, Spin, Checkbox } from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  LoadingOutlined,
  PhoneOutlined,
  CaretDownOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import LoginPerson from "../../../assets/icons/Login-person.svg";
import LoginLock from "../../../assets/icons/Login-lock.svg";
import LoginOtpPhone from "../../../assets/icons/Login-otp-phone.svg";
import { loginWithPassword, sendLoginOtp } from "../../../api/authApi";
import { updateMobileNumber, updateUserData } from "../../../redux/slices/authSlice";
import { AppDispatch } from "../../../redux/store";
import { useNavigate } from "react-router-dom";
import { fetchProfile } from "../../../redux/slices/userSlice";

interface Props {
  mode: "password" | "otp";
  isOTPSent: boolean;
  setIsOTPSent: React.Dispatch<React.SetStateAction<boolean>>;
  setIsForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAccountInactive: React.Dispatch<React.SetStateAction<boolean>>;
  recaptchaToken: string | null;
  onLoginSuccess: (route: string) => void;
}

export default function LoginForm({ 
  mode, 
  isOTPSent, 
  setIsOTPSent, 
  setIsForgotPassword, 
  setIsAccountInactive,
  recaptchaToken,
  onLoginSuccess
}: Props) {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();

  const getPostLoginRoute = (role?: string | null) => {
    const normalizedRole = (role || "").toString().toUpperCase();
    return (normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN") 
      ? "/static-dashboard" 
      : "/cadre-info";
  };

  const handleSubmit = async (values: any) => {
    if (mode === "otp" && isOTPSent) return;
   

    const { mobileNumber, password } = values;
    dispatch(updateMobileNumber(mobileNumber));

    if (mode === "password") {
      try {
        if (!recaptchaToken) {
       message.warning("Please complete the CAPTCHA before logging in.");
       return;
     }
        setIsLoading(true);
        const response = await loginWithPassword(mobileNumber, password, setIsLoading);
        console.log("Response of login with password",response);
                if (response.success) {
          localStorage.setItem("jwtToken", response.data.accessToken);
          localStorage.setItem("userId", response.data.userId);
          localStorage.setItem("role", response.data.role);
          localStorage.setItem("onBoardStatus", String(response.data.onBoardStatus));
          
          dispatch(updateUserData(response.data));
          dispatch(fetchProfile());
          onLoginSuccess(getPostLoginRoute(response.data.role));
        } else {
          if (response.message && response.message.toLowerCase().includes("inactive")) {
          console.log("message",response.message.toLowerCase());
            setIsAccountInactive(true);
          } else {
            message.error(response.message || "Login failed");
          }
        }
      } catch (error) {
        console.error("Login failed", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // OTP mode
      try {
        setIsLoading(true);
        await sendLoginOtp(mobileNumber, setIsLoading);
        setIsOTPSent(true);

      } catch (error) {
        console.error("Failed to send OTP", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-form-wrapper">
      <Form
        form={form}
        name="login_form"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          label={mode === "password" ? "Mobile Number" : ""}
          name="mobileNumber"
          rules={[
            { required: true, message: "Please input your Mobile Number!" },
            { pattern: /^[0-9]{10}$/, message: "Mobile Number must be 10 digits!" },
          ]}
        >
         <Input
  className={mode === "otp" ? "otp-mobile-input" : ""}
  disabled={mode === "otp" && isOTPSent}
  prefix={
    mode === "password" ? (
      <>
        <img src={LoginPerson} alt="" className="login-input-icon" />
      </>
    ) : (
      <>
        <img src={LoginOtpPhone} alt="" className="login-input-icon" />
        <span className="country-code-section">
          +91 <CaretDownOutlined style={{ fontSize: 10, color: '#6b7280' }} />
        </span>
      </>
    )
  }
  placeholder="Enter Mobile Number"
/>
        </Form.Item>

        {mode === "password" && (
          <>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please input your Password!" }]}
            >
              <Input.Password
                prefix={<img src={LoginLock} alt="" className="login-input-icon" />}
                placeholder="••••••••"
              />
            </Form.Item>

            <div className="forgot-row">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox className="remember-me">Remember me</Checkbox>
              </Form.Item>
              <span 
                className="forgot-link" 
                style={{ cursor: 'pointer' }}
                onClick={() => setIsForgotPassword(true)}
              >
                Forgot password?
              </span>
            </div>
          </>
        )}

 {!(mode === "otp" && isOTPSent) && (
  <>
    <Form.Item style={{ marginBottom: 0 }}>
      <Button
        type="primary"
        htmlType="submit"
        className="cta-btn"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spin indicator={<LoadingOutlined spin style={{ color: '#fff' }} />} />
        ) : (
          mode === "password" ? <>Login <ArrowRightOutlined /></> : <>Send OTP →</>
        )}
      </Button>
    </Form.Item>
  </>
)}
      </Form>
    </div>
  );
}
