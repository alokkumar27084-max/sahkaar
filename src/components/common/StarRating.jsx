import React from "react";
import Icon from "./Icon";

const iconSizes = {
  "text-sm": "w-3.5 h-3.5",
  "text-base": "w-4 h-4",
  "text-xl": "w-5 h-5",
  "text-3xl": "w-7 h-7",
};

export default function StarRating({ value = 0, onChange, readonly = true, size = "text-xl" }) {
  const iconSize = iconSizes[size] || iconSizes["text-xl"];

  return (
    <div className="flex gap-0.5" aria-label={`Rating ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`transition-transform ${
            !readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"
          } ${star <= value ? "text-[#F59E0B]" : "text-slate-300"}`}
          disabled={readonly}
          aria-label={`${star} star`}
        >
          <Icon name="rating" className={iconSize} />
        </button>
      ))}
    </div>
  );
}
