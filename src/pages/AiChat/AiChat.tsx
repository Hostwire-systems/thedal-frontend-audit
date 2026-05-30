import React, { useState, useRef, useEffect } from "react";
import { Card, Input, Button, Avatar, Space, Spin, Skeleton } from "antd";
import { SendOutlined, RobotOutlined, UserOutlined } from "@ant-design/icons";
import type { FC } from "react";
import { v4 as uuidv4 } from "uuid";

interface Message {
  id: string;
  type: "user" | "bot" | "skeleton";
  content: string;
}

const AiChat: FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      type: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const skeletonMessage: Message = {
      id: uuidv4(),
      type: "skeleton",
      content: "",
    };
    setMessages((prev) => [...prev, skeletonMessage]);

    setTimeout(() => {
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== skeletonMessage.id)
      );

      const aiMessage: Message = {
        id: uuidv4(),
        type: "bot",
        content: `You said: "${userMessage.content}"`,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
    };

  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const SkeletonMessage = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: 12,
        }}
      >
        <Avatar
          icon={<RobotOutlined />}
          style={{
            marginRight: 8,
            backgroundColor: "#e6f7ff",
            color: "#1890ff",
          }}
        />
        <div
          style={{
            width: "40%",
            padding: "10px 14px",
            borderRadius: 16,
            background: "#ffffff",
            boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Skeleton
            active
            paragraph={{ rows: 1, width: ["100%"] }}
            title={false}
          />
          <Skeleton
            active
            paragraph={{ rows: 1, width: ["80%"] }}
            title={false}
            style={{ marginTop: 8 }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = (msg: Message) => {

    if (msg.type === "skeleton") {
      return <SkeletonMessage key={msg.id} />;
    }

    const isUser = msg.type === "user";

    return (
      <div
        key={msg.id}
        style={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          marginBottom: 12,
        }}
      >
        {!isUser && (
          <Avatar
            icon={<RobotOutlined />}
            style={{
              marginRight: 8,
              backgroundColor: "#e6f7ff",
              color: "#1890ff",
            }}
          />
        )}

        <div
          style={{
            maxWidth: "70%",
            padding: "10px 14px",
            borderRadius: 16,
            background: isUser ? "#1890ff" : "#fafafa",
            color: isUser ? "white" : "#000",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: isUser
              ? "0 1px 4px rgba(0, 0, 0, 0.1)"
              : "0 1px 4px rgba(0, 0, 0, 0.05)",
          }}
        >
          {msg.content}
        </div>

        {isUser && (
          <Avatar
            icon={<UserOutlined />}
            style={{ marginLeft: 8, backgroundColor: "#1890ff" }}
          />
        )}
      </div>
    );
  };

  return (
    <Card
      bordered={false}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <RobotOutlined style={{ marginRight: 10, color: "#1890ff" }} />
          <span>AI Assistant</span>
        </div>
      }
      style={{
        maxWidth: 800,
        height: "80vh",
        margin: "40px auto",
        // borderRadius: 16,
        display: "flex",
        boxShadow: "none", // remove any shadow (optional)
        border: "none",
        flexDirection: "column",
        // boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
      styles={{
        header: {
          fontSize: "1.2rem",
          fontWeight: "bold",
          border: "none",
          background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)",
          // borderTopLeftRadius: 16,
          // borderTopRightRadius: 16,
          // borderBottom: "1px solid #f0f0f0",
          padding: "16px 24px",
        },
        body: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: 0,
          border: "none",
          overflow: "hidden",
        },
      }}
    >
      {/* Chat Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          // background: "#fafafa",
        }}
      >
        {messages.map(renderMessage)}
        {loading && (
          <div style={{ textAlign: "center", margin: "1rem 0" }}>
            <Spin className="custom-spin-dark" tip="AI is typing..." />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "12px 16px",
          background: "#fff",

          borderTop: "1px solid #f0f0f0",
        }}
      >
        <Space.Compact
          style={{
            width: "100%",
            alignItems: "flex-end",
            border: "1px solid #d9d9d9",
            borderRadius: "12px",
            padding: "8px",
          }}
        >
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent newline
                handleSend(); // Send message
              }
            }}
            placeholder="Type your message..."
            disabled={loading}
            autoSize={{ minRows: 1, maxRows: 6 }}
            bordered={false}
            style={{
              flex: 1,
              resize: "none",
              fontSize: "16px",
              padding: "4px 8px",
              background: "transparent",
              boxShadow: "none",
              border: "none",
              outline: "none",
            }}
          />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={loading || !input.trim()}
            style={{
              marginLeft: 8,
              color: "white",
              borderRadius: "10px",
              backgroundColor: "#1D4ED8",
              borderColor: "#1D4ED8",
            }}
          />
        </Space.Compact>
      </div>
    </Card>
  );
};

export default AiChat;
