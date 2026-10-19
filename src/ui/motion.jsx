// Scroll-in reveals using native CSS scroll-driven animations (.ab-reveal in tokens.css).
// The browser runs them off the main thread, and where they aren't supported, or the visitor
// asks for reduced motion, content simply shows. Nothing is ever hidden waiting for JavaScript.

export function Reveal({ as: Tag = 'div', className = '', children, ...props }) {
  return <Tag className={`ab-reveal ${className}`} {...props}>{children}</Tag>;
}

// Each item reveals as it enters the screen, so a grid naturally appears one card after another.
export function StaggerList({ className = '', children }) {
  return <ul className={className}>{children}</ul>;
}

export function StaggerItem({ className = '', children }) {
  return <li className={`ab-reveal ${className}`}>{children}</li>;
}
