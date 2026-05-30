import React from "react";
import dayjs from "dayjs";
import Icon, { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Button } from "antd";


interface DaysNavigatorProps {
  days: string[];
  currentDayIndex: number;
  setCurrentDayIndex: (index: number) => void;
  isFullScreen: boolean;
}

const DaysNavigator: React.FC<DaysNavigatorProps> = ({
  days,
  currentDayIndex,
  setCurrentDayIndex,
  isFullScreen,
}) => {
  const handlePrev = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentDayIndex < days.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <Button
        onClick={handlePrev}
        disabled={currentDayIndex === 0}
        className={`p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 ${
          isFullScreen ? "text-sm p-1" : "text-base p-2"
        }`}
        icon={<LeftOutlined />}
      ></Button>
      <div className="flex gap-2 overflow-auto">
        {days.map((day, index) => (
          <button
            key={day}
            onClick={() => setCurrentDayIndex(index)}
            className={`p-2 px-4 rounded-lg ${
              index === currentDayIndex
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            } ${isFullScreen ? "text-sm px-3 py-1" : "text-base px-4 py-2"}`}
          >
            {`Day ${index + 1}`}
          </button>
        ))}
      </div>
      <Button
        onClick={handleNext}
        disabled={currentDayIndex === days.length - 1}
        className={`p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 ${
          isFullScreen ? "text-sm p-1" : "text-base p-2"
        }`}
        icon={<RightOutlined />}
      ></Button>
    </div>
  );
};

export default DaysNavigator;
