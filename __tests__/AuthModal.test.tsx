import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
const createUser = vi.fn();
const signIn = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/firebaseConfig", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...a: unknown[]) => createUser(...a),
  signInWithEmailAndPassword: (...a: unknown[]) => signIn(...a),
}));

import AuthModal from "@/app/AuthModal";

beforeEach(() => {
  push.mockReset();
  createUser.mockReset();
  signIn.mockReset();
  localStorage.clear();
});

describe("<AuthModal />", () => {
  it("opens on the login form and closes with the close button", async () => {
    const onClose = vi.fn();
    render(<AuthModal onClose={onClose} />);
    expect(screen.getByRole("dialog", { name: "Log in to Summarist" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("logs in as a guest", async () => {
    render(<AuthModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /Login as Guest/ }));
    expect(localStorage.getItem("summaristGuest")).toBe("true");
    expect(push).toHaveBeenCalledWith("/foryou");
  });

  it("logs in with email and password", async () => {
    signIn.mockResolvedValue({ user: { uid: "1" } });
    vi.spyOn(console, "log").mockImplementation(() => {});
    render(<AuthModal onClose={() => {}} redirectTo="/library" />);
    await userEvent.type(screen.getByPlaceholderText("Email Address"), " reader@example.com ");
    await userEvent.type(screen.getByPlaceholderText("Password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(signIn).toHaveBeenCalledWith({}, "reader@example.com", "secret123");
    expect(push).toHaveBeenCalledWith("/library");
  });

  it("switches between the login and sign-up forms", async () => {
    render(<AuthModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Don't have an account?" }));
    expect(screen.getByRole("heading", { name: "Sign up to Summarist" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Already have an account?" }));
    expect(screen.getByRole("heading", { name: "Login to Summarist" })).toBeInTheDocument();
  });
});

describe("sign-up form", () => {
  async function openSignUp() {
    render(<AuthModal onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Don't have an account?" }));
  }

  it("rejects mismatched passwords without calling Firebase", async () => {
    await openSignUp();
    await userEvent.type(screen.getByLabelText("Email address"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByRole("alert")).toHaveTextContent("The passwords don't match.");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects short passwords", async () => {
    await openSignUp();
    await userEvent.type(screen.getByLabelText("Email address"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(screen.getByRole("alert")).toHaveTextContent("at least 6 characters");
  });

  it("creates the account and redirects", async () => {
    createUser.mockResolvedValue({ user: { uid: "2" } });
    await openSignUp();
    await userEvent.type(screen.getByLabelText("Email address"), "new@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(createUser).toHaveBeenCalledWith({}, "new@example.com", "secret123");
    expect(push).toHaveBeenCalledWith("/foryou");
  });

  it("shows a friendly message when the email is taken", async () => {
    createUser.mockRejectedValue({ code: "auth/email-already-in-use" });
    await openSignUp();
    await userEvent.type(screen.getByLabelText("Email address"), "taken@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret123");
    await userEvent.type(screen.getByLabelText("Confirm password"), "secret123");
    await userEvent.click(screen.getByRole("button", { name: "Sign up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  });
});
