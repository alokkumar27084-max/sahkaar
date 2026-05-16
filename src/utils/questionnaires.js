export const CATEGORY_QUESTIONNAIRES = {
  electrical: [
    {
      id: "work_scope",
      question: "What type of electrical work do you handle?",
      type: "single",
      options: [
        { label: "Residential / Home repairs", value: "residential" },
        { label: "Commercial / Office buildings", value: "commercial" },
        { label: "Both residential & commercial", value: "both" },
      ],
    },
    {
      id: "specialties",
      question: "Select your electrical specialties",
      type: "multi",
      options: [
        { label: "Inverter / UPS Installation", value: "inverter" },
        { label: "Appliance Repair (AC, Fridge)", value: "appliances" },
        { label: "High-Tension / Panel Wiring", value: "ht_wiring" },
        { label: "Basic wiring & fixtures", value: "basic" },
      ],
    },
  ],
  plumbing: [
    {
      id: "work_scope",
      question: "What type of plumbing work do you focus on?",
      type: "single",
      options: [
        { label: "New pipeline installation", value: "installation" },
        { label: "Repairs & Leakages", value: "repairs" },
        { label: "Both installations and repairs", value: "both" },
      ],
    },
    {
      id: "specialties",
      question: "Select your specialties",
      type: "multi",
      options: [
        { label: "Water Tank Installation", value: "tank" },
        { label: "Motor / Pump Repair", value: "motor" },
        { label: "Drain Cleaning", value: "drain" },
        { label: "Bathroom Fittings", value: "fittings" },
      ],
    },
  ],
  painting: [
    {
      id: "work_type",
      question: "What type of painting do you do?",
      type: "single",
      options: [
        { label: "Interior walls & ceilings", value: "interior" },
        { label: "Exterior building painting", value: "exterior" },
        { label: "Texture & Designer walls", value: "texture" },
        { label: "All types of painting", value: "all" },
      ],
    },
    {
      id: "material",
      question: "How do you handle paint materials?",
      type: "single",
      options: [
        { label: "I provide labor + material", value: "with_material" },
        { label: "Customer provides material", value: "labor_only" },
        { label: "Both options available", value: "both" },
      ],
    },
  ],
  construction: [
    {
      id: "contract_type",
      question: "What kind of construction contracts do you take?",
      type: "single",
      options: [
        { label: "With Material (Turnkey)", value: "turnkey" },
        { label: "Labor Only (Rate Contract)", value: "labor" },
        { label: "Both", value: "both" },
      ],
    },
  ],
  default: [
    {
      id: "scale",
      question: "What scale of work do you usually take?",
      type: "single",
      options: [
        { label: "Small quick fixes (1-2 days)", value: "small" },
        { label: "Medium projects (1-2 weeks)", value: "medium" },
        { label: "Large scale contracts", value: "large" },
      ],
    },
  ],
};

export function getQuestionnaireForCategory(categoryId) {
  return CATEGORY_QUESTIONNAIRES[categoryId] || CATEGORY_QUESTIONNAIRES.default;
}
