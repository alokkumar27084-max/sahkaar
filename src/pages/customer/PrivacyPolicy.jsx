import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/common/SEOHead";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-bg pt-32 pb-20 transition-colors duration-200">
      <SEOHead title="Privacy Policy" description="Privacy policy for Thekedaar — India's trusted contractor platform." />
      
      <div className="max-w-3xl mx-auto px-5">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 md:p-12 border border-border bg-surface shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-heading mb-2">Privacy Policy</h1>
          <p className="text-xs text-muted mb-10">Last Updated: May 16, 2026</p>

          <div className="space-y-8 text-sm text-body leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                1. Information We Collect
              </h2>
              <p>We collect information that you provide directly to us when you create an account, such as your name, email address, phone number, and location data. For contractors, we also collect business details, verification documents, and portfolio images.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                2. How We Use Your Information
              </h2>
              <p>We use the information we collect to provide, maintain, and improve our services, to process payments via Razorpay, to facilitate communication between customers and contractors, and to verify contractor identities to ensure platform safety.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                3. Data Sharing and Security
              </h2>
              <p>We do not sell your personal data. We share your information only as necessary to provide our services (e.g., sharing a customer's location with a booked contractor) or to comply with legal obligations. We use industry-standard security measures to protect your data.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                4. Cookies and Tracking
              </h2>
              <p>We use cookies and similar tracking technologies to analyze platform usage and remember your preferences. You can control cookie settings through your browser.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                5. Contact Us
              </h2>
              <p>If you have any questions about this Privacy Policy, please contact us at <strong className="text-heading">apkathekedaar@gmail.com</strong>.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
