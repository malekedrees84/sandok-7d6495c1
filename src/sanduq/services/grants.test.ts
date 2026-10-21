import { describe, expect, it } from 'vitest';
import { grantSchema, validateAttachments } from './grants';
import { matchesFileSignature } from '../../../supabase/functions/submit-grant/validation';

describe('Grant application validation', () => {
  const valid = { applicant_name: 'طلب تجريبي', phone: '0501234567', address: 'عنوان تجريبي', category: 'education', requested_amount: 500, reason: 'طلب دعم تكاليف التعليم' };
  it('accepts complete application data', () => expect(grantSchema.safeParse(valid).success).toBe(true));
  it('rejects zero and negative amounts', () => {
    expect(grantSchema.safeParse({ ...valid, requested_amount: 0 }).success).toBe(false);
    expect(grantSchema.safeParse({ ...valid, requested_amount: -1 }).success).toBe(false);
  });
  it('requires applicant phone and reason', () => {
    expect(grantSchema.safeParse({ ...valid, phone: '' }).success).toBe(false);
    expect(grantSchema.safeParse({ ...valid, reason: '' }).success).toBe(false);
  });
  it('allows up to five attachments and rejects six', () => {
    const file = { size: 100, type: 'application/pdf' };
    expect(validateAttachments(Array(5).fill(file))).toBeNull();
    expect(validateAttachments(Array(6).fill(file))).not.toBeNull();
  });
  it('caps individual files at 10 MiB', () => {
    expect(validateAttachments([{ size: 10 * 1024 * 1024, type: 'image/png' }])).toBeNull();
    expect(validateAttachments([{ size: 10 * 1024 * 1024 + 1, type: 'image/png' }])).not.toBeNull();
  });
  it('rejects executable uploads and forged PDF signatures', () => {
    expect(validateAttachments([{ size: 100, type: 'text/html' }])).not.toBeNull();
    expect(matchesFileSignature(new TextEncoder().encode('<html>'), 'application/pdf')).toBe(false);
    expect(matchesFileSignature(new TextEncoder().encode('%PDF-1.4'), 'application/pdf')).toBe(true);
  });
});