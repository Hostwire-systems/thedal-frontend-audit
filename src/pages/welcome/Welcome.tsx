import React, { useState, useEffect } from "react";
import "./Welcome.css";
import { Typography, Row, Col, Layout, message } from "antd";
import { useNavigate } from "react-router-dom";
import RightImage from "../../assets/images/welcome.svg";
import logo from "../../assets/icons/Thedal-logo.svg";
import Step1 from "./step1/Step1";
import Step2 from "./step2/Step2";
import Step3 from "./step3/Step3";
import Step4 from "./step4/Step4";
import Step5 from "./step5/Step5";
import Step6 from "./step6/Step6";
import SubmitButton from "./SubmitButton";
import { SignupFormValues } from "../../types";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, updateProfileDetails } from "../../redux/slices/userSlice";
import {
  updateFullProfile,
  updateProfileSettings,
  updateUserProfile,
} from "../../api/profileSettingsApi";
import { updateUserData } from "../../redux/slices/authSlice";
import { RootState } from "../../redux/store";

const { Title } = Typography;

const steps = [Step1, Step2, Step3, Step4, Step5, Step6];

const Welcome: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const userId= localStorage.getItem("userId");
  const [updating, setUpdating] = useState(false);

  const StepComponent = steps[currentStep];
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {

    console.log("Welcome useEffect");
    console.log("window.history", window.history);
     if (window.history.state?.fromWelcome) {
       // If back navigation detected from /create-elections, redirect to /dashboard
       console.log(
         "Back navigation from /create-elections detected. Redirecting..."
       );
       navigate("/elections", { replace: true });
     }
    const storedStep = localStorage.getItem("currentStep");
    if (storedStep) {
      setCurrentStep(Number(storedStep));
    }
  }, []);

  const handleNextStep = () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    localStorage.setItem("currentStep", nextStep.toString());
  };

  const handleSkip = () => {};

  const onFinish = async (
    values: SignupFormValues,
    isSkipped: boolean = false
  ) => {
    if (currentStep === 0 || isSkipped) {
      handleNextStep();
      return;
    }

    if (currentStep < steps.length - 1) {
      if (currentStep === 1) {
        console.log("values", values);
        const profileDetails = {
          profilePic: values.profilePhoto?.file?.thumbUrl,
          fullName: values.fullName,
          emailid: values.emailid,
          alternateEmailId: values.alternateEmailid || "",
          mobile: values.mobile,
          alternateMobileNumber: values.alternateMobile || "",
          organizationName: values.organizationName,
        };
        console.log("profileDetails", profileDetails);
       
        try {
          const result = await updateProfileSettings(
            {
              fullName: values.fullName,
              email: values.emailid,
              mobileNumber: values.mobile,
              organizationName: values.organizationName,
              alternateEmailId: values.alternateEmailid || "",
              alternateMobileNumber: values.alternateMobile || "",
            },
            setUpdating
          );

          if (result.status === "success") {
            dispatch(updateProfileDetails(values));
            dispatch(
              updateUserData({
                ...user,
                fullName: values.fullName,
                email: values.emailid,
                mobileNumber: values.mobile,
                alternateEmailId: values.alternateEmailid || "", // Update to empty string if not provided
                alternateMobileNumber: values.alternateMobile || "", // Update to empty string if not provided
              })
            );


            handleNextStep();
          }
        } catch (err) {
          message.error("Failed to update profile. Please try again.");
        }
      } else if (currentStep === 2) {
        const payload = {
          ...values,
          countryCode: values.country,
        };
        payload.subscription = "FREE";
        delete payload["country"];
        try {
          const result = await updateFullProfile(payload, setUpdating);
          if (result.status === "success") {
            handleNextStep();
          }
        } catch (err) {
          message.error("Failed to update profile. Please try again.");
        }
      } else {
        handleNextStep();
      }
    } else {
      console.log("All steps completed");
      localStorage.removeItem("currentStep");
      dispatch(fetchProfile());
      console.log("About to redirect to /elections/create route");
      // window.location.href = "/elections/create";
      navigate("/elections/create", { state: { fromWelcome: true } });
    }
  };

  const progressValues = [25, 50, 75, 100];
  const currentProgress = Math.min(
    (currentStep + 1) * (100 / steps.length),
    100
  );

  return (
    // <Layout style={{ height: "100vh", width: "100%", background: "#fff" }}>
    // <>
    <Layout className="h-screen w-full bg-white">
      <Row gutter={[16, 16]} className="h-full ">
        <Col
          xs = {24}
          md = {12}
          lg = {12}
          xl = {12}
          className="max-h-[90vh] overflow-y-auto scroll-container"
          // className="max-h-[80%] overflow-y-auto scroll-container"
        >
          {/* <div className="flex-grow max-h-[90vh] overflow-y-auto scroll-container"> */}
            <Row
              gutter={[16, 16]}
              className="h-full w-full justify-center items-baseline"
            >
              <Col span={24}>
                <Title level={2}>
                  <img src={logo} alt="Logo" className="logo-img"/>
                </Title>
               
              </Col>
              <Col span={18} className="relative mb-5">
              <StepComponent onFinish={onFinish} isUpdating={updating} />
               {/* <div style={{display:"flex"}}> */}
              {currentStep !== 0 && currentStep !== 5 && (
                <div
                  className="
                    absolute w-full
                    md:right-[-16%] md:w-[33%] md:bottom-[70px]
                    xs:fixed xs:bottom-4 xs:left-0 xs:px-4
                    flex justify-end items-center
                  "
                >
                  <div className="flex w-full gap-1">
                    {progressValues.map((value, index) => (
                      <div
                        key={index}
                        className="h-1"
                        style={{
                          backgroundColor:
                            currentProgress >= value ? "#2563EB" : "#E5E7EB",
                          
                          height: "5px",
                          width: "100%",
                          marginRight:
                            index < progressValues.length - 1 ? "5px" : "0",
                        }}
                      />
                    ))}
                  </div>
                  <span className="ml-2">{`${Math.round(currentProgress)}%`}</span>
                </div>
              )}
            </Col>
            </Row>
          {/* </div> */}
          {/* <div
            className="sticky bottom-0 bg-white z-10 w-full flex justify-center items-center pt-3 "
          >
            <SubmitButton step="step2" loading={updating} onSkip={handleSkip} />
          </div> */}
        </Col>
        <Col xs = {0} md = {12} lg={12} xl={12} style={{ overflow: "hidden" }}>
          <img
            src={RightImage}
            alt="image"
            // style={{ width: "100%", height: "85%" }}
            style={{ width: "100%", height: "85%" }}
          />
        </Col>
        {/* <div
        style={{
          position: "fixed",
          bottom: "0",
          left: "5rem",
          width: "75%",
          background: "white",
          zIndex: 10,
          padding: "0 16px",
        }}
      > */}
        {/* <Row>
          <Col span={12}>
            <SubmitButton
              // step={currentStep}
              // loading={updating || uploading}
              onSkip={handleSkip}
            />
          </Col>
        </Row> */}
        {/* </div>  */}
      </Row>
      {/* Add Submit Button Outside Scrollable Area */}
    </Layout>
  );
};
{
  /* </> */
}

export default Welcome;
