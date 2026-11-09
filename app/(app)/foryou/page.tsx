import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBooks } from "@/lib/books";
import { formatPrice } from "@/lib/catalog";
import BookCard from "../../components/BookCard";
import StarRating from "../../components/StarRating";
import { PlayIcon } from "../../components/icons";

export const metadata: Metadata = { title: "For You" };

export default async function ForYouPage() {
  // Fetched in parallel on the server and cached for an hour (see lib/books.ts).
  const [selected, recommended, suggested] = await Promise.all([
    getBooks("selected"),
    getBooks("recommended"),
    getBooks("suggested"),
  ]);
  const featured = selected[0];

  return (
    <div className="row">
      <div className="container">
        <div className="for-you__wrapper">
          {featured && (
            <>
              <div className="for-you__title">Selected just for you</div>
              <Link className="selected__book" href={`/book/${featured.id}`}>
                <div className="selected__book--sub-title">{featured.subTitle}</div>
                <div className="selected__book--line"></div>
                <div className="selected__book--content">
                  <figure
                    className="book__image--wrapper"
                    style={{ height: 140, width: 140, minWidth: 140 }}
                  >
                    <Image
                      className="book__image"
                      src={featured.imageLink}
                      alt={`Cover of ${featured.title}`}
                      width={140}
                      height={140}
                      preload
                    />
                  </figure>
                  <div className="selected__book--text">
                    <div className="selected__book--title">{featured.title}</div>
                    <div className="selected__book--author">{featured.author}</div>
                    <StarRating
                      rating={featured.averageRating}
                      count={featured.totalRating}
                    />
                    <div className="selected__book--duration-wrapper">
                      <div className="selected__book--icon">
                        <PlayIcon />
                      </div>
                      <div className="selected__book--duration">{featured.duration}</div>
                      <div className="book-card__price book-card__price--featured">
                        {formatPrice(featured.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </>
          )}

          <BookRow
            title="Recommended for you"
            subtitle="We think you'll like these"
            books={recommended}
            preloadFirst
          />
          <BookRow title="Suggested Books" subtitle="Browse those books" books={suggested} />

          {!featured && recommended.length === 0 && suggested.length === 0 && (
            <p className="shop-empty">
              We couldn&apos;t load books right now. Please refresh the page.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BookRow({
  title,
  subtitle,
  books,
  preloadFirst = false,
}: {
  title: string;
  subtitle: string;
  books: Awaited<ReturnType<typeof getBooks>>;
  preloadFirst?: boolean;
}) {
  if (books.length === 0) return null;
  return (
    <section>
      <h2 className="for-you__title">{title}</h2>
      <div className="for-you__sub--title">{subtitle}</div>
      <div className="for-you__recommended--books">
        {books.map((book, i) => (
          <BookCard key={book.id} book={book} preload={preloadFirst && i < 4} />
        ))}
      </div>
    </section>
  );
}
