import React from 'react';
import { Form, Select, Button, Empty, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const Step: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Setup the election settings</h1>
      <h3 className="text-lg font-bold">Step 3 : Create Cadre</h3>
      <h5 className="text-md mt-10 font-semibold">Choose method to add voter</h5>
      <Form className="mt-5">
        <Form.Item label="" style={{ maxWidth: '400px' }}>
          <Select>
            <Option value="demo">Demo</Option>
          </Select>
        </Form.Item>
      </Form>
      {/* You can add any step content you want here */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-20 hover:bg-blue-100 transition duration-300 ease-in-out">
        <h5 className="text-md font-semibold mb-4 text-left">Media Upload</h5>
        <p className="text-gray-600 text-left">Add your files here, and you can upload up to 5 files max</p>
        <Empty
          image={<UploadOutlined style={{ fontSize: '60px', color: '#1890ff', marginBottom: '20px' }} />}
          imageStyle={{ height: 60 }}
          description={
            <Typography.Text>
              Drag file(s) to start uploading
            </Typography.Text>
          }
        >
          <Button className="bg-blue-500 mt-4" type="primary">Browse files</Button>
        </Empty>
        <Button className="bg-blue-500 mt-4" type="primary">Upload</Button>
      </div>
    </div>
  );
};

export default Step;