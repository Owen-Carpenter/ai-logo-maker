'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  type?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'fade' | 'slide-up' | 'slide-left' | 'slide-right';
  duration?: number;
}

export default function ScrollAnimation({ 
  children, 
  className = '', 
  delay = 0, 
  threshold = 0.1,
  type = 'fade-up',
  duration = 1000
}: ScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, threshold]);

  // Webflow-style animation configurations
  const animationClasses = {
    'fade-up': isVisible 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 translate-y-12',
    'fade-down': isVisible 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 -translate-y-12',
    'fade-left': isVisible 
      ? 'opacity-100 translate-x-0' 
      : 'opacity-0 translate-x-12',
    'fade-right': isVisible 
      ? 'opacity-100 translate-x-0' 
      : 'opacity-0 -translate-x-12',
    'scale': isVisible 
      ? 'opacity-100 scale-100' 
      : 'opacity-0 scale-95',
    'fade': isVisible 
      ? 'opacity-100' 
      : 'opacity-0',
    'slide-up': isVisible 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 translate-y-20',
    'slide-left': isVisible 
      ? 'opacity-100 translate-x-0' 
      : 'opacity-0 translate-x-20',
    'slide-right': isVisible 
      ? 'opacity-100 translate-x-0' 
      : 'opacity-0 -translate-x-20',
  };

  return (
    <div
      ref={elementRef}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${animationClasses[type]} ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: isVisible ? '0ms' : '0ms'
      }}
    >
      {children}
    </div>
  );
} 