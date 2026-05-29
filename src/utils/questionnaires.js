export const CATEGORY_QUESTIONNAIRES = {
  construction: [
    {
      id: "contract_type",
      question: "What kind of construction contracts do you handle?",
      type: "single",
      options: [
        { label: "With Material (Turnkey Contracts)", value: "turnkey" },
        { label: "Labor Only (Rate Contracts / Measurement basis)", value: "labor" },
        { label: "Both Turnkey & Labor Contracts", value: "both" },
      ],
    },
    {
      id: "material_source",
      question: "Where do you source your construction materials?",
      type: "single",
      showIf: { field: "contract_type", values: ["turnkey", "both"] },
      options: [
        { label: "Direct from manufacturing plants (Bulk discount rates)", value: "manufacturers" },
        { label: "Local hardware dealers & regular wholesalers", value: "local_dealers" },
        { label: "Client's designated vendors & materials", value: "client_vendors" },
      ],
    },
    {
      id: "labor_licensing",
      question: "Do you hold a valid Labour License for active building sites?",
      type: "single",
      showIf: { field: "contract_type", values: ["labor", "both"] },
      options: [
        { label: "Yes, fully registered for 20+ workers", value: "yes_large" },
        { label: "Yes, registered for small/medium sites (<20 workers)", value: "yes_small" },
        { label: "No, currently operating on subcontractor licenses", value: "no" },
      ],
    },
    {
      id: "machinery",
      question: "What major machinery/equipment does your enterprise own?",
      type: "multi",
      options: [
        { label: "Concrete Mixer & High-Frequency Vibrators", value: "mixer" },
        { label: "Steel Scaffolding & MS Shuttering Props", value: "scaffolding" },
        { label: "Soil Compactor & Levelling Instruments (Auto-Level)", value: "compactor" },
        { label: "Basic hand tools & power drills only", value: "basic" },
      ],
    },
  ],
  labour_group: [
    {
      id: "chowk_type",
      question: "Where does your labour crew usually operate from?",
      type: "single",
      options: [
        { label: "A local labour chowk (Daily physical gather point)", value: "physical_chowk" },
        { label: "Under direct monthly/weekly sub-contracts", value: "corporate" },
        { label: "On-call mobile deployment (Digital/WhatsApp list)", value: "digital_oncall" },
      ],
    },
    {
      id: "crew_specialty",
      question: "What is your crew's primary field of labor?",
      type: "single",
      options: [
        { label: "Civil works (Masons, RCC casting, Shuttering)", value: "civil" },
        { label: "Finishings (Painters, Tilers, Plastering, Gypsum)", value: "finishing" },
        { label: "Helpers & General Unskilled loading labor", value: "unskilled" },
      ],
    },
    {
      id: "crew_billing",
      question: "How do you prefer to bill your group's services?",
      type: "single",
      options: [
        { label: "Fixed daily rate per worker category", value: "daily_rate" },
        { label: "Square-foot area basis (Measurement rate)", value: "sqft_rate" },
        { label: "Lump-sum contract for specific projects", value: "lumpsum" },
      ],
    },
  ],
  electrical: [
    {
      id: "voltage_level",
      question: "What electrical voltage levels do you handle?",
      type: "single",
      options: [
        { label: "Low Voltage (Domestic wiring, home fixtures)", value: "low_voltage" },
        { label: "High-Tension (HT Panel wiring, industrial grids)", value: "high_tension" },
        { label: "Both domestic & industrial systems", value: "both_voltages" },
      ],
    },
    {
      id: "fixture_specialties",
      question: "Select your fixture & system specialties",
      type: "multi",
      showIf: { field: "voltage_level", values: ["low_voltage", "both_voltages"] },
      options: [
        { label: "Inverter / UPS Backup Installation", value: "inverter" },
        { label: "Appliance diagnostics (AC, Fridge, Washing Machine)", value: "appliances" },
        { label: "Smart Home automation & security cameras", value: "smarthome" },
        { label: "Basic ceiling fan, switchboard & light fittings", value: "basic" },
      ],
    },
    {
      id: "industrial_cert",
      question: "Do you possess an authorized electrical contractor license?",
      type: "single",
      showIf: { field: "voltage_level", values: ["high_tension", "both_voltages"] },
      options: [
        { label: "Yes, Class-A License (Industrial scale authorized)", value: "class_a" },
        { label: "Yes, Supervisor certificate holder", value: "supervisor" },
        { label: "No, working under licensed senior engineers", value: "no_cert" },
      ],
    },
  ],
  plumbing: [
    {
      id: "scope",
      question: "What is your main line of plumbing operations?",
      type: "single",
      options: [
        { label: "High-Pressure pipeline installations (CPVC, PPR)", value: "pipeline" },
        { label: "Minor leakage repair, sanitary fittings & drain clearing", value: "repair" },
        { label: "Both pipeline layout and maintenance", value: "both_scope" },
      ],
    },
    {
      id: "machinery",
      question: "What specialised tools do you operate?",
      type: "multi",
      options: [
        { label: "CPVC/PPR Heat Fusion Welding Machine", value: "fusion" },
        { label: "Electric Pipe Threader & Groover", value: "threader" },
        { label: "Drain Inspection Camera & Electric Auger", value: "auger" },
        { label: "Basic pipe wrenches, Teflon tape & standard tools", value: "basic" },
      ],
    },
  ],
  painting: [
    {
      id: "painting_scope",
      question: "What scale of painting jobs do you target?",
      type: "single",
      options: [
        { label: "Premium Interior Finishings (Royal Play, Texture)", value: "premium_interior" },
        { label: "High-Rise Exterior Painting (Apex, Weather-proof)", value: "exterior_highrise" },
        { label: "Standard domestic repaint (Emulsion & Putty)", value: "standard_domestic" },
      ],
    },
    {
      id: "sprayer_tech",
      question: "Do you own and operate Airless Paint Sprayer machinery?",
      type: "single",
      showIf: { field: "painting_scope", values: ["exterior_highrise", "premium_interior"] },
      options: [
        { label: "Yes, own and use professional airless sprayers", value: "yes_sprayer" },
        { label: "No, perform work with rollers, brushes & putty knives", value: "no_sprayer" },
      ],
    },
  ],
  default: [
    {
      id: "job_scale",
      question: "What scale of assignments do you usually accept?",
      type: "single",
      options: [
        { label: "Quick service tasks (1-2 days)", value: "small" },
        { label: "Medium commercial/residential contracts (1-2 weeks)", value: "medium" },
        { label: "Large corporate or sub-contract agreements", value: "large" },
      ],
    },
  ],
};

export function getQuestionnaireForCategory(categoryId, answers = {}) {
  const baseQuestions = CATEGORY_QUESTIONNAIRES[categoryId] || CATEGORY_QUESTIONNAIRES.default;
  
  // Dynamically filter questions based on the declarative 'showIf' rules
  return baseQuestions.filter(q => {
    if (!q.showIf) return true;
    const { field, values } = q.showIf;
    const answer = answers[field];
    
    // If the answer exists and is in the target values list, show the question
    if (Array.isArray(answer)) {
      return answer.some(val => values.includes(val));
    }
    return answer && values.includes(answer);
  });
}
