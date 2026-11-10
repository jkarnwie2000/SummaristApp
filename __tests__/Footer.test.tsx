import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Footer from "@/app/Footer";

describe("<Footer />", () => {
  it("links to the admin login page", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: "Admin Login" })).toHaveAttribute("href", "/admin/login");
  });
});
