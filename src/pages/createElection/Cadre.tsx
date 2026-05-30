import React, { useState, useEffect } from "react";
import { UserOutlined } from "@ant-design/icons";
import {
  Avatar,
  TreeSelect,
  Form,
  Input,
  Checkbox,
  Divider,
  Space,
} from "antd";
import type { CheckboxProps } from "antd";

const CheckboxGroup = Checkbox.Group;

const plainOptions = ["Male", "Female", "Others"];
const defaultCheckedList = ["Option 1", "Option 2"];

const Cadre: React.FC = () => {
  const [cadreList, setCadreList] = useState<Array<any>>([]);
  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [indeterminate, setIndeterminate] = useState(true);
  const [checkAll, setCheckAll] = useState(false);

  const onChange = (list: string[]) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < plainOptions.length);
    setCheckAll(list.length === plainOptions.length);
  };

  const onCheckAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckedList(e.target.checked ? plainOptions : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  useEffect(() => {
    const fetchCadreList = async () => {
      try {
        const response = await fetch("/api/cadre"); // Replace with actual API endpoint
        const data = await response.json();
        setCadreList(data);
      } catch (error) {
        console.error("Error fetching cadre list:", error);
      }
    };

    fetchCadreList();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Setup the election settings</h1>
      <h1 className="text-lg font-bold">Step 3 : Create Cadre</h1>
      <h2 className="text-md font-semibold mt-10">
        Choose method to add cadre
      </h2>

      <Form.Item label="" style={{ maxWidth: "400px" }}>
        <TreeSelect
          treeData={[
            {
              title: "Light",
              value: "light",
              children: [{ title: "Bamboo", value: "bamboo" }],
            },
          ]}
        />
      </Form.Item>

      <div className="flex items-center justify-between mt-5">
        <div className="flex-1 mr-8">
          <h2 className="text-md font-semibold">Enter Election name</h2>
          <Form.Item
            label=""
            style={{ maxWidth: "500px" }}
            name="Input"
            rules={[{ required: true, message: "Please input!" }]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <div className="flex-1 ml-8">
          <h2 className="text-md font-semibold">Full name</h2>
          <Form.Item
            label=""
            style={{ maxWidth: "500px" }}
            name="Input"
            rules={[{ required: true, message: "Please input!" }]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5">
        <div className="flex-1 mr-8">
          <h5 className="text-md font-semibold">Enter mobile number</h5>
          <Form.Item
            label=""
            style={{ maxWidth: "500px" }}
            name="Input"
            rules={[{ required: true, message: "Please input!" }]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <div className="flex-1 ml-8">
          <h5 className="text-md font-semibold">Enter Whatsapp number</h5>
          <Form.Item
            label=""
            style={{ maxWidth: "500px" }}
            name="Input"
            rules={[{ required: true, message: "Please input!" }]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
        </div>
      </div>

      <div className="flex items-center justify-between mt-5">
        <div className="flex-1 mr-8">
          <h5 className="text-md font-semibold">Enter email id (optional)</h5>
          <Form.Item
            label=""
            style={{ maxWidth: "500px" }}
            name="Input"
            rules={[{ required: true, message: "Please input!" }]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <div className="flex-1 ml-8">
          <h5 className="text-md font-semibold mb-3">Choose Gender</h5>
          <CheckboxGroup
            options={plainOptions}
            value={checkedList}
            onChange={onChange}
          />
        </div>
      </div>

      <div className="mt-7">
        <h5 className="font-semibold">Choose Election Picture (optional)</h5>
        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar size={64} icon={<UserOutlined />} />
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-3.5 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800 flex-shrink-0"
            >
              Upload picture
            </button>
            <button
              type="button"
              className="text-grey font-medium text-sm px-5 py-3.5 flex-shrink-0"
            >
              No file chosen
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium text-sm px-5 py-2.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 flex-shrink-0"
            >
              Save and Continue
            </button>
            <button
              type="button"
              className="text-grey font-medium text-sm px-5 py-3.5 flex-shrink-0 border-gray-700"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5">
        {cadreList.map((cadre, index) => (
          <li
            key={index}
            className="bg-white shadow-md rounded-lg p-6 text-center transition-transform transform hover:scale-105"
          >
            <h2 className="text-xl font-semibold mb-2">{cadre.name}</h2>
            <p className="text-gray-600">{cadre.role}</p>
            <Avatar
              style={{ backgroundColor: "#87d068" }}
              icon={<UserOutlined />}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Cadre;
