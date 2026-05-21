import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { Clock, User, ArrowLeft, ImagePlus, LayoutDashboard } from 'lucide-react';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    api.get(`/tasks/${taskId}`)
      .then((res) => setTask(res.data.data))
      .catch((err) => {
        console.error('Failed to load task details', err);
        alert('Unable to load task details.');
      })
      .finally(() => setLoading(false));
  }, [taskId]);

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
          <h3>Task not found</h3>
          <p>We couldn't find that task. It may have been deleted or moved.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button className="btn btn-ghost" onClick={() => navigate('/tasks')}><ArrowLeft size={16} /> Back to Tasks</button>
          <h2 className="page-title" style={{ marginTop: 16 }}>{task.title}</h2>
          <p className="page-subtitle">{task.projectId?.title || 'No project assigned'}</p>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 20 }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p className="form-label">Status</p>
              <span className={`badge ${task.status === 'completed' ? 'badge-green' : task.status === 'in-progress' ? 'badge-blue' : task.status === 'review' ? 'badge-yellow' : 'badge-gray'}`}>{task.status}</span>
            </div>
            <div>
              <p className="form-label">Priority</p>
              <span className={`badge ${task.priority === 'critical' ? 'badge-red' : task.priority === 'high' ? 'badge-yellow' : task.priority === 'medium' ? 'badge-blue' : 'badge-gray'}`}>{task.priority}</span>
            </div>
            <div>
              <p className="form-label">Assignee</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div className="user-avatar">{task.assignedTo?.name?.charAt(0) || '?'}</div>
                <span>{task.assignedTo?.name || 'Unassigned'}</span>
              </div>
            </div>
            <div>
              <p className="form-label">Deadline</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><Clock size={14} /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        </section>

        <section>
          <h3>Description</h3>
          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#475569' }}>{task.description || 'No description provided.'}</p>
        </section>

        <section>
          <h3>Attachments</h3>
          {task.attachments?.length ? (
            <div className="gallery-grid">
              {task.attachments.map((attachment: any) => (
                <div className="gallery-card" key={attachment._id}>
                  <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
                    <img src={attachment.fileUrl} alt={attachment.fileName} style={{ cursor: 'pointer' }} />
                  </a>
                  <div className="gallery-meta">{attachment.fileName}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h3>No attachments</h3><p>Upload an image when editing the task.</p></div>
          )}
        </section>

        <section>
          <h3>Activity</h3>
          {task.activityLogs?.length ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {task.activityLogs.map((entry: any) => (
                <div key={entry._id} style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 14, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <strong>{entry.action}</strong>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{ marginTop: 8, color: '#475569' }}>By {entry.user?.name || 'Unknown'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><h3>No activity yet</h3><p>Activity will appear once updates are made.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}
