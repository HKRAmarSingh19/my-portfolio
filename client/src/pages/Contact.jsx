import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Github,
  Linkedin,
  Twitter,
  MessageSquare,
  Clock,
  Globe,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { messagesApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';

const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com', icon: Github },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'Twitter', href: 'https://twitter.com', icon: Twitter },
];

const DETAILS = [
  {
    label: 'Email Address',
    value: 'amar@example.com',
    href: 'mailto:amar@example.com',
    icon: Mail,
    accent: 'from-indigo-500 to-blue-500',
  },
  {
    label: 'Response Time',
    value: 'Usually within 24–48 business hours.',
    icon: Clock,
    accent: 'from-violet-500 to-indigo-500',
  },
  {
    label: 'Working Hours',
    value: 'Remote / worldwide, IST overlap preferred.',
    icon: Globe,
    accent: 'from-sky-500 to-indigo-500',
  },
];

const EXPECTATIONS = [
  'A written reply, not an auto-response.',
  'Honest scoping — including when I am not the right fit.',
  'Your details stay private and are never shared.',
];

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => messagesApi.send(data),
    onSuccess: () => {
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormErrors({});
      try {
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.7 },
          // Matches the site accent — these were still the old emerald ramp.
          colors: ['#6366F1', '#818CF8', '#A78BFA', '#C7D2FE'],
        });
      } catch (e) {
        // canvas-confetti throws in environments without a canvas; the
        // submission already succeeded, so there is nothing to recover.
      }
    },
  });

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Your name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      errors.email = 'Valid email is required';
    if (!formData.message.trim() || formData.message.length < 5)
      errors.message = 'Please write a message with at least 5 characters';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    mutation.mutate(formData);
  };

  const fieldClass = (hasError) =>
    `w-full rounded-xl border bg-neutral-50 px-4 py-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:bg-neutral-950 dark:text-white ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-neutral-200 focus:border-indigo-500 dark:border-neutral-800'
    }`;

  return (
    <PageTransition>
      <SEO
        title="Get in Touch & Inquiries"
        description="Send a message to Amar Singh for project collaborations, speaking, or engineering consulting."
      />

      <div className="relative overflow-x-clip pt-28 sm:pt-36 pb-20">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <PageHeader
            eyebrow="Initiate Contact"
            eyebrowIcon={Sparkles}
            title="Let's discuss engineering, architecture, or collaboration."
            lead="Whether you have an upcoming project, a technical question, or an engineering role, my inbox is always open."
          />

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-6 shadow-sm sm:p-10 lg:col-span-7">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 py-12 text-center"
                >
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-glow">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
                    Message Dispatched
                  </h3>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Thank you for reaching out. I usually review and reply to all engineering
                    inquiries within 24 to 48 hours.
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-4 rounded-xl bg-neutral-100 px-5 py-2.5 font-mono text-xs text-neutral-800 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {mutation.isError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-500">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        {mutation.error?.response?.data?.message ||
                          'Error submitting message. Please try again.'}
                      </span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-neutral-500"
                    >
                      Your Name <span className="text-indigo-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Jordan Lee"
                      className={fieldClass(formErrors.name)}
                    />
                    {formErrors.name && (
                      <p className="mt-1 font-mono text-[11px] text-red-500">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-neutral-500"
                    >
                      Email Address <span className="text-indigo-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jordan@company.com"
                      className={fieldClass(formErrors.email)}
                    />
                    {formErrors.email && (
                      <p className="mt-1 font-mono text-[11px] text-red-500">{formErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-neutral-500"
                    >
                      Subject (Optional)
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Project Inquiry / Advisory / Opportunity"
                      className={fieldClass(false)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-neutral-500"
                    >
                      Message <span className="text-indigo-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell me about your project, timeline, or requirements..."
                      className={`${fieldClass(formErrors.message)} resize-y`}
                    />
                    {formErrors.message && (
                      <p className="mt-1 font-mono text-[11px] text-red-500">
                        {formErrors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {mutation.isPending ? (
                      <span>Sending message...</span>
                    ) : (
                      <>
                        <span>Transmit Message</span>
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="relative space-y-6 overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50 dark:bg-neutral-900/60 p-6 sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"
                />

                <div className="relative space-y-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Direct Inquiries
                  </span>
                  <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-white">
                    Direct Contact Info
                  </h3>
                </div>

                <div className="relative space-y-4">
                  {DETAILS.map((detail) => {
                    const DetailIcon = detail.icon;
                    return (
                      <div key={detail.label} className="flex items-start gap-3">
                        <div
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${detail.accent} text-white`}
                        >
                          <DetailIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                            {detail.label}
                          </span>
                          {detail.href ? (
                            <a
                              href={detail.href}
                              className="text-sm font-medium text-neutral-900 transition-colors hover:text-indigo-500 dark:text-white"
                            >
                              {detail.value}
                            </a>
                          ) : (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {detail.value}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="relative space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <span className="block font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                    Social Profiles
                  </span>
                  <div className="flex items-center gap-2">
                    {SOCIALS.map((social) => {
                      const SocialIcon = social.icon;
                      return (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          title={social.label}
                          aria-label={social.label}
                          className="rounded-xl border border-neutral-200 bg-white p-2.5 text-neutral-700 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:text-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                          <SocialIcon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-neutral-900 p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  {/* Green is reserved for live status across the site, so the
                      availability dot stays green even on an indigo page. */}
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                    Available for new work
                  </span>
                </div>

                <h3 className="flex items-center gap-2 text-sm font-display font-bold text-neutral-900 dark:text-white">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  What to expect
                </h3>

                <ul className="space-y-2.5">
                  {EXPECTATIONS.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
export default Contact;
