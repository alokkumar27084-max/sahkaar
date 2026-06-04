import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { CATEGORIES } from "../../utils/constants";
import { FiSearch, FiArrowLeft, FiGrid, FiList } from "react-icons/fi";
import SEOHead from "../../components/common/SEOHead";

export default function AllCategoriesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  const handleCategoryClick = (categoryId) => {
    if (categoryId === "labour_group") {
      navigate(`/labour`);
    } else {
      navigate(`/search?category=${categoryId}&mode=project`);
    }
  };

  const filteredCategories = CATEGORIES.filter((cat) => {
    const label = t(cat.key).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  // Group categories for better visual organization
  const categoryGroups = [
    {
      title: "Construction & Home",
      emoji: "🏠",
      ids: ["construction", "interior_finishing", "electrical", "plumbing", "painting", "real_estate", "renewable_energy"],
    },
    {
      title: "Maintenance & Repair",
      emoji: "🔧",
      ids: ["appliance_repair", "cleaning", "automobile"],
    },
    {
      title: "Labour & Logistics",
      emoji: "👷",
      ids: ["labour_group", "transport", "agriculture", "industrial", "hr_staffing"],
    },
    {
      title: "Events & Hospitality",
      emoji: "🎉",
      ids: ["events_wedding", "event_management", "institutional_food", "food_processing", "tourism_hospitality", "seasonal_specialty"],
    },
    {
      title: "Personal Services",
      emoji: "💆",
      ids: ["healthcare", "personal_care", "education_tutoring", "tailoring_textile", "animal_veterinary", "spiritual_religious"],
    },
    {
      title: "Business & Professional",
      emoji: "💼",
      ids: ["it_tech", "software_dev", "digital_marketing", "design_creative", "legal_compliance", "accounting_finance", "media_content", "research_data"],
    },
    {
      title: "Government & Others",
      emoji: "🏛️",
      ids: ["govt_municipal", "security_services", "printing_publishing", "retail_shop", "waste_management"],
    },
  ];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="bg-[var(--color-bg)] min-h-screen pt-24 pb-16">
      <SEOHead
        title="All Service Categories — Thekedaar"
        description="Browse all 40+ service categories on Thekedaar. Find verified contractors for construction, electrical, plumbing, events, IT, and more."
      />

      <div className="max-w-[var(--max-width)] mx-auto px-5 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)] transition-colors shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight font-display">
              All Categories
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1 font-medium">
              {CATEGORIES.length} professional service categories
            </p>
          </div>
        </div>

        {/* Search & View Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories... e.g. Plumbing, IT, Events"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] text-sm font-semibold placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`h-12 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                viewMode === "grid"
                  ? "bg-[var(--color-primary)] border-transparent text-white"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)]"
              }`}
            >
              <FiGrid size={16} /> Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-12 px-4 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all ${
                viewMode === "list"
                  ? "bg-[var(--color-primary)] border-transparent text-white"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-heading)] hover:bg-[var(--color-bg-elevated)]"
              }`}
            >
              <FiList size={16} /> List
            </button>
          </div>
        </div>

        {/* Search results mode */}
        {isSearching ? (
          <div>
            <p className="text-sm font-semibold text-[var(--color-muted)] mb-4">
              {filteredCategories.length} result{filteredCategories.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
            {filteredCategories.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-[var(--color-heading)] mb-2">No categories found</h3>
                <p className="text-sm text-[var(--color-muted)]">Try a different search term</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCategories.map((cat, i) => (
                  <CategoryCard key={cat.id} cat={cat} t={t} onClick={handleCategoryClick} delay={i * 0.03} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((cat, i) => (
                  <CategoryListItem key={cat.id} cat={cat} t={t} onClick={handleCategoryClick} delay={i * 0.03} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grouped categories mode */
          <div className="space-y-12">
            {categoryGroups.map((group) => {
              const groupCats = group.ids
                .map((id) => CATEGORIES.find((c) => c.id === id))
                .filter(Boolean);

              if (groupCats.length === 0) return null;

              return (
                <section key={group.title}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{group.emoji}</span>
                    <h2 className="text-lg md:text-xl font-bold text-[var(--color-heading)] tracking-tight font-display">
                      {group.title}
                    </h2>
                    <div className="h-px flex-1 bg-[var(--color-border)]" />
                    <span className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                      {groupCats.length} services
                    </span>
                  </div>

                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {groupCats.map((cat, i) => (
                        <CategoryCard key={cat.id} cat={cat} t={t} onClick={handleCategoryClick} delay={i * 0.04} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupCats.map((cat, i) => (
                        <CategoryListItem key={cat.id} cat={cat} t={t} onClick={handleCategoryClick} delay={i * 0.04} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Category Card (Grid View) ─── */
function CategoryCard({ cat, t, onClick, delay = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={() => onClick(cat.id)}
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-[var(--color-border)]"
    >
      <img
        src={cat.image}
        alt={t(cat.key)}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
        <h3 className="text-white font-bold text-sm md:text-base font-display line-clamp-2 leading-snug">
          {t(cat.key)}
        </h3>
        <p className="text-white/60 text-[9px] uppercase font-bold mt-1 tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Browse →
        </p>
      </div>
    </motion.button>
  );
}

/* ─── Category List Item (List View) ─── */
function CategoryListItem({ cat, t, onClick, delay = 0 }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={() => onClick(cat.id)}
      className="group w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-elevated)] transition-all duration-200 cursor-pointer text-left"
    >
      <img
        src={cat.image}
        alt={t(cat.key)}
        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[var(--color-border)] group-hover:scale-105 transition-transform"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-[var(--color-heading)] truncate font-display">
          {t(cat.key)}
        </h3>
        <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1">
          {t(cat.subtitleKey)}
        </p>
      </div>
      <span className="text-xs font-bold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Browse →
      </span>
    </motion.button>
  );
}
