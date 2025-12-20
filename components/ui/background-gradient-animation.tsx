"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const BackgroundGradientAnimation = ({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255",
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
  children?: React.ReactNode;
  className?: string;
  interactive?: boolean;
  containerClassName?: string;
}) => {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  return (
    <div
      className={cn(
        "h-screen w-screen relative overflow-hidden top-0 left-0 bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName
      )}
      style={{
        // @ts-ignore
        "--gradient-background-start": "var(--bg-gradient-start)",
        // @ts-ignore
        "--gradient-background-end": "var(--bg-gradient-end)",
        // @ts-ignore
        "--first-color": "var(--bg-gradient-1)",
        // @ts-ignore
        "--second-color": "var(--bg-gradient-2)",
        // @ts-ignore
        "--third-color": "var(--bg-gradient-3)",
        // @ts-ignore
        "--fourth-color": "var(--bg-gradient-4)",
        // @ts-ignore
        "--fifth-color": "var(--bg-gradient-5)",
      }}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className={cn("relative z-10 h-full w-full", className)}>{children}</div>
      <div
        className={cn(
          "gradients-container h-full w-full absolute inset-0 blur-lg",
          isSafari ? "blur-2xl" : "[filter:url(#blurMe)_blur(40px)]"
        )}
      >
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_var(--first-color)_0,_var(--first-color)_50%,_transparent_100%)]`,
            `[transform-origin:center_center]`,
            `animate-first`,
            `opacity-100`
          )}
          style={{
            width: size,
            height: size,
            left: "calc(50% - size / 2)",
            top: "calc(50% - size / 2)",
            mixBlendMode: blendingValue as any,
            // @ts-ignore
            "--first-color": `rgba(${firstColor}, 0.8)`,
          }}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--second-color),_0.8)_0,_rgba(var(--second-color),_0)_50%)_no-repeat]`,
            `[transform-origin:calc(50%-400px)]`,
            `animate-second`,
            `opacity-100`
          )}
          style={{
            width: size,
            height: size,
            left: "calc(50% - size / 2)",
            top: "calc(50% - size / 2)",
            mixBlendMode: blendingValue as any,
            // @ts-ignore
            "--second-color": secondColor,
          }}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--third-color),_0.8)_0,_rgba(var(--third-color),_0)_50%)_no-repeat]`,
            `[transform-origin:calc(50%+400px)]`,
            `animate-third`,
            `opacity-100`
          )}
          style={{
            width: size,
            height: size,
            left: "calc(50% - size / 2)",
            top: "calc(50% - size / 2)",
            mixBlendMode: blendingValue as any,
            // @ts-ignore
            "--third-color": thirdColor,
          }}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]`,
            `[transform-origin:calc(50%-200px)]`,
            `animate-fourth`,
            `opacity-70`
          )}
          style={{
            width: size,
            height: size,
            left: "calc(50% - size / 2)",
            top: "calc(50% - size / 2)",
            mixBlendMode: blendingValue as any,
            // @ts-ignore
            "--fourth-color": fourthColor,
          }}
        ></div>
        <div
          className={cn(
            `absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]`,
            `[transform-origin:calc(50%-800px)_calc(50%+800px)]`,
            `animate-fifth`,
            `opacity-100`
          )}
          style={{
            width: size,
            height: size,
            left: "calc(50% - size / 2)",
            top: "calc(50% - size / 2)",
            mixBlendMode: blendingValue as any,
            // @ts-ignore
            "--fifth-color": fifthColor,
          }}
        ></div>
      </div>
    </div>
  );
};
