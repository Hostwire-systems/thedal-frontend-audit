import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Avatar,
  Button,
  Space,
  Input,
  Select,
  Tag,
  message,
  Tooltip,
  Spin,
  Timeline,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  CompassOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  SearchOutlined,
  CloseOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useLoading } from "../../context/LoadingContext";
import { getFamilyCaptains } from "../../api/familyApi";
import {
  FamilyCaptain,
  FamilyCaptainWithLocation,
} from "../../types/familyCaptain";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const { Text, Title } = Typography;
// const { Search } = Input;
const { Option } = Select;

// Default map configuration
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center
const DEFAULT_ZOOM = 6;

const FamilyCaptainMap: React.FC = () => {
  // State
  const [familyCaptains, setFamilyCaptains] = useState<
    FamilyCaptainWithLocation[]
  >([]);
  const [filteredCaptains, setFilteredCaptains] = useState<
    FamilyCaptainWithLocation[]
  >([]);
  const [selectedCaptain, setSelectedCaptain] =
    useState<FamilyCaptainWithLocation | null>(null);
  const [openedPopup, setOpenedPopup] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Redux
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Loading
  const { isLoading: loading, setLoading } = useLoading();

  // Create custom icon for family captains
  const createCustomIcon = (name: string, isSelected: boolean = false) => {
    const color = isSelected ? "#ff4d4f" : "#1890ff";
    const size = isSelected ? 30 : 25;

    return L.divIcon({
      className: "custom-div-icon",
      html: `
        <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: ${size > 25 ? "14px" : "12px"};
        ">
          ${name.charAt(0).toUpperCase()}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Fetch family captains
  const fetchFamilyCaptains = async () => {
    if (!selectedElectionId) return;

    try {
      setLoading(true);
      console.log("Fetching family captains for map...");

      const response = await getFamilyCaptains(
        parseInt(selectedElectionId),
        0,
        1000 // Get more records for map
      );
      console.log("Response", response);
      if (response.status === "success" && response.data?.content) {
        // For demo purposes, add random locations to family captains
        // In real implementation, you would get actual GPS coordinates from the API
        const captainsWithLocations = response.data.content.map(
          (captain: FamilyCaptain) => ({
            ...captain,
            // Add compatibility fields
            firstName: captain.first_name,
            lastName: captain.last_name,
            mobileNumber: captain.mobile_number,
            photoUrl: captain.photo_url,
            location: generateRandomLocation(), // This should come from actual GPS data
          })
        );

        setFamilyCaptains(captainsWithLocations);
        setFilteredCaptains(captainsWithLocations);

        // Auto-select first captain if available
        if (captainsWithLocations.length > 0) {
          setSelectedCaptain(captainsWithLocations[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching family captains for map:", error);
      message.error("Failed to fetch family captains");
    } finally {
      setLoading(false);
    }
  };

  // Generate random location for demo (replace with actual GPS coordinates)
  const generateRandomLocation = () => {
    // Generate random coordinates within India bounds
    const lat = 8 + Math.random() * 29; // India latitude range approximately
    const lng = 68 + Math.random() * 29; // India longitude range approximately
    return { latitude: lat, longitude: lng };
  };

  // Handle captain selection
  const handleCaptainSelect = (captain: FamilyCaptainWithLocation) => {
    setSelectedCaptain(captain);
    if (captain.location && mapRef.current) {
      mapRef.current.flyTo(
        [captain.location.latitude, captain.location.longitude],
        DEFAULT_ZOOM + 2,
        {
          animate: true,
          duration: 1,
        }
      );
      setOpenedPopup(captain.id || captain.user_id);
    }
  };

  const centerMapOnCaptain = (captain: FamilyCaptainWithLocation) => {
    if (captain.location && mapRef.current) {
      mapRef.current.flyTo(
        [captain.location.latitude, captain.location.longitude],
        DEFAULT_ZOOM + 2,
        {
          animate: true,
          duration: 1,
        }
      );
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query) {
      setFilteredCaptains(familyCaptains);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = familyCaptains.filter((captain) => {
      const fullName = `${captain.first_name} ${
        captain.last_name || ""
      }`.toLowerCase();
      return (
        fullName.includes(lowerQuery) || captain.mobile_number.includes(query)
      );
    });

    setFilteredCaptains(filtered);
    setSelectedCaptain(filtered.length > 0 ? filtered[0] : null);
  };

  // Handle status filter
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);

    let filtered = [...familyCaptains];

    if (value) {
      filtered = filtered.filter((captain) => captain.status === value);
    }

    setFilteredCaptains(filtered);
    setSelectedCaptain(filtered.length > 0 ? filtered[0] : null);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;

    if (!isFullscreen) {
      mapContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Handle marker click
  const handleMarkerClick = (captain: FamilyCaptainWithLocation) => {
    if (openedPopup === (captain.id || captain.user_id)) {
      setOpenedPopup(null);
    } else {
      setOpenedPopup(captain.id || captain.user_id);
      setSelectedCaptain(captain);
    }
  };

  // Copy phone number
  const handleCopyPhoneNumber = () => {
    if (selectedCaptain?.mobile_number) {
      navigator.clipboard.writeText(selectedCaptain.mobile_number);
      message.success("Phone number copied to clipboard");
    }
  };

  const getMapBounds = () => {
    const bounds = new L.LatLngBounds([]);
    filteredCaptains.forEach((captain) => {
      if (captain.location) {
        bounds.extend([captain.location.latitude, captain.location.longitude]);
      }
    });
    return bounds;
  };

  // Effects
  useEffect(() => {
    if (selectedElectionId) {
      fetchFamilyCaptains();
    }
  }, [selectedElectionId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
          Family Captain Map
        </Title>
      </div>

      {/* Search and Filter Row */}
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
                Active
              </Option>
              <Option key={"inactive"} value={"inactive"}>
                Inactive
              </Option>
            </Select>
          </div>
        </Col>

        {/* Right Section: Fullscreen + Close */}
        <Col>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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

            {selectedCaptain && !isFullscreen && (
              <Button
                icon={<CloseOutlined />}
                onClick={() => setSelectedCaptain(null)}
              />
            )}
          </div>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={16}>
        {/* Map Column - Dynamic width based on selection */}
        <Col span={isFullscreen ? 24 : selectedCaptain ? 14 : 24}>
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
                if (filteredCaptains.length > 0 && mapRef.current) {
                  const bounds = getMapBounds();
                  try {
                    mapRef.current.fitBounds(bounds);
                  } catch (e) {
                    console.warn("Could not fit bounds", e);
                  }
                }
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {filteredCaptains.map(
                (captain) =>
                  captain.location && (
                    <Marker
                      key={captain.id || captain.user_id}
                      position={[
                        captain.location.latitude,
                        captain.location.longitude,
                      ]}
                      icon={createCustomIcon(
                        `${captain.first_name} ${
                          captain.last_name || ""
                        }`.trim(),
                        openedPopup === (captain.id || captain.user_id)
                      )}
                      eventHandlers={{
                        click: () => handleMarkerClick(captain),
                      }}
                    >
                      {openedPopup === (captain.id || captain.user_id) && (
                        <Popup>
                          <div className="text-center p-2">
                            <Text strong className="block text-base">
                              {`${captain.first_name} ${
                                captain.last_name || ""
                              }`.trim()}
                            </Text>
                            <Text className="text-sm">
                              Phone: {captain.mobile_number}
                            </Text>
                            <Text className="text-sm">
                              Families: {captain.assigned_families?.length || 0}
                            </Text>
                            <Tag
                              color={
                                captain.status === "active" ? "green" : "red"
                              }
                              className="mt-1"
                            >
                              {captain.status?.toUpperCase()}
                            </Tag>
                          </div>
                        </Popup>
                      )}
                    </Marker>
                  )
              )}
            </MapContainer>
          </div>
        </Col>

        {/* Details Column - Only show when captain is selected */}
        {selectedCaptain && !isFullscreen && (
          <Col span={10}>
            <Card className="border-[#E8E6E6]" title={`Captain Details`}>
              <div className="overflow-y-auto" style={{ maxHeight: "450px" }}>
                <Card
                  className="mb-4 border-1 border-blue-500 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCaptainSelect(selectedCaptain)}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar
                      size={48}
                      src={selectedCaptain.photo_url}
                      icon={<UserOutlined />}
                      className="bg-blue-500"
                    />
                    <div>
                      <Text strong className="text-lg block">
                        {`${selectedCaptain.first_name} ${
                          selectedCaptain.last_name || ""
                        }`.trim()}
                      </Text>
                      <Text className="block">
                        {selectedCaptain.mobile_number}
                      </Text>
                      <Text type="secondary" className="block">
                        Status:{" "}
                        <Tag
                          color={
                            selectedCaptain.status === "active"
                              ? "green"
                              : "red"
                          }
                          className="text-xs"
                        >
                          {selectedCaptain.status.toUpperCase()}
                        </Tag>
                      </Text>
                      <Text type="secondary" className="block">
                        Families:{" "}
                        {selectedCaptain.assigned_families?.length || 0}
                      </Text>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <Button
                        type="primary"
                        icon={<CompassOutlined />}
                        onClick={() => centerMapOnCaptain(selectedCaptain)}
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
                      {/* <Button
                        type="link"
                        icon={<EnvironmentOutlined />}
                        onClick={() => {
                          // Navigate to captain details page
                          console.log("Navigate to captain details");
                        }}
                        size="small"
                      >
                        Details
                      </Button> */}
                    </div>
                  </div>
                </Card>

                {/* Other Captains List */}
                <div className="mt-4">
                  <Text strong>Other Captains:</Text>
                  <div className="mt-2 space-y-2">
                    {filteredCaptains
                      .filter(
                        (captain) => captain.user_id !== selectedCaptain.user_id
                      )
                      .slice(0, 5)
                      .map((captain) => (
                        
                        <Card
                          key={captain.id || captain.user_id}
                          size="small"
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedCaptain?.user_id === captain.user_id
                              ? "border-blue-500 shadow-md"
                              : ""
                          }`}
                          onClick={() => handleCaptainSelect(captain)}
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar
                              size={48}
                              src={captain.photo_url}
                              icon={<UserOutlined />}
                              className="bg-blue-500"
                            />
                            <div className="flex-1">
                              <Text strong className="text-lg block">
                                {`${captain.first_name} ${
                                  captain.last_name || ""
                                }`.trim()}
                              </Text>
                              <Text className="block">
                                {captain.mobile_number}
                              </Text>
                              <div className="flex items-center gap-2 mt-1">
                                <Tag
                                  color={
                                    captain.status === "active"
                                      ? "green"
                                      : "red"
                                  }
                                >
                                  {captain.status?.toUpperCase()}
                                </Tag>
                                <Text type="secondary" className="text-xs">
                                  {captain.assigned_families?.length || 0}{" "}
                                  families
                                </Text>
                              </div>
                            </div>
                          </div>
                          {selectedCaptain?.user_id === captain.user_id && (
                            <div className="mt-4">
                              <div className="flex space-x-2">
                                <Button
                                  type="primary"
                                  icon={<CompassOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCaptainSelect(captain);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600"
                                  size="small"
                                >
                                  Center Map
                                </Button>
                                <Button
                                  icon={<PhoneOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyPhoneNumber();
                                  }}
                                  size="small"
                                >
                                  Copy Phone
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default FamilyCaptainMap;
