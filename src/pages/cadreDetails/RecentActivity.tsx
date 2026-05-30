import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import ActivityIcon from "../../assets/icons/MaleUser.svg";
import { getVolunteerLiveActivity } from "../../api/cadreApi";
import { message } from "antd";

const RecentActivity = ({ userId,electionId, dateRange }) => {
  const [graphData, setGraphData] = useState([]);

  const formatIndianNumber = (num) => {
    return new Intl.NumberFormat("en-IN").format(num); 
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      console.log("userId",userId);
      console.log("electionId",electionId);
      if (!userId) return;

      try {
        console.log("userId", userId);
        console.log("electionId", electionId);
        const volunteerActivityData = await getVolunteerLiveActivity(
          userId,
          electionId,
          dateRange[0],
          dateRange[1]
        );

        const sortedData = volunteerActivityData
          .sort(
            (a, b) =>
              new Date(b.currentTimeStamp) - new Date(a.currentTimeStamp)
          )
          .slice(0, 7)
          .map((activity) => ({
            date: dayjs(activity.currentTimeStamp).format("DD-MMM-YYYY"),
            distance: (activity.distanceFromPreviousLocation),
          }));
        setGraphData(sortedData);
      } catch (error) {
        console.error("Error fetching location data:", error);
        message.error("Failed to fetch location data");
      }
    };

    fetchLocationData();
  }, [userId, dateRange]);

  return (
    <div className="p-4 rounded-lg bg-white shadow-lg">
      <h4 className="text-[18px] font-medium text-[#353536] mb-4">
        Recent Activity
      </h4>
      {graphData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={graphData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              tickFormatter={(value) =>
                `${formatIndianNumber(value / 100)}k km`
              }
            />
            <Tooltip formatter={(value) => `${formatIndianNumber(value)} km`} />
            <Bar dataKey="distance" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-[300px]">
          <p className="text-lg text-gray-500 font-semibold">
            No recent activity data available
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
