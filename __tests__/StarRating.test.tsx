import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StarRating from "@/app/components/StarRating";

describe("<StarRating />", () => {
  it("shows the rating and review count", () => {
    render(<StarRating rating={4.3} count={1200} />);
    expect(screen.getByRole("img", { name: "Rated 4.3 out of 5 from 1,200 ratings" })).toBeInTheDocument();
    expect(screen.getByText("4.3")).toBeInTheDocument();
    expect(screen.getByText("(1,200)")).toBeInTheDocument();
  });

  it("clamps ratings to the 0-5 range", () => {
    const { rerender } = render(<StarRating rating={9} />);
    expect(screen.getByRole("img", { name: "Rated 5.0 out of 5" })).toBeInTheDocument();
    rerender(<StarRating rating={-2} />);
    expect(screen.getByRole("img", { name: "Rated 0.0 out of 5" })).toBeInTheDocument();
  });
});
