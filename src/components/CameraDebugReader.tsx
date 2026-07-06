import { useFrame, useThree } from "@react-three/fiber";

type Props = {
  onUpdate: (pos: [number, number, number]) => void;
};

function CameraDebugReader({ onUpdate }: Props) {
  const { camera } = useThree();
  let last = 0;

  useFrame(() => {
    const now = performance.now();
    if (now - last > 100) {
      onUpdate([
        camera.position.x,
        camera.position.y,
        camera.position.z,
      ]);
      last = now;
    }
  });

  return null;
}

export default CameraDebugReader;