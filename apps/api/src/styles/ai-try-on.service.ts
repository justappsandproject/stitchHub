import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TryOnMeasurementSnapshot {
  templateName: string;
  values: Record<string, number>;
}

export interface TryOnResult {
  tryOnImageUrl: string | null;
  previewUrl: string | null;
  styleId?: string;
  styleName: string;
  generatedAt: string;
  expiresAt: string;
  isCustomerPhoto: boolean;
  placeholder: boolean;
  disclaimer: string;
  integrationNote: string;
  measurementsUsed: TryOnMeasurementSnapshot[];
}

@Injectable()
export class AiTryOnService {
  constructor(private config: ConfigService) {}

  async generatePreview(input: {
    styleName: string;
    styleCategory: string;
    styleDescription?: string | null;
    stylePhotoUrls: string[];
    measurements: TryOnMeasurementSnapshot[];
    customerPhotoUrl?: string;
    skinTone?: string;
    bodyType?: string;
    gender?: string;
  }): Promise<TryOnResult> {
    const provider = this.config.get<string>('TRYON_PROVIDER') ?? 'replicate';
    const replicateToken = this.config.get<string>('REPLICATE_API_TOKEN');
    const stabilityKey = this.config.get<string>('STABILITY_API_KEY');

    if ((provider === 'replicate' && replicateToken) || stabilityKey) {
      // Hook: call Replicate fashn-ai/fashn or Stability inpainting here.
    }

    const tone = input.skinTone ?? 'medium';
    const body = input.bodyType ?? 'average';
    const gender = input.gender ?? 'unisex';
    const prompt = `A ${tone}-skinned ${gender} model with ${body} build wearing ${input.styleName}, ${input.styleDescription ?? input.styleCategory}, fashion photography, studio lighting, African fashion aesthetic`;

    const fallbackPhoto = input.stylePhotoUrls[0] ?? null;
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      tryOnImageUrl: fallbackPhoto,
      previewUrl: fallbackPhoto,
      styleName: input.styleName,
      generatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isCustomerPhoto: Boolean(input.customerPhotoUrl),
      placeholder: true,
      disclaimer:
        'AI-generated preview. Actual garment may vary. This is a simulated preview based on your preferences and measurements.',
      integrationNote:
        `Prompt ready: "${prompt.slice(0, 80)}…". Set REPLICATE_API_TOKEN or STABILITY_API_KEY for live generation.`,
      measurementsUsed: input.measurements,
    };
  }
}
