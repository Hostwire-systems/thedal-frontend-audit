import { Row, Col } from "antd";
import "leaflet/dist/leaflet.css";
import RecentActivity from "../cadreDetails/RecentActivity";
import TrackingMap from "./TrackingMap";

const VolunteerTracking = () => {
  return (
    <div className="p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[18px] text-[#353536] font-medium">
          Cadre Tracking
        </h4>
      </div>
      <Row gutter={16} className="mt-6">
        <Col span={12}>
          <TrackingMap />
        </Col>
        <Col span={12}>
          <RecentActivity />
        </Col>
      </Row>
    </div>
  );
};

export default VolunteerTracking;
