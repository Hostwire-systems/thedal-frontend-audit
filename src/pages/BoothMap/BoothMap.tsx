import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Popup } from "react-leaflet";
import L from "leaflet";

const DEFAULT_CENTER: [number, number] = [13.0365, 77.6141];
const DEFAULT_ZOOM = 16;

const BoothMap = () => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("../../../data/BoothBoundaries.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      layer.bindPopup(`<strong>${feature.properties.PS_Name}</strong>`);
    }
  };

  return (
    <div className="p-10">
      <h2 className="text-xl font-semibold mb-4">Booth Boundaries</h2>
      <div
        className={`relative border-2 border-blue-500 rounded-lg shadow-lg overflow-hidden z-10`}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoData && <GeoJSON data={geoData} onEachFeature={onEachFeature} />}
        </MapContainer>
      </div>
    </div>
  );
};

export default BoothMap;
