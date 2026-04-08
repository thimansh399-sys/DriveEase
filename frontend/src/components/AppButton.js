import React from 'react';
import '../styles/AppButton.css';

function AppButton({
  as = 'button',
  type = 'button',
  size = 'md',
  variant = 'glass',
  active = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  children,
  onClick,
  ...rest
}) {
  const Component = as;
  const isNativeButton = Component === 'button';
  const isDisabled = disabled || loading;
  const classes = [
    'app-button',
    `app-button--${size}`,
    `app-button--${variant}`,
    active ? 'is-active' : '',
    isDisabled ? 'is-disabled' : '',
    fullWidth ? 'is-full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      type={isNativeButton ? type : undefined}
      className={classes}
      onClick={(event) => {
        if (isDisabled && !isNativeButton) {
          event.preventDefault();
          return;
        }
        if (onClick) {
          onClick(event);
        }
      }}
      disabled={isNativeButton ? isDisabled : undefined}
      aria-disabled={!isNativeButton && isDisabled ? 'true' : undefined}
      aria-busy={loading ? 'true' : 'false'}
      {...rest}
    >
      {loading ? <span className="app-button__loader" aria-hidden="true" /> : null}
      {!loading && leftIcon ? <span className="app-button__icon">{leftIcon}</span> : null}
      <span className="app-button__label">{children}</span>
      {!loading && rightIcon ? <span className="app-button__icon">{rightIcon}</span> : null}
    </Component>
  );
}

export default AppButton;
