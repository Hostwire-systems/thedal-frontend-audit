import React, { useState,useEffect } from "react";
import { Input, Button, Select, Typography,message } from "antd";
import { getCadresApi } from "../../api/cadreApi";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";

const { TextArea } = Input;
const { Text } = Typography;

interface MessagePageProps {
  campaignName: string;
  onSendMessage: () => void;
}

const MessagePage: React.FC<MessagePageProps> = ({
  campaignName,
  onSendMessage,
}) => {
  const [sms, setSms] = useState("");
  const [selectedCadres, setSelectedCadres] = useState<string[]>([]);
  const [cadreList, setCadreList] = useState<Array<any>>([]);
  const currentUser = "John Doe"; // Replace with actual user data
  const userId=localStorage.getItem("userId");

   const selectedElectionId = useSelector(
     (state: RootState) => state.election.selectedElectionId
   );

  const handleSendMessage = () => {
    if (!sms.trim() || selectedCadres.length === 0) {
      message.error("Please fill out all fields before sending.");
      return;
    }
    message.success("Message sent successfully!");
    onSendMessage();
  };

   useEffect(() => {
      const fetchCadreList = async () => {
        if(!selectedElectionId) return;
        try {
          const response = await getCadresApi(parseInt(selectedElectionId), parseInt(userId!));
          console.log("electionId",selectedElectionId);
          // Normalize response similar to other pages
          const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
          console.log("response",response);
          console.log("cadre data",data);
          setCadreList(data);
        } catch (error) {
          console.error("Error fetching cadre list:", error);
        }
      };
  
      fetchCadreList();
    }, [selectedElectionId]);
  

  return (
    <div>
      <h2 style={{ fontWeight: "bold", marginBottom: "20px" }}>
        {campaignName}
      </h2>
      <div style={{ display: "flex", gap: "20px" }}>
        {/* Left: Message Box */}
        <div style={{ flex: 1 }}>
          <Text>Message</Text>
          <TextArea
            rows={4}
            value={sms}
            onChange={(e) => setSms(e.target.value)}
            placeholder="Write your message here"
          />
          <Button
            type="primary"
            onClick={handleSendMessage}
            style={{ marginTop: "10px" }}
          >
            Send Bulk SMS
          </Button>
        </div>

        {/* Right: Dropdowns */}
        <div style={{ flex: 1 }}>
          <Text>Sender</Text>
          <Select
            value={currentUser}
            disabled
            style={{ width: "100%", marginBottom: "10px" }}
          >
            <Select.Option value={currentUser}>{currentUser}</Select.Option>
          </Select>
          <Text>Cadres</Text>
          <Select
            mode="multiple"
            placeholder="Select cadres"
            value={selectedCadres}
            onChange={(value) => setSelectedCadres(value)}
            style={{ width: "100%" }}
          >
            {/* Dummy Cadres */}
            {cadreList.map((cadre) => (
              <Select.Option
                key={cadre?.volunteerId}
                value={`${cadre?.volunteerId}`}
              >
                {`${cadre?.firstName} ${cadre?.lastName}`}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
