// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.css';
import './styles/Dashboard.css';
import './styles/Courses.css';
import './styles/CourseDetail.css';

import { BrowserRouter as Router } from 'react-router-dom';


import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
