import React, { useEffect, useState } from "react";
import { Menu, Modal, message, Tooltip } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  UserAddOutlined,
  LogoutOutlined,
  TeamOutlined,
  DatabaseOutlined,
  CodeSandboxOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ToolOutlined,
  FlagOutlined,
  ProfileOutlined,
  TranslationOutlined,
  HistoryOutlined,
  CommentOutlined,
  DownloadOutlined,
  OpenAIOutlined,
  HeatMapOutlined,
  PrinterOutlined,
  FileImageOutlined,
  SafetyOutlined,
  FieldTimeOutlined,
  NumberOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { getVotersApi } from "../../api/voterApi";
import { fetchUserDetails } from "../../api/profileSettingsApi";
import ElectionSelectorDropdown from "../../components/electionSelectorDropdown/";
import { getAllElections } from "../../utlis";
import { updateSelectedElectionId } from "../../redux/slices/electionSlice";
import { loadUserSubscriptions } from "../../utlis/subscriptionUtils";
import { clearActiveBackendUrl } from "../../config";
import {
  selectAccessibleModuleKeys,
  selectIsSubscriptionLoaded,
} from "../../redux/slices/subscriptionSlice";

const getCachedSidebarProfile = () => {
  try {
    const cachedProfile = localStorage.getItem("userProfile");
    if (!cachedProfile) {
      return {
        firstName: "",
        lastName: "",
        email: "",
        mobileNumber: "",
        profilePic: "",
      };
    }

    const parsed = JSON.parse(cachedProfile);
    return {
      firstName: parsed.firstName || "",
      lastName: parsed.lastName || "",
      email: parsed.emailid || parsed.email || "",
      mobileNumber: parsed.mobile || parsed.mobileNumber || "",
      profilePic: parsed.profilePic || parsed.profilePicture || "",
    };
  } catch {
    return {
      firstName: "",
      lastName: "",
      email: "",
      mobileNumber: "",
      profilePic: "",
    };
  }
};

const { SubMenu } = Menu;

interface SidebarMenuProps {
  onSelect: (item: { key: string }) => void;
  collapsed?: boolean;
  electionStep?: number | null;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  onSelect,
  collapsed = false,
  electionStep,
}) => {
  // const [voters, setVoters] = useState([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [selectedElectionName, setSelectedElectionName] = useState<
    string | null
  >(null);

  const [pendingElectionName, setPendingElectionName] = useState<string>("");
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const jwtToken = localStorage.getItem("jwtToken");
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const persistRoot = localStorage.getItem("persist:root");
  const auth = persistRoot ? JSON.parse(persistRoot).auth : null;
  const userRole = auth ? JSON.parse(auth).user : null;
  const [localProfile, setLocalProfile] = useState(getCachedSidebarProfile);

  const location = useLocation();
  const dispatch = useDispatch();

  const fullName = useSelector(
    (state: RootState) => state.userData.profileDetails.firstName
  );
  const profileDetails = useSelector(
    (state: RootState) => state.userData.profileDetails
  );
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const accessibleModuleKeys = useSelector(selectAccessibleModuleKeys);
  const isSubscriptionLoaded = useSelector(selectIsSubscriptionLoaded);

  // Derive effective access: if a child module is accessible, surface its parent too
  const moduleParentMap: Record<string, string> = {
    // Voter Manager children → parent
    voterslist: "voter-manager",
    "add-voter": "voter-manager",
    "pdf-photo-processing": "voter-manager",
    "voters-map": "voter-manager",
    "duplicate-voters": "voter-manager",
    "new-voters": "voter-manager",
    "aadhaar-verify": "voter-manager",
    sir: "voter-manager",
    // Part Manager children → parent
    boothType: "part-manager",
    "part-list": "part-manager",
    "add-part": "part-manager",
    "part-map": "part-manager",
    "section-list": "part-manager",
    "add-section": "part-manager",
    // Family Manager children → parent
    family: "family-manager",
    "family-captain-list": "family-manager",
    "create-family-captain": "family-manager",
    "family-captain-map": "family-manager",
    // Cadre Manager children → parent
    "cadre-list": "cadre-manager",
    "add-cadre": "cadre-manager",
    "cadre-map": "cadre-manager",
    "cadre-tracking-list": "cadre-manager",
    // Campaign Manager children → parent
    communication: "campaign-manager",
    "create-message": "campaign-manager",
    // Survey Manager children → parent
    surveyForm: "survey-manager",
    // Member Manager children → parent
    memberList: "member-manager",
    "add-member": "member-manager",
  };

  const effectiveModuleKeys = React.useMemo(() => {
    const keys = new Set(accessibleModuleKeys);
    accessibleModuleKeys.forEach((childKey) => {
      const parent = moduleParentMap[childKey];
      if (parent) {
        keys.add(parent);
      }
    });
    return keys;
  }, [accessibleModuleKeys]);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );
  const isSuperAdminOrAdmin =
    userRole?.role === "ADMIN" || userRole?.role === "SUPER_ADMIN";
  const currentRole = (userRole?.role || localStorage.getItem("role") || "")
    .toString()
    .toUpperCase();
  const isCadreLogin = currentRole.includes("CADRE");

  const specialSelectedKey =
    location.pathname === "/elections/create" && electionStep === 2
      ? "add-voter"
      : location.pathname === "/elections/create" && electionStep === 3
      ? "add-cadre"
      : null;

  const hasReadPermission = (module: string) =>
    rolesPermission?.[module]?.includes("R");
  const hasAddPermission = (module: string) =>
    rolesPermission?.[module]?.includes("C");
  const hasUpdatePermission = (module: string) =>
    rolesPermission?.[module]?.includes("U");
  const hasDeletePermission = (module: string) =>
    rolesPermission?.[module]?.includes("D");

  // Check if user has module subscription access
  const hasModuleAccess = (moduleKey: string) => {
    // Check subscription - if not loaded yet, allow access temporarily
    if (!isSubscriptionLoaded) return true;
      if (userRole?.role === "SUPER_ADMIN") return true;

    // Check subscription (applies to all users including admins)
    return effectiveModuleKeys.has(moduleKey);
  };

  const hasPermission = (isSuperAdminOrAdmin: boolean, ...permissions: any) => {
    if (isSuperAdminOrAdmin) return true;

    const isAddPermission = permissions[permissions.length - 1] === true;
    const permissionKeys = isAddPermission
      ? permissions.slice(0, -1)
      : permissions;

    if (isAddPermission) {
      return permissionKeys.some((permission: string) =>
        hasAddPermission(permission)
      );
    } else {
      return permissionKeys.some((permission: string) =>
        hasReadPermission(permission)
      );
    }
  };

  // Combined permission and subscription check
  const hasAccess = (
    moduleKey: string,
    permissionKeys?: string | string[],
    isAddPermission: boolean = false
  ) => {
    // First check module subscription
    if (!hasModuleAccess(moduleKey)) {
      return false;
    }

    // If no permission keys specified, just check subscription
    if (!permissionKeys) {
      return true;
    }

    // Then check role permissions
    const perms = Array.isArray(permissionKeys)
      ? permissionKeys
      : [permissionKeys];
    return hasPermission(isSuperAdminOrAdmin, ...perms, isAddPermission);
  };

  const isElectionDisabled = () => {
    return allElections.length === 0;
  };
  const showPermissionMessage = () => {
    // Using Ant Design message
    message.warning("Contact your admin for access to this feature");
  };
  const showElectionMessage = () => {
    // Using Ant Design message
    message.warning("Please create an election first to access this feature");
  };

  const handleRestrictedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showPermissionMessage();
  };

  const handleElectionRestrictedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showElectionMessage();
  };

  // Determine selected key based on current pathname
  const selectedKey =
    specialSelectedKey ||
    (location.pathname === "/overview"
      ? "overview"
      : location.pathname === "/profile"
      ? "profile"
      : location.pathname === "/booth-slip"
      ? `booth-slip`
      : location.pathname === "/boothType"
      ? `boothType`
      : location.pathname === "/campaign"
      ? "campaign"
      : location.pathname === "/elections"
      ? "elections"
      : location.pathname === "/poll-day-manager"
      ? "poll-day-manager"
      : location.pathname === "/voter-turnout"
      ? "voter-turnout"
      : location.pathname === "/campaignManager"
      ? "campaignManager"
      : location.pathname === "/ai-manager"
      ? "ai-manager"
      : location.pathname === "/news"
      ? "news"
      : location.pathname.includes("cadre-list")
      ? "cadre-list"
      : location.pathname.includes("cadre-tracking-list")
      ? "cadre-tracking-list"
      : location.pathname.includes("add-cadre")
      ? "add-cadre"
      : location.pathname.includes("cadre-map")
      ? "cadre-map"
      : location.pathname.includes("cadre-details")
      ? "cadre"
      : location.pathname.includes("family-captain-list")
      ? "family-captain-list"
      : location.pathname.includes("family-captain-details")
      ? "family-manager"
      : location.pathname.includes("create-family-captain")
      ? "create-family-captain"
      : location.pathname.includes("family-captain-map")
      ? "family-captain-map"
      : location.pathname.includes("family-detail")
      ? "static-dashboard"
      : location.pathname.includes("voterslist")
      ? "voterslist"
      : location.pathname.includes("add-voter")
      ? "add-voter"
      : location.pathname.includes("voters-map")
      ? "voters-map"
      : location.pathname.includes("family")
      ? "family"
      : location.pathname.includes("add-family")
      ? "add-family"
      : location.pathname.includes("duplicate-voters")
      ? "duplicate-voters"
      : location.pathname.includes("new-voters")
      ? "new-voters"
      : location.pathname.includes("sub-caste")
      ? "sub-caste"
      : location.pathname.includes("caste-category")
      ? "caste-category"
      : location.pathname.includes("caste")
      ? "caste"
      : location.pathname.includes("religion")
      ? "religion"
      : location.pathname.includes("static-dashboard")
      ? "static-dashboard"
      : location.pathname.includes("dashboard")
      ? "dashboard"
      : location.pathname.includes("parties")
      ? "parties"
      : location.pathname.includes("benefit-scheme")
      ? "benefit-scheme"
      : location.pathname.includes("app-banner")
      ? "app-banner"
      : location.pathname.includes("roles")
      ? "roles"
      : location.pathname.includes("availability")
      ? "availability"
      : location.pathname.includes("part-list")
      ? "part-list"
      : location.pathname.includes("add-part")
      ? "add-part"
      : location.pathname.includes("part-map")
      ? "part-map"
      : location.pathname.includes("section-list")
      ? "section-list"
      : location.pathname.includes("add-section")
      ? "add-section"
      : location.pathname.includes("role")
      ? "role"
      : location.pathname.includes("language")
      ? "language"
      : location.pathname.includes("surveyForm")
      ? "surveyForm"
      : location.pathname.includes("create-message")
      ? "create-message"
      : location.pathname.includes("communication")
      ? "communication"
      : location.pathname.includes("add-member")
      ? "add-member"
      : location.pathname.includes("memberList")
      ? "memberList"
      : location.pathname.includes("voterHistory")
      ? "voterHistory"
      : location.pathname.includes("aadhaar-verify")
      ? "aadhaar-verify"
      : location.pathname.includes("sir")
      ? "sir"
      : location.pathname.includes("feedback")
      ? "feedback"
      : location.pathname.includes("download")
      ? "download"
      : location.pathname.includes("ai-manager")
      ? "ai-manager"
      : location.pathname.includes("custom-report")
      ? "custom-report"
      : location.pathname.includes("booth-map")
      ? "booth-map"
      : location.pathname.includes("Slip-box786")
      ? "slip-box"
      : location.pathname.includes("authentication")
      ? "authentication"
      : location.pathname.includes("dynamic-fields")
      ? "dynamic-fields"
      : location.pathname.includes("fields-order")
      ? "fields-order"
      : location.pathname.includes("pdf-photo-processing")
      ? "pdf-photo-processing"
      : location.pathname.includes("report")
      ? "report"
      : "elections");

  const handleLogout = () => {
    Modal.confirm({
      title: "Confirm Logout",
      content: "Are you sure you want to logout?",
      onOk() {
        //store re-ordered elections
        const elections = JSON.parse(localStorage.getItem("elections") || "[]");
        if (elections && elections.length > 0) {
          localStorage.setItem("elections", JSON.stringify(elections));
        }
        dispatch({ type: "LOGOUT" });

        clearActiveBackendUrl();
        localStorage.clear();
        message.success("Logout successful!");
        navigate("/login", { replace: true });
      },
      onCancel() {},
    });
  };

  const handleMenuClick = (info: { key: string; domEvent?: any }) => {
    // If user clicked on the username item, do nothing
    if (info.key === "User") {
      return;
    }

    if (info.key === "logout") {
      handleLogout();
    } else {
      onSelect(info);
    }
  };

  useEffect(() => {
    const handleSmallScreen = () => {
      const isSmall = window.matchMedia("(max-width : 768px)").matches;
      setIsSmallScreen(isSmall);
    };
    console.log("rolesPermission", rolesPermission);

    handleSmallScreen();
    window.addEventListener("resize", handleSmallScreen);

    return () => {
      window.removeEventListener("resize", handleSmallScreen);
    };
  }, []);

  // Initial fetch of elections
  useEffect(() => {
    console.log("Fetching elections");
    const token = localStorage.getItem("jwtToken");
    if (token) {
      getAllElections(dispatch);
    }
  }, [dispatch]);

  // Load user subscriptions on mount - ALWAYS fetch fresh data from API
  useEffect(() => {
    if (jwtToken && !isSubscriptionLoaded) {
      console.log("Loading user subscriptions from API");
      loadUserSubscriptions(dispatch);
    }
  }, [dispatch, isSubscriptionLoaded, jwtToken]);

  // Refresh subscriptions when window regains focus (e.g., after admin changes permissions)
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === "visible" && jwtToken) {
        console.log("Window focused - refreshing user subscriptions");
        loadUserSubscriptions(dispatch);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [dispatch, jwtToken]);

  // Auto-selection and persistence logic
  useEffect(() => {
    console.log("Auto-selection effect:", {
      allElections,
      isFirstLoad,
      selectedElectionId,
      allElectionsCount: allElections.length,
    });

    if (!allElections.length) return;

    if (isFirstLoad) {
      const persistedId = localStorage.getItem("selectedElectionId");
      console.log("Persisted ID:", persistedId);

      if (persistedId) {
        // Use explicit type conversion to match IDs
        const persistedElection = allElections.find(
          (election) => election.id.toString() === persistedId.toString()
        );

        if (persistedElection) {
          console.log("Found persisted election:", persistedElection);
          handleSelectElection(persistedElection.electionName, true);
        } else {
          console.log("Persisted election not found in available elections");
          const firstElection = allElections[0];
          handleSelectElection(firstElection.electionName, true);
        }
      } else {
        console.log("No persisted ID, selecting first election");
        const firstElection = allElections[0];
        handleSelectElection(firstElection.electionName, true);
      }
      setIsFirstLoad(false);
    }
  }, [allElections, isFirstLoad]);

  useEffect(() => {
    if (selectedElectionId && allElections.length) {
      const currentElection = allElections.find(
        (election) => election.id === selectedElectionId
      );
      if (currentElection) {
        setSelectedElectionName(currentElection.electionName);
      }
    }
  }, [selectedElectionId, allElections]);

  const handleSelectElection = (
    electionName: string,
    isAutoSelect: boolean = false
  ) => {
    console.log("handleSelectElection:", { electionName, isAutoSelect });

    const selectedElection = allElections.find(
      (election) => election.electionName === electionName
    );

    if (!selectedElection) {
      console.log("Selected election not found");
      return;
    }

    // Convert IDs to strings for comparison
    if (selectedElection.id.toString() === selectedElectionId?.toString()) {
      console.log("Election already selected");
      return;
    }

    dispatch(updateSelectedElectionId(selectedElection.id));
    setSelectedElectionName(selectedElection.electionName);
    localStorage.setItem("selectedElectionId", selectedElection.id.toString());

    if (!isAutoSelect) {
      setPendingElectionName(electionName);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    const latestKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestKey ? [latestKey] : []);
  };

  const fetchUserProfile = async () => {
    const response = await fetchUserDetails();
    const data = response.data;
    console.log("response.data", response.data);
    setLocalProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      mobileNumber: data.mobileNumber,
      email: data.email,
      profilePic: data?.profilePicture,
    });
  };

  useEffect(() => {
    const hasReduxProfile =
      profileDetails?.firstName ||
      profileDetails?.lastName ||
      profileDetails?.emailid ||
      profileDetails?.mobile ||
      profileDetails?.profilePic;

    if (!hasReduxProfile) {
      return;
    }

    setLocalProfile((current) => ({
      firstName: profileDetails.firstName || current.firstName,
      lastName: profileDetails.lastName || current.lastName,
      email: profileDetails.emailid || current.email,
      mobileNumber: profileDetails.mobile || current.mobileNumber,
      profilePic: profileDetails.profilePic || current.profilePic,
    }));
  }, [profileDetails]);

  useEffect(() => {
    const hasCachedProfile =
      localProfile.firstName ||
      localProfile.lastName ||
      localProfile.email ||
      localProfile.mobileNumber ||
      localProfile.profilePic;

    if (!hasCachedProfile) {
      fetchUserProfile();
    }
    console.log(userRole);
  }, [localProfile.email, localProfile.firstName, localProfile.lastName, localProfile.mobileNumber, localProfile.profilePic, userRole]);

  useEffect(() => {
    // Map route paths to submenu keys
    const routeToSubmenuKeyMap: { [key: string]: string } = {
      "/static-dashboard": "",
      "/dashboard": "",
      "/elections": "election",
      "/app-banner": "election",
      "/availability": "election",
      "/benefit-scheme": "election",
      "/booth-slip": "election",
      "/language": "election",
      "/parties": "election",
      "/religion": "election",
      "/caste-category": "election",
      "/caste": "election",
      "/voterHistory": "election",
      "/feedback": "election",
      "/part-list": "partSection",
      "/add-part": "partSection",
      "/part-map": "partSection",
      "/section-list": "partSection",
      "/add-section": "partSection",
      "/sub-caste": "election",
      "/boothType": "partSection",
      "/voterslist": "voterData",
      "/add-voter": "voterData",
      "/pdf-photo-processing": "voterData",
      "/voters-map": "voterData",
      "/duplicate-voters": "voterData",
      "/new-voters": "voterData",
      "/family": "",
      "/family-detail": "dashboard",
      "/aadhaar-verify": "voterData",
      "/sir": "voterData",
      "/cadre-list": "cadre",
      "/add-cadre": "cadre",
      "/cadre-map": "cadre",
      "/cadre-tracking-list": "cadre",
      "/family-captain-list": "",
      "/create-family-captain": "",
      "/family-captain-details": "",
      "/family-captain-map": "",
      "/surveyForm": "survey",
      "/communication": "campaignManager",
      "/create-message": "campaignManager",
      "/ai-manager": "ai-manager",
      "/add-member": "memberManager",
      "/news": "",
      // "/poll-day-manager": "",
      "/voter-turnout": "poll-day-manager",
      "/report": "",
      "/profile": "settings",
      "/authentication": "settings",
      "/Slip-box786": "settings",
      "/dynamic-fields": "settings",
      "/fields-order": "settings",
      "/bulk-sms": "settings",
      "/download": "settings",
      "/catalogue": "settings",
      "/custom-report": "settings",
      "/booth-map": "settings",
      "/roles": "settings",
      "/role": "settings",
    };

    let submenuKey = "";

    // Prioritize electionStep if it's active
    if (location.pathname === "/elections/create") {
      if (electionStep === 1) submenuKey = "election";
      if (electionStep === 2) submenuKey = "voterData";
      if (electionStep === 3) submenuKey = "cadre";
    } else {
      // Otherwise, check the route mapping
      const matchedKey = Object.keys(routeToSubmenuKeyMap).find((key) =>
        location.pathname.includes(key)
      );
      submenuKey = matchedKey ? routeToSubmenuKeyMap[matchedKey] : "";
    }

    setOpenKeys(submenuKey ? [submenuKey] : []);
  }, [location.pathname]);

  // Reset open keys on collapse or route change for small screens
  useEffect(() => {
    if (isSmallScreen && collapsed) {
      setOpenKeys([]);
    }
  }, [collapsed]);

  useEffect(() => {
    if (isSmallScreen) {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  return (
    <Menu
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
      style={{
        height: "100vh",
        borderRight: 0,
        backgroundColor: "#fff",
        overflowY: "auto",
        color: "#000",
        width: "100%",
        maxWidth: "100%",
      }}
      className="md:w-[212px] w-full"
      onClick={handleMenuClick}
    >
      {isSmallScreen && (
        <div
          style={{
            display: "flex",
            justifyContent: "right",
            alignItems: "center",
            padding: "16px",
          }}
        >
          <ElectionSelectorDropdown
            selectedElectionName={selectedElectionName}
            handleSelectElection={handleSelectElection}
            isInitialSetup={isFirstLoad}
            allElections={allElections}
            disabled={allElections.length === 0}
          />
        </div>
      )}
      <Menu.Item key="User" icon={<UserOutlined />}>
        {hasPermission(isSuperAdminOrAdmin, "userProfile") ? (
          <Link to="/profile">{localProfile?.firstName || "User"}</Link>
        ) : (
          <span onClick={handleRestrictedClick}>
            {localProfile?.firstName || "User"}
          </span>
        )}
      </Menu.Item>

      {/* ADDED: Static Dashboard Menu Item */}
      {hasModuleAccess("static-dashboard") && !isCadreLogin && (
        <Menu.Item key="static-dashboard" icon={<TeamOutlined />}>
          {hasAccess("static-dashboard", "static-dashboard") ? (
            <Link to="/static-dashboard">Dashboard</Link>
          ) : (
            <span onClick={handleRestrictedClick}>Dashboard</span>
          )}
        </Menu.Item>
      )}

      {/* Commented out dashboard */}
      {/* <Menu.Item key="dashboard" icon={<TeamOutlined />}>
        {hasPermission(
          isSuperAdminOrAdmin,
          "election-dashboard",
          "cadre-dashboard",
          "pollday-dashboard"
        ) ? (
          !collapsed && <Link to="/dashboard">Custom Dashboard</Link>
        ) : (
          <span onClick={handleRestrictedClick}>Custom Dashboard</span>
        )}
      </Menu.Item> */}

      {/* election section */}
      {hasModuleAccess("election-manager") && (
        <SubMenu
          key="election"
          icon={<BarChartOutlined />}
          title="Election Manager"
        >
          {hasModuleAccess("elections") && (
            <Menu.Item key="elections" icon={<BarChartOutlined />}>
              {hasAccess("elections", "electionsList") ? (
                <Link to="/elections">Your Elections</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Your Elections</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("app-banner") && (
            <Menu.Item key="app-banner" icon={<CodeSandboxOutlined />}>
              {hasAccess("app-banner", "appsBanner") &&
              !isElectionDisabled() ? (
                <Link to="/app-banner">App Banner</Link>
              ) : hasAccess("app-banner", "appsBanner") ? (
                <span onClick={handleElectionRestrictedClick}>App Banner</span>
              ) : (
                <span onClick={handleRestrictedClick}>App Banner</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("voterHistory") && (
            <Menu.Item key="voterHistory" icon={<HistoryOutlined />}>
              {hasAccess("voterHistory", "history") && !isElectionDisabled() ? (
                <Link to="/voterHistory">Voting History</Link>
              ) : hasAccess("voterHistory", "history") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Voting History
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Voting History</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("availability") && (
            <Menu.Item key="availability" icon={<UserOutlined />}>
              {hasAccess("availability", "availability") &&
              !isElectionDisabled() ? (
                <Link to="/availability">Voter Category</Link>
              ) : hasAccess("availability", "availability") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Voter Category
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Voter Category</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("booth-slip") && (
            <Menu.Item key="booth-slip" icon={<FileTextOutlined />}>
              {hasAccess("booth-slip", "boothSlip") && !isElectionDisabled() ? (
                <Link to="/booth-slip">Voter Slip</Link>
              ) : hasAccess("booth-slip", "boothSlip") ? (
                <span onClick={handleElectionRestrictedClick}>Voter Slip</span>
              ) : (
                <span onClick={handleRestrictedClick}>Voter Slip</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("parties") && (
            <Menu.Item key="parties" icon={<FlagOutlined />}>
              {hasAccess("parties", "party") && !isElectionDisabled() ? (
                <Link to="/parties">Party</Link>
              ) : hasAccess("parties", "party") ? (
                <span onClick={handleElectionRestrictedClick}>Party</span>
              ) : (
                <span onClick={handleRestrictedClick}>Party</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("religion") && (
            <Menu.Item key="religion" icon={<UserAddOutlined />}>
              {hasAccess("religion", "religion") && !isElectionDisabled() ? (
                <Link to="/religion">Religion</Link>
              ) : hasAccess("religion", "religion") ? (
                <span onClick={handleElectionRestrictedClick}>Religion</span>
              ) : (
                <span onClick={handleRestrictedClick}>Religion</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("caste-category") && (
            <Menu.Item key="caste-category" icon={<UserAddOutlined />}>
              {hasAccess("caste-category", "caste") && !isElectionDisabled() ? (
                <Link to="/caste-category">Caste Category</Link>
              ) : hasAccess("caste-category", "caste") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Caste Category
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Caste Category</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("caste") && (
            <Menu.Item key="caste" icon={<UserAddOutlined />}>
              {hasAccess("caste", "caste") && !isElectionDisabled() ? (
                <Link to="/caste">Caste</Link>
              ) : hasAccess("caste", "caste") ? (
                <span onClick={handleElectionRestrictedClick}>Caste</span>
              ) : (
                <span onClick={handleRestrictedClick}>Caste</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("sub-caste") && (
            <Menu.Item key="sub-caste" icon={<UserAddOutlined />}>
              {hasAccess("sub-caste", "subCaste") && !isElectionDisabled() ? (
                <Link to="/sub-caste">Sub-Caste</Link>
              ) : hasAccess("sub-caste", "subCaste") ? (
                <span onClick={handleElectionRestrictedClick}>Sub-Caste</span>
              ) : (
                <span onClick={handleRestrictedClick}>Sub-Caste</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("language") && (
            <Menu.Item key="language" icon={<TranslationOutlined />}>
              {hasAccess("language", "language") && !isElectionDisabled() ? (
                <Link to="/language">Language</Link>
              ) : hasAccess("language", "language") ? (
                <span onClick={handleElectionRestrictedClick}>Language</span>
              ) : (
                <span onClick={handleRestrictedClick}>Language</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("benefit-scheme") && (
            <Menu.Item key="benefit-scheme" icon={<DatabaseOutlined />}>
              {hasAccess("benefit-scheme", "benefitScheme") &&
              !isElectionDisabled() ? (
                <Link to="/benefit-scheme">Schemes</Link>
              ) : hasAccess("benefit-scheme", "benefitScheme") ? (
                <span onClick={handleElectionRestrictedClick}>Schemes</span>
              ) : (
                <span onClick={handleRestrictedClick}>Schemes</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("feedback") && (
            <Menu.Item key="feedback" icon={<CommentOutlined />}>
              {hasAccess("feedback", "feedback") && !isElectionDisabled() ? (
                <Link to="/feedback">Feedback</Link>
              ) : hasAccess("feedback", "feedback") ? (
                <span onClick={handleElectionRestrictedClick}>Feedback</span>
              ) : (
                <span onClick={handleRestrictedClick}>Feedback</span>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/*  part section */}
      {hasModuleAccess("part-manager") && (
        <SubMenu
          key="partSection"
          icon={<DatabaseOutlined />}
          title="Part Manager"
        >
          {hasModuleAccess("part-list") && (
            <Menu.Item key="part-list" icon={<FileTextOutlined />}>
              {hasAccess("part-list", "partList") && !isElectionDisabled() ? (
                <Link to="/part-list">Part List</Link>
              ) : hasAccess("part-list", "partList") ? (
                <span onClick={handleElectionRestrictedClick}>Part List</span>
              ) : (
                <span onClick={handleRestrictedClick}>Part List</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("add-part") && (
            <Menu.Item key="add-part" icon={<UserAddOutlined />}>
              {hasAccess("add-part", "partList", true) &&
              !isElectionDisabled() ? (
                <Link to="/add-part">Add Part</Link>
              ) : hasAccess("add-part", "partList", true) ? (
                <span onClick={handleElectionRestrictedClick}>Add Part</span>
              ) : (
                <span onClick={handleRestrictedClick}>Add Part</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("section-list") && (
            <Menu.Item key="section-list" icon={<FileTextOutlined />}>
              {hasAccess("section-list", "sectionList") &&
              !isElectionDisabled() ? (
                <Link to="/section-list">Section List</Link>
              ) : hasAccess("section-list", "sectionList") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Section List
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Section List</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("add-section") && (
            <Menu.Item key="add-section" icon={<UserAddOutlined />}>
              {hasAccess("add-section", "sectionList", true) &&
              !isElectionDisabled() ? (
                <Link to="/add-section">Add Section</Link>
              ) : hasAccess("add-section", "sectionList", true) ? (
                <span onClick={handleElectionRestrictedClick}>Add Section</span>
              ) : (
                <span onClick={handleRestrictedClick}>Add Section</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("part-map") && (
            <Menu.Item key="part-map" icon={<DatabaseOutlined />}>
              {hasAccess("part-map", "partMap") && !isElectionDisabled() ? (
                <Link to="/part-map">Part Map</Link>
              ) : hasAccess("part-map", "partMap") ? (
                <span onClick={handleElectionRestrictedClick}>Part Map</span>
              ) : (
                <span onClick={handleRestrictedClick}>Part Map</span>
              )}
            </Menu.Item>
          )}
          {hasModuleAccess("boothType") && (
            <Menu.Item key="boothType" icon={<ToolOutlined />}>
              {hasAccess("boothType", "boothType") && !isElectionDisabled() ? (
                <Link to="/boothType">Vulnerability</Link>
              ) : hasAccess("boothType", "boothType") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Vulnerability
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Vulnerability</span>
              )}
            </Menu.Item>
          )}
          {
            // hasModuleAccess("booth-committee") &&
            // <Menu.Item key="booth-committee" icon={<ToolOutlined />}>
            //   {hasAccess("booth-committee", "boothCommittee") &&
            //   !isElectionDisabled() ? (
            //     <Link to="/booth-committee">Booth Committee</Link>
            //   ) : hasAccess("booth-committee", "boothCommittee") ? (
            //     <span onClick={handleElectionRestrictedClick}>
            //       Booth Committee
            //     </span>
            //   ) : (
            //     <span onClick={handleRestrictedClick}>Booth Committee</span>
            //   )}
            // </Menu.Item>
          }
          {
            // hasModuleAccess("bla-2") &&
            <Menu.Item key="bla-2" icon={<ToolOutlined />}>
              {hasAccess("bla-2", "bla-2") &&
              !isElectionDisabled() ? (
                <Link to="/bla-2">BLA-2</Link>
              ) : hasAccess("bla-2", "bla-2") ? (
                <span onClick={handleElectionRestrictedClick}>
                  BLA-2
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>BLA-2</span>
              )}
            </Menu.Item>
          }
        </SubMenu>
      )}
      {/* Voter Manager section */}
      {hasModuleAccess("voter-manager") && (
        <SubMenu
          key="voterData"
          icon={<DatabaseOutlined />}
          title="Voter Manager"
        >
          {hasModuleAccess("voterslist") && (
            <Menu.Item key="voterslist">
              {hasAccess("voterslist", ["votersList", "voterList"]) &&
              !isElectionDisabled() ? (
                <Link to="/voterslist">Voters List</Link>
              ) : hasAccess("voterslist", ["votersList", "voterList"]) ? (
                <span onClick={handleElectionRestrictedClick}>Voters List</span>
              ) : (
                <span onClick={handleRestrictedClick}>Voters List</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("add-voter") && (
            <Menu.Item key="add-voter">
              {hasAccess("add-voter", ["votersList", "voterList"], true) &&
              !isElectionDisabled() ? (
                <Link to="/add-voter">Add Voter</Link>
              ) : hasAccess("add-voter", ["votersList", "voterList"], true) ? (
                <span onClick={handleElectionRestrictedClick}>Add Voter</span>
              ) : (
                <span onClick={handleRestrictedClick}>Add Voter</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("voters-map") && (
            <Menu.Item key="voters-map">
              {hasAccess("voters-map", ["votersMap", "voterMap"]) &&
              !isElectionDisabled() ? (
                <Link to="/voters-map">Voters Map</Link>
              ) : hasAccess("voters-map", ["votersMap", "voterMap"]) ? (
                <span onClick={handleElectionRestrictedClick}>Voters Map</span>
              ) : (
                <span onClick={handleRestrictedClick}>Voters Map</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("duplicate-voters") && (
            <Menu.Item key="duplicate-voters">
              {hasAccess("duplicate-voters", "duplicate-voters") &&
              !isElectionDisabled() ? (
                <Tooltip title="Double Entry Voters" placement="right">
                  <Link to="/duplicate-voters">Double Entry Voters</Link>
                </Tooltip>
              ) : hasAccess("duplicate-voters", "duplicate-voters") ? (
                <Tooltip title="Double Entry Voters" placement="right">
                  <span onClick={handleElectionRestrictedClick}>
                    Double Entry Voters
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Double Entry Voters" placement="right">
                  <span onClick={handleRestrictedClick}>
                    Double Entry Voters
                  </span>
                </Tooltip>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("new-voters") && (
            <Menu.Item key="new-voters">
              {hasAccess("new-voters", "new-voters") &&
              !isElectionDisabled() ? (
                <Link to="/new-voters">Form-6</Link>
              ) : hasAccess("new-voters", "new-voters") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Form-6
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Form-6</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("sir") && (
            <Menu.Item key="sir">
              {hasAccess("sir", ["votersList", "voterList"]) &&
              !isElectionDisabled() ? (
                <Link to="/sir">SIR</Link>
              ) : hasAccess("sir", ["votersList", "voterList"]) ? (
                <span onClick={handleElectionRestrictedClick}>SIR</span>
              ) : (
                <span onClick={handleRestrictedClick}>SIR</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("pdf-photo-processing") && (
            <Menu.Item key="pdf-photo-processing">
              {hasAccess("pdf-photo-processing", ["votersList", "voterList"]) &&
              !isElectionDisabled() ? (
                <Tooltip title="Voter Photo" placement="right">
                  <Link to="/pdf-photo-processing">Voter Photo</Link>
                </Tooltip>
              ) : hasAccess("pdf-photo-processing", [
                  "votersList",
                  "voterList",
                ]) ? (
                <Tooltip title="Voter Photo" placement="right">
                  <span onClick={handleElectionRestrictedClick}>
                    Voter Photo
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Voter Photo" placement="right">
                  <span onClick={handleRestrictedClick}>Voter Photo</span>
                </Tooltip>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("aadhaar-verify") && (
            <Menu.Item key="aadhaar-verify">
              {hasAccess("aadhaar-verify", "aadhaar-verified") &&
              !isElectionDisabled() ? (
                <Tooltip title="Aadhaar Verified Data" placement="right">
                  <Link to="/aadhaar-verify">Aadhaar Verified</Link>
                </Tooltip>
              ) : hasAccess("aadhaar-verify", "aadhaar-verified") ? (
                <Tooltip title="Aadhaar Verified Data" placement="right">
                  <span onClick={handleElectionRestrictedClick}>
                    Aadhaar Verified
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Aadhaar Verified Data" placement="right">
                  <span onClick={handleRestrictedClick}>
                    Aadhaar Verified Data
                  </span>
                </Tooltip>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/* Cadre Manager section */}
      {hasModuleAccess("cadre-manager") && (
        <SubMenu key="cadre" icon={<TeamOutlined />} title="Cadre Manager">
          {hasModuleAccess("cadre-list") && (
            <Menu.Item key="cadre-list">
              {hasAccess("cadre-list", "cadreList") && !isElectionDisabled() ? (
                <Link to="/cadre-list">Cadre List</Link>
              ) : hasAccess("cadre-list", "cadreList") ? (
                <span onClick={handleElectionRestrictedClick}>Cadre List</span>
              ) : (
                <span onClick={handleRestrictedClick}>Cadre List</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("add-cadre") && (
            <Menu.Item key="add-cadre">
              {hasAccess("add-cadre", "cadreList", true) &&
              !isElectionDisabled() ? (
                <Link to="/add-cadre">Add Cadre</Link>
              ) : hasAccess("add-cadre", "cadreList", true) ? (
                <span onClick={handleElectionRestrictedClick}>Add Cadre</span>
              ) : (
                <span onClick={handleRestrictedClick}>Add Cadre</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("cadre-map") && (
            <Menu.Item key="cadre-map">
              {hasAccess("cadre-map", "cadreMap") && !isElectionDisabled() ? (
                <Link to="/cadre-map">Cadre Map</Link>
              ) : hasAccess("cadre-map", "cadreMap") ? (
                <span onClick={handleElectionRestrictedClick}>Cadre Map</span>
              ) : (
                <span onClick={handleRestrictedClick}>Cadre Map</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("cadre-tracking-list") && (
            <Menu.Item key="cadre-tracking-list">
              {hasAccess("cadre-tracking-list", "cadreTrackingList") &&
              !isElectionDisabled() ? (
                <Tooltip title="Cadre Tracking List" placement="right">
                  <Link to="/cadre-tracking-list">Cadre Tracking List</Link>
                </Tooltip>
              ) : hasAccess("cadre-tracking-list", "cadreTrackingList") ? (
                <Tooltip title="Cadre Tracking List" placement="right">
                  <span onClick={handleElectionRestrictedClick}>
                    Cadre Tracking List
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Cadre Tracking List" placement="right">
                  <span onClick={handleRestrictedClick}>
                    Cadre Tracking List
                  </span>
                </Tooltip>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/* Family Manager section */}
      {hasModuleAccess("family-manager") && (
        <Menu.Item key="family" icon={<TeamOutlined />}>
          {hasAccess("family", "family") && !isElectionDisabled() ? (
            <Link to="/family">Family Manager</Link>
          ) : hasAccess("family", "family") ? (
            <span onClick={handleElectionRestrictedClick}>Family Manager</span>
          ) : (
            <span onClick={handleRestrictedClick}>Family Manager</span>
          )}
        </Menu.Item>
      )}

      {/* Commented out campaign manager section */}
      {hasModuleAccess("campaign-manager") && (
        <SubMenu
          key="campaignManager"
          icon={<AppstoreOutlined />}
          title="Campaign Manager"
        >
          {hasModuleAccess("communication") && (
            <Menu.Item key="communication">
              {hasAccess("communication", "communication") &&
              !isElectionDisabled() ? (
                <Link to="/communication">Communication Manager</Link>
              ) : hasAccess("communication", "communication") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Communication Manager
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>
                  Communication Manager
                </span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("create-message") && (
            <Menu.Item key="create-message">
              {hasAccess("create-message", "communication") &&
              !isElectionDisabled() ? (
                <Link to="/create-message">Create Campaign</Link>
              ) : hasAccess("create-message", "communication") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Create Campaign
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Create Campaign</span>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {hasModuleAccess("poll-day-manager") && (
        <SubMenu key="poll-day-manager" icon={<BarChartOutlined />} title="Poll Day Manager">

          <Menu.Item key="voter-turnout" icon={<UserOutlined />}>
          {hasAccess("poll-day-manager", ["vote", "polldayVote"]) &&
          !isElectionDisabled() ? (
            <Link to="/voter-turnout">Voter Turnout</Link>
          ) : hasAccess("poll-day-manager", ["vote", "polldayVote"]) ? (
            <span onClick={handleElectionRestrictedClick}>
                Voter Turnout
            </span>
          ) : (
            <span onClick={handleRestrictedClick}>Voter Turnout</span>
          )}
        </Menu.Item>
          <Menu.Item key="booth-agent" icon={<BarChartOutlined />}>
          {hasAccess("booth-agent", ["vote", "boothAgent"]) &&
          !isElectionDisabled() ? (
            <Link to="/booth-agent">Booth Agent</Link>
          ) : hasAccess("booth-agent", ["vote", "boothAgent"]) ? (
            <span onClick={handleElectionRestrictedClick}>
                Booth Agent
            </span>
          ) : (
            <span onClick={handleRestrictedClick}>Booth Agent</span>
          )}
        </Menu.Item>
          </SubMenu>
      )}

      {/* {hasModuleAccess("survey-manager") && (
        <SubMenu
          key="count-day-manager"
          icon={<NumberOutlined />}
          title="Count Day Manager"
        >
          {/* {hasModuleAccess("count-day-agent") &&  *\/ */}
          {/* (
            <Menu.Item key="count-day-agent" icon={<BarChartOutlined />}>
              {hasAccess("count-day-agent", "count-day-agents") ? (
                <Link to="/count-day-agent">Count Day Agent</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Count Day Agent</span>
              )}
            </Menu.Item>
          ) *\/ */}
          {/* {/* } *\/ */}
        {/* </SubMenu>
      )} */}

      {hasModuleAccess("survey-manager") && (
        <SubMenu
          key="survey"
          icon={<BarChartOutlined />}
          title="Survey Manager"
        >
          {hasModuleAccess("surveyForm") && (
            <Menu.Item key="surveyForm" icon={<BarChartOutlined />}>
              {hasAccess("surveyForm", "surveyForms") ? (
                <Link to="/surveyForm">Survey Forms</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Survey Forms</span>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {hasModuleAccess("member-manager") && (
        <SubMenu
          key="memberManager"
          icon={<AppstoreOutlined />}
          title="Member Manager"
        >
          {hasModuleAccess("memberList") && (
            <Menu.Item key="memberList">
              {hasAccess("memberList", "membersList") ? (
                <Link to="/memberList">Members List</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Members List</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("add-member") && (
            <Menu.Item key="add-member">
              {hasAccess("add-member", "membersList", true) &&
              !isElectionDisabled() ? (
                <Link to="/add-member">Add Member</Link>
              ) : hasAccess("add-member", "membersList", true) ? (
                <span onClick={handleElectionRestrictedClick}>Add Member</span>
              ) : (
                <span onClick={handleRestrictedClick}>Add Member</span>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}
      {hasModuleAccess("report") && (
        <Menu.Item key="report" icon={<BarChartOutlined />}>
          {hasAccess("report", "report") && !isElectionDisabled() ? (
            <Link to="/report">Report</Link>
          ) : hasAccess("report", "report") ? (
            <span onClick={handleElectionRestrictedClick}>Report</span>
          ) : (
            <span onClick={handleRestrictedClick}>Report</span>
          )}
        </Menu.Item>
      )}
      <Menu.Divider />

      {/* settings section */}
      {hasModuleAccess("settings") && (
        <SubMenu key="settings" icon={<SettingOutlined />} title="Settings">
          {hasModuleAccess("profile") && (
            <Menu.Item key="profile" icon={<ProfileOutlined />}>
              {hasAccess("profile", "userProfile") ? (
                <Link to="/profile">User Profile</Link>
              ) : (
                <span onClick={handleRestrictedClick}>User Profile</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("authentication") && (
            <Menu.Item key="authentication" icon={<SafetyOutlined />}>
              {hasAccess("authentication", "authentication") ? (
                <Link to="/authentication">Authentication</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Authentication</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("role") && (
            <Menu.Item key="role" icon={<UserOutlined />}>
              {hasAccess("role", "roles") ? (
                <Link to="/role">Roles</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Roles</span>
              )}
            </Menu.Item>
          )}

          {/* Settings items that depend on elections */}
          {hasModuleAccess("dynamic-fields") && (
            <Menu.Item key="dynamic-fields" icon={<PrinterOutlined />}>
              {hasAccess("dynamic-fields", "dynamic-field") &&
              !isElectionDisabled() ? (
                <Link to="/dynamic-fields">Dynamic Fields</Link>
              ) : hasAccess("dynamic-fields", "dynamic-field") ? (
                <span onClick={handleElectionRestrictedClick}>
                  Dynamic Fields
                </span>
              ) : (
                <span onClick={handleRestrictedClick}>Dynamic Fields</span>
              )}
            </Menu.Item>
          )}

          {hasModuleAccess("fields-order") && (
            <Menu.Item key="fields-order" icon={<PrinterOutlined />}>
              {hasAccess("fields-order", "field-order") &&
              !isElectionDisabled() ? (
                <Tooltip title="Voter Basic Info" placement="right">
                  <Link to="/fields-order">Voter Basic Info</Link>
                </Tooltip>
              ) : hasAccess("fields-order", "field-order") ? (
                <Tooltip title="Voter Basic Info" placement="right">
                  <span onClick={handleElectionRestrictedClick}>
                    Voter Basic Info
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title="Voter Basic Info" placement="right">
                  <span onClick={handleRestrictedClick}>Voter Basic Info</span>
                </Tooltip>
              )}
            </Menu.Item>
          )}

          {/* ADDED: Download Menu Item */}
          {hasModuleAccess("download") && (
            <Menu.Item key="download" icon={<DownloadOutlined />}>
              {hasAccess("download", "download") ? (
                <Link to="/download">Downloads</Link>
              ) : (
                <span onClick={handleRestrictedClick}>Downloads</span>
              )}
            </Menu.Item>
          )}

          {/* ADDED: Catalogue Menu Item */}
          {hasModuleAccess("catalogue") && (
            <Menu.Item key="catalogue" icon={<UserOutlined />}>
              {hasAccess("catalogue", "catalogue") ? (
                <span>Catalogue</span>
              ) : (
                <span onClick={handleRestrictedClick}>Catalogue</span>
              )}
            </Menu.Item>
          )}
        </SubMenu>
      )}

      {/* logout */}
      {jwtToken && (
        <Menu.Item
          key="logout"
          icon={<LogoutOutlined />}
          style={{ fontSize: "12px", marginBottom: "50px" }}
        >
          Logout
        </Menu.Item>
      )}
      <div
        style={{
          marginTop: "-40px",

          textAlign: "center",
          padding: "12px 0",
          fontSize: "12px",
          color: "#888",
        }}
      >
        Version 3.0 | 01-March-25
      </div>
    </Menu>
  );
};

export default SidebarMenu;
