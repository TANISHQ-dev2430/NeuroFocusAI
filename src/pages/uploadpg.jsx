import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import puzzle from '../assets/puzzle.png'
import './uploadpg.css'

function UploadPg() {
  const fileInputRef = useRef(null)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [result, setResult] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [calibrationMessage, setCalibrationMessage] = useState('')
  const [baselineInfo, setBaselineInfo] = useState(null)
  const [baselineStatus, setBaselineStatus] = useState('')
  const [isBaselineLoading, setIsBaselineLoading] = useState(false)
  const [calibrationActive, setCalibrationActive] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(20)
  const [currentSentence, setCurrentSentence] = useState('')
  const [currentProblem, setCurrentProblem] = useState('')
  const [calibrationFlowComplete, setCalibrationFlowComplete] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isCalibrating = searchParams.get('mode') === 'calibrate'
  const timerRef = useRef(null)

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const sessionsStorageKey = 'neurofocus_sessions'
  const phaseDurationSeconds = 10

  const sentencePool = [
    'Focus on your breathing and keep your posture relaxed while reading this sentence aloud.',
    'The quick brown fox jumps over the calm and quiet stream near the trees.',
    'Take a slow breath, read clearly, and keep your eyes moving at a steady pace.',
    'Today is a good day to practice steady reading and gentle concentration.',
  ]

  const createRandomSentence = () => {
    return sentencePool[Math.floor(Math.random() * sentencePool.length)]
  }

  const createRandomProblem = () => {
    const first = Math.floor(Math.random() * 80) + 10
    const second = Math.floor(Math.random() * 80) + 10
    const operators = ['+', '-']
    const operator = operators[Math.floor(Math.random() * operators.length)]
    return `Solve: ${first} ${operator} ${second}`
  }

  const phases = [
    { key: 'read', title: 'Read Aloud', getMessage: () => currentSentence },
    { key: 'relax-1', title: 'Relax', getMessage: () => 'Breathe slowly and relax.' },
    { key: 'solve', title: 'Solve', getMessage: () => currentProblem },
    { key: 'relax-2', title: 'Relax', getMessage: () => 'Breathe slowly and relax.' },
  ]

  const loadSessions = () => {
    try {
      const stored = localStorage.getItem(sessionsStorageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveSession = (session) => {
    const nextSessions = [session, ...loadSessions()]
    localStorage.setItem(sessionsStorageKey, JSON.stringify(nextSessions))
  }

  const fetchBaseline = async () => {
    setIsBaselineLoading(true)
    setBaselineStatus('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/baseline`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.detail || 'Baseline not found')
      }

      setBaselineInfo(data?.baseline || null)
      setBaselineStatus('Baseline active ✅')
    } catch (baselineError) {
      setBaselineInfo(null)
      setBaselineStatus(baselineError instanceof Error ? baselineError.message : 'Baseline not found')
    } finally {
      setIsBaselineLoading(false)
    }
  }

  const startCalibrationFlow = () => {
    setCalibrationActive(true)
    setCalibrationFlowComplete(false)
    setPhaseIndex(0)
    setRemainingSeconds(phaseDurationSeconds)
    setCurrentSentence(createRandomSentence())
    setCurrentProblem(createRandomProblem())
  }

  const stopCalibrationFlow = () => {
    setCalibrationActive(false)
    setPhaseIndex(0)
    setRemainingSeconds(phaseDurationSeconds)
  }

  useEffect(() => {
    if (!calibrationActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      return
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          const nextIndex = phaseIndex + 1
          if (nextIndex >= phases.length) {
            setCalibrationActive(false)
            setCalibrationFlowComplete(true)
            return phaseDurationSeconds
          }
          setPhaseIndex(nextIndex)
          return phaseDurationSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [calibrationActive, phaseIndex, phaseDurationSeconds, phases.length])

  const removeBaseline = async () => {
    setIsBaselineLoading(true)
    setBaselineStatus('')

    try {
      const response = await fetch(`${apiBaseUrl}/api/baseline`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.detail || 'Unable to remove baseline')
      }

      setBaselineInfo(null)
      setBaselineStatus(data?.message || 'Baseline removed')
    } catch (baselineError) {
      setBaselineStatus(baselineError instanceof Error ? baselineError.message : 'Unable to remove baseline')
    } finally {
      setIsBaselineLoading(false)
    }
  }

  useEffect(() => {
    if (!isCalibrating) {
      fetchBaseline()
    }
  }, [isCalibrating])

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
    setSelectedFileName(file ? file.name : '')
    setResult(null)
    setErrorMessage('')
    setCalibrationMessage('')
    setCalibrationFlowComplete(false)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose a CSV file first.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setIsUploading(true)
    setErrorMessage('')
    setResult(null)

    try {
      const endpoint = isCalibrating ? '/api/calibrate' : '/api/predict'
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || 'Upload failed')
      }

      if (isCalibrating) {
        setResult(null)
        setCalibrationMessage(data?.message || 'Calibration complete ✅')
        setBaselineInfo(data?.baseline || null)
        setBaselineStatus('Baseline active ✅')
      } else {
        setResult(data)
      }

      saveSession({
        id: crypto.randomUUID(),
        fileName: selectedFile.name,
        createdAt: new Date().toISOString(),
        result: data,
        isCalibration: isCalibrating,
      })
    } catch (uploadError) {
      setErrorMessage(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`upload-page${isCalibrating ? ' calibration-page' : ''}`}>
      <div className="upload-shell">
        <header className="upload-header">
          <button className="back-button" onClick={() => navigate('/')} aria-label="Go back">
            <svg viewBox="0 0 24 24" className="back-arrow-icon">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <div className="upload-logo">
            <img src={puzzle} alt="NeuroFocus logo" className="upload-mark" />
            <span>NeuroFocus</span>
          </div>
        </header>

        <main className="upload-body">
          <h1 className="upload-title">{isCalibrating ? 'Calibration Upload' : 'Upload EEG Session'}</h1>
          <p className="upload-copy">
            Import your Neuphony<br />
            session to generate <strong>{isCalibrating ? 'baseline calibration data.' : 'personalized cognitive insights.'}</strong>
          </p>

          {isCalibrating ? (
            <div className="calibration-panel">
              <p className="calibration-note">
                Calibration creates a personal baseline from a normal, relaxed session. We use that baseline to
                personalize future fatigue scores so they reflect your own brain patterns.
              </p>
              <ul className="calibration-steps">
                <li>Start calibration and follow the 4 guided steps below.</li>
                <li>Upload the recorded CSV to save your baseline.</li>
                <li>Future uploads are compared to the baseline for personalized results.</li>
              </ul>
              <div className="calibration-actions">
                <button
                  type="button"
                  className="calibration-start"
                  onClick={startCalibrationFlow}
                  disabled={calibrationActive}
                >
                  {calibrationActive ? 'Calibration running...' : 'Start 4-step calibration'}
                </button>
                <button
                  type="button"
                  className="calibration-stop"
                  onClick={stopCalibrationFlow}
                  disabled={!calibrationActive}
                >
                  Stop
                </button>
              </div>
              <div className="calibration-stage">
                <div className="stage-header">
                  <span className="stage-label">Step {phaseIndex + 1} of {phases.length}</span>
                  <span className="stage-timer">{remainingSeconds}s</span>
                </div>
                <h3 className="stage-title">{phases[phaseIndex].title}</h3>
                <p className="stage-message">
                  {calibrationActive ? phases[phaseIndex].getMessage() : 'Press start to begin.'}
                </p>
              </div>
              {calibrationFlowComplete ? (
                <p className="calibration-success">Calibration flow complete. Upload the CSV now.</p>
              ) : null}
            </div>
          ) : null}

          {!isCalibrating ? (
            <div className="baseline-toolbar">
              <button
                type="button"
                className="baseline-button baseline-remove"
                onClick={removeBaseline}
                disabled={isBaselineLoading}
              >
                Remove Baseline
              </button>
              {baselineStatus ? <span className="baseline-status">{baselineStatus}</span> : null}
            </div>
          ) : null}

          <div className="upload-action-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="upload-input"
              onChange={handleFileChange}
            />
            <button type="button" className="upload-button" onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>

          <button type="button" className="analyze-button" onClick={handleFileUpload} disabled={isUploading}>
            {isUploading ? 'Sending to backend...' : 'Generate Results'}
          </button>

          {selectedFileName ? (
            <p className="upload-selected-file">Selected file: {selectedFileName}</p>
          ) : null}

          {errorMessage ? <p className="upload-error">{errorMessage}</p> : null}

          {calibrationMessage ? (
            <p className="calibration-success">{calibrationMessage}</p>
          ) : null}

          {/* results and chart moved below Insights header */}

          {!isCalibrating ? (
            <>
              <h2 className="upload-insights">Insights</h2>
              <div className="upload-space">
                <p className="upload-insights-empty">
                  Upload a CSV file, then generate results to see the backend analysis.
                </p>

                {result ? (
                  <div className="upload-results" aria-label="Prediction results">
                    {Object.entries(result)
                      .filter(([key]) => !['fatigue_trend', 'recommendations', 'insights'].includes(key))
                      .map(([key, value]) => (
                        <div key={key} className="result-card">
                          <span className="result-label">{key.replaceAll('_', ' ')}</span>
                          <strong className="result-value">{String(value)}</strong>
                        </div>
                      ))}
                  </div>
                ) : null}

                {result && baselineInfo ? (
                  <section className="baseline-compare" aria-label="Baseline comparison">
                    <h3 className="insight-title">Baseline Comparison</h3>
                    <div className="baseline-grid">
                      <div className="baseline-card">
                        <span>baseline theta</span>
                        <strong>{Number(baselineInfo.theta).toFixed(2)}</strong>
                      </div>
                      <div className="baseline-card">
                        <span>baseline beta</span>
                        <strong>{Number(baselineInfo.beta).toFixed(2)}</strong>
                      </div>
                      <div className="baseline-card">
                        <span>baseline alpha</span>
                        <strong>{Number(baselineInfo.alpha).toFixed(2)}</strong>
                      </div>
                      <div className="baseline-card">
                        <span>current fatigue</span>
                        <strong>{Number(result.fatigue).toFixed(2)}</strong>
                      </div>
                    </div>
                    {baselineInfo.saved_at ? (
                      <p className="baseline-timestamp">Baseline saved {new Date(baselineInfo.saved_at).toLocaleString()}</p>
                    ) : null}
                  </section>
                ) : null}

                {result?.recommendations?.length ? (
                  <section className="insight-section" aria-label="Recommendations">
                    <h3 className="insight-title">Recommendations</h3>
                    <ul className="insight-list">
                      {result.recommendations.map((item, index) => (
                        <li key={`rec-${index}`} className="insight-item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {result?.insights?.length ? (
                  <section className="insight-section" aria-label="Insights">
                    <h3 className="insight-title">Insights</h3>
                    <ul className="insight-list">
                      {result.insights.map((item, index) => (
                        <li key={`ins-${index}`} className="insight-item">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {result?.fatigue_trend && Array.isArray(result.fatigue_trend) && (
                  <div className="fatigue-trend-card">
                    <h2 className="trend-title">Fatigue Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={result.fatigue_trend.map((val, index) => ({
                          time: index,
                          fatigue: val * 100,
                          baseline: baselineInfo?.fatigue_trend?.[index]
                            ? baselineInfo.fatigue_trend[index] * 100
                            : null,
                        }))}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => {
                            const label = name === 'baseline' ? 'baseline' : 'current'
                            return [`${Number(value).toFixed(2)}%`, label]
                          }}
                        />
                        <Line type="monotone" dataKey="fatigue" stroke="#8884d8" strokeWidth={2} dot={false} />
                        {baselineInfo?.fatigue_trend ? (
                          <Line type="monotone" dataKey="baseline" stroke="#2f7bd2" strokeWidth={2} dot={false} />
                        ) : null}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </main>

        <footer className="upload-footer">
          We learn how your brain behaves before making
          <br />
          personalized predictions.
        </footer>
      </div>
    </div>
  )
}

export default UploadPg
