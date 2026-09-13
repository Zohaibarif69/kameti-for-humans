'use client';

import React, { useState, useEffect } from 'react';
import { User, Bell, Bot, Globe, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';

type SettingsSection = 'profile' | 'notifications' | 'agent' | 'language' | 'security';

const sections: { id: SettingsSection; key: 'profile' | 'notifications' | 'agent' | 'language' | 'security'; icon: React.ReactNode }[] = [
  { id: 'profile', key: 'profile', icon: <User size={16} /> },
  { id: 'notifications', key: 'notifications', icon: <Bell size={16} /> },
  { id: 'agent', key: 'agent', icon: <Bot size={16} /> },
  { id: 'language', key: 'language', icon: <Globe size={16} /> },
  { id: 'security', key: 'security', icon: <Shield size={16} /> },
];

function ProfileSection() {
  const { organizerProfile, updateOrganizerProfile } = useApp();
  const [name, setName] = useState(organizerProfile.name);
  const [email, setEmail] = useState(organizerProfile.email);
  const [phone, setPhone] = useState(organizerProfile.phone);

  // Keep the form in sync if the profile loads/changes after this component
  // has already mounted (e.g. the localStorage read finishing after first render).
  useEffect(() => {
    setName(organizerProfile.name);
    setEmail(organizerProfile.email);
    setPhone(organizerProfile.phone);
  }, [organizerProfile]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[16px] font-semibold text-kameti-text mb-4">Profile</h3>
        <div className="space-y-4">
          <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <Button variant="primary" onClick={() => updateOrganizerProfile({ name, email, phone })}>Save changes</Button>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    inApp: true,
    email: true,
    sms: false,
    whatsapp: true,
  });

  return (
    <div className="space-y-5">
      <h3 className="text-[16px] font-semibold text-kameti-text mb-4">Notifications</h3>
      <div className="space-y-3">
        {[
          { key: 'inApp' as const, label: 'In-app notifications', desc: 'Receive alerts in the dashboard' },
          { key: 'email' as const, label: 'Email notifications', desc: 'Receive updates by email' },
          { key: 'sms' as const, label: 'SMS notifications', desc: 'Receive SMS reminders' },
          { key: 'whatsapp' as const, label: 'WhatsApp notifications', desc: 'Receive WhatsApp messages' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-kameti-border last:border-0">
            <div>
              <p className="text-[14px] font-medium text-kameti-text">{label}</p>
              <p className="text-[12px] text-kameti-text-muted">{desc}</p>
            </div>
            <button
              onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
              className={`relative w-10 h-5 rounded-full transition-all ${prefs[key] ? 'bg-primary' : 'bg-kameti-border'}`}
              role="switch"
              aria-checked={prefs[key]}
              aria-label={label}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs[key] ? 'left-5.5' : 'left-0.5'}`} style={{ left: prefs[key] ? '22px' : '2px' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentSection() {
  const [threshold, setThreshold] = useState('2');
  const [beforeDeadline, setBeforeDeadline] = useState('24');
  const [afterDeadline, setAfterDeadline] = useState('2');
  const [approvals, setApprovals] = useState({
    partial: true,
    rotation: true,
    member: true,
    contribution: true,
  });

  return (
    <div className="space-y-6">
      <h3 className="text-[16px] font-semibold text-kameti-text">Agent preferences</h3>

      <div className="space-y-4">
        <h4 className="text-[14px] font-semibold text-kameti-text">Reminder timing</h4>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Before deadline (hours)" value={beforeDeadline} onChange={e => setBeforeDeadline(e.target.value)} type="number" min="1" max="72" />
          <Input label="After deadline (hours)" value={afterDeadline} onChange={e => setAfterDeadline(e.target.value)} type="number" min="1" max="72" />
        </div>
        <Input
          label="Late payment threshold (escalate after N late payments)"
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
          type="number"
          min="1"
          max="10"
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-[14px] font-semibold text-kameti-text">Human approval required for</h4>
        {[
          { key: 'partial' as const, label: 'Partial payout' },
          { key: 'rotation' as const, label: 'Rotation changes' },
          { key: 'member' as const, label: 'Member changes' },
          { key: 'contribution' as const, label: 'Contribution changes' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={approvals[key]}
              onChange={e => setApprovals(p => ({ ...p, [key]: e.target.checked }))}
              className="w-4 h-4 text-primary rounded border-kameti-border"
            />
            <span className="text-[14px] text-kameti-text">{label}</span>
          </label>
        ))}
      </div>

      <Button variant="primary">Save preferences</Button>
    </div>
  );
}

function LanguageSection() {
  const { language, setLanguage } = useApp();
  return (
    <div className="space-y-5">
      <h3 className="text-[16px] font-semibold text-kameti-text mb-4">Language</h3>
      <div className="space-y-2">
        {[
          { value: 'english' as const, label: 'English' },
          { value: 'urdu' as const, label: 'اردو' },
          { value: 'hindi' as const, label: 'हिन्दी' },
        ].map(l => (
          <label key={l.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${language === l.value ? 'border-primary bg-primary-light' : 'border-kameti-border hover:bg-kameti-bg'}`}>
            <input type="radio" name="language" value={l.value} checked={language === l.value} onChange={() => setLanguage(l.value)} className="text-primary" />
            <span className={`text-[14px] font-medium ${language === l.value ? 'text-primary-dark' : 'text-kameti-text'}`}>{l.label}</span>
          </label>
        ))}
      </div>
      <p className="text-[12px] text-kameti-text-muted">Changing language updates navigation labels, system messages, and dates.</p>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-5">
      <h3 className="text-[16px] font-semibold text-kameti-text mb-4">Security & trust</h3>
      <div className="space-y-4">
        <div className="bg-primary-light border border-primary/15 rounded-xl p-4">
          <p className="text-[13px] font-semibold text-primary-dark mb-1">Your committee records are private</p>
          <p className="text-[13px] text-primary-dark/70">Only you and your committee members can access this data.</p>
        </div>
        <div className="bg-kameti-surface-2 rounded-xl p-4">
          <p className="text-[13px] font-semibold text-kameti-text mb-1">Kameti does not move money</p>
          <p className="text-[13px] text-kameti-text-secondary">Kameti coordinates and tracks contributions but never processes or transfers funds on your behalf.</p>
        </div>
      </div>
      <div className="pt-2 border-t border-kameti-border">
        <p className="text-[12px] text-kameti-text-muted mt-2">Version 0.1 · <a href="#" className="text-primary hover:underline">Privacy</a> · <a href="#" className="text-primary hover:underline">Terms</a> · <a href="#" className="text-primary hover:underline">Help</a></p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const { t } = useApp();

  const contentMap: Record<SettingsSection, React.ReactNode> = {
    profile: <ProfileSection />,
    notifications: <NotificationsSection />,
    agent: <AgentSection />,
    language: <LanguageSection />,
    security: <SecuritySection />,
  };

  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <div className="mb-6">
        <h2 className="text-[24px] font-bold text-kameti-text">{t.settingsPage.title}</h2>
        <p className="text-[14px] text-kameti-text-secondary mt-1">{t.settingsPage.subtitle}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Nav */}
        <div className="md:w-48 shrink-0">
          <nav className="space-y-0.5">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] font-medium transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-primary-light text-primary-dark'
                    : 'text-kameti-text-secondary hover:bg-kameti-surface-2 hover:text-kameti-text'
                }`}
              >
                <span className={activeSection === s.id ? 'text-primary' : 'text-kameti-text-muted'}>{s.icon}</span>
                {t.settingsPage.sections[s.key]}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-kameti-border p-6" style={{ boxShadow: '0 1px 3px rgba(20,35,28,0.06)' }}>
          {contentMap[activeSection]}
        </div>
      </div>
    </div>
  );
}
