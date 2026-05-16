import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/common/SEOHead";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-32 pb-20">
      <SEOHead title="Terms of Service" description="Terms and conditions for using Thekedaar." />
      
      <div className="max-w-4xl mx-auto px-5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 md:p-16"
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-[var(--color-heading)] mb-8">Terms of Service</h1>
          <p className="text-sm text-[var(--color-muted)] mb-12">Last Updated: May 16, 2026</p>

          <div className="prose prose-invert prose-indigo max-w-none space-y-8 text-[var(--color-body)] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">1. Acceptance of Terms</h2>
              <p>By accessing or using Thekedaar, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our platform.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">2. Marketplace Role</h2>
              <p>Thekedaar is a marketplace that connects customers with independent contractors. We are not a party to the contracts between users, nor do we employ contractors. We facilitate the booking and payment process.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">3. Payments & Escrow</h2>
              <p>All payments made through the platform are held in a virtual escrow account. Funds are released to the contractor only upon approval of the specified milestone by the customer. Thekedaar may charge a service fee for facilitating these transactions.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">4. User Conduct</h2>
              <p>Users agree to provide accurate information and to conduct themselves professionally. Harassment, fraud, and bypassing the platform's payment system are strictly prohibited and may result in account termination.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">5. Limitation of Liability</h2>
              <p>Thekedaar is not liable for the quality of work performed by contractors or for any disputes between users, though we may provide mediation services at our discretion.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
