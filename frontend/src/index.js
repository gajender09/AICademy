// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from './context/ThemeContext';
import './styles/theme.css';
import './styles/global.css';
import './styles/StudentDashboard.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import App from './App';

const storedTheme = localStorage.getItem('theme');
document.documentElement.setAttribute(
  'data-theme',
  storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light'
);

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
