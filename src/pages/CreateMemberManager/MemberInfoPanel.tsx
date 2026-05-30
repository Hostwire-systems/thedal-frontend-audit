import { Row, Col, Form, Input, Select, DatePicker } from "antd";
import dayjs from "dayjs";
import moment from "moment";
import { useEffect, useState } from "react";

const { Option } = Select;
const colWidths = { xs: 24, sm: 12, md: 6 };

const MemberInfo = ({ form, type }) => {
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [age, setAge] = useState(null);
  
  const generateYears = () => {
    const years = [];
    for (let year = 1972; year <= 2100; year++) {
      years.push(
        <Option key={year} value={year}>
          {year}
        </Option>
      );
    }
    return years;
  };

  const calculateAge = (dob) => {
    const dateOfBirth = dayjs(dob);
    if (!dateOfBirth.isValid()) {
      return null;
    }
    return dayjs().diff(dateOfBirth, "years");
  };

  const handleDobChange = (date) => {
    console.log(date);
    setDateOfBirth(date);
    if (date) {
      const calculatedAge = dayjs().diff(date, "years");
      console.log(calculatedAge);
      form.setFieldsValue({ age: calculatedAge }); // Update age based on DOB
    }
  };

  const handleAgeChange = (value) => {
    setAge(value);
    if (value) {
      const calculatedDob = dayjs().subtract(value, "years");
      setDateOfBirth(calculatedDob);
    }
  };

  useEffect(() => {
    console.log("type", type);
  }, []);

  return (
    <>
      <Row gutter={[16, 16]} className="w-full mt-4 items-center pb-5">
        <Col {...colWidths}>
          <Form.Item
            name="memberName"
            label="Member Name"
            rules={[
              {
                required: true,
                message: "Please enter Member Name",
              },
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Member Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Member Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="relationName"
            label="Relation Name"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Relation Name",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation Name"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="relationType"
            label="Relation Type"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Relation Type",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Relation Type"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item 
            name="gender" 
            label="Gender"
            rules={[
              {
                required: true,
                message: "Please select Gender",
              },
            ]}
          >
            <Select
              className={type === "add" ? "input-element custom-select" : ""}
              placeholder="Select Gender"
            >
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="epicNumber"
            label="EPIC Number"
            tooltip="Electoral Photo Identity Card number"
             rules={[
              { required: true, message: "Please enter the EPIC Number" },
             ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter EPIC Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item 
            name="dateOfBirth" 
            label="Date of Birth"
            rules={[
              {
                required: true,
                message: "Please select Date of Birth",
              },
            ]}
          >
            <DatePicker
              value={dateOfBirth}
              format="DD-MMM-YYYY"
              className={type === "add" ? "input-element w-full" : ""}
              onChange={handleDobChange}
              disabledDate={(current) => {
                const today = moment().endOf("day");
                const eighteenYearsAgo = moment().subtract(18, "years").endOf("day");
                return (
                  current && (current > today || current > eighteenYearsAgo)
                );
              }}
            />
          </Form.Item>
        </Col>

        <Col {...colWidths}>
          <Form.Item
            name="age"
            label="Age"
            rules={[
              {
                required: true,
                message: "Please enter Age",
              },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve(); // Allow empty field
                  }

                  const numericAge = Number(value); // Convert string to number
                  if (numericAge < 18 || numericAge > 100) {
                    return Promise.reject(
                      new Error("Age must be between 18 and 100")
                    );
                  }

                  if (isNaN(numericAge)) {
                    return Promise.reject(
                      new Error("Please enter a valid number")
                    );
                  }

                  const dateOfBirth = form.getFieldValue("dateOfBirth");
                  if (!dateOfBirth || !value) {
                    return Promise.resolve();
                  }

                  // Ensure the value is a number before comparing it with the calculated age
                  const ageFromDob = calculateAge(dateOfBirth);
                  if (ageFromDob === null) {
                    return Promise.reject(new Error("Invalid Date of Birth"));
                  }

                  if (ageFromDob !== value) {
                    return Promise.reject(
                      new Error("Age does not match Date of Birth")
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              onChange={(e) => handleAgeChange(e.target.value)}
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter age"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="occupation"
            label="Occupation"
            rules={[
              {
                pattern: /[A-Za-z\s]+$/,
                message: "Please enter a valid Occupation",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Occupation"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item name="education" label="Education">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Education"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item name="fullAddress" label="Full Address">
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Full Address"
            />
          </Form.Item>
        </Col>

        <Col {...colWidths}>
          <Form.Item
            name="mobileNumber"
            label="Mobile Number"
            rules={[
              {
                required: true,
                message: "Please enter Mobile Number",
              },
              {
                pattern: /^\d{10}$/,
                message: "Enter a valid 10-digit mobile number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Mobile Number"
            />
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item name="memberSinceYear" label="Member Since Year">
            <Select
              className={type === "add" ? "input-element custom-select" : ""}
              showSearch
              placeholder="Select Year"
            >
              {generateYears()}
            </Select>
          </Form.Item>
        </Col>
        <Col {...colWidths}>
          <Form.Item
            name="membershipNo"
            label="Membership No"
            rules={[
              {
                pattern: /^(\d+)?$/,
                message: "Enter a valid Membership number",
              },
            ]}
          >
            <Input
              className={type === "add" ? "input-element" : ""}
              placeholder="Enter Membership No"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

export default MemberInfo;