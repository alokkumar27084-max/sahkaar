import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/common/SEOHead";

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-32 pb-20">
      <SEOHead title="Refund & Cancellation" description="Refund and cancellation policy for Thekedaar bookings." />
      
      <div className="max-w-4xl mx-auto px-5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 md:p-16"
        >
          <h1 className="font-display text-4xl md:text-5xl font-black text-[var(--color-heading)] mb-8">Refund & Cancellation</h1>
          <p className="text-sm text-[var(--color-muted)] mb-12">Last Updated: May 16, 2026</p>

          <div className="prose prose-invert prose-indigo max-w-none space-y-8 text-[var(--color-body)] leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">1. Booking Cancellations</h2>
              <p>Customers can cancel a booking before the contractor has started work. Depending on the timing of the cancellation, a small administrative fee may be deducted from the refund.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">2. Refund Eligibility</h2>
              <p>Refunds are eligible for funds currently held in escrow for milestones that have not yet been approved. Once a customer approves a milestone, the funds are released to the contractor and are no longer refundable through Thekedaar.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">3. Dispute Resolution</h2>
              <p>In case of poor quality work or non-completion, users can raise a dispute. Thekedaar will mediate the dispute and may issue a partial or full refund from the escrowed funds based on the evidence provided by both parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--color-heading)] mb-4 uppercase tracking-wider text-indigo-400">4. Processing Time</h2>
              <p>Approved refunds are processed back to the original payment method via Razorpay within 5-7 business days.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
