import React, { useEffect, useRef } from "react";
import { useSprings, animated, easings } from "@react-spring/web";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  animationFrom?: object;
  animationTo?: object;
  easing?: keyof typeof easings | ((t: number) => number);
  threshold?: number;
  rootMargin?: string;
  onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = "",
  delay = 100,
  animationFrom = { opacity: 0, transform: "translate3d(0,50px,0)" },
  animationTo = { opacity: 1, transform: "translate3d(0,0,0)" },
  easing = "easeOutCubic",
  threshold = 0.2,
  rootMargin = "-50px",
  onLetterAnimationComplete,
}) => {
  const letters = Array.from(text);
  const ref = useRef<HTMLDivElement>(null);
  const [springs, api] = useSprings(letters.length, () => ({
    ...animationFrom,
  }));

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    if (ref.current) {
      observer = new window.IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            api.start((index: number) => ({
              ...animationTo,
              delay: index * delay,
              config: {
                easing: typeof easing === "string" ? easings[easing] : easing,
              },
              onRest:
                index === letters.length - 1
                  ? onLetterAnimationComplete
                  : undefined,
            }));
            observer && observer.disconnect();
          }
        },
        { threshold, rootMargin },
      );
      observer.observe(ref.current);
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, [
    api,
    animationTo,
    delay,
    easing,
    letters.length,
    onLetterAnimationComplete,
    rootMargin,
    threshold,
  ]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ display: "inline-block", overflow: "hidden" }}
    >
      {springs.map((style, i) => (
        <animated.span key={i} style={style}>
          {letters[i] === " " ? "\u00A0" : letters[i]}
        </animated.span>
      ))}
    </div>
  );
};

export default SplitText;
