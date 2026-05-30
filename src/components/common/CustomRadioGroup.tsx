import { Radio } from "antd";
import styled from "styled-components";
const CustomRadioGroup = styled(Radio.Group)`
  .ant-radio-checked .ant-radio-inner {
    border-color: blue;
  }

  .ant-radio-checked .ant-radio-inner::after {
    background-color: blue;
  }
`;
export default CustomRadioGroup;
