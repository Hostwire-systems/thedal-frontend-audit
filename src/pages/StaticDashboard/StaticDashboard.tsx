import { Result, Tabs } from "antd";
import {useState,useEffect} from "react";
import "../dashboard/Dashboard.css";
import {
  CalendarOutlined,
  BarChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import StaticElectionDashboard from "./StaticElectionDashboard";
import StaticCadreDashboard from "./StaticCadreDashboard";
import StaticPollDayDashboard from "./StaticPollDayDashboard";
import StaticGraphsDashboard from "./StaticGraphsDashboard";

const getInitialDashboardTab = () =>
  localStorage.getItem("staticDashboardActiveTab") || "1";

const StaticDashboard = () => {
  const { TabPane } = Tabs;
  const userRole = localStorage.getItem("role");
  const normalizedRole = (userRole || "").toUpperCase();
  const isCadreLogin = normalizedRole.includes("CADRE");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const [activeTab, setActiveTab] = useState(getInitialDashboardTab);
  const [visitedTabs, setVisitedTabs] = useState<string[]>(() => [getInitialDashboardTab()]);

  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasReadPermission = (module: string) =>
    rolesPermission?.[module]?.includes("R");

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setVisitedTabs((currentTabs) =>
      currentTabs.includes(key) ? currentTabs : [...currentTabs, key]
    );
    localStorage.setItem("staticDashboardActiveTab", key);
  };

  if (isCadreLogin) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <Result
          status="info"
          title="Dashboard is not available for Cadre login"
          subTitle="Please use the mobile app for Cadre operations."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Tabs
        defaultActiveKey="1"
        activeKey={activeTab}
        onChange={handleTabChange}
        destroyInactiveTabPane
        size="large"
        className="custom-tabs"
        tabBarStyle={{ fontSize: "16px", fontWeight: "500" }}
      >
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <BarChartOutlined />
              Election Dashboard
            </span>
          }
          disabled={
            !isSuperAdminOrAdmin && !hasReadPermission("election-dashboard")
          }
          key="1"
        >
          <div className="p-4">
            {visitedTabs.includes("1") ? <StaticElectionDashboard isActive={activeTab === "1"} /> : null}
          </div>
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <TeamOutlined />
              Cadre Dashboard
            </span>
          }
          disabled={
            !isSuperAdminOrAdmin && !hasReadPermission("cadre-dashboard")
          }
          key="2"
        >
          <div className="p-4">
            {visitedTabs.includes("2") ? <StaticCadreDashboard isActive={activeTab === "2"} /> : null}
          </div>
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <CalendarOutlined />
              PollDay Dashboard
            </span>
          }
          disabled={
            !isSuperAdminOrAdmin && !hasReadPermission("pollday-dashboard")
          }
          key="3"
        >
          <div className="p-4">
            {visitedTabs.includes("3") ? <StaticPollDayDashboard /> : null}
          </div>
        </TabPane>
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <BarChartOutlined />
              Graphs Dashboard
            </span>
          }
          disabled={
            !isSuperAdminOrAdmin && !hasReadPermission("graphs-dashboard")
          }
          key="4"
        >
          <div className="p-4">
            {visitedTabs.includes("4") ? <StaticGraphsDashboard isActive={activeTab === "4"} /> : null}
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StaticDashboard;
