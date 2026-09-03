import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecureOtp } from '../validators';

describe('Security and OTP utilities', () => {
  it('generates a 4-digit OTP by default', () => {
    const otp = generateSecureOtp();
    assert.equal(otp.length, 4);
    assert.match(otp, /^[0-9]{4}$/);
    const num = Number(otp);
    assert.ok(num >= 1000 && num <= 9999);
  });

  it('generates a 6-digit OTP when requested', () => {
    const otp = generateSecureOtp(6);
    assert.equal(otp.length, 6);
    assert.match(otp, /^[0-9]{6}$/);
    const num = Number(otp);
    assert.ok(num >= 100000 && num <= 999999);
  });

  it('generates diverse codes across repeated invocations', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) {
      set.add(generateSecureOtp(6));
    }
    // High probability of 50 unique 6-digit codes
    assert.ok(set.size >= 48);
  });
});
