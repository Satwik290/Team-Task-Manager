# Team Task Manager API Documentation

This document provides technical details for the REST API powering the Team Task Manager.

## Authentication

The API uses a custom JWT-based authentication system. 

- **Token Storage**: Tokens are stored in a secure, HTTP-only cookie named `auth-token`.
- **Headers**: No manual headers are required for authenticated requests if cookies are handled by the browser.
- **Roles**: Access control is enforced based on the `ADMIN` and `MEMBER` roles.

---

## Projects API

### GET `/api/projects`
Retrieve a list of projects.
- **Access**: Admin, Member.
- **Behavior**: Admins see all projects. Members see projects they own or projects containing tasks assigned to them.
- **Response**: `{ projects: SerializedProject[] }`

### POST `/api/projects`
Create a new project.
- **Access**: Admin only.
- **Payload**:
  ```json
  {
    "name": "Project Name",
    "description": "Optional description"
  }
  ```
- **Response**: `{ project: SerializedProject }` (201 Created)

### PATCH `/api/projects/[id]`
Update an existing project.
- **Access**: Admin only.
- **Payload**: Partial project object.
- **Response**: `{ project: SerializedProject }`

### DELETE `/api/projects/[id]`
Delete a project and all its associated tasks.
- **Access**: Admin only.
- **Response**: 204 No Content

---

## Tasks API

### POST `/api/tasks`
Create a new task.
- **Access**: Admin only.
- **Payload**:
  ```json
  {
    "title": "Task Title",
    "description": "Task description",
    "projectId": "uuid",
    "assigneeId": "uuid",
    "dueDate": "ISO Date String",
    "priority": "LOW | MEDIUM | HIGH"
  }
  ```
- **Response**: `{ task: SerializedTask }` (201 Created)

### PATCH `/api/tasks/[id]`
Update a task's details or status.
- **Access**: Admin (all fields), Member (status only for assigned tasks).
- **Payload**: Partial task object.
- **Response**: `{ task: SerializedTask }`

### DELETE `/api/tasks/[id]`
Delete a specific task.
- **Access**: Admin only.
- **Response**: 204 No Content

---

## Dashboard API

### GET `/api/dashboard`
Retrieve global metrics and upcoming tasks for the current user.
- **Access**: Admin, Member.
- **Response**:
  ```json
  {
    "metrics": {
      "total": number,
      "pending": number,
      "overdue": number,
      "done": number
    },
    "upcoming": SerializedTask[],
    "projects": SerializedProject[],
    "users": SerializedUser[]
  }
  ```

---

## User Management API

### GET `/api/users`
List all users for assignment or management purposes.
- **Access**: Admin only.

### PATCH `/api/users/[id]`
Update a user's role.
- **Access**: Admin only.
- **Payload**: `{ "role": "ADMIN" | "MEMBER" }`
