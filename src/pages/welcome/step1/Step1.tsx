import React, { useEffect } from "react";
import { Button, Col, Form, message, Row } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { SignupFormValues } from "../../../types";
import OneIcon from "../../../assets/icons/1.svg";
import TwoIcon from "../../../assets/icons/2.svg";
import ThreeIcon from "../../../assets/icons/3.svg";
import SubmitButton from "../SubmitButton";
import { fetchProfile } from "../../../redux/slices/userSlice";
import { RootState, AppDispatch } from "../../../redux/store";

interface Props {
  onFinish: (values: SignupFormValues) => void;
}

export default function Step1({ onFinish }: Props) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const userData = useSelector((state: RootState) => state.userData);

  useEffect(() => {
    dispatch(fetchProfile());
  }, []);

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (userData.status === 'loading') {
    return <div>Loading...</div>;
  }

  if (userData.status === 'failed') {
    return <div>Error loading profile details. Please try again.</div>;
  }

  return (
    <div className="flex flex-col gap-10 w-full">
      {userData.error && (
        <p className="text-yellow-600">Warning: {userData.error}</p>
      )}
      <h2 className="font-bold text-[64px] leading-[70px]">
        Welcome {userData.profileDetails?.firstName || "User"}
      </h2>
      <p className="text-[24px] font-normal leading-7">
        You're just one step away from Digital Politics
      </p>
      <Form
        name="signup_form"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        style={{ width: '100%' }}
      >
        <SubmitButton step="step1" onSkip={handleSkip} />
      </Form>
      <Row gutter={[16, 16]}>
        <Col span={18} className="border-[#111111] border rounded-2xl !p-4" style={{
            maxHeight: 'calc(100vh - 32px)', 
            overflowY: 'auto',              
            borderRadius: '16px',          
            padding: '16px',                
            margin: '16px',            
            boxSizing: 'border-box',        
          }}>
          <Row gutter={[16, { xs: 8, sm: 16, md: 24, lg: 32 }]} style={{flexWrap: 'wrap'}}>
            <Col xs={24} sm={12} md={8} lg={8} className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <img src={OneIcon} alt="1" />
              <p className="text-[16px] font-normal leading-6">
                Profile<br />Setting
              </p>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <img src={TwoIcon} alt="2" />
              <p className="text-[16px] font-normal leading-6">
                Election<br />Setting
              </p>
            </Col>
            <Col xs={24} sm={12} md={8} lg={8} className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <img src={ThreeIcon} alt="3" />
              <p className="text-[16px] font-normal leading-6">
                Campaign<br />Settings
              </p>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
}