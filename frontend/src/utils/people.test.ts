import { describe, expect, it } from 'vitest';
import { assigneeOptions, displayName, initials, profilePath } from './people';

describe('displayName', () => {
  it('prefers the name the server worked out', () => {
    expect(displayName({ displayName: 'Alice Anderson', firstname: 'x', lastname: 'y', username: 'alice' })).toBe(
      'Alice Anderson'
    );
  });

  it('joins first and last name when the server sent none', () => {
    expect(displayName({ firstname: 'Alice', lastname: 'Anderson', username: 'alice' })).toBe('Alice Anderson');
    expect(displayName({ firstname: '  Alice ', lastname: '', username: 'alice' })).toBe('Alice');
  });

  it('falls back to the username for a profile without a name, never "New User" or "null null"', () => {
    expect(displayName({ firstname: '', lastname: '', username: 'alice_a' })).toBe('alice_a');
    expect(displayName({ firstname: null, lastname: null, username: 'alice_a' })).toBe('alice_a');
    expect(displayName({ displayName: '   ', firstname: undefined, username: 'alice_a' })).toBe('alice_a');
  });

  it('never returns an empty string', () => {
    expect(displayName({})).toBe('Unknown user');
  });
});

describe('initials', () => {
  it('uses the first letters of the first two words', () => {
    expect(initials({ displayName: 'alice anderson' })).toBe('AA');
    expect(initials({ displayName: 'Mary Jane Watson' })).toBe('MJ');
  });

  it('uses the first two letters of a single word such as a username', () => {
    expect(initials({ username: 'alice_a' })).toBe('AL');
    expect(initials({ username: 'x' })).toBe('X');
  });

  it('is never empty', () => {
    expect(initials({})).toBe('?');
    expect(initials({ displayName: ' ', firstname: '', lastname: '', username: '' })).toBe('?');
  });
});

describe('profilePath', () => {
  it('links a username to its profile page, encoded', () => {
    expect(profilePath('alice_a')).toBe('/users/alice_a');
    expect(profilePath('a b/c')).toBe('/users/a%20b%2Fc');
  });

  it('gives nothing for a deleted or missing account', () => {
    expect(profilePath('deleted user')).toBeNull();
    expect(profilePath(null)).toBeNull();
    expect(profilePath(undefined)).toBeNull();
    expect(profilePath('')).toBeNull();
  });
});

describe('assigneeOptions', () => {
  const owner = { id: 'o1', username: 'olive', displayName: 'olive' };
  const members = [
    { id: 'm1', username: 'mia', displayName: 'Mia Moss', firstname: 'Mia', lastname: 'Moss' },
    { id: 'm2', username: 'ned', displayName: 'ned', firstname: '', lastname: '' },
  ];

  it('puts the owner first, so a task can be given to them', () => {
    expect(assigneeOptions(owner, members).map((o) => o.id)).toEqual(['o1', 'm1', 'm2']);
    expect(assigneeOptions(owner, members)[0].label).toBe('olive (owner)');
  });

  it('labels members by name and username, or by username alone when they have no name', () => {
    const labels = assigneeOptions(owner, members).map((o) => o.label);
    expect(labels[1]).toBe('Mia Moss (mia)');
    expect(labels[2]).toBe('ned');
  });

  it('does not list the owner twice if the server ever includes them', () => {
    expect(assigneeOptions(owner, [{ id: 'o1', username: 'olive' }, ...members]).map((o) => o.id)).toEqual([
      'o1',
      'm1',
      'm2',
    ]);
  });

  it('works while the project is still loading, and for a project without a team', () => {
    expect(assigneeOptions(undefined, members).map((o) => o.id)).toEqual(['m1', 'm2']);
    expect(assigneeOptions(owner, []).map((o) => o.id)).toEqual(['o1']);
    expect(assigneeOptions(null, [])).toEqual([]);
  });
});
