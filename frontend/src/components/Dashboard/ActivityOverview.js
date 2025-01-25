import React from "react";

const recentActivity = [
  { id: 1, activity: "Completed Lesson 2 in React Essentials", date: "Jan 20" },
  { id: 2, activity: "Enrolled in JavaScript for Beginners", date: "Jan 18" },
];

const ActivityOverview = () => {
  return (
    <div className="activity-overview-container">
      <ul>
        {recentActivity.map((item) => (
          <li key={item.id}>
            <p>{item.activity}</p>
            <small>{item.date}</small>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityOverview;
