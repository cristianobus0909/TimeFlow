import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
}

export const Card = ({
  children,
  className = '',
  hoverable = false,
  glow = false,
  ...props
}: CardProps) => {
  return (
    <div
      className={`tf-card ${hoverable ? 'tf-card-hover' : ''} ${glow ? 'tf-glow-purple' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
