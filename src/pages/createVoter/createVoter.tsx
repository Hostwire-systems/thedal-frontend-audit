import { Col, message, Radio, Row, Select } from "antd";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { selectIsCurrentElectionFrozen } from "../../redux/slices/electionSlice";
import AddVoterForm from "../../components/addVoterForm";
import AddVoterAPI from "../../components/addVoterAPI";
import VoterBulkUpload from "../../components/voteBulkUpload";
import FrozenElectionBanner from "../../components/FrozenElectionBanner";
import { addVoterFormApi, addVoterImageApi } from "../../api/voterApi";
import { useForm } from "antd/es/form/Form";

export default function CreateVoter({ onFinish }:any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingButton, setLoadingButton] = useState(false);
  const [method, setMethod] = useState<number>(0);
  const [form] = useForm();
  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );
  const isFrozen = useSelector(selectIsCurrentElectionFrozen);

  const isFromSidebar = location.pathname === "/add-voter";

  const handleFinish = async (values) => {
    setLoadingButton(true);
    try {
      if (window.location.href.includes("/add-voter")) {
        const response = await addVoterFormApi(
          values,
          selectedElectionId.toString()
        );
        const voterDetails = response.data;
        console.log("voter created: ", voterDetails);
        if (response.status === "success") {
          if (values.voterImage) {
            const imageResponse = await addVoterImageApi(
              voterDetails.epic_number,
              parseInt(selectedElectionId),
              values.voterImage
            );
            console.log("imageResponse", imageResponse);
            if (imageResponse.status === "success") {
              message.success("Voter image updated successfully.");
            } else {
              message.error("Failed to upload voter image.");
            }
          }
          form.resetFields();
          message.success(response.message);
          setLoadingButton(false);
          navigate("/voterslist");
        }
      } else {
        await onFinish(values);
        setLoadingButton(false);
        form.resetFields();
      }
    } catch (error) {
      console.error("Error in onFinish:", error);
      message.error("An error occurred during form submission.");
    } finally {
      setLoadingButton(false);
    }
  };

  useEffect(() => {
    console.log("Inside createVoter.tsx");
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (location.pathname === "/add-voter") {
      const handlePopState = () => {
        navigate("/dashboard");
      };

      window.addEventListener("popstate", handlePopState);
    }
  }, [navigate, location]);

  return (
    <div className="p-5">
      {isFrozen && (
        <div className="mb-4">
          <FrozenElectionBanner variant="inline" />
        </div>
      )}
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={24}>
          <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
            {isFromSidebar ? "Add Voter" : "Step 2: Create Voter"}
          </h3>
        </Col>
      </Row>
      {isFrozen && (
        <div className="mt-4 text-[15px] text-[#6B7280] font-medium">
          Election is frozen. Adding voters is disabled until the election is unfrozen.
        </div>
      )}
      {!isFrozen && (
        <>
          <Row gutter={[16, 16]} className="w-full items-center mt-4">
            <Col xs = {16} md={16}>
              <p className="text-[#6B7280] text-[16px] font-medium leading-6">
                Choose a method to add voter
              </p>
              <Radio.Group
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full mt-5 custom-radio-group"         
              >
                <Radio value={0}>Bulk Upload</Radio>
                <Radio value={1}>Manual</Radio>
                <Radio value={2}>ECI-API</Radio>
              </Radio.Group>          
            </Col>
          </Row>
          <Row gutter={[16, 16]} className="w-full items-center mt-4">
            <Col span={24}>
              {method === 0 && <VoterBulkUpload onFinish={handleFinish} />}
              {method === 1 && (
                <AddVoterForm
                  onFinish={handleFinish}
                  setLoadingButton={setLoadingButton}
                  loadingButton={loadingButton}
                  form={form}
                  isStandalone={isFromSidebar}
                />
              )}
              {method === 2 && (
                <AddVoterAPI onFinish={handleFinish} isStandalone={isFromSidebar} />
              )}
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
