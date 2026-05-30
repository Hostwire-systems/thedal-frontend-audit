import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";

const SurveyCompleted = ({ surveyData }) => (
  <div className="p-4 rounded-lg bg-white shadow-lg">
    <h4 className="text-[18px] text-[#353536] font-medium mb-4">
      Survey Completed
    </h4>
    <div className="flex items-center">
      <div className="w-2/3">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={surveyData}
              dataKey="value"
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              stroke="white"
              strokeWidth={2}
            >
              {surveyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend layout="vertical" align="right" verticalAlign="middle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default SurveyCompleted;
