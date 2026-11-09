import { BookCardSkeleton } from "../../components/BookCard";

export default function Loading() {
  return (
    <div className="row">
      <div className="container">
        <div className="for-you__wrapper">
          {["saved", "finished"].map((shelf) => (
            <div key={shelf}>
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
