import React, { useState, useEffect } from "react";
import { adminAPI } from "../../../services/api";
import toast from "react-hot-toast";
import {
  FiLayers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiMapPin,
  FiUsers,
  FiCheckCircle,
  FiPhone,
  FiMail,
  FiShield,
  FiX
} from "react-icons/fi";

export default function FederationsSocietiesPanel() {
  const [activeTab, setActiveTab] = useState("societies"); // 'societies' | 'federations'
  const [federations, setFederations] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFedModal, setShowFedModal] = useState(false);
  const [showSocModal, setShowSocModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [fedForm, setFedForm] = useState({
    name: "",
    state: "Madhya Pradesh",
    region: "Central India",
    registration_no: "",
    contact_email: "",
    contact_phone: "",
    office_address: "",
    welfare_fund_balance: 5000000,
    jurisdiction_districts: "",
  });

  const [socForm, setSocForm] = useState({
    federation_id: "",
    name: "",
    district: "Bhopal",
    jurisdiction_state: "Madhya Pradesh",
    registration_no: "",
    contact_phone: "",
    contact_email: "",
    office_address: "",
    welfare_pool_balance: 500000,
    jurisdiction_districts: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fedRes, socRes] = await Promise.all([
        adminAPI.getFederations(),
        adminAPI.getSocieties(),
      ]);
      setFederations(fedRes.data?.federations || []);
      setSocieties(socRes.data?.societies || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load federations/societies");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFederation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...fedForm,
        jurisdiction_districts: fedForm.jurisdiction_districts
          ? fedForm.jurisdiction_districts.split(",").map((d) => d.trim())
          : [fedForm.state],
      };

      if (editingItem) {
        await adminAPI.updateFederation(editingItem.id, payload);
        toast.success("Federation updated successfully!");
      } else {
        await adminAPI.createFederation(payload);
        toast.success("New State Federation registered!");
      }
      setShowFedModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleCreateSociety = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...socForm,
        jurisdiction_districts: socForm.jurisdiction_districts
          ? socForm.jurisdiction_districts.split(",").map((d) => d.trim())
          : [socForm.district],
      };

      if (editingItem) {
        await adminAPI.updateSociety(editingItem.id, payload);
        toast.success("Society updated successfully!");
      } else {
        await adminAPI.createSociety(payload);
        toast.success("New Primary Labour Society registered!");
      }
      setShowSocModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDeleteSociety = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await adminAPI.deleteSociety(id);
      toast.success("Society deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete society");
    }
  };

  const handleDeleteFederation = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete federation "${name}"?`)) return;
    try {
      await adminAPI.deleteFederation(id);
      toast.success("Federation deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete federation");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <FiLayers className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Nationwide Cooperative Hierarchy & Jurisdictions
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage State Apex Federations, District Labour Societies, and define geographic routing bounds for artisans across India.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setSocForm({
                federation_id: federations[0]?.id || "",
                name: "",
                district: "",
                jurisdiction_state: "Madhya Pradesh",
                registration_no: "",
                contact_phone: "",
                contact_email: "",
                office_address: "",
                welfare_pool_balance: 500000,
                jurisdiction_districts: "",
              });
              setShowSocModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add District Society</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFedForm({
                name: "",
                state: "",
                region: "Central India",
                registration_no: "",
                contact_email: "",
                contact_phone: "",
                office_address: "",
                welfare_fund_balance: 5000000,
                jurisdiction_districts: "",
              });
              setShowFedModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add State Federation</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("societies")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "societies"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          🏢 Primary Cooperative Societies ({societies.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("federations")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "federations"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          }`}
        >
          🏛️ State & Apex Federations ({federations.length})
        </button>
      </div>

      {/* Societies List */}
      {activeTab === "societies" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {societies.map((soc) => (
            <div
              key={soc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                      {soc.registration_no || "Primary Society"}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {soc.name}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                    Active
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5 font-medium">
                    <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>District: <strong className="text-slate-800 dark:text-slate-200">{soc.district}</strong>, {soc.jurisdiction_state}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <FiShield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Parent: <strong>{soc.federation_name || "State Federation"}</strong></span>
                  </p>
                  {soc.jurisdiction_districts?.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-500">Jurisdiction:</span>
                      {soc.jurisdiction_districts.map((d, i) => (
                        <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">TOTAL MASTERS</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{soc.total_contractors || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">VERIFIED</span>
                    <span className="font-black text-emerald-600">{soc.verified_contractors || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">WELFARE POOL</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">₹{(Number(soc.welfare_pool_balance) || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(soc);
                      setSocForm({
                        federation_id: soc.federation_id || "",
                        name: soc.name,
                        district: soc.district,
                        jurisdiction_state: soc.jurisdiction_state || "Madhya Pradesh",
                        registration_no: soc.registration_no || "",
                        contact_phone: soc.contact_phone || "",
                        contact_email: soc.contact_email || "",
                        office_address: soc.office_address || "",
                        welfare_pool_balance: soc.welfare_pool_balance || 500000,
                        jurisdiction_districts: Array.isArray(soc.jurisdiction_districts) ? soc.jurisdiction_districts.join(", ") : "",
                      });
                      setShowSocModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Edit Society"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSociety(soc.id, soc.name)}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    title="Delete Society"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Federations List */}
      {activeTab === "federations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {federations.map((fed) => (
            <div
              key={fed.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-md">
                      {fed.is_national ? "🏛️ National Apex Union" : `State Federation • ${fed.state}`}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                      {fed.name}
                    </h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">
                    Reg: {fed.registration_no || "FED-2026"}
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <p className="flex items-center gap-1.5 font-medium">
                    <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>HQ: {fed.office_address || `${fed.state}, India`}</span>
                  </p>
                  <p className="flex items-center gap-1.5 font-medium">
                    <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{fed.contact_email || "contact@sahkaari.in"} • {fed.contact_phone || "+91 11 2334 5678"}</span>
                  </p>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">AFFILIATED SOCIETIES</span>
                    <span className="font-black text-indigo-600">{fed.total_societies || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">TOTAL ARTISANS</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{fed.total_masters || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">STATE WELFARE FUND</span>
                    <span className="font-black text-emerald-600">₹{(Number(fed.welfare_fund_balance) || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(fed);
                      setFedForm({
                        name: fed.name,
                        state: fed.state,
                        region: fed.region || "State Level",
                        registration_no: fed.registration_no || "",
                        contact_email: fed.contact_email || "",
                        contact_phone: fed.contact_phone || "",
                        office_address: fed.office_address || "",
                        welfare_fund_balance: fed.welfare_fund_balance || 5000000,
                        jurisdiction_districts: Array.isArray(fed.jurisdiction_districts) ? fed.jurisdiction_districts.join(", ") : "",
                      });
                      setShowFedModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Edit Federation"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>

                  {!fed.is_national && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFederation(fed.id, fed.name)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                      title="Delete Federation"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ SOCIETY MODAL ═══════ */}
      {showSocModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingItem ? "Edit Primary Cooperative Society" : "Register New District Society"}
              </h3>
              <button
                type="button"
                onClick={() => setShowSocModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSociety} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Parent State Federation</label>
                <select
                  value={socForm.federation_id}
                  onChange={(e) => setSocForm({ ...socForm, federation_id: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  {federations.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Society Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhopal Karigar Sahakari Samiti"
                  value={socForm.name}
                  onChange={(e) => setSocForm({ ...socForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary District *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bhopal"
                    value={socForm.district}
                    onChange={(e) => setSocForm({ ...socForm, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madhya Pradesh"
                    value={socForm.jurisdiction_state}
                    onChange={(e) => setSocForm({ ...socForm, jurisdiction_state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jurisdiction Districts (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bhopal, Sehore, Raisen, Vidisha"
                  value={socForm.jurisdiction_districts}
                  onChange={(e) => setSocForm({ ...socForm, jurisdiction_districts: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
                <span className="text-[10px] text-slate-400">Masters registering in these districts will route here automatically.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Office Address</label>
                <input
                  type="text"
                  placeholder="Plot 42, MP Nagar, Bhopal"
                  value={socForm.office_address}
                  onChange={(e) => setSocForm({ ...socForm, office_address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSocModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save Society
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ FEDERATION MODAL ═══════ */}
      {showFedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingItem ? "Edit State Federation" : "Register New State Federation"}
              </h3>
              <button
                type="button"
                onClick={() => setShowFedModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFederation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Federation Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajasthan Shramik Sahakari Sangh"
                  value={fedForm.name}
                  onChange={(e) => setFedForm({ ...fedForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">State / Territory *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajasthan"
                    value={fedForm.state}
                    onChange={(e) => setFedForm({ ...fedForm, state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. North India"
                    value={fedForm.region}
                    onChange={(e) => setFedForm({ ...fedForm, region: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Office HQ Address</label>
                <input
                  type="text"
                  placeholder="Nehru Sahakar Bhawan, Jaipur"
                  value={fedForm.office_address}
                  onChange={(e) => setFedForm({ ...fedForm, office_address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                >
                  Save Federation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
