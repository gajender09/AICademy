// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowRight, FaBrain, FaCode, FaRoad, FaBookOpen,
  FaChartLine, FaRobot, FaCheckCircle, FaStar,
  FaPlayCircle, FaLightbulb, FaLayerGroup, FaUsers,
} from "react-icons/fa";

import ArcadeDemo from "../components/home/ArcadeDemo";
import "../styles/HomePage.css";

/* ─── Animated course generator demo ─── */
const COURSES = [
  {
    query: "Machine Learning with Python",
    color: "#2d6a4f",
    modules: [
      { title: "Python Foundations", chapters: ["NumPy & Pandas", "Data Wrangling", "Matplotlib"], quizzes: 3 },
      { title: "Core ML Algorithms", chapters: ["Linear Regression", "Decision Trees", "SVM"], quizzes: 4 },
      { title: "Neural Networks", chapters: ["Perceptrons", "Backprop", "CNNs"], quizzes: 3 },
      { title: "Model Deployment", chapters: ["Flask APIs", "Docker", "Cloud Deploy"], quizzes: 2 },
    ],
  },
  {
    query: "Full Stack Web Development",
    color: "#7b4f2e",
    modules: [
      { title: "HTML & CSS Mastery", chapters: ["Flexbox", "Grid", "Animations"], quizzes: 2 },
      { title: "JavaScript ES6+", chapters: ["Async/Await", "Closures", "Modules"], quizzes: 4 },
      { title: "React & Node.js", chapters: ["Hooks", "Context API", "REST APIs"], quizzes: 4 },
      { title: "Databases & Auth", chapters: ["MongoDB", "JWT Auth", "Deployment"], quizzes: 3 },
    ],
  },
  {
    query: "UI/UX Design Fundamentals",
    color: "#4a3f8f",
    modules: [
      { title: "Design Thinking", chapters: ["User Research", "Personas", "Journey Maps"], quizzes: 2 },
      { title: "Visual Design", chapters: ["Typography", "Color Theory", "Grids"], quizzes: 3 },
      { title: "Prototyping", chapters: ["Figma Basics", "Wireframing", "Interactions"], quizzes: 3 },
      { title: "Usability Testing", chapters: ["A/B Testing", "Heatmaps", "Iteration"], quizzes: 2 },
    ],
  },
];

const CourseGenDemo = () => {
  const [courseIdx, setCourseIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState("typing"); // typing | generating | showing | clearing
  const [visibleModules, setVisibleModules] = useState([]);
  const [visibleChapters, setVisibleChapters] = useState({}); // moduleIdx -> count
  const timerRef = useRef(null);

  const current = COURSES[courseIdx];

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sleep = (ms) => new Promise(r => { timerRef.current = setTimeout(r, ms); });

      // 1. Type the query
      setPhase("typing");
      setTyped("");
      setVisibleModules([]);
      setVisibleChapters({});

      for (let i = 0; i <= current.query.length; i++) {
        if (cancelled) return;
        setTyped(current.query.slice(0, i));
        await sleep(55);
      }

      await sleep(500);
      if (cancelled) return;
      setPhase("generating");

      await sleep(900);
      if (cancelled) return;
      setPhase("showing");

      // 2. Reveal modules one by one
      for (let m = 0; m < current.modules.length; m++) {
        if (cancelled) return;
        setVisibleModules(prev => [...prev, m]);
        await sleep(320);

        // 3. Reveal chapters inside this module
        const mod = current.modules[m];
        for (let c = 0; c <= mod.chapters.length; c++) {
          if (cancelled) return;
          setVisibleChapters(prev => ({ ...prev, [m]: c }));
          await sleep(180);
        }
      }

      // 4. Hold, then clear and cycle
      await sleep(3200);
      if (cancelled) return;
      setPhase("clearing");
      await sleep(600);
      if (cancelled) return;
      setCourseIdx(i => (i + 1) % COURSES.length);
    };

    run();

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [courseIdx]);

  const mod = current.modules;

  return (
    <div className="demo-shell">
      {/* top bar */}
      <div className="demo-bar">
        <div className="demo-dots">
          <span className="d-r" /><span className="d-y" /><span className="d-g" />
        </div>
        <span className="demo-bar-title">AICademy — Course Generator</span>
      </div>

      {/* input area */}
      <div className="demo-input-wrap">
        <div className="demo-input-label">What do you want to learn?</div>
        <div className="demo-input-row">
          <div className="demo-input-box">
            <span className="demo-typed">{typed}</span>
            {phase === "typing" && <span className="demo-cursor" />}
          </div>
          <div className={`demo-gen-btn ${phase === "generating" ? "loading" : ""}`}>
            {phase === "generating" ? <span className="demo-spinner" /> : <FaLightbulb />}
            {phase === "generating" ? "Generating…" : "Generate"}
          </div>
        </div>
      </div>

      {/* output area */}
      <div className={`demo-output ${phase === "clearing" ? "fading" : ""}`}>
        {phase === "generating" && (
          <div className="demo-scanning">
            <div className="scan-bar" />
            <span>AI is building your roadmap…</span>
          </div>
        )}

        {(phase === "showing" || phase === "clearing") && (
          <div className="demo-modules">
            <div className="demo-course-title">
              <FaLayerGroup />
              <span>{current.query}</span>
              <span className="demo-badge">{mod.length} Modules · {mod.reduce((a, m) => a + m.chapters.length, 0)} Chapters</span>
            </div>

            {mod.map((m, mi) => (
              visibleModules.includes(mi) && (
                <motion.div
                  key={mi}
                  className="demo-module"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="demo-mod-header">
                    <span className="demo-mod-num">M{mi + 1}</span>
                    <span className="demo-mod-title">{m.title}</span>
                    <span className="demo-quiz-tag">
                      {m.quizzes} quiz{m.quizzes > 1 ? "zes" : ""}
                    </span>
                  </div>
                  <div className="demo-chapters">
                    {m.chapters.slice(0, visibleChapters[mi] || 0).map((ch, ci) => (
                      <motion.div
                        key={ci}
                        className="demo-chapter"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FaCheckCircle className="demo-ch-icon" />
                        {ch}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const features = [
  { icon: <FaBrain />, title: "AI Learning Paths", desc: "Personalized roadmaps built around your goals, skill level, and time." },
  { icon: <FaCode />, title: "Hands-on Projects", desc: "Build real-world things. Every module ends with something you can ship." },
  { icon: <FaRoad />, title: "Structured Roadmaps", desc: "Never wonder what to learn next. Every step is sequenced and purposeful." },
  { icon: <FaBookOpen />, title: "Smart Notes", desc: "AI generates clean, concise notes for every topic — automatically." },
  { icon: <FaChartLine />, title: "Progress Tracking", desc: "Streaks, scores, milestones. See exactly how far you've come." },
  { icon: <FaRobot />, title: "AI Tutor, 24/7", desc: "Ask anything, anytime. Get instant explanations and hints." },
];

const steps = [
  { n: "01", title: "Tell us your goal", desc: "Type what you want to learn — a skill, a career, a project." },
  { n: "02", title: "Get your roadmap", desc: "AI builds a full course with modules, chapters, and quizzes." },
  { n: "03", title: "Learn & build", desc: "Study interactively and ship real projects as you go." },
  { n: "04", title: "Track & level up", desc: "Your dashboard shows streaks, scores, and skill growth." },
];

const testimonials = [
  { name: "Aakash S.", role: "Frontend Dev @ Razorpay", quote: "Went from zero to hired in 4 months. The roadmaps cut through all the noise.", av: "AS" },
  { name: "Priya M.", role: "CS Student, IIT Delhi", quote: "The AI notes are the best part — plain English, no jargon, always accurate.", av: "PM" },
  { name: "Rohan V.", role: "Fullstack Engineer", quote: "Nothing else adapts the way AICademy does. It feels like a tutor who knows me.", av: "RV" },
];

const stats = [
  { n: "10K+", l: "Learners" },
  { n: "500+", l: "Courses" },
  { n: "50+", l: "Roadmaps" },
  { n: "24/7", l: "AI Help" },
];

const fu = (d = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: d },
});

export default function HomePage() {
  const isLoggedIn = !!localStorage.getItem("user");

  const scrollToDemo = () => {
    const section = document.getElementById("product-demo");

    if (!section) return;

    window.scrollTo({
      top: section.offsetTop - 80,
      behavior: "smooth",
    });
  };

  return (
    <div className="hp">

      {/* ══ HERO ══ */}
      <section className="hp-hero">
        <div className="hp-hero__noise" />
        <div className="hp-hero__inner">

          <motion.div className="hp-hero__copy" {...fu(0)}>
            <div className="hp-chip">✦ AI-Powered Learning</div>
            <h1 className="hp-h1">
              Learn anything.<br />
              <em>Reimagined by YOU,<br />Supercharged by <br /> AICademy.</em>
            </h1>
            <p className="hp-sub">
              Type a topic. AICademy instantly builds a full course —
              modules, chapters, quizzes, notes — tailored exactly to your level.
            </p>
            <div className="hp-hero__btns">
              <Link to={isLoggedIn ? "/dashboard" : "/register"} className="hp-btn hp-btn--cta">
                {isLoggedIn ? "Open Dashboard" : "Start for free"} <FaArrowRight />
              </Link>
              <button
                type="button"
                className="hp-btn hp-btn--ghost"
                onClick={scrollToDemo}
              >
                <FaPlayCircle />
                Watch Demo
              </button>
            </div>
            <p className="hp-fine">No credit card · Free plan forever</p>
          </motion.div>

          <motion.div
            className="hp-hero__demo"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          >
            <CourseGenDemo />
          </motion.div>

        </div>
      </section>

      {/* ══ TRUST ══ */}
      <section className="hp-trust">
        <p className="hp-trust__label">Learners now working at</p>
        <div className="hp-trust__row">
          {["Google", "Amazon", "Razorpay", "Infosys", "Swiggy", "Zerodha", "Wipro", "PhonePe"].map(c => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section className="hp-stats">
        {stats.map((s, i) => (
          <motion.div className="hp-stat" key={i} {...fu(i * 0.08)}>
            <strong>{s.n}</strong>
            <span>{s.l}</span>
          </motion.div>
        ))}
      </section>

      {/* ══ PRODUCT DEMO ══ */}
      <ArcadeDemo />

      {/* ══ FEATURES ══ */}
      <section className="hp-feats">
        <motion.div className="hp-section-head" {...fu()}>
          <div className="hp-section-tag">Platform</div>
          <h2>Everything wired together.</h2>
          <p>Six tools, one coherent system. No jumping between apps.</p>
        </motion.div>
        <div className="hp-feats__grid">
          {features.map((f, i) => (
            <motion.div className="hp-feat" key={i} {...fu(i * 0.07)} whileHover={{ y: -4 }}>
              <div className="hp-feat__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="hp-how">
        <motion.div className="hp-section-head" {...fu()}>
          <div className="hp-section-tag">Process</div>
          <h2>From idea to expertise.</h2>
        </motion.div>
        <div className="hp-how__grid">
          {steps.map((s, i) => (
            <motion.div className="hp-step" key={i} {...fu(i * 0.09)}>
              <span className="hp-step__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="hp-testi">
        <motion.div className="hp-section-head" {...fu()}>
          <div className="hp-section-tag">Learners</div>
          <h2>They built real careers.</h2>
        </motion.div>
        <div className="hp-testi__grid">
          {testimonials.map((t, i) => (
            <motion.div className="hp-tcard" key={i} {...fu(i * 0.1)}>
              <div className="hp-tcard__stars">{"★".repeat(5)}</div>
              <p className="hp-tcard__q">"{t.quote}"</p>
              <div className="hp-tcard__foot">
                <div className="hp-tcard__av">{t.av}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      {!isLoggedIn && (
        <section className="hp-cta">
          <motion.div className="hp-cta__inner" {...fu()}>
            <div className="hp-cta__tag">Get started</div>
            <h2>Your roadmap is<br />one prompt away.</h2>
            <p>Join 10,000+ learners who already use AICademy to level up.</p>
            <Link to="/register" className="hp-btn hp-btn--cta hp-btn--cta-lg">
              Create free account <FaArrowRight />
            </Link>
            <p className="hp-fine" style={{ marginTop: 18 }}>Free plan forever · No card needed</p>
          </motion.div>
        </section>
      )}

    </div>
  );
}