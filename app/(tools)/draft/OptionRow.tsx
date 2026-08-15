interface Props {
  label: string;
  children: React.ReactNode;
}

/** A labelled block in the create form, using the HUD label treatment. */
export function OptionRow({ label, children }: Props): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="hud-label">{label}</span>
      {children}
    </div>
  );
}
