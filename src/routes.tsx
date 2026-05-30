import React, { useEffect } from "react";
import { Drawer, Layout, Result } from "antd";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useSelector } from "react-redux";
import { selectIsCurrentElectionFrozen } from "./redux/slices/electionSlice";
import SidebarMenu from "./components/sidebarMenu";
import Dashboard from "./pages/dashboard";
import RightPanel from "./components/rightPanel";
import Login from "./pages/login";
import Register from "./pages/register";
import Welcome from "./pages/welcome";
import ScrollToTop from "./components/ScrollToTop";
import Header from "./components/header";
import FrozenElectionBanner from "./components/FrozenElectionBanner";
import Party from "./pages/Party";
import AppBanners from "./pages/AppBanners";
import Elections from "./pages/elections";
import CreateElection from "./pages/createElection";
import Profile from "./pages/profile";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import VotersList from "./pages/votersList";
import CreateVoter from "./pages/createVoter";
import BoothType from "./pages/BoothType";
import Step from "./pages/createElection/Step";
import VotersMap from "./pages/VotersMap";
import Religion from "./pages/Religion";
import Caste from "./pages/Caste";
import SubCaste from "./pages/SubCaste";
import CreateCadre from "./pages/createCadre";
import CadreList from "./pages/cadreList";
import CadreDetails from "./pages/cadreDetails";
import VoluteerTracking from "./pages/volunteerTracking";
import VolunteerTrackingList from "./pages/volunteerTrackingList";
import VolunteersMap from "./pages/volunteersMap";
import PollDayManager from "./pages/pollDayManager";
import BoothSlipPage from "./pages/BoothSlip";
import NewsPage from "./pages/News";
import BulkSms from "./pages/BulkSms";
import BenefitScheme from "./pages/BenefitScheme";
import Availability from "./pages/Availability";
import Roles from "./pages/Roles";
import Language from "./pages/Language";
import RolesPermissionsManager from "./pages/RolePage";
import PartList from "./pages/PartManager";
import CreatePart from "./pages/PartManager/createPart";
import SectionList from "./pages/SectionManager/SectionList";
import CreateSection from "./pages/SectionManager/CreateSection";
import PartMap from "./pages/PartManager/PartMap";
import GoogleSignup from "./pages/register/signupForm/GoogleSignup";
import SurveyForm from "./pages/Survey";
import CommunicationManager from "./pages/Communication";
import CreateMessage from "./pages/Communication/CreateMessage";
import CreateMemberManager from "./pages/CreateMemberManager";
import MemberList from "./pages/MemberManager";
import VoterHistory from "./pages/VoterHistory";
import AadhaarVerify from "./pages/AadhaarVerify";
import Feedback from "./pages/Feedback";
import Downloads from "./pages/Download";
import CustomReports from "./pages/CustomReports";
import BoothMap from "./pages/BoothMap/BoothMap";
import Catalouge from "./pages/Catalouge";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import SlipBox from "./pages/SlipBox";
import SurveyFormSubmissions from "./pages/Survey/SurveyFormSubmissions";
import CasteCategory from "./pages/Caste/CasteCategory";
import AiChat from "./pages/AiChat";
import Family from "./pages/FamilyManager";
import FamilyDetail from "./pages/FamilyDetail";
import DuplicateVotersList from "./pages/DuplicateVotersList";
import PdfPhotoProcessing from "./pages/PdfPhotoProcessing/PdfPhotoProcessing";
import PhotoProcessingNotifications from "./components/PhotoProcessingNotifications";
import Authentication from "./pages/Authentication";
import DynamicFields from "./pages/DynamicFields";
import FieldsOrder from "./pages/FieldsOrder/FiledsOrder";
import NewVotersList from "./pages/NewVotersList";
import StaticDashboard from "./pages/StaticDashboard/StaticDashboard";
import CreateFamilyCaptain from "./pages/CreateFamilyCaptain/CreateFamilyCaptain";
import FamilyCaptainList from "./pages/FamilyCaptainList";
import FamilyCaptainDetails from "./pages/FamilyCaptainDetails";
import FamilyCaptainMap from "./pages/FamilyCaptainMap";
import SIR from "./pages/SIR/SIR";
import Reports from "./pages/Reports";
import CountDayAgent from "./pages/CountDayAgent";
import BoothAgent from "./pages/BoothAgent";
import AuthThemeProvider from "./components/auth/AuthThemeProvider";

const { Sider, Content } = Layout;

const AuthLayout: React.FC = () => {
  return (
    <AuthThemeProvider>
      <Routes>
        <Route path="/" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
        <Route path="/google-signup" element={<PublicRoute><GoogleSignup /></PublicRoute>} />
      </Routes>
    </AuthThemeProvider>
  );
};

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSideBarCollapsed, setIsSideBarCollapsed] = React.useState(false);
  const [isNotificationBarCollapsed, setIsNotificationBarCollapsed] =
    React.useState(true);
  const [searchParams] = useSearchParams();
  const onBoardStatus = localStorage.getItem("onBoardStatus");
  const [electionStep, setElectionStep] = React.useState<number | null>(1);
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const getPostLoginRoute = (role?: string | null) => {
    const normalizedRole = (role || localStorage.getItem("role") || "")
      .toString()
      .toUpperCase();
    const isDashboardAllowed =
      normalizedRole === "ADMIN" || normalizedRole === "SUPER_ADMIN";
    return isDashboardAllowed ? "/static-dashboard" : "/cadre-info";
  };


  const noSidebarPaths = [
    "/login",
    "/",
    "/welcome",
    "/register",
    "/google-signup",
  ];

  const handleMenuSelect = (item: { key: string }) => {
    navigate(`/${item.key}`);
  };
  const isNoSidebar = noSidebarPaths.includes(location.pathname);
  const isNoHeader = noSidebarPaths.includes(location.pathname);
  const isWelcome = location.pathname === "/welcome";
  const isRoles = location.pathname === "/role";

  useEffect(() => {
    const token = searchParams.get("t");
    console.log("Inside routes.tsx");
    if (token) {
      // Save the token to localStorage
      localStorage.setItem("jwtToken", token);

      // Decode the token to extract user information (optional)
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token:", decodedToken);

      // Redirect the user to the appropriate page
      const onBoardStatus = localStorage.getItem("onBoardStatus");

      if (!onBoardStatus) {
        // If onBoardStatus is missing, navigate to /google-signup
        navigate("/google-signup");
      } else if (onBoardStatus === "5" || onBoardStatus === "6") {
        navigate(getPostLoginRoute());
      } else {
        navigate(getPostLoginRoute());
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const onBoardStatus = localStorage.getItem("onBoardStatus");
    if (token) {
      if (location.pathname === "/welcome" && parseInt(onBoardStatus || "0") === 5) {
        navigate("/elections");
      }
    }
  }, [location, navigate]);

  const handleResize = () => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    setIsMobile(mobile);
    // Keep notification bar collapsed by default (don't change state on resize)
    // setIsNotificationBarCollapsed(mobile);
    if (mobile) {
      setIsSideBarCollapsed(true); // Always collapsed on mobile
    }
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSideBarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  return (
    <Layout style={{ height: "100vh" }}>
      {!isNoSidebar && !isMobile && (
        <Sider
          collapsible
          collapsed={isSideBarCollapsed}
          onCollapse={(collapsed) => setIsSideBarCollapsed(collapsed)}
          breakpoint="lg"
          collapsedWidth={80}
          width={212}
          className="site-layout-background"
          style={{
            height: "100vh",
            position: "fixed",
            zIndex: 50,
          }}
        >
          <div className="h-full bg-white overflow-hidden">
            <SidebarMenu
              onSelect={handleMenuSelect}
              collapsed={isSideBarCollapsed}
              electionStep={electionStep}
            />
          </div>
        </Sider>
      )}

      {!isNoSidebar && isMobile && (
        <Drawer
          placement="left"
          closable={true}
          onClose={() => setIsSideBarCollapsed(true)}
          open={!isSideBarCollapsed}
          width={280}
          bodyStyle={{ padding: 0 }}
        >
          <div className="h-full bg-white">
            <SidebarMenu
              onSelect={handleMenuSelect}
              collapsed={false}
              electionStep={electionStep}
            />
          </div>
        </Drawer>
      )}

      <Layout
        className="bg-white"
        style={{
          marginLeft:
            !isNoSidebar && !isMobile
              ? isSideBarCollapsed
                ? "80px"
                : "212px"
              : "0",
        }}
      >
        {!isNoHeader && (
          <Header
            isNotificationBarCollapsed={isNotificationBarCollapsed}
            setIsNotificationBarCollapsed={setIsNotificationBarCollapsed}
            setIsSideBarCollapsed={setIsSideBarCollapsed}
            isSideBarCollapsed={isSideBarCollapsed}
          />
        )}

        {!isNoHeader && isFrozen && (
          <div style={{ width: '100%' }}>
            <FrozenElectionBanner variant="banner" />
          </div>
        )}

        <Content
          className={`h-[calc(100vh-64px)] p-3 md:p-4 con ${
            isWelcome || isRoles ? "overflow-y-hidden" : "overflow-y-auto"
          }`}
        >
          <ScrollToTop electionStep={electionStep} />
          <PhotoProcessingNotifications />
          <Routes>
            {/* <Route
              path="/"
              element={
                parseInt(localStorage.getItem("onBoardStatus")) === 5 ||
                parseInt(localStorage.getItem("onBoardStatus")) === 6 ? (
                  <Navigate to={getPostLoginRoute()} replace />
                ) : localStorage.getItem("jwtToken") ? (
                  <Navigate to="/welcome" replace />
                ) : (
                  <Register />
                )
              }
            /> */}
            <Route
              path="cadre-info"
              element={
                <PrivateRoute>
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <Result
                      status="info"
                      title="Web dashboard is not available for Cadre login"
                      subTitle="Please use the mobile app for Cadre operations."
                    />
                  </div>
                </PrivateRoute>
              }
            />
            {/* <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} /> */}
            <Route
              path="complete-sign-up"
              element={<div>Completing sign-up...</div>} // Placeholder, will redirect automatically
            />
            <Route
              path="access-denied"
              element={<div>Completing sign-up...</div>} // Placeholder, will redirect automatically
            />
            {/* <Route
              path="welcome"
              element={

                <PrivateRoute>
                  <Navigate to="/elections" replace />
                </PrivateRoute>
              }
            /> */}
            <Route
              path="google-signup"
              element={
                <PrivateRoute>
                  <GoogleSignup />
                </PrivateRoute>
              }
            />

            <Route
              path="elections"
              element={
                <PrivateRoute requiredPermission="R" routeKey="electionsList">
                  <Elections />
                </PrivateRoute>
              }
            />
            <Route
              // path="elections/create/:id?"
              path="elections/create/"
              element={
                <PrivateRoute requiredPermission="C" routeKey="electionsList">
                  <CreateElection
                    electionStep={electionStep}
                    setElectionStep={setElectionStep}
                  />
                </PrivateRoute>
              }
            />
            <Route
              path="profile"
              element={
                <PrivateRoute requiredPermission="R" routeKey="userProfile">
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/religion"
              element={
                <PrivateRoute requiredPermission="R" routeKey="religion">
                  <Religion />
                </PrivateRoute>
              }
            />
            <Route
              path="/caste-category"
              element={
                <PrivateRoute requiredPermission="R" routeKey="caste-category">
                  <CasteCategory />
                </PrivateRoute>
              }
            />
            <Route
              path="/caste"
              element={
                <PrivateRoute requiredPermission="R" routeKey="caste">
                  <Caste />
                </PrivateRoute>
              }
            />
            <Route
              path="/sub-caste"
              element={
                <PrivateRoute requiredPermission="R" routeKey="subCaste">
                  <SubCaste />
                </PrivateRoute>
              }
            />
            <Route
              path="voterslist"
              element={
                <PrivateRoute requiredPermission="R" routeKey="votersList">
                  <VotersList />
                </PrivateRoute>
              }
            />
            <Route
              path="pdf-photo-processing"
              element={
                <PrivateRoute requiredPermission="U" routeKey="votersList">
                  <PdfPhotoProcessing />
                </PrivateRoute>
              }
            />
            <Route
              path="/cadre-list"
              element={
                <PrivateRoute requiredPermission="R" routeKey="cadreList">
                  <CadreList />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-voter"
              element={
                <PrivateRoute requiredPermission="C" routeKey="addVoter">
                  <CreateVoter onFinish={() => {}} />
                  {/* <Step2 onFinish={() => {}} /> */}
                </PrivateRoute>
              }
            />
            <Route
              path="/elections/step"
              element={
                <PrivateRoute>
                  <Step />
                </PrivateRoute>
              }
            />
            <Route
              path="/voters-map"
              element={
                <PrivateRoute requiredPermission="R" routeKey="votersMap">
                  <VotersMap />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-cadre"
              element={
                <PrivateRoute
                  requiredPermission="C"
                  routeKey="addCadre"
                  // allowedRoles={["SUPER_ADMIN", "ADMIN"]}
                >
                  <CreateCadre />
                  {/* <Step3 onFinish={() => {}} /> */}
                </PrivateRoute>
              }
            />
            <Route
              path="/cadre-details/:userId"
              element={
                <PrivateRoute
                  requiredPermission="R"
                  routeKey="cadreList"
                  // allowedRoles={["SUPER_ADMIN", "ADMIN"]}
                >
                  <CadreDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/family-captain-list"
              element={
                <PrivateRoute requiredPermission="R" routeKey="familyCaptain">
                  <FamilyCaptainList />
                </PrivateRoute>
              }
            />
            <Route
              path="/family-captain-details/:userId"
              element={
                <PrivateRoute requiredPermission="R" routeKey="familyCaptain">
                  <FamilyCaptainDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-family-captain"
              element={
                <PrivateRoute requiredPermission="C" routeKey="familyCaptain">
                  <CreateFamilyCaptain />
                </PrivateRoute>
              }
            />
            <Route
              path="/family-captain-map"
              element={
                <PrivateRoute requiredPermission="R" routeKey="familyCaptain">
                  <FamilyCaptainMap />
                </PrivateRoute>
              }
            />
            <Route
              path="/cadre-tracking"
              element={
                <PrivateRoute
                  requiredPermission="R"
                  routeKey="cadreTrackingList"
                  // allowedRoles={["SUPER_ADMIN", "ADMIN"]}
                >
                  <VoluteerTracking />
                </PrivateRoute>
              }
            />

            <Route
              path="/cadre-tracking-list"
              element={
                <PrivateRoute
                  requiredPermission="R"
                  routeKey="cadreTrackingList"
                  // allowedRoles={["SUPER_ADMIN", "ADMIN"]}
                >
                  <VolunteerTrackingList />
                </PrivateRoute>
              }
            />
            <Route
              path="/cadre-map"
              element={
                <PrivateRoute
                  requiredPermission="R"
                  routeKey="cadreMap"
                  // allowedRoles={["SUPER_ADMIN", "ADMIN"]}
                >
                  <VolunteersMap />
                </PrivateRoute>
              }
            />

            <Route
              path="boothType"
              element={
                <PrivateRoute requiredPermission="R" routeKey="boothType">
                  <BoothType />
                </PrivateRoute>
              }
            />
            <Route
              path="parties"
              element={
                <PrivateRoute requiredPermission="R" routeKey="party">
                  <Party />
                </PrivateRoute>
              }
            />

            <Route
              path="voter-turnout"
              element={
                <PrivateRoute requiredPermission="R" routeKey="vote">
                  <PollDayManager />
                </PrivateRoute>
              }
            />
            <Route
              path="booth-slip"
              element={
                <PrivateRoute
                  requiredPermission="R"
                  routeKey="boothSlip"
                  // allowedRoles={["SUPER_ADMIN", "ADMIN"]}
                >
                  <BoothSlipPage />
                </PrivateRoute>
              }
            />
            <Route
              path="news"
              element={
                <PrivateRoute requiredPermission="R" routeKey="news">
                  <NewsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="app-banner"
              element={
                <PrivateRoute requiredPermission="R" routeKey="appsBanner">
                  <AppBanners />
                </PrivateRoute>
              }
            />
            <Route
              path="bulk-sms"
              element={
                <PrivateRoute requiredPermission="C" routeKey="bulkSms">
                  <BulkSms />
                </PrivateRoute>
              }
            />
            <Route
              path="dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="static-dashboard"
              element={
                <PrivateRoute>
                  {getPostLoginRoute() === "/static-dashboard" ? (
                    <StaticDashboard />
                  ) : (
                    <Navigate to="/cadre-info" replace />
                  )}
                </PrivateRoute>
              }
            />
            <Route
              path="benefit-scheme"
              element={
                <PrivateRoute requiredPermission="R" routeKey="benefitScheme">
                  <BenefitScheme />
                </PrivateRoute>
              }
            />
            <Route
              path="availability"
              element={
                <PrivateRoute requiredPermission="R" routeKey="availability">
                  <Availability />
                </PrivateRoute>
              }
            />
            <Route
              path="roles"
              element={
                <PrivateRoute requiredPermission="R" routeKey="roles">
                  <Roles />
                </PrivateRoute>
              }
            />
            <Route
              path="language"
              element={
                <PrivateRoute requiredPermission="R" routeKey="language">
                  <Language />
                </PrivateRoute>
              }
            />
            <Route
              path="role"
              element={
                <PrivateRoute requiredPermission="R" routeKey="roles">
                  <RolesPermissionsManager />
                </PrivateRoute>
              }
            />
            <Route
              path="part-list"
              element={
                <PrivateRoute requiredPermission="R" routeKey="partList">
                  <PartList />
                </PrivateRoute>
              }
            />
            <Route
              path="add-part"
              element={
                <PrivateRoute requiredPermission="C" routeKey="partList">
                  <CreatePart />
                </PrivateRoute>
              }
            />
            <Route
              path="section-list"
              element={
                <PrivateRoute requiredPermission="R" routeKey="sectionList">
                  <SectionList />
                </PrivateRoute>
              }
            />
            <Route
              path="add-section"
              element={
                <PrivateRoute requiredPermission="C" routeKey="sectionList">
                  <CreateSection />
                </PrivateRoute>
              }
            />
            <Route
              path="part-map"
              element={
                <PrivateRoute requiredPermission="R" routeKey="partMap">
                  <PartMap />
                </PrivateRoute>
              }
            />
            <Route
              path="surveyForm"
              element={
                <PrivateRoute>
                  <SurveyForm />
                </PrivateRoute>
              }
            />
            <Route
              path="surveyForm/:id"
              element={
                <PrivateRoute>
                  <SurveyFormSubmissions />
                </PrivateRoute>
              }
            />
            <Route
              path="communication"
              element={
                <PrivateRoute>
                  <CommunicationManager />
                </PrivateRoute>
              }
            />
            <Route
              path="create-message"
              element={
                <PrivateRoute>
                  <CreateMessage />
                </PrivateRoute>
              }
            />
            <Route
              path="add-member"
              element={
                <PrivateRoute>
                  <CreateMemberManager />
                </PrivateRoute>
              }
            />
            <Route
              path="memberList"
              element={
                <PrivateRoute>
                  <MemberList />
                </PrivateRoute>
              }
            />
            <Route
              path="ai-manager"
              element={
                <PrivateRoute>
                  <AiChat />
                </PrivateRoute>
              }
            />
            <Route
              path="voterHistory"
              element={
                <PrivateRoute>
                  <VoterHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="aadhaar-verify"
              element={
                <PrivateRoute>
                  <AadhaarVerify />
                </PrivateRoute>
              }
            />
            <Route
              path="sir"
              element={
                <PrivateRoute requiredPermission="R" routeKey="votersList">
                  <SIR />
                </PrivateRoute>
              }
            />
            <Route
              path="feedback"
              element={
                <PrivateRoute>
                  <Feedback />
                </PrivateRoute>
              }
            />
            <Route
              path="download"
              element={
                <PrivateRoute>
                  <Downloads />
                </PrivateRoute>
              }
            />
            <Route
              path="custom-report"
              element={
                <PrivateRoute>
                  <CustomReports />
                </PrivateRoute>
              }
            />
            <Route
              path="booth-map"
              element={
                <PrivateRoute>
                  <BoothMap />
                </PrivateRoute>
              }
            />
            <Route
              path="catalogue"
              element={
                <PrivateRoute>
                  <Catalouge />
                </PrivateRoute>
              }
            />
            <Route
              path="catalogue/:id"
              element={
                <PrivateRoute>
                  <ProductDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="Slip-box786"
              element={
                <PrivateRoute>
                  <SlipBox />
                </PrivateRoute>
              }
            />
            <Route
              path="family"
              element={
                <PrivateRoute>
                  <Family />
                </PrivateRoute>
              }
            />
            <Route
              path="family-detail"
              element={
                <PrivateRoute>
                  <FamilyDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="duplicate-voters"
              element={
                <PrivateRoute>
                  <DuplicateVotersList />
                </PrivateRoute>
              }
            />
            <Route
              path="new-voters"
              element={
                <PrivateRoute>
                  <NewVotersList />
                </PrivateRoute>
              }
            />
            <Route
              path="authentication"
              element={
                <PrivateRoute>
                  <Authentication />
                </PrivateRoute>
              }
            />
            <Route
              path="dynamic-fields"
              element={
                <PrivateRoute>
                  <DynamicFields />
                </PrivateRoute>
              }
            />
            <Route
              path="fields-order"
              element={
                <PrivateRoute>
                  <FieldsOrder />
                </PrivateRoute>
              }
            />
            <Route
              path="report"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="count-day-agent"
              element={
                <PrivateRoute>
                  <CountDayAgent />
                </PrivateRoute>
              }
            />
            <Route
              path="booth-agent"
              element={
                <PrivateRoute>
                  <BoothAgent />
                </PrivateRoute>
              }
            />
          </Routes>
        </Content>
      </Layout>

      {!isNoSidebar && !isNotificationBarCollapsed && !isMobile && (
        <Sider
          width={300}
          theme="light"
          className="bg-[#f0f2f5] sticky top-0 h-[100vh] overflow-hidden"
        >
          <RightPanel />
        </Sider>
      )}
    </Layout>
  );
};

const AppRouter: React.FC = () => {
   return (
    <Router>
      <LayoutSelector />
    </Router>
  );
};

const LayoutSelector: React.FC = () => {
  const location = useLocation();
  const authRoutes = ["/login", "/register", "/welcome", "/google-signup", "/"];
  const isAuthRoute = authRoutes.includes(location.pathname);
  
  return isAuthRoute ? <AuthLayout /> : <AppLayout />;
};

export default AppRouter;
