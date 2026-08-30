import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MailOpen, Trash2, Star, StarOff, Reply, Check, AlertCircle, Clock } from 'lucide-react';
import { messagesApi } from '../../api/client';
import SEO from '../../components/common/SEO';

export const Messages = () => {
  const queryClient = useQueryClient();
  const [filterUnread, setFilterUnread] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminMessages', filterUnread],
    queryFn: () => messagesApi.getAll({ unreadOnly: filterUnread ? 'true' : undefined }),
  });

  const messages = data?.data?.data || [];

  const toggleReadMutation = useMutation({
    mutationFn: ({ id, read }) => messagesApi.toggleRead(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: (id) => messagesApi.toggleStar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => messagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      if (selectedMessage?._id) setSelectedMessage(null);
    },
  });

  const handleSelect = (msg) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      toggleReadMutation.mutate({ id: msg._id, read: true });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this message?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Messages Inbox | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Communication</span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Messages & Inquiries
          </h1>
        </div>

        <button
          onClick={() => setFilterUnread(!filterUnread)}
          className={`px-3 py-2 rounded-xl text-xs font-mono border transition-colors ${
            filterUnread
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-semibold'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          {filterUnread ? 'Showing Unread Only' : 'Show All Messages'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800/80 max-h-[700px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-neutral-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm">No messages in inbox</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                onClick={() => handleSelect(msg)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedMessage?._id === msg._id
                    ? 'bg-neutral-800/60 border-l-2 border-indigo-500'
                    : msg.read
                    ? 'hover:bg-neutral-800/30'
                    : 'bg-neutral-950 hover:bg-neutral-800/40 font-medium'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-semibold ${msg.read ? 'text-neutral-300' : 'text-white'}`}>
                    {msg.name}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-xs text-indigo-400 font-mono line-clamp-1 mb-1">
                  {msg.subject || 'General Inquiry'}
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {msg.message}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-7 bg-neutral-900 rounded-2xl border border-neutral-800 p-6 sm:p-8">
          {selectedMessage ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleReadMutation.mutate({ id: selectedMessage._id, read: !selectedMessage.read })}
                    className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                    title={selectedMessage.read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {selectedMessage.read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => toggleStarMutation.mutate(selectedMessage._id)}
                    className={`p-2 rounded-lg bg-neutral-800 ${
                      selectedMessage.starred ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Star message"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject || 'Your Inquiry')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-neutral-950 font-semibold text-xs hover:bg-neutral-200 transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>
                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-sans font-bold text-white">
                  {selectedMessage.subject || 'General Inquiry'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 pt-1">
                  <span className="text-white font-semibold">{selectedMessage.name}</span>
                  <span>&lt;{selectedMessage.email}&gt;</span>
                  <span>•</span>
                  <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.message}
              </div>
            </div>
          ) : (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-neutral-500 space-y-2">
              <Mail className="w-8 h-8 text-neutral-600" />
              <p className="text-xs font-mono">Select a message from the list to view its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Messages;
