import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/common/SEOHead";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-bg pt-32 pb-20 transition-colors duration-200">
      <SEOHead title="Terms of Service" description="Terms and conditions for using Thekedaar." />
      
      <div className="max-w-3xl mx-auto px-5">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 md:p-12 border border-border bg-surface shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-heading mb-2">Terms of Service</h1>
          <p className="text-xs text-muted mb-10">Last Updated: May 16, 2026</p>

          <div className="space-y-8 text-sm text-body leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                1. Acceptance of Terms
              </h2>
              <p>By accessing or using Thekedaar, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our platform.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                2. Marketplace Role
              </h2>
              <p>Thekedaar is a marketplace that connects customers with independent contractors. We are not a party to the contracts between users, nor do we employ contractors. We facilitate the booking and payment process.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                3. Payments & Escrow
              </h2>
              <p>All payments made through the platform are held in a virtual escrow account. Funds are released to the contractor only upon approval of the specified milestone by the customer. Thekedaar may charge a service fee for facilitating these transactions.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                4. User Conduct
              </h2>
              <p>Users agree to provide accurate information and to conduct themselves professionally. Harassment, fraud, and bypassing the platform's payment system are strictly prohibited and may result in account termination.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                5. Limitation of Liability
              </h2>
              <p>Thekedaar is not liable for the quality of work performed by contractors or for any disputes between users, though we may provide mediation services at our discretion.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
