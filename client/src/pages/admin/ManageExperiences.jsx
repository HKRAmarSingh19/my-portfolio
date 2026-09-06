import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Briefcase,
  X,
  Check,
  PlusCircle,
  MinusCircle,
  UserRound,
} from 'lucide-react';
import { experienceApi } from '../../api/client';
import { ADMIN_ENTRY_TYPES, EXPERIENCE_TYPE_LABELS } from '../../constants/experienceTypes';
import SEO from '../../components/common/SEO';

const emptyExp = {
  type: 'work',
  title: '',
  role: '',
  organization: '',
  location: '',
  contact: { email: '', phone: '', location: '', linkedin: '', github: '', codolio: '' },
  itemsText: '', // flat skills editor (UI-only, parsed to `items` on submit)
  groups: [], // categorized skills editor: [{ category, skillsText }] (skillsText parsed to `skills` on submit)
  profiles: [], // coding {label,url} rows
  startDate: '',
  endDate: 'Present',
  current: false,
  description: '',
  highlights: '',
  techStack: '',
  link: '',
  order: 0,
};

// Types that reuse the classic scalar timeline fields (title/org/dates/etc).
const SCALAR_TYPES = [
  'work',
  'education',
  'project',
  'achievement',
  'leadership',
  'certification',
];

const CONTACT_FIELDS = [
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'codolio', label: 'Codolio' },
];

// Split a skills/tech/highlight string on commas, semicolons or newlines into a
// clean list, dropping empties.
const splitList = (text) =>
  typeof text === 'string'
    ? text.split(/[,;]|\n/).map((s) => s.trim()).filter(Boolean)
    : [];

export const ManageExperiences = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyExp);
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['experience'],
    queryFn: () => experienceApi.getAll({}),
  });

  const experiences = data?.data?.data || [];

  const invalidateAll = () => {
    // `['experience']` is what Resume.jsx actually queries; `['resumeExperience']`
    // is kept for any legacy consumer. Invalidating both guarantees admin edits
    // reflect on the public page without a manual reload.
    queryClient.invalidateQueries({ queryKey: ['experience'] });
    queryClient.invalidateQueries({ queryKey: ['resumeExperience'] });
  };

  const createMutation = useMutation({
    mutationFn: (newExp) => experienceApi.create(newExp),
    onSuccess: () => {
      invalidateAll();
      setModalOpen(false);
      setFormState(emptyExp);
      setFeedback('Entry added successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedExp }) => experienceApi.update(id, updatedExp),
    onSuccess: () => {
      invalidateAll();
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
      invalidateAll();
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
      ...emptyExp,
      type: exp.type || 'work',
      title: exp.title || '',
      role: exp.role || '',
      organization: exp.organization || '',
      location: exp.location || '',
      contact: { ...emptyExp.contact, ...(exp.contact || {}) },
      itemsText: Array.isArray(exp.items) ? exp.items.join('\n') : '',
      // Backwards compatible: grouped entries hydrate from `groups`; legacy flat
      // entries fall back to a single "General" group so nothing is lost.
      groups: Array.isArray(exp.groups) && exp.groups.length > 0
        ? exp.groups.map((g) => ({ category: g.category || '', skillsText: (g.skills || []).join(', ') }))
        : (Array.isArray(exp.items) && exp.items.length > 0
            ? [{ category: 'General', skillsText: exp.items.join(', ') }]
            : []),
      profiles: Array.isArray(exp.profiles) ? exp.profiles.map((p) => ({ ...p })) : [],
      startDate: exp.startDate || '',
      endDate: exp.endDate || 'Present',
      current: !!exp.current,
      description: exp.description || '',
      highlights: Array.isArray(exp.highlights) ? exp.highlights.join('\n') : '',
      techStack: Array.isArray(exp.techStack) ? exp.techStack.join(', ') : '',
      link: exp.link || '',
      order: exp.order ?? 0,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { itemsText, _id, ...rest } = formState;
    const payload = {
      ...rest,
      highlights: splitList(formState.highlights),
      techStack: splitList(formState.techStack),
      items: splitList(formState.itemsText),
      // Drop untouched empty profile rows so we don't save blank objects.
      profiles: (formState.profiles || []).filter((p) => (p.label || p.url)?.trim()),
      // Categorized skills: keep only rows with a label, split each row's
      // skills list, and drop groups that end up empty.
      groups: (formState.groups || [])
        .map((g) => ({
          category: (g.category || '').trim(),
          skills: splitList(g.skillsText || ''),
        }))
        .filter((g) => g.category && g.skills.length > 0),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, updatedExp: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title || 'this entry'}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const setContact = (key, value) =>
    setFormState((s) => ({ ...s, contact: { ...s.contact, [key]: value } }));

  // Common input class reused across all fields.
  const inputCls =
    'w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500';

  const renderTypeFields = () => {
    switch (formState.type) {
      case 'header':
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="Hkr. Amar Singh"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Role / Headline
                </label>
                <input
                  type="text"
                  value={formState.role}
                  onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                  placeholder="Full-Stack Software Engineer"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {CONTACT_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={formState.contact[f.key] || ''}
                    onChange={(e) => setContact(f.key, e.target.value)}
                    placeholder={f.key === 'email' ? 'name@example.com' : f.label}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          </>
        );

      case 'summary':
        return (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Professional Summary *
            </label>
            <textarea
              rows={5}
              required
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="A short bio summarising who you are and what you build."
              className={`${inputCls} resize-y`}
            />
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Technical Skills (grouped by category)
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormState((s) => ({ ...s, groups: [...s.groups, { category: '', skillsText: '' }] }))
                }
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-300 text-xs hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add group</span>
              </button>
            </div>

            <p className="font-mono text-[10px] text-neutral-500">
              One category per row, skills comma-separated — e.g. Languages: C, Java, Python.
            </p>

            {formState.groups.length === 0 && (
              <div className="p-4 rounded-xl bg-neutral-950 border border-dashed border-neutral-800 text-center text-xs text-neutral-500">
                No groups yet. Add one to start categorising your skills.
              </div>
            )}

            {formState.groups.map((g, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-center">
                <input
                  type="text"
                  value={g.category || ''}
                  onChange={(e) =>
                    setFormState((s) => {
                      const groups = s.groups.map((x, xi) => (xi === i ? { ...x, category: e.target.value } : x));
                      return { ...s, groups };
                    })
                  }
                  placeholder="Category (e.g. Languages)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={g.skillsText || ''}
                  onChange={(e) =>
                    setFormState((s) => {
                      const groups = s.groups.map((x, xi) => (xi === i ? { ...x, skillsText: e.target.value } : x));
                      return { ...s, groups };
                    })
                  }
                  placeholder="C, Java, Python"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormState((s) => ({ ...s, groups: s.groups.filter((_, xi) => xi !== i) }))
                  }
                  className="inline-flex items-center justify-center p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  title="Remove group"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        );

      case 'coding':
        return (
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Coding Profiles *
            </label>
            {formState.profiles.map((p, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 items-center">
                <input
                  type="text"
                  value={p.label || ''}
                  onChange={(e) =>
                    setFormState((s) => {
                      const profiles = s.profiles.map((x, xi) =>
                        xi === i ? { ...x, label: e.target.value } : x
                      );
                      return { ...s, profiles };
                    })
                  }
                  placeholder="Label (e.g. LeetCode)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={p.url || ''}
                  onChange={(e) =>
                    setFormState((s) => {
                      const profiles = s.profiles.map((x, xi) =>
                        xi === i ? { ...x, url: e.target.value } : x
                      );
                      return { ...s, profiles };
                    })
                  }
                  placeholder="https://..."
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormState((s) => ({ ...s, profiles: s.profiles.filter((_, xi) => xi !== i) }))
                  }
                  className="inline-flex items-center justify-center p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  title="Remove profile"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormState((s) => ({ ...s, profiles: [...s.profiles, { label: '', url: '' }] }))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-neutral-700 text-neutral-300 text-xs hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add profile</span>
            </button>
          </div>
        );

      default:
        // work / education / project / achievement / leadership / certification
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Title / Role / Degree *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={formState.organization}
                  onChange={(e) => setFormState({ ...formState, organization: e.target.value })}
                  placeholder="e.g. Google, Stripe"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  placeholder="San Francisco, CA / Remote"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Start Date
                </label>
                <input
                  type="text"
                  value={formState.startDate}
                  onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                  placeholder="2023 or Jan 2023"
                  className={inputCls}
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
                  className={inputCls}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={formState.current}
                onChange={(e) => setFormState({ ...formState, current: e.target.checked })}
                className="h-4 w-4 rounded accent-indigo-500"
              />
              Current position / ongoing
            </label>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Description Summary
              </label>
              <textarea
                rows={2}
                value={formState.description}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Overview of scope and leadership..."
                className={`${inputCls} resize-y`}
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
                placeholder={'Architected REST APIs handling 500k+ daily requests.&#10;Reduced latency by 45%.'}
                className={`${inputCls} font-mono resize-y`}
              />
            </div>

            {SCALAR_TYPES.includes(formState.type) && formState.type !== 'achievement' && formState.type !== 'leadership' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  value={formState.techStack}
                  onChange={(e) => setFormState({ ...formState, techStack: e.target.value })}
                  placeholder="React, Node.js, MongoDB"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                Link (project / certification URL)
              </label>
              <input
                type="text"
                value={formState.link}
                onChange={(e) => setFormState({ ...formState, link: e.target.value })}
                placeholder="https://..."
                className={inputCls}
              />
            </div>
          </>
        );
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
            <p className="text-sm">No resume items found. Add work experience, education, skills and more.</p>
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
                      {item.type === 'header' ? (
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="w-4 h-4 text-indigo-400" />
                          {item.title}
                        </span>
                      ) : (
                        item.title || item.role || '—'
                      )}
                    </td>
                    <td className="p-4 text-neutral-400 font-mono text-xs">
                      {item.organization || item.description?.slice(0, 40) || '—'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono uppercase text-indigo-400">
                        {EXPERIENCE_TYPE_LABELS[item.type] || item.type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-neutral-400 text-xs">
                      {item.startDate || (item.type === 'skills' ? `${(item.items || []).length} skills` : '') || '—'}
                      {item.startDate ? ` — ${item.current ? 'Present' : item.endDate}` : ''}
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
                    onChange={(e) => setFormState((s) => ({ ...s, type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {ADMIN_ENTRY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EXPERIENCE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Order (section position)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formState.order}
                    onChange={(e) => setFormState({ ...formState, order: Number(e.target.value) })}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>
              </div>

              {renderTypeFields()}

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
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-neutral-950 font-semibold text-xs rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
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