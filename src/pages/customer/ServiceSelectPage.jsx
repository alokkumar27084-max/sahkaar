import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiZap,
  FiBriefcase,
  FiUsers,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

const SERVICE_TYPES = [
  {
    id: "quick",
    title: "Quick Handyman",
    subtitle: "Instant Bookings",
    badge: "Starting from ₹199",
    description: "Book trusted professionals for immediate home repairs — plumbers, electricians, AC technicians, carpenters, and painters.",
    icon: FiZap,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/20",
    features: [
      "Book in 2 minutes",
      "Subtle booking fee",
      "Verified local handymen"
    ]
  },
  {
    id: "project",
    title: "Project Contractor",
    subtitle: "Renovations & Building",
    badge: "Milestone Billing",
    description: "Hire general contractors for large-scale house construction, modular kitchen fittings, home renovations, and interior design.",
    icon: FiBriefcase,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/20",
    features: [
      "Milestone-based payments",
      "Escrow protection guarantee",
      "Architects & general contractors"
    ]
  },
  {
    id: "labour",
    title: "Labour Squad",
    subtitle: "Daily wage crews",
    badge: "Starting from ₹400/day",
    description: "Hire complete skilled crews — masons, painters, bricklayers, plasterers — managed by a verified squad leader.",
    icon: FiUsers,
    iconColor: "text-green-600 dark:text-green-400",
    iconBg: "bg-green-50 dark:bg-green-950/20",
    features: [
      "Geospatial crew matching",
      "Full squad leader verification",
      "Direct daily-wage structure"
    ]
  }
];

export default function ServiceSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSelectService = (serviceId) => {
    const nextParams = new URLSearchParams(searchParams);
    if (serviceId === "quick" || serviceId === "project") {
      nextParams.set("mode", serviceId);
      navigate(`/search?${nextParams.toString()}`);
    } else if (serviceId === "labour") {
      navigate(`/labour?${nextParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-elevated)] pt-28 pb-20 px-4 md:px-8">
      <SEOHead
        title="Select Service Type — Thekedaar"
        description="Choose your service type: Quick Handyman, Project Contractor, or Labour Squad. Find the right professionals for your needs."
      />

      <div className="max-w-[var(--max-width)] mx-auto">
        {/* Header */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-heading)] tracking-tight mb-4">
            How can we help you today?
          </h1>
          <p className="text-sm md:text-base text-[var(--color-muted)] leading-relaxed">
            Choose the right category of service for your home. We provide verified professionals, milestone protection, and seamless daily crew hire.
          </p>
        </div>

        {/* 3-Card Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {SERVICE_TYPES.map((service, idx) => {
            const IconComp = service.icon;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                onClick={() => handleSelectService(service.id)}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Top Bar with Icon & Badge */}
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl ${service.iconBg} ${service.iconColor} flex items-center justify-center`}>
                      <IconComp size={24} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-muted)] text-[10px] font-bold uppercase tracking-wider">
                      {service.subtitle}
                    </span>
                  </div>

                  {/* Title & Badge */}
                  <h2 className="text-xl font-bold text-[var(--color-heading)] mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {service.title}
                  </h2>
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg mb-4">
                    {service.badge}
                  </span>

                  {/* Description */}
                  <p className="text-sm text-[var(--color-body)] leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Key points */}
                  <div className="space-y-2.5 mb-8">
                    {service.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <FiCheckCircle size={15} className="text-green-600 shrink-0" />
                        <span className="text-xs text-[var(--color-muted)] font-medium">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue button */}
                <button className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/10 hover:from-indigo-500 hover:to-indigo-600 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300">
                  <span>Explore category</span>
                  <FiArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Helper text */}
        <p className="text-center text-xs text-[var(--color-muted)] mt-12 font-medium">
          Not sure which to choose? Pick any — you can easily change categories in the next step.
        </p>
      </div>
    </div>
  );
}
