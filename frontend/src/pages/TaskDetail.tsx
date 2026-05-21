import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import {
  Clock, User, ArrowLeft, ImagePlus, CheckSquare, Square,
  PlusCircle, Trash2, Calendar, BookOpen, AlertTriangle, Play,
  Send, FileText, CheckCircle2, History, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { addNotification } = useAuthStore();

  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Toggles and inline editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState('');

  // Forms state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [logHours, setLogHours] = useState(1);
  const [logDesc, setLogDesc] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadTask = async (silent = false) => {
    if (!taskId) return;
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.data);
      setDescText(data.data.description || '');
      setTitleText(data.data.title || '');
    } catch (err) {
      console.error('Failed to load task details', err);
      addNotification('Error', 'Unable to load task details');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
    api.get('/projects').then(r => setProjects(r.data.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});
  }, [taskId]);

  // Inline details patch helper
  const patchTaskField = async (fields: Record<string, any>) => {
    if (!task) return;
    const previousTask = task;
    // Optimistic UI update
    setTask((prev: any) => ({ ...prev, ...fields }));
    try {
      const { data } = await api.put(`/tasks/${task._id}`, fields);
      setTask(data.data);
      addNotification('Task updated', 'Changes saved successfully');
    } catch {
      setTask(previousTask);
      addNotification('Error', 'Failed to save changes');
    }
  };

  // ── SUBTASKS HANDLERS ──────────────────────────────────────
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/subtasks`, { title: newSubtaskTitle });
      setTask(data.data);
      setNewSubtaskTitle('');
      addNotification('Subtask added', 'Task checklist updated');
    } catch {
      addNotification('Error', 'Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
    if (!task) return;
    try {
      const { data } = await api.put(`/tasks/${task._id}/subtasks/${subtaskId}`, { completed: !currentStatus });
      setTask(data.data);
    } catch {
      addNotification('Error', 'Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!task || !confirm('Remove this subtask?')) return;
    try {
      const { data } = await api.delete(`/tasks/${task._id}/subtasks/${subtaskId}`);
      setTask(data.data);
      addNotification('Subtask removed', 'Task checklist updated');
    } catch {
      addNotification('Error', 'Failed to remove subtask');
    }
  };

  // ── TIME LOGGING HANDLERS ─────────────────────────────────
  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (logHours <= 0 || !task) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/time-logs`, { hours: logHours, description: logDesc });
      setTask(data.data);
      setLogHours(1);
      setLogDesc('');
      addNotification('Time logged', `${logHours} hours recorded successfully`);
    } catch {
      addNotification('Error', 'Failed to log time');
    }
  };

  // ── COMMENTS HANDLERS ──────────────────────────────────────
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !task) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { text: newCommentText });
      setTask(data.data);
      setNewCommentText('');
      addNotification('Comment posted', 'Your response has been added');
    } catch {
      addNotification('Error', 'Failed to post comment');
    }
  };

  // ── ATTACHMENTS UPLOAD ────────────────────────────────────
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject('Unable to read file');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5_000_000) { alert('Please choose an image smaller than 5MB.'); return; }

    setUploading(true);
    try {
      const fileUrl = await toBase64(file);
      await api.post(`/tasks/${task._id}/attachments`, { fileName: file.name, fileUrl, fileSize: file.size });
      addNotification('Attachment uploaded', `Uploaded ${file.name}`);
      loadTask(true);
    } catch {
      addNotification('Error', 'Attachment upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task || !confirm('Delete this attachment?')) return;
    try {
      await api.delete(`/tasks/${task._id}/attachments/${attachmentId}`);
      addNotification('Attachment deleted', 'Attachment removed');
      loadTask(true);
    } catch {
      addNotification('Error', 'Unable to delete attachment');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;
  }

  if (!task) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn-ghost" onClick={() => navigate('/tasks')}><ArrowLeft size={16} /> Back to Tasks</button>
        </div>
        <div className="card">
          <h3>Task Not Found</h3>
          <p>We couldn't locate this task. It may have been deleted or reassigned.</p>
        </div>
      </div>
    );
  }

  const subtasksCompleted = task.subtasks?.filter((s: any) => s.completed).length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const subtaskProgress = subtasksTotal ? Math.round((subtasksCompleted / subtasksTotal) * 100) : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px' }}>
      {/* HEADER BREADCRUMBS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', marginBottom: 12 }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>Tasks</span>
        <ChevronRight size={12} />
        <span style={{ color: '#0f172a', fontWeight: 500 }}>{task.title}</span>
      </div>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/tasks')} style={{ paddingLeft: 0, marginBottom: 8 }}>
            <ArrowLeft size={15} /> Back to Task List
          </button>
          {isEditingTitle ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <input
                value={titleText}
                onChange={e => setTitleText(e.target.value)}
                style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', padding: '6px 12px', borderRadius: 8, border: '2px solid #3b82f6', width: '100%', maxWidth: 500 }}
              />
              <button className="btn btn-primary" onClick={() => { setIsEditingTitle(false); patchTaskField({ title: titleText }); }}>Save</button>
              <button className="btn btn-ghost" onClick={() => { setIsEditingTitle(false); setTitleText(task.title); }}>Cancel</button>
            </div>
          ) : (
            <h2
              className="page-title"
              style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', cursor: 'pointer', display: 'inline-block' }}
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename task"
            >
              {task.title}
            </h2>
          )}
        </div>
      </div>

      {/* DUAL-COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.8fr) minmax(280px, 1fr)', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: MAIN CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* DESCRIPTION */}
          <div className="card" style={{ padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={18} color="#64748b" /> Description</h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setIsEditingDesc(!isEditingDesc)}>
                {isEditingDesc ? 'Cancel' : 'Edit Scope'}
              </button>
            </div>

            {isEditingDesc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                  rows={5}
                  value={descText}
                  onChange={e => setDescText(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontFamily: 'inherit' }}
                />
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => { setIsEditingDesc(false); patchTaskField({ description: descText }); }}
                >
                  Save description
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                {task.description || <em style={{ color: '#94a3b8' }}>No description provided. Click "Edit Scope" to document task objectives.</em>}
              </p>
            )}
          </div>

          {/* CHECKLIST / SUBTASKS */}
          <div className="card" style={{ padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={18} color="#22c55e" /> Task Checklist
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0 0' }}>{subtasksCompleted} of {subtasksTotal} subtasks completed</p>
              </div>
            </div>

            {/* Checklist progress bar */}
            {subtasksTotal > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${subtaskProgress}%`, background: '#22c55e', borderRadius: 99, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                placeholder="Add subtask target..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                style={{ flex: 1, height: 36, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
              />
              <button type="submit" className="btn btn-secondary" style={{ height: 36 }}><PlusCircle size={14} /> Add</button>
            </form>

            {/* List */}
            {task.subtasks?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {task.subtasks.map((s: any) => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={() => handleToggleSubtask(s._id, s.completed)}
                    >
                      {s.completed ? <CheckSquare size={17} color="#22c55e" /> : <Square size={17} color="#94a3b8" />}
                    </button>
                    <span style={{ flex: 1, fontSize: 13, textDecoration: s.completed ? 'line-through' : 'none', color: s.completed ? '#94a3b8' : '#334155' }}>
                      {s.title}
                    </span>
                    <button
                      type="button"
                      className="btn-ghost btn-icon"
                      onClick={() => handleDeleteSubtask(s._id)}
                      style={{ padding: 4 }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', border: '2px dashed #f1f5f9', borderRadius: 8, color: '#94a3b8', fontSize: 13 }}>
                No checklist objectives defined yet.
              </div>
            )}
          </div>

          {/* DISCUSSIONS / COMMENTS */}
          <div className="card" style={{ padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} color="#3b82f6" /> Discussions
            </h3>

            {/* Write comment */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <input
                placeholder="Ask a question or post update..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                style={{ flex: 1, height: 38, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13 }}
              />
              <button type="submit" className="btn btn-primary" style={{ height: 38, background: '#3b82f6', borderColor: '#3b82f6' }}><Send size={13} /> Send</button>
            </form>

            {/* List */}
            {task.comments?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {task.comments.map((c: any, index: number) => (
                  <div key={c._id || index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>{c.user?.name?.charAt(0) || '?'}</div>
                    <div style={{ flex: 1, background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{c.user?.name || 'Unknown User'}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.4 }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                No active discussions yet. Be the first to start!
              </div>
            )}
          </div>

          {/* TIMELINE & ACTIVITY LOGS */}
          <div className="card" style={{ padding: 24, borderRadius: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} color="#64748b" /> Activity Timeline
            </h3>

            {task.activityLogs?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '2px solid #f1f5f9', paddingLeft: 16, marginLeft: 8 }}>
                {task.activityLogs.map((entry: any) => (
                  <div key={entry._id} style={{ position: 'relative', fontSize: 13 }}>
                    {/* Bullet marker */}
                    <div style={{ position: 'absolute', left: -22, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1', border: '2px solid #fff' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#334155', textTransform: 'capitalize' }}>{entry.action.replace('_', ' ')}</span>
                      <span style={{ color: '#94a3b8', fontSize: 11 }}>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ color: '#64748b' }}>By {entry.user?.name || 'System Operator'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: 13 }}>
                No activity records found.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: METADATA & SIDEBAR CONTROLS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* STATUS & PRIORITY BOARD */}
          <div className="card" style={{ padding: 20, borderRadius: 14, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 16 }}>Task Status &amp; Priority</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', tracking: '0.05em', color: '#64748b' }}>State</label>
                <select
                  value={task.status}
                  onChange={e => patchTaskField({ status: e.target.value })}
                  style={{ width: '100%', height: 38, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', tracking: '0.05em', color: '#64748b' }}>Priority Level</label>
                <select
                  value={task.priority}
                  onChange={e => patchTaskField({ priority: e.target.value })}
                  style={{ width: '100%', height: 38, border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* PROJECT & ASSIGNMENT */}
          <div className="card" style={{ padding: 20, borderRadius: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Ownership</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Project Scope</label>
                <select
                  value={task.projectId?._id || task.projectId || ''}
                  onChange={e => patchTaskField({ projectId: e.target.value })}
                  style={{ width: '100%', height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Assignee</label>
                <select
                  value={task.assignedTo?._id || task.assignedTo || ''}
                  onChange={e => patchTaskField({ assignedTo: e.target.value })}
                  style={{ width: '100%', height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Deadline</label>
                <input
                  type="date"
                  value={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                  onChange={e => patchTaskField({ deadline: e.target.value })}
                  style={{ width: '100%', height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, padding: '0 8px' }}
                />
              </div>
            </div>
          </div>

          {/* STORY POINTS & TIME TRACKER */}
          <div className="card" style={{ padding: 20, borderRadius: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Performance &amp; Timing</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11, color: '#64748b' }}>Story Points (Estimate Complexity)</label>
                <input
                  type="number"
                  min={0}
                  value={task.storyPoints || ''}
                  placeholder="e.g. 1, 2, 3, 5, 8"
                  onChange={e => patchTaskField({ storyPoints: +e.target.value })}
                  style={{ width: '100%', height: 36, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, padding: '0 10px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#475569' }}>{task.estimatedHours || 0}h</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Estimated</div>
                </div>
                <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>{task.actualHours || 0}h</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Logged</div>
                </div>
              </div>

              {/* Time Logging Form */}
              <form onSubmit={handleLogTime} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>⏰ Log Work Progress</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={logHours}
                    onChange={e => setLogHours(+e.target.value)}
                    style={{ width: 60, height: 32, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, padding: '0 6px' }}
                  />
                  <input
                    placeholder="Log detail..."
                    value={logDesc}
                    onChange={e => setLogDesc(e.target.value)}
                    style={{ flex: 1, height: 32, border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, padding: '0 8px' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ height: 32, padding: '0 10px' }}><Play size={10} /> Log</button>
                </div>
              </form>
            </div>
          </div>

          {/* IMAGES & ATTACHMENTS */}
          <div className="card" style={{ padding: 20, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Gallery</h3>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAttachmentUpload} style={{ display: 'none' }} />
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{ color: '#2563eb', padding: '2px 6px' }}
              >
                <ImagePlus size={14} /> Add Image
              </button>
            </div>

            {uploading && <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, textAlign: 'center' }}>Uploading attachment...</div>}

            {task.attachments?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {task.attachments.map((a: any) => (
                  <div key={a._id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <a href={a.fileUrl} target="_blank" rel="noreferrer">
                      <img src={a.fileUrl} alt={a.fileName} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                    </a>
                    <button
                      type="button"
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 4, padding: 3, cursor: 'pointer', display: 'flex' }}
                      onClick={() => handleDeleteAttachment(a._id)}
                    >
                      <Trash2 size={11} color="#ef4444" />
                    </button>
                    <div style={{ fontSize: 10, color: '#64748b', padding: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {a.fileName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', border: '2px dashed #f1f5f9', borderRadius: 8, color: '#94a3b8', fontSize: 12 }}>
                No task snapshots yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
