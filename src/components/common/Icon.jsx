import React from "react";

function Svg({ className = "w-5 h-5", viewBox = "0 0 24 24", children }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export default function Icon({ name, className = "w-5 h-5" }) {
  switch (name) {
    case "location":
      return (
        <Svg className={className}>
          <path d="M12 21c4-4.5 6-7.5 6-10a6 6 0 1 0-12 0c0 2.5 2 5.5 6 10Z" />
          <circle cx="12" cy="11" r="2.5" />
        </Svg>
      );
    case "search":
      return (
        <Svg className={className}>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        </Svg>
      );
    case "warning":
      return (
        <Svg className={className}>
          <path d="M12 3 2.8 19h18.4L12 3Z" />
          <path d="M12 9v4" />
          <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
        </Svg>
      );
    case "message":
      return (
        <Svg className={className}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16H9l-5 4v-3.7A2.5 2.5 0 0 1 4 13.5v-7Z" />
        </Svg>
      );
    case "shield":
      return (
        <Svg className={className}>
          <path d="M12 3 5.5 6v5.8c0 4.2 2.6 7.3 6.5 9.2 3.9-1.9 6.5-5 6.5-9.2V6L12 3Z" />
          <path d="m9.2 12.3 1.8 1.8 3.8-3.8" />
        </Svg>
      );
    case "zap":
      return (
        <Svg className={className}>
          <path d="M13.5 2 6 13h4l-1.5 9L18 10h-4l-.5-8Z" />
        </Svg>
      );
    case "worker":
      return (
        <Svg className={className}>
          <path d="M6 10h12v2H6z" />
          <path d="M8 10V8a4 4 0 0 1 8 0v2" />
          <circle cx="12" cy="14.5" r="2.5" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </Svg>
      );
    case "view":
      return (
        <Svg className={className}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.6" />
        </Svg>
      );
    case "rating":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17l-5.6 3 1.1-6.2L3 9.4l6.2-.9L12 2.8Z" />
        </svg>
      );
    case "review":
      return (
        <Svg className={className}>
          <path d="M5 4h14v12H9l-4 4V4Z" />
          <path d="M9 8h6M9 12h4" />
        </Svg>
      );
    case "user":
      return (
        <Svg className={className}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </Svg>
      );
    case "link":
      return (
        <Svg className={className}>
          <path d="M10 14 8 16a3 3 0 1 1-4.2-4.2l2-2A3 3 0 0 1 10 9" />
          <path d="M14 10 16 8a3 3 0 1 1 4.2 4.2l-2 2A3 3 0 0 1 14 15" />
          <path d="m9 15 6-6" />
        </Svg>
      );
    case "camera":
      return (
        <Svg className={className}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7l1.2-2h3.6L15 7" />
          <circle cx="12" cy="13.5" r="3.2" />
        </Svg>
      );
    case "id-card":
      return (
        <Svg className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="11" r="1.8" />
          <path d="M6.5 15a3 3 0 0 1 4 0M13 10h5M13 13h5" />
        </Svg>
      );
    case "bulb":
      return (
        <Svg className={className}>
          <path d="M12 3a6 6 0 0 0-3.8 10.6c.8.7 1.3 1.6 1.3 2.6V17h5v-.8c0-1 .5-2 1.3-2.6A6 6 0 0 0 12 3Z" />
          <path d="M9.5 20h5M10.5 17h3" />
        </Svg>
      );
    case "check":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12.2 2.2 2.2 4.8-4.8" />
        </Svg>
      );
    case "pending":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </Svg>
      );
    case "trophy":
      return (
        <Svg className={className}>
          <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H5a2 2 0 0 0 2 3M16 6h3a2 2 0 0 1-2 3" />
          <path d="M12 11v4M9 19h6" />
        </Svg>
      );
    case "team":
      return (
        <Svg className={className}>
          <circle cx="9" cy="9" r="2.2" />
          <circle cx="15" cy="9" r="2.2" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0M10.5 19a4.5 4.5 0 0 1 9 0" />
        </Svg>
      );
    case "compass":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="m10 14 1.2-4.2L15.5 8l-1.8 4.2L10 14Z" />
        </Svg>
      );
    case "construction":
      return (
        <Svg className={className}>
          <path d="M4 19h16M6 19V9l6-5 6 5v10" />
          <path d="M10 14h4M12 12v4" />
        </Svg>
      );
    case "electrical":
      return <Icon name="zap" className={className} />;
    case "plumbing":
      return (
        <Svg className={className}>
          <path d="M15 3v4h-2v2h-2V7H9V3" />
          <path d="M12 9v5" />
          <path d="M7 14h10v2a5 5 0 0 1-10 0v-2Z" />
        </Svg>
      );
    case "painting":
      return (
        <Svg className={className}>
          <path d="m6 5 12 12M10 4l10 10" />
          <path d="M4 8c0-1.7 1.3-3 3-3h2l8 8v2a3 3 0 0 1-3 3h-1L4 9V8Z" />
        </Svg>
      );
    case "events":
      return (
        <Svg className={className}>
          <path d="M12 3v18M3 12h18" />
          <path d="M5 5c4 0 4 2.5 7 2.5S15 5 19 5c0 4-2.5 4-2.5 7S19 15 19 19c-4 0-4-2.5-7-2.5S9 19 5 19c0-4 2.5-4 2.5-7S5 9 5 5Z" />
        </Svg>
      );
    case "carpentry":
      return (
        <Svg className={className}>
          <path d="m5 18 5-5 2 2-5 5H5v-2Z" />
          <path d="m12 10 2-2 3 3-2 2M14 6l3-3 4 4-3 3" />
        </Svg>
      );
    case "farming":
      return (
        <Svg className={className}>
          <path d="M12 21V8" />
          <path d="M12 11c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 14c3 0 5-2 5-5-3 0-5 2-5 5Z" />
        </Svg>
      );
    case "transport":
      return (
        <Svg className={className}>
          <path d="M3 8h12v8H3zM15 11h3l3 3v2h-6z" />
          <circle cx="7" cy="18" r="1.7" />
          <circle cx="18" cy="18" r="1.7" />
        </Svg>
      );
    case "cleaning":
      return (
        <Svg className={className}>
          <path d="M8 4h8M10 4v4l-3 9h10l-3-9V4" />
          <path d="M9 17v3M15 17v3" />
        </Svg>
      );
    case "labour_group":
      return <Icon name="team" className={className} />;
    case "property":
      return (
        <Svg className={className}>
          <path d="M3 11 8 7l4 4 4-4 5 4v8H3z" />
          <path d="M9 19v-4h6v4" />
        </Svg>
      );
    case "other":
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="2" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4" />
        </Svg>
      );
    default:
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
        </Svg>
      );
  }
}
