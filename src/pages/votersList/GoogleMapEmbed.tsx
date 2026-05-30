import  { useState } from "react";

const GOOGLE_MAPS_API_KEY = "AIzaSyDELXYU2T40qihoAZJyr4q0ti-Vui1FUsQ";

interface Voter {
  voterLati: number;
  voterLongi: number;
}

interface GoogleMapEmbedProps {
  voters: Voter[];
}

const buildStaticMapUrl = (
  voters: Voter[],
  width: number,
  height: number
): string => {
  let center = { lat: 20.5937, lng: 78.9629 };
  if (voters.length > 0) {
    const latSum = voters.reduce((acc, voter) => acc + voter.voterLati, 0);
    const lngSum = voters.reduce((acc, voter) => acc + voter.voterLongi, 0);
    center = {
      lat: latSum / voters.length,
      lng: lngSum / voters.length,
    };
  }
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };


  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams({
    center: `${INDIA_CENTER.lat},${INDIA_CENTER.lng}`,
    zoom: "4",
    size: `${width}x${height}`,
    key: GOOGLE_MAPS_API_KEY || "",
  });

  voters.forEach((voter) => {
    params.append(
      "markers",
      `size:tiny|${voter.voterLati},${voter.voterLongi}`
    );
  });

  return `${baseUrl}?${params.toString()}`;
};

const GoogleMapEmbed = ({ voters }: GoogleMapEmbedProps) => {
  const [showInteractive, setShowInteractive] = useState(false);

  const staticWidth = 640;
  const staticHeight = 480;
  const staticMapUrl = buildStaticMapUrl(voters, staticWidth, staticHeight);

  const center =
    voters.length > 0
      ? {
          lat: voters.reduce((acc, v) => acc + v.voterLati, 0) / voters.length,
          lng: voters.reduce((acc, v) => acc + v.voterLongi, 0) / voters.length,
        }
      : { lat: 20.5937, lng: 78.9629 };

  const interactiveMapUrl = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${center.lat},${center.lng}&zoom=8`;

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: "56.25%",
        height: 0,
        overflow: "hidden",
      }}
    >
      {showInteractive ? (
        <iframe
          title="Interactive Google Map"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
          src={interactiveMapUrl}
          allowFullScreen
        ></iframe>
      ) : (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={staticMapUrl}
            alt="Static Google Map"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            style={{
              position: "absolute",
              bottom: "10px",
              right: "10px",
              background: "rgba(255,255,255,0.8)",
              border: "none",
              padding: "5px 10px",
              cursor: "pointer",
            }}
            onClick={() => setShowInteractive(true)}
          >
            Load Interactive Map
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMapEmbed;
