import React from "react";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: (
        <>
          <p>We may collect the following information:</p>
          <ul>
            <li>Contact information such as your name, email address, subject, and message submitted through the contact form.</li>
            <li>Basic technical information such as browser type, device information, and server logs, where collected.</li>
            <li>Communication records, including messages and replies exchanged through the website.</li>
          </ul>
        </>
      ),
    },
    {
      title: "2. How We Use Your Information",
      content: (
        <>
          <p>Information may be used to:</p>
          <ul>
            <li>Respond to questions and inquiries.</li>
            <li>Discuss projects and collaborations.</li>
            <li>Improve website functionality.</li>
            <li>Prevent spam, abuse, and unauthorized access.</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </>
      ),
    },
    {
      title: "3. Gmail Integration",
      content: (
        <>
          <p>
            This website uses the Google Gmail API to send email replies to
            contact form submissions.
          </p>
          <ul>
            <li>Google OAuth is used to authorize connected Gmail accounts.</li>
            <li>The application requests permission to send emails through the connected account.</li>
            <li>OAuth refresh tokens are stored in encrypted form on the backend.</li>
            <li>Contact messages and replies may be stored in the website database.</li>
          </ul>
          <p>
            Gmail data is used only to provide the email communication
            functionality described above. It is not used for advertising
            or sold to third parties.
          </p>
        </>
      ),
    },
    {
      title: "4. Google User Data",
      content: (
        <>
          <p>
            Our use and transfer of information received from Google APIs
            adheres to the Google API Services User Data Policy, including
            its Limited Use requirements.
          </p>
          <p>
            You can revoke Google account authorization through your
            Google Account security settings.
          </p>
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline underline-offset-4"
          >
            Google API Services User Data Policy
          </a>
        </>
      ),
    },
    {
      title: "5. Data Storage and Security",
      content: (
        <p>
          Information may be stored using database, hosting, and storage
          services used by this website. Appropriate security measures are
          applied to protect stored information. However, no method of
          online storage or transmission is completely secure.
        </p>
      ),
    },
    {
      title: "6. Third-Party Services",
      content: (
        <p>
          This website may use third-party services for hosting, database
          management, media delivery, and email functionality. These
          services are governed by their respective privacy policies.
        </p>
      ),
    },
    {
      title: "7. Data Retention and Deletion",
      content: (
        <p>
          Contact messages and communication records may be retained for
          administrative and communication purposes. To request deletion
          of your contact information or messages, contact us using the
          email address below.
        </p>
      ),
    },
    {
      title: "8. Children's Privacy",
      content: (
        <p>
          This website is not specifically directed toward children.
          We do not knowingly collect personal information from children
          for purposes requiring parental consent.
        </p>
      ),
    },
    {
      title: "9. Changes to This Policy",
      content: (
        <p>
          This Privacy Policy may be updated when website functionality
          or applicable requirements change. Updates will be published
          on this page.
        </p>
      ),
    },
    {
      title: "10. Contact Information",
      content: (
        <>
          <p>For privacy-related questions or requests:</p>
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
          Privacy Policy
        </h1>

        <p className="mt-5 text-sm text-slate-500">
          Last updated: November 8, 2026
        </p>

        <div className="my-10 border-l-4 border-slate-900 bg-slate-50 p-6 sm:p-8">
          <p className="text-base leading-8 text-slate-600">
            Welcome to HKR Amar Singh's personal portfolio. Your privacy
            matters. This policy explains what information may be collected
            and how it is used when you visit this website.
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

export default PrivacyPolicy;