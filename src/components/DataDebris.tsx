import React, { useEffect, useRef, useState } from 'react';

interface Debris {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  parallaxFactor: number;
  type: 'box' | 'hexagon' | 'diamond';
}

const DataDebris: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [debris, setDebris] = useState<Debris[]>([]);
  const scrollPos = useRef(0);
  const scrollVelocity = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Generate initial debris
    const count = 25;
    const items: Debris[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 200, // Spread across more height
      size: Math.random() * 30 + 10,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.15 + 0.05,
      parallaxFactor: Math.random() * 0.5 + 0.2,
      type: (['box', 'hexagon', 'diamond'] as const)[Math.floor(Math.random() * 3)],
    }));
    setDebris(items);

    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const now = Date.now();
      const dt = Math.max(1, now - lastScrollTime.current);
      
      // Calculate velocity (pixels per ms)
      const diff = currentScroll - scrollPos.current;
      scrollVelocity.current = diff / dt;
      
      scrollPos.current = currentScroll;
      lastScrollTime.current = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Physics animation loop
    const animate = () => {
      // Decay velocity with "fluid drag"
      scrollVelocity.current *= 0.95;

      if (containerRef.current) {
        const items = containerRef.current.children;
        for (let i = 0; i < items.length; i++) {
          const el = items[i] as HTMLElement;
          const factor = parseFloat(el.dataset.parallax || '0');
          const rotSpeed = parseFloat(el.dataset.rot || '0');
          
          // Apply displacement based on velocity (wind resistance)
          // Negative velocity (scrolling down) pushes debris up
          const displacement = scrollVelocity.current * 15 * factor;
          
          // Current transform state
          const currentY = parseFloat(el.dataset.y || '0');
          const currentRot = parseFloat(el.dataset.r || '0');
          
          const nextRot = currentRot + rotSpeed;
          // We use a CSS transition for the wind effect for smoothness, 
          // or just update directly if we want raw physics feel
          el.style.transform = `translateY(${displacement}px) rotate(${nextRot}deg)`;
          el.dataset.r = nextRot.toString();
        }
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {debris.map((item) => (
        <div
          key={item.id}
          className="absolute border border-blue-500/30"
          data-parallax={item.parallaxFactor}
          data-rot={item.rotationSpeed}
          data-y="0"
          data-r={item.rotation}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            opacity: item.opacity,
            borderRadius: item.type === 'hexagon' ? '20%' : item.type === 'diamond' ? '0' : '4px',
            transform: `rotate(${item.rotation}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)', // Smooth wind resistance return
          }}
        />
      ))}
    </div>
  );
};

export default DataDebris;
