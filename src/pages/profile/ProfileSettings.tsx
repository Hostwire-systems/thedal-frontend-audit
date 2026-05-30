import { useEffect, useState } from "react";
import { Button, Form, Input } from "antd";
import { useSelector } from "react-redux";

const ProfileSettings = ({ form, handleFinish,isLoading,setIsLoading, profileDetails, user }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const initialData = {
    ...profileDetails,
    alternateMobile: profileDetails.alternateMobileNumber,
    alternateEmailid: profileDetails.alternateEmailId,
  };

  // REMOVED PERMISSION CHECKS - QUICK FIX
  // const userRole = localStorage.getItem("role");
  // const rolesPermission = useSelector(
  //   (state: any) => state.auth.user?.rolePermission || {}
  // );
  // const isSuperAdminOrAdmin =
  //   userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  // const hasUpdatePermission = (module: string) =>
  //   rolesPermission?.[module]?.includes("U");

  const handleButtonClick = async () => {
    if (isEditMode) {
      setIsLoading(true);
      try {
        await form.validateFields();
        form.submit();
        setIsEditMode(false); // Disable editing after submission
      } catch (error) {
        console.log("Error updating profile:", error);
        setIsLoading(false);
      }
    } else {
      setIsEditMode(true); // Enable editing
    }
  };
  const onFinish = async (values) => {
    setIsLoading(true);
    try {
       await new Promise((resolve) => setTimeout(resolve, 1000));
      await handleFinish(values, 1); // Pass form data to handleFinish
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating basic profile", error);
      setIsLoading(false);
    } 
  };

  useEffect(() => {
    console.log("initialData", initialData);
    console.log("user", user);
  }, []);
  return (
    <>
      <h2 className="font-bold text-[20px] leading-8">Basic Profile</h2>
      <Button
        onClick={handleButtonClick}
        className={`absolute top-6 right-4 py-2 px-4 rounded-lg
    !bg-[#1D4ED8] !hover:bg-[#1E40AF] hover:opacity-70 !text-white z-10
     disabled:cursor-not-allowed`}
        loading={isLoading}
        disabled={isLoading}
        // REMOVED PERMISSION CHECK: (!isSuperAdminOrAdmin && !hasUpdatePermission("userProfile"))
      >
        {isEditMode || isLoading ? "Submit" : "Edit"}
      </Button>
      <div className="relative mt-8">
        <Form
          form={form}
          name="signup_form"
          layout="vertical"
          initialValues={{
            ...initialData,
            ...user,
            mobile: user?.mobileNumber ?? initialData.mobileNumber,
            emailid: user?.email ?? initialData.emailid,
          }}
          onFinish={onFinish}
          className="mt-2 w-full"
        >
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
            <Input
              placeholder="Enter First Name"
              disabled={!isEditMode}
              className="w-full max-w-xs"
            />
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
            <Input
              placeholder="Enter Last Name"
              disabled={!isEditMode}
              className="w-full max-w-xs"
            />
          </Form.Item>

          <Form.Item
            label="Login Mobile Number"
            name="mobile"
            className="hidden"
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
              className="w-full max-w-xs hidden"
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
              className="w-full max-w-xs"
              disabled={!isEditMode}
              maxLength={10}
            />
          </Form.Item>

          <Form.Item
            label="Login Email ID"
            name="emailid"
            className="hidden"
            rules={[
              { required: true, message: "Please input your Email ID!" },
              { type: "email", message: "Please enter a valid email address!" },
            ]}
          >
            <Input
              disabled
              placeholder="Enter Email ID"
              className="w-full max-w-xs hidden"
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
              disabled={!isEditMode}
              className="w-full max-w-xs"
            />
          </Form.Item>

          <Form.Item
            label="Organization Name"
            name="organizationName"
            rules={[
              {
                required: true,
                message: "Please input your Organization Name!",
              },
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
              disabled={!isEditMode}
              placeholder="Enter Organization Name"
              className="w-full max-w-xs"
            />
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default ProfileSettings;
