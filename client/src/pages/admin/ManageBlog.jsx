import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, BookOpen, X, Check, Globe } from 'lucide-react';
import { blogApi } from '../../api/client';
import MarkdownEditor from '../../components/admin/MarkdownEditor';
import SEO from '../../components/common/SEO';

const emptyPost = {
  title: '',
  excerpt: '',
  content: '# Article Title\n\nWrite your markdown content here...',
  coverImage: '',
  tags: '',
  published: false,
};

export const ManageBlog = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyPost);
  const [feedback, setFeedback] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminBlogPosts'],
    queryFn: () => blogApi.getAll({ publishedOnly: 'false' }),
  });

  const posts = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: (newPost) => blogApi.create(newPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      queryClient.invalidateQueries({ queryKey: ['recentBlog'] });
      setModalOpen(false);
      setFormState(emptyPost);
      setFeedback('Blog post created successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedPost }) => blogApi.update(id, updatedPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      queryClient.invalidateQueries({ queryKey: ['recentBlog'] });
      setModalOpen(false);
      setEditingId(null);
      setFormState(emptyPost);
      setFeedback('Blog post updated successfully');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => blogApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      queryClient.invalidateQueries({ queryKey: ['recentBlog'] });
      setFeedback('Blog post deleted');
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormState(emptyPost);
    setModalOpen(true);
  };

  const handleOpenEdit = (post) => {
    setEditingId(post._id);
    setFormState({
      title: post.title || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      published: !!post.published,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formState,
      tags: formState.tags
        ? formState.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, updatedPost: payload });
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
      <SEO title="Manage Blog Posts | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Content Management</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Manage Blog Posts
          </h1>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Post</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
          ✓ {feedback}
        </div>
      )}

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading articles...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-sm">No blog posts found. Write your first article!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950/80 uppercase text-[11px] font-mono text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="p-4">Title & Excerpt</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Stats</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {posts.map((post) => (
                  <tr key={post._id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 max-w-sm">
                      <div className="font-semibold text-white text-sm">{post.title}</div>
                      <div className="text-neutral-500 text-[11px] line-clamp-1">{post.excerpt}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {post.tags?.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-neutral-950 text-[10px] font-mono text-indigo-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          <Globe className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center font-mono text-neutral-400 text-[11px]">
                      {post.views || 0} views • {post.readingTime || 5}m
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(post._id, post.title)}
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
          <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h3 className="text-lg font-sans font-bold text-white">
                {editingId ? 'Edit Blog Post' : 'Compose New Article'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="e.g. The Architecture of Minimalist Web Applications"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Excerpt / Lead Summary *
                </label>
                <input
                  type="text"
                  required
                  value={formState.excerpt}
                  onChange={(e) => setFormState({ ...formState, excerpt: e.target.value })}
                  placeholder="A concise synopsis to display in search and social cards..."
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formState.tags}
                    onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                    placeholder="React, Architecture, MERN, Performance"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Cover Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formState.coverImage}
                    onChange={(e) => setFormState({ ...formState, coverImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Markdown Content
                </label>
                <MarkdownEditor
                  value={formState.content}
                  onChange={(val) => setFormState({ ...formState, content: val })}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-mono text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.published}
                    onChange={(e) => setFormState({ ...formState, published: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-500 bg-neutral-950 border-neutral-800 focus:ring-0"
                  />
                  <span>Publish immediately to public blog</span>
                </label>
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
                  {editingId ? 'Update Post' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManageBlog;
