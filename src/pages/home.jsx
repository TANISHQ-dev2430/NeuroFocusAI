import React from 'react'
import { useNavigate } from 'react-router-dom'
import puzzle from '../assets/puzzle.png'
import './home.css'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="arrow-icon">
      <path
        d="M8 16 16 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 8h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Home() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      <div className="landing-shell">
        <header className="header">
          <div className="logo">
            <img src={puzzle} alt="NeuroFocus logo" className="puzzle-logo" />
            <span>NeuroFocus</span>
          </div>
        </header>

        <main className="main-content">
          <h1 className="main-heading">
            Understand your
            <br />
            brain
            <br />
            before <strong>fatigue</strong>
            <br />
            <strong>begins</strong>
          </h1>

          <div className="cards-grid" aria-label="NeuroFocus actions">
            <button
              type="button"
              className="card card-blue"
              onClick={() => navigate('/upload?mode=calibrate')}
            >
              <span className="card-title">
                Start
                <br />
                Calibrating
              </span>
              <span className="icon-bubble" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>

            <button
              type="button"
              className="card card-yellow"
              onClick={() => navigate('/upload')}
            >
              <span className="card-title">
                Upload
                <br />
                CSV
              </span>
              <span className="icon-bubble" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>

            <button
              type="button"
              className="card card-green"
              onClick={() => navigate('/history')}
            >
              <span className="card-title">
                Your Previous
                <br />
                Data
              </span>
              <span className="icon-bubble" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>

            <button 
              type="button" 
              className="card card-beige"
              onClick={() => navigate('/about')}
            >
              <span className="card-title">
                About
                <br />
                This App
              </span>
              <span className="icon-bubble" aria-hidden="true">
                <ArrowIcon />
              </span>
            </button>
          </div>

          <p className="footer-text">
            We learn how your brain behaves before making personalized predictions.
          </p>
        </main>
      </div>
    </div>
  )
}

export default Home