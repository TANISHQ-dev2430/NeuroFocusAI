import React from 'react'
import { useNavigate } from 'react-router-dom'
import './about.css'

function About() {
  const navigate = useNavigate()

  return (
    <div className="about-container">
      <div className="about-shell">
        <header className="about-header">
          <button className="back-button" onClick={() => navigate('/')} aria-label="Go back">
            <svg viewBox="0 0 24 24" className="back-arrow-icon">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </header>

        <main className="about-content">
          <h1 className="about-title">About NeuroFocus</h1>

          <div className="about-section">
            <h2>What is NeuroFocus?</h2>
            <p>
              NeuroFocus is an innovative application designed to help you understand your brain's behavior before fatigue sets in. By analyzing your cognitive patterns, we provide personalized predictions to help you optimize your productivity and well-being.
            </p>
          </div>

          <div className="about-section">
            <h2>How It Works</h2>
            <p>
              Our app uses advanced analytics to track your brain activity and cognitive patterns. Start by calibrating your baseline, upload your historical data, or use your previous sessions to generate insights about your mental fatigue patterns.
            </p>
          </div>

          <div className="about-section">
            <h2>Key Features</h2>
            <ul className="features-list">
              <li><strong>Calibration:</strong> Set up your personal baseline with our guided calibration process</li>
              <li><strong>Data Analysis:</strong> Upload CSV files with your cognitive data for deep insights</li>
              <li><strong>Historical Tracking:</strong> Access your previous data and analysis results</li>
              <li><strong>Personalized Predictions:</strong> Get tailored recommendations based on your unique patterns</li>
            </ul>
          </div>

          <div className="about-section">
            <h2>Version</h2>
            <p>NeuroFocus v1.0.0</p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default About
