import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineClipboardCopy, HiOutlinePlus } from 'react-icons/hi';
import { useProjects } from '../context/ProjectsContext';
import NewProjectModal from '../components/NewProjectModal';
import JoinProjectModal from '../components/JoinProjectModal';
import { initialsFor, avatarColorClass } from '../lib/format';

export default function ProjectsPage() {
  const { projects, loading, createProject, joinProject } = useProjects();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handleCreate = async (payload) => {
    const project = await createProject(payload);
    setOpen(false);
    navigate(`/projects/${project._id}`);
  };

  const handleJoin = async (code) => {
    const project = await joinProject(code);
    setJoinOpen(false);
    navigate(`/projects/${project._id}`);
  };

  const copyProjectCode = async (e, code) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Project code copied');
    } catch {
      toast.error('Could not copy code');
    }
  };

  return (
    <div className="fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Projects</h1>
          <p className="page-meta">Every project you&apos;re a member of, in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
            Join project
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <HiOutlinePlus size={14} />
            New project
          </button>
        </div>
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
              Projects are shared workspaces for you and your team. Create one or join with a code.
            </p>
            <div className="flex gap-2" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setJoinOpen(true)}>
                Join with code
              </button>
              <button className="btn btn-primary" onClick={() => setOpen(true)}>
                <HiOutlinePlus size={14} /> Create your first project
              </button>
            </div>
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

                {p.joinCode && (
                  <div className="join-code-row">
                    <span>Code</span>
                    <div className="join-code-actions">
                      <code>{p.joinCode}</code>
                      <button
                        type="button"
                        className="btn-icon code-copy-btn"
                        onClick={(e) => copyProjectCode(e, p.joinCode)}
                        aria-label={`Copy project code ${p.joinCode}`}
                        title="Copy code"
                      >
                        <HiOutlineClipboardCopy size={14} />
                      </button>
                    </div>
                  </div>
                )}

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

      {joinOpen && (
        <JoinProjectModal onClose={() => setJoinOpen(false)} onSubmit={handleJoin} />
      )}
    </div>
  );
}
