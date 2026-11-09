import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBook } from "@/lib/books";
import { DEFAULT_STOCK, formatPrice, LOW_STOCK_THRESHOLD } from "@/lib/catalog";
import { getStore } from "@/lib/store";
import StarRating from "../../../components/StarRating";
import { BulbIcon, ClockIcon, MicIcon } from "../../../components/icons";
import AddToCart from "./AddToCart";
import ReadListenButtons from "./ReadListenButtons";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBook((await params).id);
  return book
    ? { title: book.title, description: book.subTitle }
    : { title: "Book not found" };
}

export default async function BookPage({ params }: Props) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  // If the store is unreachable, still show the book (assume default stock).
  const stock = await getStore()
    .getInventory([book.id])
    .then((inv) => inv[book.id])
    .catch((error) => {
      console.error("Could not read inventory", error);
      return DEFAULT_STOCK;
    });

  return (
    <div className="row book-page__row">
      <div className="container book-page__container">
        <div className="inner__wrapper">
          <div className="inner__book">
            <h1 className="inner-book__title">{book.title}</h1>
            <div className="inner-book__author">{book.author}</div>
            <div className="inner-book__sub--title">{book.subTitle}</div>
            <div className="inner-book__wrapper">
              <div className="inner-book__description--wrapper">
                <div className="inner-book__description">
                  <StarRating
                    rating={book.averageRating}
                    count={book.totalRating}
                    size="md"
                  />
                </div>
                <div className="inner-book__description">
                  <div className="inner-book__icon">
                    <ClockIcon />
                  </div>
                  <div className="inner-book__duration">{book.duration}</div>
                </div>
                <div className="inner-book__description">
                  <div className="inner-book__icon">
                    <MicIcon />
                  </div>
                  <div className="inner-book__type">{book.type}</div>
                </div>
                <div className="inner-book__description">
                  <div className="inner-book__icon">
                    <BulbIcon />
                  </div>
                  <div className="inner-book__key--ideas">
                    {book.keyIdeas} Key ideas
                  </div>
                </div>
              </div>
            </div>

            <div className="book-buy">
              <div className="book-buy__price">{formatPrice(book.price)}</div>
              <div
                className={`book-buy__stock ${
                  stock === 0
                    ? "book-buy__stock--out"
                    : stock <= LOW_STOCK_THRESHOLD
                      ? "book-buy__stock--low"
                      : ""
                }`}
              >
                {stock === 0
                  ? "Out of stock"
                  : stock <= LOW_STOCK_THRESHOLD
                    ? `Only ${stock} left`
                    : "In stock"}
              </div>
              <AddToCart
                stock={stock}
                item={{
                  bookId: book.id,
                  title: book.title,
                  author: book.author,
                  imageLink: book.imageLink,
                  price: book.price,
                }}
              />
            </div>

            <ReadListenButtons bookId={book.id} />

            <h2 className="inner-book__secondary--title">What&apos;s it about?</h2>
            <div className="inner-book__tags--wrapper">
              {book.tags.map((tag) => (
                <div className="inner-book__tag" key={tag}>
                  {tag}
                </div>
              ))}
            </div>
            <div className="inner-book__book--description">{book.bookDescription}</div>
            <h2 className="inner-book__secondary--title">About the author</h2>
            <div className="inner-book__author--description">
              {book.authorDescription}
            </div>
          </div>
          <div className="inner-book--img-wrapper">
            <figure
              className="book__image--wrapper"
              style={{ height: 300, width: 300, minWidth: 300 }}
            >
              <Image
                className="book__image"
                src={book.imageLink}
                alt={`Cover of ${book.title}`}
                width={300}
                height={300}
                preload
              />
            </figure>
          </div>
        </div>
      </div>
    </div>
  );
}
