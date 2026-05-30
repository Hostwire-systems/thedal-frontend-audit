// AppHeader.tsx
import React, { useEffect, useState } from "react";
import { Button, Layout, Input, Dropdown, Modal, notification } from "antd";
import { SearchOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import logo from "../../assets/icons/Thedal-logo.svg";
import { useNavigate } from "react-router-dom";
import { PiSidebar } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { updateSelectedElectionId, selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import ElectionSelectorDropdown from "../../components/electionSelectorDropdown/";
import UploadNotifications from "../../components/uploadProgressNotification";
import FrozenElectionBanner from "../FrozenElectionBanner";

const { Header } = Layout;
const { Search } = Input;

interface Props {
  setIsSideBarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isSideBarCollapsed: boolean;
  setIsNotificationBarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isNotificationBarCollapsed: boolean;
}

interface Route {
  path: string;
  name: string;
}

export default function AppHeader({
  setIsSideBarCollapsed,
  isSideBarCollapsed,
  setIsNotificationBarCollapsed,
}: Props) {
  const [selectedElectionName, setSelectedElectionName] = useState<
    string | null
  >(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pendingElectionName, setPendingElectionName] = useState<string>("");
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);
  const [isSearchBarExpanded, setIsSearchBarExpanded] =
    useState<boolean>(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const routes: Route[] = [
    { path: "/welcome", name: "Welcome" },
    { path: "/dashboard", name: "Dashboard" },
    { path: "/elections", name: "Elections" },
    { path: "/elections/create", name: "Create Election" },
    { path: "/profile", name: "Profile" },
    { path: "/religion", name: "Religion" },
    { path: "/caste", name: "Caste" },
    { path: "/sub-caste", name: "Sub Caste" },
    { path: "/voterslist", name: "Voters List" },
    { path: "/cadre-list", name: "Cadre List" },
    { path: "/cadre-tracking-list", name: "Cadre Tracking" },
    { path: "/add-cadre", name: "Create Cadre" },
    { path: "/add-voter", name: "Create Voter" },
    { path: "/voters-map", name: "Voters Map" },
    { path: "/boothType", name: "Booth Type" },
  ];

  // Auto-selection and persistence logic
  useEffect(() => {
    console.log("Auto-selection effect:", {
      allElections,
      isFirstLoad,
      selectedElectionId,
      allElectionsCount: allElections.length,
    });

    if (!allElections.length) return;

    if (isFirstLoad) {
      const persistedId = localStorage.getItem("selectedElectionId");
      console.log("Persisted ID:", persistedId);

      if (persistedId) {
        // Use explicit type conversion to match IDs
        const persistedElection = allElections.find(
          (election) => election.id.toString() === persistedId.toString()
        );

        if (persistedElection) {
          console.log("Found persisted election:", persistedElection);
          handleSelectElection(persistedElection.electionName, true);
        } else {
          console.log("Persisted election not found in available elections");
          const firstElection = allElections[0];
          handleSelectElection(firstElection.electionName, true);
        }
      } else {
        console.log("No persisted ID, selecting first election");
        const firstElection = allElections[0];
        handleSelectElection(firstElection.electionName, true);
      }
      setIsFirstLoad(false);
    }
  }, [allElections, isFirstLoad]);

  useEffect(() => {
    if (selectedElectionId && allElections.length) {
      const currentElection = allElections.find(
        (election) => election.id === Number(selectedElectionId)
      );
      console.log("All elections", allElections);
      console.log("Selected election id", selectedElectionId);
      console.log("Changing election name", currentElection);
      if (currentElection) {
        setSelectedElectionName(currentElection.electionName);
      }
    }
  }, [selectedElectionId, allElections]);

  useEffect(() => {
    if (allElections.length === 0) {
      dispatch(updateSelectedElectionId(""));
      setSelectedElectionName("");
      localStorage.removeItem("selectedElectionId");
    }
  }, [allElections]);

  const handleSelectElection = (
    electionName: string,
    isAutoSelect: boolean = false
  ) => {
    console.log("handleSelectElection:", { electionName, isAutoSelect });

    const selectedElection = allElections.find(
      (election) => election.electionName === electionName
    );

    if (!selectedElection) {
      console.log("Selected election not found");
      return;
    }

    // Convert IDs to strings for comparison
    if (selectedElection.id.toString() === selectedElectionId?.toString()) {
      console.log("Election already selected");
      return;
    }

    if (isAutoSelect) {
      dispatch(updateSelectedElectionId(selectedElection.id));
      setSelectedElectionName(selectedElection.electionName);
      localStorage.setItem(
        "selectedElectionId",
        selectedElection.id.toString()
      );
      notification.info({
        message: "Election Auto-Selected",
        description: `${selectedElection.electionName} has been automatically selected`,
        placement: "topRight",
        duration: 3,
      });
    } else {
      setPendingElectionName(electionName);
      setIsModalVisible(true);
    }
  };

  const handleConfirmChange = () => {
    const selectedElection = allElections.find(
      (election) => election.electionName === pendingElectionName
    );
    if (selectedElection) {
      dispatch(updateSelectedElectionId(selectedElection.id));
      setSelectedElectionName(selectedElection.electionName);
      localStorage.setItem("selectedElectionId", selectedElection.id);
      notification.info({
        message: `Election Switched Successfully!`,
        description: `Election switched to ${selectedElection.electionName}.`,
        placement: "top",
        duration: 3,
      });
    } else {
      dispatch(updateSelectedElectionId(""));
      setSelectedElectionName("");
      localStorage.removeItem("selectedElectionId");
    }
    setIsModalVisible(false);
  };

  const handleCancelChange = () => {
    setIsModalVisible(false);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    const filtered = routes.filter((route) =>
      route.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredRoutes(filtered);
    setDropdownOpen(filtered.length > 0 && value.length > 0);
  };

  const handleMenuClick = (path: string) => {
    setSearchTerm("");
    setDropdownOpen(false);
    navigate(path);
  };

  const handleNotificationClick = () => {
    setIsNotificationBarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    const handleSmallScreen = () => {
      //console.log("Screen is small?", smallScreen);
      const isSmall = window.matchMedia("(max-width : 768px)").matches;
      setIsSmallScreen(isSmall);

      if (!isSmall) {
        setIsSearchBarExpanded(false);
      }
    };

    handleSmallScreen();
    window.addEventListener("resize", handleSmallScreen);

    return () => {
      window.removeEventListener("resize", handleSmallScreen);
    };
  }, []);

  const menu = {
    items: filteredRoutes.map((route) => ({
      key: route.path,
      label: (
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "transparent",
            borderRadius: "4px",
            borderBottom: "1px solid #F5F5F5",
            cursor: "pointer",
            fontSize: "16px",
            color: "#333",
            transition: "background-color 0.3s ease, color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f0f0f0")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          {route.name}
        </div>
      ),
      onClick: () => handleMenuClick(route.path),
    })),
  };

  return (
    <>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: "auto",
          }}
        >
          <PiSidebar
            onClick={() => setIsSideBarCollapsed(!isSideBarCollapsed)}
            className="cursor-pointer text-[20px] mr-[15px] "
          />

          {!isSmallScreen && (
            <>
              <span style={{ marginRight: "5px", fontSize: "16px" }}>
                Election
              </span>
              <ElectionSelectorDropdown
                selectedElectionName={selectedElectionName}
                handleSelectElection={handleSelectElection}
                isInitialSetup={isFirstLoad}
                allElections={allElections}
                disabled={allElections.length === 0}
              />
              {isFrozen && (
                <div style={{ marginLeft: "15px" }}>
                  <FrozenElectionBanner variant="badge" />
                </div>
              )}
            </>
          )}

          <Modal
            title="Confirm Election Change"
            open={isModalVisible}
            okButtonProps={{
              style: {
                backgroundColor: "#1D4ED8",
                borderColor: "#1D4ED8",
                color: "#fff",
              },
            }}
            onOk={handleConfirmChange}
            onCancel={handleCancelChange}
            okText="Yes"
            cancelText="No"
          >
            <p>
              Are you sure you want to change the Election to{" "}
              <strong>{pendingElectionName}</strong>?
            </p>
          </Modal>
        </div>

        {!isSmallScreen && !isSearchBarExpanded && (
          <div
            style={{
              textAlign: "center",
            }}
          >
            <img src={logo} alt="Logo" style={{ height: "34px" }} />
          </div>
        )}

        {isSmallScreen && !isSearchBarExpanded && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <img src={logo} alt="Logo" style={{ height: "34px" }} />
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: "auto",
          }}
        >
          {isSmallScreen ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              {isSearchBarExpanded ? (
                <Dropdown menu={menu} open={dropdownOpen} trigger={["click"]}>
                  <Search
                    placeholder="Search"
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onFocus={() => setDropdownOpen(searchTerm.length > 0)}
                    onChange={handleSearch}
                    onBlur={() => {
                      if (!searchTerm.trim()) {
                        setIsSearchBarExpanded(false);
                      }
                    }}
                    style={{ width: 200, marginRight: "20px" }}
                  />
                </Dropdown>
              ) : (
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  onClick={() => setIsSearchBarExpanded(true)}
                  style={{ fontSize: "20px", marginRight: "16px" }}
                />
              )}
            </div>
          ) : (
            <Dropdown menu={menu} open={dropdownOpen} trigger={["click"]}>
              <Search
                placeholder="Search"
                prefix={<SearchOutlined />}
                value={searchTerm}
                onFocus={() => setDropdownOpen(searchTerm.length > 0)}
                onChange={handleSearch}
                style={{ width: 200, marginRight: "20px" }}
              />
            </Dropdown>
          )}

          <QuestionCircleOutlined
            style={{ fontSize: "20px", marginRight: "20px" }}
          />
          <PiSidebar
            onClick={handleNotificationClick}
            style={{ fontSize: "20px", cursor: "pointer" }}
          />
        </div>
      </Header>
      <UploadNotifications />
    </>
  );
}
