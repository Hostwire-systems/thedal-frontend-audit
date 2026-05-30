import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
} from "recharts";
import { Card, Tabs, Select, Divider, Table, Button } from "antd";
import {
  BarChartOutlined,
  PieChartOutlined,
  TableOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { TabPane } = Tabs;

type ChartType = "bar" | "pie" | "table";

interface Props {
  title: string;
  data: any[];
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  xDataKey: string;
  yDataKey: string;
  showTabs?: boolean;
  tabs?: string[];
  showFilters?: boolean;
  barColors?: string[];
}

const defaultColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

const UniversalChartPanel: React.FC<Props> = ({
  data,
  chartType,
  setChartType,
  xDataKey,
  yDataKey,
  showTabs = false,
  tabs = [],
  showFilters = false,
  barColors = defaultColors,
}) => {
  const formatYAxis = (value: number) => `${value}`;

  const chartOptions = [
    { label: "Bar", icon: <BarChartOutlined />, value: "bar" },
    { label: "Pie", icon: <PieChartOutlined />, value: "pie" },
    { label: "Table", icon: <TableOutlined />, value: "table" },
  ];

  const columns = [
    { title: xDataKey, dataIndex: xDataKey, key: xDataKey },
    { title: yDataKey, dataIndex: yDataKey, key: yDataKey },
  ];

  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {chartOptions.map((opt) => (
              <Button
                key={opt.value}
                type={chartType === opt.value ? "primary" : "default"}
                icon={opt.icon}
                onClick={() => setChartType(opt.value as ChartType)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      }
    >
      {showTabs || showFilters ? (
        <>
          <div
            style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}
          >
            {showTabs && (
              <Tabs defaultActiveKey="1" style={{ flex: 1 }}>
                {tabs.map((tab, index) => (
                  <TabPane tab={tab} key={index + 1} />
                ))}
              </Tabs>
            )}
            {showFilters && (
              <div className="flex gap-4 flex-wrap mt-2 ml-4">
                <div>
                  Gender:{" "}
                  <Select defaultValue="Male" className="custom-select">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                  </Select>
                </div>
                <div>
                  City:{" "}
                  <Select defaultValue="Salem" className="custom-select">
                    <Option value="Salem">Salem</Option>
                    <Option value="Chennai">Chennai</Option>
                  </Select>
                </div>
                <div>
                  Type:{" "}
                  <Select defaultValue="Urban" className="custom-select">
                    <Option value="Urban">Urban</Option>
                    <Option value="Rural">Rural</Option>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <Divider />
        </>
      ) : null}

      {/* Chart Rendering */}
      {chartType === "bar" && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid stroke="none" />
            <XAxis dataKey={xDataKey} tickLine={false} axisLine={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
            />
            <Tooltip />
            <Bar dataKey={yDataKey} barSize={30}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={barColors[index % barColors.length]}
                  radius={[8, 8, 0, 0]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType === "pie" && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip />
           
            <Pie
              data={data}
              dataKey={yDataKey}
              nameKey={xDataKey}
              outerRadius={100}
              innerRadius={60}
              label
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={barColors[index % barColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}

      {chartType === "table" && (
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          rowKey={(record) => record[xDataKey]}
        />
      )}
    </Card>
  );
};

export default UniversalChartPanel;
