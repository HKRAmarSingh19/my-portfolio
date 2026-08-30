import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ExternalLink, Sparkles, X, Check, FolderGit2 } from 'lucide-react';
import { projectsApi } from '../../api/client';
import SEO from '../../components/common/SEO';

const emptyProject = {
  title: '',
  description: '',
  longDescription: '',
  category: 'Full Stack',
  techStack: '',
  coverImage: '',
  liveUrl: '',
  repoUrl: '',
  featured: false,
};

export const ManageProjects = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyProject);
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminProjects'],
    queryFn: () => projectsApi.getAll({}),
  });

  const projects = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (newProject) => projectsApi.create(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProjects'] });
      setModalOpen(false);
      setFormState(emptyProject);
      setFeedback('Project created successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedProject }) => projectsApi.update(id, updatedProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProjects'] });
      setModalOpen(false);
      setEditingId(null);
      setFormState(emptyProject);
      setFeedback('Project updated successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProjects'] });
      setFeedback('Project deleted');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState(emptyProject);
    setModalOpen(true);
  };

  const handleOpenEdit = (project) => {
    setEditingId(project._id);
    setFormState({
      title: project.title || '',
      description: project.description || '',
      longDescription: project.longDescription || '',
      category: project.category || 'Full Stack',
      techStack: Array.isArray(project.techStack) ? project.techStack.join(', ') : '',
      coverImage: project.coverImage || '',
      liveUrl: project.liveUrl || '',
      repoUrl: project.repoUrl || '',
      featured: !!project.featured,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      techStack: formState.techStack
        ? formState.techStack.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, updatedProject: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Manage Projects | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Content Management</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Manage Projects
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Project</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <FolderGit2 className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No projects found. Add your first project!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Project</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Tech Stack</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {projects.map((project) => (
                  <tr key={project._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{project.title}</div>
                      <div className="text-neutral-500 text-[11px] line-clamp-1">{project.description}</div>
                    </td>
                    <td className="p-4 font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-800">{project.category}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.techStack?.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-neutral-950 text-[10px] font-mono text-neutral-400">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {project.featured ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          <Sparkles className="w-3 h-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project._id, project.title)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-sans font-bold text-white">
                {editingId ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. Aura Cloud Storage"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Full Stack">Full Stack</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend & Data">Backend & Data</option>
                    <option value="Open Source">Open Source</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.featured}
                      onChange={(e) => setFormState({ ...formState, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-500 bg-neutral-950 border-neutral-800 focus:ring-0"
                    />
                    <span>Highlight on Home (Featured)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Short Description *
                </label>
                <input
                  type="text"
                  required
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="1-2 sentences summarizing the project..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Tech Stack (Comma-separated)
                </label>
                <input
                  type="text"
                  value={formState.techStack}
                  onChange={(e) => setFormState({ ...formState, techStack: e.target.value })}
                  placeholder="React, Node.js, Express, MongoDB, Tailwind CSS"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Live Demo URL
                  </label>
                  <input
                    type="url"
                    value={formState.liveUrl}
                    onChange={(e) => setFormState({ ...formState, liveUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={formState.repoUrl}
                    onChange={(e) => setFormState({ ...formState, repoUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={formState.coverImage}
                  onChange={(e) => setFormState({ ...formState, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Long Description / Case Study (Markdown)
                </label>
                <textarea
                  rows={6}
                  value={formState.longDescription}
                  onChange={(e) => setFormState({ ...formState, longDescription: e.target.value })}
                  placeholder="Detailed architecture notes, technical highlights..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-white text-neutral-950 font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {editingId ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManageProjects;

