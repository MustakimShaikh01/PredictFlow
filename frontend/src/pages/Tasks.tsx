import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { Plus, Trash2, Clock, User, Eye, Search, CheckSquare, Square, X, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGES: Record<string, string> = { todo: 'badge-gray', 'in-progress': 'badge-blue', review: 'badge-yellow', completed: 'badge-green' };
const PRIORITY_BADGES: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red' };
const PRIORITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const sortByPriority = (list: any[]) =>
  [...list].sort((a, b) => {
    const diff = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
    if (diff !== 0) return diff;
    return (a.deadline ? new Date(a.deadline).getTime() : 0) - (b.deadline ? new Date(b.deadline).getTime() : 0);
  });

const getToday = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = { title: '', description: '', projectId: '', assignedTo: '', priority: 'medium', estimatedHours: 0, deadline: getToday() };

export default function Tasks() {
  const navigate = useNavigate();
  const { addNotification } = useAuthStore();

  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Instant local filters (No page reloading, 0ms delay!)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Bulk select state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const submittingRef = useRef(false);

  // Fetch initial tasks once on mount
  const fetchTasks = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/tasks');
      setAllTasks(sortByPriority(data.data));
    } catch {
      addNotification('Error', 'Failed to fetch tasks');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    api.get('/projects').then(r => setProjects(r.data.data)).catch(() => {});
    api.get('/users').then(r => setUsers(r.data.data)).catch(() => {});

    // Silent background poll every 15s to keep list in sync
    const pollId = setInterval(() => {
      fetchTasks(true);
    }, 15000);

    return () => clearInterval(pollId);
  }, []);

  // Keyboard shortcut: Press N to trigger task create modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        setShowModal(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Form Handlers ──────────────────────────────────────────
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!form.deadline || form.deadline < getToday()) {
      addNotification('Validation', 'Deadline must be today or future');
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { data } = await api.post('/tasks', form);
      const created = data.data;

      // Instantly prepend new task optimistically
      setAllTasks(prev => sortByPriority([created, ...prev]));
      addNotification('Success', `Task "${created.title}" created successfully`);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      addNotification('Error', err?.response?.data?.message || 'Could not create task');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const snap = allTasks;
    // Optimistic status update
    setAllTasks(prev => prev.map(t => t._id === id ? { ...t, status } : t));
    try {
      const { data } = await api.put(`/tasks/${id}`, { status });
      setAllTasks(prev => prev.map(t => t._id === id ? data.data : t));
    } catch {
      setAllTasks(snap);
      addNotification('Error', 'Failed to update task status');
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    const snap = allTasks;
    setAllTasks(prev => prev.filter(t => t._id !== id));
    try {
      await api.delete(`/tasks/${id}`);
      addNotification('Deleted', 'Task successfully removed');
    } catch {
      setAllTasks(snap);
      addNotification('Error', 'Failed to delete task');
    }
  };

  // ── Bulk Select Handlers ──────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllFiltered = (filtered: any[]) => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(t => t._id)));
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} selected tasks?`)) return;
    setBulkDeleting(true);
    const ids = [...selected];
    const snap = allTasks;

    // Optimistic local removal
    setAllTasks(prev => prev.filter(t => !selected.has(t._id)));
    setSelected(new Set());

    try {
      await Promise.all(ids.map(id => api.delete(`/tasks/${id}`)));
      addNotification('Bulk Deleted', `${ids.length} tasks removed successfully`);
    } catch {
      setAllTasks(snap);
      addNotification('Error', 'Bulk deletion failed');
    } finally {
      setBulkDeleting(false);
    }
  };

  // ── IN-MEMORY FILTER LOGIC ─────────────────────────────────
  const filteredTasks = allTasks.filter(t => {
    const matchesSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.projectId?.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: filteredTasks.length,
    critical: filteredTasks.filter(t => t.priority === 'critical').length,
    overdue: filteredTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
    done: filteredTasks.filter(t => t.status === 'completed').length,
  };

  const progress = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  return (
    <>
      {/* HEADER SECTION */}
      <div className="page-header" style={{ gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h2 className="page-title">Tasks Management</h2>
          <p className="page-subtitle">{stats.total} matching · {stats.critical} critical · {stats.overdue} overdue</p>
        </div>

        {/* Completion Progress Bar */}
        <div style={{ flex: 1, minWidth: 160, maxWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            <span>Completion Index</span><span>{progress}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#3b82f6,#22c55e)', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div className="task-controls" style={{ gap: 10 }}>
          {/* Instant Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title/project..."
              style={{ paddingLeft: 30, paddingRight: 10, height: 36, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: 180 }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="filter-row" style={{ gap: 8 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 36, borderRadius: 8, fontSize: 12 }}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>

            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ height: 36, borderRadius: 8, fontSize: 12 }}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            {(statusFilter || priorityFilter || search) && (
              <button className="btn btn-ghost" type="button" onClick={resetFilters} style={{ height: 36, padding: '0 10px' }}><X size={13} /> Clear</button>
            )}
          </div>

          {selected.size > 0 && (
            <button className="btn btn-ghost" style={{ color: '#ef4444', borderColor: '#ef4444', height: 36 }} onClick={bulkDelete} disabled={bulkDeleting}>
              <Trash2 size={13} /> Delete {selected.size}
            </button>
          )}

          <button id="add-task-btn" className="btn btn-primary" onClick={() => setShowModal(true)} style={{ height: 36 }} title="Shortcut: Press N">
            <Zap size={14} /> New Task
          </button>
        </div>
      </div>

      {/* TASKS TABLE CARD */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => selectAllFiltered(filteredTasks)}
                    >
                      {filteredTasks.length > 0 && selected.size === filteredTasks.length ? <CheckSquare size={14} color="#3b82f6" /> : <Square size={14} color="#94a3b8" />}
                    </button>
                  </th>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <h3>No tasks matched filters</h3>
                        <p>Try clearing search or press <kbd style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>N</kbd> for a new task.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(t => {
                    const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed';
                    return (
                      <tr key={t._id} style={{ background: selected.has(t._id) ? 'rgba(59, 130, 246, 0.05)' : undefined }}>
                        <td>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => toggleSelect(t._id)}>
                            {selected.has(t._id) ? <CheckSquare size={14} color="#3b82f6" /> : <Square size={14} color="#cbd5e1" />}
                          </button>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate(`/tasks/${t._id}`)}>
                            {isOverdue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} title="Overdue Milestone" />}
                            {t.title}
                          </div>
                          {t.progress > 0 && (
                            <div style={{ marginTop: 4, height: 3, borderRadius: 99, background: '#e2e8f0', maxWidth: 120 }}>
                              <div style={{ height: '100%', width: `${t.progress}%`, background: '#3b82f6', borderRadius: 99 }} />
                            </div>
                          )}
                        </td>
                        <td>{t.projectId?.title || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className="user-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{t.assignedTo?.name?.charAt(0) || '?'}</div>
                            {t.assignedTo?.name || '—'}
                          </div>
                        </td>
                        <td><span className={`badge ${PRIORITY_BADGES[t.priority]}`}>{t.priority}</span></td>
                        <td>
                          <select
                            value={t.status}
                            onChange={e => updateStatus(t._id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff' }}
                          >
                            <option value="todo">Todo</option>
                            <option value="in-progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td style={{ fontSize: 12, color: isOverdue ? '#ef4444' : '#64748b', fontWeight: isOverdue ? 600 : 400 }}>
                          <Clock size={11} style={{ marginRight: 2 }} /> {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/tasks/${t._id}`)}><Eye size={13} /> View</button>
                            <button className="btn-ghost btn-icon" onClick={() => deleteTask(t._id)}><Trash2 size={13} color="#ef4444" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Task</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>✕</button>
            </div>
            <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Project Scope *</label>
                  <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assignee *</label>
                  <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} required>
                    <option value="">Select user</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Hours</label>
                  <input type="number" min={0} value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: +e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline *</label>
                <input type="date" min={getToday()} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                {submitting ? (
                  <><span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2, marginRight: 6 }} />Creating…</>
                ) : (
                  <><Plus size={14} style={{ marginRight: 4 }} />Create Task</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
