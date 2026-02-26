// ─────────────────────────────────────────────────────────
// StarRating.js — Shows star rating visually
// PROPS:
//   rating    — number 0-5
//   size      — icon size in px (default 16)
//   editable  — if true, user can click to set rating
//   onChange  — called when user clicks a star (editable mode)
// ─────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

export default function StarRating({ rating = 0, size = 16, editable = false, onChange }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (editable ? (hovered || rating) : rating);
        return (
          <span
            key={star}
            style={{
              color: filled ? 'var(--amber)' : 'var(--gray-500)',
              cursor: editable ? 'pointer' : 'default',
              fontSize: size,
              lineHeight: 1,
              transition: 'color 100ms ease',
            }}
            onClick={() => editable && onChange?.(star)}
            onMouseEnter={() => editable && setHovered(star)}
            onMouseLeave={() => editable && setHovered(0)}
            role={editable ? 'button' : undefined}
            aria-label={editable ? `Rate ${star} star${star > 1 ? 's' : ''}` : undefined}
          >
            {filled ? <FaStar size={size} /> : <FiStar size={size} />}
          </span>
        );
      })}
    </div>
  );
}
