import { Row, Col, message } from "antd";
import { useState, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import ProfileSection from "../../components/profile";
import CadreInfo from "./CadreInfo";
import RecentActivity from "./RecentActivity";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import LiveLocation from "./LiveLocation";
import { getVolunteerLiveActivity } from "../../api/cadreApi";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import dayjs from "dayjs";
import { useLoading } from "../../context/LoadingContext";
import { BASE_URL } from "../../config";

interface CadreDetailsType {
  volunteerId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  whatsAppNumber:string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  assignedBooths: [];
  assignedFamilies?: number[];
  roleName?: string;
  status: string;
  photoUrl: string | null;
  remarks: string;
  electionId?: string;
  gender: string;
  electionName?: string;
}

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

const CadreDetails = () => {
  const { userId: userIdvalue } = useParams<{ userId: string }>();
  const [userId, setUserId] = useState(
    parseInt(userIdvalue)
  );
  const navigate = useNavigate();
  const [cadreDetails, setCadreDetails] = useState<CadreDetailsType | null>(
    null
  );
  const [locationData, setLocationData] = useState<LocationPoint[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<[string, string]>([
    dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const { isLoading, setLoading } = useLoading();

  const allElections = useSelector(
    (state: RootState) => state.election.allElections
  );
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  const selectedElection = allElections.find(
    (election) => election.id === selectedElectionId
  );

  // Fetch location data function
  const fetchLocationData = async (userId:number, dateRange: [string, string]) => {
    if (!userId) return;

    try {
      console.log("userId", userId);
      console.log("selectedElectionId", selectedElectionId);
      const volunteerActivityData = await getVolunteerLiveActivity(
        userId,
        parseInt(selectedElectionId),
        dateRange[0],
        dateRange[1]
      );
      const locationDataArray = volunteerActivityData.map((activity: any) => ({
        lat: activity.latitude,
        lng: activity.longitude,
        activityDate: activity.activityDate,
        timestamp: activity.currentTimeStamp,
      }));
      console.log("locationDataArray", locationDataArray);
      setLocationData(locationDataArray);
    } catch (error) {
      console.error("Error fetching location data:", error);
      message.error("Failed to fetch location data");
    }
  };

  // Handle date range change
  const handleDateRangeChange = async (dateRange: [string, string]) => {
    setSelectedDateRange(dateRange);
    await fetchLocationData(userId, dateRange);
  };

  // Fetch initial cadre details and location data
  useEffect(() => {
    const fetchDetails = async () => {
      if (!userId || !selectedElectionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${BASE_URL}/volunteers/election/${selectedElectionId}/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
              accept: "*/*",
            },
          }
        );
        console.log("response", response);
        if (
          response.data?.data?.electionId &&
          response.data.data.electionId !== selectedElectionId
        ) {
          message.error(
            "This cadre is not associated with the selected election"
          );
          navigate("/cadre-list");
          return;
        }

        const volunteerData = response.data.data;
        const mergedDetails = {
          ...volunteerData,
          electionName: selectedElection?.electionName || "Not Specified",
          electionId: selectedElectionId,
        };
        console.log("mergedDetails", mergedDetails);
        setCadreDetails(mergedDetails);
        const mergedUserId = mergedDetails?.userId;
        setUserId(mergedDetails?.userId);

        // Fetch initial location data with date range
        await fetchLocationData(mergedUserId, selectedDateRange);
      } catch (error) {
        console.error("Error fetching cadre details:", error);
        message.error("Failed to fetch cadre details");
        navigate("/cadre-list");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId, selectedElectionId, selectedElection, navigate]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!selectedElectionId) {
    return <div className="p-4">Please select an election to continue...</div>;
  }

  if (!cadreDetails) {
    return <div className="p-4">No cadre details found</div>;
  }

  return (
    <div className="p-4 bg-white">
      <Row gutter={16}>
        <Col span={24}>
          <h2 className="text-[24px] font-semibold text-[#1C1C1C] leading-20">
            View Cadre
          </h2>
        </Col>
        <Col span={24} className="mt-6">
          <ProfileSection
            firstName={cadreDetails.firstName}
            lastName={cadreDetails.lastName}
            email={cadreDetails.email}
            photoUrl={cadreDetails.photoUrl}
          />
        </Col>
      </Row>
      <Row gutter={16} className="mt-6">
        <Col span={12}>
          <CadreInfo
            electionName={selectedElection?.electionName || "Not Specified"}
            gender={cadreDetails.gender || "Male"}
            mobileNumber={cadreDetails.mobileNumber}
            whatsappNumber={cadreDetails.whatsAppNumber}
            city={cadreDetails.address?.city || "Not Specified"}
            boothAllocation={cadreDetails.assignedBooths.join(",") || "Booth 1"}
            roleName={cadreDetails.roleName}
            assignedFamilies={cadreDetails.assignedFamilies}
          />
        </Col>
        <Col span={12}>
          <RecentActivity
            userId={userId}
            electionId={selectedElectionId}
            dateRange={selectedDateRange}
          />
        </Col>
      </Row>
      <Row gutter={16} className="my-6">
        <Col span={12}>
          <LiveLocation
            data={locationData}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </Col>
        {/* <Col span={12}>
          <SurveyCompleted surveyData={surveyData} />
        </Col> */}
      </Row>
    </div>
  );
};

export default CadreDetails;
