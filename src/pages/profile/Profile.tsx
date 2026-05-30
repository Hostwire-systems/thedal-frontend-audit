import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Avatar,
  Button,
  Input,
  Upload,
  message,
  Row,
  Col,
  Card,
  Skeleton,
  Form,
  Tabs,
  Switch,
} from "antd";
import ImgCrop from "antd-img-crop";
import {
  BarChartOutlined,
  CameraOutlined,
  LockOutlined,
  MoneyCollectOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ChangePasswordModal from "../../components/changePasswordModal";
import { RootState } from "../../redux/store";
import {
  fetchProfile,
  updateUserProfileDetails,
  uploadProfilePic,
  updateProfile,
  updateProfileDetails,
} from "../../redux/slices/userSlice";
import {
  fetchProfileDetails,
  fetchUserDetails,
  updateFullProfile,
  updateProfileSettings,
  updateUserOtpSetting,
  updateUserProfile,
} from "../../api/profileSettingsApi";
import ProfileSettings from "./ProfileSettings";
import { updateUserData } from "../../redux/slices/authSlice";
import BillingInformation from "./BillingInformation";

interface LocalProfile {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  profilePic?: string;
  organizationName?: string;
  billingAddress?: string;
  country?: string;
  state?: string;
  pincode?: string;
  gst?: string;
  subscription?: string;
  isTwoFactorEnabled: boolean;
}
const Profile: React.FC = () => {
  const dispatch = useDispatch();
  const userId = localStorage.getItem("userId");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [accountOtpEnabled, setAccountOtpEnabled] = useState<boolean>(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] =
    useState(false);
  const [localProfile, setLocalProfile] = useState<LocalProfile>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    profilePic: "",
    isTwoFactorEnabled: false,
  });

  //ProfileSettings.tsx
  const [updating, setUpdating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [billForm] = Form.useForm();
  const { TabPane } = Tabs;
  const { user } = useSelector((state: RootState) => state.auth);
  const { profileDetails } =
    useSelector((state: RootState) => state.userData) || {};

  // REMOVED PERMISSION CHECKS - QUICK FIX
  // const userRole = localStorage.getItem("role");
  // const rolesPermission = useSelector(
  //   (state: any) => state.auth.user?.rolePermission || {}
  // );
  // const isSuperAdminOrAdmin =
  //   userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  // const hasUpdatePermission = (module: string) =>
  //   rolesPermission?.[module]?.includes("U");

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetchUserDetails();
      const data = response.data;
      console.log("response.data", response.data);
      let status = response.data?.isTwoFactorEnabled;
      setLocalProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        mobileNumber: data.mobileNumber,
        email: data.email,
        profilePic: data?.profilePicture,
        isTwoFactorEnabled: status,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      message.error("Failed to load profile.");
    } finally {
      setLoading(false); // Stop loading
    }
  };
  useEffect(() => {
    console.log("profileDetails", profileDetails);
    fetchUserProfile();
    console.log("user",user);
  }, []);

  const handleEdit = async () => {
    if (isEditing) {
      setIsLoading(true);
      try {
        const profileData = {
          firstName: localProfile.firstName.trim(),
          lastName: localProfile.lastName.trim(),
          email: localProfile.email.trim(),
          mobileNumber: localProfile.mobileNumber,
        };
        console.log("profileData before editing", profileData);
        await updateUserProfile(userId!, profileData);
        message.success("Profile updated successfully");
        fetchUserProfile(); // Refresh profile data
        setIsEditing(false);
      } catch (error) {
        console.error("Error updating profile:", error);
        message.error("Error updating profile");
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log("Field changed:", name, value);
    setLocalProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = async (file: File) => {
    console.log("Profile picture change initiated with file:", file);
    if (!file) return false;

    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG files!");
      return false;
    }

    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error("Image must be smaller than 1MB!");
      return false;
    }

    // Convert file to Base64 for preview
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      console.log("File converted to base64, updating local state");

      try {
        console.log("Dispatching uploadProfilePic");
        dispatch(uploadProfilePic(file));
        // await dispatch(fetchProfile());
        //  await fetchUserProfile(userId);
        // message.success("Profile picture updated successfully");
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        message.error("Error uploading profile picture");
      }
      setLocalProfile((prev) => {
        const updatedProfile = {
          ...prev,
          profilePic: base64Image,
        };
        console.log(
          "Updated localProfile with new profile pic:",
          updatedProfile
        );
        return updatedProfile;
      });
    };
    reader.readAsDataURL(file);
    return false;
  };

  // ProflieSettings.tsx
  const handleFinish = async (values: any, step: number) => {
    setLoading(true);
    if (step === 1) {
      const { firstName, lastName, ...rest } = values;

      const fullName = `${firstName || ""} ${lastName || ""}`.trim();

      const updatedValues = { ...rest, firstName, lastName, fullName };
      console.log("updatedValues", updatedValues);
      const profileDetails = {
        firstName: updatedValues.firstName,
        lastName: updatedValues.lastName,
        email: updatedValues.emailid,
        alternateEmailId: updatedValues.alternateEmailid || "",
        mobileNumber: updatedValues.mobile,
        alternateMobileNumber: updatedValues.alternateMobile || "",
        organizationName: updatedValues.organizationName,
      };
      console.log("profileDetails", profileDetails);

      try {
        const result = await updateProfileSettings(profileDetails, setUpdating);
        if (result.status === "success") {
          dispatch(updateProfileDetails(values));
          dispatch(
            updateUserData({
              ...user,
              fullName: values.fullName,
              email: values.emailid,
              mobileNumber: values.mobile,
              alternateEmailId: values.alternateEmailid || "",
              alternateMobileNumber: values.alternateMobile || "",
            })
          );
          message.success("Basic Profile updated successfully!");
        }
      } catch (err) {
        message.error("Failed to update profile. Please try again.");
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    } else if (step === 2) {
      const payload = {
        ...values,
        countryCode: values.country,
      };
      console.log("payload", payload);
      payload.subscription = "FREE";
      delete payload["country"];
      try {
        const response = await updateFullProfile(payload, setUpdating);
        console.log("Updated Billing Information", response);
        const updatedProfile = await fetchProfileDetails();
        if (updatedProfile.status === "success") {
          localStorage.setItem(
            "userProfile",
            JSON.stringify(updatedProfile.data)
          );
          // message.success("Profile updated and userProfile refreshed successfully!");
        }
      } catch (err) {
        message.error("Failed to update profile. Please try again.");
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-blue-100 h-32 w-full"></div>
        <div className="relative -mt-8 px-4">
          <Card className="shadow-md rounded-lg">
            <Skeleton avatar paragraph={{ rows: 4 }} active />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-100 h-32 w-full"></div>
      <div className="relative -mt-8 px-4">
        <Card className="shadow-md rounded-lg">
          <Row gutter={[16, 16]}>
            {/* Avatar Section */}
            <Col
              xs={24}
              sm={24}
              md={24}
              lg={24}
              xl={24}
              className="text-center"
            >
              <div className="relative flex -mt-16">
                <ImgCrop
                  rotate
                  aspect={1}
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
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleProfilePicChange}
                    disabled={isLoading || !isEditing}
                    // REMOVED PERMISSION CHECK: (!isSuperAdminOrAdmin && !hasUpdatePermission("userProfile"))
                  >
                    <div className="relative">
                      <Avatar
                        size={120}
                        // src={profileDetails?.profilePic || localProfile.profilePic}
                        src={localProfile.profilePic}
                        className="border-4 border-white rounded-full cursor-pointer"
                      />
                      <div className="absolute bottom-0 left-20 cursor-pointer bg-blue-500 rounded-full p-2">
                        <CameraOutlined
                          style={{
                            fontSize: "16px",
                            color: "white",
                          }}
                        />
                      </div>
                    </div>
                  </Upload>
                </ImgCrop>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                  <h1 className="mt-4 text-xl text-start font-bold">
                    {`${localProfile.firstName} ${localProfile.lastName}`.trim() ||
                      "No Name"}
                  </h1>
                  <p className="text-gray-600 text-start">
                    {localProfile.email || "No Email"}
                  </p>
                </Col>
                <Col xs={24} sm={24} md={24} lg={24} xl={12}>
                  <div className="self-center mt-4 flex flex-wrap justify-start xl:justify-end gap-4">
                    <Button
                      type="primary"
                      className={`
    !bg-[#1D4ED8] !hover:bg-[#1E40AF] hover:opacity-70 !text-white z-10
     disabled:cursor-not-allowed`}
                      onClick={handleEdit}
                      loading={isLoading}
                      disabled={isLoading}
                      // REMOVED PERMISSION CHECK: (!isSuperAdminOrAdmin && !hasUpdatePermission("userProfile"))
                    >
                      {isEditing ? "Save" : "Edit"}
                    </Button>
                    <Button
                      icon={<LockOutlined />}
                      onClick={() => setIsChangePasswordModalVisible(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Profile Details Section */}
            <Col xs={24} sm={24} md={16} lg={18} xl={18}>
              <Row className="mt-3" gutter={[16, 16]}>
                <Col span={24}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name
                  </label>
                  <Input
                    name="firstName"
                    value={localProfile.firstName}
                    onChange={handleInputChange}
                    className="w-full max-w-xs"
                    disabled={!isEditing}
                  />
                </Col>
                <Col span={24}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name
                  </label>
                  <Input
                    name="lastName"
                    value={localProfile.lastName}
                    onChange={handleInputChange}
                    className="w-full max-w-xs"
                    disabled={!isEditing}
                  />
                </Col>
                <Col span={24}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile number
                  </label>
                  <Input
                    name="mobileNumber"
                    value={localProfile.mobileNumber}
                    onChange={handleInputChange}
                    className="w-full max-w-xs"
                    disabled={true}
                  />
                </Col>
                <Col span={24}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <Input
                    name="email"
                    value={localProfile.email}
                    onChange={handleInputChange}
                    className="w-full max-w-xs"
                    disabled={true}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      </div>
      <ChangePasswordModal
        mobile={localProfile.mobileNumber}
        visible={isChangePasswordModalVisible}
        onClose={() => {
          setIsChangePasswordModalVisible(false);
        }}
      />
      <div className="relative mt-5 px-4">
        <div className="bg-white rounded-lg  p-6">
          <Tabs
            defaultActiveKey="1"
            size="large"
            className="custom-tabs"
            tabBarStyle={{
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <MoneyCollectOutlined /> Billing Information{" "}
                </span>
              }
              key="1"
            >
              <Card className="border-blue-900">
                <ProfileSettings
                  form={form}
                  handleFinish={handleFinish}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  profileDetails={profileDetails}
                  user={user}
                />
              </Card>
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <MoneyCollectOutlined />
                  Billing Information{" "}
                </span>
              }
              key="2"
            >
              <Card className="border-blue-900">
                <BillingInformation
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  form={billForm}
                  handleFinish={handleFinish}
                />
              </Card>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
