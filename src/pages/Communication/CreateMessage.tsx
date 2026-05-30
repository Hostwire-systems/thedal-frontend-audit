import React, { useState, useEffect } from "react";
import { Card, Button, Typography, Row, Col, Breadcrumb } from "antd";
import { LeftOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageOutlined,
  WhatsAppOutlined,
  NotificationOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import CreateSmsMessage from "./CreateSmsMessage";
import CreateRCSMessage from "./CreateRcsMessage";
import CreateWhatsappMessage from "./CreateWhatsappMessage";
import CreateVoiceMessage from "./CreateVoiceMessage";

const { Title, Text } = Typography;

const CreateMessage: React.FC = () => {
  const [selectedMsgType, setSelectedMsgType] = useState<string | null>("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-select message type from URL parameter
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && (typeParam === 'sms' || typeParam === 'whatsapp')) {
      setSelectedMsgType(typeParam);
    }
  }, [searchParams]);

  const channelOptions = [
    {
      key: "sms",
      title: "SMS",
      icon: <MessageOutlined style={{ fontSize: "24px" }} />,
      description: "Send text messages to your voters and volunteers.",
      features: ["Up to 160 characters per message", "High delivery rate"],
      actionText: "Select SMS",
      buttonType: "primary",
      buttonShape: "round",
      disabled: false,
    },
    {
      key: "whatsapp",
      title: "WhatsApp",
      icon: <WhatsAppOutlined style={{ fontSize: "24px", color: "#25D366" }} />,
      description: "Send rich messages with images & links.",
      features: ["Support for images, videos, and PDFs", "Better engagement"],
  actionText: "Select WhatsApp",
  buttonType: "primary",
      buttonShape: "round",
  buttonStyle: { backgroundColor: "#1D4ED8", borderColor: "#1D4ED8", color: "#fff" },
    },
    {
      key: "rcs",
      title: "RCS Messaging",
      icon: (
        <NotificationOutlined style={{ fontSize: "24px", color: "#1890FF" }} />
      ),
      description: "Rich Communication Services with interactive elements.",
      features: [
        "Interactive buttons and suggested replies",
        "Rich media support",
      ],
  actionText: "Coming soon",
  buttonType: "default",
      buttonShape: "round",
  disabled: true,
    },
    {
      key: "voice",
      title: "Voice Messaging",
      icon: <PhoneOutlined style={{ fontSize: "24px", color: "#FF8C00" }} />,
      description: "Automated voice calls to voters and volunteers.",
      features: ["Pre-recorded voice messages", "Text-to-speech conversion"],
  actionText: "Coming soon",
  buttonType: "default",
      buttonShape: "round",
  disabled: true,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {!selectedMsgType && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>
            Back to Campaigns
          </Button>
        </div>
      )}
      {!selectedMsgType && (
        <>
          <Breadcrumb
            items={[
              { title: <a onClick={() => navigate("/communication")}>Campaign Manager</a> },
              { title: "Create Campaign" },
            ]}
            style={{ marginBottom: 8 }}
          />
          {" "}
          <Title level={2} style={{ marginBottom: "24px" }}>
            Create Message
          </Title>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: "32px" }}
          >
            Select a communication channel to get started
          </Text>
        </>
      )}
      <Row gutter={[24, 24]} align="stretch">
        {!selectedMsgType ? (
          <>
            {channelOptions.map((option) => (
              <Col key={option.key} xs={24} sm={12} lg={6} style={{ display: "flex" }}>
                <Card
                  style={{
                    height: "100%",
                    minHeight: 300,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                    ...(option.disabled ? { opacity: 0.5, pointerEvents: "none" } : {}),
                  }}
                  bodyStyle={{ 
                    flex: 1, 
                    padding: "16px", 
                    display: "flex", 
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  onClick={() => !option.disabled && setSelectedMsgType(option.key)}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ marginRight: "12px" }}>{option.icon}</div>
                      <Title level={4} style={{ margin: 0 }}>
                        {option.title}
                      </Title>
                    </div>

                    <Text style={{ display: "block", marginBottom: "16px" }}>
                      {option.description}
                    </Text>

                    <div style={{ marginBottom: "24px" }}>
                      {option.features.map((feature, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            marginBottom: "8px",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: "6px",
                              height: "6px",
                              backgroundColor: "#1890ff",
                              borderRadius: "50%",
                              marginRight: "8px",
                              marginTop: "6px",
                            }}
                          />
                          <Text>{feature}</Text>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type={option.buttonType as any}
                    block
                    style={{
                      borderRadius: "4rem",
                      ...option.buttonStyle,
                    }}
                    onClick={() => !option.disabled && setSelectedMsgType(option.key)}
                  >
                    {option.actionText}
                  </Button>
                </Card>
              </Col>
            ))}
          </>
        ) : (
          <>
            {selectedMsgType === "whatsapp" ? (
              <>
                <CreateWhatsappMessage />
              </>
            ) : selectedMsgType === "voice" ? (
              <>
                <CreateVoiceMessage />
              </>
            ) : selectedMsgType === "sms" ? (
              <>
                <CreateSmsMessage />
              </>
            ) : selectedMsgType === "rcs" ? (
              <CreateRCSMessage />
            ) : (
              <></>
            )}
          </>
        )}
      </Row>
    </div>
  );
};

export default CreateMessage;
