"use client";
import { useState, useSyncExternalStore } from "react";
import { audioEngine } from "@/lib/audio";
export function SoundControl() {
  const sound = useSyncExternalStore(
    audioEngine.subscribe,
    audioEngine.getSnapshot,
    () => false,
  );
  const [hint, setHint] = useState("");
  return (
    <>
      <button
        className="sound"
        aria-pressed={sound}
        onClick={async () => {
          const enabled = await audioEngine.toggle();
          setHint(
            !enabled && !sound ? "Áudio indisponível ou desativado." : "",
          );
        }}
      >
        {sound ? "SOM ON" : "SOM OFF"}{" "}
        <span aria-hidden="true">{sound ? "▂▄▆" : "▂▂▂"}</span>
      </button>
      <span className="sr-only" role="status">
        {hint}
      </span>
    </>
  );
}
