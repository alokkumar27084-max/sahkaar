import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Sends a GA4 page_view event on every route change.
 * We disabled automatic page views in the gtag config (send_page_view: false)
 * so this hook handles SPA navigation correctly.
 */
export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.gtag !== "function") return;

        window.gtag("event", "page_view", {
            page_path: location.pathname + location.search,
            page_title: document.title,
        });
    }, [location]);
}
