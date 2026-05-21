# 🎨 Frontend Integration Guide - Task Features

This guide shows how to integrate the new task features into your React frontend.

---

## 📦 API Hook Examples

### 1. Create Task with All Features

```tsx
import axios from 'axios';

const createTaskWithFeatures = async (taskData) => {
  try {
    const response = await api.post('/tasks', {
      title: taskData.title,
      description: taskData.description,
      projectId: taskData.projectId,
      assignedTo: taskData.assignedTo,
      priority: 'critical',      // NEW: Set priority
      complexity: 'hard',        // NEW: Set complexity
      storyPoints: 13,           // NEW: Story points
      estimatedHours: 40,
      deadline: new Date('2026-06-01'),
      startDate: new Date('2026-05-21'),
      labels: ['feature', 'backend'],  // NEW: Labels
      isRecurring: false,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error creating task:', error);
  }
};
```

---

## 🎯 Priority & Complexity Display

### Priority Badge Component

```tsx
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const icons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[priority]}`}>
      {icons[priority]} {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

export default PriorityBadge;
```

### Complexity Badge Component

```tsx
interface ComplexityBadgeProps {
  complexity: 'easy' | 'medium' | 'hard' | 'extreme';
  storyPoints?: number;
}

const ComplexityBadge: React.FC<ComplexityBadgeProps> = ({ complexity, storyPoints }) => {
  const colors = {
    easy: 'bg-blue-100 text-blue-800',
    medium: 'bg-purple-100 text-purple-800',
    hard: 'bg-red-100 text-red-800',
    extreme: 'bg-black text-white',
  };

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[complexity]}`}>
      <span>{complexity}</span>
      {storyPoints && <span className="ml-2 font-bold">{storyPoints}pts</span>}
    </div>
  );
};

export default ComplexityBadge;
```

---

## ✅ Subtasks Component

```tsx
import { useState } from 'react';
import { api } from '../lib/api';

interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
  assignedTo?: { name: string };
}

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  onUpdate: () => void;
}

const SubtaskList: React.FC<SubtaskListProps> = ({ taskId, subtasks, onUpdate }) => {
  const [newSubtask, setNewSubtask] = useState('');

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      await api.post(`/tasks/${taskId}/subtasks`, {
        title: newSubtask,
      });
      setNewSubtask('');
      onUpdate();
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`, {
        completed: !completed,
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const progressPercent = (completedCount / subtasks.length) * 100;

  return (
    <div className="border rounded-lg p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Subtasks</h3>
          <span className="text-sm text-gray-500">{completedCount}/{subtasks.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {subtasks.map(subtask => (
          <div key={subtask._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() => toggleSubtask(subtask._id, subtask.completed)}
              className="w-4 h-4"
            />
            <span className={subtask.completed ? 'line-through text-gray-400' : ''}>
              {subtask.title}
            </span>
            {subtask.assignedTo && (
              <span className="text-sm text-gray-500 ml-auto">
                👤 {subtask.assignedTo.name}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Add subtask..."
          className="flex-1 border rounded px-3 py-2 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
        />
        <button
          onClick={addSubtask}
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default SubtaskList;
```

---

## ⏱️ Time Tracking Component

```tsx
import { useState } from 'react';
import { api } from '../lib/api';

interface TimeLog {
  _id: string;
  user: { name: string };
  hours: number;
  date: string;
  description: string;
}

interface TimeTrackerProps {
  taskId: string;
  estimatedHours: number;
  actualHours: number;
  timeLogs: TimeLog[];
  onUpdate: () => void;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  taskId,
  estimatedHours,
  actualHours,
  timeLogs,
  onUpdate,
}) => {
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');

  const logTime = async () => {
    if (!hours || parseFloat(hours) <= 0) {
      alert('Please enter valid hours');
      return;
    }

    try {
      await api.post(`/tasks/${taskId}/time-logs`, {
        hours: parseFloat(hours),
        description,
        date: new Date(),
      });
      setHours('');
      setDescription('');
      onUpdate();
    } catch (error) {
      console.error('Error logging time:', error);
    }
  };

  const accuracy = estimatedHours > 0 ? (actualHours / estimatedHours * 100).toFixed(0) : 0;

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-4">⏱️ Time Tracking</h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-3 rounded text-center">
          <div className="text-sm text-gray-500">Estimated</div>
          <div className="text-2xl font-bold">{estimatedHours}h</div>
        </div>
        <div className="bg-white p-3 rounded text-center">
          <div className="text-sm text-gray-500">Actual</div>
          <div className="text-2xl font-bold">{actualHours}h</div>
        </div>
        <div className="bg-white p-3 rounded text-center">
          <div className="text-sm text-gray-500">Accuracy</div>
          <div className={`text-2xl font-bold ${parseFloat(accuracy as string) < 100 ? 'text-green-600' : 'text-orange-600'}`}>
            {accuracy}%
          </div>
        </div>
      </div>

      {/* Log Time Form */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Hours"
            className="w-20 border rounded px-3 py-2"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={logTime}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Log
          </button>
        </div>
      </div>

      {/* Time Log History */}
      {timeLogs.length > 0 && (
        <div className="bg-white rounded p-3">
          <h4 className="font-semibold text-sm mb-3">Recent Logs</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {timeLogs.map(log => (
              <div key={log._id} className="flex justify-between text-sm border-b pb-2 last:border-b-0">
                <div>
                  <div className="font-medium">{log.user.name}</div>
                  <div className="text-gray-500 text-xs">{log.description}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{log.hours}h</div>
                  <div className="text-gray-500 text-xs">{new Date(log.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
```

---

## 👀 Watchers Component

```tsx
import { useState } from 'react';
import { api } from '../lib/api';

interface Watcher {
  _id: string;
  name: string;
  avatar?: string;
}

interface WatchersProps {
  taskId: string;
  watchers: Watcher[];
  availableUsers: Watcher[];
  onUpdate: () => void;
}

const Watchers: React.FC<WatchersProps> = ({ taskId, watchers, availableUsers, onUpdate }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const addWatcher = async (userId: string) => {
    try {
      await api.post(`/tasks/${taskId}/watchers`, { userId });
      setShowDropdown(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding watcher:', error);
    }
  };

  const removeWatcher = async (userId: string) => {
    try {
      await api.delete(`/tasks/${taskId}/watchers/${userId}`);
      onUpdate();
    } catch (error) {
      console.error('Error removing watcher:', error);
    }
  };

  const unusedUsers = availableUsers.filter(
    u => !watchers.find(w => w._id === u._id)
  );

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-3">👀 Watchers ({watchers.length})</h3>

      {/* Current Watchers */}
      <div className="flex flex-wrap gap-2 mb-4">
        {watchers.map(watcher => (
          <div
            key={watcher._id}
            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
          >
            {watcher.avatar && <img src={watcher.avatar} alt={watcher.name} className="w-5 h-5 rounded-full" />}
            <span>{watcher.name}</span>
            <button
              onClick={() => removeWatcher(watcher._id)}
              className="ml-1 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add Watcher Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="border rounded px-3 py-2 text-sm hover:bg-gray-50 w-full text-left"
        >
          + Add watcher
        </button>

        {showDropdown && unusedUsers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 border rounded bg-white shadow-lg z-10">
            {unusedUsers.map(user => (
              <button
                key={user._id}
                onClick={() => addWatcher(user._id)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
              >
                {user.avatar && <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full inline mr-2" />}
                {user.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchers;
```

---

## 📊 Progress Bar Component

```tsx
import { api } from '../lib/api';

interface ProgressBarProps {
  taskId: string;
  progress: number;
  onUpdate: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ taskId, progress, onUpdate }) => {
  const updateProgress = async (newProgress: number) => {
    try {
      await api.put(`/tasks/${taskId}/progress`, { progress: newProgress });
      onUpdate();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-blue-100">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold">Progress</span>
        <span className="text-lg font-bold text-blue-600">{progress}%</span>
      </div>

      <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="flex gap-2 mt-4">
        {[0, 25, 50, 75, 100].map(p => (
          <button
            key={p}
            onClick={() => updateProgress(p)}
            className={`flex-1 py-2 rounded text-sm font-semibold transition-all ${
              progress === p
                ? 'bg-blue-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
```

---

## 📝 Activity Log Component

```tsx
interface ActivityLog {
  _id: string;
  user: { name: string; avatar?: string };
  action: string;
  changes: Record<string, any>;
  createdAt: string;
}

interface ActivityLogProps {
  logs: ActivityLog[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      created: '✨',
      updated: '✏️',
      commented: '💬',
      status_changed: '🔄',
      updated_progress: '📈',
      added_subtask: '✅',
      added_attachment: '📎',
      logged_time: '⏱️',
      added_watcher: '👀',
      deleted: '🗑️',
    };
    return icons[action] || '📝';
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Activity Timeline</h3>

      <div className="space-y-4">
        {logs.map((log, index) => (
          <div key={log._id} className="flex gap-4">
            {/* Timeline line */}
            {index < logs.length - 1 && (
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                  {getActionIcon(log.action)}
                </div>
                <div className="w-0.5 h-12 bg-gray-300 mt-1"></div>
              </div>
            )}
            {index === logs.length - 1 && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
                {getActionIcon(log.action)}
              </div>
            )}

            {/* Content */}
            <div className="pt-1 flex-1">
              <div className="flex items-center gap-2">
                {log.user.avatar && <img src={log.user.avatar} alt={log.user.name} className="w-5 h-5 rounded-full" />}
                <strong>{log.user.name}</strong>
                <span className="text-gray-500">{log.action.replace(/_/g, ' ')}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
```

---

## 🔗 Complete Task Detail Page Example

```tsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import PriorityBadge from '../components/PriorityBadge';
import ComplexityBadge from '../components/ComplexityBadge';
import SubtaskList from '../components/SubtaskList';
import TimeTracker from '../components/TimeTracker';
import Watchers from '../components/Watchers';
import ProgressBar from '../components/ProgressBar';
import ActivityLog from '../components/ActivityLog';

const TaskDetailPage = ({ taskId }: { taskId: string }) => {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data.data);
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  if (loading) return <div>Loading...</div>;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Main Content */}
      <div className="col-span-2 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-3">{task.title}</h1>
          <div className="flex gap-2 flex-wrap">
            <PriorityBadge priority={task.priority} />
            <ComplexityBadge complexity={task.complexity} storyPoints={task.storyPoints} />
            {task.labels.map((label: string) => (
              <span key={label} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p>{task.description}</p>
        </div>

        {/* Progress */}
        <ProgressBar taskId={taskId} progress={task.progress} onUpdate={fetchTask} />

        {/* Subtasks */}
        <SubtaskList taskId={taskId} subtasks={task.subtasks} onUpdate={fetchTask} />

        {/* Time Tracking */}
        <TimeTracker
          taskId={taskId}
          estimatedHours={task.estimatedHours}
          actualHours={task.actualHours}
          timeLogs={task.timeLogs}
          onUpdate={fetchTask}
        />

        {/* Activity Log */}
        <ActivityLog logs={task.activityLogs} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Assignee */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Assigned To</h3>
          {task.assignedTo && (
            <div className="flex items-center gap-3">
              {task.assignedTo.avatar && <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="w-10 h-10 rounded-full" />}
              <div>
                <div className="font-medium">{task.assignedTo.name}</div>
                <div className="text-sm text-gray-500">{task.assignedTo.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="border rounded-lg p-4 space-y-3">
          <div>
            <div className="text-sm text-gray-500">Start Date</div>
            <div className="font-medium">{task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Deadline</div>
            <div className="font-medium">{new Date(task.deadline).toLocaleDateString()}</div>
          </div>
          {task.completedAt && (
            <div>
              <div className="text-sm text-gray-500">Completed</div>
              <div className="font-medium">{new Date(task.completedAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {/* Watchers */}
        <Watchers
          taskId={taskId}
          watchers={task.watchers}
          availableUsers={[]}  // Fetch from your users API
          onUpdate={fetchTask}
        />
      </div>
    </div>
  );
};

export default TaskDetailPage;
```

---

## 🚀 Next Steps

1. **Import components** into your task pages
2. **Fetch available users** for watchers dropdown
3. **Create API utilities** for all task operations
4. **Add loading/error states** as needed
5. **Customize styling** to match your design system
6. **Test all features** end-to-end

All backend endpoints are ready! Start building your UI! 💪
