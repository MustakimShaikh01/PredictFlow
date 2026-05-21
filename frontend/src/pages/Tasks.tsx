import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Plus, Trash2, Clock, User, ImagePlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const STATUS_BADGES: Record<string, string> = { 'todo': 'badge-gray', 'in-progress': 'badge-blue', 'review': 'badge-yellow', 'completed': 'badge-green' };
const PRIORITY_BADGES: Record<string, string> = { 'low': 'badge-gray', 'medium': 'badge-blue', 'high': 'badge-yellow', 'critical': 'badge-red' };

export default function Tasks() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useAuthStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentTaskId = useRef<string | null>(null);
  const getToday = () => new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assignedTo: '', priority: 'medium', estimatedHours: 0, deadline: getToday() });
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const queryParams = new URLSearchParams(location.search);
  const querySearch = queryParams.get('q') || '';
  const queryStatus = queryParams.get('status') || '';
  const queryPriority = queryParams.get('priority') || '';

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'todo', label: 'Todo' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: '', label: 'All priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const buildQuery = (search: string, status: string, priority: string) => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    return params.toString();
  };

  const load = async (search = '', status = '', priority = '') => {
    setLoading(true);
    try {
      const response = await api.get('/tasks', {
        params: {
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
        },
      });
      setTasks(response.data.data);
    } catch (error) {
      console.error('Failed to load tasks', error);
      alert('Unable to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter(queryStatus);
    setPriorityFilter(queryPriority);
    load(querySearch, queryStatus, queryPriority);
    api.get('/projects').then(r => setProjects(r.data.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});
  }, [querySearch, queryStatus, queryPriority]);

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject('Unable to read file');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const uploadAttachment = async (taskId: string, file: File) => {
    const fileUrl = await toBase64(file);
    await api.post(`/tasks/${taskId}/attachments`, {
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
    });
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deadline || form.deadline < getToday()) {
      alert('Deadline cannot be in the past. Please choose today or a future date.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/tasks', form);
      const created = response.data.data;

      if (attachmentFile) {
        await uploadAttachment(created._id, attachmentFile);
      }

      await load(querySearch, queryStatus, queryPriority);
      addNotification('Task created', `Created task '${created.title}'`);
      setShowModal(false);
      setAttachmentFile(null);
      setForm({ title: '', description: '', projectId: '', assignedTo: '', priority: 'medium', estimatedHours: 0, deadline: getToday() });
    } catch (error) {
      console.error('Task creation failed', error);
      alert('Unable to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await api.put(`/tasks/${id}`, { status });
      setTasks(prev => prev.map(task => task._id === id ? response.data.data : task));
      const task = tasks.find((task) => task._id === id);
      addNotification('Task updated', `Status changed for '${task?.title || 'task'}'`);
    } catch (error) {
      console.error('Status update failed', error);
      alert('Unable to update task status. Please try again.');
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;

    try {
      const taskToDelete = tasks.find((task) => task._id === id);
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(task => task._id !== id));
      addNotification('Task deleted', `Deleted task '${taskToDelete?.title || 'task'}'`);
    } catch (error) {
      console.error('Delete task failed', error);
      alert('Unable to delete task. Please try again.');
    }
  };

  const openAttachmentGallery = (task: any) => {
    setSelectedTask(task);
  };

  const closeAttachmentGallery = () => {
    setSelectedTask(null);
  };

  const handleAttachmentSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !attachmentTaskId.current) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 5_000_000) {
      alert('Please choose an image smaller than 5MB.');
      return;
    }

    setUploading(true);
    try {
      await uploadAttachment(attachmentTaskId.current, file);
      addNotification('Attachment added', `Uploaded ${file.name} to task.`);
      await load(querySearch, queryStatus, queryPriority);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Unable to upload image. Please try again.');
    } finally {
      setUploading(false);
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 className="page-title">Tasks</h2>
          <p className="page-subtitle">{tasks.length} total tasks</p>
          {querySearch && <div className="subtitle-note">Showing results for “{querySearch}”</div>}
        </div>
        <div className="task-controls">
          <div className="filter-row">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => navigate(`/tasks?${buildQuery(querySearch, statusFilter, priorityFilter)}`)}
            >
              Apply filters
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setStatusFilter('');
                setPriorityFilter('');
                navigate(querySearch ? `/tasks?q=${encodeURIComponent(querySearch)}` : '/tasks');
              }}
            >
              Reset filters
            </button>
          </div>
          <button id="add-task-btn" className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Task</button>
        </div>
      </div>

      <div className="card">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAttachmentSelection}
        />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Task</th><th>Project</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Deadline</th><th>Actions</th></tr></thead>
            <tbody>
              {tasks.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><h3>No tasks yet</h3><p>Create your first task</p></div></td></tr> :
                tasks.map((t: any) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{t.title}</div>
                      {t.attachments?.length ? (
                        <div className="thumbnail-row">
                          {t.attachments.slice(0, 3).map((attachment: any) => (
                            <img key={attachment._id} src={attachment.fileUrl} alt={attachment.fileName} className="task-thumbnail" />
                          ))}
                          {t.attachments.length > 3 && <span className="thumbnail-count">+{t.attachments.length - 3}</span>}
                        </div>
                      ) : null}
                    </td>
                    <td>{t.projectId?.title || '—'}</td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:6 }}><div className="user-avatar" style={{ width:24, height:24, fontSize:10 }}>{t.assignedTo?.name?.charAt(0) || '?'}</div>{t.assignedTo?.name || '—'}</div></td>
                    <td><span className={`badge ${PRIORITY_BADGES[t.priority]}`}>{t.priority}</span></td>
                    <td>
                      <select value={t.status} onChange={e => updateStatus(t._id, e.target.value)} style={{ padding:'4px 8px', fontSize:12, border:'1px solid #e2e8f0', borderRadius:6 }}>
                        <option value="todo">Todo</option><option value="in-progress">In Progress</option><option value="review">Review</option><option value="completed">Completed</option>
                      </select>
                    </td>
                    <td style={{ fontSize:13, color:'#64748b' }}><Clock size={12} /> {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:4, alignItems: 'center' }}>
                        <button className="btn-ghost btn-icon" type="button" onClick={() => {
                          attachmentTaskId.current = t._id;
                          fileInputRef.current?.click();
                        }} disabled={uploading} title="Upload image">
                          <ImagePlus size={14} color="#2563eb" />
                        </button>
                        {t.attachments?.length ? (
                          <button
                            className="btn btn-sm btn-ghost"
                            type="button"
                            onClick={() => openAttachmentGallery(t)}
                          >
                            {t.attachments.length} image{t.attachments.length > 1 ? 's' : ''}
                          </button>
                        ) : null}
                        <button className="btn-ghost btn-icon" onClick={() => deleteTask(t._id)}><Trash2 size={14} color="#ef4444" /></button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Create Task</h3><button className="btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={create} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="form-group"><label className="form-label">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Project</label>
                  <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} required>
                    <option value="">Select project</option>{projects.map((p: any) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Assign To</label>
                  <select value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} required>
                    <option value="">Select user</option>{users.map((u: any) => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Task Image (optional)</label>
                <input type="file" accept="image/*" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} />
                {attachmentFile && <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>{attachmentFile.name}</div>}
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Est. Hours</label>
                  <input type="number" min={0} value={form.estimatedHours} onChange={e => setForm({...form, estimatedHours: +e.target.value})} />
                </div>
              </div>
              <div className="form-group"><label className="form-label">Deadline</label><input type="date" min={getToday()} value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required /></div>
              <button className="btn btn-primary" type="submit" style={{ width:'100%', justifyContent:'center' }} disabled={submitting}>
                {submitting ? 'Creating…' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay" onClick={closeAttachmentGallery}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{selectedTask.title}</h3>
                <p className="page-subtitle">{selectedTask.attachments?.length || 0} attachment{selectedTask.attachments?.length === 1 ? '' : 's'}</p>
              </div>
              <button className="btn-ghost" onClick={closeAttachmentGallery}>✕</button>
            </div>
            {selectedTask.attachments?.length ? (
              <div className="gallery-grid">
                {selectedTask.attachments.map((attachment: any) => (
                  <div className="gallery-card" key={attachment._id}>
                    <img src={attachment.fileUrl} alt={attachment.fileName} />
                    <div className="gallery-meta">{attachment.fileName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><h3>No images yet</h3><p>Upload a task image to preview it here.</p></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
