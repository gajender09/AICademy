import { useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa";

import logo from "../assests/images/tab-logo.png";
import "../styles/AIGenerationLoader.css";


/* Each top-level step has a label + a few "reasoning trace" lines
   that stream in underneath it, like an agent thinking out loud. */
const steps = [
    {
        label: "Understanding your learning goal",
        trace: [
            "Parsing topic and target skill level",
            "Identifying prerequisite knowledge",
            "Estimating scope and depth",
        ],
    },
    {
        label: "Designing a personalized roadmap",
        trace: [
            "Sequencing core concepts logically",
            "Balancing theory vs. hands-on practice",
            "Mapping roadmap to learner pace",
        ],
    },
    {
        label: "Creating course modules",
        trace: [
            "Drafting module titles and summaries",
            "Breaking modules into chapters",
            "Writing learning objectives",
        ],
    },
    {
        label: "Generating quizzes and resources",
        trace: [
            "Building assessment questions",
            "Linking reference materials",
            "Calibrating quiz difficulty",
        ],
    },
    {
        label: "Finalizing your AI course",
        trace: [
            "Validating module structure",
            "Optimizing for readability",
            "Saving course to your dashboard",
        ],
    },
];

const TRACE_INTERVAL = 700;   // ms between trace lines
const STEP_PAUSE = 450;       // ms pause after last trace line before next step

/* Angle (deg) for each constellation node around the logo.
   5 steps spread evenly around a circle, starting from the top. */
const NODE_ANGLES = steps.map((_, i) => (i / steps.length) * 360 - 90);


const AIGenerationLoader = ({ show }) => {

    const [stepIndex, setStepIndex] = useState(0);
    const [traceIndex, setTraceIndex] = useState(-1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [visibleTraces, setVisibleTraces] = useState({});

    const timerRef = useRef(null);

    useEffect(() => {

        if (!show) {
            setStepIndex(0);
            setTraceIndex(-1);
            setCompletedSteps([]);
            setVisibleTraces({});
            return;
        }

        let currentStep = 0;
        let currentTrace = -1;

        const tick = () => {

            const traces = steps[currentStep].trace;

            if (currentTrace < traces.length - 1) {

                currentTrace += 1;
                setTraceIndex(currentTrace);

                setVisibleTraces(prev => ({
                    ...prev,
                    [currentStep]: [
                        ...(prev[currentStep] || []),
                        traces[currentTrace],
                    ],
                }));

                timerRef.current = setTimeout(tick, TRACE_INTERVAL);

            } else if (currentStep < steps.length - 1) {

                setCompletedSteps(prev => [...prev, currentStep]);

                currentStep += 1;
                currentTrace = -1;
                setStepIndex(currentStep);
                setTraceIndex(-1);

                timerRef.current = setTimeout(tick, STEP_PAUSE);

            }
            /* on final step's final trace, just stop */

        };

        timerRef.current = setTimeout(tick, 400);

        return () => clearTimeout(timerRef.current);

    }, [show]);


    if (!show) return null;


    const progressPct = Math.min(
        100,
        ((completedSteps.length + (traceIndex + 1) / steps[stepIndex].trace.length) /
            steps.length) * 100
    );


    return (

        <div className="ai-generation-overlay">

            <div className="ai-mesh-bg">
                <span className="ai-mesh-blob ai-mesh-blob-1" />
                <span className="ai-mesh-blob ai-mesh-blob-2" />
                <span className="ai-mesh-blob ai-mesh-blob-3" />
                <span className="ai-grain" />
            </div>

            <div className="ai-generation-card">

                {/* ── Constellation stage ── */}
                <div className="ai-orb-stage">

                    {/* rotating conic halo */}
                    <span className="ai-halo" />
                    <span className="ai-orb-ring ai-orb-ring--1" />
                    <span className="ai-orb-ring ai-orb-ring--2" />

                    {/* connector lines + nodes for each step */}
                    <svg
                        className="ai-constellation"
                        viewBox="0 0 200 200"
                        aria-hidden="true"
                    >
                        {steps.map((_, i) => {

                            const angle = (NODE_ANGLES[i] * Math.PI) / 180;
                            const r = 78;
                            const x = 100 + r * Math.cos(angle);
                            const y = 100 + r * Math.sin(angle);

                            const isDone = completedSteps.includes(i);
                            const isActive = i === stepIndex && !isDone;
                            const isReached = isDone || isActive;

                            return (
                                <g key={i}>
                                    <line
                                        x1="100"
                                        y1="100"
                                        x2={x}
                                        y2={y}
                                        className={
                                            `ai-link ${isReached ? "lit" : ""}`
                                        }
                                    />
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isActive ? 6 : 4.5}
                                        className={
                                            `ai-node
                                            ${isDone ? "done" : ""}
                                            ${isActive ? "active" : ""}`
                                        }
                                    />
                                </g>
                            );

                        })}
                    </svg>

                    <div className="ai-orb-core">
                        <img
                            src={logo}
                            alt="AICademy"
                            className="ai-orb-logo"
                        />
                    </div>

                </div>

                <h2 className="ai-brand-name">AICademy</h2>
                <p className="ai-brand-tag">Crafting your course with AI</p>

                {/* ── live reasoning feed ── */}
                <div className="ai-feed">

                    {steps.map((step, sIdx) => {

                        const isDone = completedSteps.includes(sIdx);
                        const isActive = sIdx === stepIndex && !isDone;
                        const isPending = sIdx > stepIndex;

                        if (isPending) return null;

                        const traces = visibleTraces[sIdx] || [];

                        return (

                            <div
                                key={step.label}
                                className={
                                    `ai-feed-step
                                    ${isDone ? "done" : ""}
                                    ${isActive ? "active" : ""}`
                                }
                            >

                                <div className="ai-feed-step-head">

                                    <span className="ai-feed-icon">
                                        {isDone ? (
                                            <FaCheck />
                                        ) : (
                                            <span className="ai-feed-spinner" />
                                        )}
                                    </span>

                                    <span className="ai-feed-label">
                                        {step.label}
                                    </span>

                                </div>

                                <div
                                    className="ai-feed-trace"
                                    style={{
                                        maxHeight: isActive
                                            ? `${traces.length * 26 + 8}px`
                                            : "0px",
                                    }}
                                >

                                    {traces.map((line, i) => (

                                        <div
                                            key={line}
                                            className="ai-trace-line"
                                            style={{
                                                transitionDelay: `${i * 0.05}s`,
                                            }}
                                        >
                                            <span className="ai-trace-dot" />
                                            {line}
                                        </div>

                                    ))}

                                </div>

                            </div>

                        );

                    })}

                </div>

                {/* ── progress bar ── */}
                <div className="ai-progress-track">
                    <div
                        className="ai-progress-fill"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                <p className="ai-hint">
                    This usually takes 20–30 seconds — hang tight
                </p>

            </div>

        </div>

    );

};

export default AIGenerationLoader;