"use client";

import { useRef, useEffect } from "react";

interface Spark {
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  life: number;
}

export const ClickSpark = ({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkCount = 8,
  sparkSpeed = 10,
  sparkLife = 50,
}: {
  sparkColor?: string;
  sparkSize?: number;
  sparkCount?: number;
  sparkSpeed?: number;
  sparkLife?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const createSparks = (x: number, y: number) => {
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount;
        sparks.current.push({
          x,
          y,
          angle,
          speed: sparkSpeed * (0.5 + Math.random() * 0.5),
          size: sparkSize * (0.5 + Math.random() * 0.5),
          color: sparkColor,
          life: sparkLife,
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      createSparks(e.clientX, e.clientY);
    };

    window.addEventListener("click", handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparks.current.forEach((spark, index) => {
        spark.x += Math.cos(spark.angle) * spark.speed;
        spark.y += Math.sin(spark.angle) * spark.speed;
        spark.life--;
        spark.size *= 0.95;

        ctx.fillStyle = spark.color;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fill();

        if (spark.life <= 0) {
          sparks.current.splice(index, 1);
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("click", handleClick);
    };
  }, [sparkColor, sparkSize, sparkCount, sparkSpeed, sparkLife]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
};
