import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaTasks, FaCheckCircle, FaClock, FaPlay,
  FaCalendarAlt, FaTimes, FaUser,
} from 'react-icons/fa';
import apiService from '../../services/api.service';
import { API_ENDPOINTS } from '../../config/api';
import './EmployeeMyTasks.css';
import { DEFAULT_THEME } from '../../constants/workforceThemes';
import { useToast } from '../../hooks/useToast';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return 'No due date';
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const isOverdue = (d, status) => {
  if (!d || status === 'completed') return false;
  return new Date(d) < new Date();
};

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

/* ── Detail Drawer ────────────────────────────────────────────── */
const Drawer = ({ task, onClose, onUpdate, updating, theme }) => {
  if (!task) return null;
  return (
    <div className="mt-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mt-drawer">
        <div className="mt-drawer-hdr">
          <h2>{task.title}</h2>
          <button className="mt-drawer-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mt-drawer-body">
          <div className="mt-drawer-row">
            <div className="mt-drawer-field">
              <label>Priority</label>
              <span className={`mt-priority ${task.priority}`}>{task.priority}</span>
            </div>
            <div className="mt-drawer-field">
              <label>Status</label>
              <span>{task.status.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="mt-drawer-row">
            <div className="mt-drawer-field">
              <label>Due Date</label>
              <span className={isOverdue(task.due_date, task.status) ? 'mt-task-due overdue' : ''}>
                {fmtDate(task.due_date)}
              </span>
            </div>
            <div className="mt-drawer-field">
              <label>Assigned By</label>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaUser size={12} style={{ color: '#9ca3af' }} />
                {task.assigned_by?.name ?? 'System'}
              </span>
            </div>
          </div>
          {task.description && (
            <div>
              <div className="mt-drawer-field" style={{ marginBottom: 8 }}>
                <label>Description</label>
              </div>
              <div className="mt-drawer-desc">{task.description}</div>
            </div>
          )}
          {task.completed_at && (
            <div className="mt-drawer-field">
              <label>Completed At</label>
              <span>{fmtDate(task.completed_at)}</span>
            </div>
          )}
        </div>
        <div className="mt-drawer-footer">
          <button className="mt-drawer-btn cancel" onClick={onClose}>Close</button>
          {task.status === 'pending' && (
            <button
              className="mt-drawer-btn start"
              style={{ background: theme.primary }}
              onClick={() => onUpdate(task.id, 'in_progress')}
              disabled={updating}
            >
              <FaPlay size={11} /> Start Task
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              className="mt-drawer-btn complete"
              onClick={() => onUpdate(task.id, 'completed')}
              disabled={updating}
            >
              <FaCheckCircle size={11} /> Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Task Card (outside component to prevent re-mount on every render) ────── */
const TaskCard = ({ task, primaryColor, onSelect, onUpdate, updating }) => {
  const over = isOverdue(task.due_date, task.status);
  return (
    <div
      className={`mt-task-card ${task.status}`}
      onClick={() => onSelect(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(task)}
    >
      <div className="mt-task-header">
        <div className="mt-task-title">{task.title}</div>
        <span className={`mt-priority ${task.priority}`}>{task.priority}</span>
      </div>
      {task.description && (
        <p className="mt-task-desc">{task.description}</p>
      )}
      <div className="mt-task-footer">
        <span className={`mt-task-due${over ? ' overdue' : ''}`}>
          <FaCalendarAlt size={10} /> {fmtDate(task.due_date)}
        </span>
        {task.status === 'pending' && (
          <button
            className="mt-action-btn start"
            style={{ color: primaryColor }}
            onClick={(e) => { e.stopPropagation(); onUpdate(task.id, 'in_progress'); }}
            disabled={updating}
          >
            <FaPlay size={10} /> Start
          </button>
        )}
        {task.status === 'in_progress' && (
          <button
            className="mt-action-btn complete"
            onClick={(e) => { e.stopPropagation(); onUpdate(task.id, 'completed'); }}
            disabled={updating}
          >
            <FaCheckCircle size={10} /> Complete
          </button>
        )}
        {task.status === 'completed' && (
          <FaCheckCircle size={14} style={{ color: '#16a34a' }} />
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════════════════════════ */
const EmployeeMyTasks = ({ theme = DEFAULT_THEME }) => {
  const t = { ...DEFAULT_THEME, ...theme };

  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const { toast, showToast, clearToast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.get(API_ENDPOINTS.WORKFORCE.MY_TASKS);
      const data = res.data?.data ?? res.data;
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      showToast('error', 'Failed to load tasks. Make sure your employee profile is set up.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateStatus = useCallback(async (taskId, newStatus) => {
    try {
      setUpdating(true);
      const res = await apiService.put(API_ENDPOINTS.WORKFORCE.MY_TASK_UPDATE(taskId), { status: newStatus });
      const updated = res.data?.data ?? res.data;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updated } : t));
      setSelected(prev => prev?.id === taskId ? { ...prev, ...updated } : prev);
      const label = newStatus === 'completed' ? 'completed' : newStatus === 'in_progress' ? 'started' : 'updated';
      showToast('success', `Task ${label} successfully!`);
      if (newStatus === 'completed') setSelected(null);
    } catch {
      showToast('error', 'Failed to update task status. Please try again.');
    } finally {
      setUpdating(false);
    }
  }, [showToast]);

  const { pending, inProgress, completed, progress } = useMemo(() => {
    const sort = (arr) => [...arr].sort((a, b) =>
      (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    );
    const p  = sort(tasks.filter(task => task.status === 'pending'));
    const ip = sort(tasks.filter(task => task.status === 'in_progress'));
    const c  = tasks.filter(task => task.status === 'completed');
    const pct = tasks.length > 0 ? Math.round((c.length / tasks.length) * 100) : 0;
    return { pending: p, inProgress: ip, completed: c, progress: pct };
  }, [tasks]);

  if (loading) {
    return (
      <div className="mt-page">
        <div className="mt-loader">
          <div className="mt-spinner" style={{ borderTopColor: t.primary }} />
          <span>Loading your tasks…</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-page"
      style={{ '--wf-primary': t.primary, '--wf-tint': t.tint, '--wf-tint-border': t.tintBorder }}
    >
      <div className="mt-topbar">
        <div className="mt-topbar-title">
          <h1>My Tasks</h1>
          <p>Manage your daily tasks and shift procedures</p>
        </div>
      </div>

      {toast && (
        <div className={`mt-toast ${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaTimes />}
          {toast.msg}
          <button className="mt-toast-close" onClick={clearToast}>✕</button>
        </div>
      )}

      <div className="mt-progress-card">
        <div className="mt-progress-info">
          <h3>Today's Progress</h3>
          <p>{completed.length} of {tasks.length} tasks complete</p>
        </div>
        <div className="mt-progress-bar-wrap">
          <div className="mt-progress-track">
            <div
              className="mt-progress-fill"
              style={{ width: `${progress}%`, background: t.gradient }}
            />
          </div>
          <div className="mt-progress-pct" style={{ color: t.primary }}>{progress}%</div>
        </div>
      </div>

      <div className="mt-board">
        <div className="mt-col">
          <div className="mt-col-hdr">
            <div className="mt-col-title">
              <FaClock style={{ color: '#9ca3af' }} /> Pending
            </div>
            <span className="mt-col-badge pending">{pending.length}</span>
          </div>
          <div className="mt-col-body">
            {pending.length === 0 ? (
              <div className="mt-empty"><FaTasks size={28} />No pending tasks</div>
            ) : (
              pending.map(task => (
                <TaskCard key={task.id} task={task}
                  primaryColor={t.primary} onSelect={setSelected}
                  onUpdate={updateStatus} updating={updating} />
              ))
            )}
          </div>
        </div>

        <div className="mt-col">
          <div className="mt-col-hdr">
            <div className="mt-col-title">
              <FaPlay style={{ color: '#3b82f6' }} /> In Progress
            </div>
            <span className="mt-col-badge progress">{inProgress.length}</span>
          </div>
          <div className="mt-col-body">
            {inProgress.length === 0 ? (
              <div className="mt-empty"><FaPlay size={28} />No tasks in progress</div>
            ) : (
              inProgress.map(task => (
                <TaskCard key={task.id} task={task}
                  primaryColor={t.primary} onSelect={setSelected}
                  onUpdate={updateStatus} updating={updating} />
              ))
            )}
          </div>
        </div>

        <div className="mt-col">
          <div className="mt-col-hdr">
            <div className="mt-col-title">
              <FaCheckCircle style={{ color: '#16a34a' }} /> Completed
            </div>
            <span className="mt-col-badge completed">{completed.length}</span>
          </div>
          <div className="mt-col-body">
            {completed.length === 0 ? (
              <div className="mt-empty"><FaCheckCircle size={28} />No completed tasks yet</div>
            ) : (
              completed.map(task => (
                <TaskCard key={task.id} task={task}
                  primaryColor={t.primary} onSelect={setSelected}
                  onUpdate={updateStatus} updating={updating} />
              ))
            )}
          </div>
        </div>
      </div>

      {selected && (
        <Drawer
          task={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateStatus}
          updating={updating}
          theme={t}
        />
      )}
    </div>
  );
};

export default EmployeeMyTasks;
