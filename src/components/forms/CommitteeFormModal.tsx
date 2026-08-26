'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input, { Select } from '@/components/ui/Input';
import { useApp } from '@/context/AppContext';
import type { Committee } from '@/types';

interface CommitteeFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass an existing committee to edit it; omit to create a new one. */
  committee?: Committee | null;
}

export default function CommitteeFormModal({ open, onClose, committee }: CommitteeFormModalProps) {
  const { createCommittee, updateCommittee, deleteCommittee } = useApp();
  const isEdit = Boolean(committee);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [form, setForm] = useState({ name: '', amount: '25000', frequency: 'monthly', cycles: '8', deadline: '' });

  useEffect(() => {
    if (!open) return;
    setConfirmingDelete(false);
    if (committee) {
      setForm({
        name: committee.name,
        amount: String(committee.contributionAmount),
        frequency: committee.frequency,
        cycles: String(committee.totalCycles),
        deadline: committee.deadline ? committee.deadline.slice(0, 10) : '',
      });
    } else {
      setForm({ name: '', amount: '25000', frequency: 'monthly', cycles: '8', deadline: '' });
    }
  }, [committee, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      contributionAmount: Number(form.amount) || 0,
      frequency: form.frequency,
      totalCycles: Number(form.cycles) || 1,
      deadline: form.deadline || undefined,
    };

    if (isEdit && committee) {
      updateCommittee(committee.id, payload);
    } else {
      createCommittee(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!committee) return;
    deleteCommittee(committee.id);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Manage committee' : 'Create a new committee'}
      size="md"
      footer={
        confirmingDelete ? (
          <>
            <span className="mr-auto text-[13px] text-kameti-text-secondary">Delete this committee? This can't be undone.</span>
            <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Yes, delete</Button>
          </>
        ) : (
          <>
            {isEdit && (
              <Button variant="ghost" className="mr-auto text-danger hover:bg-danger-bg" onClick={() => setConfirmingDelete(true)}>
                Delete committee
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit}>{isEdit ? 'Save changes' : 'Create committee'}</Button>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Committee name"
          placeholder="e.g. Family Committee"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <Input
          label="Contribution amount"
          placeholder="25000"
          prefix={<span className="text-[13px]">Rs.</span>}
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          type="number"
          required
        />
        <Select
          label="Frequency"
          value={form.frequency}
          onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'biweekly', label: 'Bi-weekly' },
            { value: 'weekly', label: 'Weekly' },
          ]}
        />
        <Input
          label="Number of cycles"
          placeholder="8"
          value={form.cycles}
          onChange={(e) => setForm((p) => ({ ...p, cycles: e.target.value }))}
          type="number"
          min="2"
          max="52"
          required
        />
        <Input
          label={isEdit ? 'Deadline' : 'Start date'}
          value={form.deadline}
          onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
          type="date"
        />
      </form>
    </Modal>
  );
}
