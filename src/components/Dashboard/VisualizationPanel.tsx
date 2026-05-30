import { BarChartOutlined, PieChartOutlined, TableOutlined } from "@ant-design/icons";
import { Card, Select, Table } from "antd";
import { Pie, Bar } from "react-chartjs-2";

const { Option } = Select;

interface VisualizationPanelProps {
  title: string;
  chartType: string;
  setChartType: (value: string) => void;
  data: any;
  options?: any;
}

export const VisualizationPanel = ({
  title,
  chartType,
  setChartType,
  data,
  options,
}: VisualizationPanelProps) => {
  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <span style={{ fontWeight: "700", fontFamily: "sans-serif" }}>
            {title}
          </span>
          <Select
            size="small"
            value={chartType}
            style={{ width: 100 }}
            onChange={setChartType}
          >
            <Option value="pie">
              <PieChartOutlined style={{ marginRight: "0.5rem" }} />
              Pie
            </Option>
            <Option value="bar">
              {" "}
              <BarChartOutlined style={{ marginRight: "0.5rem" }} />
              Bar
            </Option>
            <Option value="table">
              {" "}
              <TableOutlined style={{ marginRight: "0.5rem" }} />
              Table
            </Option>
          </Select>
        </div>
      }
      className="bg-[#F7F9FB] hover-card"
      style={{
        borderRadius: "10px",
        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
        border: "none",
      }}
    >
      <div style={{ height: "250px", position: "relative" }}>
        {chartType === "pie" && <Pie data={data} options={options} />}
        {chartType === "bar" && <Bar data={data} options={options} />}
        {chartType === "table" && (
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: "Label", dataIndex: "label", key: "label" },
              { title: "Value", dataIndex: "value", key: "value" },
            ]}
            dataSource={data.labels.map((label: string, index: number) => ({
              key: index,
              label,
              value: data.datasets[0].data[index],
            }))}
          />
        )}
      </div>
    </Card>
  );
};
