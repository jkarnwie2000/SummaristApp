type Props = {
  rating: number;
  /** Number of ratings; shown in brackets when given. */
  count?: number;
  size?: "sm" | "md";
};

/**
 * Five stars with partial fill (4.3 → four full stars and a 30% star).
 * Drawn as one element with a CSS star mask, instead of ten SVGs per rating.
 */
export default function StarRating({ rating, count, size = "sm" }: Props) {
  const safe = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span
      className={`star-rating star-rating--${size}`}
      role="img"
      aria-label={`Rated ${safe.toFixed(1)} out of 5${count ? ` from ${count.toLocaleString()} ratings` : ""}`}
    >
      <span
        className="star-rating__stars"
        aria-hidden="true"
        style={{ "--star-fill": `${Math.round(safe * 200) / 10}%` } as React.CSSProperties}
      />
      <span className="star-rating__value" aria-hidden="true">
        {safe.toFixed(1)}
        {count !== undefined && (
          <span className="star-rating__count"> ({count.toLocaleString()})</span>
        )}
      </span>
    </span>
  );
}
