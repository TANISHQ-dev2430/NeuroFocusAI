import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import puzzle from '../assets/puzzle.png'
import './history.css'

function History() {
	const navigate = useNavigate()
	const [sessions, setSessions] = useState([])
	const sessionsStorageKey = 'neurofocus_sessions'

	useEffect(() => {
		try {
			const stored = localStorage.getItem(sessionsStorageKey)
			setSessions(stored ? JSON.parse(stored) : [])
		} catch {
			setSessions([])
		}
	}, [])

	const formatDate = (isoDate) => {
		if (!isoDate) return 'Unknown date'
		const parsed = new Date(isoDate)
		return Number.isNaN(parsed.valueOf()) ? 'Unknown date' : parsed.toLocaleString()
	}

	return (
		<div className="history-page">
			<div className="history-shell">
				<header className="history-header">
					<button className="back-button" onClick={() => navigate('/')} aria-label="Go back">
						<svg viewBox="0 0 24 24" className="back-arrow-icon">
							<path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
						</svg>
					</button>
					<div className="history-logo">
						<img src={puzzle} alt="NeuroFocus logo" className="history-mark" />
						<span>NeuroFocus</span>
					</div>
				</header>

				<main className="history-body">
					<h1 className="history-title">Previous Sessions</h1>

					{!sessions.length ? (
						<p className="history-empty">No saved sessions yet. Upload a CSV to generate results.</p>
					) : (
						<div className="history-list" aria-label="Saved sessions">
							{sessions.map((session) => (
								<article key={session.id} className="history-card">
									<header className="history-card-header">
										<h2 className="history-file">{session.fileName || 'Session upload'}</h2>
										<span className="history-date">{formatDate(session.createdAt)}</span>
									</header>
									<div className="history-metrics">
										<div className="history-metric">
											<span>fatigue</span>
											<strong>{session.result?.fatigue ?? '—'}</strong>
										</div>
										<div className="history-metric">
											<span>focus</span>
											<strong>{session.result?.focus ?? '—'}</strong>
										</div>
										<div className="history-metric">
											<span>relaxation</span>
											<strong>{session.result?.relaxation ?? '—'}</strong>
										</div>
										<div className="history-metric">
											<span>cognitive load</span>
											<strong>{session.result?.cognitive_load ?? '—'}</strong>
										</div>
									</div>
								</article>
							))}
						</div>
					)}
				</main>
			</div>
		</div>
	)
}

export default History
