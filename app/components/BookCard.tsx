import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/catalog";
import type { ShopBook } from "@/lib/types";
import StarRating from "./StarRating";
import { ClockIcon } from "./icons";

export default function BookCard({
  book,
  preload = false,
}: {
  book: ShopBook;
  preload?: boolean;
}) {
  return (
    <Link className="for-you__recommended--books-link" href={`/book/${book.id}`}>
      {book.subscriptionRequired && <div className="book__pill">Premium</div>}
      <figure className="book__image--wrapper" style={{ marginBottom: 8 }}>
        <Image
          className="book__image"
          src={book.imageLink}
          alt={`Cover of ${book.title}`}
          width={172}
          height={172}
          sizes="172px"
          preload={preload}
        />
      </figure>
      <div className="recommended__book--title">{book.title}</div>
      <div className="recommended__book--author">{book.author}</div>
      <div className="recommended__book--sub-title">{book.subTitle}</div>
      <StarRating rating={book.averageRating} count={book.totalRating} />
      <div className="recommended__book--details-wrapper">
        <div className="recommended__book--details">
          <div className="recommended__book--details-icon">
            <ClockIcon />
          </div>
          <div className="recommended__book--details-text">{book.duration}</div>
        </div>
        <div className="book-card__price">{formatPrice(book.price)}</div>
      </div>
    </Link>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="for-you__recommended--books-link">
      <div className="book__image--wrapper" style={{ marginBottom: 8 }}>
        <div className="skeleton skeleton-for-you-image"></div>
      </div>
      <div className="skeleton skeleton-for-you-title"></div>
      <div className="skeleton skeleton-for-you-author"></div>
      <div className="skeleton skeleton-for-you-subtitle"></div>
      <div className="skeleton skeleton-for-you-subtitle short"></div>
      <div className="recommended__book--details-wrapper">
        <div className="skeleton skeleton-for-you-detail"></div>
        <div className="skeleton skeleton-for-you-detail"></div>
      </div>
    </div>
  );
}
