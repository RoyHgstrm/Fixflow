import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Terms of Service</h1>
          <div className="space-y-6 text-text-secondary">
            <p>Last updated: July 16, 2025</p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">1. Agreement to Terms</h2>
            <p>
              By using our SaaS platform, you agree to be bound by these Terms of Service. If you do not agree to these Terms of Service, do not use the Application.
            </p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">2. Intellectual Property Rights</h2>
            <p>
              Unless otherwise indicated, the Application is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Application (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
            </p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">3. User Representations</h2>
            <p>
              By using the Application, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service; (4) you will not access the Application through automated or non-human means, whether through a bot, script or otherwise; (5) you will not use the Application for any illegal or unauthorized purpose; and (6) your use of the Application will not violate any applicable law or regulation.
            </p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">4. Prohibited Activities</h2>
            <p>
              You may not access or use the Application for any purpose other than that for which we make the Application available. The Application may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">5. Term and Termination</h2>
            <p>
              These Terms of Service shall remain in full force and effect while you use the Application. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS OF SERVICE, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE APPLICATION (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON.
            </p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">6. Governing Law</h2>
            <p>
              These Terms of Service and your use of the Application are governed by and construed in accordance with the laws of Finland applicable to agreements made and to be entirely performed within Finland, without regard to its conflict of law principles.
            </p>

            <h2 className="text-2xl font-semibold text-text-primary pt-4">7. Contact Us</h2>
            <p>
              In order to resolve a complaint regarding the Application or to receive further information regarding use of the Application, please contact us at:
            </p>
            <p>
              FixFlow Oy<br />
              support@fixflow.fi<br />
              Helsinki, Finland
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfServicePage;
