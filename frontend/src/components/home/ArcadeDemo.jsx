// src/components/home/ArcadeDemo.jsx

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaExpand } from "react-icons/fa";
import "../../styles/ArcadeDemo.css";

export default function ArcadeDemo() {
  const videoRef   = useRef(null);
  const wrapperRef = useRef(null);
  const sceneRef   = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted,   setIsMuted]   = useState(true);

  const VERCEL_BLOB_URL = "https://jrvmqzky4mctqtf4.public.blob.vercel-storage.com/videos/aicademy-demo.mp4";

  // Spring-damped mouse tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-9, 9]);
  const fadeO   = useTransform(springY, [-0.5, 0.5], [1, 0.35]);

  const handleMouseMove = (e) => {
    const r = sceneRef.current?.getBoundingClientRect();
    if (!r) return;
    mouseX.set((e.clientX - r.left) / r.width  - 0.5);
    mouseY.set((e.clientY - r.top)  / r.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  // Scroll-reveal + scan-line trigger via IntersectionObserver
  useEffect(() => {
    const scene   = sceneRef.current;
    const wrapper = wrapperRef.current;
    if (!scene || !wrapper) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scene.classList.add("is-revealed");
          // small delay so reveal animation plays first
          setTimeout(() => wrapper.classList.add("is-scanned"), 600);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(scene);
    return () => obs.disconnect();
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    videoRef.current.paused
      ? videoRef.current.play()
      : videoRef.current.pause();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <section className="hp-demo-section" id="product-demo">
      <div className="hp-demo-container">

        {/* ── Header ── */}
        <motion.div
          className="hp-demo-header"
          initial={{ opacity: 0, y: -14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="hp-demo-label">Product Demo</span>
          <h2>
            See <em>AICademy</em> in action.
          </h2>
          <p>
            From blank page to full AI-generated course in under 60 seconds.
          </p>
        </motion.div>

        {/* ── Scene ── */}
        <div
          className="hp-demo-scene"
          ref={sceneRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            ref={wrapperRef}
            className="hp-demo-video-wrapper"
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Scan-line */}
            <div className="hp-demo-scan" />

            {/* Top fade — opacity driven by tilt */}
            <motion.div
              className="hp-demo-video-wrapper-fade"
              style={{ opacity: fadeO }}
            />

            {/* macOS title bar */}
            <div className="hp-demo-bar">
              <div className="hp-demo-dots">
                <span className="hp-demo-dot hp-demo-dot--r" />
                <span className="hp-demo-dot hp-demo-dot--y" />
                <span className="hp-demo-dot hp-demo-dot--g" />
              </div>
              <span className="hp-demo-bar-title">
                aicademy.app — Course Builder
              </span>
            </div>

            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="hp-demo-video"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              {/* Uses the high-performance hosted URL directly */}
              <source src={VERCEL_BLOB_URL} type="video/mp4" />
            </video>

            {/* Controls */}
            <div className="hp-demo-controls">
              <button
                className="hp-demo-control-btn hp-demo-control-btn--play"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
              </button>
              <button
                className="hp-demo-control-btn"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted
                  ? <FaVolumeMute size={12} />
                  : <FaVolumeUp size={12} />}
              </button>
              <button
                className="hp-demo-control-btn"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
              >
                <FaExpand size={11} />
              </button>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}
