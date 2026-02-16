# Development Specification

## Feature: Review and Edit AI-Generated Tasks Before Publishing

------------------------------------------------------------------------

# 1. Header

**Version:** 1.0\
**Date:** February, 2026\
**Project Name:** AI-Enhanced Project Workflow Manager\
**Document Status:** Draft

**Related User Story:**\
As a project lead, I want to review and edit AI-generated tasks before publishing them so that I stay in control of final decisions.

------------------------------------------------------------------------

# 2. Architecture

## 2.1 High-Level Architecture Diagram

```mermaid
flowchart LR
    User[Project Lead] -->|Open Review Page| Client[Web Client]
    Client -->|GET Draft Tasks| Backend[Backend API]
    Backend -->|Read Drafts| DB[(PostgreSQL)]
    Backend -->|Return Drafts| Client

    Client -->|Edit Draft| Backend
    Backend -->|Save Changes| DB

    Client -->|Approve Draft| Backend
    Backend -->|Update Status=Approved| DB

    Client -->|Publish Approved| Backend
    Backend -->|Persist Issues| DB
    Backend -->|Optional Create in Jira| Jira[Jira REST API]
```
 ## 2.2 Component Deployment

| Component     | Execution Environment                         |
|--------------|-----------------------------------------------|
| Web Client   | Browser                                       |
| Backend API  | Cloud Server / Docker Container               |
| Database     | Managed Cloud Database (PostgreSQL)           |
| LLM Service  | External Cloud Provider (used in previous story) |
| Jira API     | External REST Service                         |

------------------------------------------------------------------------

## 2.3 Information Flow

1. AI-generated draft tasks already exist in the database.
2. User opens the review interface in the Web Client.
3. Backend retrieves draft tasks from the database.
4. User edits draft fields (title, description, priority, labels).
5. Backend stores updated draft and version history.
6. User approves selected drafts.
7. Backend updates draft status to **Approved**.
8. User clicks **Publish**.
9. Backend validates approval and persists drafts as final `Issue` records.
10. Optional: Backend creates Jira issues and stores returned issue keys.


## classDiagram
    class User {
        UUID id
        string name
        string email
        string role
    }

    class Project {
        UUID id
        string name
        string description
        UUID owner_id
    }

    class TaskDraft {
        UUID id
        UUID project_id
        string title
        string description
        string status
        int priority
        string[] labels
        timestamp created_at
    }

    class TaskDraftVersion {
        UUID id
        UUID draft_id
        UUID edited_by
        timestamp edited_at
        text change_log
    }

    class Issue {
        UUID id
        UUID project_id
        string title
        string description
        string status
        timestamp created_at
        string jira_key
    }

    User --> Project
    Project --> TaskDraft
    TaskDraft --> TaskDraftVersion
    Project --> Issue

------------------------------------------------------------------------

# 4. List of Classes

## User

- id  
- name  
- email  
- role  

## Project

- id  
- name  
- description  
- owner_id  

## TaskDraft

- id  
- project_id  
- title  
- description  
- status (Draft / Approved / Published)  
- priority  
- labels  
- created_at  

## TaskDraftVersion

- id  
- draft_id  
- edited_by  
- edited_at  
- change_log  

## Issue

- id  
- project_id  
- title  
- description  
- status  
- created_at  
- jira_key  

------------------------------------------------------------------------

# 5. State Diagrams

## 5.1 Task Draft Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Draft : Edit
    Draft --> Approved : Approve
    Approved --> Draft : Edit Again
    Approved --> Published : Publish
    Published --> [*]
