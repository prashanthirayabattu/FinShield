import React, { useEffect, useRef } from 'react';

interface GlobalNetworkBackgroundProps {
  isIntroActive?: boolean;
}

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  pulsePhase: number;
  color: string;
}

interface SignalPacket {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  color: string;
}

interface ClickRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const GlobalNetworkBackground: React.FC<GlobalNetworkBackgroundProps> = ({
  isIntroActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const isDesktop = () => window.innerWidth >= 768;
    const isFinePointer = () => window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Track mouse state on desktop
    const mouse = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const ripples: ClickRipple[] = [];
    let nodes: NetworkNode[] = [];
    const signals: SignalPacket[] = [];

    // Distinct palette representing financial telemetry & cybersecurity points
    const nodeColors = [
      'rgba(34, 211, 238, 0.85)', // Cyan
      'rgba(45, 212, 191, 0.85)', // Teal
      'rgba(56, 189, 248, 0.80)', // Sky
      'rgba(52, 211, 153, 0.75)', // Emerald
      'rgba(165, 243, 252, 0.90)', // Ice cyan
    ];

    const signalColors = [
      'rgba(165, 243, 252, 0.95)',
      'rgba(34, 211, 238, 0.95)',
      'rgba(45, 212, 191, 0.95)',
      'rgba(147, 197, 253, 0.90)',
    ];

    const initNodes = () => {
      const desktop = isDesktop();
      // Responsive density: 58-62 on desktop, 24-26 on mobile
      const nodeCount = desktop ? 60 : 25;
      nodes = [];
      signals.length = 0;

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: prefersReducedMotion ? 0 : (Math.random() - 0.5) * (desktop ? 0.38 : 0.22),
          vy: prefersReducedMotion ? 0 : (Math.random() - 0.5) * (desktop ? 0.38 : 0.22),
          radius: Math.random() * 1.5 + 2.0, // 2.0 - 3.5px
          baseAlpha: Math.random() * 0.35 + 0.45,
          pulsePhase: Math.random() * Math.PI * 2,
          color: nodeColors[Math.floor(Math.random() * nodeColors.length)],
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initNodes();
    };

    // Desktop cursor interactions
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDesktop() || !isFinePointer()) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    // Click interaction: radial pulse & gentle impulse
    const handlePointerDown = (e: PointerEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: isDesktop() ? 75 : 45,
        alpha: 0.45,
      });

      // Gently push nearby nodes away from click
      for (const node of nodes) {
        const dx = node.x - e.clientX;
        const dy = node.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (1 - dist / 120) * 1.2;
          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('pointerdown', handlePointerDown);

    handleResize();

    // Helper: spawn a traveling signal packet along a connected edge
    const maybeSpawnSignal = (connectedPairs: Array<[number, number]>) => {
      if (prefersReducedMotion || connectedPairs.length === 0) return;
      const targetCount = isDesktop() ? 8 : 4;
      if (signals.length < targetCount && Math.random() < 0.15) {
        const [fromIndex, toIndex] = connectedPairs[Math.floor(Math.random() * connectedPairs.length)];
        signals.push({
          fromIndex,
          toIndex,
          progress: 0,
          speed: Math.random() * 0.45 + 0.35, // 0.35 - 0.80 per sec
          color: signalColors[Math.floor(Math.random() * signalColors.length)],
        });
      }
    };

    // Render loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const desktop = isDesktop();
      const maxDistance = desktop ? 150 : 105;
      const alphaMultiplier = isIntroActive ? 1.4 : 1.0;

      // 1. Mouse Spotlight Illumination (desktop)
      if (desktop && mouse.active) {
        ctx.save();
        const spotlight = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          180
        );
        spotlight.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
        spotlight.addColorStop(0.5, 'rgba(20, 184, 166, 0.03)');
        spotlight.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotlight;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 180, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update node physics
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Intro: convergence toward center logo
        if (isIntroActive) {
          const dxToCenter = centerX - node.x;
          const dyToCenter = centerY - node.y;
          const distToCenter = Math.sqrt(dxToCenter * dxToCenter + dyToCenter * dyToCenter);
          if (distToCenter > 30) {
            node.vx += (dxToCenter / distToCenter) * 0.02;
            node.vy += (dyToCenter / distToCenter) * 0.02;
          }
        }

        // Desktop mouse attraction / repulsion
        if (desktop && mouse.active) {
          const dxMouse = node.x - mouse.x;
          const dyMouse = node.y - mouse.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          const mouseRadius = 140;

          if (distMouse < mouseRadius && distMouse > 0) {
            const pushFactor = (1 - distMouse / mouseRadius) * 0.55;
            node.vx += (dxMouse / distMouse) * pushFactor;
            node.vy += (dyMouse / distMouse) * pushFactor;
          }
        }

        // Apply velocity
        node.x += node.vx * (dt * 60);
        node.y += node.vy * (dt * 60);

        // Soft damping
        node.vx *= 0.985;
        node.vy *= 0.985;

        // Ambient speed floor
        const minSpeed = desktop ? 0.16 : 0.1;
        const currentSpeed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (currentSpeed < minSpeed && !prefersReducedMotion) {
          node.vx += (Math.random() - 0.5) * 0.06;
          node.vy += (Math.random() - 0.5) * 0.06;
        }

        // Wraparound boundaries
        if (node.x < -15) node.x = width + 15;
        if (node.x > width + 15) node.x = -15;
        if (node.y < -15) node.y = height + 15;
        if (node.y > height + 15) node.y = -15;

        node.pulsePhase += dt * 1.8;
      }

      // Collect connected edges & draw connections
      const connectedPairs: Array<[number, number]> = [];

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            connectedPairs.push([i, j]);
            let lineAlpha = (1 - dist / maxDistance) * 0.22 * alphaMultiplier;

            // Line brightening near mouse cursor
            if (desktop && mouse.active) {
              const midX = (n1.x + n2.x) / 2;
              const midY = (n1.y + n2.y) / 2;
              const distToMouse = Math.sqrt(
                (midX - mouse.x) * (midX - mouse.x) + (midY - mouse.y) * (midY - mouse.y)
              );
              if (distToMouse < 140) {
                lineAlpha += (1 - distToMouse / 140) * 0.18;
              }
            }

            ctx.save();
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.85)';
            ctx.globalAlpha = Math.min(lineAlpha, 0.45);
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Connection lines to mouse
      if (desktop && mouse.active) {
        for (const node of nodes) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.22 * alphaMultiplier;
            ctx.save();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // 2. Draw Traveling Signal Packets (financial telemetry / intelligence flow)
      maybeSpawnSignal(connectedPairs);

      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        sig.progress += dt * sig.speed;

        if (sig.progress >= 1) {
          signals.splice(s, 1);
          continue;
        }

        const n1 = nodes[sig.fromIndex];
        const n2 = nodes[sig.toIndex];
        if (!n1 || !n2) {
          signals.splice(s, 1);
          continue;
        }

        const sx = n1.x + (n2.x - n1.x) * sig.progress;
        const sy = n1.y + (n2.y - n1.y) * sig.progress;

        // Draw glowing signal packet
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = sig.color;
        ctx.globalAlpha = 0.95;
        ctx.fill();

        // Signal outer glow aura
        ctx.beginPath();
        ctx.arc(sx, sy, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw Nodes with Glow Halos
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const pulse = Math.sin(node.pulsePhase) * 0.25;
        const currentAlpha = Math.min(
          Math.max(node.baseAlpha * (0.85 + pulse) * alphaMultiplier, 0.2),
          0.95
        );

        ctx.save();

        // Soft outer ambient halo
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.14)';
        ctx.globalAlpha = currentAlpha * 0.7;
        ctx.fill();

        // Solid node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();

        ctx.restore();
      }

      // 4. Draw Click Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += dt * 65;
        r.alpha -= dt * 0.7;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.globalAlpha = Math.max(r.alpha, 0);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isIntroActive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Dynamic Atmospheric Ambient Layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-cyan-500/12 via-teal-500/6 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[350px] bg-gradient-to-t from-cyan-950/20 via-transparent to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-0 w-[450px] h-[450px] bg-teal-900/10 rounded-full blur-3xl" />

      {/* Interactive Financial Data Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
};

