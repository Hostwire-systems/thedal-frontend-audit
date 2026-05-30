import React from "react";
import { 
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import "./LeftBrandingPanel.css";

// Assets
import RegisterCircle from "../../assets/icons/Register_circle.svg";
import RegisterLocation from "../../assets/icons/Register-Location.svg";
import RegisterCircle2 from "../../assets/icons/Register_circle_small.svg";
import RegisterCircle3 from "../../assets/icons/Register_circle_smaller.svg";
import RegisterBarChart from "../../assets/icons/Register_barchart.svg";
import RegisterTeam from "../../assets/icons/Register_team.svg";
import RegisterCandidates from "../../assets/icons/Register-candidates.svg";
import RegisterBoothWorkers from "../../assets/icons/Register-booth-workers.svg";
import RegisterStrategists from "../../assets/icons/Register-strategists.svg";
import RegisterBoothManaged from "../../assets/icons/Register-booth-managed.svg";
import RegisterConstituency from "../../assets/icons/Register-consituency.svg";

const LeftBrandingPanel: React.FC = () => {
  return (
    <div className="auth-left-panel">
      <div className="left-content">
        <div className="badge-pill">
          India's First <span className="font-[600]">ElectionTech</span> SaaS Platform
        </div>

        <h1 className="hero-title">
          Powering Winning <br />
          Campaigns <span>Across India</span>
        </h1>

        <p className="hero-subtitle">
          Smart Data. Strong Teams. Winning Strategies. <br />
          All in One Powerful Platform
        </p>

        <div className="feature-list">
          <div className="feature-box">
            <div className="feature-svg-wrapper">
              <img src={RegisterCircle} alt="" className="feature-circle-svg" />
              <img src={RegisterBarChart} alt="" className="feature-inner-svg" />
            </div>
            <span className="feature-text">
              Booth Level <br /> Intelligence
            </span>
          </div>

          <div className="feature-box">
            <div className="feature-svg-wrapper">
              <img src={RegisterCircle} alt="" className="feature-circle-svg" />
              <img src={RegisterTeam} alt="" className="feature-inner-svg" />
            </div>
            <span className="feature-text">
              Team <br /> Co-ordination
            </span>
          </div>

          <div className="feature-box">
            <div className="feature-svg-wrapper">
              <img src={RegisterCircle} alt="" className="feature-circle-svg" />
              <img src={RegisterLocation} alt="" className="feature-layer-svg feature-layer-1" />
            </div>
            <span className="feature-text">
              Voter Data <br /> Mapping
            </span>
          </div>

          <div className="feature-box">
            <div className="feature-svg-wrapper">
              <img src={RegisterCircle} alt="" className="feature-circle-svg" />
              <img src={RegisterCircle2} alt="" className="feature-layer-svg feature-layer-1" />
              <img src={RegisterCircle3} alt="" className="feature-layer-svg feature-layer-2" />
            </div>
            <span className="feature-text">
              Real Time <br /> Campaign
            </span>
          </div>
        </div>
        
        <div style={{ flex: 1 }} />
      </div>

      <div className="bottom-stats-bar-wrapper">
        <div className="bottom-stats-bar">
          <div className="stats-brand">
            <div className="icon-circle stats-shield-circle">
              <SafetyCertificateOutlined />
            </div>
            <div>
              <div className="stats-brand-title">
                Trusted by Election Teams Across India
              </div>
              <div className="stats-brand-subtitle">
                Non-Partisan. Secure. Built for all political teams.
              </div>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">
                <img src={RegisterCandidates} alt="" className="stat-svg" />
              </div>
              <span className="stat-num">250+</span>
              <span className="stat-desc">Candidates</span>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <img src={RegisterBoothWorkers} alt="" className="stat-svg" />
              </div>
              <span className="stat-num">5,000+</span>
              <span className="stat-desc">Booth Workers</span>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <img src={RegisterStrategists} alt="" className="stat-svg" />
              </div>
              <span className="stat-num">30+</span>
              <span className="stat-desc">Strategists</span>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <img src={RegisterBoothManaged} alt="" className="stat-svg" />
              </div>
              <span className="stat-num">35,000+</span>
              <span className="stat-desc">Booths Managed</span>
            </div>

            <div className="stat-item">
              <div className="stat-icon">
                <img src={RegisterConstituency} alt="" className="stat-svg" />
              </div>
              <span className="stat-num">45+</span>
              <span className="stat-desc">Constituencies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftBrandingPanel;
