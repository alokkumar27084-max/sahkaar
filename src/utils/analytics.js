const GA_ID = process.env.REACT_APP_GA4_ID;

export function initAnalytics() {
  if (!GA_ID || typeof window === "undefined") return;
  if (window.__thekedaar_ga_loaded) return;
  window.__thekedaar_ga_loaded = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

export function trackEvent(name, params = {}) {
  if (!GA_ID || typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
