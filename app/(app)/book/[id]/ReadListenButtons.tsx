"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/firebaseConfig";
import AuthModal from "../../../AuthModal";
import { MicIcon, ReadIcon } from "../../../components/icons";

export default function ReadListenButtons({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  const open = () => {
    const isGuest = localStorage.getItem("summaristGuest") === "true";
    if (!auth.currentUser && !isGuest) {
      setAuthOpen(true);
      return;
    }
    router.push(`/player/${bookId}`);
  };

  return (
    <>
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} redirectTo={`/player/${bookId}`} />
      )}
      <div className="inner-book__read--btn-wrapper">
        <button onClick={open} className="inner-book__read--btn">
          <div className="inner-book__read--icon">
            <ReadIcon />
          </div>
          <div className="inner-book__read--text">Read</div>
        </button>
        <button onClick={open} className="inner-book__read--btn">
          <div className="inner-book__read--icon">
            <MicIcon />
          </div>
          <div className="inner-book__read--text">Listen</div>
        </button>
      </div>
    </>
  );
}
