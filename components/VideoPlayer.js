"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (!src) return;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
    } else {
      videoRef.current.src = src;
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full rounded-lg shadow"
      autoPlay={false}
    />
  );
}
