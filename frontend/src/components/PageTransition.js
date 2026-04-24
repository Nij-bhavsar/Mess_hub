import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

const EXIT_DURATION_MS = 240;

function getRouteDepth(pathname) {
  return pathname.split("/").filter(Boolean).length;
}

function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("page-enter");
  const previousLocationRef = useRef(location);

  const direction = useMemo(() => {
    const previousDepth = getRouteDepth(previousLocationRef.current.pathname);
    const currentDepth = getRouteDepth(displayLocation.pathname);
    return currentDepth >= previousDepth ? "forward" : "backward";
  }, [displayLocation.pathname]);

  useEffect(() => {
    if (location.key === displayLocation.key) {
      previousLocationRef.current = location;
      setTransitionStage("page-enter");

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      return undefined;
    }

    setTransitionStage("page-exit");

    const timeoutId = window.setTimeout(() => {
      previousLocationRef.current = displayLocation;
      setDisplayLocation(location);
      setTransitionStage("page-enter");

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }, EXIT_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [location, displayLocation]);

  return (
    <div className="route-shell">
      <div
        key={displayLocation.key}
        className={`page-transition ${transitionStage}`}
        data-direction={direction}
      >
        {children(displayLocation)}
      </div>
    </div>
  );
}

export default PageTransition;
