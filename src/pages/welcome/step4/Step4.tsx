import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row, Typography, Avatar, message } from "antd";
import AddRoleForm from "./AddRoleForm";
import RoleList from "./RoleList";
import SubmitButton from "../SubmitButton";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import { addRoleApi, fetchRolesApi } from "../../../api/roleApi";
import { useLoading } from "../../../context/LoadingContext";

const { Title, Text } = Typography;

interface Step4Props {
  onFinish: (values: any, isSkipped?: boolean) => void;
  isUpdating: boolean;
}

const Step4: React.FC<Step4Props> = ({ onFinish, isUpdating }) => {
  const userData = useSelector((state: RootState) => state.userData);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [roles, setRoles] = useState([]);
  const { loading, setLoading } = useLoading();
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    email: "",
    profilePicture: "",
    mobileNumber: "",
  });

  useEffect(() => {
    fetchRoles();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = () => {
    // const storedUserProfile = localStorage.getItem('userProfile');
    // if (storedUserProfile) {
    //   const parsedUserProfile = JSON.parse(storedUserProfile);
    //   setUserProfile({
    //     fullName: parsedUserProfile.fullName,
    //     email: parsedUserProfile.email,
    //     profilePicture: parsedUserProfile.profilePicture,
    //   });
    // }

    if (userData.profileDetails) {
      console.log(userData);
      userData.profileDetails.profilePic
        ? setUserProfile({
            // fullName: `${userData.profileDetails.firstName} ${userData.profileDetails.lastName}`,
            fullName:
              userData.profileDetails.fullName ||
              userData.profileDetails.firstName +
                " " +
                userData.profileDetails.lastName,
            email: userData.profileDetails.emailid,
            mobileNumber: userData.profileDetails.mobile,
            profilePicture: userData.profileDetails.profilePic || "",
          })
        : setUserProfile({
            // fullName: `${userData.profileDetails.firstName} ${userData.profileDetails.lastName}`,
            fullName:
              userData.profileDetails.fullName ||
             ( userData.profileDetails.firstName +
                " " +
                userData.profileDetails.lastName),
            email: userData.profileDetails.email,
            profilePicture: userData.profileDetails.profilePicture,
            mobileNumber: userData.profileDetails.mobileNumber,
          });
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      console.log("Fetching roles...");
      const result = await fetchRolesApi();
      if (result.status === "success") {
        console.log("Roles fetched successfully:", result.data);
        setRoles(result.data);
      } else {
        console.error("Failed to fetch roles:", result);
        message.error("Failed to fetch roles.");
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      message.error("An error occurred while fetching roles.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (role: {
    roleName: string;
    permission: string[];
    description: string;
  }) => {
    try {
      const payload = {
        roleName: role.roleName,
        permission: role.permission,
        description: role.description,
      };
      console.log("Adding new role:", payload);
      const result = await addRoleApi(payload);
      if (result.status === "success") {
        console.log("Role added successfully:", result);
        await fetchRoles(); // Explicitly wait for roles to be fetched
      } else {
        console.error("Failed to add role:", result);
        message.error("Failed to add role. Please try again.");
      }
    } catch (err) {
      console.error("Error adding role:", err);
      message.error("An error occurred while adding the role.");
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleCancelAddRole = () => {
    setIsAddingRole(false);
  };

  const handleFinish = (formValues: any) => {
    const formWithRoles = {
      ...formValues,
      roles,
    };
    onFinish(formWithRoles, false);
  };

  const handleSkip = () => {
    onFinish({}, true);
  };

  if (loading) {
    return <div>Loading roles...</div>;
  }

  return (
    <>
      {!isAddingRole ? (
        <div>
          <Form
            name="profile_form"
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={handleFinish}
          >
            <Title style={{ fontWeight: "700" }} level={2}>
              Step 3: Role Creation
            </Title>

            <Text strong>Currently logged in as:</Text>

            <Row gutter={16} align="top" style={{ marginTop: "20px" }}>
              {/* Profile Avatar */}
              <Col span={6}>
                <Avatar
                  src={
                    userProfile.profilePicture ||
                    "https://via.placeholder.com/100"
                  }
                  size={100}
                  style={{
                    borderRadius: "8px",
                    width: "100px",
                    height: "100px", // Ensuring the avatar remains square
                  }}
                />
              </Col>

              {/* User Details */}
              <Col xs = {24} md = {18} span={18}>
                <Row style={{ marginTop: "10px", marginBottom: "8px" }}>
                  <Col span={12}>
                    <Text strong>Full Name:</Text>
                  </Col>
                  <Col span={12}>
                    <Text>{userProfile.fullName}</Text>
                  </Col>
                </Row>

                <Row style={{ marginBottom: "8px" }}>
                  <Col span={12}>
                    <Text strong>Login Email ID:</Text>
                  </Col>
                  <Col span={12}>
                    <Text
                      style={{
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {userProfile.email}
                    </Text>
                  </Col>
                </Row>

                <Row>
                  <Col span={12}>
                    <Text strong>Login Mobile Number:</Text>
                  </Col>
                  <Col span={12}>
                    <Text>{userProfile.mobileNumber}</Text>
                  </Col>
                </Row>
              </Col>
            </Row>

            <div className="my-4">
              <Title level={4}> Default Roles</Title>

              <div
                className="role-list-container"
                style={{ maxHeight: "250px", overflowY: "auto" }}
              >
                <RoleList roles={roles} />
              </div>

              <Button
                className="my-4 text-[#005D9D] text-[16px] font-mediummy-[15px] h-[46px] border-[#005D9D] border-2 rounded-xl text-[15px] font-medium leading-4"
                onClick={() => setIsAddingRole(true)}
              >
                Add Role
              </Button>
            </div>

            <Form.Item>
              <SubmitButton
                step="step4"
                loading={isUpdating}
                onSkip={handleSkip}
              />
            </Form.Item>
          </Form>
          {/* <div
            style={{
              position: "sticky",
              bottom: 0,
              zIndex: 10,
              background: "#fff",
              padding: "16px",
            }}
          >
            <SubmitButton
              step="step2"
              // loading={isUpdating || uploading}
              onSkip={handleSkip}
            />
          </div>*/}
        </div>
      ) : (
        <AddRoleForm onSave={handleAddRole} onCancel={handleCancelAddRole} />
      )}
    </>
  );
};

export default Step4;
