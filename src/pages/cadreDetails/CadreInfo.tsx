interface CadreInfoProps {
  electionName?: string;
  mobileNumber: string;
  whatsappNumber: string;
  gender?: string;
  city: string;
  boothAllocation?: string;
  roleName?: string;
  assignedFamilies?: number[];
}

const CadreInfo: React.FC<CadreInfoProps> = ({
  whatsappNumber = "Not Specified",
  electionName = "Not Specified",
  city,
  gender = "Not Specified",
  mobileNumber,
  boothAllocation = "Booth 1",
  roleName,
  assignedFamilies,
}) => {
  const isFamilyCaptain = roleName?.toUpperCase().includes('FAMILY');
  
  return (
    <div className="p-4 rounded-lg bg-white shadow-lg">
      <h4 className="text-[18px] text-[#353536] font-medium mb-4">Cadre Info</h4>
      <InfoRow label="Election Name" value={electionName} />
      {roleName && <InfoRow label="Role" value={roleName} />}
      <InfoRow label="Mobile Number" value={mobileNumber} />
      <InfoRow label="WhatsApp Number" value={whatsappNumber} />
      <InfoRow label="Gender" value={gender} />
      <InfoRow label="City" value={city} />
      <InfoRow label="Booths" value={boothAllocation} />
      {isFamilyCaptain && assignedFamilies && assignedFamilies.length > 0 && (
        <InfoRow 
          label="Assigned Families" 
          value={assignedFamilies.join(", ")} 
        />
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between bg-[#F4F6F5] py-2 px-4 rounded mb-3">
    <span className="text-[12px] font-medium leading-4 text-[#1C2220]">
      {label}
    </span>
    <span className="text-[#293230] text-[14px] font-bold leading-5">
      {value}
    </span>
  </div>
);

export default CadreInfo;