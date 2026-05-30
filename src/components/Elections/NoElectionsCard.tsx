import { Button } from "antd";
import AddListIcon from "../../assets/icons/addlist.svg";
import { useNavigate } from "react-router-dom";
export default function NoElectionsCard() {
  const navigate = useNavigate();
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4">
      <img src={AddListIcon} alt="addlist" />
      <Button
        className="h-[48px] bg-[#DBEAFE] text-[#1E40AF] font-medium leading-4 rounded"
        onClick={() => navigate("/elections/create")}
      >
        Create your First Election
      </Button>
      <p className="text-[12px] font-normal leading-5 text-[#6B7280]">
        There is no election template created yet
      </p>
    </div>
  );
}
