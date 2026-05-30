import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  Button,
  DatePicker,
  Tooltip,
  Form,
  Input,
  Modal,
  Select,
  Upload,
  Row,
  Col,
  message,
} from "antd";

import ImgCrop from "antd-img-crop";
import { UploadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import {
  uploadElectionImageApi,
  updateElectionImageApi,
} from "../../api/electionApi";
import moment from "moment";
import locale from "antd/es/date-picker/locale/en_US";
import { RcFile } from "antd/es/upload";

const { Option } = Select;
const { TextArea } = Input;

const EditElectionModal = ({
  visible,
  election,
  onCancel,
  onUpdate,
  loadingModal,
  setLoadingModal,
  editingElection,
  modalForm,
}) => {
  const [form] = Form.useForm(modalForm);
  const [fileList, setFileList] = useState([]);
  const [category, setCategory] = useState("POLITICAL");

  //Dates
  const [isElectionDateSelected, setIsElectionDateSelected] = useState(false);
  const [nominationPickerKey, setNominationPickerKey] = useState(0);
  const [isGazetteDateSelected, setIsGazetteDateSelected] = useState(false);
  const [isFilingDateSelected, setIsFilingDateSelected] = useState(false);
  const [isScrutinyDateSelected, setIsScrutinyDateSelected] = useState(false);
  const [isLastWithdrawalDateSelected, setIsLastWithdrawalDateSelected] =
    useState(false);
  const [isCountingDateSelected, setIsCountingDateSelected] = useState(false);

  // The display format for the DatePicker
  const dateFormat = "DD-MMM-YYYY";
  dayjs.extend(utc);

  // Parse and format incoming election dates
  const parseElectionDate = (dateStr) => {
    return dateStr ? dayjs.utc(dateStr).startOf("day") : null;
  };

  const validateTotalBooths = (rule, value) => {
    const totalBooths = parseInt(form.getFieldValue("boothCount") || "0", 10);
    const pinkBooths = parseInt(
      form.getFieldValue("numberOfPinkBooths") || "0",
      10
    );
    const currentValue = parseInt(value || "0", 10);

    if (!totalBooths || !pinkBooths || !value) {
      return Promise.resolve();
    }

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

    if (currentValue !== expectedTotal) {
      return Promise.reject(`Total All Booths must equal ${expectedTotal}`);
    }

    return Promise.resolve();
  };

  const validateVoters = (rule, value) => {
    const maleVoters = parseInt(
      form.getFieldValue("numberOfMaleVoters") || "0",
      10
    );
    const femaleVoters = parseInt(
      form.getFieldValue("numberOfFemaleVoters") || "0",
      10
    );
    const transgenderVoters = parseInt(
      form.getFieldValue("numberOfTransgenderVoters") || "0",
      10
    );
    const totalVoters = parseInt(value || "0", 10);

    if (!value) {
      return Promise.resolve();
    }

    if (!maleVoters && !femaleVoters && !transgenderVoters && !value) {
      return Promise.resolve();
    }

    if (!maleVoters || !femaleVoters || !transgenderVoters) {
      return Promise.resolve();
    }

    const calculatedTotal = maleVoters + femaleVoters + transgenderVoters;
    if (totalVoters !== calculatedTotal) {
      return Promise.reject(
        `Total voters must equal sum of all voter types (${calculatedTotal})`
      );
    }
    return Promise.resolve();
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

  const handleCrop = (file: any) => {
    // Here, `file` is the cropped image from ImgCrop
    const updatedFileList = [...fileList, file];
    setFileList(updatedFileList);

    // Set the cropped image to the form's field
    form.setFieldsValue({
      electionPicture: file.originFileObj,
    });
  };
    const dummyRequest = ({ onSuccess }: any) => {
      setTimeout(() => {
        onSuccess("ok");
      }, 0);
    };

  const handleChange = ({ fileList: newFileList }: any) => {
    let updatedFileList = [...newFileList];
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
    console.log("updatedFileList", updatedFileList);
    console.log("newFileList", newFileList);

    setFileList(updatedFileList.slice(-1));
    if (updatedFileList.length > 0) {
      form.setFieldsValue({
        electionPicture: updatedFileList,
      });
    }
    // setFileList(newFileList.slice(-1));
  };

  const dateRender = (current) => {
    return (
      <div className="ant-picker-cell-inner">
        {current.format(dateFormat).toUpperCase()}
      </div>
    );
  };

  const onValuesChange = (changedValues) => {
    // If election date changes, set the flag accordingly
    console.log("changedValues", changedValues);
    if (changedValues.dateOfPoll) {
      setIsElectionDateSelected(!!changedValues.dateOfPoll); // Check if electionDate is selected
    }
  };

  useEffect(() => {
    if (election && visible) {
      console.log("election.imageUrl", election.imageUrl);
      const initialFileList = election.imageUrl
        ? [
            {
              uid: "-1",
              name: "election-image.jpg",
              status: "done",
              url: election.imageUrl,
            },
          ]
        : [];
      const totalBooths = election.boothCount + election.numberOfPinkBooths;
      setFileList(initialFileList);
      console.log("election", election);

      form.setFieldsValue({
        location1: election?.location1,
        location2: election?.location2,
        location3: election?.location3,
        electionName: election.electionName,
        electionDescription: election.electionDescription,
        type: election.type || "GENERAL_ELECTION",
        category: election.category || "POLITICAL",
        body:
          election.electionCategory === "POLITICAL"
            ? election.body || "UNION_BODY"
            : null,
        bodyString:
          election.electionCategory === "NON_POLITICAL"
            ? election.bodyString
            : null,
        status:
          election.electionCategory === "POLITICAL" ? election.status : null,
        country: "India",
        state: election.state,
        pcName: election.pcName,
        acName: election.acName,
        urbanName: election.urbanName,
        ruralName: election.ruralName,
        booths: election.boothCount,
        numberOfPinkBooths: election.numberOfPinkBooths,
        totalAllBooths: election.totalAllBooths || totalBooths,
        numberOfPollingStations: election.numberOfPollingStations,
        numberOfMaleVoters: election.numberOfMaleVoters,
        numberOfFemaleVoters: election.numberOfFemaleVoters,
        numberOfTransgenderVoters: election.numberOfTransgenderVoters,
        numberOfVoters: election.numberOfVoters,
        electoralReleaseDate: election.electoralReleaseDate
          ? dayjs.utc(election.electoralReleaseDate).local().startOf("day")
          : null,
        notificationDate: election.notificationDate
          ? dayjs.utc(election.notificationDate).local().startOf("day")
          : null,
        gazetteNotificationDate: election.gazetteNotificationDate
          ? dayjs.utc(election.gazetteNotificationDate).local().startOf("day")
          : null,
        lastDateForFillingNomination: election.lastDateForFillingNomination
          ? dayjs
              .utc(election.lastDateForFillingNomination)
              .local()
              .startOf("day")
          : null,
        dateOfPoll: election.dateOfPoll
          ? dayjs.utc(election.dateOfPoll).local().startOf("day")
          : null,
        scrutinyNominationDate: election.scrutinyNominationDate
          ? dayjs.utc(election.scrutinyNominationDate).local().startOf("day")
          : null,
        lastDateForWithdrawalOfNomination:
          election.lastDateForWithdrawalOfNomination
            ? dayjs
                .utc(election.lastDateForWithdrawalOfNomination)
                .local()
                .startOf("day")
            : null,
        dateOfCountingOfVotes: election.dateOfCountingOfVotes
          ? dayjs.utc(election.dateOfCountingOfVotes).local().startOf("day")
          : null,
        completionDeadlineDate: election.completionDeadlineDate
          ? dayjs.utc(election.completionDeadlineDate).local().startOf("day")
          : null,
        remarks: election.remarks,
      });

      setCategory(election.electionCategory || "POLITICAL");
      console.log("Election Category: ", election.electionCategory);
    }
  }, [election, visible, form]);

  const handleCategoryChange = async (value: string) => {
    setCategory(value);
    if (value === "NON_POLITICAL") {
      form.setFieldsValue({
        gazetteNotificationDate: null,
        lastDateForFillingNomination: null,
        scrutinyNominationDate: null,
        lastDateForWithdrawalOfNomination: null,
        dateOfPoll: null,
        dateOfCountingOfVotes: null,
        completionDeadlineDate: null,
        body: "",
      });
    }
  };
  function convertToISOZ(dateObj) {
    if (dateObj?.$isDayjsObject) {
      const year = dateObj.$y;
      const month = dateObj.$M;
      const day = dateObj.$D;

      return moment
        .utc()
        .year(year)
        .month(month)
        .date(day)
        .hour(1)
        .minute(10)
        .second(0)
        .millisecond(0)
        .toISOString();
    } else if (dateObj?._isAMomentObject) {
      return moment
        .utc()
        .year(dateObj.year())
        .month(dateObj.month())
        .date(dateObj.date())
        .hour(1)
        .minute(10)
        .second(0)
        .millisecond(0)
        .toISOString();
    } else {
      console.error("Invalid date object provided");
      return null;
    }
  }
  const handleFinish = async (values) => {
    try {
      setLoadingModal(true);
      console.log("values", values);
      const toISOStringOrNull = (date) => (date ? date.toISOString() : null);
      const electionDate = values.electionDate;
      const year = electionDate ? electionDate.format("YYYY") : null;
      const month = electionDate ? electionDate.format("MM") : null;
      // const formData = new FormData();
      // formData.append("file", values.electionPicture);
      const formData = new FormData();
      let imageUrl = election.imageUrl; // Use the existing image URL as fallback
      // console.log("imageUrl earlier", imageUrl);

      if (values.electionPicture) {
        formData.append("file", values.electionPicture[0].originFileObj);

        const imageData = await updateElectionImageApi(formData, election.id);
        imageUrl = imageData.data;
      }
      // console.log("imageUrl after", imageUrl);

      // console.log(convertToISOZ(values.dateOfPoll));

      const formattedValues = {
        // Fields directly mapped
        electionName: values.electionName,
        type: values.type, // Map 'type' to 'electionType'
        startDate: toISOStringOrNull(values.dateOfPoll),
        endDate: toISOStringOrNull(values.dateOfPoll), // Using the same as startDate, adjust if needed
        category: values.category,
        stateNameEn: values.state,
        year: year,
        month: month,
        status: values.status,
        numberOfPollingStations: parseInt(values.numberOfPollingStations, 10),
        numberOfPinkBooths: parseInt(values.numberOfPinkBooths, 10),
        numberOfVoters: parseInt(values.numberOfVoters, 10),
        numberOfMaleVoters: parseInt(values.numberOfMaleVoters, 10),
        numberOfFemaleVoters: parseInt(values.numberOfFemaleVoters, 10),
        numberOfTransgenderVoters: parseInt(
          values.numberOfTransgenderVoters,
          10
        ),
        remarks: values.remarks,
        boothCount: parseInt(values.booths, 10),
        electoralReleaseDate: convertToISOZ(values.electoralReleaseDate),
        gazetteNotificationDate: convertToISOZ(values.gazetteNotificationDate),
        notificationDate: toISOStringOrNull(values.notificationDate),
        lastDateForFillingNomination: convertToISOZ(
          values.lastDateForFillingNomination
        ),
        dateOfPoll: convertToISOZ(values.dateOfPoll),
        scrutinyNominationDate: convertToISOZ(values.scrutinyNominationDate),
        lastDateForWithdrawalOfNomination: convertToISOZ(
          values.lastDateForWithdrawalOfNomination
        ),
        dateOfCountingOfVotes: convertToISOZ(values.dateOfCountingOfVotes),
        completionDeadlineDate: convertToISOZ(values.completionDeadlineDate),
        electionDescription: values.electionDescription,
        body: category === "POLITICAL" ? values.body : null,
        bodyString: category === "POLITICAL" ? null : values.bodyString,
        electionCategory: values.category || "POLITICAL",
        pcName: values.pcName,
        acName: values.acName,
        urbanName: values.urbanName,
        ruralName: values.ruralName,
        country: values.country,
        state: values.state,
        imageUrl: imageUrl,
        id: editingElection.id,

        ...(category === "NON_POLITICAL" && {
          gazetteNotificationDate: undefined,
          lastDateForFillingNomination: undefined,
          scrutinyNominationDate: undefined,
          lastDateForWithdrawalOfNomination: undefined,
          dateOfPoll: undefined,
          dateOfCountingOfVotes: undefined,
          completionDeadlineDate: undefined,
          body: undefined,
        }),
      };

      // const imageData = await updateElectionImageApi(formData, election.id);
      // console.log("imageData", imageData);

      // formattedValues["imageUrl"] = imageData.data;
      console.log("formattedValues", formattedValues);
      setFileList([]);
      await onUpdate(formattedValues);
    } catch (error) {
      console.error("Error formatting form data:", error);
      message.error("Error updating election details");
      setLoadingModal(false);
    } finally {
      form.resetFields();
    }
  };

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Delhi",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
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

  return (
    <Modal
      title="Edit Election"
      open={visible}
      onCancel={onCancel}
      okText={"Update"}
      onOk={() => form.submit()}
      width={800}
      okButtonProps={{
        loading: loadingModal,
        disabled: loadingModal,
        style: {
          backgroundColor: "#1677ff",
          borderColor: "#1677ff",
          color: "#fff",
        },
      }}
      bodyStyle={{ maxHeight: "65vh", overflowY: "auto" }}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onValuesChange}
        onFinish={handleFinish}
        className="p-4"
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item label="Election Picture" name="electionPicture">
              <ImgCrop
                rotate
                aspect={1 / 1}
                quality={0.8}
                modalWidth={500}
                showReset
                beforeCrop={validateImageBeforeCrop}
                okText="Confirm"
                cancelText="Cancel"
                modalTitle={
                  <div className="flex justify-between items-center">
                    <span>Crop Election Picture</span>
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
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleChange}
                customRequest={dummyRequest}
                  maxCount={1}
                  multiple={false}
                >
                  {fileList.length < 1 && (
                    <div>
                      <UploadOutlined />
                      <div className="mt-2">Upload</div>
                    </div>
                  )}
                </Upload>
              </ImgCrop>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="category"
              label="Election Category"
              rules={[{ required: true }]}
            >
              <Select disabled onChange={handleCategoryChange}>
                <Option value="POLITICAL">Political</Option>
                <Option value="NON_POLITICAL">Non-Political</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="Election Type"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="GENERAL_ELECTION">General Election</Option>
                <Option value="BY_ELECTION">By Election</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            {category === "POLITICAL" ? (
              <Form.Item name="body" label="Enter Election Body">
                <Select placeholder="Select Election Body">
                  <Option key="1" value="UNION_BODY">
                    Union Body (MP)
                  </Option>
                  <Option key="2" value="STATE_BODY">
                    State Body (MLA)
                  </Option>
                  <Option key="3" value="URBAN_LOCAL">
                    Urban Body (ULB)
                  </Option>
                  <Option key="4" value="RURAL_LOCAL">
                    Rural Body (RLB)
                  </Option>
                </Select>
              </Form.Item>
            ) : (
              <Form.Item name="bodyString" label="Enter Election Body">
                <Input placeholder="Enter Body String" />
              </Form.Item>
            )}
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item name="country" label="Country" initialValue="India">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="state" label="State" rules={[{ required: true }]}>
              <Select showSearch>
                {indianStates.map((state) => (
                  <Option key={state} value={state}>
                    {state}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        {category === "NON_POLITICAL" && (
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
                <Input placeholder="Enter Location 1" />
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
                <Input placeholder="Enter Location 2" />
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
                <Input placeholder="Enter Location Name" />
              </Form.Item>
            </Col>
          </Row>
        )}

        {category === "POLITICAL" && (
          <Row gutter={[16, 16]}>
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
                    //   message: "Letters and spaces only",
                    // },
                  ]
                }
              >
                <Input />
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
                    //   message: "Letters and spaces only",
                    // },
                  ]
                }
              >
                <Input />
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
                    //   message: "Letters and spaces only",
                    // },
                  ]
                }
              >
                <Input />
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
                    //   message: "Letters and spaces only",
                    // },
                  ]
                }
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="electionName"
              label="Election Name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="electionDescription" label="Election Description">
              <TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="electoralReleaseDate"
              label="Electoral Release Date"
            >
              <DatePicker
                className="w-full"
                format="DD-MMM-YYYY"
                // dateRender={dateRender}
                locale={locale}
              />
            </Form.Item>
          </Col>
        </Row>

        {category === "POLITICAL" && (
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item name="status" label="Election Status">
                <Select>
                  <Option value="YET TO START">Yet to Start</Option>
                  <Option value="IN-PROGRESS">In-Progress</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="electionDate"
              label="Election Date"
              rules={[{ required: true }]}
            >
              <DatePicker
                className="w-full"
                format={dateFormat}
                dateRender={dateRender}
                locale={locale}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row> */}

        {/* Booth & Voter Info */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <h3 className="text-lg font-semibold mb-4">Booth Information:</h3>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="totalAllBooths"
                  label="Total All Booths"
                  // dependencies={["boothCount", "numberOfPinkBooths"]}
                  // rules={[
                  //   { validator: validateTotalBooths },
                  // ]}
                >
                  <Input
                    type="number"
                    min={1}
                    onKeyDown={(e) => {
                      if ([".", "e", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="booths"
                  label="Number of General Booths (Male & Female)"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.resolve();
                        }
                        if (!/^\d+$/.test(value)) {
                          return Promise.reject("Must be a valid number");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    type="number"
                    min={1}
                    onKeyDown={(e) => {
                      if ([".", "e", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="numberOfPinkBooths"
                  label="No. of Female Only Booths"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.resolve();
                        }
                        if (!/^\d+$/.test(value)) {
                          return Promise.reject("Must be a valid number");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    type="number"
                    min={0}
                    onKeyDown={(e) => {
                      if ([".", "e", "+", "-"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          <Col span={12}>
            <h3 className="text-lg font-semibold mb-4">Voter Information:</h3>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  name="numberOfVoters"
                  label="Total All Voters"
                  // dependencies={[
                  //   "numberOfMaleVoters",
                  //   "numberOfFemaleVoters",
                  //   "numberOfTransgenderVoters",
                  // ]}
                  // rules={[{ validator: validateVoters }]}
                >
                  <Input type="number" min={1} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="numberOfMaleVoters"
                  label="Total Male Voters"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.resolve();
                        }
                        if (!/^\d+$/.test(value)) {
                          return Promise.reject("Must be a valid number");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" min={0} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="numberOfFemaleVoters"
                  label="Total Female Voters"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.resolve();
                        }
                        if (!/^\d+$/.test(value)) {
                          return Promise.reject("Must be a valid number");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" min={0} />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="numberOfTransgenderVoters"
                  label="Total Transgender Voters"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) {
                          return Promise.resolve();
                        }
                        if (!/^\d+$/.test(value)) {
                          return Promise.reject("Must be a valid number");
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" min={0} />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* Calendar of Events */}
        {category === "POLITICAL" && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <h3 className="text-lg font-semibold mb-4">
                  Calendar of Events:
                </h3>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="gazetteNotificationDate"
                  label="Gazette Notification"
                >
                  <DatePicker
                    className="w-full"
                    format="DD-MMM-YYYY"
                    // dateRender={dateRender}
                    locale={locale}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="lastDateForFillingNomination"
                  label="Last Date for Nomination"
                  dependencies={["gazetteNotificationDate"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const gazetteNotificationDate = getFieldValue(
                          "gazetteNotificationDate"
                        );
                        if (
                          !value ||
                          !gazetteNotificationDate ||
                          value.isAfter(gazetteNotificationDate)
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          "Must be after Gazette notification"
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format={dateFormat}
                    disabledDate={(current) => {
                      const gazetteMoment = form.getFieldValue(
                        "gazetteNotificationDate"
                      );
                      return current && current < gazetteMoment?.endOf("day");
                    }}
                    // dateRender={dateRender}
                    locale={locale}
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

              <Col span={12}>
                <Form.Item
                  name="scrutinyNominationDate"
                  label="Scrutiny of Nomination"
                  dependencies={["lastDateForFillingNomination"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const nominationDate = getFieldValue(
                          "lastDateForFillingNomination"
                        );
                        if (
                          !value ||
                          !nominationDate ||
                          value.isAfter(nominationDate)
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          "Must be after last date of filing nomination."
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format={dateFormat}
                    // dateRender={dateRender}
                    onOpenChange={(open) => {
                      if (open) {
                        setNominationPickerKey((prev) => prev + 1);
                      }
                    }}
                    disabledDate={(current) => {
                      const filingDate = form.getFieldValue(
                        "lastDateForFillingNomination"
                      );
                      return current && current < filingDate?.endOf("day");
                    }}
                    locale={locale}
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

              <Col span={12}>
                <Form.Item
                  name="lastDateForWithdrawalOfNomination"
                  label="Last Date for Withdrawal"
                  dependencies={["scrutinyNominationDate"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const scrutinyDate = getFieldValue(
                          "scrutinyNominationDate"
                        );
                        if (
                          !value ||
                          !scrutinyDate ||
                          value.isAfter(scrutinyDate)
                        ) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          "Must be after scrutiny of nominations"
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format={dateFormat}
                    disabledDate={(current) => {
                      const scrutinyDate = form.getFieldValue(
                        "scrutinyNominationDate"
                      );
                      return current && current < scrutinyDate?.endOf("day");
                    }}
                    // dateRender={dateRender}
                    locale={locale}
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

              <Col span={12}>
                <Form.Item
                  name="dateOfPoll"
                  label="Date of Poll"
                  dependencies={["lastDateForWithdrawalOfNomination"]}
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
                        return Promise.reject("Must be after withdrawal date");
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format={dateFormat}
                    disabledDate={(current) => {
                      const withdrawalDate = form.getFieldValue(
                        "lastDateForWithdrawalOfNomination"
                      );
                      return current && current < withdrawalDate?.endOf("day");
                    }}
                    // dateRender={dateRender}
                    locale={locale}
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
                          return lastDateForWithdrawalOfNomination.add(
                            1,
                            "day"
                          );
                        }
                        return dateOfPoll;
                      }
                      return undefined;
                    })()}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="dateOfCountingOfVotes"
                  label="Date of Counting"
                  dependencies={["dateOfPoll"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const pollDate = getFieldValue("dateOfPoll");
                        if (!value || !pollDate || value.isAfter(pollDate)) {
                          return Promise.resolve();
                        }
                        return Promise.reject("Must be after poll date");
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format={dateFormat}
                    disabledDate={(current) => {
                      const dateOfPoll = form.getFieldValue("dateOfPoll");
                      // Removed electionDate check
                      return current && current < dateOfPoll?.endOf("day");
                    }}
                    // dateRender={dateRender}
                    locale={locale}
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
                          dateOfCountingOfVotes.isBefore(
                            dateOfPoll.endOf("day")
                          )
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
              <Col span={12}>
                <Form.Item
                  name="completionDeadlineDate"
                  label="Date before election completion"
                  dependencies={["dateOfCountingOfVotes"]}
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
                          "Must be after date of counting of votes"
                        );
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    className="w-full"
                    format={dateFormat}
                    disabledDate={(current) => {
                      const countingDate = form.getFieldValue(
                        "dateOfCountingOfVotes"
                      );
                      return current && current < countingDate?.endOf("day");
                    }}
                    // dateRender={dateRender}
                    locale={locale}
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

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item name="remarks" label="Remarks">
                  <TextArea rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default EditElectionModal;
