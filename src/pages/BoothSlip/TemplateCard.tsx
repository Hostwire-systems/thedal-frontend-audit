import React from "react";

interface TemplateProps {
  templateVariant:
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16;
  candidateImage: string | null;
  width?: number; // how wide you want the final preview
  height?: number; // how tall you want the final preview
}

/**
 * For each template variant, define:
 * - backgroundImage: e.g. "1.png"
 * - overlayX, overlayY, overlayWidth, overlayHeight
 *   (coordinates for the candidate's image placeholder)
 */
const templateConfigs = {
  1: {
    backgroundImage: `url("1.png")`,
    overlayX: 175, // px from left
    overlayY: 310, // px from top
    overlayWidth: 200,
    overlayHeight: 280,
  },
  2: {
    backgroundImage: `url("2.png")`,
    overlayX: 175,
    overlayY: 5,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  3: {
    backgroundImage: `url("3.png")`,
    overlayX: 175,
    overlayY: 302,
    overlayWidth: 200,
    overlayHeight: 280,
  },
  4: {
    backgroundImage: `url("4.png")`,
    overlayX: 175,
    overlayY: 10,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  5: {
    backgroundImage: `url("1.png")`,
    overlayX: 175, // px from left
    overlayY: 310, // px from top
    overlayWidth: 200,
    overlayHeight: 280,
  },
  6: {
    backgroundImage: `url("2.png")`,
    overlayX: 175,
    overlayY: 5,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  7: {
    backgroundImage: `url("3.png")`,
    overlayX: 175,
    overlayY: 302,
    overlayWidth: 200,
    overlayHeight: 280,
  },
  8: {
    backgroundImage: `url("4.png")`,
    overlayX: 175,
    overlayY: 10,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  9: {
    backgroundImage: `url("1.png")`,
    overlayX: 175,
    overlayY: 310,
    overlayWidth: 200,
    overlayHeight: 280,
  },
  10: {
    backgroundImage: `url("2.png")`,
    overlayX: 175,
    overlayY: 5,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  11: {
    backgroundImage: `url("3.png")`,
    overlayX: 175,
    overlayY: 302,
    overlayWidth: 200,
    overlayHeight: 280,
  },
  12: {
    backgroundImage: `url("4.png")`,
    overlayX: 175,
    overlayY: 10,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  13: {
    backgroundImage: `url("1.png")`,
    overlayX: 175,
    overlayY: 310,
    overlayWidth: 200,
    overlayHeight: 280,
  },
  14: {
    backgroundImage: `url("2.png")`,
    overlayX: 175,
    overlayY: 5,
    overlayWidth: 200,
    overlayHeight: 290,
  },
  15: {
    backgroundImage: `url("3.png")`,
    overlayX: 175,
    overlayY: 302,
    overlayWidth: 200,
    overlayHeight: 280,
  },
  16: {
    backgroundImage: `url("4.png")`,
    overlayX: 175,
    overlayY: 10,
    overlayWidth: 200,
    overlayHeight: 290,
  },
};

export const TemplateCard: React.FC<TemplateProps> = ({
  templateVariant,
  candidateImage,
  width = 600,
  height = 700,
}) => {
  const config = templateConfigs[templateVariant];
  const { backgroundImage, overlayX, overlayY, overlayWidth, overlayHeight } =
    config;

  return (
    <div
      style={{
        position: "relative",
        width: `300px`,
        height: `600px`,
        backgroundImage: backgroundImage,
        backgroundSize: "contain",
        backgroundPosition: "center", // Center the booth slip
        backgroundRepeat: "no-repeat",
        border: "1px solid #ccc",
        margin: "0 auto", // Center the div horizontally
        display: "flex", // Ensures content inside stays aligned
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {!candidateImage && (
        <div
          style={{
            position: "absolute",
            left: "50%", // Center from the booth slip
            top: overlayY, // Keep the Y position as it is
            width: overlayWidth,
            height: overlayHeight,
            backgroundColor: "white", // Set the background to white
            transform: "translateX(-50%)", // Center horizontally
          }}
        />
      )}
      {candidateImage && (
        <img
          src={candidateImage}
          alt="Candidate"
          style={{
            position: "absolute",
            left: "50%", // Center from the booth slip
            top: overlayY, // Keep the Y position as it is
            width: overlayWidth,
            height: overlayHeight,
            objectFit: "cover",
            objectPosition: "top",
            transform: "translateX(-50%)",
          }}
        />
      )}
    </div>
  );
};
