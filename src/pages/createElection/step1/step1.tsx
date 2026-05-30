import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import ImgCrop from "antd-img-crop";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Col,
  Row,
  Form,
  Input,
  DatePicker,
  message,
  Button,
  Upload,
  Modal,
  Select,
  Tooltip,
} from "antd";
import "./step1.css";
import { InfoCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { ElectionStep1FormValues } from "../../../types";
import { RcFile } from "antd/es/upload";
import moment from "moment";

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface Step1Props {
  onFinish: (values: ElectionStep1FormValues) => void;
  initialValues?: Partial<ElectionStep1FormValues>;
}

const Step1: React.FC<Step1Props> = ({ onFinish, initialValues }) => {
  const [form] = Form.useForm<ElectionStep1FormValues>();
  const [skipVisible, setSkipVisible] = useState<boolean>(false);
  const [isUploadError, setIsUploadError] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("POLITICAL");
  const [isElectionDateSelected, setIsElectionDateSelected] = useState(false);
    const [nominationPickerKey, setNominationPickerKey] = useState(0);
  const [isGazetteDateSelected, setIsGazetteDateSelected] = useState(false);
  const [isFilingDateSelected, setIsFilingDateSelected] = useState(false);
  const [isScrutinyDateSelected, setIsScrutinyDateSelected] = useState(false);
  const [isLastWithdrawalDateSelected, setIsLastWithdrawalDateSelected] =
    useState(false);
  const [isCountingDateSelected, setIsCountingDateSelected] = useState(false);
  const [electionBodyOptions, setElectionBodyOptions] = useState([
    { name: "Union Body (MP)", body: "UNION_BODY" },
    { name: "State Body (MLA)", body: "STATE_BODY" },
    { name: "Urban Body (ULB)", body: "URBAN_LOCAL" },
    { name: "Rural Body (RLB)", body: "RURAL_LOCAL" },
  ]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const status = ["Yet to Start", "In-Progress", "Completed", "Cancelled"];

  // Validation functions
  const validateTotalBooths = (rule, value) => {
    const totalBooths = parseInt(form.getFieldValue("booths") || "0", 10);
    const pinkBooths = form.getFieldValue("numberOfPinkBooths");
    const currentValue = parseInt(value || "0", 10);

    // Skip validation if form is partially filled
    if (!totalBooths || !pinkBooths || !value) {
      return Promise.resolve();
    }

    // If either totalBooths or pinkBooths is empty or not a number, reject
    if (
      isNaN(totalBooths) ||
      totalBooths === 0 ||
      pinkBooths === "" ||
      isNaN(parseInt(pinkBooths))
    ) {
      return Promise.reject(
        "Please fill in both Total Booths and Pink Booths first"
      );
    }

    const pinkBoothsInt = parseInt(pinkBooths || "0", 10);

    const expectedTotal = totalBooths + pinkBoothsInt;

    // Check if the total booths match the expected value
    if (currentValue !== expectedTotal) {
      return Promise.reject(`Total All Booths must equal ${expectedTotal}`);
    }

    return Promise.resolve();
  };

  const validateVoters = (rule, value) => {
    const maleVoters = parseInt(
      form.getFieldValue("numberOfMaleVoters") || "0"
    );
    const femaleVoters = parseInt(
      form.getFieldValue("numberOfFemaleVoters") || "0"
    );
    const transgenderVoters = parseInt(
      form.getFieldValue("numberOfTransgenderVoters") || "0"
    );
    const totalVoters = parseInt(value || "0");

    const calculatedTotal = maleVoters + femaleVoters + transgenderVoters;
    if (totalVoters !== calculatedTotal) {
      return Promise.reject(
        `Total voters (${totalVoters}) must equal sum of male (${maleVoters}), female (${femaleVoters}), and transgender (${transgenderVoters}) voters = ${calculatedTotal}`
      );
    }
    return Promise.resolve();
  };

  const handleFinish = async (values: ElectionStep1FormValues) => {
    if (isUploadError || !values.electionPicture?.length) {
      message.error(
        "Please upload a valid election picture before submitting."
      );
      return;
    }

    if (values.electionDate) {
      values.startDate = values.dateOfPoll.format("YYYY-MM-DD");
      values.endDate = values.dateOfPoll.format("YYYY-MM-DD");
    }

    // (!) default to RURAL_LOCAL for non-political elections until further notice
    if (values.category === "NON_POLITICAL") {
      values.body = null;
    }
    if (values.category === "POLITICAL") {
      values.bodyString = null;
    }

    const dateFields = [
      "electoralReleaseDate",
      "gazetteNotificationDate",
      "scrutinyNominationDate",
      "lastDateForFillingNomination",
      "lastDateForWithdrawalOfNomination",
      "dateOfPoll",
      "dateOfCountingOfVotes",
      "completionDeadlineDate",
    ];

    dateFields.forEach((field) => {
      if (values[field] && dayjs.isDayjs(values[field])) {
        console.log(`Before conversion - ${field}:`, values[field].toString());
        // values[field] = values[field].toISOString();
        values[field] = values[field].format("YYYY-MM-DD");
        console.log(`After conversion - ${field}:`, values[field]);
      }
    });

    try {
      setLoading(true);
      await onFinish(values);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishFailed = ({ errorFields }) => {
    if (errorFields && errorFields.length > 0) {
      if (errorFields[0].name[0] === "electionPicture") {
        form.scrollToField(errorFields[1].name, {
          behavior: "smooth",
        });
      } else {
        form.scrollToField(errorFields[0].name, {
          behavior: "smooth",
        });
      }
    }
  };

  const dummyRequest = ({ onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const disabledDate = (current: moment.Moment) => {
    return current && current < moment().startOf("day");
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Assam",
    "Bihar",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Delhi",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ].sort();

  const handlePreview = async (file) => {
    if (!file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file.originFileObj);
      });
    }
    Modal.info({
      title: "Preview",
      content: (
        <img
          alt="file preview"
          style={{
            width: "100%",
            background:
              "repeating-conic-gradient(#ddd 0% 25%, transparent 0% 50%) 50% / 10px 10px",
          }}
          src={file.preview}
        />
      ),
      onOk() {},
    });
  };

  const handleCategoryChange = (value: string) => {
    if (value === "POLITICAL") {
      setCategory("POLITICAL");
      setElectionBodyOptions([
        { name: "Union Body (MP)", body: "UNION_BODY" },
        { name: "State Body (MLA)", body: "STATE_BODY" },
        { name: "Urban Body (ULB)", body: "URBAN_LOCAL" },
        { name: "Rural Body (RLB)", body: "RURAL_LOCAL" },
      ]);
    } else {
      setCategory("NON_POLITICAL");
      setElectionBodyOptions([]);
    }
  };

  const formatFileSize = (size: number | null) => {
    if (!size) return "0 MB";
    size = size / 1024 / 1024;
    return `${size.toFixed(4)} MB`;
  };

   const validateImageBeforeCrop = (file: RcFile) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg";
  
      const isSizeValid = file.size / 1024 / 1024 < 1;
  
      if (!isValidType) {
        message.error("Only JPG, JPEG, or PNG files are allowed!");
        return false;
      }
  
      if (!isSizeValid) {
        message.error("File size must be less than 1MB!");
        return false;
      }
  
      return true;
    };

  const handleChange = (info) => {
    let updatedFileList = [...info.fileList];
    updatedFileList = updatedFileList.filter((file) => {
      const isValidType =
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg";

      const isSizeSmall = file.size / 1024 / 1024 < 1;

      if (!isValidType) {
        // message.error("Invalid file type. Only JPG, JPEG, or PNG allowed!");
        return false;
      }

      if (!isSizeSmall) {
        // message.error("Image size must be smaller than 1MB!");
        return false;
      }

      return true;
    });
    if (updatedFileList.length > 1) {
      updatedFileList = [updatedFileList[updatedFileList.length - 1]];
    }

    setFileList(updatedFileList);
    form.setFieldsValue({
      electionPicture: updatedFileList,
    });
  };

  const onValuesChange = (changedValues) => {
    // If any calendar event date changes, set the flag accordingly
    if (changedValues.gazetteNotificationDate) {
      console.log("Gazette", changedValues.gazetteNotificationDate);
      setIsGazetteDateSelected(!!changedValues.gazetteNotificationDate); //Check if gazetteDate is selected
    }
    if (changedValues.lastDateForFillingNomination) {
      console.log(
        "Last date for filling nomination",
        changedValues.lastDateForFillingNomination
      );
      setIsFilingDateSelected(!!changedValues.lastDateForFillingNomination);
    }
    if (changedValues.scrutinyNominationDate) {
      console.log("Scrutiny nomination", changedValues.scrutinyNominationDate);
      setIsScrutinyDateSelected(!!changedValues.scrutinyNominationDate);
    }
    if (changedValues.lastDateForWithdrawalOfNomination) {
      console.log(
        "Last date for withdrawal of nomination",
        changedValues.lastDateForWithdrawalOfNomination
      );
      setIsLastWithdrawalDateSelected(
        !!changedValues.lastDateForWithdrawalOfNomination
      );
    }
    if (changedValues.dateOfPoll) {
      console.log("Date of poll", changedValues.dateOfPoll);
      setIsElectionDateSelected(!!changedValues.dateOfPoll); // Check if electionDate is selected
    }
    if (changedValues.dateOfCountingOfVotes) {
      console.log(
        "Date of counting of votes",
        changedValues.dateOfCountingOfVotes
      );
      setIsCountingDateSelected(!!changedValues.dateOfCountingOfVotes);
    }
  };

  useEffect(() => {
    console.log("UseEffect of step1");
    const handlePopState = () => {
      console.log("Handling popstate");
      if (
        document.referrer.includes("/welcome") &&
        location.pathname === "/elections/create"
      ) {
        console.log("Redirecting to /dashboard");
        navigate("/dashboard", { replace: true });

        window.history.pushState(null, "", "/dashboard");
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location, navigate]);

  return (
    <Form
      form={form}
      onFinish={handleFinish}
      onFinishFailed={handleFinishFailed}
      layout="vertical"
      onValuesChange={onValuesChange}
      className="w-full p-6"
      initialValues={{
        country: "India",
        ...initialValues,
        category: "POLITICAL",
      }}
    >
      {/* Header */}
      <Row gutter={[16, 16]} className="w-full items-center">
        <Col span={24}>
          <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
            Step 1: Create Election
          </h3>
        </Col>
      </Row>

      {/* Election Picture and Category Selection */}
      <Row gutter={[16, 16]} className="w-full items-center mt-6">
        <Col span={12}>
          <Form.Item
            label="Choose Election Picture"
            name="electionPicture"
            rules={[
              { required: true, message: "Please upload the election picture" },
            ]}
          >
            <ImgCrop
              rotate
              aspect={1 / 1}
              quality={0.8}
              modalWidth={500}
              beforeCrop={validateImageBeforeCrop}
              fillColor="transparent"
              showReset
              okText="Confirm"
              cancelText="Cancel"
              modalTitle={
                <div className="flex justify-between items-center">
                  <span>Crop Election Picture</span>
                  <span
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      marginLeft: "2rem",
                    }}
                  >
                    {
                      //File Size: {formatFileSize(fileSize)}
                    }
                  </span>
                  <span
                    style={{
                      color: "#999",
                      fontSize: "12px",
                      marginRight: "2rem",
                    }}
                  >
                    Size: 500x500 pixels
                  </span>
                </div>
              }
              modalProps={{
                okButtonProps: {
                  style: {
                    backgroundColor: "#1677ff",
                    borderColor: "#1677ff",
                    color: "#fff",
                  },
                },
              }}
            >
              <Upload
                multiple={false}
                name="avatar"
                fileList={fileList}
                listType="picture-card"
                customRequest={dummyRequest}
                onPreview={handlePreview}
                onChange={handleChange}
              >
                {fileList.length < 1 && (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload Photo</div>
                  </div>
                )}
              </Upload>
            </ImgCrop>
          </Form.Item>
          {fileList?.length === 0 ? (
            <p className="text-xs font-medium text-gray-400 -mt-3">
              Image size should not exceed 1 MB
            </p>
          ) : (
            <p></p>
          )}
        </Col>

        <Col span={12}>
          <Form.Item
            name="category"
            label="Choose Election Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              variant="filled"
              placeholder="Select Category"
              className="input-element custom-select"
              onChange={handleCategoryChange}
            >
              <Option key="Political" value="POLITICAL">
                Political
              </Option>
              <Option key="Non-Political" value="NON_POLITICAL">
                Non-Political
              </Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {category === "POLITICAL" && (
        <>
          {/* Election Information Section */}
          <Row gutter={[16, 16]} className="w-full mb-4 items-center">
            <Col span={24}>
              <h3 className="text-[20px] leading-5 mt-4 mb-3 font-semibold text-[#1C1C1C]">
                Election Information
              </h3>
            </Col>
          </Row>

          {/* Election Type and Body */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="type"
                label="Choose Election Type"
                rules={[
                  {
                    required: true,
                    message: "Please select the election type",
                  },
                ]}
              >
                <Select
                  variant="filled"
                  className="input-element custom-select"
                  placeholder="Select Type"
                >
                  <Option value="GENERAL_ELECTION">General</Option>
                  <Option value="BY_ELECTION">By-election</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="body"
                label="Choose Election Body"
                rules={[
                  {
                    required: true,
                    message: "Please select the election body",
                  },
                ]}
              >
                <Select
                  variant="filled"
                  className="input-element custom-select"
                  placeholder="Select Body"
                >
                  {electionBodyOptions.map((option) => (
                    <Option key={option.body} value={option.body}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Country and State Selection */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true }]}
              >
                <Input
                  placeholder="Enter country"
                  className="input-element"
                  value="India"
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="state"
                label="States"
                rules={[{ required: true, message: "Please select a state" }]}
              >
                <Select
                  variant="filled"
                  placeholder="Select States"
                  className="input-element custom-select"
                  allowClear
                  showSearch
                >
                  {indianStates.map((state) => (
                    <Option key={state} value={state}>
                      {state}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Names Section */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={6}>
              <Form.Item
                name="pcName"
                label={
                  <span>
                    PC Name
                    <Tooltip title="Parliament Constituency Name">
                      <InfoCircleOutlined
                        style={{
                          marginLeft: 4,
                          cursor: "pointer",
                          verticalAlign: "middle",
                          fontSize: "16px",
                        }}
                      />
                    </Tooltip>
                  </span>
                }
                rules={
                  [
                    // {
                    //   pattern: /^[A-Za-z\s]+$/,
                    //   message: "Please enter a valid PC Name",
                    // },
                  ]
                }
              >
                <Input placeholder="Enter PC Name" className="input-element" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="acName"
                label={
                  <span>
                    AC Name
                    <Tooltip title="Assembly Constituency Name">
                      <InfoCircleOutlined
                        style={{
                          marginLeft: 4,
                          cursor: "pointer",
                          verticalAlign: "middle",
                          fontSize: "16px",
                        }}
                      />
                    </Tooltip>
                  </span>
                }
                rules={
                  [
                    // {
                    //   pattern: /^[A-Za-z\s]+$/,
                    //   message: "Please enter a valid AC Name",
                    // },
                  ]
                }
              >
                <Input placeholder="Enter AC Name" className="input-element" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="urbanName"
                label={
                  <span>
                    Urban Name
                    <Tooltip title="Urban Local Body Name">
                      <InfoCircleOutlined
                        style={{
                          marginLeft: 4,
                          cursor: "pointer",
                          verticalAlign: "middle",
                          fontSize: "16px",
                        }}
                      />
                    </Tooltip>
                  </span>
                }
                rules={
                  [
                    // {
                    //   pattern: /^[A-Za-z\s]+$/,
                    //   message: "Please enter a valid Urban Name",
                    // },
                  ]
                }
              >
                <Input
                  placeholder="Enter Urban Name"
                  className="input-element"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="ruralName"
                label={
                  <span>
                    Rural Name
                    <Tooltip title="Rural Local Body Name">
                      <InfoCircleOutlined
                        style={{
                          marginLeft: 4,
                          cursor: "pointer",
                          verticalAlign: "middle",
                          fontSize: "16px",
                        }}
                      />
                    </Tooltip>
                  </span>
                }
                rules={
                  [
                    // {
                    //   pattern: /^[A-Za-z\s]+$/,
                    //   message: "Please enter a valid Rural Name",
                    // },
                  ]
                }
              >
                <Input
                  placeholder="Enter Rural Name"
                  className="input-element"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Election Details */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={8}>
              <Form.Item
                name="electionName"
                label="Election Name"
                rules={[
                  { required: true, message: "Please enter the Election Name" },
                  // {
                  //   pattern: /^[A-Za-z0-9\s]+$/,
                  //   message:
                  //     "Please enter a valid Election Name (alphanumeric with spaces allowed)",
                  // },
                ]}
              >
                <Input
                  placeholder="Enter Election Name"
                  className="input-element"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="electionDescription"
                label="Election Description"
              >
                <TextArea
                  className="input-element"
                  rows={2}
                  placeholder="Enter Election Description"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item
                  name="electoralReleaseDate"
                  label="Electoral Release Date"
                >
                  <DatePicker
                    format="DD-MMM-YYYY"
                    className="input-element w-full"
                    // disabledDate={disabledDate}
                  />
                </Form.Item>
            </Col>

            {/* Election Date */}
            {/* <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="electionDate"
                label="Election Date"
                rules={[
                  {
                    required: true,
                    message: "Please select the election date",
                  },
                  ]}
                  >
                  <DatePicker
                  className="input-element w-full"
                  format="DD-MM-YYYY"
                  disabledDate={disabledDate}
                  placeholder="Select Election Date"
                  />
              </Form.Item>
            </Col>
            </Row> */}
            <Col span={12}>
              <Form.Item name="status" label="Status">
                <Select
                  variant="filled"
                  placeholder="Select Status"
                  className="input-element custom-select"
                >
                  {status.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          {/* Booth Information */}
          <Row gutter={[16, 16]} className="w-full mt-4 pb-5">
            <Col span={12}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Booth Information:
              </h3>

              <Row className="w-full mt-6 items-center pb-5">
                <Col span={24}>
                  <Form.Item
                    name="totalAllBooths"
                    label="Total All Booths"
                    // dependencies={["booths", "numberOfPinkBooths"]}
                    // rules={[{ validator: validateTotalBooths }]}
                  >
                    <Input
                      type="number"
                      className="input-element"
                      placeholder="Enter Total All Booths"
                      min={1}
                      onKeyDown={(e) => {
                        if (
                          e.key === "." ||
                          e.key === "e" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="booths"
                    label="No. of General Booth (Male & Female)"
                    rules={[
                      {
                        pattern: /^[1-9]\d*$/,
                        message: "Input must be an integer and greater than 0",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      className="input-element"
                      placeholder="Enter Booth Number"
                      min={1}
                      onKeyDown={(e) => {
                        if (
                          e.key === "." ||
                          e.key === "e" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfPinkBooths"
                    label="No. of Female Only Booth"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      className="input-element"
                      placeholder="No. of Female Only Booths"
                      min={0}
                      onKeyDown={(e) => {
                        if (
                          e.key === "." ||
                          e.key === "e" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Voter Information */}
            <Col span={12}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Voter Information:
              </h3>
              <Row className="w-full mt-6 items-center">
                <Col span={24}>
                  <Form.Item
                    name="numberOfVoters"
                    label="Total All Voters"
                    // dependencies={[
                    //   "numberOfMaleVoters",
                    //   "numberOfFemaleVoters",
                    //   "numberOfTransgenderVoters",
                    // ]}
                    rules={[
                      {
                        pattern: /^[0-9]\d*$/,
                        message: "Input must be an integer and greater than 0",
                      },
                      // { validator: validateVoters },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Voters"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfMaleVoters"
                    label="Total Male Voters"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Male Voters"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfFemaleVoters"
                    label="Total Female Voters"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Female Voters"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfTransgenderVoters"
                    label="Total Transgender Voters"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Transgender Voters"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          {/* Remarks */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={24}>
              <Form.Item name="remarks" label="Remarks">
                <TextArea
                  className="input-element"
                  rows={4}
                  placeholder="Enter Remarks (if any)"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Calendar of Event Section */}
          <Row gutter={[16, 16]} className="w-full items-center pb-5">
            <Col span={24}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Calendar of Event:
              </h3>
            </Col>
          </Row>

          {/* Gazette Notification Date */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="gazetteNotificationDate"
                label="Gazette Notification"
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  // disabledDate={disabledDate}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Last Date for Filling Nomination */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="lastDateForFillingNomination"
                label="Last Date of Nomination"
                dependencies={["gazetteNotificationDate"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const gazetteDate = getFieldValue(
                        "gazetteNotificationDate"
                      );
                      if (
                        !value ||
                        !gazetteDate ||
                        value.isAfter(gazetteDate)
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Last nomination date must be after the Gazette notification."
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  disabledDate={(current) => {
                    const gazetteMoment = form.getFieldValue(
                      "gazetteNotificationDate"
                    );
                    return current && current < gazetteMoment?.endOf("day");
                  }}
                  disabled={!isGazetteDateSelected}
                  onOpenChange={(open) => {
                    if (open) {
                      // Force re-render when the calendar opens so that
                      // defaultPickerValue is recalculated
                      setNominationPickerKey((prev) => prev + 1);
                    }
                  }}
                  defaultPickerValue={(() => {
                    const gazetteNotificationDate = form.getFieldValue(
                      "gazetteNotificationDate"
                    );
                    const nominationDate = form.getFieldValue(
                      "lastDateForFillingNomination"
                    );
                    if (gazetteNotificationDate) {
                      // If nominationDate is empty or invalid (i.e. before allowed date)
                      if (
                        !nominationDate ||
                        nominationDate.isBefore(
                          gazetteNotificationDate.endOf("day")
                        )
                      ) {
                        return gazetteNotificationDate.add(1, "day");
                      }
                      return nominationDate;
                    }
                    return undefined;
                  })()}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Scrutiny Nomination */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="scrutinyNominationDate"
                label="Scrutiny of Nomination"
                dependencies={["lastDateForFillingNomination"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const filingDate = getFieldValue(
                        "lastDateForFillingNomination"
                      );
                      if (!value || !filingDate || value.isAfter(filingDate)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Scrutiny date must be after the last day for filing nomination."
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  disabledDate={(current) => {
                    const filingDate = form.getFieldValue(
                      "lastDateForFillingNomination"
                    );
                    return current && current < filingDate?.endOf("day");
                  }}
                  disabled={!isFilingDateSelected}
                  onOpenChange={(open) => {
                    if (open) {
                      setNominationPickerKey((prev) => prev + 1);
                    }
                  }}
                  defaultPickerValue={(() => {
                    const lastDateForFillingNomination = form.getFieldValue(
                      "lastDateForFillingNomination"
                    );
                    const scrutinyNominationDate = form.getFieldValue(
                      "scrutinyNominationDate"
                    );
                    if (lastDateForFillingNomination) {
                      if (
                        !scrutinyNominationDate ||
                        scrutinyNominationDate.isBefore(
                          lastDateForFillingNomination.endOf("day")
                        )
                      ) {
                        return lastDateForFillingNomination.add(1, "day");
                      }
                      return scrutinyNominationDate;
                    }
                    return undefined;
                  })()}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Last Date for Withdrawal */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="lastDateForWithdrawalOfNomination"
                label="Last date for Withdrawal"
                dependencies={["scrutinyNominationDate"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const scrutinyDate = getFieldValue(
                        "scrutinNominationDate"
                      );
                      if (
                        !value ||
                        !scrutinyDate ||
                        value.isAfter(scrutinyDate)
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Withdrawal date must be after scrutiny of nomination"
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  disabledDate={(current) => {
                    const scrutinyDate = form.getFieldValue(
                      "scrutinyNominationDate"
                    );
                    return current && current < scrutinyDate?.endOf("day");
                  }}
                  disabled={!isScrutinyDateSelected}
                  onOpenChange={(open) => {
                    if (open) {
                      setNominationPickerKey((prev) => prev + 1);
                    }
                  }}
                  defaultPickerValue={(() => {
                    const scrutinyNominationDate = form.getFieldValue(
                      "scrutinyNominationDate"
                    );
                    const lastDateForWithdrawalOfNomination =
                      form.getFieldValue("lastDateForWithdrawalOfNomination");
                    if (scrutinyNominationDate) {
                      if (
                        !lastDateForWithdrawalOfNomination ||
                        lastDateForWithdrawalOfNomination.isBefore(
                          scrutinyNominationDate.endOf("day")
                        )
                      ) {
                        return scrutinyNominationDate.add(1, "day");
                      }
                      return lastDateForWithdrawalOfNomination;
                    }
                    return undefined;
                  })()}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Date of Poll */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="dateOfPoll"
                dependencies={["lastDateForWithdrawalOfNomination"]}
                label="Date of Poll"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const withdrawalDate = getFieldValue(
                        "lastDateForWithdrawalOfNomination"
                      );
                      if (
                        !value ||
                        !withdrawalDate ||
                        value.isAfter(withdrawalDate)
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Poll date must be after withdrawal date"
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  disabledDate={(current) => {
                    const withdrawalDate = form.getFieldValue(
                      "lastDateForWithdrawalOfNomination"
                    );
                    return current && current < withdrawalDate?.endOf("day");
                  }}
                  disabled={!isLastWithdrawalDateSelected}
                  onOpenChange={(open) => {
                    if (open) {
                      setNominationPickerKey((prev) => prev + 1);
                    }
                  }}
                  defaultPickerValue={(() => {
                    const lastDateForWithdrawalOfNomination =
                      form.getFieldValue("lastDateForWithdrawalOfNomination");
                    const dateOfPoll = form.getFieldValue("dateOfPoll");
                    if (lastDateForWithdrawalOfNomination) {
                      if (
                        !dateOfPoll ||
                        dateOfPoll.isBefore(
                          lastDateForWithdrawalOfNomination.endOf("day")
                        )
                      ) {
                        return lastDateForWithdrawalOfNomination.add(1, "day");
                      }
                      return dateOfPoll;
                    }
                    return undefined;
                  })()}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Date of Counting */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="dateOfCountingOfVotes"
                dependencies={["dateOfPoll"]} // Removed electionDate dependency
                label="Date of Counting of Votes"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const pollDate = getFieldValue("dateOfPoll");
                      if (!value || !pollDate || value.isAfter(pollDate)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Counting date must be after poll date"
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  disabledDate={(current) => {
                    const dateOfPoll = form.getFieldValue("dateOfPoll");
                    // Removed electionDate check
                    return current && current < dateOfPoll?.endOf("day");
                  }}
                  disabled={!isElectionDateSelected}
                  onOpenChange={(open) => {
                    if (open) {
                      setNominationPickerKey((prev) => prev + 1);
                    }
                  }}
                  defaultPickerValue={(() => {
                    const dateOfPoll = form.getFieldValue("dateOfPoll");
                    const dateOfCountingOfVotes = form.getFieldValue(
                      "dateOfCountingOfVotes"
                    );
                    if (dateOfPoll) {
                      if (
                        !dateOfCountingOfVotes ||
                        dateOfCountingOfVotes.isBefore(dateOfPoll.endOf("day"))
                      ) {
                        return dateOfPoll.add(1, "day");
                      }
                      return dateOfCountingOfVotes;
                    }
                    return undefined;
                  })()}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Date before election completion */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="completionDeadlineDate"
                dependencies={["dateOfCountingOfVotes"]}
                label="Date before which election shall be completed"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const countingDate = getFieldValue(
                        "dateOfCountingOfVotes"
                      );
                      if (
                        !value ||
                        !countingDate ||
                        value.isAfter(countingDate)
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        "Completion date must be after counting date "
                      );
                    },
                  }),
                ]}
              >
                <DatePicker
                  format="DD-MMM-YYYY"
                  className="input-element w-full"
                  disabledDate={(current) => {
                    const countingDate = form.getFieldValue(
                      "dateOfCountingOfVotes"
                    );
                    return current && current < countingDate?.endOf("day");
                  }}
                  disabled={!isCountingDateSelected}
                  onOpenChange={(open) => {
                    if (open) {
                      setNominationPickerKey((prev) => prev + 1);
                    }
                  }}
                  defaultPickerValue={(() => {
                    const dateOfCountingOfVotes = form.getFieldValue(
                      "dateOfCountingOfVotes"
                    );
                    const completionDeadlineDate = form.getFieldValue(
                      "completionDeadlineDate"
                    );
                    if (dateOfCountingOfVotes) {
                      if (
                        !completionDeadlineDate ||
                        completionDeadlineDate.isBefore(
                          dateOfCountingOfVotes.endOf("day")
                        )
                      ) {
                        return dateOfCountingOfVotes.add(1, "day");
                      }
                      return completionDeadlineDate;
                    }
                    return undefined;
                  })()}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Form Submission Buttons */}
          <Form.Item>
            <Row gutter={[16, 16]} className="w-full mt-10" justify="center">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                  style={{ marginRight: 16 }}
                >
                  {loading ? "Submitting..." : "Save and Continue"}
                </Button>
              </Col>
              {skipVisible && (
                <Col>
                  <Button
                    type="default"
                    htmlType="button"
                    className="px-10 py-4 h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
                  >
                    Skip for now
                  </Button>
                </Col>
              )}
            </Row>
          </Form.Item>
        </>
      )}

      {category === "NON_POLITICAL" && (
        <>
          {/* Election Information Section */}
          <Row gutter={[16, 16]} className="w-full mb-4 items-center">
            <Col span={24}>
              <h3 className="text-[20px] leading-5 mt-4 mb-3 font-semibold text-[#1C1C1C]">
                Election Information
              </h3>
            </Col>
          </Row>

          {/* Election Type and Body */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="type"
                label="Choose Election Type"
                rules={[
                  {
                    required: true,
                    message: "Please select the election type",
                  },
                ]}
              >
                <Select
                  variant="filled"
                  className="input-element custom-select"
                  placeholder="Select Type"
                >
                  <Option value="GENERAL_ELECTION">General</Option>
                  <Option value="BY_ELECTION">By-election</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="bodyString" label="Enter Election Body">
                <Input className="input-element" placeholder="Enter Body" />
              </Form.Item>
            </Col>
          </Row>

          {/* Country and State Selection */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={12}>
              <Form.Item
                name="country"
                label="Country"
                rules={[{ required: true }]}
              >
                <Input
                  placeholder="Enter country"
                  className="input-element"
                  value="India"
                  disabled
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="state"
                label="States"
                rules={[{ required: true, message: "Please select a state" }]}
              >
                <Select
                  variant="filled"
                  placeholder="Select States"
                  className="input-element custom-select"
                  allowClear
                  showSearch
                >
                  {indianStates.map((state) => (
                    <Option key={state} value={state}>
                      {state}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Location Section */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={8}>
              <Form.Item
                name="location1"
                label="Location 1"
                rules={[
                  {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Please enter a valid location name",
                  },
                ]}
              >
                <Input
                  placeholder="Enter Location 1"
                  className="input-element"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location2"
                label="Location 2"
                rules={[
                  {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Please enter a valid location name",
                  },
                ]}
              >
                <Input
                  placeholder="Enter Location 2"
                  className="input-element"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location3"
                label="Location 3"
                rules={[
                  {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Please enter a valid location name",
                  },
                ]}
              >
                <Input
                  placeholder="Enter Location Name"
                  className="input-element"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Election Details */}
          <Row gutter={[16, 16]} className="w-full items-center">
            <Col span={8}>
              <Form.Item
                name="electionName"
                label="Election Name"
                rules={[
                  { required: true, message: "Please enter the Election Name" },
                  // {
                  //   pattern: /^[A-Za-z0-9\s]+$/,
                  //   message:
                  //     "Please enter a valid Election Name (alphanumeric with spaces allowed)",
                  // },
                ]}
              >
                <Input
                  placeholder="Enter Election Name"
                  className="input-element"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="electionDescription"
                label="Election Description"
              >
                <TextArea
                  className="input-element"
                  rows={2}
                  placeholder="Enter Election Description"
                />
              </Form.Item>
            </Col>
            <Row gutter={[16, 16]} className="w-full items-center">
              <Col span={12}>
                <Form.Item
                  name="electoralReleaseDate"
                  label="Electoral Release Date"
                >
                  <DatePicker
                    format="DD-MMM-YYYY"
                    className="input-element w-full"
                    // disabledDate={disabledDate}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Row>

          {/* Booth Information */}
          <Row gutter={[16, 16]} className="w-full mt-4 pb-5">
            <Col span={12}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Booth Information:
              </h3>

              <Row className="w-full mt-6 items-center pb-5">
                <Col span={24}>
                  <Form.Item
                    name="totalAllBooths"
                    label="Total All Booths"
                    // dependencies={["booths", "numberOfPinkBooths"]}
                    // rules={[{ validator: validateTotalBooths }]}
                  >
                    <Input
                      type="number"
                      className="input-element"
                      placeholder="Enter Total All Booths"
                      min={1}
                      onKeyDown={(e) => {
                        if (
                          e.key === "." ||
                          e.key === "e" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="booths"
                    label="No. of General Booth (Male & Female)"
                    rules={[
                      {
                        pattern: /^[1-9]\d*$/,
                        message: "Input must be an integer and greater than 0",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      className="input-element"
                      placeholder="Enter Booth Number"
                      min={1}
                      onKeyDown={(e) => {
                        if (
                          e.key === "." ||
                          e.key === "e" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfPinkBooths"
                    label="No. of Female Only Booth"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      type="number"
                      className="input-element"
                      placeholder="No. of Female Booths"
                      min={0}
                      onKeyDown={(e) => {
                        if (
                          e.key === "." ||
                          e.key === "e" ||
                          e.key === "+" ||
                          e.key === "-"
                        ) {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Voter Information */}
            <Col span={12}>
              <h3 className="text-[20px] leading-5 font-semibold text-[#1C1C1C]">
                Voter Information:
              </h3>
              <Row className="w-full mt-6 items-center">
                <Col span={24}>
                  <Form.Item
                    name="numberOfVoters"
                    label="Total All Voters"
                    // dependencies={[
                    //   "numberOfMaleVoters",
                    //   "numberOfFemaleVoters",
                    //   "numberOfTransgenderVoters",
                    // ]}
                    rules={[
                      {
                        pattern: /^[0-9]\d*$/,
                        message: "Input must be an integer and greater than 0",
                      },
                      // { validator: validateVoters },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Voters"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfMaleVoters"
                    label="Total Male Voters"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Male Voters"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfFemaleVoters"
                    label="Total Female Voters"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Female Voters"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="numberOfTransgenderVoters"
                    label="Total Transgender Voters"
                    rules={[
                      {
                        pattern: /^[0-9]+$/,
                        message: "Please enter a valid input",
                      },
                    ]}
                  >
                    <Input
                      className="input-element"
                      placeholder="No. of Transgender Voters"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
          {/* Form Submission Buttons */}
          <Form.Item>
            <Row gutter={[16, 16]} className="w-full mt-10" justify="center">
              <Col>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="px-10 py-4 hover:!bg-[#2F3538] hover:text-[#fff] hover:border-[#2F3538] hover:border-2 hover:shadow-[0px_8px_16px_rgba(47,53,56,0.50)] text-white bg-[#2F3538] h-[46px] border rounded text-[15px] font-medium leading-4"
                  style={{ marginRight: 16 }}
                >
                  {loading ? "Submitting..." : "Save and Continue"}
                </Button>
              </Col>
              {skipVisible && (
                <Col>
                  <Button
                    type="default"
                    htmlType="button"
                    className="px-10 py-4 h-[46px] border-2 rounded text-[15px] font-medium leading-4 border-[#E5E7EB] transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_12px_rgba(47,53,56,0.50)] hover:bg-[#2563EB] hover:!text-black"
                  >
                    Skip for now
                  </Button>
                </Col>
              )}
            </Row>
          </Form.Item>
        </>
      )}
    </Form>
  );
};

export default Step1;
