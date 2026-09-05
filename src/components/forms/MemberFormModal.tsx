'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import type { Member } from '@/types';

interface MemberFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Required when adding a new member; unused when editing. */
  committeeId?: string;
  /** Pass an existing member to edit them; omit to add a new one. */
  member?: Member | null;
}

export default function MemberFormModal({ open, onClose, committeeId, member }: MemberFormModalProps) {
  const { addMember, updateMember, deleteMember } = useApp();
  const isEdit = Boolean(member);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [form, setForm] = useState({ name: '', phone: '', language: 'english', contribution: '' });

  useEffect(() => {
    if (!open) return;
    setConfirmingDelete(false);
    if (member) {
      setForm({
        name: member.name,
        phone: member.phone ?? '',
        language: member.language,
        contribution: String(member.contribution),
      });
    } else {
      setForm({ name: '', phone: '', language: 'english', contribution: '' });
    }
  }, [member, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      language: form.language,
      contribution: form.contribution ? Number(form.contribution) : undefined,
    };

    if (isEdit && member) {
      updateMember(member.id, payload);
    } else if (committeeId) {
      addMember(committeeId, payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!member) return;
    deleteMember(member.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit member' : 'Add member'}
      size="sm"
      footer={
        confirmingDelete ? (
          <>
            <span className="mr-auto text-[13px] text-kameti-text-secondary">Remove this member? This can't be undone.</span>
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Yes, remove</Button>
          </>
        ) : (
          <>
            {isEdit && (
              <Button variant="ghost" className="mr-auto text-danger hover:bg-danger-bg" onClick={() => setConfirmingDelete(true)}>
                Remove member
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{isEdit ? 'Save changes' : 'Add member'}</Button>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <Input
          label="Phone / contact"
          placeholder="+92 300 0000000"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <Select
          label="Preferred language"
          value={form.language}
          onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
          options={[
            { value: 'english', label: 'English' },
            { value: 'urdu', label: 'اردو' },
            { value: 'hindi', label: 'हिन्दी' },
          ]}
        />
        <Input
          label="Contribution amount"
          placeholder="25000"
          prefix={<span className="text-[13px]">Rs.</span>}
          value={form.contribution}
          onChange={(e) => setForm((p) => ({ ...p, contribution: e.target.value }))}
          type="number"
        />
      </form>
    </Modal>
  );
}
