import { IsBoolean, IsIn, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

const PROVIDERS = ['assemblyai'] as const;
export type ProviderName = (typeof PROVIDERS)[number];

export class TranscribeFileDto {
  @IsString()
  @IsUrl({ require_tld: false }, { message: 'audioUrl must be a valid URL' })
  @Matches(/^https?:\/\//i, { message: 'audioUrl must start with http or https' })
  public readonly audioUrl!: string;

  @IsOptional()
  @IsIn(PROVIDERS as unknown as string[], { message: 'Unsupported provider' })
  public readonly provider?: ProviderName;

  @IsOptional()
  @IsBoolean()
  public readonly timestamps?: boolean;

  @IsOptional()
  @IsString()
  public readonly apiKey?: string;
}
