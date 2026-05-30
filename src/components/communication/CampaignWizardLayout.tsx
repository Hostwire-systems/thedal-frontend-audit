import React from "react";
import { Steps, Typography, Row, Col, Button } from "antd";

const { Title, Text } = Typography;

export interface CampaignWizardLayoutProps {
  title: string;
  subtitle?: string;
  steps: string[];
  currentStep: number;
  onStepChange?: (index: number) => void;
  onBack?: () => void;
  onCancel?: () => void;
  rightPanel?: React.ReactNode;
  extraLeft?: React.ReactNode;
  children: React.ReactNode;
}

const CampaignWizardLayout: React.FC<CampaignWizardLayoutProps> = ({
  title,
  subtitle,
  steps,
  currentStep,
  onStepChange,
  onBack,
  onCancel,
  rightPanel,
  children,
  extraLeft,
}) => {
  return (
    <div className="p-6">
      <div className="mb-4">
        {extraLeft && (
          <div className="mb-3">
            {extraLeft}
          </div>
        )}
        <div className="flex items-start justify-between">
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Text type="secondary" className="block mt-1">
                {subtitle}
              </Text>
            )}
          </div>
          <div className="space-x-2 hidden md:block">
            {onCancel && (
              <Button onClick={onCancel}>Cancel</Button>
            )}
            {onBack && (
              <Button onClick={onBack}>Back</Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6 mb-6">
        <Steps
          current={currentStep}
          onChange={onStepChange}
          items={steps.map((s) => ({ title: s }))}
        />
      </div>

      <Row gutter={16}>
        <Col xs={24} md={16} lg={17} xl={18}>
          {children}
        </Col>
        <Col xs={24} md={8} lg={7} xl={6}>
          {rightPanel && (
            <div className="md:sticky md:top-4">
              {rightPanel}
            </div>
          )}
        </Col>
      </Row>

      {/* Mobile back/cancel */}
      {(onBack || onCancel) && (
        <div className="mt-4 md:hidden space-x-2">
          {onCancel && (
            <Button onClick={onCancel}>Cancel</Button>
          )}
          {onBack && (
            <Button onClick={onBack}>Back</Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignWizardLayout;
