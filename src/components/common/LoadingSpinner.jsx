import React from "react";

export default function LoadingSpinner({ size = "md" }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-[3px]", lg: "w-14 h-14 border-4" };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} rounded-full border-slate-200 border-t-[#06B6D4] animate-spin`} />
    </div>
  );
}
