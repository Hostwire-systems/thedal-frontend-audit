import React, { useState, useEffect, useRef } from "react";
import { getVoterLocationsJsonApi } from "../../api/voterApi";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { fetchBooths } from "../../api/boothApi";
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
  Button,
  Row,
  Col,
  Select,
  Progress,
  Tooltip,
  message,
} from "antd";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

interface VoterPoint {
  voterId: string;
  voterLati: number;
  voterLongi: number;
}

// Separate component for map clustering functionality
const MapClusterComponent = ({ points }: { points: VoterPoint[] }) => {
  const mapInstance = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Remove existing cluster group if it exists
    if (clusterGroupRef.current) {
      mapInstance.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Create new cluster group
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 19,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
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

    clusterGroupRef.current = clusterGroup;
    mapInstance.addLayer(clusterGroup);

    // Add markers to cluster group
    const bounds = L.latLngBounds([]);
    
    points.forEach((point) => {
      if (point.voterLati && point.voterLongi && point.voterLati !== 0 && point.voterLongi !== 0) {
        const marker = L.circleMarker([point.voterLati, point.voterLongi], {
          radius: 8,
          fillColor: "#ef4444",
          color: "#b91c1c",
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.7,
        }).bindTooltip(
          `<div class="bg-white p-3 rounded min-w-[240px] text-[14px]">
            <div class="font-semibold text-base text-[#1D1D1D] mb-1">
              Voter ID: ${point.voterId}
            </div>
            <div class="text-[#4A4A4A]">
              <div class="mb-1">
                <span class="font-medium">Latitude:</span> ${point.voterLati}
              </div>
              <div>
                <span class="font-medium">Longitude:</span> ${point.voterLongi}
              </div>
            </div>
          </div>`,
          {
            sticky: true,
            permanent: false,
            direction: "top",
            offset: [0, -10],
          }
        );

        clusterGroup.addLayer(marker);
        bounds.extend([point.voterLati, point.voterLongi]);
      }
    });

    // Fit bounds if we have at least one marker
    if (bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // If no valid points, zoom to default location
      mapInstance.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }

    // Cleanup
    return () => {
      if (clusterGroupRef.current) {
        mapInstance.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [points, mapInstance]);

  return null;
};

const VotersMap = () => {
  const [voters, setVoters] = useState<VoterPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setLoading } = useLoading();
  const [mapKey, setMapKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoothNumbers, setSelectedBoothNumbers] = useState<(number | "ALL")[]>([]);
  const [boothNumbers, setBoothNumbers] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadedRecords, setLoadedRecords] = useState(0);
  const [cacheStatus, setCacheStatus] = useState<"loading" | "fresh" | "cached" | "error">("loading");
  const [cacheDate, setCacheDate] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const jsonDataRef = useRef<any>(null);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Utility functions for cache management
  const getCacheKey = (electionId: string, boothNumbers: (number | "ALL")[]) => {
    const boothKey = boothNumbers.includes("ALL")
      ? "ALL"
      : boothNumbers.sort((a, b) => Number(a) - Number(b)).join("_");
    return `voters_map_${electionId}_${boothKey}`;
  };

  const saveToCache = (electionId: string, boothNumbers: (number | "ALL")[], data: VoterPoint[]) => {
    try {
      const cacheKey = getCacheKey(electionId, boothNumbers);
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

  const getFromCache = (electionId: string, boothNumbers: (number | "ALL")[]) => {
    try {
      const cacheKey = getCacheKey(electionId, boothNumbers);
      const cachedData = localStorage.getItem(cacheKey);
      if (!cachedData) return null;
      return JSON.parse(cachedData);
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  };

  const clearCache = (electionId: string, boothNumbers: (number | "ALL")[]) => {
    const cacheKey = getCacheKey(electionId, boothNumbers);
    localStorage.removeItem(cacheKey);
    jsonDataRef.current = null;
    message.success("Cache cleared successfully");
  };

  const formatCacheDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const loadVotersFromJSON = async (electionId: string, boothNumbers: (number | "ALL")[], bypassCache = false) => {
    try {
      setError(null);
      setIsLoading(true);
      setVoters([]);
      setLoadedRecords(0);
      setCacheStatus("loading");

      // Check cache first unless specifically bypassing
      if (!bypassCache) {
        const cachedData = getFromCache(electionId, boothNumbers);
        if (cachedData && cachedData.data.length > 0) {
          setCacheStatus("cached");
          setCacheDate(cachedData.timestamp);
          setTotalRecords(cachedData.totalRecords);
          setLoadedRecords(cachedData.totalRecords);
          setVoters(cachedData.data);
          setIsLoading(false);
          setLoading(false);
          return;
        }
      }

      setCacheStatus("fresh");

      // Fetch fresh data from the JSON API only if not already cached
      let voterLocationsData = jsonDataRef.current;
      if (!voterLocationsData || bypassCache) {
        voterLocationsData = await getVoterLocationsJsonApi(electionId);
        jsonDataRef.current = voterLocationsData;
      }

      if (!voterLocationsData) {
        throw new Error("No data received from API");
      }

      // Transform the JSON data into an array of voters based on booth selection
      const processedVoters: VoterPoint[] = [];

      // Process based on booth selection
      if (boothNumbers.includes("ALL")) {
        // Process all booths
        for (const [boothNum, votersList] of Object.entries(voterLocationsData)) {
          if (Array.isArray(votersList)) {
            for (const voter of votersList) {
              if (voter && typeof voter === 'object') {
                const { voterId, voterLati, voterLongi } = voter;
                
                // Check for valid coordinates (not null, not 0)
                if (typeof voterLati === 'number' && typeof voterLongi === 'number' && 
                    voterLati !== 0 && voterLongi !== 0 && 
                    !isNaN(voterLati) && !isNaN(voterLongi)) {
                  processedVoters.push({
                    voterId,
                    voterLati,
                    voterLongi
                  });
                }
              }
            }
          }
        }
      } else {
        // Process only selected booths
        for (const boothNumber of boothNumbers) {
          const votersList = voterLocationsData[boothNumber];
          if (Array.isArray(votersList)) {
            for (const voter of votersList) {
              if (voter && typeof voter === 'object') {
                const { voterId, voterLati, voterLongi } = voter;
                
                // Check for valid coordinates (not null, not 0)
                if (typeof voterLati === 'number' && typeof voterLongi === 'number' && 
                    voterLati !== 0 && voterLongi !== 0 && 
                    !isNaN(voterLati) && !isNaN(voterLongi)) {
                  processedVoters.push({
                    voterId,
                    voterLati,
                    voterLongi
                  });
                }
              }
            }
          }
        }
      }

      setTotalRecords(processedVoters.length);
      setLoadedRecords(processedVoters.length);
      setVoters(processedVoters);

      // Cache the processed data
      if (processedVoters.length > 0) {
        const savedSuccessfully = saveToCache(electionId, boothNumbers, processedVoters);
        if (savedSuccessfully) {
          message.success("Map data cached for faster loading next time");
        }
      } else {
        message.info("No voters with valid coordinates found for the selected booths");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching voters from JSON", error);
      setError("Failed to load voter locations");
      setIsLoading(false);
      setCacheStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleBoothChange = async (values: (number | "ALL")[]) => {
    let updatedSelection = [...values];
    const lastSelected = updatedSelection[updatedSelection.length - 1];

    if (lastSelected === "ALL") {
      updatedSelection = ["ALL"];
    } else if (updatedSelection.includes("ALL")) {
      updatedSelection = updatedSelection.filter((booth) => booth !== "ALL");
    }

    setSelectedBoothNumbers(updatedSelection);
    await loadVotersFromJSON(selectedElectionId, updatedSelection);
  };

  const handleRefreshData = async () => {
    if (!selectedBoothNumbers.length) return;
    await loadVotersFromJSON(selectedElectionId, selectedBoothNumbers, true);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!selectedElectionId) return;

      try {
        setIsLoading(true);
        // First, load the voter data to get available booth numbers
        const voterLocationsData = await getVoterLocationsJsonApi(selectedElectionId);
        jsonDataRef.current = voterLocationsData;

        if (voterLocationsData) {
          // Extract booth numbers from the voter data
          const availableBoothNumbers = Object.keys(voterLocationsData)
            .map(booth => parseInt(booth))
            .filter(booth => !isNaN(booth))
            .sort((a, b) => a - b);

          setBoothNumbers(availableBoothNumbers);

          // Initially show all booths
          setSelectedBoothNumbers(["ALL"]);
          await loadVotersFromJSON(selectedElectionId, ["ALL"]);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setError("Failed to load data");
        setCacheStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedElectionId]);

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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 100);
      }
    });

    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Update map key when loading finishes
  useEffect(() => {
    if (!isLoading) {
      setMapKey((prev) => prev + 1);
    }
  }, [isLoading]);

  if (!selectedElectionId) {
    return (
      <div className="flex justify-center items-center h-96 w-full bg-gray-50">
        <p>Please select an election to view voter locations</p>
      </div>
    );
  }

  return (
    <div className="p-10 pt-5 relative">
      <Row gutter={[16, 16]} className="w-full mb-5">
        <Col span={24}>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Voter Distribution
          </h3>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-64">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Booth Number
                </label>
                <Select
                  placeholder="Choose a booth"
                  className="w-full"
                  mode="multiple"
                  onChange={handleBoothChange}
                  value={selectedBoothNumbers}
                  disabled={isLoading}
                >
                  <Select.Option key="ALL" value="ALL">
                    All Booths
                  </Select.Option>

                  {boothNumbers.map((boothNumber) => (
                    <Select.Option key={boothNumber} value={boothNumber}>
                      Booth {boothNumber}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {selectedBoothNumbers.length > 0 && (
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
                    className="mt-6"
                  >
                    Refresh
                  </Button>
                </Tooltip>
              )}

              {cacheStatus === "cached" && selectedBoothNumbers.length > 0 && (
                <Tooltip title="Clear cached map data">
                  <Button
                    type="default"
                    danger
                    onClick={() => clearCache(selectedElectionId, selectedBoothNumbers)}
                    disabled={isLoading}
                    className="mt-6"
                  >
                    Clear Cache
                  </Button>
                </Tooltip>
              )}

              {/* <div className="mt-6 text-sm text-gray-600">
                Showing {voters.length} voters with valid coordinates
              </div> */}
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
              </div>
            )}
          </div>
        </Col>
      </Row>

      <div
        ref={mapContainerRef}
        className={`relative ${
          isFullscreen ? "h-screen w-screen" : "h-[30rem] w-full"
        } border-2 border-blue-500 rounded-lg shadow-lg overflow-hidden z-10`}
      >
        {isFullscreen && (
          <div
            className="fixed top-4 left-4 z-[9999] bg-white p-3 shadow-lg rounded-md w-72 border border-gray-300"
            style={{ zIndex: 9999 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Booth Number
            </label>
            <Select
              placeholder="Choose a booth"
              className="w-64"
              mode="multiple"
              onChange={handleBoothChange}
              getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
              value={selectedBoothNumbers}
              dropdownStyle={{ zIndex: 99999 }}
              disabled={isLoading}
            >
              <Select.Option key="ALL" value="ALL">
                All Booths
              </Select.Option>
              {boothNumbers.map((boothNumber) => (
                <Select.Option key={boothNumber} value={boothNumber}>
                  Booth {boothNumber}
                </Select.Option>
              ))}
            </Select>
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
          minZoom={2}
          preferCanvas={true}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {voters.length > 0 && <MapClusterComponent points={voters} />}
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

export default React.memo(VotersMap);