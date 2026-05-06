import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus } from 'react-icons/hi';
import { useProjects } from '../context/ProjectsContext';
import NewProjectModal from '../components/NewProjectModal';
import { initialsFor, avatarColorClass } from '../lib/format';

export default function ProjectsPage() {
  const { projects, loading, createProject } = useProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleCreate = async (payload) => {
    const project = await createProject(payload);
    setOpen(false);
    navigate(`/projects/${project._id}`);
  };

  return (
    <div className="fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Projects</h1>
          <p className="page-meta">Every project you&apos;re a member of, in one place.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <HiOutlinePlus size={14} />
          New project
        </button>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card card-pad">
          <div className="empty">
            <p className="empty-title">No projects yet</p>
            <p className="empty-desc">
              Projects are shared workspaces for you and your team. Create one to get started.
            </p>
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <HiOutlinePlus size={14} /> Create your first project
            </button>
          </div>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => {
            const total = p.taskStats?.total || 0;
            const completed = p.taskStats?.completed || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <article
                key={p._id}
                className="project-card"
                onClick={() => navigate(`/projects/${p._id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/projects/${p._id}`); }}
              >
                <div className="pc-head">
                  <div>
                    <div className="pc-name">{p.name}</div>
                    <div className="pc-desc">{p.description || 'No description provided.'}</div>
                  </div>
                  <span className={`role-pill role-${p.myRole}`}>{p.myRole}</span>
                </div>

                <div>
                  <div className="flex justify-between mb-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>{completed} of {total} done</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="pc-progress">
                    <div className="pc-progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="pc-foot">
                  <div className="avatar-stack">
                    {p.members.slice(0, 4).map((m) => (
                      <span
                        key={m.user._id}
                        className={`avatar avatar-sm ${avatarColorClass(m.user.email)}`}
                        title={m.user.name}
                      >
                        {initialsFor(m.user.name)}
                      </span>
                    ))}
                  </div>
                  <span>{p.members.length} {p.members.length === 1 ? 'member' : 'members'}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && (
        <NewProjectModal onClose={() => setOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
