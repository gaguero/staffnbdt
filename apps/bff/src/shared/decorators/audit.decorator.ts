import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  action: string;
  entity: string;
  skipAudit?: boolean;
}

export const AUDIT_KEY = 'audit';
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);