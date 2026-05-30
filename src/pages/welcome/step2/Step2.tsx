import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Form, Input, Upload, message } from "antd";
import ImgCrop from "antd-img-crop";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile, UploadProps } from "antd/es/upload/interface";
import { updateProfileDetails } from "../../../redux/slices/userSlice";
import { updateUserData } from "../../../redux/slices/authSlice";
import type { AppDispatch, RootState } from "../../../redux/store";
import SubmitButton from "../SubmitButton";
import { uploadProfilePicture } from "../../../api/profileSettingsApi";

interface Step2Props {
  onFinish: (values: any, isSkipped?: boolean) => void;
  isUpdating: boolean;
}

const Step2: React.FC<Step2Props> = ({ onFinish, isUpdating }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { user } = useSelector((state: RootState) => state.auth);
  const { profileDetails } =
    useSelector((state: RootState) => state.userData) || {};

  useEffect(() => {
    console.log("user", user);
    const storedUserProfile = localStorage.getItem("userProfile");
    if (storedUserProfile) {
      const parsedUserProfile = JSON.parse(storedUserProfile);
      console.log("parsedUserProfile", parsedUserProfile);
      form.setFieldsValue({
        // firstName:parsedUserProfile.firstName,
        // lastName:parsedUserProfile.lastName,
        firstName: parsedUserProfile.fullName
          ? parsedUserProfile.fullName.split(" ")[0]
          : parsedUserProfile.firstName,
        lastName: parsedUserProfile.fullName
          ? parsedUserProfile.fullName.split(" ")[1]
          : parsedUserProfile.lastName,
        emailid: parsedUserProfile.emailid,
        mobile: parsedUserProfile.mobile,
        organizationName: parsedUserProfile.organizationName,
      });
      setImageUrl(parsedUserProfile.profilePic);
    } else if (user) {
      form.setFieldsValue({
        firstName: user.fullName.split(" ")[0],
        lastName: user.fullName?.split(" ")[1],
        emailid: user.email,
        mobile: user.mobileNumber,
      });
      setImageUrl(user.profilePic);
    }
  }, [user, form]);

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error("Image must smaller than 1MB!");
    }
    return isJpgOrPng && isLt1M;
  };

  const handleChange: UploadProps["onChange"] = (info) => {
          console.log("info", info);

    if (info.file.status === "uploading") {
      setUploading(true);
      return;
    }
    if (info.file.status === "done") {
      const reader = new FileReader();
      reader.readAsDataURL(info.file.originFileObj as RcFile);
      reader.onload = () => {
        setImageUrl(reader.result as string);
        setUploading(false);
      };
    }
  };

  const customUpload = async (options: any) => {
    const { onSuccess, onError, file } = options;
    try {
      const result = await uploadProfilePicture(file, setUploading);
      if (result.status === "success") {
        console.log("result ", result);
        const newImageUrl = result.data;
        console.log("New Image URL: ", newImageUrl);
        dispatch(updateProfileDetails({ profilePic: newImageUrl }));
        dispatch(updateUserData({ ...user, profilePic: newImageUrl }));
        onSuccess("Ok");
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      onError({ err });
      message.error("Failed to upload profile picture. Please try again.");
    }
  };

  const handleFinish = (values: any) => {
    const { firstName, lastName, ...rest } = values;

    const fullName = `${firstName || ""} ${lastName || ""}`.trim();

    const updatedValues = { ...rest, firstName, lastName, fullName };
    console.log("updatedValues", updatedValues);
    onFinish(updatedValues, false);
  };

  const handleSkip = () => {
    onFinish({}, true);
  };

  return (
    <div>
      <h2 className="font-bold text-[31px] pb-4 leading-8">
        Step 1 : Profile Setting
      </h2>
      <Form
        form={form}
        name="signup_form"
        layout="vertical"
        initialValues={{ ...profileDetails, ...user }}
        onFinish={handleFinish}
        className="mt-2"
      >
        <Form.Item label="Profile Photo" name="profilePhoto">
          <div>
            <ImgCrop
              rotate
              aspect={1 / 1}
              quality={0.8}
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop your Profile Picture</span>
                  <span
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      marginRight: "2rem",
                    }}
                  >
                    Size: 500x500 pixels
                  </span>
                </div>
              }
              modalWidth={500}
              showReset
              okText="Confirm"
              cancelText="Cancel"
              modalProps={{
                okButtonProps: {
                  style: {
                    backgroundColor: "#1677ff",
                    borderColor: "#1677ff",
                    color: "#fff",
                  },
                },
              }}
            >
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader my-2"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={customUpload}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="avatar" style={{ width: "100%" }} />
                ) : (
                  <div>
                    {uploading ? <UploadOutlined /> : <UserOutlined />}
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
            <div
              style={{
                color: "#999",
                fontSize: "12px",
                marginTop: "1rem",
                // textAlign: "center", // Center the paragraph if needed
              }}
            >
              <p>Image size should be less than 1MB.</p>
            </div>
          </div>
        </Form.Item>

        <Form.Item
          label="First Name"
          name="firstName"
          rules={[
            { required: true, message: "Please input your First Name!" },
            {
              pattern: /^[A-Za-z\s]+$/,
              message: "Name should only contain alphabets!",
            },
          ]}
        >
          <Input placeholder="Enter First Name" className="input-element" />
        </Form.Item>
        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[
            { required: true, message: "Please input your Last Name!" },
            {
              pattern: /^[A-Za-z\s]+$/,
              message: "Name should only contain alphabets!",
            },
          ]}
        >
          <Input placeholder="Enter Last Name" className="input-element" />
        </Form.Item>

        <Form.Item
          label="Login Mobile Number"
          name="mobile"
          rules={[
            { required: true, message: "Please input your Mobile Number!" },
            {
              pattern: /^[0-9]{10}$/,
              message:
                "Mobile number must be 10 digits and contain only numbers!",
            },
          ]}
        >
          <Input
            disabled
            placeholder="Enter Mobile Number"
            className="input-element"
            maxLength={10}
          />
        </Form.Item>
        <Form.Item
          label="Alternate Mobile Number"
          name="alternateMobile"
          rules={[
            // { required: true, message: "Please input your Alternate Mobile Number!" },
            {
              pattern: /^[0-9]{10}$/,
              message:
                "Mobile number must be 10 digits and contain only numbers!",
            },
          ]}
        >
          <Input
            placeholder="Enter Alternate Mobile Number"
            className="input-element"
            maxLength={10}
          />
        </Form.Item>

        <Form.Item
          label="Login Email ID"
          name="emailid"
          rules={[
            { required: true, message: "Please input your Email ID!" },
            { type: "email", message: "Please enter a valid email address!" },
          ]}
        >
          <Input
            disabled
            placeholder="Enter Email ID"
            className="input-element"
          />
        </Form.Item>
        <Form.Item
          label="Alternate Email ID"
          name="alternateEmailid"
          rules={[
            // { required: true, message: "Please input your Alternate Email ID!" },
            { type: "email", message: "Please enter a valid email address!" },
          ]}
        >
          <Input
            placeholder="Enter Alernate Email ID"
            className="input-element"
          />
        </Form.Item>

        <Form.Item
          label="Organization Name"
          name="organizationName"
          rules={[
            { required: true, message: "Please input your Organization Name!" },
            {
              pattern: /^[A-Za-z\s]+$/,
              message:
                "Organization Name should not contain numbers or symbols!",
            },
            {
              max: 50,
              message: "Organization Name should not exceed 50 characters!",
            },
          ]}
        >
          <Input
            type="text"
            placeholder="Enter Organization Name"
            className="input-element"
          />
        </Form.Item>

        <Form.Item>
            <SubmitButton
              step="step2"
              loading={isUpdating || uploading}
              onSkip={handleSkip}
            />
          </Form.Item>
      </Form>
      {/* <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          width:"100%",
          background: "#fff",
          // padding: "16px",
        }}
      >
        <SubmitButton
          step="step2"
          loading={isUpdating || uploading}
          onSkip={handleSkip}
        />
      </div> */}
    </div>
  );
};

export default Step2;
