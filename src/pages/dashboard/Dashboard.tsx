import { Tabs } from "antd";
import "./Dashboard.css";
import {
  CalendarOutlined,
  BarChartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import ElectionDashboard from "../electionDashboard";
import CadreDashboard from "../cadreDashboard";
import PollDashboard from "../pollDayDashboard";
import { useSelector } from "react-redux";

const Dashboard = () => {
  const { TabPane } = Tabs;
  const userRole = localStorage.getItem("role");
  const rolesPermission = useSelector(
    (state: any) => state.auth.user?.rolePermission || {}
  );
  const isSuperAdminOrAdmin =
    userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const hasReadPermission = (module: string) =>
    rolesPermission?.[module]?.includes("R");
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Tabs
        defaultActiveKey="1"
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
            <ElectionDashboard />
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
            <CadreDashboard />
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
            <PollDashboard />
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
