declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const HOST = import.meta.env.VITE_UMAMI_HOST as string | undefined;

export function initAnalytics() {
  if (!WEBSITE_ID || !HOST) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = `${HOST}/script.js`;
  script.dataset.websiteId = WEBSITE_ID;
  document.head.appendChild(script);
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  window.umami?.track(event, data);
}
