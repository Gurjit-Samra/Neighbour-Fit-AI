import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Lock, CheckCircle, Download, Loader2, FileText } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ResultsPDFDocument } from "./ResultsPDF";

interface Props {
  open: boolean;
  onClose: () => void;
  matches: any[];
}

type Step = "checkout" | "processing" | "success";

function formatCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function ReportCheckoutModal({ open, onClose, matches }: Props) {
  const [step, setStep] = useState<Step>("checkout");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Enter cardholder name";
    if (card.replace(/\s/g, "").length < 16) e.card = "Enter a valid 16-digit card number";
    if (expiry.length < 5) e.expiry = "Enter expiry (MM/YY)";
    if (cvv.replace(/\D/g, "").length < 3) e.cvv = "Enter CVV";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    setStep("processing");
    setTimeout(() => setStep("success"), 2200);
  };

  const handleDownload = async () => {
    const generatedAt = new Date().toLocaleString("en-CA", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const blob = await pdf(
      <ResultsPDFDocument matches={matches} generatedAt={generatedAt} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "neighbourfit-report.pdf";
    a.click();
    URL.revokeObjectURL(url);
    onClose();
    setStep("checkout");
    setCard(""); setExpiry(""); setCvv(""); setName(""); setErrors({});
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep("checkout"); setCard(""); setExpiry(""); setCvv(""); setName(""); setErrors({}); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            style={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #334155" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#00cc9920" }}>
                  <FileText className="h-4 w-4" style={{ color: "#00cc99" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Get Your Report</p>
                  <p className="text-xs" style={{ color: "#94a3b8" }}>Full PDF • {matches.length} neighbourhoods</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="h-4 w-4" style={{ color: "#94a3b8" }} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* ── Checkout step ── */}
              {step === "checkout" && (
                <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
                  {/* Price summary */}
                  <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#94a3b8" }}>Neighbourhood Compatibility Report</span>
                      <span className="text-white font-medium">$3.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span style={{ color: "#94a3b8" }}>Includes AI lifestyle insights</span>
                      <span style={{ color: "#00cc99" }} className="text-xs font-medium">✓ Included</span>
                    </div>
                    <div style={{ borderTop: "1px solid #334155", paddingTop: 8, marginTop: 4 }} className="flex items-center justify-between">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-white font-bold text-lg">$3.00 CAD</span>
                    </div>
                  </div>

                  {/* Demo notice */}
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "#1c1300", border: "1px solid #92400e", color: "#fbbf24" }}>
                    <span className="font-semibold">Demo mode</span>
                    <span style={{ color: "#d97706" }}>— no real charge. Use any card number.</span>
                  </div>

                  {/* Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Cardholder name</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 transition-colors"
                        style={{ backgroundColor: "#0f172a", border: `1px solid ${errors.name ? "#ef4444" : "#334155"}`, color: "#f1f5f9", focusBorderColor: "#00cc99" }}
                      />
                      {errors.name && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.name}</p>}
                    </div>

                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Card number</label>
                      <div className="relative">
                        <input
                          value={card}
                          onChange={(e) => setCard(formatCard(e.target.value))}
                          placeholder="1234 5678 9012 3456"
                          className="w-full text-sm px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 pr-10"
                          style={{ backgroundColor: "#0f172a", border: `1px solid ${errors.card ? "#ef4444" : "#334155"}`, color: "#f1f5f9" }}
                        />
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#475569" }} />
                      </div>
                      {errors.card && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.card}</p>}
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>Expiry</label>
                        <input
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          className="w-full text-sm px-3 py-2.5 rounded-lg focus:outline-none"
                          style={{ backgroundColor: "#0f172a", border: `1px solid ${errors.expiry ? "#ef4444" : "#334155"}`, color: "#f1f5f9" }}
                        />
                        {errors.expiry && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.expiry}</p>}
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium mb-1 block" style={{ color: "#94a3b8" }}>CVV</label>
                        <input
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="123"
                          type="password"
                          className="w-full text-sm px-3 py-2.5 rounded-lg focus:outline-none"
                          style={{ backgroundColor: "#0f172a", border: `1px solid ${errors.cvv ? "#ef4444" : "#334155"}`, color: "#f1f5f9" }}
                        />
                        {errors.cvv && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{errors.cvv}</p>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePay}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#00cc99", color: "#020617" }}
                  >
                    <Lock className="h-4 w-4" />
                    Pay $3.00 CAD
                  </button>

                  <p className="text-center text-xs" style={{ color: "#475569" }}>
                    Secured by 256-bit SSL encryption · Demo only
                  </p>
                </motion.div>
              )}

              {/* ── Processing step ── */}
              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-12 flex flex-col items-center gap-5"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#00cc9915", border: "2px solid #00cc9940" }}>
                      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#00cc99" }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold mb-1">Processing payment…</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>Generating your PDF report</p>
                  </div>
                </motion.div>
              )}

              {/* ── Success step ── */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-8 flex flex-col items-center gap-5"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#00cc9920", border: "2px solid #00cc9960" }}
                  >
                    <CheckCircle className="h-8 w-8" style={{ color: "#00cc99" }} />
                  </motion.div>

                  <div className="text-center">
                    <p className="text-white font-bold text-lg mb-1">Payment successful!</p>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>
                      Your report is ready to download.
                    </p>
                  </div>

                  <div className="w-full rounded-xl p-4 text-center" style={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}>
                    <p className="text-xs mb-1" style={{ color: "#64748b" }}>NeighbourFit AI — Neighbourhood Report</p>
                    <p className="text-sm font-medium text-white">{matches.length} matches · Full analysis with AI insights</p>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#00cc99", color: "#020617" }}
                  >
                    <Download className="h-4 w-4" />
                    Download PDF Report
                  </button>

                  <p className="text-xs" style={{ color: "#475569" }}>
                    File will be saved as <span className="font-mono">neighbourfit-report.pdf</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
