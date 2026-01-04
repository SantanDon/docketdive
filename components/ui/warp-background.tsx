"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export const WarpBackground = ({
  children,
  className,
  perspective = 100,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  gridColor = "hsl(var(--border))",
}: {
  children: React.ReactNode;
  className?: string;
  perspective?: number;
  beamsPerSide?: number;
  beamSize?: number;
  beamDelayMax?: number;
  beamDelayMin?: number;
  beamDuration?: number;
  gridColor?: string;
}) => {
  const [beams, setBeams] = useState<{ left: string; delay: string; duration: string }[]>([]);

  useEffect(() => {
    const newBeams = Array.from({ length: beamsPerSide }).map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * (beamDelayMax - beamDelayMin) + beamDelayMin}s`,
      duration: `${beamDuration}s`,
    }));
    setBeams(newBeams);
  }, [beamsPerSide, beamDelayMax, beamDelayMin, beamDuration]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full overflow-hidden bg-background",
        className
      )}
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          perspective: `${perspective}px`,
        }}
      >
        <div
          className="absolute inset-0 transform-3d"
          style={{
            transform: "rotateX(75deg)",
          }}
        >
          <div
            className="absolute inset-0 animate-warp-grid"
            style={{
              backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              width: "200%",
              height: "200%",
              left: "-50%",
              top: "-50%",
            }}
          />
        </div>
      </div>
      <div className="relative z-10 h-full w-full">{children}</div>
      
      {/* Beams */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {beams.map((beam, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px bg-gradient-to-b from-transparent via-blue-500/50 to-transparent"
            style={{
              left: beam.left,
              animation: `beam ${beam.duration} linear infinite`,
              animationDelay: beam.delay,
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
};
