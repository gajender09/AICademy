import { useCallback, useEffect, useMemo, useState } from "react";
import {
  explainQuizAnswer,
  generateQuiz,
  submitQuiz,
} from "../services/courseApi";

const PASS_RATIO = 0.6;
const QUIZ_COUNT = 10;

const ChapterQuiz = ({
  courseId,
  moduleIndex,
  chapterIndex,
  chapterContent,
  initialQuiz = [],
  quizPassed,
  onQuizPassed,
  onQuizSubmitted,
  scope = "chapter",
  title = "Chapter Quiz",
  description,
  expectedCount = QUIZ_COUNT,
}) => {
  const key = `${scope}-${moduleIndex}-${chapterIndex ?? "module"}`;

  const [quiz, setQuiz] = useState(
    Array.isArray(initialQuiz) && initialQuiz.length ? initialQuiz : null
  );
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passed, setPassed] = useState(Boolean(quizPassed));
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [explanations, setExplanations] = useState({});
  const [explainLoading, setExplainLoading] = useState({});

  useEffect(() => {
    if (Array.isArray(initialQuiz) && initialQuiz.length) {
      setQuiz(initialQuiz);
    }
  }, [initialQuiz]);

  useEffect(() => {
    setPassed(Boolean(quizPassed));
  }, [quizPassed]);

  const answeredCount = useMemo(() => {
    if (!quiz) return 0;
    return quiz.filter((_, i) => answers[`${key}-${i}`]).length;
  }, [quiz, answers, key]);

  const allAnswered = quiz && answeredCount === quiz.length;
  const passThreshold = quiz ? Math.ceil(quiz.length * PASS_RATIO) : 6;

  const resetAttemptState = () => {
    setSubmitted(false);
    setScore(null);
    setAnswers({});
    setExplanations({});
    setExplainLoading({});
    setValidationError("");
  };

  const handleGenerate = async () => {
    setError("");
    setGenerating(true);
    resetAttemptState();

    try {
      const res = await generateQuiz({
        courseId,
        moduleIndex,
        chapterIndex,
        chapterContent: chapterContent || "",
        scope,
      });

      if (!res.quiz?.length) {
        throw new Error("No quiz questions returned");
      }

      setQuiz(res.quiz);
      onQuizSubmitted?.(res);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate quiz. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (qIndex, option) => {
    if (submitted) return;
    setValidationError("");
    setAnswers((prev) => ({
      ...prev,
      [`${key}-${qIndex}`]: option,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    const unanswered = quiz.findIndex((_, i) => !answers[`${key}-${i}`]);
    if (unanswered !== -1) {
      setValidationError(
        `Please answer all ${quiz.length} questions before submitting. (${answeredCount}/${quiz.length} done)`
      );
      const el = document.getElementById(`quiz-q-${key}-${unanswered}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setValidationError("");
    setSubmitting(true);

    try {
      const res = await submitQuiz({
        courseId,
        moduleIndex,
        chapterIndex,
        scope,
        answers: quiz.map((_, i) => answers[`${key}-${i}`]),
      });

      setScore(res.correctAnswers);
      setSubmitted(true);
      setPassed(res.passed);
      onQuizPassed?.(res.passed);
      onQuizSubmitted?.(res);
    } catch (err) {
      console.error(err);
      setValidationError(
        err.response?.data?.message ||
          "Could not save your quiz attempt. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    resetAttemptState();
  };

  const handleExplain = useCallback(
    async (qIndex) => {
      const q = quiz[qIndex];
      const selected = answers[`${key}-${qIndex}`];
      if (!q || selected === q.answer) return;

      const explainKey = `${key}-${qIndex}`;
      if (explanations[explainKey]) return;

      setExplainLoading((prev) => ({ ...prev, [explainKey]: true }));

      try {
        const res = await explainQuizAnswer({
          courseId,
          moduleIndex,
          chapterIndex,
          chapterContent: chapterContent || "",
          question: q.question,
          options: q.options,
          correctAnswer: q.answer,
          selectedAnswer: selected,
        });

        setExplanations((prev) => ({
          ...prev,
          [explainKey]: res.explanation,
        }));
      } catch (err) {
        console.error(err);
        setExplanations((prev) => ({
          ...prev,
          [explainKey]:
            err.response?.data?.message ||
            "Could not load explanation. Try again.",
        }));
      } finally {
        setExplainLoading((prev) => ({ ...prev, [explainKey]: false }));
      }
    },
    [
      quiz,
      answers,
      key,
      explanations,
      courseId,
      moduleIndex,
      chapterIndex,
      chapterContent,
    ]
  );

  if (!quiz) {
    return (
      <div className="quiz-section">
        <div className="quiz-section-header">
          <h5 className="quiz-section-title">{title}</h5>
          <span className="quiz-section-meta">{expectedCount} MCQs - 60% to pass</span>
        </div>
        <p className="quiz-section-desc">
          {description ||
            `Test your understanding with ${expectedCount} multiple-choice questions.`}
        </p>
        {error && <p className="quiz-error">{error}</p>}
        <button
          type="button"
          className="quiz-btn"
          onClick={handleGenerate}
          disabled={generating || !courseId}
        >
          {generating ? "Generating quiz..." : "Generate Quiz"}
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-section">
      <div className="quiz-section-header">
        <h5 className="quiz-section-title">{title}</h5>
        <span className="quiz-progress-pill">
          {submitted
            ? `Score ${score}/${quiz.length}`
            : `${answeredCount}/${quiz.length} answered`}
        </span>
      </div>

      {!submitted && (
        <div className="quiz-progress-bar" aria-hidden="true">
          <div
            className="quiz-progress-fill"
            style={{ width: `${(answeredCount / quiz.length) * 100}%` }}
          />
        </div>
      )}

      {validationError && (
        <p className="quiz-validation-error" role="alert">
          {validationError}
        </p>
      )}

      <div className="quiz-questions">
        {quiz.map((q, i) => {
          const answerKey = `${key}-${i}`;
          const selected = answers[answerKey];
          const isCorrect = submitted && selected === q.answer;
          const isWrong = submitted && selected && selected !== q.answer;
          const explanation = explanations[answerKey];
          const loadingExplain = explainLoading[answerKey];

          return (
            <article
              key={i}
              id={`quiz-q-${key}-${i}`}
              className={`quiz-question-card ${
                submitted
                  ? isCorrect
                    ? "quiz-question--correct"
                    : isWrong
                      ? "quiz-question--wrong"
                      : "quiz-question--unanswered"
                  : ""
              }`}
            >
              <div className="quiz-question-head">
                <span className="quiz-question-num">Q{i + 1}</span>
                {submitted && (
                  <span
                    className={`quiz-result-badge ${
                      isCorrect ? "quiz-result-badge--pass" : "quiz-result-badge--fail"
                    }`}
                  >
                    {isCorrect ? "Correct" : isWrong ? "Incorrect" : "Skipped"}
                  </span>
                )}
              </div>
              <p className="quiz-question-text">{q.question}</p>

              <div className="quiz-options" role="radiogroup" aria-label={`Question ${i + 1}`}>
                {q.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selected === opt;
                  const showCorrect = submitted && opt === q.answer;
                  const showWrong = submitted && isSelected && opt !== q.answer;

                  return (
                    <label
                      key={idx}
                      className={`quiz-option ${
                        isSelected ? "quiz-option--selected" : ""
                      } ${showCorrect ? "quiz-option--correct" : ""} ${
                        showWrong ? "quiz-option--wrong" : ""
                      } ${submitted ? "quiz-option--locked" : ""}`}
                    >
                      <input
                        type="radio"
                        name={answerKey}
                        value={opt}
                        checked={isSelected}
                        disabled={submitted}
                        onChange={() => handleSelect(i, opt)}
                      />
                      <span className="quiz-option-letter">{letter}</span>
                      <span className="quiz-option-text">{opt}</span>
                    </label>
                  );
                })}
              </div>

              {isWrong && (
                <div className="quiz-explain-block">
                  {!explanation && (
                    <button
                      type="button"
                      className="quiz-explain-btn"
                      onClick={() => handleExplain(i)}
                      disabled={loadingExplain}
                    >
                      {loadingExplain ? "Explaining..." : "Explain why"}
                    </button>
                  )}
                  {explanation && (
                    <div className="quiz-explanation">
                      <strong>Explanation</strong>
                      <p>{explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {submitted && (
                <p className="quiz-correct-hint">Correct answer: {q.answer}</p>
              )}
            </article>
          );
        })}
      </div>

      <div className="quiz-footer">
        {!submitted ? (
          <button
            type="button"
            className="quiz-submit-btn"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            title={
              allAnswered
                ? "Submit your answers"
                : `Answer all ${quiz.length} questions first`
            }
          >
            {submitting ? "Saving..." : "Submit Quiz"}
          </button>
        ) : (
          <div className="quiz-results-panel">
            <div
              className={`quiz-results-banner ${
                passed ? "quiz-results-banner--pass" : "quiz-results-banner--fail"
              }`}
            >
              <p className="quiz-results-score">
                {score} / {quiz.length} correct
              </p>
              <p className="quiz-results-status">
                {passed
                  ? scope === "module"
                    ? "Passed - the next module is unlocked."
                    : "Passed - you can continue to the next chapter."
                  : `Need at least ${passThreshold} correct to pass. Review and try again.`}
              </p>
            </div>
            <button
              type="button"
              className="quiz-retake-btn"
              onClick={handleRetake}
            >
              Retake Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChapterQuiz;
