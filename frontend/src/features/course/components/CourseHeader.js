import "../styles/CourseDetailsPage.css";

const CourseHeader = ({
  title,
  progress,
  enrolled,
  onEnroll,
  loading,
  modules = [],
}) => {
  const totalModules = modules.length;
  const totalChapters = modules.reduce(
    (sum, module) => sum + (module.chapters?.length || 0),
    0
  );

  return (
    <section className="course-header-card">
      <div className="course-header-top">
        <div>
          <span className="course-badge">AI Generated Course</span>
          <h1 className="course-title">{title}</h1>
          <p className="course-subtitle">
            Continue learning with AI-generated modules, interactive chapters and in-course quizzes.
          </p>
        </div>
      </div>

      <div className="course-info-row">
        <span className="course-info-pill">{totalModules} Modules</span>
        <span className="course-info-pill">{totalChapters} Chapters</span>
      </div>

      {enrolled && (
        <div className="course-progress-summary">
          <span>{progress || 0}% complete</span>
          <div className="progress-bar course-header-progress">
            <div
              className="progress-fill"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default CourseHeader;