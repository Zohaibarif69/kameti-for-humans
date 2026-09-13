'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, Bot, ArrowRight, RefreshCw, CircleDollarSign, Bell, UsersRound } from 'lucide-react';
import Button from '@/components/ui/Button';

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-light via-white to-white opacity-60" />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-12 lg:py-14 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-light border border-primary/20 rounded-full px-3 sm:px-4 py-1.5 mb-4 sm:mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary status-dot-active" />
          <span className="text-[12px] sm:text-[13px] font-medium text-primary">AI-powered committee coordination</span>
        </div>
        <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.15] font-bold text-primary-dark mb-3 sm:mb-4 max-w-2xl mx-auto">
          Keep the trust.<br />Automate the coordination.
        </h1>
        <p className="text-[14px] sm:text-[16px] lg:text-[17px] text-kameti-text-secondary max-w-xl mx-auto mb-6 sm:mb-7 leading-relaxed">
          Kameti quietly manages the repetitive work behind your community savings circle — so you can focus on the people.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" iconRight={<ArrowRight size={16} />} className="w-full sm:w-auto justify-center">
              Create your committee
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto justify-center">
              See how it works
            </Button>
          </Link>
        </div>

        {/* Mock dashboard preview */}
        <div className="mt-8 sm:mt-10 rounded-xl sm:rounded-2xl border border-kameti-border overflow-hidden shadow-2xl" style={{ boxShadow: '0 24px 80px rgba(20,35,28,0.12)' }}>
          <div className="bg-kameti-surface-2 px-4 py-2 sm:py-2.5 flex items-center gap-2 border-b border-kameti-border">
            <div className="w-2.5 h-2.5 rounded-full bg-danger/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
            <span className="text-[11px] sm:text-[12px] text-kameti-text-muted mx-auto">kameti.app/dashboard</span>
          </div>
          <div className="bg-kameti-bg p-3 sm:p-4 text-left">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-2.5 sm:mb-3">
              {[
                { val: '3', sub: 'Active' },
                { val: 'Rs.475k', sub: 'Collected' },
                { val: '2', sub: 'Pending' },
                { val: '1', sub: 'Decision' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-lg border border-kameti-border p-2 sm:p-2.5">
                  <p className="text-[15px] sm:text-[17px] font-bold text-kameti-text">{s.val}</p>
                  <p className="text-[10px] sm:text-[11px] text-kameti-text-muted">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="bg-warning-bg border border-warning/20 rounded-lg p-2 sm:p-2.5 flex items-start gap-2.5 sm:gap-3">
              <div className="w-2 h-2 rounded-full bg-warning mt-1 shrink-0" />
              <div>
                <p className="text-[12px] sm:text-[13px] font-semibold text-warning">1 decision requires your attention</p>
                <p className="text-[11px] sm:text-[12px] text-kameti-text-muted">{"Zainab's payment is overdue in Family Committee"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section className="bg-kameti-bg py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-kameti-text mb-4 sm:mb-6">
          Running a committee {"shouldn't"} mean chasing payments every month.
        </h2>
        <p className="text-[14px] sm:text-[16px] text-kameti-text-secondary max-w-2xl mx-auto leading-relaxed">
          Every month you spend time reminding members, tracking who paid, verifying receipts, and managing disputes.
          Kameti handles all of that — so you can trust the process without managing it yourself.
        </p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: '01', title: 'Connect your committee', desc: 'Set up your members, contribution amount, and rotation schedule in minutes.' },
    { num: '02', title: 'Kameti monitors it', desc: 'The agent tracks payments, sends reminders, and verifies receipts automatically.' },
    { num: '03', title: 'You handle what matters', desc: 'Only the decisions that genuinely need you are brought to your attention.' },
  ];

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-kameti-text text-center mb-10 sm:mb-14">How it works</h2>
        <div className="grid sm:grid-cols-3 gap-8 sm:gap-8">
          {steps.map(step => (
            <div key={step.num}>
              <div className="text-[40px] sm:text-[48px] font-bold text-primary-light mb-3 sm:mb-4">{step.num}</div>
              <h3 className="text-[16px] sm:text-[18px] font-semibold text-kameti-text mb-2">{step.title}</h3>
              <p className="text-[13px] sm:text-[14px] text-kameti-text-secondary leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const capabilities = [
    { icon: CircleDollarSign, title: 'Track payments', desc: 'Every contribution recorded and verified with receipt analysis.' },
    { icon: RefreshCw, title: 'Manage rotation', desc: 'Automatic cycle tracking with clear payout scheduling.' },
    { icon: Bell, title: 'Send reminders', desc: 'Timely WhatsApp and SMS reminders to members, automatically.' },
    { icon: CheckCircle, title: 'Verify receipts', desc: 'AI-powered receipt verification for amounts and references.' },
    { icon: Bot, title: 'Detect patterns', desc: 'Identify repeated late-payment behavior before it becomes a problem.' },
    { icon: UsersRound, title: 'Surface decisions', desc: 'Only escalate what genuinely needs your human judgment.' },
  ];

  return (
    <section className="bg-kameti-bg py-14 sm:py-20">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-kameti-text text-center mb-3 sm:mb-4">What Kameti handles</h2>
        <p className="text-[14px] sm:text-[15px] text-kameti-text-secondary text-center mb-10 sm:mb-12">All the coordination. None of the noise.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {capabilities.map(cap => {
            const Icon = cap.icon;
            return (
              <div key={cap.title} className="bg-white rounded-xl border border-kameti-border p-4 sm:p-5" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary mb-3 sm:mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-kameti-text mb-1">{cap.title}</h3>
                <p className="text-[13px] text-kameti-text-secondary leading-relaxed">{cap.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ControlSection() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-8">
        <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <h2 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-kameti-text mb-4">AI handles the routine. You stay in control.</h2>
            <p className="text-[13px] sm:text-[15px] text-kameti-text-secondary leading-relaxed mb-5 sm:mb-6">
              Kameti is designed to be transparent about everything it does. Every action is logged, every decision is explained, and anything that could affect your community is brought to you first.
            </p>
            <div className="space-y-3">
              {[
                'Human approval required for sensitive actions',
                'Complete audit trail of every agent action',
                'No automatic money movement, ever',
                'Configurable thresholds and escalation rules',
              ].map(point => (
                <div key={point} className="flex items-center gap-2.5">
                  <CheckCircle size={15} className="text-primary shrink-0" />
                  <span className="text-[13px] sm:text-[14px] text-kameti-text">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-primary-light rounded-2xl p-5 sm:p-6 border border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-primary status-dot-active" />
              <span className="text-[12px] sm:text-[13px] font-medium text-primary">Kameti Agent · Active</span>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {[
                { check: true, text: 'Payment records checked' },
                { check: true, text: 'Deadline verified' },
                { check: true, text: 'Payment history analyzed' },
                { check: true, text: 'Repeated pattern detected' },
                { warn: true, text: 'Human decision required' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  {item.warn
                    ? <div className="w-3 h-3 rounded-full bg-warning shrink-0" />
                    : <CheckCircle size={14} className="text-primary shrink-0" />
                  }
                  <span className={`text-[12px] sm:text-[13px] ${item.warn ? 'font-semibold text-warning' : 'text-primary-dark'}`}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-primary-dark py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <h2 className="text-[26px] sm:text-[32px] lg:text-[36px] font-bold text-white mb-3 sm:mb-4">Ready to stop chasing payments?</h2>
        <p className="text-[14px] sm:text-[16px] text-primary-light mb-7 sm:mb-8 leading-relaxed">
          Set up your first committee in minutes and let Kameti handle the rest.
        </p>
        <Link href="/dashboard">
          <Button size="lg" className="bg-white text-primary-dark hover:bg-primary-light" iconRight={<ArrowRight size={16} />}>
            Create your committee
          </Button>
        </Link>
      </div>
    </section>
  );
}

function LandingNav() {
  return (
    <nav className="bg-white border-b border-kameti-border sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-[15px]">K</div>
          <span className="text-[16px] font-bold text-primary-dark tracking-tight">KAMETI</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">Sign in</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <CapabilitiesSection />
      <ControlSection />
      <CTASection />
      <footer className="bg-white border-t border-kameti-border py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-[11px]">K</div>
            <span className="text-[13px] sm:text-[14px] font-semibold text-kameti-text">Kameti</span>
            <span className="text-[12px] text-kameti-text-muted hidden sm:inline">Keep the trust. Automate the coordination.</span>
          </div>
          <div className="flex items-center gap-4">
            {['Privacy', 'Terms', 'Help'].map(link => (
              <a key={link} href="#" className="text-[12px] sm:text-[13px] text-kameti-text-muted hover:text-primary transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
