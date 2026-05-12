import { useEffect, useState } from 'react';
import api from '../lib/api';
import { GripVertical, Clock, User } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Review', color: '#f59e0b' },
  { id: 'completed', label: 'Completed', color: '#22c55e' },
];

const PRIORITY_BADGES: Record<string, string> = { 'low': 'badge-gray', 'medium': 'badge-blue', 'high': 'badge-yellow', 'critical': 'badge-red' };

export default function Kanban() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    api.get('/tasks').then(r => { setTasks(r.data.data); setLoading(false); });
  }, []);

  const handleDragStart = (id: string) => setDragging(id);

  const handleDrop = async (status: string) => {
    if (!dragging) return;
    await api.put(`/tasks/${dragging}`, { status });
    setTasks(prev => prev.map(t => t._id === dragging ? { ...t, status } : t));
    setDragging(null);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="loading-spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <div><h2 className="page-title">Kanban Board</h2><p className="page-subtitle">Drag tasks between columns</p></div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div className="kanban-col" key={col.id}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}>
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span className="kanban-col-title">{col.label}</span>
                </div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>

              {colTasks.map(t => (
                <div className="kanban-card" key={t._id} draggable
                  onDragStart={() => handleDragStart(t._id)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <GripVertical size={14} color="#cbd5e1" style={{ marginTop: 2, cursor: 'grab' }} />
                    <div style={{ flex: 1 }}>
                      <div className="kanban-card-title">{t.title}</div>
                      <div className="kanban-card-meta">
                        <span className={`badge ${PRIORITY_BADGES[t.priority]}`}>{t.priority}</span>
                        {t.assignedTo?.name && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><User size={10} />{t.assignedTo.name}</span>}
                        {t.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{new Date(t.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>No tasks</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
