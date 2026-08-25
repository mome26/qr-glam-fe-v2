import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';

export default function PasswordChangeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  if (!user?.isDefaultPassword || dismissed) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-warning">
            <span className="font-medium">⚠️</span> You are using a default password.{' '}
            Change it now to secure your account.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/settings"
              className="rounded bg-warning px-3 py-1.5 text-sm font-medium text-white hover:bg-warning/90"
            >
              Change Password
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-warning/70 hover:text-warning text-sm"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
