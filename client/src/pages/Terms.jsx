import React from "react";

const Terms = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: (
        <p>
          By accessing this website, you agree to follow these terms.
          If you do not agree, please discontinue using the website.
        </p>
      ),
    },
    {
      title: "2. Website Purpose",
      content: (
        <>
          <p>
            This website is a personal portfolio showcasing professional
            skills, projects, technical interests, and articles.
          </p>
          <p>Visitors can:</p>
          <ul>
            <li>Explore projects and technical work.</li>
            <li>Learn about professional skills.</li>
            <li>Read published articles and blogs.</li>
            <li>Contact the website owner.</li>
          </ul>
        </>
      ),
    },
    {
      title: "3. Acceptable Use",
      content: (
        <>
          <p>You agree not to:</p>
          <ul>
            <li>Use this website for unlawful activities.</li>
            <li>Attempt unauthorized access to administrative features or systems.</li>
            <li>Upload malicious code or harmful content.</li>
            <li>Abuse contact forms or communication features.</li>
            <li>Interfere with website security or availability.</li>
          </ul>
        </>
      ),
    },
    {
      title: "4. Intellectual Property",
      content: (
        <p>
          Unless otherwise stated, original website content, designs,
          graphics, and written materials belong to HKR Amar Singh.
          Third-party trademarks, logos, libraries, and resources remain
          the property of their respective owners. Open-source projects
          are subject to their respective licenses.
        </p>
      ),
    },
    {
      title: "5. Projects and Demonstrations",
      content: (
        <p>
          Projects and technical demonstrations are provided for
          informational and portfolio purposes. Features and availability
          may change without prior notice.
        </p>
      ),
    },
    {
      title: "6. Contact Form and Email Communication",
      content: (
        <p>
          By submitting a message, you confirm that the information
          provided is accurate and does not contain unlawful or harmful
          content. Authorized email services, including Google Gmail API,
          may be used to respond to inquiries. Submitting a contact form
          does not guarantee a response or establish a contractual
          relationship.
        </p>
      ),
    },
    {
      title: "7. Third-Party Services and Links",
      content: (
        <p>
          This website may contain links to external websites,
          repositories, platforms, and services. We are not responsible
          for the content, policies, or availability of third-party
          websites.
        </p>
      ),
    },
    {
      title: "8. Website Availability",
      content: (
        <p>
          We aim to keep the website accessible. However, uninterrupted
          availability is not guaranteed. Features may be modified,
          suspended, or discontinued.
        </p>
      ),
    },
    {
      title: "9. Limitation of Liability",
      content: (
        <p>
          To the extent permitted by applicable law, HKR Amar Singh shall
          not be liable for damages arising from the use or inability to
          use this website, or interruptions caused by third-party
          services. Nothing in these terms excludes liability where such
          exclusion is prohibited by law.
        </p>
      ),
    },
    {
      title: "10. Changes to These Terms",
      content: (
        <p>
          These Terms of Service may be updated from time to time.
          Revised terms will be published on this page.
        </p>
      ),
    },
    {
      title: "11. Governing Law",
      content: (
        <p>
          These terms are governed by the applicable laws of India,
          subject to applicable legal requirements.
        </p>
      ),
    },
    {
      title: "12. Contact Information",
      content: (
        <>
          <p><strong>Name:</strong> HKR Amar Singh</p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:hkramarsingh@gmail.com">
              hkramarsingh@gmail.com
            </a>
          </p>
          <p>
            <strong>Website:</strong>{" "}
            <a href="https://hkramarsingh.in">hkramarsingh.in</a>
          </p>
        </>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white px-5 pb-20 pt-28 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <span className="mb-5 inline-block text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
          Legal
        </span>

        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
          Terms of Service
        </h1>

        <p className="mt-5 text-sm text-slate-500">
          Last updated: November 8, 2026
        </p>

        <div className="my-10 border-l-4 border-slate-900 bg-slate-50 p-6 sm:p-8">
          <p className="text-base leading-8 text-slate-600">
            Welcome to HKR Amar Singh's personal portfolio. By accessing
            or using this website, you agree to the following Terms of
            Service.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {sections.map((section) => (
            <section key={section.title} className="py-8 first:pt-0">
              <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {section.title}
              </h2>

              <div className="space-y-4 text-[15px] leading-8 text-slate-600 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-4">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} HKR Amar Singh. All rights reserved.
        </footer>
      </div>
    </main>
  );
};

export default Terms;