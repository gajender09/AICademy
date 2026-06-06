import { FaLock, FaTrophy } from "react-icons/fa";
import ChapterQuiz from "./ChapterQuiz";

const allModulesPassed = (course) =>
  course?.modules?.length > 0 && course.modules.every((module) => module.quizPassed);

const FinalQuizTab = ({ course, setCourse }) => {
  const unlocked = Boolean(course?.finalQuizUnlocked || allModulesPassed(course));

  if (!unlocked) {
    return (
      <div className="final-quiz-locked">
        <div className="final-quiz-lock-icon">
          <FaLock />
        </div>
        <h2>Final Assessment Locked</h2>
        <p>Complete every chapter quiz and module quiz to unlock the 50-question final assessment.</p>
      </div>
    );
  }

  return (
    <div className="final-quiz-panel">
      <div className="final-quiz-hero">
        <span><FaTrophy /> Final Assessment</span>
        <h2>Course Mastery Quiz</h2>
        <p>
          A 50-question assessment across the full course. Submit once you are ready,
          then review correct answers and explanations.
        </p>
      </div>

      <ChapterQuiz
        courseId={course._id}
        moduleIndex={null}
        chapterIndex={null}
        chapterContent=""
        initialQuiz={course.finalQuiz}
        quizPassed={course.finalQuizPassed}
        onQuizSubmitted={(res) => {
          if (res?.course) setCourse(res.course);
        }}
        scope="final"
        title="Final Course Assessment"
        description="Answer all 50 questions to complete your final course assessment."
        expectedCount={50}
      />
    </div>
  );
};

export default FinalQuizTab;
