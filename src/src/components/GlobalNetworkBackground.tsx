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

    // Track mouse state on desktop
    const mouse = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const ripples: ClickRipple[] = [];
    let nodes: NetworkNode[] = [];

    // Distinct palette representing financial telemetry & cybersecurity points
    const nodeColors = [
      'rgba(34, 211, 238, 0.75)', // Cyan
      'rgba(45, 212, 191, 0.75)', // Teal
      'rgba(56, 189, 248, 0.65)', // Sky blue
      'rgba(148, 163, 184, 0.55)', // Crisp slate
    ];

    const initNodes = () => {
      const desktop = isDesktop();
      const nodeCount = desktop ? 48 : 22;
      nodes = [];

      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (desktop ? 0.35 : 0.22),
          vy: (Math.random() - 0.5) * (desktop ? 0.35 : 0.22),
          radius: Math.random() * 0.9 + 1.2,
          baseAlpha: Math.random() * 0.3 + 0.35,
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

    // Click interaction: tiny elegant particle ripple
    const handlePointerDown = (e: PointerEvent) => {
      // Subtle ripple at interaction point
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 2,
        maxRadius: isDesktop() ? 46 : 32,
        alpha: 0.32,
      });

      // Gently push nearby nodes
      for (const node of nodes) {
        const dx = node.x - e.clientX;
        const dy = node.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (1 - dist / 100) * 0.8;
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

    // Render loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      const desktop = isDesktop();
      const maxDistance = desktop ? 135 : 90;
      const alphaMultiplier = isIntroActive ? 1.35 : 0.85;

      // Update and draw nodes
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // During intro, subtle gentle convergence toward center logo
        if (isIntroActive) {
          const dxToCenter = centerX - node.x;
          const dyToCenter = centerY - node.y;
          const distToCenter = Math.sqrt(dxToCenter * dxToCenter + dyToCenter * dyToCenter);
          if (distToCenter > 40) {
            node.vx += (dxToCenter / distToCenter) * 0.015;
            node.vy += (dyToCenter / distToCenter) * 0.015;
          }
        }

        // Desktop mouse gentle reaction
        if (desktop && mouse.active) {
          const dxMouse = node.x - mouse.x;
          const dyMouse = node.y - mouse.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          const mouseRadius = 130;

          if (distMouse < mouseRadius && distMouse > 0) {
            const pushFactor = (1 - distMouse / mouseRadius) * 0.45;
            node.vx += (dxMouse / distMouse) * pushFactor;
            node.vy += (dyMouse / distMouse) * pushFactor;
          }
        }

        // Apply velocity with soft damping
        node.x += node.vx * (dt * 60);
        node.y += node.vy * (dt * 60);

        node.vx *= 0.985;
        node.vy *= 0.985;

        // Ambient speed restoration
        const minSpeed = desktop ? 0.15 : 0.1;
        const currentSpeed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (currentSpeed < minSpeed) {
          node.vx += (Math.random() - 0.5) * 0.05;
          node.vy += (Math.random() - 0.5) * 0.05;
        }

        // Screen boundary wraparound
        if (node.x < -10) node.x = width + 10;
        if (node.x > width + 10) node.x = -10;
        if (node.y < -10) node.y = height + 10;
        if (node.y > height + 10) node.y = -10;

        // Pulse phase
        node.pulsePhase += dt * 1.5;
        const currentAlpha =
          node.baseAlpha * (0.8 + Math.sin(node.pulsePhase) * 0.2) * alphaMultiplier;

        // Draw node
        ctx.save();
        ctx.fillStyle = node.color;
        ctx.globalAlpha = Math.min(Math.max(currentAlpha, 0.1), 0.9);
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Soft outer ambient halo for select nodes
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw faint connections between proximate nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            let lineAlpha = (1 - dist / maxDistance) * 0.14 * alphaMultiplier;

            // Nearby cursor connections gain slight visibility enhancement
            if (desktop && mouse.active) {
              const midX = (n1.x + n2.x) / 2;
              const midY = (n1.y + n2.y) / 2;
              const distToMouse = Math.sqrt(
                (midX - mouse.x) * (midX - mouse.x) + (midY - mouse.y) * (midY - mouse.y)
              );
              if (distToMouse < 120) {
                lineAlpha += (1 - distToMouse / 120) * 0.08;
              }
            }

            ctx.save();
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.9)';
            ctx.globalAlpha = Math.min(lineAlpha, 0.35);
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw connection lines to mouse if nearby
      if (desktop && mouse.active) {
        for (const node of nodes) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const lineAlpha = (1 - dist / 100) * 0.12 * alphaMultiplier;
            ctx.save();
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(node.x, node.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw and update click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += dt * 55;
        r.alpha -= dt * 0.65;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
        ctx.globalAlpha = Math.max(r.alpha, 0);
        ctx.lineWidth = 1;
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
      {/* Subtle Atmospheric Glow Layers */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-gradient-to-t from-cyan-900/10 via-transparent to-transparent rounded-full blur-3xl" />

      {/* Interactive Financial Data Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
};
