import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  MailOpen,
  Trash2,
  Star,
  Reply,
  Check,
  AlertCircle,
  Send,
  Loader2,
  Clock,
} from 'lucide-react';
import { messagesApi } from '../../api/client';
import SEO from '../../components/common/SEO';

export const Messages = () => {
  const queryClient = useQueryClient();
  const [filterUnread, setFilterUnread] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');

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


  const sendReplyMutation = useMutation({
    mutationFn: ({ id, reply }) => messagesApi.sendReply(id, reply),
    onSuccess: (response) => {
      const updatedMessage = response?.data?.data;
      if (updatedMessage) setSelectedMessage(updatedMessage);
      setReplyText('');
      setReplyError('');
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
    },
    onError: (error) => {
      setReplyError(
        error.response?.data?.message ||
        'Unable to send the reply. Please try again.'
      );
    },
  });

  const handleSelect = (msg) => {
    setSelectedMessage(msg);
    setReplyText('');
    setReplyError('');
    if (!msg.read) {
      toggleReadMutation.mutate({ id: msg._id, read: true });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this message and its saved reply history?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSendReply = (event) => {
    event.preventDefault();
    const trimmedReply = replyText.trim();

    if (!trimmedReply) {
      setReplyError('Please write a reply before sending.');
      return;
    }

    if (!selectedMessage?._id) return;

    setReplyError('');
    sendReplyMutation.mutate({
      id: selectedMessage._id,
      reply: trimmedReply,
    });
  };

  return (
    <div className="space-y-6">
      <SEO title="Messages Inbox | Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Communication
          </span>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mt-1">
            Messages & Inquiries
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            type="button"
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
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800/80 max-h-[700px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-neutral-400">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-neutral-500 space-y-2">
              <Mail className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm">No messages in inbox</p>
            </div>
          ) : (
            messages.map((msg) => (
              <button
                type="button"
                key={msg._id}
                onClick={() => handleSelect(msg)}
                className={`block w-full text-left p-4 cursor-pointer transition-colors ${
                  selectedMessage?._id === msg._id
                    ? 'bg-neutral-800/60 border-l-2 border-indigo-500'
                    : msg.read
                    ? 'hover:bg-neutral-800/30'
                    : 'bg-neutral-950 hover:bg-neutral-800/40 font-medium'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1 gap-3">
                  <span className={`font-semibold truncate ${msg.read ? 'text-neutral-300' : 'text-white'}`}>
                    {msg.name}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-indigo-400 font-mono line-clamp-1">
                    {msg.subject || 'General Inquiry'}
                  </span>
                  {msg.replies?.length > 0 && (
                    <span className="text-[10px] text-emerald-400 shrink-0">
                      {msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {msg.message}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-7 bg-neutral-900 rounded-2xl border border-neutral-800 p-6 sm:p-8 min-w-0">
          {selectedMessage ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toggleReadMutation.mutate({
                        id: selectedMessage._id,
                        read: !selectedMessage.read,
                      })
                    }
                    className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
                    title={selectedMessage.read ? 'Mark as unread' : 'Mark as read'}
                  >
                    {selectedMessage.read ? (
                      <Mail className="w-4 h-4" />
                    ) : (
                      <MailOpen className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStarMutation.mutate(selectedMessage._id)}
                    className={`p-2 rounded-lg bg-neutral-800 ${
                      selectedMessage.starred
                        ? 'text-amber-400'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Star message"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(selectedMessage._id)}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-sans font-bold text-white">
                  {selectedMessage.subject || 'General Inquiry'}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-neutral-400 pt-1">
                  <span className="text-white font-semibold">{selectedMessage.name}</span>
                  <span className="break-all">&lt;{selectedMessage.email}&gt;</span>
                  <span>•</span>
                  <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <section className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                  <Mail className="w-3.5 h-3.5" />
                  Original inquiry
                </div>
                <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800/80 text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedMessage.message}
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Conversation history
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    {selectedMessage.replies?.length || 0} sent replies
                  </span>
                </div>

                {selectedMessage.replies?.length ? (
                  <div className="space-y-3">
                    {selectedMessage.replies.map((item, index) => (
                      <div
                        key={item._id || `${item.sentAt}-${index}`}
                        className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-300">
                            <Send className="w-3.5 h-3.5" />
                            Your reply
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {item.sentAt ? new Date(item.sentAt).toLocaleString() : 'Sent'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                          {item.body}
                        </p>
                        <p className="mt-3 text-[10px] text-neutral-500 break-all">
                          From {item.from} · To {item.to}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-neutral-800 p-4 text-xs text-neutral-500">
                    No replies sent yet. Your replies will appear here after Gmail confirms they were sent.
                  </p>
                )}
              </section>

              <section className="border-t border-neutral-800 pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-semibold text-white">Write a reply</h4>
                </div>


                {replyError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="break-words">{replyError}</span>
                  </div>
                )}

                <form onSubmit={handleSendReply} className="space-y-3">
                  <textarea
                    value={replyText}
                    onChange={(event) => {
                      setReplyText(event.target.value);
                      if (replyError) setReplyError('');
                    }}
                    rows={6}
                    maxLength={10000}
                    placeholder={`Write your reply to ${selectedMessage.name}...`}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-y"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-[10px] text-neutral-500">
                      The email will include the visitor's original inquiry below your reply.
                    </p>
                    <button
                      type="submit"
                      disabled={
                        !replyText.trim() ||
                        sendReplyMutation.isPending
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sendReplyMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          ) : (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-neutral-500 space-y-2">
              <Mail className="w-8 h-8 text-neutral-600" />
              <p className="text-xs font-mono">
                Select a message from the list to view its contents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
