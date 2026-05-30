import { List, Row, Col } from "antd";
import { FaRegUser } from "react-icons/fa";

interface Role {
  roleName: string;
  permission: string[];
  description: string;
}

interface Props {
  roles: Role[];
}

export default function RoleList({ roles }: Props) {
  return (
    <List
      bordered
      dataSource={roles}
      renderItem={(item) => (
        <List.Item className="h-auto cursor-pointer">
          <Row style={{ width: "100%" }} justify="space-between" className="flex-wrap">
            <Col className="text-[16px] font-medium text-[#1F2937] mb-2 sm:mb-0" style={{ wordWrap: "break-word" }}>
              {item.description}
            </Col>
            <Col className="text-[14px] font-medium leading-5 text-[#005E9E] flex gap-2 items-center" style={{ wordWrap: "break-word" }}>
              {item.roleName} <FaRegUser color="black" />
            </Col>
          </Row>
        </List.Item>
      )}
      className="border-[#E5E7EB] border-[1px] rounded"
    />
  );
}
