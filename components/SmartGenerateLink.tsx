'use client';

import React from 'react';
import Link from 'next/link';

interface SmartGenerateLinkProps {
  children: React.ReactNode;
  className?: string;
  fallbackHref?: string; // Deprecated - kept for backwards compatibility but no longer used
  onClick?: () => void;
}

/**
 * SmartGenerateLink - Always links to the generate page
 * Authentication and subscription checks happen when user tries to generate
 * This allows users to experience the interface before committing to sign up
 */
export default function SmartGenerateLink({ 
  children, 
  className = '',
  fallbackHref = '/#pricing', // Kept for backwards compatibility
  onClick
}: SmartGenerateLinkProps) {
  // Always link to generate page - let the generate page handle auth flow
  return (
    <Link href="/generate" className={className} onClick={onClick}>
      {children}
    </Link>
  );
} 