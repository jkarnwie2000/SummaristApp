import { BookCardSkeleton } from "../../components/BookCard";

/** Shown while the server fetches books (replaces the old fake 1.5s timer). */
export default function Loading() {
  return (
    <div className="row">
      <div className="container">
        <div className="for-you__wrapper">
          <div className="skeleton skeleton-for-you-section-title"></div>
          <div className="skeleton skeleton-selected__book"></div>
          {["recommended", "suggested"].map((row) => (
            <div key={row}>
              <div className="skeleton skeleton-for-you-section-title"></div>
              <div className="skeleton skeleton-for-you-section-subtitle"></div>
              <div className="for-you__recommended--books">
                {Array.from({ length: 5 }, (_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
