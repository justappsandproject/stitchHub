import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {}

  buildResponse(filename: string) {
    const baseUrl =
      this.configService.get<string>('API_PUBLIC_URL') ??
      `http://localhost:${this.configService.get('PORT') ?? 3001}`;

    return {
      url: `${baseUrl}/uploads/${filename}`,
      filename,
    };
  }
}
