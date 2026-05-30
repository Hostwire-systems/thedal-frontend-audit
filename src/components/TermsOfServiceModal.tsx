import React from "react";
import { Modal, Button } from "antd";

interface TermsOfServiceModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <Modal
      title="Terms of Service for TEAM App"
      open={isVisible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        <p style={{ marginBottom: "1rem" }}>
        Welcome to <strong>TEAM (Thedal Election Analytics Manager)</strong>. By accessing or using our SaaS platform, you agree to comply with and be bound by these Terms & Conditions (T&C). If you do not agree, do not use the platform.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>1. Acceptance of Terms</strong>
        </h3>
        <p style={{ marginBottom: "1rem" }}>
        By signing up for, accessing, or using the TEAM App, you accept these
        T&Cs and any policies incorporated by reference. These terms govern
        your use of the platform, including any associated features, tools, and
        services provided by us.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>2. Nature of Service</strong>
        </h3>

        <p style={{marginBottom: "1rem"}}>
          The TEAM App is a Software-as-a-Service (SaaS) platform designed to manage campaigns, voter data, and election-related analytics.
        </p>

        <div style={{marginBottom: "1rem"}}>
        <ul style={{ paddingLeft: "0.5rem" }}>
            <li>• We provide the software and secure data storage.</li>
            <li>•	We do not own, access, sell, or control the data uploaded to the platform without explicit user consent.</li>
            <li>•	You are responsible for ensuring compliance with applicable laws and regulations when using the platform.</li>
          </ul>
        </div>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>3. User Responsibilities</strong>
        </h3>
        <p style={{ marginBottom: "1rem" }}>
          By using the TEAM App, you agree to:
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>• Provide accurate and current information during account registration.</li>
            <li>• Maintain the confidentiality of your account credentials.</li>
            <li>• Ensure data entered into the platform complies with all applicable data protection and privacy laws.</li>
            <li>• Use the platform solely for lawful purposes.</li>
          </ul>
        </p>

        <h4 style={{ marginBottom: "0.5rem" }}>
          <strong>Prohibited Activities</strong>
        </h4>
        <p style={{ marginBottom: "1rem" }}>
          You agree not to:
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>• Upload malicious and unauthorized content.</li>
            <li>•	Use the platform for illegal activities or activities infringing on third-party rights.</li>
            <li>•	Reverse-engineer, copy, or exploit any part of the software without prior consent.</li>
            <li>•	Circumvent security protocols or conduct unauthorized penetration tests.</li>
          </ul>
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>4. Data Ownership and Security</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>•	<strong>Ownership:</strong> All data uploaded remains your property.</li>
            <li>•	<strong>Access: </strong>We do not access your data without your explicit consent.</li>
            <li>•	<strong>Security:</strong> Your data is encrypted both at rest (AES-256) and in transit (TLS 1.2+).</li>
            <li>•	<strong>Third-Party Integrations:</strong> Any data shared with third-party services or APIs you choose to integrate is your responsibility.</li>
            <li>•	<strong>Data Backup:</strong> While we take precautions to ensure data integrity, maintaining independent backups is your responsibility.</li>
          </ul>
        </p>
        

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>5. Data Retention and Deletion</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>•	Upon account termination, your data will be retained for a limited period of 30days for reactivation or retrieval. After this period, data will be permanently deleted unless required by law.</li>
            <li>•	Users can request immediate data deletion by contacting support.</li>
          </ul>
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>6. Service Availability and Support</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>•	We strive to provide [99.9%] uptime monthly. Scheduled maintenance will be communicated in advance.</li>
            <li>•	Support requests are handled within [24-48 hours]. We are not liable for losses caused by service interruptions due to maintenance, upgrades, or force majeure events.</li>
          </ul>
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>7. Subscription and Payment</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>•	<strong>Fees:</strong> Subscription fees are payable as per the selected plan and are non-refundable except where required by law.</li>
            <li>•	<strong>Taxes:</strong> Users are responsible for any applicable taxes associated with the subscription.</li>
          </ul>
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>8. Beta Features</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          Any beta features offered are provided "as-is" for testing purposes and
          may be modified or discontinued at our discretion without prior notice.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>9. Intellectual Property</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>•	The TEAM App, its design, and underlying technology are the property of the service provider.</li>
            <li>•	Users may not copy, modify, or redistribute any part of the platform without written permission.</li>
          </ul>
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>10. Limitation of Liability</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          <ul style={{ paddingLeft: "0.5rem" }}>
            <li>•	To the extent permitted by law, we are not liable for indirect, incidental, or consequential damages arising from the use of the TEAM App.</li>
            <li>•	Our total liability is limited to the subscription fees paid by you only during the subscription active period.</li>
          </ul>
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>11. Indemnification</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          You agree to indemnify and hold harmless our company, employees, and affiliates from claims,
        damages, or liabilities arising from your use of the platform,
        including violations of these T&Cs or applicable laws.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>12. Compliance with Laws</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          You are solely responsible for ensuring that your use of the TEAM App
        complies with all applicable laws, including but not limited to data
        protection and election regulations.
        </p>
        
        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>13. Data Localization</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          Your data may be stored in specific jurisdictions to comply with local laws. Requests
          for specific data residency must be communicated during account setup.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>14. Force Majeure</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          We are not liable for delays or failures caused by events beyond our reasonable control,
          such as natural disasters, cyberattacks, or government actions.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>15. Updates to the Terms</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          We may update these T&Cs periodically to reflect changes to our services or applicable
          laws. Users will be notified of significant changes. Continued use of the platform after
          updates constitutes acceptance of the revised terms.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>16. Governing Law</strong>
        </h3>

        <p style={{ marginBottom: "1rem"}}>
          These T&Cs are governed by and construed in accordance with the laws of Chennai, Tamilnadu.
          Disputes will be resolved exclusively in the courts of Chennai.
        </p>

        <h3 style={{ fontSize: "16px", marginBottom: "0.5rem" }}>
          <strong>17. Contact Us</strong>
        </h3>   

        <p style={{ marginBottom: "1rem" }}>
          For any questions or concerns regarding these Terms & Conditions, please contact:{" "} <br />
            <strong>Email:</strong> <a href="mailto:contact@thedal.co.in" style={{ color: "#1677ff" }}>
              contact@thedal.co.in
            </a>
        </p>

        <p>
          By clicking "Sign In" or "Create Account," you acknowledge that you have read,
          understood, and agreed to these Terms & Conditions.
        </p>
      </div>
    </Modal>
  );
};

export default TermsOfServiceModal;
