import React, { useEffect, useState, useRef } from "react";
import moment from "moment";
import {
  Row,
  Col,
  Card,
  Avatar,
  Timeline,
  Button,
  Typography,
  message,
  Select,
  Spin,
  Input,
} from "antd";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import {
  CompassOutlined,
  PhoneOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CloseOutlined,
  UserOutlined,
  RightOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSelector } from "react-redux";
import axios from "axios";
import { RootState } from "../../redux/store";
import { getCadresApi, extractCadreList } from "../../api/cadreApi";
import { BASE_URL as API_BASE_URL } from "../../config";
import { useLoading } from "../../context/LoadingContext";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

// Types
interface Location {
  latitude: number;
  longitude: number;
}

interface Cadre {
  volunteerId: number;
  userId: number;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  location: Location | null;
  assignedBooth: string;
  status: string;
  photoUrl: string | null;
  remarks: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface Activity {
  activityDate: string;
  distanceFromPreviousLocation: number;
  latitude: number;
  longitude: number;
}

interface CadreResponse {
  content: Cadre[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
}

// Constants
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707]; // Chennai
const DEFAULT_ZOOM = 14;

// Function to create custom marker icon with volunteer name
const createCustomIcon = (volunteerName: string, showName: boolean) => {
  console.log("Creating marker for:", volunteerName);
  return new L.DivIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background-color: #ff4d4f;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <div style="
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          white-space: nowrap;
          color: #333;
          font-weight: 500;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: ${showName ? "block" : "none"};
        ">
          ${volunteerName}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -40],
  });
};

const VolunteersMap: React.FC = () => {
  // State
  const [cadreList, setCadreList] = useState<Cadre[]>([]);
  const [filteredCadreList, setFilteredCadreList] = useState<Cadre[]>([]);
  const [selectedCadre, setSelectedCadre] = useState<Cadre | null>(null);
  const [activityData, setActivityData] = useState<Activity[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [openedPopup, setOpenedPopup] = useState<number | null>(null);
  const [selectedBooth, setSelectedBooth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string | null>();
  const [boothList, setBoothList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoading, setLoading } = useLoading();
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(false);

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Redux
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Transform API response data
  const transformApiResponse = (apiResult: any): Cadre[] => {
    const list = extractCadreList(apiResult);
    console.log("Transforming cadre list (count):", list.length);
    return list.map((item: any) => ({
      volunteerId: item.volunteerId,
      userId: item.userId,
      firstName: item.firstName,
      lastName: item.lastName,
      mobileNumber: item.mobileNumber,
      email: item.email,
      location: null,
      assignedBooth: item?.assignedBooths?.[0]?.toString() || "",
      status: item.status,
      photoUrl: item.photoUrl,
      remarks: item.remarks,
      address: item.address,
    }));
  };

  // Fetch last known location
  const fetchLastLocation = async (
    userId: number
  ): Promise<Location | null> => {
    console.log(`Fetching location for userId: ${userId}`);
    try {
      // Calculate dates (today to 3 months ago)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const response = await axios.get(
        `${API_BASE_URL}/volunteers/activity/${userId}/${selectedElectionId}`,
        {
          params: {
            startDate,
            endDate,
            page: 0,
            size: 100,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Location response:", response.data);

      if (
        response.data.status === "success" &&
        response.data.data.content.length > 0
      ) {
        const lastActivity =
          response.data.data.content[response.data.data.content.length - 1];
        return {
          latitude: lastActivity.latitude,
          longitude: lastActivity.longitude,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching location:", error);
      return null;
    }
  };

  // Fetch cadres data
  const fetchCadres = async (): Promise<void> => {
    if (!selectedElectionId || !userId) return;

    setLoading(true);
    try {
      console.log("Fetching cadres...");
      const response = await getCadresApi(
        parseInt(selectedElectionId),
        parseInt(userId)
      );
      console.log("Cadres response:", response);

      const transformedCadres = transformApiResponse(response);
      if (!transformedCadres.length) {
        console.warn("No cadres returned for map view. Raw response shape:", response);
      }

      // Fetch locations for all cadres
      const cadresWithLocations = await Promise.all(
        transformedCadres.map(async (cadre) => {
          const location = await fetchLastLocation(cadre.userId);
          return {
            ...cadre,
            location,
          };
        })
      );

      console.log("Cadres with locations:", cadresWithLocations);

      setCadreList(cadresWithLocations);
      setFilteredCadreList(cadresWithLocations);

      // Extract unique booth numbers
      const booths = [
        ...new Set(cadresWithLocations.map((c) => c.assignedBooth)),
      ].sort((a: any, b: any) => a - b);
      setBoothList(booths);
      setSelectedBooth("all");

      if (cadresWithLocations.length > 0) {
        const firstCadre = cadresWithLocations[0];
        setSelectedCadre(firstCadre);
        fetchActivity(firstCadre.userId);
        if (mapRef.current && firstCadre.location) {
          centerMapOnCadre(firstCadre);
        }
      }
    } catch (error) {
      console.error("Error fetching cadres:", error);
      setCadreList([]);
      setSelectedCadre(null);
      setFilteredCadreList([]);
      // message.error("Failed to fetch cadres data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch volunteer activity
  const fetchActivity = async (userId: number): Promise<void> => {
    try {
      setIsActivityLoading(true);
      // Calculate dates (today to 3 months ago)
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      console.log(`Fetching activity for userId: ${userId}`);
      const response = await axios.get(
        `${API_BASE_URL}/volunteers/activity/${userId}/${selectedElectionId}`,
        {
          params: {
            startDate,
            endDate,
            page: 0,
            size: 100,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Activity response:", response.data);

      if (response.data.status === "success") {
        setActivityData(response.data.data.content);
      }
    } catch (error) {
      setActivityData([]);
      console.error("Error fetching activity:", error);
      // message.error("Failed to fetch activity data");
    } finally {
      setIsActivityLoading(false);
    }
  };

  // Map center helper
  const centerMapOnCadre = (cadre: Cadre) => {
    if (mapRef.current && cadre.location) {
      const { latitude, longitude } = cadre.location;
      mapRef.current.flyTo([latitude, longitude], DEFAULT_ZOOM, {
        animate: true,
        duration: 1,
      });
      setOpenedPopup(cadre.volunteerId);
    }
  };

  // Event handlers
  const handleCadreSelect = (cadre: Cadre) => {
    console.log("Selected cadre:", cadre);
    setSelectedCadre(cadre);
    if (cadre.userId) {
      fetchActivity(cadre.userId);
    }
    if (mapRef.current && cadre.location) {
      centerMapOnCadre(cadre);
    }
  };

  const handleCopyPhoneNumber = () => {
    if (selectedCadre?.mobileNumber) {
      navigator.clipboard.writeText(selectedCadre.mobileNumber);
      message.success("Phone number copied to clipboard");
    }
  };

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredCadreList(cadreList);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = cadreList.filter((cadre) => {
      const fullName = `${cadre.firstName} ${cadre.lastName}`.toLowerCase();
      return (
        fullName.includes(lowerQuery) || cadre.mobileNumber.includes(query) // Don't lowercase mobile numbers
      );
    });

    setFilteredCadreList(filtered);
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!isFullscreen) {
      mapContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleMarkerClick = (cadre: Cadre) => {
    console.log("Marker clicked:", cadre);
    if (openedPopup === cadre.volunteerId) {
      setOpenedPopup(null);
    } else {
      setOpenedPopup(cadre.volunteerId);
    }
    handleCadreSelect(cadre);
  };

  const handleBoothChange = (value: string) => {
    console.log("Booth selected:", value);
    setSelectedBooth(value);

    let filtered = [...cadreList];

    // Apply status filter if one is selected
    if (selectedStatus) {
      filtered = filtered.filter((cadre) => cadre.status === selectedStatus);
    }

    if (value === "all") {
      setFilteredCadreList(cadreList);
      if (cadreList.length > 0) {
        setSelectedCadre(cadreList[0]);
        fetchActivity(cadreList[0].userId);
      }
    } else {
      const filtered = cadreList.filter(
        (cadre) => cadre.assignedBooth === value
      );

      console.log("Filtered cadres:", filtered);
      setFilteredCadreList(filtered);

      if (filtered.length > 0) {
        setSelectedCadre(filtered[0]);
        fetchActivity(filtered[0].userId);
      } else {
        setSelectedCadre(null);
        setActivityData([]);
      }
    }
  };

  const handleStatusChange = (value: string) => {
    console.log("Updating the status to", value);
    setSelectedStatus(value);

    let filtered = [...cadreList];

    // Apply status filter if one is selected
    if (value) {
      filtered = filtered.filter((cadre) => cadre.status === value);
    }

    // Apply booth filter if one is selected
    if (selectedBooth !== "all") {
      filtered = filtered.filter(
        (cadre) => cadre.assignedBooth === selectedBooth
      );
    }

    console.log("Filtered cadres:", filtered);
    setFilteredCadreList(filtered);

    if (filtered.length > 0) {
      setSelectedCadre(filtered[0]);
      fetchActivity(filtered[0].userId);
    } else {
      setSelectedCadre(null);
      setActivityData([]);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  // Effects
  useEffect(() => {
    if (selectedElectionId) {
      console.log(
        "Component mounted or electionId changed:",
        selectedElectionId
      );
      fetchCadres();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Get filtered activity data
  const getFilteredActivityData = () => {
    if (!selectedCadre?.location) return [];
    return activityData.filter(
      (activity) =>
        activity.latitude === selectedCadre.location?.latitude &&
        activity.longitude === selectedCadre.location?.longitude
    );
  };

  // Get map bounds
  const getMapBounds = () => {
    const markers = filteredCadreList
      .filter((cadre) => cadre.location)
      .map((cadre) =>
        L.marker([cadre.location!.latitude, cadre.location!.longitude])
      );
    // If no markers, return default bounds
    if (!markers.length) {
      return L.latLngBounds([DEFAULT_CENTER, DEFAULT_CENTER]);
    }
    const group = L.featureGroup(markers);
    return group.getBounds();
  };

  return (
    <div
      ref={mapContainerRef}
      className={`relative bg-white ${
        isFullscreen ? "h-screen w-screen p-0" : "p-4"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-4">
        <Title level={4} className="m-0">
          Cadre Map
        </Title>
      </div>
      <Row
        gutter={[16, 16]}
        className={`w-full items-center ${
          isFullscreen
            ? "absolute top-1 right-4 z-[1000] bg-white/90 p-3 rounded-lg shadow-lg"
            : "my-5"
        }`}
        justify="space-between"
        style={isFullscreen ? { width: "auto", maxWidth: "1000px" } : {}}
      >
        {/* Left Section: Search + Buttons */}
        <Col>
          <div
            style={{
              display: "flex",
              gap: "8px",
              width: isFullscreen ? "auto" : "35vw",
            }}
          >
            <Input
              placeholder="Search by name or mobile"
              value={searchQuery}
              className="input-element"
              style={{ width: isFullscreen ? "200px" : "auto" }}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={() => handleSearch(searchQuery)}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              className="h-[45px] px-12 bg-[#1D4ED8]"
              style={{ width: "65px" }}
              onClick={() => handleSearch(searchQuery)}
            />
            <Button
              type="default"
              className="h-[45px] px-4"
              onClick={() => {
                setSearchQuery("");
                handleSearch("");
              }}
            >
              Clear
            </Button>
            <Select
              className="input-element custom-select"
              placeholder="Select Status"
              style={{ width: 200, alignSelf: "center" }}
              onChange={handleStatusChange}
              getPopupContainer={(trigger) =>
                trigger.parentElement || document.body
              }
              value={selectedStatus}
              allowClear
            >
              <Option key={"active"} value={"active"}>
                Active{" "}
              </Option>
              <Option key={"inactive"} value={"inactive"}>
                Inactive{" "}
              </Option>
            </Select>
          </div>
        </Col>

        {/* Right Section: Booth Select + Fullscreen + Close */}
        <Col>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Select
              placeholder="Select Booth"
              className="input-element custom-select"
              style={{ width: 200 }}
              onChange={handleBoothChange}
              value={selectedBooth}
              getPopupContainer={(trigger) =>
                trigger.parentElement || document.body
              }
              defaultValue="all"
            >
              <Option value="all">All Booths</Option>
              {boothList.map((booth) => (
                <Option key={booth} value={booth}>
                  Booth {booth}
                </Option>
              ))}
            </Select>

            <Button
              icon={
                isFullscreen ? (
                  <FullscreenExitOutlined />
                ) : (
                  <FullscreenOutlined />
                )
              }
              onClick={toggleFullscreen}
            />

            {selectedCadre && !isFullscreen && (
              <Button
                icon={<CloseOutlined />}
                onClick={() => setSelectedCadre(null)}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={16}>
        {/* Map Column */}
        <Col span={isFullscreen ? 24 : selectedCadre ? 14 : 24}>
          <div
            className={`relative ${
              isFullscreen ? "h-[calc(100vh-64px)]" : "h-[550px]"
            } bg-white border-2 border-blue-500 rounded-lg shadow-md overflow-hidden`}
          >
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              ref={mapRef}
              className="h-full w-full"
              minZoom={2}
              preferCanvas={true}
              zoomControl={false}
              whenReady={() => {
                if (filteredCadreList.length > 0 && mapRef.current) {
                  const bounds = getMapBounds();
                  try {
                    mapRef.current.fitBounds(bounds);
                  } catch (e) {
                    console.warn("Could not fit bounds", e);
                  }
                }
              }}
            >
              <ZoomControl position="bottomright" />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {filteredCadreList.map(
                (cadre) =>
                  cadre.location && (
                    <Marker
                      key={cadre.volunteerId}
                      position={[
                        cadre.location.latitude,
                        cadre.location.longitude,
                      ]}
                      icon={createCustomIcon(
                        `${cadre.firstName} ${cadre.lastName}`,
                        openedPopup !== cadre.volunteerId
                      )}
                      eventHandlers={{
                        click: () => handleMarkerClick(cadre),
                      }}
                    >
                      {openedPopup === cadre.volunteerId && (
                        <Popup>
                          <div className="text-center p-2">
                            <Text strong className="block text-base">{`${cadre.firstName} ${cadre.lastName}`}</Text>
                            <Text className="text-sm">Booth: {cadre.assignedBooth}</Text>
                          </div>
                        </Popup>
                      )}
                    </Marker>
                  )
              )}
            </MapContainer>
          </div>
        </Col>

        {/* Details Column */}
        <Col
          span={isFullscreen ? 24 : 10}
          className={
            isFullscreen ? "absolute top-10 left-4 w-[400px] z-[1000]" : ""
          }
        >
          {!isLoading && (
            <Card
              className={`border-[#E8E6E6] ${
                isFullscreen ? "bg-white/90 backdrop-blur-sm shadow-lg" : ""
              }`}
              title={
                <>
                  {selectedBooth === "all"
                    ? "All Booths"
                    : `Booth ${selectedBooth}`}
                  {selectedStatus && ` | Status: ${selectedStatus}`}
                </>
              }
            >
              <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
                {filteredCadreList.map((cadre) => (
                  <Card
                    key={cadre.volunteerId}
                    className={`mb-4 cursor-pointer hover:shadow-lg transition-shadow ${
                      isActivityLoading ? "opacity-75" : "opacity-100"
                    }`}
                    onClick={() => handleCadreSelect(cadre)}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar
                        size={48}
                        icon={<UserOutlined />}
                        className="bg-blue-500"
                      />
                      <div>
                        <Text strong className="text-lg block">
                          {`${cadre.firstName} ${cadre.lastName}`}
                        </Text>
                        <Text className="block">{cadre.mobileNumber}</Text>
                        <Text type="secondary" className="block">
                          Status: {cadre.status}
                        </Text>
                      </div>
                    </div>
                    {selectedCadre?.volunteerId === cadre.volunteerId && (
                      <div className="mt-4">
                        <div className="flex space-x-2">
                          <Button
                            type="primary"
                            icon={<CompassOutlined />}
                            onClick={() => centerMapOnCadre(cadre)}
                            className="bg-blue-500 hover:bg-blue-600"
                            size="small"
                          >
                            Center
                          </Button>
                          <Button
                            icon={<PhoneOutlined />}
                            onClick={handleCopyPhoneNumber}
                            size="small"
                          >
                            Copy Phone
                          </Button>
                          <Button
                            type="link"
                            icon={<EnvironmentOutlined />}
                            onClick={() =>
                              navigate(`/cadre-details/${cadre.userId}`)
                            }
                            size="small"
                          >
                            Details
                          </Button>
                        </div>

                        {/* Activity Timeline */}
                        <div className="mt-4">
                          <Text strong>Recent Activity:</Text>
                          {isActivityLoading ? (
                            <div className="flex justify-center items-center h-20">
                              <Spin className="custom-spin-dark" size="small" />
                            </div>
                          ) : activityData.length > 0 ? (
                            <Timeline className="mt-2">
                              {activityData
                                .slice(0, 3)
                                .map((activity, index) => (
                                  <Timeline.Item
                                    key={index}
                                    dot={
                                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                    }
                                  >
                                    <Text className="text-sm">
                                      {moment(activity.activityDate).format(
                                        "DD-MMM-YYYY HH:mm"
                                      )}
                                    </Text>
                                  </Timeline.Item>
                                ))}
                            </Timeline>
                          ) : (
                            <Text type="secondary" className="block mt-2">
                              No last known location data available
                            </Text>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
              {filteredCadreList.length > 0 && !selectedCadre && (
                <div className="text-center py-8">
                  <Text type="secondary">Select a cadre to view details</Text>
                </div>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default VolunteersMap;
