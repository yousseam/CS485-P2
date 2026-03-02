# User Stories

## US1

As a project lead, I want the AI to automatically break a specification into suggested Jira issues so that I save time on manual task creation.

### Acceptance criteria (Given/When/Then)

- **Given** I have a specification document (e.g. PRD or technical spec), **when** I upload it to the application, **then** the system accepts the file and triggers AI processing to break it into suggested Jira issues.
- **Given** I have uploaded a valid specification, **when** the AI finishes processing, **then** I see a list of suggested Jira issues (e.g. epics and stories) with titles, descriptions, and acceptance criteria derived from the specification.
- **Given** I am on the upload or empty state, **when** no specification has been uploaded or processed yet, **then** I see an empty state that prompts me to upload a document so the AI can break it into Jira-ready issues.

---

## US2

As a project lead, I want to review and edit AI-generated tasks before publishing them so that I stay in control of final decisions.

**Note:** US2 depends on the output of US1. Review and edit actions apply to the suggested Jira issues produced by the AI in US1.

### Acceptance criteria (Given/When/Then)

- **Given** the AI has generated suggested Jira issues (output of US1), **when** I view the suggested issues, **then** I can see each issue’s details (e.g. type, title, description, acceptance criteria) and its draft status.
- **Given** I am viewing a suggested issue, **when** I choose to edit it, **then** I can modify the issue’s content before it is published.
- **Given** I am viewing suggested issues, **when** I approve one or more issues (individually or in bulk), **then** the system records my approval and I can see how many issues are approved (e.g. “X/N Approved”).
- **Given** I have approved all issues I intend to publish, **when** I choose to publish, **then** the approved issues are published to the target Jira project and I see a success state confirming publication.
- **Given** I have not approved all issues, **when** I attempt to publish, **then** the system prevents publishing until all issues are approved (or I am clearly informed that all must be approved first).
