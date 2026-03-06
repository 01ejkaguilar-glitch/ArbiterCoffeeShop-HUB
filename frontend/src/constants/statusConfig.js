/**
 * Canonical status configuration for all entity types.
 * Single source of truth - replaces ~14 duplicated getStatusBadge functions.
 */

export const ORDER_STATUS = {
  pending:                { variant: 'warning',   label: 'Pending' },
  confirmed:              { variant: 'info',      label: 'Confirmed' },
  preparing:              { variant: 'primary',   label: 'Preparing' },
  ready:                  { variant: 'success',   label: 'Ready' },
  completed:              { variant: 'success',   label: 'Completed' },
  cancelled:              { variant: 'danger',    label: 'Cancelled' },
  cancellation_requested: { variant: 'warning',   label: 'Cancel Requested' },
};

export const LEAVE_STATUS = {
  pending:   { variant: 'warning',   label: 'Pending' },
  approved:  { variant: 'success',   label: 'Approved' },
  rejected:  { variant: 'danger',    label: 'Rejected' },
  cancelled: { variant: 'secondary', label: 'Cancelled' },
};

export const ATTENDANCE_STATUS = {
  present:  { variant: 'success',   label: 'Present' },
  absent:   { variant: 'danger',    label: 'Absent' },
  late:     { variant: 'warning',   label: 'Late' },
  half_day: { variant: 'info',      label: 'Half Day' },
  on_leave: { variant: 'secondary', label: 'On Leave' },
};

export const SHIFT_STATUS = {
  scheduled: { variant: 'primary',   label: 'Scheduled' },
  confirmed: { variant: 'success',   label: 'Confirmed' },
  completed: { variant: 'secondary', label: 'Completed' },
  cancelled: { variant: 'danger',    label: 'Cancelled' },
  swapped:   { variant: 'info',      label: 'Swapped' },
};

export const SHIFT_TYPE = {
  morning:   { variant: 'warning',   label: 'Morning' },
  afternoon: { variant: 'info',      label: 'Afternoon' },
  evening:   { variant: 'dark',      label: 'Evening' },
  night:     { variant: 'secondary', label: 'Night' },
  split:     { variant: 'primary',   label: 'Split' },
};

export const TASK_STATUS = {
  pending:     { variant: 'secondary', label: 'Pending' },
  in_progress: { variant: 'primary',   label: 'In Progress' },
  completed:   { variant: 'success',   label: 'Completed' },
  cancelled:   { variant: 'danger',    label: 'Cancelled' },
};

export const TASK_PRIORITY = {
  low:    { variant: 'secondary', label: 'Low' },
  medium: { variant: 'warning',   label: 'Medium' },
  high:   { variant: 'danger',    label: 'High' },
  urgent: { variant: 'danger',    label: 'Urgent' },
};

export const LEAVE_TYPE = {
  annual:    { variant: 'success',   label: 'Annual Leave' },
  sick:      { variant: 'danger',    label: 'Sick Leave' },
  personal:  { variant: 'info',      label: 'Personal Leave' },
  maternity: { variant: 'warning',   label: 'Maternity Leave' },
  paternity: { variant: 'warning',   label: 'Paternity Leave' },
  emergency: { variant: 'danger',    label: 'Emergency Leave' },
  other:     { variant: 'secondary', label: 'Other' },
};

export const EMPLOYEE_STATUS = {
  active:     { variant: 'success',   label: 'Active' },
  on_leave:   { variant: 'warning',   label: 'On Leave' },
  suspended:  { variant: 'danger',    label: 'Suspended' },
  terminated: { variant: 'dark',      label: 'Terminated' },
};

const STATUS_MAPS = {
  order: ORDER_STATUS,
  leave: LEAVE_STATUS,
  attendance: ATTENDANCE_STATUS,
  shift: SHIFT_STATUS,
  shiftType: SHIFT_TYPE,
  leaveType: LEAVE_TYPE,
  task: TASK_STATUS,
  priority: TASK_PRIORITY,
  employee: EMPLOYEE_STATUS,
};

/**
 * Get status config by type and status value.
 * @param {string} type - 'order', 'leave', 'attendance', 'shift', 'shiftType', 'task', 'priority', 'employee'
 * @param {string} status - The status value (e.g. 'pending', 'completed')
 * @returns {{ variant: string, label: string }}
 */
export function getStatusConfig(type, status) {
  const map = STATUS_MAPS[type];
  if (!map) return { variant: 'secondary', label: status || 'Unknown' };
  return map[status] || { variant: 'secondary', label: status || 'Unknown' };
}
