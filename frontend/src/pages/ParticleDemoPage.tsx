import { ParticleCanvas } from "../components/ui/particle-canvas-1";

export default function ParticleDemoPage() {
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <ParticleCanvas />
      <div className="z-10 flex flex-col items-center gap-4 text-center">
        <h1 className="pointer-events-none text-7xl font-bold tracking-tighter text-on-surface sm:text-8xl md:text-9xl">
          Particle Canvas
        </h1>
        <p className="max-w-md text-on-surface-variant/60 font-body text-balance">
          Interactive WebGL particle system driven by mouse movement. Premium fluid animations for modern landing pages.
        </p>
      </div>
    </div>
  );
}
