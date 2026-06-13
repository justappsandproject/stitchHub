'use client';

import { Plus, Ruler } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface TemplateField {
  key: string;
  label: string;
  unit: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  fields: TemplateField[];
}

interface Measurement {
  id: string;
  version: number;
  values: Record<string, number | string>;
  notes?: string;
  createdAt: string;
  template: { id: string; name: string; fields: TemplateField[] };
}

export default function MeasurementsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [templateId, setTemplateId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Customer[]>('/customers'),
      api<Template[]>('/measurements/templates'),
    ])
      .then(([customerData, templateData]) => {
        setCustomers(customerData);
        setTemplates(templateData);
        if (templateData.length > 0) setTemplateId(templateData[0].id);
      })
      .catch(console.error);
  }, []);

  const loadMeasurements = useCallback(async (customerId: string) => {
    if (!customerId) {
      setMeasurements([]);
      return;
    }
    setLoadingMeasurements(true);
    try {
      const data = await api<Measurement[]>(
        `/measurements/customer/${customerId}`,
      );
      setMeasurements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeasurements(false);
    }
  }, []);

  useEffect(() => {
    loadMeasurements(selectedCustomerId);
  }, [selectedCustomerId, loadMeasurements]);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  function openDialog() {
    setEditingMeasurement(null);
    setValues({});
    setNotes('');
    setError('');
    setDialogOpen(true);
  }

  function openEditDialog(measurement: Measurement) {
    setEditingMeasurement(measurement);
    setTemplateId(measurement.template.id);
    const nextValues: Record<string, string> = {};
    for (const [key, value] of Object.entries(measurement.values)) {
      nextValues[key] = String(value);
    }
    setValues(nextValues);
    setNotes(measurement.notes ?? '');
    setError('');
    setDialogOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const numericValues: Record<string, number> = {};
      for (const [key, val] of Object.entries(values)) {
        if (val !== '') numericValues[key] = parseFloat(val);
      }

      if (editingMeasurement) {
        await api(`/measurements/${editingMeasurement.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            values: numericValues,
            notes: notes || undefined,
          }),
        });
      } else {
        await api('/measurements', {
          method: 'POST',
          body: JSON.stringify({
            customerId: selectedCustomerId,
            templateId,
            values: numericValues,
            notes: notes || undefined,
          }),
        });
      }
      setDialogOpen(false);
      setEditingMeasurement(null);
      loadMeasurements(selectedCustomerId);
    } catch (err: unknown) {
      const apiErr = err as { message?: string | string[] };
      setError(
        Array.isArray(apiErr.message)
          ? apiErr.message.join(', ')
          : apiErr.message ?? 'Failed to save measurement',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Measurement Vault
          </h1>
          <p className="mt-1 text-muted-foreground">
            Digital measurement records with versioning
          </p>
        </div>
        {selectedCustomerId && (
          <Button onClick={openDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Measurement
          </Button>
        )}
      </div>

      <div className="max-w-md space-y-2">
        <Label htmlFor="customer">Customer</Label>
        <Select
          id="customer"
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
        >
          <option value="">Select a customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName} — {c.phone}
            </option>
          ))}
        </Select>
      </div>

      {!selectedCustomerId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ruler className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Select a customer to view or record measurements
            </p>
          </CardContent>
        </Card>
      ) : loadingMeasurements ? (
        <p className="text-muted-foreground">Loading measurements...</p>
      ) : measurements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No measurements recorded for this customer
            </p>
            <Button className="mt-4" onClick={openDialog}>
              Record first measurement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {measurements.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{m.template.name}</CardTitle>
                    <CardDescription>
                      Version {m.version} ·{' '}
                      {new Date(m.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(m)}>
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(m.values).map(([key, value]) => {
                    const field = m.template.fields?.find?.(
                      (f) => f.key === key,
                    );
                    return (
                      <div key={key} className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          {field?.label ?? key}
                        </p>
                        <p className="text-lg font-semibold">
                          {value}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {field?.unit ?? ''}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
                {m.notes && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {m.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMeasurement ? 'Edit Measurement' : 'New Measurement'}</DialogTitle>
            <DialogDescription>
              Record measurements for{' '}
              {customers.find((c) => c.id === selectedCustomerId)?.firstName}{' '}
              {customers.find((c) => c.id === selectedCustomerId)?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                id="template"
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value);
                  setValues({});
                }}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </Select>
            </div>

            {selectedTemplate && (
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={field.key}>
                      {field.label}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({field.unit})
                      </span>
                    </Label>
                    <Input
                      id={field.key}
                      type="number"
                      step="0.25"
                      min="0"
                      value={values[field.key] ?? ''}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Fitting preferences, posture notes..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Measurement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
