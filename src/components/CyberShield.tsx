import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  isAmbient: boolean;
  id?: string;
  threatLevel?: string;
  state: 'wandering' | 'detected' | 'locking' | 'locked' | 'firing' | 'impacted' | 'neutralized';
  stateTimer: number;
  scale: number;
  isLocked: boolean; // Keep for backward compatibility/logic simplicity
}

interface Impact {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  type: 'ripple' | 'spark' | 'text' | 'shockwave';
  text?: string;
  vx?: number;
  vy?: number;
  radius?: number;
}

interface Beam {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  life: number;
  maxLife: number;
  particleId: string;
}

const CyberShield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mountTime = Date.now();
    let animationFrameId: number;
    let particles: Particle[] = [];
    let impacts: Impact[] = [];
    let beams: Beam[] = [];
    let shieldPulse = 0;
    let hitFlash = 0;
    let radarAngle = 0;
    
    const SHIELD_RADIUS = 100;
    const MAX_ATTACKERS = 15;
    const AMBIENT_COUNT = 30;
    const RADAR_SPEED = 0.02;
    
    const resize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };
    
    window.addEventListener('resize', resize);
    resize();

    const createParticle = (isAmbient = false): Particle => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      if (isAmbient) {
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.2,
          color: '#3d6fd4',
          alpha: 0.1 + Math.random() * 0.2,
          isAmbient: true,
          state: 'wandering',
          stateTimer: 0,
          scale: 1,
          isLocked: false
        };
      }

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(canvas.width, canvas.height) / 1.5;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const speed = 0.6 + Math.random() * 1.2;
      const threatLevels = ['CRITICAL', 'HIGH', 'MODERATE'];
      
      return {
        x,
        y,
        vx: -Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2,
        color: '#ff4d4d',
        alpha: 1,
        isAmbient: false,
        isLocked: false,
        id: Math.random().toString(16).substring(2, 6).toUpperCase(),
        threatLevel: threatLevels[Math.floor(Math.random() * threatLevels.length)],
        state: 'wandering',
        stateTimer: 0,
        scale: 1
      };
    };

    // Initialize particles
    for (let i = 0; i < AMBIENT_COUNT; i++) particles.push(createParticle(true));

    const drawRadar = (centerX: number, centerY: number) => {
      ctx.save();
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.48;
      
      // 1. Concentric Circles (More prominent, grid-like)
      ctx.setLineDash([]);
      for (let i = 1; i <= 6; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / 6) * i, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(61, 111, 212, ${i === 6 ? 0.3 : 0.1})`;
        ctx.lineWidth = i === 6 ? 2 : 1;
        ctx.stroke();
      }

      // 2. Radial Spokes (Every 30 degrees)
      ctx.lineWidth = 1;
      for (let a = 0; a < 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rad) * maxRadius,
          centerY + Math.sin(rad) * maxRadius
        );
        ctx.strokeStyle = 'rgba(61, 111, 212, 0.15)';
        ctx.stroke();
      }

      // 3. Degree Labels and Outer Ticks
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(61, 111, 212, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let a = 0; a < 360; a += 20) {
        const rad = (a * Math.PI) / 180;
        // Adjust for radar 0 at top (standard is 0 at right)
        const adjustedRad = rad - Math.PI / 2;
        const xOut = centerX + Math.cos(adjustedRad) * (maxRadius + 15);
        const yOut = centerY + Math.sin(adjustedRad) * (maxRadius + 15);
        
        // Ticks
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(adjustedRad) * maxRadius, centerY + Math.sin(adjustedRad) * maxRadius);
        ctx.lineTo(centerX + Math.cos(adjustedRad) * (maxRadius + 5), centerY + Math.sin(adjustedRad) * (maxRadius + 5));
        ctx.strokeStyle = 'rgba(61, 111, 212, 0.4)';
        ctx.stroke();

        // Label (Every 20 degrees)
        ctx.fillText(a.toString(), xOut, yOut);
      }

      // 4. Intense triangular "Beam" (Cone)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      // The "wideness" - about 45 degrees (0.8 radians)
      ctx.arc(centerX, centerY, maxRadius, radarAngle - 0.8, radarAngle, false);
      ctx.lineTo(centerX, centerY);
      ctx.clip();

      // Start the gradient at the tail of the sweep
      const sweepGradient = ctx.createConicGradient(radarAngle - 0.8, centerX, centerY);
      const sweepWidth = 0.8;
      const normalizedEnd = sweepWidth / (Math.PI * 2);
      
      sweepGradient.addColorStop(0, 'rgba(61, 111, 212, 0)');           // Tail (invisible)
      sweepGradient.addColorStop(normalizedEnd * 0.5, 'rgba(61, 111, 212, 0.2)'); // Mid
      sweepGradient.addColorStop(normalizedEnd, 'rgba(100, 180, 255, 0.7)');     // Leading edge (bright)
      
      ctx.fillStyle = sweepGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, radarAngle - 0.9, radarAngle + 0.1, false);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const drawShield = (centerX: number, centerY: number) => {
      ctx.save();
      
      // Force-Scale Effect (Absorbing force)
      const forceScale = 1 + shieldPulse * 0.15;
      const currentRadius = SHIELD_RADIUS * forceScale;

      if (hitFlash > 0) {
        const maxRadius = Math.min(canvas.width, canvas.height) / 2;
        const flashGrad = ctx.createRadialGradient(centerX, centerY, currentRadius, centerX, centerY, maxRadius);
        flashGrad.addColorStop(0, `rgba(61, 111, 212, ${hitFlash * 0.15})`);
        flashGrad.addColorStop(1, 'rgba(61, 111, 212, 0)');
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fillStyle = flashGrad;
        ctx.fill();
      }

      // Outer Detection Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(61, 111, 212, ${0.15 + shieldPulse * 0.4})`;
      ctx.lineWidth = 1 + shieldPulse * 2;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Power Core Glow (Refined Idle)
      const glowRadius = currentRadius + 50 + Math.sin(Date.now() / 800) * 10;
      const grad = ctx.createRadialGradient(centerX, centerY, currentRadius - 60, centerX, centerY, glowRadius);
      grad.addColorStop(0.2, 'rgba(61, 111, 212, 0)');
      grad.addColorStop(0.65, `rgba(61, 111, 212, ${0.08 + shieldPulse * 0.6})`);
      grad.addColorStop(1, 'rgba(61, 111, 212, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    const spawnImpactSparks = (x: number, y: number, centerX: number, centerY: number) => {
      const impactAngle = Math.atan2(y - centerY, x - centerX);
      for (let i = 0; i < 12; i++) {
        const spreadAngle = impactAngle + (Math.random() - 0.5) * Math.PI;
        const speed = 3 + Math.random() * 5;
        const maxLife = 15 + Math.random() * 20;
        impacts.push({ x, y, vx: Math.cos(spreadAngle) * speed, vy: Math.sin(spreadAngle) * speed, life: maxLife, maxLife, type: 'spark' });
      }
      impacts.push({ x, y, life: 30, maxLife: 30, type: 'ripple' });
    };

    const drawImpacts = () => {
      // Draw Beams
      beams.forEach((beam) => {
        const opacity = Math.min(1, beam.life / 5);
        if (beam.life <= 0) return;

        const currentX = beam.startX + (beam.targetX - beam.startX) * beam.progress;
        const currentY = beam.startY + (beam.targetY - beam.startY) * beam.progress;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(beam.startX, beam.startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = `rgba(100, 180, 255, ${opacity * 0.9})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#64b4ff';
        ctx.stroke();
        ctx.restore();
      });

      for (let i = impacts.length - 1; i >= 0; i--) {
        const impact = impacts[i];
        const oAlpha = impact.life / impact.maxLife;
        
        if (impact.type === 'text') {
          ctx.save();
          ctx.translate(impact.x, impact.y - (1 - oAlpha) * 15);
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillStyle = `rgba(150, 210, 255, ${oAlpha})`;
          ctx.textAlign = 'center';
          ctx.fillText(impact.text || '', 0, 0);
          ctx.restore();
        } else if (impact.type === 'shockwave') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(impact.x, impact.y, (impact.maxLife - impact.life) * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(100, 180, 255, ${oAlpha * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();
        } else if (impact.type === 'ripple') {
          ctx.beginPath();
          ctx.arc(impact.x, impact.y, (impact.maxLife - impact.life) * 6, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 77, 77, ${oAlpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (impact.type === 'spark') {
          impact.x += impact.vx!;
          impact.y += impact.vy!;
          impact.vx! *= 0.92;
          impact.vy! *= 0.92;
          
          ctx.beginPath();
          ctx.arc(impact.x, impact.y, 1.5 * oAlpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 77, 77, ${oAlpha})`;
          ctx.fill();
        }
        
        impact.life--;
        if (impact.life <= 0) impacts.splice(i, 1);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      radarAngle = (radarAngle + RADAR_SPEED) % (Math.PI * 2);
      if (shieldPulse > 0) shieldPulse -= 0.03;
      if (hitFlash > 0) hitFlash -= 0.05;

      const isWarm = (Date.now() - mountTime) > 1500;
      const targetAttackerCount = isWarm ? MAX_ATTACKERS : 0;
      const currentAttackers = particles.filter(p => !p.isAmbient).length;
      if (currentAttackers < targetAttackerCount) {
        particles.push(createParticle(false));
      }

      drawRadar(centerX, centerY);
      drawShield(centerX, centerY);
      drawImpacts();

      // Update Beams
      for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        b.progress += 0.25; // Faster Beam
        if (b.progress >= 1) {
          b.progress = 1;
          b.life--;
          if (b.life <= 0) beams.splice(i, 1);
        }
      }

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        let angleDiff = (radarAngle - angle);
        while (angleDiff < 0) angleDiff += Math.PI * 2;
        angleDiff = angleDiff % (Math.PI * 2);

        let illumination = 0;
        if (angleDiff < 0.8) {
          illumination = Math.pow(1 - angleDiff / 0.8, 2.0);
          if (illumination > 0.8 && !p.isAmbient && p.state === 'wandering') {
            p.state = 'detected';
            p.isLocked = true;
          }
        }

        // Fast State Machine (no delays)
        if (!p.isAmbient) {
          if (p.state === 'detected') {
            p.state = 'firing';
            beams.push({
              startX: centerX,
              startY: centerY,
              targetX: p.x,
              targetY: p.y,
              progress: 0,
              life: 5,
              maxLife: 5,
              particleId: p.id || ''
            });
          } else if (p.state === 'firing') {
            const activeBeam = beams.find(b => b.particleId === p.id);
            if (activeBeam && activeBeam.progress >= 1) {
              p.state = 'impacted';
              p.stateTimer = 5;
              hitFlash = 0.5;
              shieldPulse = 0.6;
              impacts.push({ x: p.x, y: p.y, life: 20, maxLife: 20, type: 'shockwave' });
              spawnImpactSparks(p.x, p.y, centerX, centerY);
              impacts.push({ x: p.x, y: p.y - 15, life: 50, maxLife: 50, type: 'text', text: 'NEUTRALIZED' });
            }
          } else if (p.state === 'impacted') {
            particles[index] = createParticle(false);
          }
        }

        // Draw particle body
        const dScale = p.isAmbient ? 1 : (p.state !== 'wandering' ? 1.4 : 1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * dScale, 0, Math.PI * 2);
        
        if (!p.isAmbient) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * (0.3 + illumination * 0.7);
          
          if (p.isLocked) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
            ctx.globalAlpha = 0.4 + pulse * 0.4;

            // Simple Brackets
            const s = 10;
            const t = 3;
            ctx.beginPath();
            ctx.moveTo(-s, -s+t); ctx.lineTo(-s, -s); ctx.lineTo(-s+t, -s);
            ctx.moveTo(s-t, -s); ctx.lineTo(s, -s); ctx.lineTo(s, -s+t);
            ctx.moveTo(s, s-t); ctx.lineTo(s, s); ctx.lineTo(s-t, s);
            ctx.moveTo(-s+t, s); ctx.lineTo(-s, s); ctx.lineTo(-s, s-t);
            ctx.stroke();
            ctx.restore();
          }
        } else {
          ctx.fillStyle = '#3d6fd4';
          ctx.globalAlpha = p.alpha * (0.1 + illumination * 0.9);
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;

        if (!p.isAmbient) {
          if (distance <= SHIELD_RADIUS) {
            spawnImpactSparks(p.x, p.y, centerX, centerY);
            shieldPulse = 1;
            hitFlash = 1;
            particles[index] = createParticle(false);
          }
          if (distance > Math.max(canvas.width, canvas.height) * 1.5) particles[index] = createParticle(false);
        } else {
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }} />;
};

export default CyberShield;
