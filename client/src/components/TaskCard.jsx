import { HiOutlineCalendar } from 'react-icons/hi';
import { initialsFor, avatarColorClass, formatDate, isOverdue } from '../lib/format';

export default function TaskCard({ task, onClick }) {
  const overdue = isOverdue(task.dueDate, task.status);
  const completed = task.status === 'completed';

  return (
    <article
      className={`task-card ${completed ? 'completed' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="task-title">{task.title}</div>

      {(task.labels?.length > 0 || task.priority !== 'medium') && (
        <div className="task-meta-row">
          {task.priority && task.priority !== 'medium' && (
            <span className={`priority priority-${task.priority}`}>
              <span className="priority-dot" />
              {task.priority}
            </span>
          )}
          {task.labels?.map((label) => (
            <span key={label._id} className="label-chip">
              <span className="label-dot" style={{ background: label.color }} />
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="task-foot">
        {task.dueDate ? (
          <span className={`task-due ${overdue ? 'overdue' : ''}`}>
            <HiOutlineCalendar size={12} />
            {formatDate(task.dueDate)}
          </span>
        ) : <span />}
        {task.assignedTo ? (
          <span
            className={`avatar avatar-sm ${avatarColorClass(task.assignedTo.email || task.assignedTo._id)}`}
            title={task.assignedTo.name}
          >
            {initialsFor(task.assignedTo.name)}
          </span>
        ) : (
          <span className="text-muted" style={{ fontSize: 11 }}>Unassigned</span>
        )}
      </div>
    </article>
  );
}
