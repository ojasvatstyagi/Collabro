/** Anything that names a person: the server's display name, the parts of the name, or at least the username. */
export interface Nameable {
  displayName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  username?: string | null;
}

/** The username the backend shows for an account that no longer exists; there is no profile behind it. */
const DELETED_USERNAME = 'deleted user';

/**
 * What to call a person. New profiles have no name (empty, not a placeholder), so this falls back to the username:
 * the server's `displayName` when it sends one, otherwise first and last name, otherwise the username.
 */
export const displayName = (person: Nameable): string => {
  const sent = person.displayName?.trim();
  if (sent) return sent;
  const full = [person.firstname, person.lastname]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
  return full || person.username?.trim() || 'Unknown user';
};

/** One or two letters for an avatar: the first letters of the first two words, or the first two of a single word. */
export const initials = (person: Nameable): string => {
  const known = [person.displayName, person.firstname, person.lastname, person.username].some((part) => part?.trim());
  if (!known) return '?';
  const words = displayName(person).split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  return letters.toUpperCase();
};

/** Where another person's profile page lives, or null for someone without one (unknown or deleted account). */
export const profilePath = (username?: string | null): string | null => {
  if (!username || username === DELETED_USERNAME) return null;
  return `/users/${encodeURIComponent(username)}`;
};

export interface AssigneeOption {
  id: string;
  label: string;
}

/**
 * Who a task can be given to: the project's owner and its team. The team list the server sends leaves the owner out
 * (they are not a member), so the owner is added here, first; without that a task could never be assigned to the owner,
 * and one that was assigned to them showed as "Unassigned" in the edit form.
 */
export const assigneeOptions = (
  owner: (Nameable & { id: string }) | null | undefined,
  team: Array<Nameable & { id: string }>
): AssigneeOption[] => {
  const options: AssigneeOption[] = [];
  if (owner?.id) {
    options.push({ id: owner.id, label: `${displayName(owner)} (owner)` });
  }
  for (const member of team) {
    if (member.id === owner?.id) continue;
    const name = displayName(member);
    options.push({
      id: member.id,
      label: member.username && member.username !== name ? `${name} (${member.username})` : name,
    });
  }
  return options;
};
