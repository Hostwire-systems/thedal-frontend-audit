import React from "react";
import { Modal, Button } from "antd";

interface PrivacyPolicyModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isVisible,
  onClose,
}) => {
  return (
    <Modal
      title="Privacy Policy for TEAM App SaaS Platform"
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
        Welcome to <strong>TEAM (Thedal Election Analytics Manager)</strong>, a Software-as-a-Service (SaaS) platform designed to empower organizations with secure and efficient tools for election campaign management. This Privacy Policy outlines how we, as a SaaS provider, handle data, ensuring transparency, security, and compliance with applicable laws.
        </p>

        <p style={{ marginBottom: "1rem" }}>
				By using the TEAM App, you agree to the terms of this Privacy Policy. If you do not agree, please refrain from using the service.
			  </p>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          <strong>1. Scope of the Policy</strong>
        </h3>
        <p style={{ marginBottom: "1rem" }}>
				This Privacy Policy applies to all users of the TEAM App, including organizations and their authorized representatives. As a SaaS provider, we facilitate the secure storage, processing, and management of data on behalf of our clients, adhering to strict data protection and privacy standards.
			  </p>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          <strong>2. Data Ownership and Control</strong>
        </h3>
        <div style={{ marginBottom: "1rem" }}>
          <ul className = "bullet-list">
            <li>•	 <strong>Client Ownership:</strong> All data entered, uploaded, or processed through the TEAM App is owned by the client.</li>
            <li>•	 <strong>No Unauthorized Access:</strong> We do not access, modify, or sell your data under any circumstances. Access to your data is only possible with your explicit knowledge and consent (e.g., during support or troubleshooting).</li>
            <li>•	 <strong>Encrypted Data:</strong> All data stored within the platform is encrypted both in transit and at rest, ensuring that even our team cannot view the data without authorized access.</li>
          </ul>
        </div>

        <hr/>

        <h3 style={{ fontSize: "16px", marginTop:"0.5rem", marginBottom: "0.5rem" }}>
          <strong>3. Data Collection and Usage</strong>
        </h3>
        <p style={{ marginBottom: "1rem" }}>
          As a SaaS provider, we collect minimal data necessary to provide the service:
        </p>

        <p>
          <strong>Data we collect:</strong>
        </p>

        <div>
          <ul className = "bullet-list">
            <li>•	 <strong>Account Information:</strong> Names, contact details, and payment information for account setup and subscription management.</li>
            <li>•	 <strong>Usage Data:</strong> Aggregated and anonymized usage data (e.g., app performance metrics) to improve our services.</li>
          </ul>
        </div>

        <p style={{ marginTop: "0.5rem" }}>
          <strong>How we use this data:</strong>
        </p>

        <div>
          <ul className = "bullet-list">
            <li>•	To provide and maintain the TEAM App.</li>
            <li>•	To communicate with users regarding updates, support, or billing.</li>
            <li>•	To analyze service usage trends (aggregated and anonymized data).</li>
            <li>•	To comply with legal obligations.</li>
          </ul>
        </div>

        <p style={{ marginTop: "0.5rem", marginBottom: "1rem" }}>
          <strong>We do not access, view, or use your operational data (e.g., voter data) without your explicit request and consent.</strong>
        </p>

        <hr style={{marginTop: "0.5rem"}}/>

        <h3 style={{ fontSize: "16px", marginTop:"0.5rem", marginBottom: "0.5rem" }}>
          <strong>4. Data Security</strong>
        </h3>
        <p style={{ marginBottom: "0.5rem" }}>
          We implement robust security measures to protect your data, including:
        </p>

        <div>
          <ul>
            <li>•	 <strong>Encryption:</strong> All sensitive data is encrypted both at rest and during transmission using industry-standard protocols.</li>
            <li>•	 <strong>Role-Based Access Control:</strong> Only authorized personnel have restricted access to the system, and even they cannot view client data unless explicitly permitted by the client.</li>
            <li>•	 <strong>Secure Hosting:</strong> Data is stored in secure, compliant data centers with advanced security measures.</li>
            <li>•	 <strong>Regular Audits:</strong> Periodic security assessments and compliance audits are conducted.</li>
            <li>•	 <strong>Data Breach Response:</strong> In the unlikely event of a data breach, affected clients will be promptly notified, and corrective measures will be taken immediately.</li>
          </ul>
        </div>

        <hr style={{marginTop: "0.5rem"}}/>

        <h3 style={{ fontSize: "16px", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          <strong>5. Compliance with Data Protection Law</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          We comply with global data protection laws, including:
        </p>

        <div>
          <ul>
            <li>•	 <strong>GDPR:</strong> Ensuring that data collection, processing, and storage adhere to the principles of lawfulness, transparency, purpose limitation, and data minimization.</li>
            <li>•	 <strong>Data Localization Requirements:</strong> Complying with local regulations for data residency, where applicable.</li>
          </ul>
        </div>

        <p style={{marginTop: "0.5rem", marginBottom:"1rem"}}>
        Clients are responsible for ensuring their use of the TEAM App complies with local laws and for obtaining any necessary consents for data processing.
        </p>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
          <strong>6. Data Sharing and Disclosure</strong>
        </h3>

        <p style={{marginBottom: "1rem"}}>
         We do not sell, rent, or share client data with third parties. Data may only be shared in the following limited circumstances:
        </p>

        <div>
          <ul>
            <li>•  <strong>Third-Party Services:</strong> With trusted third-party service providers essential to platform operation (e.g., cloud hosting), bound by strict confidentiality agreements.</li>
            <li>•	 <strong>Legal Obligations:</strong> If required by law, court order, or governmental authority, but only after notifying the client whenever possible.</li>
            <li>•	 <strong>Support Requests:</strong> If troubleshooting or support requires temporary access, it will only occur with the client's explicit knowledge and consent.</li>
          </ul>
        </div>

        <hr style={{marginTop:"1rem"}} />

        <h3 style={{ fontSize: "16px", marginTop:"1rem", marginBottom: "0.5rem" }}>
          <strong>7. Data Retention</strong>
        </h3>

        <div style={{marginTop: "1rem", marginBottom: "1rem"}}>
          <ul>
            <li>•	 <strong>Active Accounts:</strong> Data is retained for the duration of the service subscription.</li>
            <li>•	 <strong>Terminated Accounts:</strong> Upon termination of the account, data is retained for a limited period (as legally required or agreed) and then securely deleted or anonymized.</li>
            <li>•	 <strong>Client Requests:</strong> Clients may request the export or deletion of their data at any time, subject to applicable legal or contractual obligations.</li>
          </ul>
        </div>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop:"1rem", marginBottom: "0.5rem" }}>
          <strong>8. Client Responsibilities</strong>
        </h3>

        <p style={{marginBottom:"0.5rem"}}>
          As a client, you are responsible for:
        </p>

        <div style={{marginBottom:"1rem"}}>
          <ul>
            <li>•	 Ensuring that data entered into the TEAM App complies with applicable laws and regulations.</li>
            <li>•	 Obtaining necessary consents from individuals whose data is uploaded or processed.</li>
            <li>•	 Obtaining necessary consents from individuals whose data is uploaded or processed.</li>
          </ul>
        </div>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop:"1rem", marginBottom: "0.5rem" }}>
          <strong>9. User Rights</strong>
        </h3>

        <p style={{marginBottom: "0.5rem"}}>
          We respect your rights as a user of the TEAM App, including:
        </p>

        <div style={{marginBottom:"1rem"}}>
          <ul>
            <li>•	 <strong>Access:</strong> You can request access to any data we hold about your account.</li>
            <li>•	 <strong>Rectification:</strong> Correct inaccuracies in your account information.</li>
            <li>•	 <strong>Data Portability:</strong> Request an export of your data in a structured format.</li>
            <li>•	 <strong>Deletion:</strong> Request deletion of your data, subject to legal and contractual limitations.</li>
          </ul>
        </div>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop:"1rem", marginBottom: "0.5rem" }}>
          <strong>10. Updates to this Privacy Policy</strong>
        </h3>

        <p style={{marginBottom: "1rem"}}>
          This Privacy Policy may be updated periodically to reflect changes in laws, services, or industry practices. Significant updates will be communicated via the TEAM App or email. Continued use of the platform constitutes acceptance of the updated terms.
        </p>

        <hr />

        <h3 style={{ fontSize: "16px", marginTop:"1rem", marginBottom: "0.5rem" }}>
          <strong>11. Contact Information</strong>
        </h3>

        <p style={{ marginBottom: "1rem" }}>
          For any questions, concerns, or data-related requests, please contact us:{" "}
          <strong>Email:</strong> <a href="mailto:contact@thedal.co.in" style={{ color: "#1677ff" }}>
            contact@thedal.co.in
          </a>
        </p>

        <p>
          By using the TEAM App, you acknowledge and agree to this Privacy Policy.
        </p>
      </div>
    </Modal>
  );
};

export default PrivacyPolicyModal;
