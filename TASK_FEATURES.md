# 📋 Enhanced Task Management System - Complete Feature Guide

## Overview

Your task management system now includes **10+ advanced features** for comprehensive task tracking, collaboration, and project management.

---

## 🎯 Task Priority Levels

Tasks can be assigned one of 4 priority levels:

| Priority | Use Case | Color |
|----------|----------|-------|
| **Critical** | Urgent, blocking other tasks | 🔴 Red |
| **High** | Important, should be done soon | 🟠 Orange |
| **Medium** | Standard work items | 🟡 Yellow |
| **Low** | Nice to have, can be deferred | 🟢 Green |

### Create Task with Priority

```bash
POST /api/tasks
{
  "title": "Fix authentication bug",
  "description": "Users cannot login with OAuth",
  "priority": "critical",
  "complexity": "high",
  "deadline": "2026-05-25T00:00:00Z",
  "projectId": "project_id",
  "assignedTo": "user_id"
}
```

### Filter Tasks by Priority

```bash
GET /api/tasks?priority=critical
GET /api/tasks?priority=high
GET /api/tasks?priority=medium
GET /api/tasks?priority=low
```

---

## 🎯 Complexity Levels

Track task complexity alongside priority:

| Level | Description | Story Points |
|-------|-------------|--------------|
| **Easy** | Straightforward tasks, 1-3 hours | 1-3 |
| **Medium** | Some problem-solving needed | 5-8 |
| **Hard** | Complex logic, multiple components | 13-20 |
| **Extreme** | High complexity, extensive testing | 40+ |

### Create Task with Complexity

```bash
POST /api/tasks
{
  "title": "Implement ML prediction engine",
  "complexity": "extreme",
  "storyPoints": 40,
  "estimatedHours": 80
}
```

---

## ✅ Subtasks / Checklists

Break large tasks into smaller, trackable subtasks.

### Add Subtask

```bash
POST /api/tasks/:taskId/subtasks
{
  "title": "Design database schema",
  "assignedTo": "user_id"  // Optional
}
```

### Update Subtask

```bash
PUT /api/tasks/:taskId/subtasks/:subtaskId
{
  "title": "Updated subtask title",
  "completed": true,
  "assignedTo": "new_user_id"
}
```

### Delete Subtask

```bash
DELETE /api/tasks/:taskId/subtasks/:subtaskId
```

### Track Progress

```json
{
  "subtasks": [
    { "title": "Design", "completed": true },
    { "title": "Development", "completed": true },
    { "title": "Testing", "completed": false },
    { "title": "Deployment", "completed": false }
  ],
  "progress": 50  // 2/4 subtasks = 50%
}
```

---

## 📎 Attachments

Attach files, documents, and resources to tasks.

### Add Attachment

```bash
POST /api/tasks/:taskId/attachments
{
  "fileName": "design-mockup.fig",
  "fileUrl": "https://cdn.example.com/design-mockup.fig",
  "fileSize": 2048000  // bytes
}
```

Returns:
```json
{
  "attachments": [
    {
      "_id": "attachment_id",
      "fileName": "design-mockup.fig",
      "fileUrl": "https://...",
      "fileSize": 2048000,
      "uploadedBy": { "name": "John Doe" },
      "uploadedAt": "2026-05-21T10:30:00Z"
    }
  ]
}
```

### Delete Attachment

```bash
DELETE /api/tasks/:taskId/attachments/:attachmentId
```

---

## ⏱️ Time Tracking / Time Logs

Log hours worked on tasks for accurate estimation vs actual tracking.

### Log Time

```bash
POST /api/tasks/:taskId/time-logs
{
  "hours": 5.5,
  "date": "2026-05-21T00:00:00Z",
  "description": "Backend API development"
}
```

**Effect:**
- `actualHours` field automatically incremented
- Time log stored with user reference
- Activity log created

### Get Time Logs

```bash
GET /api/tasks/:taskId/time-logs
```

Returns:
```json
{
  "timeLogs": [
    {
      "_id": "log_id",
      "user": { "name": "John Doe" },
      "hours": 5.5,
      "date": "2026-05-21T00:00:00Z",
      "description": "Backend API development"
    },
    {
      "user": { "name": "Jane Smith" },
      "hours": 3,
      "date": "2026-05-21T00:00:00Z",
      "description": "Frontend integration"
    }
  ],
  "totalLogged": 8.5
}
```

### Use Case Example

```
Task: "Build payment integration"
├─ Estimated: 40 hours
├─ Time logs:
│  ├─ Day 1: 8 hours logged
│  ├─ Day 2: 6 hours logged
│  ├─ Day 3: 7 hours logged
│  └─ Day 4: 5 hours logged
├─ Actual: 26 hours (36% less than estimated)
└─ Accuracy: Good estimation!
```

---

## 👀 Watchers / Followers

Get notified of changes to tasks you care about.

### Add Watcher

```bash
POST /api/tasks/:taskId/watchers
{
  "userId": "user_id"
}
```

**Multiple Watchers:**
```json
{
  "watchers": [
    { "name": "John (creator)", "email": "john@..." },
    { "name": "Sarah (manager)", "email": "sarah@..." },
    { "name": "Mike (reviewer)", "email": "mike@..." }
  ]
}
```

### Remove Watcher

```bash
DELETE /api/tasks/:taskId/watchers/:userId
```

### Notification Triggers

Watchers are notified when:
- ✅ Task status changes
- ✅ Priority changes
- ✅ Deadline updated
- ✅ New comments added
- ✅ Task reassigned

---

## 🔗 Task Dependencies / Blocking

Define task relationships (e.g., Task B depends on Task A).

### Add Dependency

```bash
POST /api/tasks/:taskId/dependencies
{
  "dependencyId": "other_task_id",
  "type": "blockedBy"  // or "blocks"
}
```

**Types:**
- `blockedBy` - This task is blocked by another task
- `blocks` - This task blocks another task

### Examples

```
Task A: "Design UI" (10 days)
  └─ blocks → Task B: "Develop Frontend" (15 days)
    └─ blocks → Task C: "Integration Testing" (5 days)

Timeline:
├─ Days 1-10: Design UI (Task A)
├─ Days 11-25: Develop Frontend (Task B) - can't start until A done
└─ Days 26-30: Integration Testing (Task C) - can't start until B done
```

### Visual Kanban Impact

```
Todo → In-Progress → Review → Completed
 ↑
Task B blocked by Task A (highlight in red)
```

### Remove Dependency

```bash
DELETE /api/tasks/:taskId/dependencies
{
  "dependencyId": "other_task_id",
  "type": "blockedBy"
}
```

---

## 📝 Comments & Activity Log

Track all changes to a task for transparency.

### Add Comment

```bash
POST /api/tasks/:taskId/comments
{
  "text": "We should use PostgreSQL for better performance"
}
```

### Get Activity Log

```bash
GET /api/tasks/:taskId/activity
```

Returns:
```json
{
  "activityLogs": [
    {
      "user": { "name": "John Doe" },
      "action": "created",
      "changes": { "task": "..." },
      "createdAt": "2026-05-20T09:00:00Z"
    },
    {
      "user": { "name": "Sarah" },
      "action": "updated",
      "changes": {
        "status": { "old": "todo", "new": "in-progress" },
        "priority": { "old": "medium", "new": "high" }
      },
      "createdAt": "2026-05-20T10:30:00Z"
    },
    {
      "user": { "name": "Mike" },
      "action": "commented",
      "changes": { "comment": "Looking good!" },
      "createdAt": "2026-05-21T08:15:00Z"
    },
    {
      "user": { "name": "John" },
      "action": "updated_progress",
      "changes": { "progress": 75 },
      "createdAt": "2026-05-21T16:00:00Z"
    }
  ]
}
```

**Activity Log Actions:**
- `created` - Task created
- `updated` - Task fields updated
- `commented` - Comment added
- `status_changed` - Status updated
- `updated_progress` - Progress changed
- `added_subtask` - Subtask added
- `added_attachment` - File attached
- `logged_time` - Time logged
- `added_watcher` - Watcher added
- `added_dependency` - Dependency added

---

## 📊 Progress Tracking

Monitor task completion progress (0-100%).

### Update Progress

```bash
PUT /api/tasks/:taskId/progress
{
  "progress": 75  // 75% complete
}
```

### Progress Indicators

```
Task: "API Development"
├─ Progress: 0% (Just started)
│  └─ Status: Todo
│
├─ Progress: 25% (Endpoints defined)
│  └─ Status: In-Progress
│
├─ Progress: 60% (Core endpoints working)
│  └─ Status: In-Progress
│
├─ Progress: 100% (All endpoints done, tests passing)
│  └─ Status: Completed
│  └─ completedAt: 2026-05-21T17:30:00Z
```

---

## 🏷️ Labels & Tags

Categorize tasks with custom labels.

### Add Labels

```bash
POST /api/tasks
{
  "title": "Fix critical bug",
  "labels": ["bug", "critical", "backend"]
}
```

or update:

```bash
PUT /api/tasks/:taskId
{
  "labels": ["feature", "frontend", "ui", "high-priority"]
}
```

### Query by Labels

```bash
GET /api/tasks?labels=bug,critical
```

---

## 📈 Task Statistics & Analytics

Get insights into task distribution and team performance.

### Get Task Stats

```bash
GET /api/tasks/stats?projectId=project_id
```

Returns:
```json
{
  "totalTasks": 45,
  "completedTasks": 32,
  "inProgressTasks": 10,
  "todoTasks": 3,
  "criticalTasks": 2,
  "highPriorityTasks": 8,
  "avgEstimatedHours": 15.5,
  "avgActualHours": 12.3,
  "totalEstimatedHours": 697.5,
  "totalActualHours": 553.5,
  "totalStoryPoints": 285,
  "completionRate": "71%",
  "estimationAccuracy": "79%"
}
```

### Filter by Priority

```bash
GET /api/tasks?priority=critical&projectId=project_id
```

Returns critical tasks sorted by deadline.

### Filter by Complexity

```bash
GET /api/tasks?complexity=extreme&projectId=project_id
```

Returns most complex tasks sorted by story points.

---

## 🔄 Recurring Tasks

Set tasks to repeat automatically.

### Create Recurring Task

```bash
POST /api/tasks
{
  "title": "Weekly team standup",
  "isRecurring": true,
  "recurringPattern": "weekly",  // daily, weekly, biweekly, monthly
  "deadline": "2026-05-29T10:00:00Z"
}
```

---

## 📋 Complete Task Workflow Example

```
1. CREATE TASK
   POST /api/tasks
   {
     "title": "Implement user authentication",
     "priority": "critical",
     "complexity": "hard",
     "storyPoints": 20,
     "estimatedHours": 40,
     "deadline": "2026-06-01T00:00:00Z",
     "assignedTo": "user_id"
   }

2. ADD SUBTASKS
   POST /api/tasks/:taskId/subtasks
   - Design authentication flow
   - Implement JWT logic
   - Add OAuth integration
   - Write unit tests
   - Security review

3. ADD WATCHERS
   POST /api/tasks/:taskId/watchers
   - Security lead
   - Tech lead
   - QA engineer

4. LOG TIME
   POST /api/tasks/:taskId/time-logs (daily)
   - Day 1: 8 hours
   - Day 2: 8 hours
   - etc.

5. UPDATE PROGRESS
   PUT /api/tasks/:taskId/progress
   - After day 1: 20%
   - After day 2: 40%
   - etc.

6. ADD ATTACHMENTS
   POST /api/tasks/:taskId/attachments
   - Architecture diagram
   - Design mockups
   - Reference code

7. ADD COMMENTS
   POST /api/tasks/:taskId/comments
   - Questions about implementation
   - Code review feedback
   - Suggestions

8. MARK COMPLETE
   PUT /api/tasks/:taskId
   {
     "status": "completed",
     "progress": 100
   }
   - completedAt: auto-set
   - Activity logged
   - Watchers notified
   - User stats updated
```

---

## 🚀 Query Parameters

### Combine Multiple Filters

```bash
GET /api/tasks?projectId=proj_123&status=in-progress&priority=critical&assignedTo=user_456&labels=bug&sortBy=deadline&sortOrder=asc
```

### Available Filters

| Parameter | Values | Example |
|-----------|--------|---------|
| `projectId` | Project ID | `?projectId=proj_123` |
| `status` | todo, in-progress, review, completed | `?status=in-progress` |
| `priority` | low, medium, high, critical | `?priority=critical` |
| `complexity` | easy, medium, hard, extreme | `?complexity=hard` |
| `assignedTo` | User ID | `?assignedTo=user_123` |
| `labels` | Comma-separated | `?labels=bug,urgent` |
| `sortBy` | deadline, priority, createdAt, progress | `?sortBy=deadline` |
| `sortOrder` | asc, desc | `?sortOrder=asc` |

---

## 📱 API Endpoints Summary

### Core Task Operations
- `POST /api/tasks` - Create task
- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Subtasks
- `POST /api/tasks/:id/subtasks` - Add subtask
- `PUT /api/tasks/:id/subtasks/:subtaskId` - Update subtask
- `DELETE /api/tasks/:id/subtasks/:subtaskId` - Delete subtask

### Attachments
- `POST /api/tasks/:id/attachments` - Add attachment
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Remove attachment

### Time Tracking
- `POST /api/tasks/:id/time-logs` - Log time
- `GET /api/tasks/:id/time-logs` - Get time logs

### Collaboration
- `POST /api/tasks/:id/comments` - Add comment
- `GET /api/tasks/:id/activity` - View activity log
- `POST /api/tasks/:id/watchers` - Add watcher
- `DELETE /api/tasks/:id/watchers/:userId` - Remove watcher

### Dependencies
- `POST /api/tasks/:id/dependencies` - Add dependency
- `DELETE /api/tasks/:id/dependencies` - Remove dependency

### Status & Progress
- `PUT /api/tasks/:id/progress` - Update progress
- `GET /api/tasks/stats` - Get statistics

### Notifications
- `POST /api/tasks/reminders` - Send reminders

---

## 🎓 Best Practices

### 1. Use Priority + Complexity Together
```json
{
  "priority": "critical",     // Urgency
  "complexity": "hard"        // Effort
}
```

### 2. Set Story Points for Estimation
```json
{
  "complexity": "hard",
  "storyPoints": 13,          // Helps team estimate velocity
  "estimatedHours": 40
}
```

### 3. Add Dependencies for Planning
```bash
POST /api/tasks/:taskId/dependencies
{
  "dependencyId": "design_task_id",
  "type": "blockedBy"         // Can't start design is not done
}
```

### 4. Use Subtasks for Breakdown
- Large tasks (>20 hours) → Add subtasks
- Track progress with subtask completion
- Assign subtasks to different team members

### 5. Log Time Daily
- More accurate than estimates
- Helps future planning
- Shows actual vs estimated burndown

### 6. Set Watchers for Visibility
- Add managers/leads to critical tasks
- Add QA to feature tasks
- Auto-notify on changes

---

## 🔧 Frontend Integration Examples

### React Component - Task Card

```tsx
<TaskCard task={task}>
  <TaskHeader>
    <Priority level={task.priority} />
    <Complexity level={task.complexity} />
    <StoryPoints points={task.storyPoints} />
  </TaskHeader>
  
  <ProgressBar value={task.progress} />
  <SubtasksChecklist subtasks={task.subtasks} />
  <TimeLogSummary logs={task.timeLogs} />
  <WatchersAvatars watchers={task.watchers} />
  <Attachments files={task.attachments} />
  <Comments list={task.comments} />
  <ActivityTimeline logs={task.activityLogs} />
</TaskCard>
```

---

## 📞 Questions?

Check the API documentation or task examples in the routes file!
