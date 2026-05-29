import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiZap,
  FiBriefcase,
  FiUsers,
  FiArrowRight,
  FiClock,
  FiShield,
  FiCheckCircle,
  FiStar,
  FiTrendingUp,
  FiMapPin,
} from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

const SERVICE_TYPES = [
  {
    id: "quick",
    title: "Quick Handyman",
    subtitle: "Instant Booking",
    description:
      "Book verified handymen for quick fixes — plumbing, electrical, AC repair, painting, and more. Secure your slot with a ₹30 booking fee.",
    gradient: "from-indigo-600 via-indigo-500 to-violet-500",
    glowColor: "rgba(99,102,241,0.35)",
    borderColor: "border-indigo-500/20",
    hoverBorder: "hover:border-indigo-500/50",
    iconBg: "bg-indigo-500/15",
    iconColor: "text-indigo-400 dark:text-indigo-400",
    accentColor: "text-indigo-500 dark:text-indigo-400",
    icon: FiZap,
    features: [
      { icon: FiClock, text: "Book in 2 minutes" },
      { icon: FiShield, text: "₹30 payment holds slot" },
      { icon: FiCheckCircle, text: "Verified professionals" },
    ],
    route: "/search?mode=quick",
    cta: "Find Handyman",
    popular: true,
  },
  {
    id: "project",
    title: "Project Contractor",
    subtitle: "Milestone-Based",
    description:
      "Hire verified construction contractors for renovations, building, interiors, and large-scale projects. Milestone-escrow payment protection.",
    gradient: "from-cyan-600 via-cyan-500 to-teal-500",
    glowColor: "rgba(6,182,212,0.30)",
    borderColor: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/50",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-500 dark:text-cyan-400",
    accentColor: "text-cyan-600 dark:text-cyan-400",
    icon: FiBriefcase,
    features: [
      { icon: FiStar, text: "Milestone billing" },
      { icon: FiShield, text: "Escrow protection" },
      { icon: FiTrendingUp, text: "Track project progress" },
    ],
    route: "/search?mode=project",
    cta: "Find Contractor",
    popular: false,
  },
  {
    id: "labour",
    title: "Labour Squad",
    subtitle: "Daily Wage Teams",
    description:
      "Hire entire work crews — masons, painters, helpers, carpenters — under a single registered Thekedaar leader. Review squads, check daily rates, hire instantly.",
    gradient: "from-amber-600 via-orange-500 to-rose-500",
    glowColor: "rgba(245,158,11,0.30)",
    borderColor: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/50",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500 dark:text-amber-400",
    accentColor: "text-amber-600 dark:text-amber-400",
    icon: FiUsers,
    features: [
      { icon: FiMapPin, text: "Geospatial matching" },
      { icon: FiUsers, text: "Full crew breakdown" },
      { icon: FiCheckCircle, text: "Verified squad leaders" },
    ],
    route: "/labour",
    cta: "Find Labour Squad",
    popular: false,
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
};

export default function ServiceSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hoveredId, setHoveredId] = useState(null);

  const handleSelectService = (service) => {
    const nextParams = new URLSearchParams(searchParams);
    if (service.id === "quick" || service.id === "project") {
      nextParams.set("mode", service.id);
      navigate(`/search?${nextParams.toString()}`);
    } else {
      navigate(`/labour?${nextParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--color-bg)]">
      <SEOHead
        title="Select Service Type — Thekedaar"
        description="Choose your service type: Quick Handyman, Project Contractor, or Labour Squad. Find the right professionals for your needs."
      />

      {/* Ambient glow orbs — reduced opacity in light mode */}
      <div
        className="absolute top-[-15%] left-[20%] w-[700px] h-[700px] rounded-full blur-[150px] opacity-[0.07] dark:opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-[0.06] dark:opacity-[0.15] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[50%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-[0.05] dark:opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)" }}
      />

      {/* Grid overlay — subtle in both modes */}
      <div className="absolute inset-0 hero-grid opacity-[0.08] dark:opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-[1300px] mx-auto px-5 md:px-10 pt-32 md:pt-40 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] backdrop-blur-md mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
            <span className="text-[var(--color-muted)] text-[10px] font-semibold uppercase tracking-[0.3em]">
              Choose Your Service
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black text-[var(--color-heading)] tracking-[-0.03em] leading-[0.95] mb-6">
            What do you
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-amber-400 dark:from-indigo-400 dark:via-cyan-400 dark:to-amber-400">
              need today?
            </span>
          </h1>

          <p className="text-[var(--color-muted)] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Select a service type to find the right professionals near you.
            Each category has tailored search, booking, and payment flows.
          </p>
        </motion.div>

        {/* Service Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {SERVICE_TYPES.map((service) => {
            const IconComp = service.icon;
            const isHovered = hoveredId === service.id;

            return (
              <motion.button
                key={service.id}
                variants={cardVariants}
                onMouseEnter={() => setHoveredId(service.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelectService(service)}
                className={`relative text-left rounded-[2rem] border ${service.borderColor} ${service.hoverBorder} bg-[var(--color-surface)] dark:bg-white/[0.02] backdrop-blur-xl p-8 md:p-10 transition-all duration-500 group cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50`}
                style={{
                  boxShadow: isHovered
                    ? `0 20px 60px -15px ${service.glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : "0 2px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
                  transform: isHovered ? "translateY(-8px)" : "translateY(0)",
                }}
              >
                {/* Background gradient on hover */}
                <div
                  className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 120%, ${service.glowColor} 0%, transparent 60%)`,
                  }}
                />

                {/* Popular badge */}
                {service.popular && (
                  <div className="absolute top-6 right-6">
                    <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[9px] font-black uppercase tracking-[0.2em]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${service.iconBg} ${service.iconColor} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <IconComp size={28} />
                  </div>

                  {/* Subtitle tag */}
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${service.accentColor} mb-3 block`}>
                    {service.subtitle}
                  </span>

                  {/* Title */}
                  <h2 className="font-display text-2xl md:text-3xl font-black text-[var(--color-heading)] tracking-tight mb-4 leading-tight">
                    {service.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-8 min-h-[60px]">
                    {service.description}
                  </p>

                  {/* Feature list */}
                  <div className="space-y-3 mb-10">
                    {service.features.map((feat, i) => {
                      const FeatIcon = feat.icon;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg ${service.iconBg} ${service.iconColor} flex items-center justify-center shrink-0`}>
                            <FeatIcon size={13} />
                          </div>
                          <span className="text-xs font-bold text-[var(--color-body)]">
                            {feat.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* CTA — min-h-[44px] for touch targets */}
                  <div className={`flex items-center justify-center gap-2 py-4 min-h-[44px] rounded-xl bg-gradient-to-r ${service.gradient} text-white text-xs font-black uppercase tracking-[0.15em] shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                    {service.cta}
                    <FiArrowRight
                      size={14}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Bottom hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-center text-[var(--color-subtle)] text-xs font-medium mt-12"
        >
          Not sure? Pick any — you can switch anytime from the search filters.
        </motion.p>
      </div>
    </div>
  );
}
