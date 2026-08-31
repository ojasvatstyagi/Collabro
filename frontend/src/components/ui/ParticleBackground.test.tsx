import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ParticleBackground } from './ParticleBackground';

const lib = vi.hoisted(() => ({
  loadSlim: vi.fn(),
  particlesProps: [] as Array<Record<string, unknown>>,
}));
// jsdom has no canvas: the library is replaced by a stand-in that records how it was used
vi.mock('@tsparticles/slim', () => ({ loadSlim: lib.loadSlim }));
vi.mock('@tsparticles/react', async () => {
  const React = await import('react');
  return {
    ParticlesProvider: ({ init, children }: { init: (engine: unknown) => Promise<void>; children: React.ReactNode }) => {
      const [ready, setReady] = React.useState(false);
      React.useEffect(() => {
        void init({ engine: true }).then(() => setReady(true));
      }, [init]);
      return ready ? <>{children}</> : null;
    },
    default: (props: Record<string, unknown>) => {
      lib.particlesProps.push(props);
      return <div data-testid="particles" id={props.id as string} />;
    },
  };
});

describe('ParticleBackground', () => {
  it('registers the slim feature set on the engine, and only then shows the particles', async () => {
    render(<ParticleBackground />);

    await waitFor(() => expect(screen.getByTestId('particles')).toBeInTheDocument());
    expect(lib.loadSlim).toHaveBeenCalledTimes(1);
    expect(lib.loadSlim).toHaveBeenCalledWith({ engine: true });
  });

  it('draws behind the page content and does not intercept clicks', async () => {
    render(<ParticleBackground />);
    await screen.findByTestId('particles');

    const props = lib.particlesProps[lib.particlesProps.length - 1] as { id: string; style: Record<string, unknown>; options: { fullScreen: { zIndex: number } } };
    expect(props.id).toBe('tsparticles'); // index.css positions this id
    expect(props.style).toMatchObject({ position: 'fixed', zIndex: -1 });
    expect(props.options.fullScreen.zIndex).toBe(-1);
  });
});
