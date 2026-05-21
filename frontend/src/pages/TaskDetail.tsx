import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { Clock, User, ArrowLeft, ImagePlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject('Unable to read file');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
    if (file.size > 5_000_000) { alert('Please choose an image smaller than 5MB.'); return; }

    setUploading(true);
    try {
      const fileUrl = await toBase64(file);
      await api.post(`/tasks/${taskId}/attachments`, { fileName: file.name, fileUrl, fileSize: file.size });
      addNotification('Attachment uploaded', `Uploaded ${file.name}`);
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.data);
    } catch (err) {
      console.error('Upload failed', err);
      addNotification('Attachment upload failed', 'Unable to upload attachment');
      alert('Unable to upload attachment.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!taskId) return;
    if (!confirm('Delete this attachment?')) return;
    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      addNotification('Attachment deleted', 'Attachment removed');
      const { data } = await api.get(`/tasks/${taskId}`);
      setTask(data.data);
    } catch (err) {
      console.error('Delete attachment failed', err);
      alert('Unable to delete attachment.');
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAttachmentSelect} style={{ display: 'none' }} />
            <button className="btn btn-secondary" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}><ImagePlus size={14} /> Upload image</button>
            {uploading && <span style={{ marginLeft: 8, color: '#64748b' }}>Uploading…</span>}
          </div>

          {task.attachments?.length ? (
            <div className="gallery-grid" style={{ marginTop: 12 }}>
              {task.attachments.map((attachment: any) => (
                <div className="gallery-card" key={attachment._id} style={{ position: 'relative' }}>
                  <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
                    <img src={attachment.fileUrl} alt={attachment.fileName} />
                  </a>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(attachment._id); }} title="Delete attachment">Delete</button>
                  </div>
                  <div className="gallery-meta">{attachment.fileName}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 12 }}><h3>No attachments</h3><p>Upload an image using the button above.</p></div>
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
