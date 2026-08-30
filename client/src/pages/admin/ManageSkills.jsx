import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Layers, X, Check } from 'lucide-react';
import { skillsApi } from '../../api/client';
import SEO from '../../components/common/SEO';

const skillCategories = ['Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'Languages', 'Tools & Workflow'];

const emptySkill = {
  name: '',
  category: 'Frontend',
  proficiency: 85,
  yearsOfExperience: 2,
  featured: true,
};

export const ManageSkills = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptySkill);
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminSkills'],
    queryFn: () => skillsApi.getAll({}),
  });

  const skills = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (newSkill) => skillsApi.create(newSkill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['homeSkills'] });
      setModalOpen(false);
      setFormState(emptySkill);
      setFeedback('Skill added successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedSkill }) => skillsApi.update(id, updatedSkill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['homeSkills'] });
      setModalOpen(false);
      setEditingId(null);
      setFormState(emptySkill);
      setFeedback('Skill updated successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => skillsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSkills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['homeSkills'] });
      setFeedback('Skill deleted');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState(emptySkill);
    setModalOpen(true);
  };

  const handleOpenEdit = (skill) => {
    setEditingId(skill._id);
    setFormState({
      name: skill.name || '',
      category: skill.category || 'Frontend',
      proficiency: skill.proficiency || 85,
      yearsOfExperience: skill.yearsOfExperience || 2,
      featured: !!skill.featured,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, updatedSkill: formState });
    } else {
      createMutation.mutate(formState);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Manage Skills | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Content Management</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Manage Skills & Stack
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Skill</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading skills...</div>
        ) : skills.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No skills found. Add your first competency!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Skill</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Proficiency</th>
                  <th className="p-4 text-center">Experience</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {skills.map((skill) => (
                  <tr key={skill._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 font-semibold text-white text-sm">
                      {skill.name}
                    </td>
                    <td className="p-4 font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[11px]">{skill.category}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-neutral-200 rounded-full" style={{ width: `${skill.proficiency}%` }} />
                        </div>
                        <span className="text-[11px] font-mono text-indigo-400">{skill.proficiency}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-neutral-400 text-xs">
                      {skill.yearsOfExperience || 2}+ yrs
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(skill)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(skill._id, skill.name)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-sans font-bold text-white">
                {editingId ? 'Edit Skill' : 'Add Technical Skill'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Skill Name *
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. React, Docker, GraphQL"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Category *
                </label>
                <select
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {skillCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  <span>Proficiency Rating</span>
                  <span className="text-indigo-400 font-bold">{formState.proficiency}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={formState.proficiency}
                  onChange={(e) => setFormState({ ...formState, proficiency: Number(e.target.value) })}
                  className="w-full accent-indigo-500 bg-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formState.yearsOfExperience}
                  onChange={(e) => setFormState({ ...formState, yearsOfExperience: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
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
                  {editingId ? 'Save Changes' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManageSkills;

