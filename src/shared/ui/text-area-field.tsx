interface TextAreaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label: string;
}

export function TextAreaField({ error, label, id, ...props }: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label className="text-label-sm text-on-surface" htmlFor={id}>
        {label}
      </label>
      <textarea
        className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error ? (
        <p className="text-label-sm text-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
