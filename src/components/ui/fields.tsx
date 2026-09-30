import { useId } from "react";
import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <label className="field">
      <span id={`${id}-label`}>{label}</span>
      <input {...props} id={id} aria-labelledby={`${id}-label`} />
    </label>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <label className="field">
      <span id={`${id}-label`}>{label}</span>
      <select {...props} id={id} aria-labelledby={`${id}-label`}>
        {children}
      </select>
    </label>
  );
}
export function Textarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <label className="field wide">
      <span id={`${id}-label`}>{label}</span>
      <textarea rows={4} {...props} id={id} aria-labelledby={`${id}-label`} />
    </label>
  );
}
