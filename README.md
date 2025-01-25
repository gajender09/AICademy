# AICademy - *AI-Powered Personalized Learning Platform*

A modern and interactive platform designed to deliver personalized learning paths tailored to students' skills and preferences, powered by AI.

---

## System Design

                        +------------------------+
                        |   User Interface       |
                        | (React Frontend)       |
                        +------------------------+
                            |           |
                Register/Login     Explore Courses
                            |           |
                            v           v
                 +-----------------------------+
                 |    API Gateway / Backend    |
                 | (Node.js + Express.js)      |
                 +-----------------------------+
                            |           |
                Authenticate     Fetch Data (e.g., Courses)
                            |           |
                            v           v
               +-----------------------------+
               |         Database            |
               | (MongoDB/PostgreSQL)        |
               +-----------------------------+
                            |           |
                  Store User Data  Retrieve Recommendations
                            |
                            v
           +----------------------------------------+
           |     Recommendation Engine (Optional)   |
           | (Rule-based or Machine Learning Model) |
           +----------------------------------------+
                            |
                    Generate Course Suggestions
                            |
                            v
            +------------------------------+
            | Personalized Data for Users |
            +------------------------------+


## 🚀 Features

- **Student Dashboard**: Access personalized course recommendations, recent activity, and progress tracking.
- **Interactive Courses**: Engage with interactive content, quizzes, and expert-led lessons.
- **AI-Powered Recommendations**: AI-driven algorithms suggest courses and learning paths based on individual preferences.
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices.

---

# 🛠️ Tech Stack

## Frontend
- **React**: Component-based UI library.
- **React Router**: For navigation and routing.
- **CSS (or SCSS)**: Styling.
- **Context API**: For global state management.

## Backend 
- **Node.js**: Backend runtime.
- **Express.js**: Web framework.
- **MongoDB**: Database for user data and course content.

---

## 📦 Step by Step Installation

```bash
git clone https://github.com/gajender09/AICademy.git

npm install

npm install react-router-dom

cd frontend

npm install

npm start
