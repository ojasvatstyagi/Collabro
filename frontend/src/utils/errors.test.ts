import { describe, expect, it } from 'vitest';
import { errorMessage, parseFieldErrors } from './errors';

describe('errorMessage', () => {
  it("uses the message of an ApiError or Error", () => {
    expect(errorMessage({ message: 'Current password is incorrect', status: 400 }, 'fallback')).toBe(
      'Current password is incorrect'
    );
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('falls back for anything without a usable message', () => {
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
    expect(errorMessage(null, 'fallback')).toBe('fallback');
    expect(errorMessage('just a string', 'fallback')).toBe('fallback');
    expect(errorMessage({ message: '' }, 'fallback')).toBe('fallback');
    expect(errorMessage({ status: 500 }, 'fallback')).toBe('fallback');
  });
});

describe('parseFieldErrors', () => {
  it('splits the backend validation message into fields', () => {
    expect(parseFieldErrors('phone: Invalid phone number, bio: Too long')).toEqual({
      phone: 'Invalid phone number',
      bio: 'Too long',
    });
  });

  it('keeps commas that belong to a message', () => {
    expect(parseFieldErrors('bio: Must be short, simple and clear, location: Required')).toEqual({
      bio: 'Must be short, simple and clear',
      location: 'Required',
    });
  });

  it('returns nothing for messages that are not field errors', () => {
    expect(parseFieldErrors('Current password is incorrect')).toEqual({});
    expect(parseFieldErrors('')).toEqual({});
  });
});
