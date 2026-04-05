import { useState, useCallback, useEffect } from 'react'
import { generateIssues, publishIssues, readSpecFromFile } from './api/apiClient'
import {
  toggleApproval,
  toggleApproveAll,
  emptyApprovals,
  canPublish,
  selectApprovedIssues,
  applyIssueUpdate,
  approvedIdsFromSerialized,
} from './issueReview/issueReview.js'
import './App.css'

const STORAGE_KEY = 'ai-spec-breakdown'

// Figma steps 01–05: Empty/spec ready → Loading → Suggested issues (draft) → Error → Publish success
const STEP_LABELS = ['01', '02', '03', '04', '05']
const PHASE_STEP = {
  empty: 0,
  specReady: 0,
  loading: 1,
  tasks: 2,
  error: 3,
  publishing: 4,
  publishSuccess: 4,
}

function App() {
  const [phase, setPhase] = useState('empty')
  const [specText, setSpecText] = useState('')
  const [tasks, setTasks] = useState([])
  const [approvedCount, setApprovedCount] = useState(0)
  const [approvedIds, setApprovedIds] = useState(new Set())
  const [error, setError] = useState(null)
  const [publishCount, setPublishCount] = useState(null)
  const [publishedProjectKey, setPublishedProjectKey] = useState('Project ABC')
  const [uploadError, setUploadError] = useState(null)
  const [simulateError, setSimulateError] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingDraft, setEditingDraft] = useState(null)
  const [publishError, setPublishError] = useState(null) // { code?, message? } when publish fails

  const handleFileOrPaste = useCallback(async (file) => {
    const text = await readSpecFromFile(file || null)
    setSpecText(text)
    return text
  }, [])

  const startGeneration = useCallback(async (useErrorPath = false, specTextOverride = null) => {
    const text = specTextOverride ?? (specText || (await handleFileOrPaste(null)))
    if (!text) return
    setSpecText(text)
    setPhase('loading')
    setError(null)
    try {
      const result = await generateIssues(text, { forceError: useErrorPath })
      setTasks(result.issues.map((t) => ({ ...t, approved: false })))
      const cleared = emptyApprovals()
      setApprovedIds(cleared.nextApprovedIds)
      setApprovedCount(cleared.approvedCount)
      setPhase('tasks')
    } catch (e) {
      setError({
        code: e.code ?? 'AI_PROC_ERR_429',
        timestamp: e.timestamp ?? new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        requestId: e.requestId ?? 'req_9f8a7b6c5d4e3f2a',
      })
      setPhase('error')
    }
  }, [specText, handleFileOrPaste])

  const handleUploadClick = useCallback(async (e) => {
    const file = e?.target?.files?.[0]
    if (!file) return
    setUploadError(null)
    try {
      const text = await readSpecFromFile(file)
      setSpecText(text)
      setPhase('specReady')
      setSimulateError(false)
    } catch (err) {
      setUploadError(err.message || 'Failed to read file.')
    }
    e.target.value = ''
  }, [])

  const handleGenerate = useCallback(() => {
    if (!specText) return
    startGeneration(false, specText)
  }, [specText, startGeneration])

  const handleApprove = useCallback((id) => {
    setApprovedIds((prev) => {
      const { nextApprovedIds, approvedCount } = toggleApproval(prev, id)
      setApprovedCount(approvedCount)
      return nextApprovedIds
    })
  }, [])

  const handleUpdateTask = useCallback((id, updates) => {
    setTasks((prev) => applyIssueUpdate(prev, id, updates))
    setEditingId(null)
    setEditingDraft(null)
  }, [])

  const startEditing = useCallback((task) => {
    setEditingId(task.id)
    setEditingDraft({
      summary: task.summary,
      description: task.description,
      acceptanceCriteria: [...(task.acceptanceCriteria || [])],
    })
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingId(null)
    setEditingDraft(null)
  }, [])

  const updateEditingDraft = useCallback((field, value) => {
    setEditingDraft((prev) => (prev ? { ...prev, [field]: value } : null))
  }, [])

  const handlePublish = useCallback(async () => {
    if (!canPublish(approvedIds, tasks.length)) return
    setPublishError(null)
    setPhase('publishing')
    try {
      const published = selectApprovedIssues(tasks, approvedIds)
      const { publishedCount: count, projectKey } = await publishIssues(published, { forceError: false })
      setPublishCount(count)
      setPublishedProjectKey(projectKey)
      setPhase('publishSuccess')
    } catch (e) {
      setPhase('tasks')
      setPublishError({
        code: e.code ?? 'PUBLISH_ERR',
        message: e.message ?? 'Publish failed. Please try again.',
      })
    }
  }, [tasks, approvedIds])

  // Restore persisted state on mount so issues persist across refresh/navigation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      if (data.specText) setSpecText(data.specText)
      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        setTasks(data.tasks)
        if (Array.isArray(data.approvedIds)) {
          const next = approvedIdsFromSerialized(data.approvedIds)
          setApprovedIds(next)
          setApprovedCount(next.size)
        }
        setPhase('tasks')
      }
    } catch (_) {
      // ignore invalid stored data
    }
  }, [])

  useEffect(() => {
    if (phase !== 'tasks') return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          specText,
          tasks,
          approvedIds: [...approvedIds],
          phase: 'tasks',
        })
      )
    } catch (_) {}
  }, [phase, specText, tasks, approvedIds])

  const retryPublish = useCallback(() => {
    setPublishError(null)
    handlePublish()
  }, [handlePublish])

  const resetToEmpty = useCallback(() => {
    setPhase('empty')
    setSpecText('')
    setTasks([])
    setError(null)
    setPublishError(null)
    const cleared = emptyApprovals()
    setApprovedIds(cleared.nextApprovedIds)
    setApprovedCount(cleared.approvedCount)
    setPublishCount(null)
    setEditingId(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (_) {}
  }, [])

  const currentStep = PHASE_STEP[phase] ?? 0

  const statusMessage =
    phase === 'loading' && 'Analyzing specification. Please wait.'
    || phase === 'error' && 'Generation failed. You can retry.'
    || phase === 'publishing' && 'Publishing issues. Please wait.'
    || phase === 'publishSuccess' && `Successfully published ${publishCount ?? tasks.length} issues.`
    || publishError && 'Publish failed. You can retry.'
    || ''

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-top">
          <h1 className="app-title">AI Specification Breakdown</h1>
          <p className="app-subtitle">Transform technical specifications into actionable Jira issues with AI.</p>
        </div>
        <div className="stepper" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={5} aria-label="Workflow step">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`stepper-step ${i === currentStep ? 'stepper-step--active' : ''} ${i < currentStep ? 'stepper-step--done' : ''}`}
            >
              <span className="stepper-step-num">{label}</span>
            </div>
          ))}
        </div>
      </header>

      <div
        className="visually-hidden"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {statusMessage}
      </div>

      <main className="app-main">
        <section className="panel panel-spec" aria-label="Specification">
          {phase === 'empty' ? (
            <>
              <h2 className="panel-title">Upload Specification</h2>
              <div
                className="upload-zone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer?.files?.[0]
                  if (!f) return
                  setUploadError(null)
                  readSpecFromFile(f)
                    .then((text) => {
                      setSpecText(text)
                      setPhase('specReady')
                    })
                    .catch((err) => setUploadError(err.message || 'Failed to read file.'))
                }}
              >
                <div className="upload-zone-icon" aria-hidden="true" />
                <p className="upload-zone-text">Upload a specification document</p>
                <p className="upload-zone-hint">Upload a .txt or .md file to generate structured Jira issues</p>
                {uploadError && (
                  <p className="upload-zone-error" role="alert">{uploadError}</p>
                )}
                <label htmlFor="spec-file-upload" className="btn btn-primary upload-btn">
                  <span className="btn-icon upload-icon" aria-hidden="true" />
                  Upload Specification
                  <input
                    id="spec-file-upload"
                    type="file"
                    accept=".txt,.md"
                    className="upload-input"
                    onChange={handleUploadClick}
                    aria-describedby="upload-hint"
                  />
                </label>
                <span id="upload-hint" className="visually-hidden">
                  Choose a .txt or .md specification file
                </span>
              </div>
            </>
          ) : (
            <>
              <h2 className="panel-title">Uploaded Specification</h2>
              <div className="spec-content" aria-label="Specification content">
                <pre className="spec-text">{specText}</pre>
              </div>
              <div className="panel-actions">
                {phase !== 'specReady' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={phase === 'loading' || phase === 'publishing'}
                  onClick={() => startGeneration(false)}
                  aria-label="Regenerate tasks from specification"
                >
                  <span className="btn-icon refresh-icon" aria-hidden="true" />
                  Regenerate Tasks
                </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetToEmpty}
                  aria-label="Upload a new specification file"
                >
                  <span className="btn-icon upload-icon" aria-hidden="true" />
                  Upload New Spec
                </button>
              </div>
            </>
          )}
        </section>

        <section className="panel panel-issues" aria-label="Suggested Jira Issues">
          {phase === 'empty' && (
            <>
              <h2 className="panel-title panel-title-issues">Suggested Jira Issues</h2>
              <div className="empty-state">
                <div className="empty-state-icon" aria-hidden="true" />
                <p className="empty-state-title">No tasks generated yet</p>
                <p className="empty-state-hint">Upload a document and let AI break it into Jira-ready issues.</p>
              </div>
            </>
          )}

          {phase === 'specReady' && (
            <>
              <h2 className="panel-title panel-title-issues">Suggested Jira Issues</h2>
              <div className="empty-state empty-state--with-generate">
                <div className="empty-state-icon" aria-hidden="true" />
                <p className="empty-state-title">No tasks generated yet</p>
                <p className="empty-state-hint">Click Generate to break your specification into Jira-ready issues.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-generate"
                  onClick={handleGenerate}
                  aria-label="Generate Jira issues from specification"
                >
                  <span className="btn-icon refresh-icon" aria-hidden="true" />
                  Generate
                </button>
              </div>
            </>
          )}

          {phase === 'loading' && (
            <>
              <h2 className="panel-title panel-title-issues">Suggested Jira Issues</h2>
              <div className="loading-bar" aria-hidden="true" />
              <div className="loading-state">
                <div className="loading-spinner" aria-hidden="true" />
                <p className="loading-title">Analyzing Specification...</p>
                <p className="loading-hint">Breaking your document into structured Jira issues.</p>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => startGeneration(true, specText)}
                  aria-label="Simulate error path for testing"
                >
                  Simulate error path
                </button>
              </div>
              <div className="skeleton-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card" aria-hidden="true" />
                ))}
              </div>
            </>
          )}

          {phase === 'error' && (
            <>
              <h2 className="panel-title panel-title-issues">Suggested Jira Issues</h2>
              <div className="error-state">
                <div className="error-icon" aria-hidden="true" />
                <h3 className="error-title">Generation Failed</h3>
                <div className="error-message" role="alert">
                  We encountered an error while processing your specification. This could be due to formatting issues, API limits, or temporary service disruption.
                </div>
                <dl className="error-details">
                  <dt>Error Code:</dt>
                  <dd>{error?.code ?? '—'}</dd>
                  <dt>Timestamp:</dt>
                  <dd>{error?.timestamp ?? '—'}</dd>
                  <dt>Request ID:</dt>
                  <dd>{error?.requestId ?? '—'}</dd>
                </dl>
                <div className="error-actions">
                  <button
                    type="button"
                    className="btn btn-warning"
                    onClick={() => startGeneration(false, specText)}
                    aria-label="Retry generation"
                  >
                    <span className="btn-icon refresh-icon" aria-hidden="true" />
                    Retry Generation
                  </button>
                  <button type="button" className="btn btn-secondary" aria-label="Contact support">
                    <span className="btn-icon support-icon" aria-hidden="true" />
                    Contact Support
                  </button>
                </div>
                <div className="troubleshooting">
                  <h4 className="troubleshooting-title">Troubleshooting Tips</h4>
                  <ul>
                    <li>Ensure your specification is in a supported format (.txt or .md)</li>
                    <li>Check that the document size is under 5MB</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {phase === 'tasks' && (
            <>
              {publishError && (
                <div className="publish-error-banner" role="alert">
                  <span className="publish-error-banner-icon" aria-hidden="true" />
                  <div className="publish-error-banner-content">
                    <strong>Publish failed.</strong>{' '}
                    {publishError.message}
                    {publishError.code && (
                      <span className="publish-error-code"> ({publishError.code})</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm"
                    onClick={retryPublish}
                    aria-label="Retry publish"
                  >
                    <span className="btn-icon refresh-icon" aria-hidden="true" />
                    Retry Publish
                  </button>
                </div>
              )}
              <div className="panel-issues-head">
                <h2 className="panel-title panel-title-issues">
                  <span className="panel-title-check" aria-hidden="true" />
                  Suggested Jira Issues
                </h2>
                <span className="approved-count" aria-live="polite">{approvedCount}/{tasks.length} Approved</span>
              </div>
              <div className="panel-issues-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const { nextApprovedIds, approvedCount } = toggleApproveAll(approvedIds, tasks)
                    setApprovedIds(nextApprovedIds)
                    setApprovedCount(approvedCount)
                  }}
                  aria-label={approvedIds.size === tasks.length ? 'Unapprove all issues' : 'Approve all issues'}
                >
                  <span className="btn-icon check-icon" aria-hidden="true" />
                  {approvedIds.size === tasks.length ? 'Unapprove All' : 'Approve All'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!canPublish(approvedIds, tasks.length)}
                  onClick={handlePublish}
                  aria-label="Publish approved issues to Jira"
                >
                  <span className="btn-icon publish-icon" aria-hidden="true" />
                  Publish
                </button>
              </div>
              <p className="issues-hint">
                <span className="issues-hint-icon" aria-hidden="true" />
                All issues must be approved before publishing.
              </p>
              <ul className="issue-list">
                {tasks.map((task) => (
                  <li key={task.id} className="issue-card">
                    {editingId === task.id && editingDraft ? (
                      <div className="issue-card-edit">
                        <div className="issue-card-head">
                          <span className={`issue-type issue-type--${task.type}`}>{task.key}</span>
                          <span className="issue-status-draft">DRAFT</span>
                        </div>
                        <label className="edit-label">
                          Summary
                          <input
                            type="text"
                            className="edit-input"
                            value={editingDraft.summary}
                            onChange={(e) => updateEditingDraft('summary', e.target.value)}
                            aria-label="Edit summary"
                          />
                        </label>
                        <label className="edit-label">
                          Description
                          <textarea
                            className="edit-textarea"
                            rows={3}
                            value={editingDraft.description}
                            onChange={(e) => updateEditingDraft('description', e.target.value)}
                            aria-label="Edit description"
                          />
                        </label>
                        <div className="edit-ac">
                          <h4 className="issue-ac-title">ACCEPTANCE CRITERIA</h4>
                          {(editingDraft.acceptanceCriteria || []).map((ac, i) => (
                            <div key={i} className="edit-ac-row">
                              <input
                                type="text"
                                className="edit-input"
                                value={ac}
                                onChange={(e) => {
                                  const next = [...editingDraft.acceptanceCriteria]
                                  next[i] = e.target.value
                                  updateEditingDraft('acceptanceCriteria', next)
                                }}
                                aria-label={`Criterion ${i + 1}`}
                              />
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm edit-ac-remove"
                                onClick={() => {
                                  const next = editingDraft.acceptanceCriteria.filter((_, j) => j !== i)
                                  updateEditingDraft('acceptanceCriteria', next)
                                }}
                                aria-label="Remove criterion"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              updateEditingDraft('acceptanceCriteria', [...(editingDraft.acceptanceCriteria || []), ''])}
                            aria-label="Add acceptance criterion"
                          >
                            Add criterion
                          </button>
                        </div>
                        <div className="issue-card-actions">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={cancelEditing} aria-label="Cancel editing">
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() =>
                              handleUpdateTask(task.id, {
                                summary: editingDraft.summary,
                                description: editingDraft.description,
                                acceptanceCriteria: editingDraft.acceptanceCriteria.filter(Boolean),
                              })}
                            aria-label="Save changes"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="issue-card-head">
                          <span className={`issue-type issue-type--${task.type}`}>{task.key}</span>
                          <span className="issue-status-draft">DRAFT</span>
                        </div>
                        <h3 className="issue-title">{task.summary}</h3>
                        <p className="issue-description">{task.description}</p>
                        <span className="issue-size">Size: {task.size}</span>
                        <div className="issue-ac">
                          <h4 className="issue-ac-title">ACCEPTANCE CRITERIA</h4>
                          <ul>
                            {task.acceptanceCriteria.map((ac, i) => (
                              <li key={i}>{ac}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="issue-card-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEditing(task)}
                            aria-label="Edit issue"
                          >
                            <span className="btn-icon edit-icon" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`btn ${approvedIds.has(task.id) ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                            onClick={() => handleApprove(task.id)}
                            aria-pressed={approvedIds.has(task.id)}
                            aria-label={approvedIds.has(task.id) ? 'Unapprove issue' : 'Approve issue'}
                          >
                            <span className="btn-icon check-icon" aria-hidden="true" />
                            {approvedIds.has(task.id) ? 'Unapprove' : 'Approve'}
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {phase === 'publishing' && (
            <>
              <h2 className="panel-title panel-title-issues">Publishing</h2>
              <div className="loading-state">
                <div className="loading-spinner" aria-hidden="true" />
                <p className="loading-title">Publishing issues...</p>
                <p className="loading-hint">Sending issues to Jira.</p>
              </div>
            </>
          )}

          {phase === 'publishSuccess' && (
            <>
              <div className="success-banner" role="status">
                <span className="success-banner-icon" aria-hidden="true" />
                <p className="success-banner-text">
                  Successfully published {publishCount ?? tasks.length} issues to {publishedProjectKey}. All issues are now available in your Jira workspace. You can view and manage them directly in Jira.
                </p>
              </div>
              <h2 className="panel-title panel-title-issues">
                <span className="panel-title-check" aria-hidden="true" />
                Published Issues
              </h2>
              <p className="published-count">{tasks.length} Issues</p>
              <ul className="issue-list">
                {tasks.map((task) => (
                  <li key={task.id} className="issue-card issue-card--published">
                    <div className="issue-card-head">
                      <span className={`issue-type issue-type--${task.type}`}>{task.key}</span>
                      <span className="issue-status-published">PUBLISHED</span>
                    </div>
                    <h3 className="issue-title">{task.summary}</h3>
                    <p className="issue-description">{task.description}</p>
                    <span className="issue-size">Size: {task.size}</span>
                    <div className="issue-ac">
                      <h4 className="issue-ac-title">ACCEPTANCE CRITERIA</h4>
                      <ul>
                        {task.acceptanceCriteria.map((ac, i) => (
                          <li key={i}>{ac}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="issue-card-actions">
                      <button type="button" className="btn btn-secondary btn-sm">
                        <span className="btn-icon edit-icon" aria-hidden="true" />
                        Edit
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" aria-label="Open project backlog in Jira">
                        <span className="btn-icon backlog-icon" aria-hidden="true" />
                        Project Backlog
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
