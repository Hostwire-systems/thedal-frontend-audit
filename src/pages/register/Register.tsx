import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/icons/Thedal-logo.svg";
import SignupForm from "./signupForm/SignupForm";
import OtpVerification from "./otpVerification";
import ThemeSwitcher from "../../components/auth/ThemeSwitcher";
import LeftBrandingPanel from "../../components/auth/LeftBrandingPanel";
import RegisterSuccessCelebration from "../../assets/icons/Register-check-celebration.svg";
import { 
  SafetyCertificateOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  UnlockOutlined,
  MailOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import "./Register.css"

const Signup: React.FC = () => {
  const [isOTPSent, setIsOTPSent] = useState<boolean>(false);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleOTPVerification = async (values: { otp: string }) => {};

  return (
    <div className="signup-page-wrapper">
      <LeftBrandingPanel />

      {/* RIGHT FORM PANEL */}
      <div className="signup-right-panel">
        {!isOtpVerified ? (
          <div className="form-container">
              <div className="signup-content-block">

            <div className="top-logo">
              <img src={logo} alt="Thedal Logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }} />
            </div>
            {!isOTPSent && (
              <>
                <h2 className="signup-h2">
                  Create Your <span>Account</span>
                </h2>
                <p className="signup-p">
                  Signup to continue to <span>Thedal App</span>
                </p>
                
                <SignupForm setIsOTPSent={setIsOTPSent} />

                <div className="safety-card">
                  <div className="icon-circle safety-icon-circle">
                    <SafetyCertificateOutlined />
                  </div>
                  <div>
                    <span className="safety-title">Your data is safe with us</span>
                    <span className="safety-subtitle">We use industry standard to keep your data secure</span>
                  </div>
                </div>

                <div className="login-hint">
                  Already have an account? <Link to="/login">Sign in</Link>
                </div>
              </>
            )}

            {isOTPSent && (
              <OtpVerification
                setIsOTPSent={setIsOTPSent}
                setIsOtpVerified={setIsOtpVerified}
              />
            )}
            </div>
          </div>
        ) : (
          <div className="success-screen-centered">
            <div className="success-container">
            <div className="success-icon-wrapper">
  <img
    src={RegisterSuccessCelebration}
    alt="Success"
    className="success-celebration-icon"
  />
</div>
              
              <h2 className="success-h2">
                Account Created <span>Successfully!</span>
              </h2>
              <p className="success-p">
                Welcome to Thedal App. Your account has been created successfully.
              </p>

              <div className="activation-card">
                <ClockCircleOutlined style={{ fontSize: 18, color: '#b45309', marginTop: 2 }} />
                <div className="activation-card-content">
                  <span className="activation-title">Account Status: Pending Activation</span>
                  <span className="activation-subtitle">
                    Your account is currently under admin approval. You will be able to access once activated.
                  </span>
                </div>
              </div>

              <div className="timeline-container">
                <h3 className="timeline-title">What happens next?</h3>
                <div className="timeline-steps">
                  <div className="timeline-step">
                    <div className="step-circle active">
                      <SafetyCertificateOutlined />
                    </div>
                    <span className="step-label">1. Admin verifies</span>
                  </div>
                  <div className="timeline-step">
                    <div className="step-circle">
                      <UnlockOutlined />
                    </div>
                    <span className="step-label">2. Access activated</span>
                  </div>
                  <div className="timeline-step">
                    <div className="step-circle">
                      <MailOutlined />
                    </div>
                    <span className="step-label">3. Confirmation</span>
                  </div>
                </div>
              </div>

              <div className="time-card">
                <CheckCircleFilled style={{ fontSize: 14 }} />
                Expected activation time: Within 24 hours
              </div>

              <Button
                type="primary"
                onClick={() => navigate("/login")}
                className="cta-btn"
              >
                Go to Login <ArrowRightOutlined />
              </Button>

              <p className="help-text">
                Need help? <a href="mailto:contact@thedal.co.in">contact@thedal.co.in</a>
              </p>
            </div>
          </div>
        )}

        <div className="fixed-footer">
          © Thedal App India Limited. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default Signup;
