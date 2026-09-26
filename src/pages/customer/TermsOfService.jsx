import React from "react";
import { motion } from "framer-motion";
import SEOHead from "../../components/common/SEOHead";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-bg pt-32 pb-20 transition-colors duration-200">
      <SEOHead title="Terms of Service" description="Terms and conditions for using SahKaar cooperative services." />
      
      <div className="max-w-3xl mx-auto px-5">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 md:p-12 border border-border bg-surface shadow-sm"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-heading mb-2">Terms of Service</h1>
          <p className="text-xs text-muted mb-10">Last Updated: September 26, 2026</p>

          <div className="space-y-8 text-sm text-body leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                1. Acceptance of Terms
              </h2>
              <p>By accessing or using SahKaar, you agree to these Terms of Service. If you do not agree to these terms, you may not use our platform.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                2. Marketplace Role
              </h2>
              <p>SahKaar connects customers with workers affiliated with participating cooperative societies and federations. Workers submit evidence of membership and identity for review by the responsible cooperative administrator. A platform profile alone does not certify a skill or guarantee a particular service outcome.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                3. Payments & Cooperative Allocation
              </h2>
              <p>Where a federation has completed onboarding with the payment provider, customer payments are routed to that federation's linked provider account and may be held for release after service completion under the provider's terms. Provider onboarding is required for live payouts. Worker, society, federation, and welfare allocations are recorded in cooperative ledgers; ledger entries do not by themselves mean a bank disbursement has occurred. Welfare support is subject to available recorded funds and cooperative approval. SahKaar does not provide insurance coverage.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                4. User Conduct
              </h2>
              <p>Users agree to provide accurate information and to conduct themselves professionally. Harassment, fraud, and misuse of the platform may result in account restriction.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-heading pb-2 border-b border-border mb-3 uppercase tracking-wider text-primary">
                5. Limitation of Liability
              </h2>
              <p>SahKaar provides booking and cooperative administration tools. Users should raise service or payment concerns through the applicable cooperative and platform support channels.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
