import { useState, useEffect, useMemo } from "react";
import { DatePicker } from "antd";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import { FullscreenExitOutlined } from "@ant-design/icons"; // Importing the icon
import { LatLngExpression, Icon, LatLngBounds, LatLng } from "leaflet";
import { Expand, X } from "lucide-react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import axios from "axios";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useLeafletContext } from "@react-leaflet/core";
import { useLoading } from "../../context/LoadingContext";
import DaysNavigator from "./DaysNavigator";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

interface LocationPoint {
  lat: number;
  lng: number;
  activityDate:string;
  timestamp: string;
}

interface LiveLocationProps {
  data: LocationPoint[];
  selectedDateRange: [string, string];
  onDateRangeChange: (dates: [string, string]) => void;
}

// Custom marker icons
const startIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const endIcon = new Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#F44336"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Routing Machine Component
const RoutingMachine = ({ points }: { points: LatLngExpression[] }) => {
  const context = useLeafletContext();
  const [route, setRoute] = useState<LatLngExpression[]>([]);

  useEffect(() => {
    if (points.length < 2) return;

    const fetchRoute = async () => {
      const [start, end] = points;
      try {
        const response = await axios.get(
          `https://api.openrouteservice.org/v2/directions/driving-car`,
          {
            params: {
              api_key:
                "5b3ce3597851110001cf62487124c71bc33e432db98d5f7063d2ddf8",
              start: `${(start as number[])[1]},${(start as number[])[0]}`,
              end: `${(end as number[])[1]},${(end as number[])[0]}`,
            },
          }
        );
        const geometry = response.data.features[0].geometry.coordinates;
        const routeCoords = geometry.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]);
        setRoute(routeCoords);
      } catch (error) {
        console.error("Error fetching route data:", error);
      }
    };

    fetchRoute();
  }, [points]);

  useEffect(() => {
    const map = context.map;

    if (route.length > 1) {
      const polyline = L.polyline(route, {
        color: "#2196F3",
        weight: 4,
        opacity: 0.8,
      });
      polyline.addTo(map);

      return () => {
        map.removeLayer(polyline);
      };
    }
  }, [context.map, route]);

  return null;
};

// AutoFit component
const AutoFit: React.FC<{ points: LatLngExpression[] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const bounds = new LatLngBounds(
        points.map(
          (point) => new LatLng((point as number[])[0], (point as number[])[1])
        )
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);

  return null;
};

const LiveLocation = ({
  data,
  selectedDateRange,
  onDateRangeChange,
}: LiveLocationProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const daysInRange = useMemo(() => {
    const [startDate, endDate] = selectedDateRange.map((date) =>
      dayjs(date).startOf("day")
    );
    const days = [];
    for (
      let day = startDate;
      day.isBefore(endDate) || day.isSame(endDate, "day");
      day = day.add(1, "day")
    ) {
      days.push(day.format("YYYY-MM-DD"));
    }
    return days;
  }, [selectedDateRange]);

  const filteredData = useMemo(() => {
    const selectedDate = daysInRange[currentDayIndex];
    return data.filter(({ activityDate }) => activityDate === selectedDate);
  }, [data, daysInRange, currentDayIndex]);


  // const validData = useMemo(() => {
  //   return data
  //     .filter(({ lat, lng, timestamp }) => {
  //       const pointDate = dayjs(timestamp);
  //       const startDate = dayjs(selectedDateRange[0]).startOf("day");
  //       const endDate = dayjs(selectedDateRange[1]).endOf("day");
  //       return (
  //         lat !== undefined &&
  //         lng !== undefined &&
  //         pointDate.isValid() &&
  //         pointDate.isBetween(startDate, endDate, "day", "[]")
  //       );
  //     })
  //     .sort(
  //       (a, b) =>
  //         new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  //     );
  // }, [data, selectedDateRange]);

   const validData = useMemo(() => {
     return filteredData
       .filter(({ lat, lng,activityDate, timestamp }) => {
         const pointDate = dayjs(timestamp);
         return (
           lat !== undefined &&
           lng !== undefined &&
           pointDate.isValid()
         );
       })
       .sort(
         (a, b) =>
           new Date(a.timestamp).getTime() -
           new Date(b.timestamp).getTime()
       );
   }, [filteredData]);


  const path: LatLngExpression[] = validData.map(({ lat, lng }) => [lat, lng]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    setMapKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullScreen) toggleFullScreen();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isFullScreen]);

  const totalDistance = useMemo(() => {
    let total = 0;
    validData.forEach((point, index) => {
      if (index > 0) {
        const prevPoint = validData[index - 1];
        const lat1 = (prevPoint.lat * Math.PI) / 180;
        const lat2 = (point.lat * Math.PI) / 180;
        const dLat = lat2 - lat1;
        const dLng = ((point.lng - prevPoint.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c; // Earth's radius in km
        total += distance;
      }
    });
    return total;
  }, [validData]);

  return (
    <div
      className={`p-4 bg-white rounded-lg transition-all duration-300 ${
        isFullScreen
          ? "fixed inset-0 z-50 flex flex-col bg-white shadow-lg"
          : "h-auto"
      }`}
    >
      <div
        className={`flex justify-between items-center transition-all duration-300 ${
          isFullScreen
            ? "p-3 bg-white fixed top-0 w-full z-50"
            : "mb-4"
        }`}
      >
        <div>
          <h4 className="text-[18px] text-[#353536] font-medium">
            <span className="text-[#37B3E2]">Live</span> Location
          </h4>
          {/* {validData.length > 0 && (
            <p className="text-sm text-gray-500">
              Total Distance: {totalDistance.toFixed(2)} km
            </p>
          )} */}
        </div>
        <div className="flex items-center gap-4">
          <RangePicker
            onChange={(dates, dateStrings) => {
              if (dates) {
                onDateRangeChange([
                  dayjs(dates[0]).format("YYYY-MM-DD"),
                  dayjs(dates[1]).format("YYYY-MM-DD"),
                ]);
              }
            }}
            value={[dayjs(selectedDateRange[0]), dayjs(selectedDateRange[1])]}
            format="DD-MMM-YYYY"
            className="w-64"
            allowClear={false}
            disabledDate={(current) =>
              current && current > dayjs().endOf("day")
            }
          />
          <button
            onClick={toggleFullScreen}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {isFullScreen ? (
              <X className="w-5 h-5" />
            ) : (
              <Expand className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <div
        className={` ${
          isFullScreen
            ? "fixed z-[60] top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg px-4 "
            : " bg-white"
        }`}
      >
        <DaysNavigator
          days={daysInRange}
          currentDayIndex={currentDayIndex}
          isFullScreen={isFullScreen}
          setCurrentDayIndex={setCurrentDayIndex}
        />
      </div>
      <div
        className={`relative ${
          isFullScreen
            ? "fixed top-20 left-0 w-full h-[calc(100%-80px)] z-40"
            : "h-64"
        }`}
      >
        {isFullScreen && (
          <button
            onClick={() => setIsFullScreen(false)}
            className="absolute top-4 right-4 z-[1000] bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600"
          >
            <FullscreenExitOutlined
              style={{ fontSize: "24px", color: "white" }}
            />
          </button>
        )}
        <MapContainer
          center={path[path.length - 1] || [20.5937, 78.9629]}
          zoom={10}
          className="h-full w-full rounded-3xl"
          key={mapKey}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {path.length > 1 && (
            <>
              <RoutingMachine points={path} />
              <AutoFit points={path} />

              <Marker position={path[0]} icon={startIcon}>
                <Tooltip permanent>
                  Start: {dayjs(validData[0].timestamp).format("HH:mm:ss")}
                </Tooltip>
              </Marker>

              <Marker position={path[path.length - 1]} icon={endIcon}>
                <Tooltip permanent>
                  End:{" "}
                  {dayjs(validData[validData.length - 1].timestamp).format(
                    "HH:mm:ss"
                  )}
                </Tooltip>
              </Marker>

              {validData.map((point, index) => {
                if (index === 0 || index === validData.length - 1) return null;
                return (
                  <Marker
                    key={point.timestamp}
                    position={[point.lat, point.lng]}
                    icon={
                      new Icon({
                        iconUrl:
                          "data:image/svg+xml;base64," +
                          btoa(`
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="8" fill="#2196F3"/>
                          </svg>
                        `),
                        iconSize: [8, 8],
                        iconAnchor: [4, 4],
                      })
                    }
                  >
                    <Tooltip>
                      {dayjs(point.timestamp).format("HH:mm:ss")}
                    </Tooltip>
                  </Marker>
                );
              })}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default LiveLocation;
