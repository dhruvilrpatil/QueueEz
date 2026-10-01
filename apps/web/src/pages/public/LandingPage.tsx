import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, Calendar, Bell, BarChart2, ChevronRight, CheckCircle,
  Building2, Users, Zap, ArrowRight, Star
} from 'lucide-react';
import { PublicHeader, PublicFooter } from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/Button';

// Mock queue ticket preview component (shows real product UI)
function QueueTicketPreview() {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-card max-w-sm w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-caption text-muted">Your Ticket</p>
          <p className="text-display-md font-semibold text-ink tracking-tight">A-104</p>
        </div>
        <div className="text-right">
          <p className="text-caption text-muted">Status</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-medium bg-warning/10 text-warning">
            <span className="live-dot" /> Waiting
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface-soft rounded-lg p-3 text-center">
          <p className="text-display-sm font-semibold text-ink">6</p>
          <p className="text-caption text-muted">Ahead</p>
        </div>
        <div className="bg-surface-soft rounded-lg p-3 text-center">
          <p className="text-display-sm font-semibold text-ink">~24</p>
          <p className="text-caption text-muted">Minutes</p>
        </div>
        <div className="bg-surface-soft rounded-lg p-3 text-center">
          <p className="text-display-sm font-semibold text-ink">A-098</p>
          <p className="text-caption text-muted">Serving</p>
        </div>
      </div>

      <div className="border-t border-hairline pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted">Counter</span>
          <span className="text-body-sm font-medium text-ink">Counter 3</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted">Service</span>
          <span className="text-body-sm font-medium text-ink">General Consultation</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-muted">Facility</span>
          <span className="text-body-sm font-medium text-ink">CityCare Clinic</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-hairline">
        <div className="flex items-center gap-2 text-caption text-muted">
          <span className="live-dot" />
          Live updates enabled
        </div>
      </div>
    </div>
  );
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface-card rounded-xl p-8">
      <div className="w-10 h-10 flex items-center justify-center bg-canvas rounded-lg mb-4 text-ink shadow-soft">
        {icon}
      </div>
      <h3 className="text-title-md text-ink mb-2">{title}</h3>
      <p className="text-body-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* Hero */}
      <section className="container-content py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-card rounded-full text-caption text-muted mb-6">
              <Star size={12} className="text-badge-orange" />
              Smart Queue Management for Modern India
            </div>
            <h1 className="text-6xl font-semibold text-ink leading-tight tracking-tight mb-6">
              Skip the wait.<br />
              Keep your place.
            </h1>
            <p className="text-body-md text-muted leading-relaxed mb-8 max-w-md">
              Book appointments, join virtual queues, and know when it's your turn —
              before you reach the counter. Works for clinics, banks, government offices,
              and more.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/app/queue')} size="lg">
                Join a Queue
                <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/facilities')} size="lg">
                Browse Facilities
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-body-sm text-muted">
              {[
                'No app download needed',
                'Works on any device',
                'Real-time updates',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-success shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
          </div>

          {/* Hero product mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full bg-surface-soft rounded-xl" />
              <QueueTicketPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Problem band */}
      <section className="bg-surface-card py-24" id="features">
        <div className="container-content text-center mb-16">
          <h2 className="text-5xl font-semibold text-ink mb-4 tracking-tight">
            Long queues shouldn't be<br />part of the process.
          </h2>
          <p className="text-body-md text-muted max-w-xl mx-auto">
            People spend hours waiting physically at counters. EzQueue digitizes the
            entire waiting experience so your time is never wasted.
          </p>
        </div>

        <div className="container-content grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Clock size={20} />}
            title="Virtual Queues"
            description="Join from anywhere. See your position in real-time. Get notified when your turn is near."
          />
          <FeatureCard
            icon={<Calendar size={20} />}
            title="Smart Appointments"
            description="Book time slots in advance. No double-bookings, no conflicts. Easy rescheduling."
          />
          <FeatureCard
            icon={<Bell size={20} />}
            title="Live Wait Estimates"
            description="See accurate wait times based on current queue data. Plan your day around it."
          />
          <FeatureCard
            icon={<Zap size={20} />}
            title="Instant Notifications"
            description="Get notified when you're next. Walk in exactly when you're called."
          />
          <FeatureCard
            icon={<Building2 size={20} />}
            title="Counter Management"
            description="Staff can manage queues, call customers, handle priorities — all from one dashboard."
          />
          <FeatureCard
            icon={<BarChart2 size={20} />}
            title="Operational Analytics"
            description="See queue volumes, wait times, peak hours, and service efficiency data."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="container-content py-24" id="how-it-works">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-semibold text-ink mb-4 tracking-tight">
            How EzQueue works
          </h2>
          <p className="text-body-md text-muted">Four simple steps to skip the wait.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: '1', title: 'Find a Facility', desc: 'Browse clinics, banks, and government offices near you.' },
            { step: '2', title: 'Book or Join', desc: 'Book an appointment in advance or join the live virtual queue.' },
            { step: '3', title: 'Track Your Turn', desc: 'Watch live position updates. Get notified when you\'re next.' },
            { step: '4', title: 'Get Served', desc: 'Walk in at the right time. No waiting in physical lines.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-title-sm mx-auto mb-4">
                {step}
              </div>
              <h3 className="text-title-sm text-ink mb-2">{title}</h3>
              <p className="text-body-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="container-content pb-24">
        <div className="bg-surface-card rounded-xl p-16 text-center">
          <h2 className="text-4xl font-semibold text-ink mb-4 tracking-tight">
            Ready to skip the wait?
          </h2>
          <p className="text-body-md text-muted mb-8 max-w-sm mx-auto">
            Join thousands of people who manage queues smarter with EzQueue.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/register')} size="lg">
              Get started free
            </Button>
            <Button variant="secondary" onClick={() => navigate('/facilities')} size="lg">
              Browse facilities
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
