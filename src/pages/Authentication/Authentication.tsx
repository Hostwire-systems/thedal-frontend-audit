import { Button, Divider, message, Modal, Popconfirm, Spin, Switch, Table, Tag, Tooltip } from "antd";
import { LaptopOutlined, MobileOutlined, GlobalOutlined, LogoutOutlined, SafetyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  AdminVolunteerSessionDto,
  getAdminVolunteerSessionsApi,
  getActiveSessionsApi,
  revokeSessionApi,
  revokeAdminVolunteerSessionsApi,
  revokeOtherSessionsApi,
  logoutFromAllDevicesApi,
  SessionDto,
} from "../../api/authApi";
import {
  fetchUserDetails,
  updateElectionOtpSetting,
  updateUserOtpSetting,
} from "../../api/profileSettingsApi";
import {
  updateVolunteerOtpSetting,
  getVolunteerOtpSetting,
  updateVolunteerOtpSettingAlt,
} from "../../api/volunteerOtpApi";
import { useState, useEffect } from "react";
import { useLoading } from "../../context/LoadingContext";
import OTPVerificationModal,{OTPVerificationType} from "../login/otpVerification/OTPVerificationModal";

interface AuthenticationSetting {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  loading: boolean;
  onChange: (enabled: boolean) => Promise<void>;
}

const Authentication = () => {
  const [volunteerOtpEnabled, setVolunteerOtpEnabled] =
    useState<boolean>(false);
  const [userOtpEnabled, setUserOtpEnabled] = useState<boolean>(false);
  const [electionOtpEnabled, setElectionOtpEnabled] = useState<boolean>(false);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState<boolean>(false);
  const { isLoading, setLoading } = useLoading();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [currentVerificationType, setCurrentVerificationType] =
    useState<OTPVerificationType | null>(null);
  const [pendingEnableStatus, setPendingEnableStatus] =
    useState<boolean>(false);

  // Session management state
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [revokeLoadingId, setRevokeLoadingId] = useState<number | null>(null);
  const [logoutOthersLoading, setLogoutOthersLoading] = useState<boolean>(false);
  const [volunteerSessions, setVolunteerSessions] = useState<
    AdminVolunteerSessionDto[]
  >([]);
  const [volunteerSessionsLoading, setVolunteerSessionsLoading] =
    useState<boolean>(false);
  const [logoutVolunteerSessionsLoading, setLogoutVolunteerSessionsLoading] =
    useState<boolean>(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("role");
  const isAdminUser = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  // Fetch initial settings
  useEffect(() => {
    fetchVolunteerOtpSetting();
    fetchUserProfile();
    fetchSessions();
    if (isAdminUser) {
      fetchVolunteerSessions();
    }
  }, []);

  const getDeviceIcon = (platform?: string | null) => {
    const normalizedPlatform = platform?.toLowerCase() ?? "";

    if (
      normalizedPlatform.includes("mobile") ||
      normalizedPlatform.includes("android") ||
      normalizedPlatform.includes("ios")
    ) {
      return <MobileOutlined className="text-lg text-gray-500" />;
    }

    if (
      normalizedPlatform.includes("windows") ||
      normalizedPlatform.includes("mac") ||
      normalizedPlatform.includes("linux")
    ) {
      return <LaptopOutlined className="text-lg text-gray-500" />;
    }

    return <GlobalOutlined className="text-lg text-gray-500" />;
  };

  const renderLastActive = (timestamp?: string) => {
    if (!timestamp) {
      return "—";
    }

    const date = new Date(timestamp);
    return (
      <Tooltip title={date.toLocaleString()}>
        <span className="text-[14px] text-[#6B7280]">
          {date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </Tooltip>
    );
  };

  // Session management functions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await getActiveSessionsApi();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchVolunteerSessions = async () => {
    setVolunteerSessionsLoading(true);
    try {
      const data = await getAdminVolunteerSessionsApi();
      setVolunteerSessions(data);
    } catch (error) {
      console.error("Error fetching volunteer sessions:", error);
    } finally {
      setVolunteerSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (id: number) => {
    setRevokeLoadingId(id);
    try {
      await revokeSessionApi(id);
      await fetchSessions();
      message.success("Session revoked successfully");
    } catch (error) {
      message.error("Failed to revoke session");
    } finally {
      setRevokeLoadingId(null);
    }
  };

  const handleLogoutOthers = async () => {
    setLogoutOthersLoading(true);
    try {
      await revokeOtherSessionsApi();
      await fetchSessions();
      message.success("All other sessions have been logged out");
    } catch (error) {
      message.error("Failed to logout other sessions");
    } finally {
      setLogoutOthersLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await logoutFromAllDevicesApi();
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      message.error("Failed to logout from all devices");
    }
  };

  const handleLogoutAllVolunteerSessions = async () => {
    setLogoutVolunteerSessionsLoading(true);
    try {
      await revokeAdminVolunteerSessionsApi();
      await fetchVolunteerSessions();
      message.success("All volunteer sessions have been logged out");
    } catch (error) {
      console.error("Error logging out volunteer sessions:", error);
      message.error("Failed to logout volunteer sessions");
    } finally {
      setLogoutVolunteerSessionsLoading(false);
    }
  };

   const handleOtpVerificationComplete = () => {
     setShowOtpModal(false);
     // Update the state based on the verification type
     switch (currentVerificationType) {
       case OTPVerificationType.VOLUNTEER_2FA:
         setVolunteerOtpEnabled(pendingEnableStatus);
         break;
       case OTPVerificationType.USER_2FA:
         setUserOtpEnabled(pendingEnableStatus);
         break;
       case OTPVerificationType.ELECTION_2FA:
         setElectionOtpEnabled(pendingEnableStatus);
         break;
     }
     message.success(
       `Two Factor Authentication ${
         pendingEnableStatus ? "enabled" : "disabled"
       } successfully`
     );
   };

  // Volunteer OTP functions
  const fetchVolunteerOtpSetting = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await getVolunteerOtpSetting();
      let status = true;

      if (response.success) {
        if (response.data?.settingValue === "disabled") {
          status = false;
        }
        setVolunteerOtpEnabled(status);
      }
    } catch (error) {
      console.error("Error fetching volunteer OTP setting:", error);
    } finally {
      setLoading(false);
    }
  };

  // User OTP functions
  const fetchUserProfile = async () => {
    setLoading(true);
    setOtpLoading(true);
    try {
      const response = await fetchUserDetails();
      console.log("Response", response);
      const status = response.data?.isTwoFactorEnabled;
      const electionStatus = response.data?.isOtpRequired;
      console.log({ status, electionStatus });
      if (status) {
        setUserOtpEnabled(status);
      }
      if (electionStatus) {
        setElectionOtpEnabled(electionStatus);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setOtpLoading(false);
      setLoading(false);
    }
  };

  const handleToggleWithOtp = async (
    type: OTPVerificationType,
    enabled: boolean
  ) => {
    try {
      setOtpLoading(true);
      setPendingEnableStatus(enabled);
      setCurrentVerificationType(type);

      // First request to initiate OTP
      let response;
      switch (type) {
        case OTPVerificationType.VOLUNTEER_2FA:
          try {
            response = await updateVolunteerOtpSetting(enabled);
          } catch (error) {
            response = await updateVolunteerOtpSettingAlt(enabled);
          }
          break;
        case OTPVerificationType.USER_2FA:
          response = await updateUserOtpSetting(userId!, enabled);
          break;
        case OTPVerificationType.ELECTION_2FA:
          response = await updateElectionOtpSetting(userId!, enabled);
          break;
      }

      if (response.success && response.data?.userId) {
        setShowOtpModal(true);
      } else {
        message.error(
          response.message || "Failed to initiate OTP verification"
        );
      }
    } catch (error) {
      console.error("Error initiating OTP:", error);
      message.error("Failed to initiate OTP verification");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      setLogoutAllLoading(true);
      // TODO: Call backend API to logout from all devices
      // await logoutAllDevicesApi();
      message.success("Logout initiated for all devices");
    } catch (error) {
      console.error("Error logging out from all devices:", error);
      message.error("Failed to logout from all devices");
    } finally {
      setLogoutAllLoading(false);
    }
  };

  // Table data
   const authenticationSettings: AuthenticationSetting[] = [
     {
       key: "cadre",
       name: "Volunteer Two-Factor Authentication",
       description: volunteerOtpEnabled
         ? "Two-factor authentication is enabled for volunteer login"
         : "Two-factor authentication is disabled for volunteer login",
       enabled: volunteerOtpEnabled,
       loading: otpLoading,
       onChange: (enabled) =>
         handleToggleWithOtp(OTPVerificationType.VOLUNTEER_2FA, enabled),
     },
     {
       key: "user",
       name: "Account Two-Factor Authentication",
       description: userOtpEnabled
         ? "Two-factor authentication is enabled for your account"
         : "Two-factor authentication is disabled for your account",
       enabled: userOtpEnabled,
       loading: otpLoading,
       onChange: (enabled) =>
         handleToggleWithOtp(OTPVerificationType.USER_2FA, enabled),
     },
     {
       key: "election",
       name: "Delete Election Two-Factor Authentication",
       description: electionOtpEnabled
         ? "Two-factor authentication is enabled for elections in your account"
         : "Two-factor authentication is disabled for elections in your account",
       enabled: electionOtpEnabled,
       loading: otpLoading,
       onChange: (enabled) =>
         handleToggleWithOtp(OTPVerificationType.ELECTION_2FA, enabled),
     },
   ];

  const columns = [
    {
      title: "Setting",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text: string) => (
        <div className="text-[16px] font-medium text-[#374151]">{text}</div>
      ),
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "status",
      width: "15%",
      render: (enabled: boolean, record: AuthenticationSetting) => (
        record.key === "logoutAll" ? (
          <Button
            type="primary"
            danger
            loading={record.loading}
            onClick={handleLogoutAllDevices}
          >
            Logout All
          </Button>
        ) : (
          <Switch
            checked={enabled}
            onChange={record.onChange}
            loading={record.loading}
            style={{
              backgroundColor: enabled ? "green" : "#8B0000",
            }}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        )
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: "55%",
      render: (text: string) => (
        <div className="text-[14px] text-[#6B7280]">{text}</div>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 className="font-bold text-[31px] leading-8 mb-6">Authentication</h2>

      <div className="bg-white border-gray-200">
        <Table
          dataSource={authenticationSettings}
          columns={columns}
          rowKey="key"
          pagination={false}
          bordered={false}
          showHeader={true}
          className="my-4 default-list-table"
          rowClassName={() => "p-4"}
        />
      </div>
      <Divider orientation="left" style={{ marginTop: 40 }}>
        <span className="text-[20px] font-semibold text-[#374151]">Active Sessions</span>
      </Divider>

      <div className="mb-4 flex gap-3 flex-wrap">
        <Button
          icon={<SafetyOutlined />}
          loading={logoutOthersLoading}
          onClick={handleLogoutOthers}
          disabled={sessions.filter((s) => !s.current).length === 0}
        >
          Logout from all other devices
        </Button>
        <Popconfirm
          title="Logout from ALL devices?"
          description="This will immediately end all sessions including this one. You will be redirected to login."
          onConfirm={handleLogoutAll}
          okText="Yes, logout all"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<LogoutOutlined />}>
            Logout from ALL devices
          </Button>
        </Popconfirm>
      </div>

      <div className="bg-white border-gray-200">
        <Spin spinning={sessionsLoading}>
          <Table<SessionDto>
            dataSource={sessions}
            rowKey="id"
            pagination={false}
            bordered={false}
            className="my-2 default-list-table"
            columns={[
              {
                title: "Device",
                key: "device",
                width: "25%",
                render: (_: unknown, record: SessionDto) => (
                  <div className="flex items-center gap-2">
                    {getDeviceIcon(record.platform)}
                    <span className="font-medium text-[#374151]">
                      {record.deviceName || record.platform || "Unknown Device"}
                    </span>
                    {record.current && (
                      <Tag color="green" style={{ marginLeft: 4 }}>Current</Tag>
                    )}
                  </div>
                ),
              },
              {
                title: "Browser / Platform",
                key: "browser",
                width: "20%",
                render: (_: unknown, record: SessionDto) => (
                  <span className="text-[14px] text-[#6B7280]">
                    {[record.browser, record.platform].filter(Boolean).join(" · ") || "—"}
                  </span>
                ),
              },
              {
                title: "IP Address",
                dataIndex: "ipAddressMasked",
                key: "ip",
                width: "18%",
                render: (ip: string | null) => (
                  <span className="text-[14px] text-[#6B7280]">{ip || "—"}</span>
                ),
              },
              {
                title: "Last Active",
                dataIndex: "lastActiveAt",
                key: "lastActive",
                width: "20%",
                render: renderLastActive,
              },
              {
                title: "Action",
                key: "action",
                width: "17%",
                render: (_: unknown, record: SessionDto) =>
                  record.current ? null : (
                    <Popconfirm
                      title="Revoke this session?"
                      onConfirm={() => handleRevokeSession(record.id)}
                      okText="Revoke"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        loading={revokeLoadingId === record.id}
                      >
                        Revoke
                      </Button>
                    </Popconfirm>
                  ),
              },
            ]}
          />
        </Spin>
      </div>

      {isAdminUser && (
        <>
          <Divider orientation="left" style={{ marginTop: 40 }}>
            <span className="text-[20px] font-semibold text-[#374151]">
              Volunteer Sessions
            </span>
          </Divider>

          <div className="mb-4 flex gap-3 flex-wrap">
            <Popconfirm
              title="Logout all volunteer sessions?"
              description="This will end every active session for volunteers created or mapped by you."
              onConfirm={handleLogoutAllVolunteerSessions}
              okText="Yes, logout all"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              disabled={volunteerSessions.length === 0}
            >
              <Button
                danger
                icon={<LogoutOutlined />}
                loading={logoutVolunteerSessionsLoading}
                disabled={volunteerSessions.length === 0}
              >
                Logout all volunteer sessions
              </Button>
            </Popconfirm>
          </div>

          <div className="bg-white border-gray-200">
            <Spin spinning={volunteerSessionsLoading}>
              <Table<AdminVolunteerSessionDto>
                dataSource={volunteerSessions}
                rowKey="sessionId"
                pagination={false}
                bordered={false}
                className="my-2 default-list-table"
                locale={{ emptyText: "No active volunteer sessions found." }}
                columns={[
                  {
                    title: "Volunteer",
                    key: "volunteer",
                    width: "26%",
                    render: (_: unknown, record: AdminVolunteerSessionDto) => (
                      <div className="flex flex-col">
                        <span className="font-medium text-[#374151]">
                          {record.volunteerName || "Unknown Volunteer"}
                        </span>
                        <span className="text-[13px] text-[#6B7280]">
                          {record.volunteerMobileNumber || "—"}
                        </span>
                      </div>
                    ),
                  },
                  {
                    title: "Device",
                    key: "device",
                    width: "22%",
                    render: (_: unknown, record: AdminVolunteerSessionDto) => (
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(record.platform)}
                        <span className="font-medium text-[#374151]">
                          {record.deviceName || record.platform || "Unknown Device"}
                        </span>
                      </div>
                    ),
                  },
                  {
                    title: "Browser / Platform",
                    key: "browser",
                    width: "20%",
                    render: (_: unknown, record: AdminVolunteerSessionDto) => (
                      <span className="text-[14px] text-[#6B7280]">
                        {[record.browser, record.platform].filter(Boolean).join(" · ") || "—"}
                      </span>
                    ),
                  },
                  {
                    title: "IP Address",
                    dataIndex: "ipAddressMasked",
                    key: "ip",
                    width: "14%",
                    render: (ip: string | null) => (
                      <span className="text-[14px] text-[#6B7280]">{ip || "—"}</span>
                    ),
                  },
                  {
                    title: "Last Active",
                    dataIndex: "lastActiveAt",
                    key: "lastActive",
                    width: "18%",
                    render: renderLastActive,
                  },
                ]}
              />
            </Spin>
          </div>
        </>
      )}

      <Modal
        title="Verify OTP"
        open={showOtpModal}
        onCancel={() => setShowOtpModal(false)}
        footer={null}
        destroyOnClose
      >
        {currentVerificationType && userId && (
          <OTPVerificationModal
            userId={userId}
            type={currentVerificationType}
            onVerificationComplete={handleOtpVerificationComplete}
          />
        )}
      </Modal>
    </div>
  );
};

export default Authentication;
