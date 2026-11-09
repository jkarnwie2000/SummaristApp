"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Book } from "@/lib/types";

export default function PlayerPage() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fontSize, setFontSize] = useState(16);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const skipAudio = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, duration || audio.duration),
    );

    setCurrentTime(audio.currentTime);
  };

  const handleProgressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Number(event.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const params = useParams();
  const bookId = params.id;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      setBook(null);

      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      const res = await fetch(
        `https://us-central1-summaristt.cloudfunctions.net/getBook?id=${bookId}`,
      );

      const data = await res.json();

      setBook(data);
      setLoading(false);
    }

    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  if (loading || !book) {
    return <PlayerSkeleton />;
  }

  const summaryParagraphs = (book.summary || "")
    .split(/\n+/)
    .filter((paragraph: string) => paragraph.trim() !== "");

  return (
    <div className="summary">
      <div className="audio__book--summary" style={{ fontSize: "16px" }}>
        <div className="audio__book--summary-title">
          <b>{book.title}</b>
        </div>
        <div
          className="audio__book--summary-text"
          style={{ fontSize: `${fontSize}px` }}
        >
          {summaryParagraphs.map((paragraph: string, index: number) => (
            <p key={index} className="audio__book--summary-paragraph">
              {paragraph.trim()}
            </p>
          ))}
        </div>
        <div className="audio__wrapper">
          <audio
            key={String(bookId)}
            ref={audioRef}
            src={book.audioLink}
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration);
              }
            }}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
              }
            }}
            onEnded={() => setIsPlaying(false)}
          />
          <div className="audio__track--wrapper">
            <figure className="audio__track--image-mask"></figure>
            <figure
              className="book__image--wrapper"
              style={{ height: "48px", width: "48px", minWidth: "48px" }}
            >
              <img
                className="book__image"
                src={book.imageLink}
                alt={book.title}
              />
            </figure>
            <div className="audio__track--details-wrapper">
              <div className="audio__track--title">{book.title}</div>
              <div className="audio__track--author">{book.author}</div>
            </div>
          </div>
          <div className="audio__controls--wrapper">
            <div className="audio__controls">
              <button
                className="audio__controls--btn"
                onClick={() => skipAudio(-10)}
              >
                ↺10
              </button>
              <button
                className="audio__controls--btn audio__controls--btn-play"
                onClick={toggleAudio}
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>
              <button
                className="audio__controls--btn"
                onClick={() => skipAudio(10)}
              >
                10↻
              </button>
            </div>
          </div>
          <div className="audio__progress--wrapper">
            <div className="audio__time">{formatTime(currentTime)}</div>

            <input
              type="range"
              className="audio__progress--bar"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleProgressChange}
            />

            <div className="audio__time">{formatTime(duration)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlayerSkeleton() {
  return (
    <div className="summary">
      <div className="audio__book--summary">
        <div className="skeleton skeleton-title"></div>

        <div className="audio__book--summary-text">
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line short"></div>

          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line"></div>
          <div className="skeleton skeleton-line medium"></div>
        </div>

        <div className="audio__wrapper">
          <div className="audio__track--wrapper">
            <div className="skeleton skeleton-image"></div>

            <div className="audio__track--details-wrapper">
              <div className="skeleton skeleton-track-title"></div>
              <div className="skeleton skeleton-track-author"></div>
            </div>
          </div>

          <div className="audio__controls--wrapper">
            <div className="audio__controls">
              <div className="skeleton skeleton-btn"></div>
              <div className="skeleton skeleton-play-btn"></div>
              <div className="skeleton skeleton-btn"></div>
            </div>
          </div>

          <div className="audio__progress--wrapper">
            <div className="skeleton skeleton-time"></div>
            <div className="skeleton skeleton-progress"></div>
            <div className="skeleton skeleton-time"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
