// components/ui/ParticleBackground.tsx
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

const options: ISourceOptions = {
  fullScreen: { enable: true, zIndex: -1 },
  background: { color: 'transparent' },
  particles: {
    number: { value: 80 },
    color: { value: '#f97316' },
    shape: { type: 'circle' },
    opacity: { value: 0.5, random: true },
    size: { value: 3, random: true },
    move: {
      enable: true,
      speed: 2,
      direction: 'none',
      outModes: 'out',
    },
    links: {
      enable: true,
      distance: 150,
      color: '#f97316',
      opacity: 0.4,
      width: 1,
    },
  },
  interactivity: {
    events: {
      onHover: { enable: true, mode: 'grab' },
    },
    modes: { grab: { distance: 140 } },
  },
};

// Registers the slim feature set on the engine; the provider renders the particles once that has finished
const registerSlim = async (engine: Engine) => {
  await loadSlim(engine);
};

export const ParticleBackground = () => (
  <ParticlesProvider init={registerSlim}>
    <Particles
      id="tsparticles"
      options={options}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.5,
      }}
    />
  </ParticlesProvider>
);

export default ParticleBackground;
