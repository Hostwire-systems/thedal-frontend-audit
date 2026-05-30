import { DatePicker } from "antd";
import { MapContainer, TileLayer } from "react-leaflet";

const TrackingMap = () => (
  <div className="p-4 rounded-lg bg-white shadow-lg">
    <div className="h-64">
      <MapContainer center={[51.505, -0.09]} zoom={13} className="h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    </div>
  </div>
);

export default TrackingMap;
