import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Zap, Mail, Lock, User, AlertCircle, Building } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={22} color="#fff" /></div>
          <div className="auth-logo-text">TeamAI</div>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join your team and get started</p>

        {error && <div className="auth-error"><AlertCircle size={14} /> {error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label"><User size={14} /> Full Name</label>
            <input id="reg-name" placeholder="John Doe" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label"><Mail size={14} /> Email</label>
            <input id="reg-email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label"><Lock size={14} /> Password</label>
            <input id="reg-password" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label"><Building size={14} /> Department</label>
            <input id="reg-dept" placeholder="Engineering" value={form.department} onChange={set('department')} />
          </div>
          <button id="reg-submit" className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? <span className="loading-spinner" /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
