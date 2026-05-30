import { Col, message, Row, Steps } from "antd";
import { useEffect, useState } from "react";
import Step1 from "./step1/step1";
import { ElectionStep1FormValues } from "../../types";
import {
  uploadElectionApi,
  uploadElectionImageApi,
} from "../../api/electionApi";
import {
  useNavigate,
  useParams,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import CreateVoter from "../../pages/createVoter/";
import Step2 from "./step2/step2";
import { addVoterFormApi } from "../../api/voterApi";
import {
  updateAllElections,
  updateSelectedElectionId,
} from "../../redux/slices/electionSlice";
import { getAllElections } from "../../utlis";
import Step3 from "./step3/step3";
import { addCadreFormApi } from "../../api/cadreApi";

const items = [
  {
    title: "Create election",
  },
  {
    title: "Create voter",
  },
  {
    title: "Create Cadre",
  },
];

interface CreateElectionProps {
  electionStep: number;
  setElectionStep: React.Dispatch<React.SetStateAction<number>>;
}

export default function CreateElection({ electionStep, setElectionStep }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [existingElectionData, setExistingElectionData] = useState<any>(null);

  const selectedElectionId = useSelector(
    (state: RootState) => state.election.selectedElectionId
  );

  // Get the electionId from the state if available, otherwise use selectedElectionId
  const electionId = location.state?.electionId || selectedElectionId;

  const dispatch = useDispatch();

  const electionData = useSelector(
    (state: RootState) => state.election.allElections
  );

  console.log("Using election ID:", electionId);


  useEffect(() => {
    return () => {
      setElectionStep(null);
    };
  }, [setElectionStep]);

  const handlePopState = () => {
    // Check if navigation originated from `/welcome`
    console.log("going back");
    // if (location.state?.fromWelcome) {
    //   console.log("Redirecting to /dashboard");
    //   navigate("https://localhost:5173/dashboard", { replace: true }); // Replace history
    // }
  };
  useEffect(() => {
    console.log("Navigation Type", navigationType);
    if (navigationType === "PUSH" && location.state?.fromWelcome) {
      console.log("PUSH EVENT");
    }
    if (navigationType === "POP") {
      console.log("Pop event");
    }
    if (navigationType === "POP" && location.state?.fromWelcome) {
      console.log("Back button detected! Redirecting to /dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [navigationType, location, navigate]);

  const onFinish = async (values) => {
    if (currentStep === 1) {
      const formData = new FormData();
      formData.append("file", values.electionPicture[0].originFileObj);
      console.log("values", values);

      const payload = {
        ...values,

        states: values.states,
        stateName: values.stateName,
        // year:values.year,
        // month:values.month,
        status: values.status,
        booths: [Number(values.booths)],
        startDate: values.startDate,
        endDate: values.endDate,
        type: values.type,
        body: values.body,
        imageUrl: "",
        // numberOfPollingStation: values.numberOfPollingStation,
        // numberOfPhases: values.numberOfPhases,
        numberOfPinkBooths: values.numberOfPinkBooths,
        numberOfVoters: values.numberOfVoters,
        numberOfMaleVoters: values.numberOfMaleVoters,
        numberOfFemaleVoters: values.numberOfFemaleVoters,
        numberOfTransgenderVoters: values.numberOfTransgenderVoters,
        remarks: values.remarks,
        boothCount: values.booths,
        //new fields
        pcName: values.pcName,
        acName: values.acName,
        urbanName: values.urbanName,
        ruralName: values.ruralName,
        totalAllBooths: values.totalAllBooths,
        electionCategory: values.category || "POLITICAL",
        templateId : 1,
      };
      console.log("payload: ", payload);

      delete payload["electionDate"];
      // delete payload["electionDescription"];
      delete payload["electionPicture"];
      // delete payload["country"];
      try {
        const imageData = await uploadElectionImageApi(formData);
        console.log("imageData", imageData);

        payload["imageUrl"] = imageData.data.imageUrl;

        const data = await uploadElectionApi(
          payload,
          imageData.data.electionId
        );
        console.log("data", data);
        if (data.code === 20303) {
          getAllElections(dispatch, imageData.data.electionId);
          message.success(data.message);

          const newElection = { ...payload, id: imageData.data.electionId };
          console.log("newElection", newElection);

          dispatch(updateAllElections([...electionData, newElection]));
          dispatch(updateSelectedElectionId(newElection.id));

          const updatedElections = [...electionData, newElection];
          localStorage.setItem("elections", JSON.stringify(updatedElections));
          dispatch(updateSelectedElectionId(newElection.id));
          setElectionStep((prev) => prev + 1);
          setCurrentStep(2);
          setElectionStep(2);
        }
      } catch (error) {
        console.log("error: ", error);
        console.error("Error uploading election data:", error);
        // message.error("Failed to create election. Please try again.");
      }
    } else if (currentStep === 2) {
      const response = await addVoterFormApi(values, electionId.toString());
      if (response.status === "success") {
        message.success(response.message);

        // Update localStorage with new election data after adding voter
        const updatedElections = electionData.map((election) =>
          election.id === electionId
            ? { ...election, voters: values.voters }
            : election
        );
        localStorage.setItem("elections", JSON.stringify(updatedElections));

        setCurrentStep(3);
        setElectionStep(3);
      }
    } else if (currentStep === 3) {
      const response = await addCadreFormApi(values);
      if (response.status === "success") {
        message.success(response.message);
        setElectionStep(null);
        navigate("/cadre-list");
      }
    }
  };

  useEffect(() => {
    if (id) {
      // Edit mode: Fetch existing data
      const data = electionData?.find((item: any) => item.id === Number(id));
      setExistingElectionData(data);
      console.log("Election Name:", data); // Log the election name
    } else {
      // Create mode: Empty form
      setExistingElectionData({
        country: "India",
        states: [],
        booths: [],
        type: "",
      });
    }
  }, [id, electionData]);

  useEffect(() => {
    // Synchronize localStorage with Redux state on component mount
    const savedElections = localStorage.getItem("elections");
    if (savedElections) {
      const electionsFromStorage = JSON.parse(savedElections);
      dispatch(updateAllElections(electionsFromStorage));
    }
  }, [dispatch]);

  useEffect(() => {
    if (location.pathname === "/elections/create") {
      window.history.pushState(null, "", location.pathname);
      const handlePopState = () => {
        navigate("/dashboard");
      };

      window.addEventListener("popstate", handlePopState);
    }
  }, [navigate, location]);

  return (
    <Row gutter={[16, 16]} className="h-full p-5">
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={10}>
          <h2 className="font-bold text-[24px] leading-8">
            {id ? "Edit Election" : "Your Elections"}
          </h2>
        </Col>

        <Col span={12} className="relative">
          <Steps
            current={currentStep}
            items={items}
            labelPlacement="vertical"
            className="election-steps absolute bottom-0 top-0"
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} className="w-full">
        <Col span={24}>
          {currentStep === 1 && (
            <Step1
              onFinish={onFinish}
              initialValues={existingElectionData || {}}
            />
          )}
          {currentStep === 2 && <Step2 onFinish={onFinish} />}
          {currentStep === 3 && <Step3 onFinish={onFinish} />}
        </Col>
      </Row>
    </Row>
  );
}
