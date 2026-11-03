import React, { useState } from 'react';
import { Building2, TrendingUp, Users, Mail, Phone, CheckCircle2 } from 'lucide-react';

export const PartnershipSection: React.FC = () => {
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [partnerType, setPartnerType] = useState('franchise');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setInquiryModalOpen(false);
      setContactName('');
      setContactEmail('');
    }, 2500);
  };

  return (
    <section className="py-16 bg-[#0b0f17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111827] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Column: Image Asset */}
            <div className="relative h-64 lg:h-auto min-h-[320px] bg-slate-900">
              <img
                src="/src/assets/images/sports_facility_lounge_1793346020065.jpg"
                alt="SmashZone Facility Hub and Pro Shop"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] lg:bg-gradient-to-r lg:from-transparent lg:to-[#111827]"></div>
              <div className="absolute bottom-6 left-6 bg-slate-950/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl">
                <div className="text-xs font-bold text-white">Facility Development & Franchise</div>
                <div className="text-[11px] text-lime-400">High-yield sports infrastructure</div>
              </div>
            </div>

            {/* Right Column: Copy & Actions */}
            <div className="p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-lime-400 mb-2">
                  Franchise & Corporate Opportunities
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
                  Partner with the Fastest-Growing Racket Network
                </h2>
                <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Racket sports are undergoing exponential growth across Southeast Asia. SmashZone offers turnkey facility design, proprietary booking software, high-retention community programming, and lucrative pro-shop merchant integration.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-lime-400 font-bold text-sm mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Proven ROI</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Average 18–24 month capital payback with consistent 78% court utilization.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-cyan-400 font-bold text-sm mb-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>Corporate Tournaments</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Turnkey company sports fests, employee wellness leagues, and catered events.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Investor Inquiries: <strong className="text-white">partnerships@smashzone.ph</strong>
                </div>
                <button
                  onClick={() => setInquiryModalOpen(true)}
                  className="px-6 py-2.5 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  Contact Business Team
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Inquiry */}
        {inquiryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              {!submitted ? (
                <>
                  <h3 className="text-lg font-bold text-white mb-1 font-heading">
                    Business Partnership Inquiry
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Submit your details and our commercial development team will reach out within 24 hours.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Inquiry Type
                      </label>
                      <select
                        value={partnerType}
                        onChange={(e) => setPartnerType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                      >
                        <option value="franchise">New Facility Franchise Expansion</option>
                        <option value="corporate">Corporate Tournament & League Hosting</option>
                        <option value="sponsor">Brand Sponsorship & Court Naming Rights</option>
                        <option value="equipment">Pro Shop Merchant Vendor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-lime-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setInquiryModalOpen(false)}
                        className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs rounded-lg transition"
                      >
                        Submit Proposal
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-lime-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">Inquiry Received</h4>
                  <p className="text-xs text-slate-400">
                    Thank you, {contactName}. A SmashZone commercial representative will be in touch shortly.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
