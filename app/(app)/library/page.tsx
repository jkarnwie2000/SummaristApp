import type { Metadata } from "next";
import { getAllBooks } from "@/lib/books";
import type { ShopBook } from "@/lib/types";
import BookCard from "../../components/BookCard";

export const metadata: Metadata = { title: "My Library" };

// The library isn't stored per user yet, so these are the same demo books the
// page showed before (now rendered from live API data instead of hard-coded markup).
const SAVED_IDS = ["5bxl50cz4bt"];
const FINISHED_IDS = ["18tro3gle2p", "2l0idxm1rvw", "2ozpy1q1pbt", "4t0amyb4upc", "5bxl50cz4bt"];

export default async function LibraryPage() {
  const books = new Map((await getAllBooks()).map((b) => [b.id, b]));
  const pick = (ids: string[]) =>
    ids.map((id) => books.get(id)).filter((b): b is ShopBook => Boolean(b));

  return (
    <div className="row">
      <div className="container">
        <div className="for-you__wrapper">
          <Shelf title="Saved Books" books={pick(SAVED_IDS)} />
          <Shelf title="Finished" books={pick(FINISHED_IDS)} />
        </div>
      </div>
    </div>
  );
}

function Shelf({ title, books }: { title: string; books: ShopBook[] }) {
  return (
    <section>
      <h2 className="for-you__title">{title}</h2>
      <div className="for-you__sub--title">
        {books.length} {books.length === 1 ? "Item" : "Items"}
      </div>
      <div className="for-you__recommended--books">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
