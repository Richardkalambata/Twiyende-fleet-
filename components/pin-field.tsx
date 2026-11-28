'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  label: string;
  labelClassName?: string;
  hideLabel?: boolean;
};

export function PinField({ label, labelClassName, hideLabel, className, ...input }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={labelClassName}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>{label}</label>
      <div className="relative">
        <input id={id} {...input} type={visible ? 'text' : 'password'} inputMode="numeric" maxLength={6}
          pattern="[0-9]{6}" className={`${className ?? ''} pr-12`} />
        <button type="button" aria-controls={id} aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-0 grid min-h-11 w-11 place-items-center rounded-lg text-[#345079] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F5BFF]">
          {visible ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
