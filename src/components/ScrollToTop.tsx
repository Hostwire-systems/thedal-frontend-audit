import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface ScrollToTopProps {
  electionStep?: number; // Optional prop
  // setElectionStep?:()=>void;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({ electionStep }) => {
  const location = useLocation();

  useEffect(() => {
    console.log("ScrollToTop Triggered: electionStep =", electionStep);
    window.scrollTo({
      top: 100,
      left: 0,
      behavior: "smooth",
    });
    const container = document.querySelector(".con");
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth", // Optional smooth scroll
      });
    }
  }, [location, electionStep]);

  return null;
};

export default ScrollToTop;
