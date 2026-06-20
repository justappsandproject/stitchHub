'use client';

import { Camera, Ruler } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { measurementsApi, uploadFile } from '@/lib/api';

const SECTIONS = {
  'Upper Body': [
    { key: 'chestBust', label: 'Chest / Bust' },
    { key: 'shoulderWidth', label: 'Shoulder Width' },
    { key: 'sleeveLength', label: 'Sleeve Length' },
    { key: 'armLength', label: 'Arm Length' },
    { key: 'neck', label: 'Neck' },
    { key: 'armhole', label: 'Armhole' },
  ],
  'Lower Body': [
    { key: 'waist', label: 'Waist' },
    { key: 'hip', label: 'Hip' },
    { key: 'thigh', label: 'Thigh' },
    { key: 'inseam', label: 'Inseam' },
    { key: 'outseam', label: 'Outseam' },
    { key: 'trouserLength', label: 'Trouser Length' },
  ],
  'Full Body': [
    { key: 'height', label: 'Height' },
    { key: 'backLength', label: 'Back Length' },
    { key: 'frontLength', label: 'Front Length' },
    { key: 'dressLength', label: 'Dress Length' },
  ],
} as const;

interface TakeMeasurementDialogProps {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function TakeMeasurementDialog({
  customerId,
  open,
  onOpenChange,
  onSaved,
}: TakeMeasurementDialogProps) {
  const [unit, setUnit] = useState<'cm' | 'inches'>('cm');
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      setPhotoUrls((prev) => [...prev, url]);
    } catch {
      setError('Failed to upload photo');
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const numericValues: Record<string, number> = {};
      for (const [key, val] of Object.entries(values)) {
        if (val.trim()) numericValues[key] = parseFloat(val);
      }
      await measurementsApi.createBody({
        customerId,
        values: numericValues,
        unit,
        notes: notes || undefined,
        photoUrls,
      });
      onOpenChange(false);
      setValues({});
      setNotes('');
      setPhotoUrls([]);
      onSaved();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message ?? 'Failed to save measurement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Take Measurement
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
          <span className="text-sm font-medium text-foreground">Unit:</span>
          <Button
            type="button"
            size="sm"
            variant={unit === 'cm' ? 'default' : 'outline'}
            onClick={() => setUnit('cm')}
          >
            cm
          </Button>
          <Button
            type="button"
            size="sm"
            variant={unit === 'inches' ? 'default' : 'outline'}
            onClick={() => setUnit('inches')}
          >
            inches
          </Button>
        </div>

        {Object.entries(SECTIONS).map(([section, fields]) => (
          <div key={section} className="space-y-3">
            <h3 className="font-semibold text-foreground">{section}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-foreground">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    step="0.1"
                    min="0"
                    value={values[key] ?? ''}
                    onChange={(e) => updateField(key, e.target.value)}
                    placeholder={`0 ${unit}`}
                    className="border-slate-300 bg-white text-foreground dark:border-slate-600 dark:bg-slate-950"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="notes">Custom Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about fit or preferences..."
          />
        </div>

        <div className="space-y-2">
          <Label>Reference Photos</Label>
          <div className="flex flex-wrap gap-2">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Reference"
                className="h-16 w-16 rounded-md border object-cover"
              />
            ))}
            <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 hover:bg-slate-50 dark:border-slate-600">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Measurement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
