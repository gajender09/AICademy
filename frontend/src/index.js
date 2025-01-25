// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './styles/global.css';  // Make sure global CSS is imported
import './styles/Dashboard.css'; 
import { BrowserRouter as Router } from 'react-router-dom';

import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
