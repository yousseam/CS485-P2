import { useState } from 'react';
import { calculate } from './api/apiClient';
import './App.css';

function App() {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [isResult, setIsResult] = useState(false);

  const handleButtonClick = async (value) => {
    if (value === '=') {
      try {
        const result = await calculate(expression);
        setDisplay(result.result.toString());
        setExpression(result.result.toString());
        setIsResult(true);
      } catch (error) {
        setDisplay('Error');
        setIsResult(true);
      }
    } else if (value === 'Clear') {
      setExpression('');
      setDisplay('0');
      setIsResult(false);
    } else if (value === 'Backspace') {
      if (isResult) {
        setExpression('');
        setDisplay('0');
        setIsResult(false);
      } else {
        setExpression(expression.slice(0, -1));
        setDisplay(expression.slice(0, -1) || '0');
      }
    } else if (value === '+/-') {
      if (isResult) {
        const num = parseFloat(display);
        setDisplay((-num).toString());
        setExpression((-num).toString());
      } else {
        // Toggle sign of last number, but for simplicity, just prepend -
        if (expression.startsWith('-')) {
          setExpression(expression.slice(1));
          setDisplay(expression.slice(1) || '0');
        } else {
          setExpression('-' + expression);
          setDisplay('-' + expression);
        }
      }
    } else {
      if (isResult) {
        setExpression(value);
        setDisplay(value);
        setIsResult(false);
      } else {
        setExpression(expression + value);
        setDisplay(expression + value);
      }
    }
  };

  const buttons = [
    '7', '8', '9', '÷',
    '4', '5', '6', 'x',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
    'Clear', '+/-', 'Backspace', '%'
  ];

  return (
    <div className="calculator">
      <div className="display">
        {display}
      </div>
      <div className="buttons">
        {buttons.map((btn) => (
          <button key={btn} onClick={() => handleButtonClick(btn)}>
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
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
                    const allApproved = approvedIds.size === tasks.length
                    if (allApproved) {
                      setApprovedIds(new Set())
                      setApprovedCount(0)
                    } else {
                      setApprovedIds(new Set(tasks.map((t) => t.id)))
                      setApprovedCount(tasks.length)
                    }
                  }}
                  aria-label={approvedIds.size === tasks.length ? 'Unapprove all issues' : 'Approve all issues'}
                >
                  <span className="btn-icon check-icon" aria-hidden="true" />
                  {approvedIds.size === tasks.length ? 'Unapprove All' : 'Approve All'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={approvedIds.size < tasks.length}
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
