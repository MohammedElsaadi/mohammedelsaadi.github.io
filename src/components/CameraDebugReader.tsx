import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

type Props = {
  onUpdate: (pos: [number, number, number]) => void;
};

function CameraDebugReader({ onUpdate }: Props) {
  const { camera } = useThree();
  const last = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (now - last.current > 100) {
      onUpdate([
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ]);
      last.current = now;
    }
  });

  return null;
}

export default CameraDebugReader;
