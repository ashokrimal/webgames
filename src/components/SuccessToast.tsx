import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessToastProps {
  message: string;
  duration?: number;
  onDismiss?: () => void;
}

export const SuccessToast = ({ message, duration = 3000, onDismiss }: SuccessToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
      <Check className="w-5 h-5" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={() => { setVisible(false); onDismiss?.(); }} className="ml-2 hover:bg-green-700 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
