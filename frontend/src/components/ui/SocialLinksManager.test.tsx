import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SocialLinksManager from './SocialLinksManager';
import type { SocialLink } from '../../services/api/profile';

const links: SocialLink[] = [
  { id: 'l1', platform: 'GITHUB', url: 'https://github.com/mia' },
  { id: 'l2', platform: 'LINKEDIN', url: 'https://linkedin.com/in/mia' },
  { id: 'l3', platform: 'TWITTER', url: 'https://x.com/mia' },
  { id: 'l4', platform: 'WEBSITE', url: 'https://mia.example' },
];

const lastAddButton = () => {
  const buttons = screen.getAllByRole('button', { name: /add link/i });
  return buttons[buttons.length - 1];
};

const setup = (over: Partial<React.ComponentProps<typeof SocialLinksManager>> = {}) => {
  const onAddLink = vi.fn().mockResolvedValue(undefined);
  const onRemoveLink = vi.fn();
  render(<SocialLinksManager socialLinks={links} onAddLink={onAddLink} onRemoveLink={onRemoveLink} {...over} />);
  return { onAddLink, onRemoveLink };
};

describe('SocialLinksManager', () => {
  it('says so when there are no links yet', () => {
    setup({ socialLinks: [] });

    expect(screen.getByText('No social links added yet.')).toBeInTheDocument();
  });

  it('lists every link under its platform name, opening in a new tab without leaking the opener', () => {
    setup();

    for (const platform of ['GITHUB', 'LINKEDIN', 'TWITTER', 'WEBSITE']) {
      expect(screen.getByText(platform)).toBeInTheDocument();
    }
    const github = screen.getByRole('link', { name: 'https://github.com/mia' });
    expect(github).toHaveAttribute('href', 'https://github.com/mia');
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('offers no way to change the links unless editing', () => {
    setup();

    expect(screen.queryByRole('button', { name: /add link/i })).not.toBeInTheDocument();
    expect(screen.queryByTitle('Remove link')).not.toBeInTheDocument();
  });

  it('removes the link that was chosen', async () => {
    const { onRemoveLink } = setup({ isEditing: true });

    await userEvent.click(screen.getAllByTitle('Remove link')[1]);

    expect(onRemoveLink).toHaveBeenCalledWith('l2');
  });

  it('adds a link for the chosen platform with the address trimmed, then closes the form', async () => {
    const { onAddLink } = setup({ isEditing: true });
    await userEvent.click(screen.getByRole('button', { name: /add link/i }));
    expect(lastAddButton()).toBeDisabled(); // nothing typed yet

    await userEvent.selectOptions(screen.getByRole('combobox'), 'LINKEDIN');
    await userEvent.type(screen.getByPlaceholderText('https://...'), '  https://linkedin.com/in/new  ');
    await userEvent.click(lastAddButton());

    expect(onAddLink).toHaveBeenCalledWith('LINKEDIN', 'https://linkedin.com/in/new');
    await screen.findByRole('button', { name: /add link/i });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('cancelling throws away what was typed', async () => {
    const { onAddLink } = setup({ isEditing: true });
    await userEvent.click(screen.getByRole('button', { name: /add link/i }));
    await userEvent.type(screen.getByPlaceholderText('https://...'), 'https://nope.example');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: /add link/i }));

    expect(onAddLink).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText('https://...')).toHaveValue('');
  });
});
