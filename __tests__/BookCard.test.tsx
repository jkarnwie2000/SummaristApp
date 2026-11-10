import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BookCard from "@/app/components/BookCard";
import type { ShopBook } from "@/lib/types";

// Render next/image as a plain <img> so tests don't depend on the image optimizer.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { preload: _preload, alt, ...rest } = props;
    void _preload;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt as string} {...(rest as object)} />;
  },
}));

const book = {
  id: "g2tdej27d23",
  title: "Atomic Habits",
  author: "James Clear",
  subTitle: "An Easy & Proven Way to Build Good Habits",
  imageLink: "https://example.com/atomic.png",
  averageRating: 4.4,
  totalRating: 3200,
  subscriptionRequired: true,
  price: 1699,
  duration: "03:24",
} as unknown as ShopBook;

describe("<BookCard />", () => {
  it("links to the book page and shows its details", () => {
    render(<BookCard book={book} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/book/g2tdej27d23");
    expect(screen.getByText("Atomic Habits")).toBeInTheDocument();
    expect(screen.getByText("James Clear")).toBeInTheDocument();
    expect(screen.getByAltText("Cover of Atomic Habits")).toBeInTheDocument();
    expect(screen.getByText("$16.99")).toBeInTheDocument();
    expect(screen.getByText("03:24")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Rated 4\.4 out of 5/ })).toBeInTheDocument();
  });

  it("shows the Premium pill only for subscription books", () => {
    const { rerender } = render(<BookCard book={book} />);
    expect(screen.getByText("Premium")).toBeInTheDocument();
    rerender(<BookCard book={{ ...book, subscriptionRequired: false }} />);
    expect(screen.queryByText("Premium")).not.toBeInTheDocument();
  });
});
