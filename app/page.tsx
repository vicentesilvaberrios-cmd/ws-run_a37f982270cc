"use client";

import FlappyBirdGame from "./components/FlappyBirdGame";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--sp-4)",
        background:
          "linear-gradient(180deg, #4ec0ca 0%, #71c5cf 60%, #5ab5c0 100%)",
        overflow: "hidden",
      }}
    >
      <FlappyBirdGame />
    </main>
  );
}
