'use client';

import { Ruler } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';

interface MeasurementField {
  key: string;
  label: string;
  unit: string;
}

interface Measurement {
  id: string;
  version: number;
  values: Record<string, number | string>;
  notes?: string | null;
  createdAt: string;
  template: {
    name: string;
    fields: MeasurementField[];
  };
}

export default function CustomerMeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Measurement[]>('/measurements/me')
      .then(setMeasurements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Loading measurements...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          My Measurements
        </h1>
        <p className="mt-1 text-muted-foreground">
          Measurements saved by your fashion house
        </p>
      </div>

      {measurements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Ruler className="mb-4 h-10 w-10 opacity-40" />
            No measurements on file yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {measurements.map((measurement) => (
            <Card key={measurement.id}>
              <CardHeader>
                <CardTitle>{measurement.template.name}</CardTitle>
                <CardDescription>
                  Version {measurement.version} ·{' '}
                  {new Date(measurement.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {measurement.template.fields.map((field) => (
                    <div
                      key={field.key}
                      className="rounded-lg border px-3 py-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="font-medium">
                        {measurement.values[field.key] ?? '—'}{' '}
                        {field.unit}
                      </p>
                    </div>
                  ))}
                </div>
                {measurement.notes && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {measurement.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
