import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Shield, Award, Users, CheckCircle, Mail, Phone, MapPin,
  HelpCircle, Search, FileText, ChevronDown, ChevronRight, Send,
  Lock, AlertCircle, Sparkles, Building2, Check, ExternalLink
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

// ============================================================
// ABOUT PAGE (/about)
// ============================================================
export function AboutPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-24 border-b border-hairline bg-surface-soft/30">
          <div className="container-content text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-primary/10 text-primary mb-4">
              <Sparkles size={14} /> Our Mission
            </span>
            <h1 className="text-display-lg md:text-display-xl font-bold text-ink tracking-tight font-display mb-6">
              Reinventing how people wait in line.
            </h1>
            <p className="text-body-md text-muted leading-relaxed">
              QueueEz was created with a single objective: eliminate physical waiting rooms and give people their time back. We combine real-time virtual queues, predictive wait times, and unified appointment scheduling across hospitals, clinics, and service centers.
            </p>
          </div>
        </section>

        {/* Stats Band */}
        <section className="py-12 border-b border-hairline bg-canvas">
          <div className="container-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-xl bg-surface-soft border border-hairline">
                <p className="text-display-md font-bold text-ink font-display">4.2M+</p>
                <p className="text-body-sm text-muted mt-1">Virtual Queues Handled</p>
              </div>
              <div className="p-6 rounded-xl bg-surface-soft border border-hairline">
                <p className="text-display-md font-bold text-ink font-display">450+</p>
                <p className="text-body-sm text-muted mt-1">Healthcare Facilities</p>
              </div>
              <div className="p-6 rounded-xl bg-surface-soft border border-hairline">
                <p className="text-display-md font-bold text-ink font-display">68%</p>
                <p className="text-body-sm text-muted mt-1">Avg. Wait Time Reduced</p>
              </div>
              <div className="p-6 rounded-xl bg-surface-soft border border-hairline">
                <p className="text-display-md font-bold text-ink font-display">99.98%</p>
                <p className="text-body-sm text-muted mt-1">Platform Uptime SLA</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container-content">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-display-sm md:text-display-md font-bold text-ink font-display">
                Guided by respect for every human's time.
              </h2>
              <p className="text-body-md text-muted mt-3">
                Behind every queue token is a patient, a customer, or a worker with important things to do.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-surface-card rounded-xl p-8 border border-hairline space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <h3 className="text-title-md font-semibold text-ink">Precision Forecasting</h3>
                <p className="text-body-sm text-muted leading-relaxed">
                  Our machine-learning models calculate wait times based on historical provider cadence, real-time desk throughput, and patient triage levels.
                </p>
              </div>

              <div className="bg-surface-card rounded-xl p-8 border border-hairline space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <h3 className="text-title-md font-semibold text-ink">HIPAA & GDPR Grade</h3>
                <p className="text-body-sm text-muted leading-relaxed">
                  Patient identifiers and medical records are encrypted in transit and at rest. Queue monitors display masked tokens rather than sensitive personal data.
                </p>
              </div>

              <div className="bg-surface-card rounded-xl p-8 border border-hairline space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Users size={24} />
                </div>
                <h3 className="text-title-md font-semibold text-ink">Seamless Operator Ergonomics</h3>
                <p className="text-body-sm text-muted leading-relaxed">
                  Staff dashboards are engineered for high-pressure clinic environments: one-click ticket calls, audio chimes, automatic transfers, and instant walk-ins.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 bg-surface-soft border-t border-hairline">
          <div className="container-content text-center max-w-2xl mx-auto">
            <h2 className="text-display-sm font-bold text-ink font-display mb-4">
              Ready to eliminate waiting rooms?
            </h2>
            <p className="text-body-sm text-muted mb-8">
              Join hundreds of forward-thinking facilities streamlining patient arrival.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link to="/facilities">
                <Button variant="secondary" size="lg">Browse Facilities</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

// ============================================================
// PRIVACY POLICY PAGE (/privacy)
// ============================================================
export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-16 md:py-20">
        <div className="container-content max-w-4xl mx-auto">
          <div className="border-b border-hairline pb-8 mb-10">
            <span className="text-caption font-semibold text-muted uppercase tracking-wider">
              Legal & Compliance
            </span>
            <h1 className="text-display-md md:text-display-lg font-bold text-ink tracking-tight font-display mt-2">
              Privacy Policy
            </h1>
            <p className="text-body-sm text-muted mt-2">
              Last updated: October 2026 • Effective immediately across all QueueEz services
            </p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-8 text-body-md text-ink/80 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">1. Information We Collect</h2>
              <p>
                QueueEz operates as a healthcare-grade appointment and virtual queue management system. When you use our platform as a patient, customer, staff member, or administrator, we collect the minimum necessary data to fulfill service dispatch:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-muted">
                <li><strong>Identity Information:</strong> Name, phone number, and email address used for ticket confirmations and SMS alerts.</li>
                <li><strong>Queue & Booking Data:</strong> Service type, chosen facility, scheduled time, ticket token number, and wait-time statistics.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, and device telemetry used solely for security auditing and load balancing.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">2. How We Use Information</h2>
              <p>We process your data strictly to facilitate your queue status and appointments:</p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-muted">
                <li>Dispatching live status notifications and estimates when your turn is approaching.</li>
                <li>Providing healthcare operators and facility desks with patient arrival information.</li>
                <li>Aggregated, anonymized performance analytics to optimize clinic staffing and reduce wait times.</li>
                <li>We do not sell, rent, or monetize your personal data to third-party advertisers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">3. HIPAA & Healthcare Data Security</h2>
              <p>
                All data transmissions are encrypted using TLS 1.3 encryption. At rest, data is protected using AES-256 bit encryption. Access to patient records is strictly gated by Role-Based Access Control (RBAC) and tracked in immutable audit logs.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">4. Data Retention and Rights</h2>
              <p>
                You have the right to request access, correction, or deletion of your personal account data at any time. Queue ticket logs are automatically purged or anonymized after 90 days in accordance with medical facility record standards.
              </p>
            </section>

            <section className="space-y-3 pt-6 border-t border-hairline">
              <h2 className="text-title-md font-bold text-ink font-display">Contact Data Privacy Officer</h2>
              <p className="text-body-sm text-muted">
                For questions regarding data processing or to exercise your GDPR/HIPAA rights, reach us at{' '}
                <a href="mailto:privacy@queueez.io" className="text-primary font-semibold hover:underline">
                  privacy@queueez.io
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// ============================================================
// TERMS OF SERVICE PAGE (/terms)
// ============================================================
export function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-16 md:py-20">
        <div className="container-content max-w-4xl mx-auto">
          <div className="border-b border-hairline pb-8 mb-10">
            <span className="text-caption font-semibold text-muted uppercase tracking-wider">
              Legal Agreement
            </span>
            <h1 className="text-display-md md:text-display-lg font-bold text-ink tracking-tight font-display mt-2">
              Terms of Service
            </h1>
            <p className="text-body-sm text-muted mt-2">
              Effective Date: October 2026 • Please read carefully before using QueueEz
            </p>
          </div>

          <div className="space-y-8 text-body-md text-ink/80 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">1. Acceptance of Terms</h2>
              <p>
                By registering for an account, booking an appointment, or joining a virtual queue through QueueEz, you agree to comply with and be bound by these Terms of Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">2. Service Usage & Queue Etiquette</h2>
              <p>
                Queue tokens represent a reservation for service and are non-transferable unless permitted by facility policy. Users agree:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-body-sm text-muted">
                <li>To provide accurate name and contact details when reserving slots.</li>
                <li>To arrive within the designated check-in buffer when called to a counter.</li>
                <li>Repeated no-shows may result in temporary cooling-off limits on automated bookings.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">3. Medical Emergency Disclaimer</h2>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-200/80 text-amber-900 text-body-sm">
                <strong>CRITICAL NOTICE:</strong> QueueEz is an administrative scheduling tool and is not an emergency dispatch service. If you are experiencing a life-threatening medical emergency, call 911 or visit the nearest emergency room immediately.
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-title-lg font-bold text-ink font-display">4. Facility Responsibilities</h2>
              <p>
                Individual medical and commercial facilities are solely responsible for the medical treatment, consultation advice, and service delivery provided at their counters.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// ============================================================
// DOCUMENTATION & HELP CENTER PAGE (/docs)
// ============================================================
export function DocsPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does virtual queueing work for patients and walk-ins?',
      a: 'When you join a virtual queue, our platform assigns you a sequential token and calculates an estimated wait time. You can view your real-time position from your phone without standing in line. We send an SMS and browser alert when you are 2 places ahead.',
    },
    {
      q: 'How do healthcare staff call and advance tickets?',
      a: 'Staff log into the Staff Counter interface at /staff/queue. With one click on "Call Next", the system sounds an audible clinic chime, marks the counter as serving, and sends an immediate notification to the patient.',
    },
    {
      q: 'Can a patient reschedule or cancel an appointment?',
      a: 'Yes. Navigate to the Appointments tab in the customer dashboard (/app/appointments). You can view booking references, reschedule to a different available date/slot, or cancel with automatic slot release.',
    },
    {
      q: 'How do administrators set up new counters and services?',
      a: 'Facility Admins access /admin/services and /admin/counters. From there, you can define target duration in minutes, assign service desks, and set priority rules for walk-ins versus booked visits.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="container-content max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-caption font-semibold text-primary uppercase tracking-wider">
              Documentation & Knowledge Base
            </span>
            <h1 className="text-display-lg font-bold text-ink tracking-tight font-display mt-2 mb-4">
              How can we help you?
            </h1>
            <p className="text-body-md text-muted mb-8">
              Explore guides, operating manuals, and answers to common queue management questions.
            </p>

            <div className="relative max-w-xl mx-auto">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, guides, and FAQs..."
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-hairline bg-surface-soft text-ink placeholder:text-muted outline-none focus:bg-canvas focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-xs transition-all text-sm"
              />
            </div>
          </div>

          {/* Quick Guides Grid */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            <div className="p-6 rounded-xl bg-surface-card border border-hairline hover:border-ink/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center mb-4">
                <Users size={18} />
              </div>
              <h3 className="text-title-sm font-semibold text-ink mb-1">Customer Guide</h3>
              <p className="text-caption text-muted mb-3">Learn how to join walk-in queues, view live wait times, and book visits.</p>
              <Link to="/facilities" className="text-caption font-semibold text-primary flex items-center gap-1 hover:underline">
                Explore Facilities <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-surface-card border border-hairline hover:border-ink/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center mb-4">
                <Clock size={18} />
              </div>
              <h3 className="text-title-sm font-semibold text-ink mb-1">Staff Counter Desk</h3>
              <p className="text-caption text-muted mb-3">Operator manual for calling tickets, priority triage, and audio chimes.</p>
              <Link to="/login" className="text-caption font-semibold text-primary flex items-center gap-1 hover:underline">
                Staff Portal <ChevronRight size={14} />
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-surface-card border border-hairline hover:border-ink/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center mb-4">
                <Building2 size={18} />
              </div>
              <h3 className="text-title-sm font-semibold text-ink mb-1">Facility Admin</h3>
              <p className="text-caption text-muted mb-3">Configuring departments, analytics reporting, and counter assignments.</p>
              <Link to="/login" className="text-caption font-semibold text-primary flex items-center gap-1 hover:underline">
                Admin Overview <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-4">
            <h2 className="text-title-md font-bold text-ink font-display mb-4">Frequently Asked Questions</h2>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-semibold text-ink hover:bg-surface-soft/40 transition-colors cursor-pointer text-sm sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-body-sm text-muted border-t border-hairline/40 leading-relaxed bg-surface-soft/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// ============================================================
// CONTACT PAGE (/contact)
// ============================================================
export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('hospital_onboarding');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);

    const categoryLabels: Record<string, string> = {
      hospital_onboarding: 'Hospital or Clinic Deployment',
      enterprise_demo: 'Enterprise Queue License',
      technical_support: 'Technical & Realtime Assistance',
      billing: 'Billing & SLA Inquiries',
    };
    const categoryText = categoryLabels[category] || category;
    const subject = encodeURIComponent(`[QueueEz Inquiry] ${categoryText} - ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nInquiry Type: ${categoryText}\n\nMessage:\n${message}\n\n---\nDispatched via QueueEz Contact Portal`
    );
    const mailtoUrl = `mailto:ubrivant@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(() => {
      setIsSubmitting(false);
      window.location.href = mailtoUrl;
      toast.success('Opening your email client to dispatch to ubrivant@gmail.com...');
      setName('');
      setEmail('');
      setMessage('');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <PublicHeader />

      <main className="flex-1 py-16 md:py-20">
        <div className="container-content max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Contact Information */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="text-caption font-semibold text-primary uppercase tracking-wider">
                  Get in Touch
                </span>
                <h1 className="text-display-md font-bold text-ink tracking-tight font-display mt-2">
                  We'd love to hear from you.
                </h1>
                <p className="text-body-sm text-muted mt-3 leading-relaxed">
                  Have questions about bringing QueueEz to your clinic or hospital? Need technical support? Our specialized onboarding team is ready to help.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-soft border border-hairline">
                  <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <h3 className="text-body-sm font-semibold text-ink">Email Support</h3>
                    <p className="text-caption text-muted">Direct dispatch to our engineering desk</p>
                    <a href="mailto:ubrivant@gmail.com" className="text-body-sm font-medium text-primary hover:underline mt-1 block">
                      ubrivant@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-soft border border-hairline">
                  <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="text-body-sm font-semibold text-ink">Emergency Hotline</h3>
                    <p className="text-caption text-muted">24/7 dedicated hospital uptime support</p>
                    <p className="text-body-sm font-medium text-ink mt-1">+1 (800) 555-QUEUE</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-4 rounded-xl bg-surface-soft border border-hairline">
                  <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-body-sm font-semibold text-ink">Headquarters</h3>
                    <p className="text-caption text-muted">SBMP College, Erla, Vile Parle(West)</p>
                    <p className="text-body-sm font-medium text-ink mt-1">Mumbai - 400031, Maharashtra, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Form Card */}
            <div className="lg:col-span-7">
              <form onSubmit={handleSubmit} className="bg-canvas border border-hairline rounded-2xl shadow-card p-8 space-y-5">
                <h2 className="text-title-md font-bold text-ink font-display">Send us a message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-caption font-medium text-ink mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-caption font-medium text-ink mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@hospital.org"
                      className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-caption font-medium text-ink mb-1.5">Inquiry Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="hospital_onboarding">Hospital or Clinic Deployment</option>
                    <option value="enterprise_demo">Enterprise Queue License</option>
                    <option value="technical_support">Technical & Realtime Assistance</option>
                    <option value="billing">Billing & SLA Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-caption font-medium text-ink mb-1.5">Message Details *</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your facility size, daily patient throughput, and specific queue goals..."
                    className="w-full p-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting} iconRight={<Send size={15} />}>
                  Dispatch Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
