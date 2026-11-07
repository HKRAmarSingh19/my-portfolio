
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
  Code2,
  MessageSquare,
  Clock,
  Globe,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { messagesApi } from '../api/client';
import PageTransition from '../components/layout/PageTransition';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import PageHeroBand from '../components/common/PageHeroBand';

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/hkr-amar-singh-270246308/',
    icon: Linkedin,
  },
  {
    label: 'GitHub',
    href: 'https://github.com/HKRAmarSingh19',
    icon: Github,
  },
  {
    label: 'Codolio',
    href: 'https://codolio.com/profile/hkramar73',
    icon: Code2,
  },
];

const DETAILS = [
  {
    label: 'Email Address',
    value: 'hkramarsingh@gmail.com',
    href: 'mailto:hkramarsingh@gmail.com',
    icon: Mail,
  },
  {
    label: 'Response Time',
    value: 'Usually within 24–48 business hours.',
    icon: Clock,
  },
  {
    label: 'Working Hours',
    value: 'Remote / worldwide, IST overlap preferred.',
    icon: Globe,
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
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setFormErrors({});

      try {
        confetti({
          particleCount: 60,
          spread: 65,
          origin: { y: 0.7 },
          colors: ['#4F6DF5', '#6366F1', '#60A5FA', '#A5B4FC'],
        });
      } catch (e) {
        // Submission already succeeded.
      }
    },
  });

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Your name is required';
    }

    if (
      !formData.email.trim() ||
      !/\S+@\S+\.\S+/.test(formData.email)
    ) {
      errors.email = 'Valid email is required';
    }

    if (
      !formData.message.trim() ||
      formData.message.length < 5
    ) {
      errors.message =
        'Please write a message with at least 5 characters';
    }

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

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const fieldClass = (hasError = false) =>
    `w-full rounded-xl border bg-white/80 dark:bg-neutral-950/80 px-4 py-3.5 text-sm text-neutral-900 dark:text-white transition-all duration-200 placeholder:text-neutral-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-neutral-200 dark:border-neutral-700 focus:border-blue-500 hover:border-blue-300 dark:hover:border-blue-800'
    }`;

  return (
    <PageTransition>
      <SEO
        title="Get in Touch & Inquiries"
        description="Send a message to Amar Singh for project collaborations, speaking, or engineering consulting."
      />

      <main className="relative overflow-x-clip pt-28 sm:pt-36 pb-24">

        <PageHeroBand />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* ==================================
              PAGE HEADER
          ================================== */}

          <PageHeader
            eyebrow="Initiate Contact"
            eyebrowIcon={Sparkles}
            title="Let's discuss engineering, architecture, or collaboration."
            lead="Whether you have an upcoming project, a technical question, or an engineering role, my inbox is always open."
          />


          {/* ==================================
              CONTACT LAYOUT
          ================================== */}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">

            {/* ==================================
                CONTACT FORM
            ================================== */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-3xl border border-blue-100 dark:border-blue-950/70 bg-white/95 dark:bg-neutral-900/95 p-6 shadow-xl shadow-blue-950/[0.03] sm:p-9 lg:col-span-7"
            >

              {/* Top accent */}
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />

              {/* Subtle glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.06] blur-3xl"
              />

              {isSuccess ? (

                /* SUCCESS STATE */

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative flex min-h-[480px] flex-col items-center justify-center space-y-5 text-center"
                >

                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-xl shadow-blue-500/20">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>

                  <div className="space-y-2">
                    <span className="font-mono text-xs uppercase tracking-widest text-blue-600 dark:text-blue-400">
                      Message successfully sent
                    </span>

                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white">
                      Message Dispatched
                    </h3>
                  </div>

                  <p className="max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                    Thank you for reaching out. I usually review and reply to all engineering inquiries within 24 to 48 hours.
                  </p>

                  <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 hover:-translate-y-0.5"
                  >
                    Send another message
                  </button>

                </motion.div>

              ) : (

                /* CONTACT FORM */

                <form
                  onSubmit={handleSubmit}
                  className="relative space-y-6"
                >

                  <div className="mb-7 space-y-2">

                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                      Send a message
                    </span>

                    <h3 className="text-xl sm:text-2xl font-display font-bold text-neutral-900 dark:text-white">
                      Tell me what you're thinking.
                    </h3>

                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Fill in the details below and I'll get back to you.
                    </p>

                  </div>

                  {/* Error */}
                  {mutation.isError && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                      <AlertCircle className="h-4 w-4 shrink-0" />

                      <span>
                        {mutation.error?.response?.data?.message ||
                          'Error submitting message. Please try again.'}
                      </span>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                    >
                      Your Name <span className="text-blue-500">*</span>
                    </label>

                    <input
                      id="contact-name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) =>
                        updateField('name', e.target.value)
                      }
                      placeholder="e.g. Hkr. Amar Singh"
                      className={fieldClass(!!formErrors.name)}
                    />

                    {formErrors.name && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                    >
                      Email Address <span className="text-blue-500">*</span>
                    </label>

                    <input
                      id="contact-email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) =>
                        updateField('email', e.target.value)
                      }
                      placeholder="e.g. hkramarsingh@gmail.com"
                      className={fieldClass(!!formErrors.email)}
                    />

                    {formErrors.email && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                    >
                      Subject (Optional)
                    </label>

                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) =>
                        updateField('subject', e.target.value)
                      }
                      placeholder="Project Inquiry / Advisory / Opportunity"
                      className={fieldClass()}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                    >
                      Message <span className="text-blue-500">*</span>
                    </label>

                    <textarea
                      id="contact-message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) =>
                        updateField('message', e.target.value)
                      }
                      placeholder="Tell me about your project, timeline, or requirements..."
                      className={`${fieldClass(!!formErrors.message)} resize-y min-h-[130px]`}
                    />

                    {formErrors.message && (
                      <p className="mt-1.5 text-xs text-red-500">
                        {formErrors.message}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <span className="relative">
                      {mutation.isPending
                        ? 'Sending message...'
                        : 'Transmit Message'}
                    </span>

                    {!mutation.isPending && (
                      <Send className="relative h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    )}

                  </button>

                  <p className="text-center text-[11px] text-neutral-400">
                    Your information is only used to respond to your inquiry.
                  </p>

                </form>
              )}

            </motion.div>


            {/* ==================================
                RIGHT INFORMATION COLUMN
            ================================== */}

            <div className="space-y-6 lg:col-span-5">

              {/* DIRECT CONTACT CARD */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group relative overflow-hidden rounded-3xl border border-blue-100 dark:border-blue-950/70 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/70 dark:from-neutral-900 dark:via-neutral-900 dark:to-blue-950/20 p-6 sm:p-8"
              >

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl"
                />

                <div className="relative space-y-2">

                  <span className="font-mono text-[11px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Direct Inquiries
                  </span>

                  <h3 className="text-xl font-display font-bold text-neutral-900 dark:text-white">
                    Direct Contact Info
                  </h3>

                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Prefer a direct conversation? Reach me here.
                  </p>

                </div>

                <div className="relative mt-7 space-y-6">

                  {DETAILS.map((detail, index) => {
                    const DetailIcon = detail.icon;

                    return (
                      <motion.div
                        key={detail.label}
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.35,
                          delay: index * 0.08,
                        }}
                        className="flex items-start gap-4"
                      >

                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-blue-500/15 transition-transform duration-300 group-hover:scale-105">
                          <DetailIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 pt-0.5">

                          <span className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                            {detail.label}
                          </span>

                          {detail.href ? (
                            <a
                              href={detail.href}
                              className="mt-1 inline-flex items-center gap-1 break-all text-sm font-medium text-neutral-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                            >
                              {detail.value}
                              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          ) : (
                            <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                              {detail.value}
                            </p>
                          )}

                        </div>

                      </motion.div>
                    );
                  })}

                </div>

                {/* Social profiles */}
                <div className="relative mt-8 border-t border-blue-100 dark:border-neutral-800 pt-6">

                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    Social Profiles
                  </span>

                  <div className="mt-4 flex flex-wrap gap-3">

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
                          className="group/social flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-neutral-600 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-blue-500"
                        >
                          <SocialIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {social.label}
                          </span>
                        </a>
                      );
                    })}

                  </div>

                </div>

              </motion.div>


              {/* EXPECTATIONS CARD */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/90 p-6 sm:p-8"
              >

                {/* Status */}
                <div className="flex items-center gap-2">

                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>

                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                    Available for new work
                  </span>

                </div>

                <h3 className="mt-5 flex items-center gap-2 text-base font-display font-bold text-neutral-900 dark:text-white">

                  <MessageSquare className="h-4 w-4 text-blue-500" />

                  What to expect

                </h3>

                <ul className="mt-5 space-y-4">

                  {EXPECTATIONS.map((item, index) => (

                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
                    >

                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />

                      <span>{item}</span>

                    </li>

                  ))}

                </ul>

                <div className="mt-6 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-4">

                  <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
                    Have something interesting in mind? Don't hesitate to reach out. I'd love to hear about it.
                  </p>

                </div>

              </motion.div>

            </div>

          </div>

        </div>

      </main>
    </PageTransition>
  );
};

export default Contact;
