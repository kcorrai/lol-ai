import { Composition } from "remotion";
import { HowItWorks } from "./HowItWorks";

export const RemotionRoot = () => {
  return (
    <Composition
      id="HowItWorks"
      component={HowItWorks}
      durationInFrames={450}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
