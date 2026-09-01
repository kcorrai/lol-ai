// What to do with a URL once it is copied.
//
// Four lines rather than a link out: the creator is inside OBS with the app on a
// second monitor, and the only thing that stalls them is not knowing which
// source type to pick and what size to give it.

const STEPS: string[] = [
  "In OBS, add a source and pick Browser.",
  "Paste the URL from any card here into the URL field.",
  "Set the width and height to the size shown on the card.",
  "Drag it where you want it. It updates on its own between games.",
];

export function ObsSteps(): JSX.Element {
  return (
    <section className="notch flex flex-col justify-center border border-dashed border-line-3 bg-surface p-5">
      <span className="hud-label">{"// Adding one in OBS"}</span>
      <ol className="mt-4 grid gap-3.5">
        {STEPS.map((step, index) => (
          <li key={step} className="grid grid-cols-[20px_1fr] items-start gap-3">
            <span className="font-mono text-[10.5px] font-bold text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-relaxed text-text-body">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-line-1 pt-3.5 font-mono text-[10px] uppercase tracking-label text-text-faint">
        Every overlay has a transparent background — no chroma key needed.
      </p>
    </section>
  );
}
