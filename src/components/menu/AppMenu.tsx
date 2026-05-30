import {
  DashboardOutlined,
  LoginOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import { useNavigate } from "react-router-dom";

export default function AppMenu() {
  const navigate = useNavigate();
  return (
    <>
      {/* <Menu
        mode="horizontal"
        style={{ background: "transparent", color: "#fff" }}
      >
        <Menu.Item
          key="dashboard"
          icon={<DashboardOutlined />}
          style={{ color: "#fff" }}
        >
          Dashboard
        </Menu.Item>
        <Menu.Item
          key="agents"
          icon={<UserOutlined />}
          style={{ color: "#fff" }}
          onClick={() => navigate("/agents")}
        >
          Agents
        </Menu.Item>
      </Menu>

      <Button
        type="primary"
        icon={<LoginOutlined />}
        style={{ marginLeft: "20px" }}
        onClick={() => navigate("/login")}
      >
        Login
      </Button> */}
    </>
  );
}
