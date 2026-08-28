import { useId } from 'react';

// Form field wrapper: label ABOVE the control, hint and error BELOW it.
// Pass the control as children, or as a function that receives the generated id:
//
//   <Field label="Email" error={errors.email}>
//     {(id) => <Input id={id} type="email" />}
//   </Field>

export function Field({ label, id, hint, error, required, children }) {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>

      {typeof children === 'function' ? children(fieldId) : children}

      {hint && !error && <p className="text-xs text-ink-soft">{hint}</p>}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
