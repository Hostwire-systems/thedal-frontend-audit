import React, { useState, useEffect, useRef } from "react";
import { getPartsApi } from "../../api/partApi";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import {
  ShrinkOutlined,
  ExpandOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useLoading } from "../../context/LoadingContext";
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import {
  Spin,
  Button,
  Row,
  Col,
  Select,
  message,
  Progress,
  Tooltip,
} from "antd";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// Create a custom red marker icon
const redIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ClusterLayer component for parts using the custom red marker.
// Now each point can optionally have a partNameEnglish property.
const ClusterLayer = ({
  points,
}: {
  points: Array<{
    partLat: number;
    partLong: number;
    partNameEnglish?: string;
  }>;
}) => {
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const mapInstance = useMap();

  useEffect(() => {
    if (!points.length) return;

    if (!clusterRef.current) {
      clusterRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 19,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        removeOutsideVisibleBounds: true,
        iconCreateFunction: function (cluster) {
          const count = cluster.getChildCount();
          let size: "small" | "medium" | "large";
          if (count < 100) size = "small";
          else if (count < 1000) size = "medium";
          else size = "large";

          return L.divIcon({
            html: `<div class="bg-red-500 text-white rounded-full flex items-center justify-center opacity-90 ${
              size === "small"
                ? "w-8 h-8 text-sm"
                : size === "medium"
                  ? "w-10 h-10 text-base"
                  : "w-12 h-12 text-lg"
            }">${count}</div>`,
            className: "",
            iconSize: L.point(40, 40),
          });
        },
      });
      mapInstance.addLayer(clusterRef.current);
    }

    clusterRef.current.clearLayers();
    const bounds = L.latLngBounds();

    points.forEach((point) => {
      // Create a marker with the red icon and bind a tooltip for the part name
      const marker = L.marker([point.partLat, point.partLong], {
        icon: redIcon,
      });
      if (point.partNo && (point.partNameEnglish || point.partNameL1)) {
        const tooltipContent = `
      <b>${point.partNo}</b> | ${point.partNameEnglish || "N/A"}<br/>
      <b>${point.partNo}</b> | ${point.partNameL1 || "N/A"}<br/>
      <b>${point.schoolName || "N/A"}</b>
    `;
        marker.bindTooltip(tooltipContent, {
          direction: "top",
          opacity: 0.9,
        });
      }
      clusterRef.current?.addLayer(marker);
      bounds.extend([point.partLat, point.partLong]);
    });

    if (points.length > 0) {
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (clusterRef.current) {
        clusterRef.current.clearLayers();
      }
    };
  }, [points, mapInstance]);

  return null;
};

const PartMap = () => {
  // Extend the part type to include partNameEnglish for tooltip display.
  const [parts, setParts] = useState<
    Array<{
      partLat: number;
      partLong: number;
      partNo: string;
      partNameEnglish: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [cacheStatus, setCacheStatus] = useState<
    "loading" | "fresh" | "cached" | "error"
  >("loading");
  const [cacheDate, setCacheDate] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadedRecords, setLoadedRecords] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  // State for filtering by part numbers.
  // Default is empty array which we'll treat as "all"
  const [selectedPartNos, setSelectedPartNos] = useState<string[]>([]);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId,
  );

  const getCacheKey = (electionId: string) => {
    return `parts_map_${electionId}`;
  };

  const saveToCache = (
    electionId: string,
    data: Array<{
      partLat: number;
      partLong: number;
      partNo: string;
      partNameEnglish: string;
    }>,
  ) => {
    try {
      const cacheKey = getCacheKey(electionId);
      const cacheData = {
        data: data,
        timestamp: new Date().toISOString(),
        totalRecords: data.length,
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error("Error saving to cache:", error);
      return false;
    }
  };

  const getFromCache = (electionId: string) => {
    try {
      const cacheKey = getCacheKey(electionId);
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) return null;

      return JSON.parse(cachedData);
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  };

  const clearCache = (electionId: string) => {
    const cacheKey = getCacheKey(electionId);
    localStorage.removeItem(cacheKey);
    message.success("Cache cleared successfully");
  };

  const formatCacheDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Fetch parts from the API and filter out any without valid coordinates.
  // Assumes that each returned part contains partLat, partLong, partNo, and partNameEnglish.
  const fetchParts = async (bypassCache = false) => {
    if (!selectedElectionId) return;
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setError(null);
      setIsLoading(true);
      setLoading(true);
      setParts([]);
      setLoadedRecords(0);
      setCacheStatus("loading");

      // Check cache first unless specifically bypassing
      if (!bypassCache) {
        const cachedData = getFromCache(selectedElectionId);
        if (cachedData && cachedData.data.length > 0) {
          setCacheStatus("cached");
          setCacheDate(cachedData.timestamp);
          setTotalRecords(cachedData.totalRecords);
          setLoadedRecords(cachedData.totalRecords);

          // Load data in batches to prevent UI freezing
          const batchSize = 1000;
          for (let i = 0; i < cachedData.data.length; i += batchSize) {
            const batch = cachedData.data.slice(i, i + batchSize);
            setParts((prev) => [...prev, ...batch]);
            // Allow UI to breathe between batches
            if (i + batchSize < cachedData.data.length) {
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
          }

          setIsLoading(false);
          setLoading(false);
          abortControllerRef.current = null;
          return;
        }
      }

      setCacheStatus("fresh");
      const response = await getPartsApi(parseInt(selectedElectionId));
      if (response.data) {
        const validParts = response.data.filter(
          (part: any) =>
            part.partLat &&
            part.partLong &&
            part.partLat !== 0 &&
            part.partLong !== 0,
        );
        setTotalRecords(validParts.length);
        setLoadedRecords(validParts.length);
        setParts(validParts);
        console.log("validParts", validParts);

        // Save to cache
        const savedSuccessfully = saveToCache(selectedElectionId, validParts);
        if (savedSuccessfully) {
          message.success("Map data cached for faster loading next time");
        }
      }
    } catch (error) {
      console.error("Error fetching parts", error);
      setError("Failed to fetch parts");
      setCacheStatus("error");
    } finally {
      setIsLoading(false);
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRefreshData = async () => {
    await fetchParts(true);
  };

  const handleStopLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [selectedElectionId]);

  // Update map key to force re-render when loading completes.
  useEffect(() => {
    if (!isLoading) {
      setMapKey((prev) => prev + 1);
    }
  }, [isLoading]);

  // Filtering logic:
  // If no part number is selected or "all" is selected, show all parts.
  // Otherwise, filter parts by selected part numbers.
  const filteredParts =
    selectedPartNos.length === 0 || selectedPartNos.includes("all")
      ? parts
      : parts.filter((p) => selectedPartNos.includes(String(p.partNo)));

  // Prepare options for the dropdown.
  const uniquePartNos = Array.from(new Set(parts.map((p) => p.partNo))).sort(
    (a, b) => Number(a) - Number(b),
  );
  const selectOptions = [
    { value: "all", label: "All parts" },
    ...uniquePartNos.map((p) => ({ value: p, label: p })),
  ];

  // Fullscreen toggle functionality.
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!isFullscreen) {
      mapContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 300);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Ensure the map resizes properly when the container size changes.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
          if (filteredParts.length > 0) {
            const bounds = L.latLngBounds(
              filteredParts.map((p) => [p.partLat, p.partLong]),
            );
            mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
          }
        }, 100);
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [filteredParts]);

  return (
    <div className="p-10 pt-5 relative">
      {isLoading && (
        <div className="absolute inset-0 flex justify-center items-center z-50 bg-white bg-opacity-75">
          <Spin className="custom-spin-dark" size="large" />
        </div>
      )}

      <Row gutter={[16, 16]} className="w-full mb-5">
        <Col span={24}>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Part Distribution
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Col span={12}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select part number(s)"
                  value={selectedPartNos}
                  onChange={(values: string[]) => setSelectedPartNos(values)}
                  options={selectOptions}
                  style={{ width: "100%" }}
                />
              </Col>

              <Tooltip
                title={
                  cacheStatus === "cached"
                    ? `Refresh data from server (current data from ${
                        cacheDate ? formatCacheDate(cacheDate) : "cache"
                      })`
                    : "Refresh data"
                }
              >
                <Button
                  type="default"
                  icon={<SyncOutlined />}
                  onClick={handleRefreshData}
                  disabled={isLoading}
                >
                  Refresh
                </Button>
              </Tooltip>

              {cacheStatus === "cached" && selectedElectionId && (
                <Tooltip title="Clear cached map data">
                  <Button
                    type="default"
                    danger
                    onClick={() => clearCache(selectedElectionId)}
                    disabled={isLoading}
                  >
                    Clear Cache
                  </Button>
                </Tooltip>
              )}
            </div>

            {cacheStatus === "cached" && cacheDate && (
              <div className="text-xs text-gray-500">
                Using cached data from {formatCacheDate(cacheDate)}
              </div>
            )}

            {isLoading && totalRecords > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex-grow">
                  <Progress
                    percent={Math.round((loadedRecords / totalRecords) * 100)}
                    size="small"
                    status="active"
                    strokeColor={{
                      "0%": "#108ee9",
                      "100%": "#87d068",
                    }}
                  />
                </div>
                <Button
                  type="primary"
                  danger
                  size="small"
                  onClick={handleStopLoading}
                >
                  Stop
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <div
        ref={mapContainerRef}
        className={`relative ${
          isFullscreen ? "h-screen w-screen" : "h-96 w-full"
        } border-2 border-blue-500 rounded-lg shadow-lg  z-10`}
      >
        {isFullscreen && (
          <div className="fixed top-4 left-4 z-[10000] bg-white p-3 rounded shadow-lg w-[250px] border border-gray-300">
            <Select
              mode="multiple"
              allowClear
              showSearch
              placeholder="Select part number(s)"
              value={selectedPartNos}
onChange={(values: string[]) => setSelectedPartNos(values)}
              open={dropdownVisible}
              onDropdownVisibleChange={setDropdownVisible}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              options={selectOptions}
              style={{ width: "100%" }}
              dropdownStyle={{
                zIndex: 10000, // Ensure it's above Leaflet's default z-index
              }}
            />
          </div>
        )}

        <MapContainer
          key={mapKey}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
          whenReady={(map) => {
            if (filteredParts.length > 0) {
              const bounds = L.latLngBounds(
                filteredParts.map((p) => [p.partLat, p.partLong]),
              );
              map.target.fitBounds(bounds, { padding: [50, 50] });
            }
          }}
          minZoom={2}
          preferCanvas={true}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ClusterLayer points={filteredParts} />
          <ZoomControl position="bottomright" />
        </MapContainer>

        <Button
          className="absolute top-2 right-2 z-50 bg-white border border-gray-300 shadow-md hover:bg-gray-100 rounded-full p-2"
          icon={isFullscreen ? <ShrinkOutlined /> : <ExpandOutlined />}
          onClick={toggleFullscreen}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 1000,
          }}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}
    </div>
  );
};

export default React.memo(PartMap);
