// ElectionSelectorDropdown.tsx
import { Select } from "antd";

const { Option } = Select;

interface Props {
  selectedElectionName: string | null;
  handleSelectElection: (electionName: string, isAutoSelect?: boolean) => void;
  isInitialSetup: boolean;
  allElections: Array<{id: string; electionName: string}>;
  disabled: boolean;
}

export default function ElectionSelectorDropdown({
  selectedElectionName,
  handleSelectElection,
  isInitialSetup,
  allElections,
  disabled
}: Props) {
  console.log('ElectionSelectorDropdown render:', {
    selectedElectionName,
    isInitialSetup,
    allElectionsLength: allElections.length,
    disabled
  });

  const onChange = (electionName: string) => {
    console.log('Dropdown onChange:', electionName);
    handleSelectElection(electionName, false);
  };

  return (
    <Select
      value={selectedElectionName}
      placeholder="Select Election"
      onChange={onChange}
      showSearch
      filterOption={(input, option) =>
        option?.children?.toLowerCase().includes(input.toLowerCase())
      }
      style={{ width: 200, fontSize: "16px" }}
      disabled={disabled}
    >
      {allElections.map((election) => (
        <Option key={election.id} value={election.electionName}>
          {election.electionName}
        </Option>
      ))}
    </Select>
  );
}