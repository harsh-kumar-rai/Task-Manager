import { useMemo } from 'react';
import { HiOutlineFolder, HiOutlineShieldCheck, HiOutlineUserGroup } from 'react-icons/hi';
import { useProjects } from '../context/ProjectsContext';
import { initialsFor, avatarColorClass } from '../lib/format';

export default function TeamsPage() {
  const { projects, loading } = useProjects();

  const teamMembers = useMemo(() => {
    const membersById = new Map();

    projects.forEach((project) => {
      project.members.forEach((member) => {
        const user = member.user;
        if (!user?._id) return;

        const existing = membersById.get(user._id) || {
          user,
          projects: [],
          adminProjects: 0,
          ownedProjects: 0,
        };

        const isOwner = project.owner?._id === user._id;
        existing.projects.push({
          id: project._id,
          name: project.name,
          role: member.role,
          isOwner,
        });
        if (member.role === 'admin') existing.adminProjects += 1;
        if (isOwner) existing.ownedProjects += 1;

        membersById.set(user._id, existing);
      });
    });

    return Array.from(membersById.values())
      .map((member) => ({
        ...member,
        projects: member.projects.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
  }, [projects]);

  const adminsCount = teamMembers.filter((member) => member.adminProjects > 0).length;

  return (
    <div className="fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Team</h1>
          <p className="page-meta">Members from every project you can access, grouped in one panel.</p>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card card-pad">
          <div className="empty">
            <p className="empty-title">No team members yet</p>
            <p className="empty-desc">
              Create or join a project to see teammates here.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="team-summary-grid">
            <div className="team-summary-card">
              <HiOutlineUserGroup />
              <div>
                <span>{teamMembers.length}</span>
                <p>{teamMembers.length === 1 ? 'Member' : 'Members'}</p>
              </div>
            </div>
            <div className="team-summary-card">
              <HiOutlineFolder />
              <div>
                <span>{projects.length}</span>
                <p>{projects.length === 1 ? 'Project' : 'Projects'}</p>
              </div>
            </div>
            <div className="team-summary-card">
              <HiOutlineShieldCheck />
              <div>
                <span>{adminsCount}</span>
                <p>{adminsCount === 1 ? 'Admin' : 'Admins'}</p>
              </div>
            </div>
          </div>

          <div className="card team-panel">
            {teamMembers.length === 0 ? (
              <div className="empty">
                <p className="empty-title">No members found</p>
                <p className="empty-desc">Project members will appear here automatically.</p>
              </div>
            ) : (
              <table className="members-table team-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Projects</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.user._id}>
                      <td>
                        <div className="member-cell">
                          <span className={`avatar ${avatarColorClass(member.user.email)}`}>
                            {initialsFor(member.user.name)}
                          </span>
                          <div>
                            <div className="name">{member.user.name}</div>
                            <div className="email">{member.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="team-project-list">
                          {member.projects.map((project) => (
                            <span key={project.id} className="team-project-chip">
                              {project.name}
                              <span className={`role-pill role-${project.role}`}>
                                {project.isOwner ? 'owner' : project.role}
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="team-access-meta">
                          <span>{member.projects.length} {member.projects.length === 1 ? 'project' : 'projects'}</span>
                          {member.adminProjects > 0 && (
                            <span>{member.adminProjects} admin</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
