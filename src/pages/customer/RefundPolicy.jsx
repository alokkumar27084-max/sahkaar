import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/common/SEOHead";

export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-bg pt-32 pb-20 transition-colors duration-200">
      <SEOHead title="Refund & Cancellation" description="Refund and cancellation policy for Thekedaar bookings." />
      
      <div className="max-w-3xl mx-auto px-5">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 md:p-12 border border-border bg-surface shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-heading mb-2">Refund & Cancellation</h1>
          <p className="text-xs text-muted mb-10">Last Updated: May 16, 2026</p>

          <div className="space-y-8 text-sm text-body leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                1. Booking Cancellations
              </h2>
              <p>Customers can cancel a booking before the contractor has started work. Depending on the timing of the cancellation, a small administrative fee may be deducted from the refund.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                2. Refund Eligibility
              </h2>
              <p>Refunds are eligible for funds currently held in escrow for milestones that have not yet been approved. Once a customer approves a milestone, the funds are released to the contractor and are no longer refundable through Thekedaar.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                3. Dispute Resolution
              </h2>
              <p>In case of poor quality work or non-completion, users can raise a dispute. Thekedaar will mediate the dispute and may issue a partial or full refund from the escrowed funds based on the evidence provided by both parties.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                4. Processing Time
              </h2>
              <p>Approved refunds are processed back to the original payment method via Razorpay within 5-7 business days.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
