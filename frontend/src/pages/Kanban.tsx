import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { GripVertical, Clock, User, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',      color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review',     label: 'Review',      color: '#f59e0b' },
  { id: 'completed',  label: 'Completed',   color: '#22c55e' },
];

const PRIORITY_BADGES: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red' };

export default function Kanban() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null); // Prevent stale closure

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.data);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDragStart = (id: string) => {
    draggingRef.current = id;
    setDraggingId(id);
  };

  const handleDragEnd = () => {
    draggingRef.current = null;
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDrop = async (status: string) => {
    const id = draggingRef.current;
    if (!id) return;
    const prevStatus = tasks.find(t => t._id === id)?.status;
    if (prevStatus === status) { handleDragEnd(); return; }

    // Optimistic
    setTasks(prev => prev.map(t => t._id === id ? { ...t, status } : t));
    handleDragEnd();
    try {
      await api.put(`/tasks/${id}`, { status });
    } catch {
      // revert
      setTasks(prev => prev.map(t => t._id === id ? { ...t, status: prevStatus } : t));
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="page-title">Kanban Board</h2>
          <p className="page-subtitle">Drag &amp; drop tasks between columns</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
          <Plus size={14} /> New Task
        </button>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          const isTarget = dropTarget === col.id;
          return (
            <div
              key={col.id}
              className="kanban-col"
              style={{ outline: isTarget ? `2px dashed ${col.color}` : 'none', transition: 'outline .15s' }}
              onDragOver={e => { e.preventDefault(); setDropTarget(col.id); }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span className="kanban-col-title">{col.label}</span>
                </div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>

              {colTasks.map(t => {
                const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed';
                return (
                  <div
                    key={t._id}
                    className="kanban-card"
                    draggable
                    onDragStart={() => handleDragStart(t._id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggingId === t._id ? 0.4 : 1,
                      cursor: 'grab',
                      borderLeft: `3px solid ${col.color}`,
                      transition: 'opacity .15s, box-shadow .15s',
                    }}
                    onClick={() => navigate(`/tasks/${t._id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <GripVertical size={14} color="#cbd5e1" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="kanban-card-title" style={{ color: isOverdue ? '#ef4444' : undefined }}>
                          {t.title}
                        </div>
                        {t.progress > 0 && (
                          <div style={{ margin: '5px 0', height: 3, borderRadius: 99, background: '#e2e8f0' }}>
                            <div style={{ height: '100%', width: `${t.progress}%`, background: col.color, borderRadius: 99 }} />
                          </div>
                        )}
                        <div className="kanban-card-meta">
                          <span className={`badge ${PRIORITY_BADGES[t.priority]}`}>{t.priority}</span>
                          {t.assignedTo?.name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <User size={10} />{t.assignedTo.name}
                            </span>
                          )}
                          {t.deadline && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: isOverdue ? '#ef4444' : undefined }}>
                              <Clock size={10} />{new Date(t.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {colTasks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13, border: '2px dashed #e2e8f0', borderRadius: 8, margin: 4 }}>
                  Drop here
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
