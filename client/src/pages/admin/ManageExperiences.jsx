import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Briefcase, X, Check } from 'lucide-react';
import { experienceApi } from '../../api/client';
import SEO from '../../components/common/SEO';

const emptyExp = {
  type: 'work',
  title: '',
  organization: '',
  location: '',
  startDate: '',
  endDate: 'Present',
  current: false,
  description: '',
  highlights: '',
  techStack: '',
};

export const ManageExperiences = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyExp);
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminExperiences'],
    queryFn: () => experienceApi.getAll({}),
  });

  const experiences = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (newExp) => experienceApi.create(newExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExperiences'] });
      queryClient.invalidateQueries({ queryKey: ['resumeExperience'] });
      setModalOpen(false);
      setFormState(emptyExp);
      setFeedback('Entry added successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedExp }) => experienceApi.update(id, updatedExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExperiences'] });
      queryClient.invalidateQueries({ queryKey: ['resumeExperience'] });
      setModalOpen(false);
      setEditingId(null);
      setFormState(emptyExp);
      setFeedback('Entry updated successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => experienceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExperiences'] });
      queryClient.invalidateQueries({ queryKey: ['resumeExperience'] });
      setFeedback('Entry deleted');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState(emptyExp);
    setModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingId(exp._id);
    setFormState({
      type: exp.type || 'work',
      title: exp.title || '',
      organization: exp.organization || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || 'Present',
      current: !!exp.current,
      description: exp.description || '',
      highlights: Array.isArray(exp.highlights) ? exp.highlights.join('\n') : '',
      techStack: Array.isArray(exp.techStack) ? exp.techStack.join(', ') : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      highlights: formState.highlights
        ? formState.highlights.split('\n').map((h) => h.trim()).filter(Boolean)
        : [],
      techStack: formState.techStack
        ? formState.techStack.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, updatedExp: payload });
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
      <SEO title="Manage Experience & Resume | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Content Management</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Manage Resume & Experience
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resume Entry</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading experiences...</div>
        ) : experiences.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <Briefcase className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No resume items found. Add your work experience or education!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Title / Role</th>
                  <th className="p-4">Organization</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Period</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {experiences.map((item) => (
                  <tr key={item._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white text-sm">
                      {item.title}
                    </td>
                    <td className="p-4 text-neutral-400 font-mono text-xs">
                      {item.organization}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono uppercase text-indigo-400">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-neutral-400 text-xs">
                      {item.startDate} — {item.current ? 'Present' : item.endDate}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.title)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-sans font-bold text-white">
                {editingId ? 'Edit Resume Entry' : 'Add Resume Entry'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Entry Type
                  </label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="work">Work Experience</option>
                    <option value="education">Education</option>
                    <option value="certification">Certification</option>
                    <option value="award">Honor / Award</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Role / Degree Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Company / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.organization}
                    onChange={(e) => setFormState({ ...formState, organization: e.target.value })}
                    placeholder="e.g. Google, Stripe"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formState.location}
                    onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                    placeholder="San Francisco, CA / Remote"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.startDate}
                    onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                    placeholder="2023 or Jan 2023"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="text"
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    placeholder="Present or 2024"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Description Summary
                </label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Overview of scope and leadership..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Bullet Point Highlights (One per line)
                </label>
                <textarea
                  rows={3}
                  value={formState.highlights}
                  onChange={(e) => setFormState({ ...formState, highlights: e.target.value })}
                  placeholder="Architected REST APIs handling 500k+ daily requests.&#10;Reduced latency by 45%."
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
                  {editingId ? 'Save Changes' : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManageExperiences;
