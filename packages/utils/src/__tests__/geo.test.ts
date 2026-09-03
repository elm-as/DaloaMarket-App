import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance, isWithinOtpProximity, isLocationInDaloa } from '../geo';

describe('Geo utilities', () => {
  it('calculates 0km between identical coordinates', () => {
    const p1 = { lat: 6.8773, lng: -6.4502 };
    const distance = haversineDistance(p1, p1);
    assert.equal(distance, 0);
  });

  it('validates GPS proximity within 100m', () => {
    // 2 points separated by ~50m
    const driverCoords = { lat: 6.8773, lng: -6.4502 };
    const targetCoords = { lat: 6.8775, lng: -6.4502 };

    const result = isWithinOtpProximity(driverCoords, targetCoords, 100);
    assert.equal(result.isWithin, true);
    assert.ok(result.distanceMeters <= 100);
  });

  it('rejects GPS proximity when distance exceeds 100m', () => {
    // Point A (Daloa Centre) and Point B (~1km away)
    const driverCoords = { lat: 6.8773, lng: -6.4502 };
    const targetCoords = { lat: 6.8873, lng: -6.4502 };

    const result = isWithinOtpProximity(driverCoords, targetCoords, 100);
    assert.equal(result.isWithin, false);
    assert.ok(result.distanceMeters > 100);
  });

  it('verifies location inside Daloa geofence', () => {
    // Daloa Centre is inside
    assert.equal(isLocationInDaloa(6.8773, -6.4502), true);
    // Abidjan coordinates are outside Daloa geofence
    assert.equal(isLocationInDaloa(5.3600, -4.0083), false);
  });
});
