import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import * as THREE from "three";

import { useState } from "react";
import CameraDebugReader from "./CameraDebugReader";

// function Board() {
//   return (
//     <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
//       <planeGeometry args={[11.5, 9]} />
//       <meshStandardMaterial color="#2f5d50" />
//     </mesh>
//   );
// }

function BoardDyanmic({size, color, position}: {size: [number, number], color: string, position: [number, number, number]}) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}


function Table() {
  return (
    <mesh receiveShadow position={[0, -0.52, 0]}>
      <boxGeometry args={[12, 1, 9.5]} />
      <meshStandardMaterial color="#5b3a29" />
    </mesh>
  );
}

function Card({
  position,
  color = "#9e9886",
  onClick,
  size = [0.8, 0.01, 1.2],
}: {
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
  size?: [number, number, number];
}) {
  return (
    <Box
      args={size}
      position={position}
      castShadow
      onClick={onClick}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
}

function GemBoard({
  position,
  color = "#9e9886",
  onClick,
}: {
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
}) {
  return (
    <Box
      args={[3.5, 0.01, 3.5]}
      position={position}
      castShadow
      onClick={onClick}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
}

function Coin({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={[Math.PI, 0, 0]} castShadow>
      <cylinderGeometry args={[0.25, 0.25, 0.08, 24]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </mesh>
  );
}

function Scroll({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={[Math.PI/2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.075, 0.075, 0.5, 24]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </mesh>
  );
}


export default function SplendidRivalrySceneDraft2() {
      const [pos, setPos] = useState<[number, number, number]>([0, 0, 0]);
  return (
    <div className="relative w-full h-screen">

    <Canvas
        shadows={{
    type: THREE.PCFShadowMap,
  }}
      camera={{ position: [0, 8, 8.5], fov: 45 }}
      dpr={[1, 1.5]}
    >
                <CameraDebugReader onUpdate={setPos} />

      <color attach="background" args={["#111111"]} />

      <ambientLight intensity={1.2} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Table />
      <BoardDyanmic size={[11.5, 5]} color="#324b44" position={[0, -0.01, 0]} />
      {/* <BoardDyanmic size={[5.5, 2]} color="#95cfc0" position={[3, -0.01, 3.5]} /> */}
      <BoardDyanmic size={[11.5, 2]} color="#1e463b" position={[0, -0.01, 3.5]} />
      <BoardDyanmic size={[6, 2]} color="#b88c8c" position={[-2.75, -0.01, -3.5]} />
      <BoardDyanmic size={[5.5, 2]} color="#5c1d1d" position={[3, -0.01, -3.5]} />
      {/* <Board /> */}

      <Card position={[-1, 0.05, 1.5]} />
      <Card position={[1, 0.05, 1.5]} />
      <Card position={[0, 0.05, 1.5]} />
      <Card position={[2, 0.05, 1.5]} />
      <Card position={[3, 0.05, 1.5]} />

      <Card position={[2.5, 0.05, 0.125]} />
      <Card position={[1.5, 0.05, 0.125]} />
      <Card position={[0.5, 0.05, 0.125]} />
      <Card position={[-0.5, 0.05, 0.125]} />

      <Card position={[1, 0.05, -1.25]} />
      <Card position={[2, 0.05, -1.25]} />
      <Card position={[0, 0.05, -1.25]} />

      <Card position={[4.5, 0.05, -1.5]} size={[1.2, 0.01, 0.8]} />
      <Card position={[4.5, 0.05, -0.5]} size={[1.2, 0.01, 0.8]}/>
      <Card position={[4.5, 0.05, 0.5]} size={[1.2, 0.01, 0.8]} />
      <Card position={[4.5, 0.05, 1.5]} size={[1.2, 0.01, 0.8]} />


      <Card position={[-5.15, 0.05, 3.5]} />
      <Card position={[-4.15, 0.05, 3.5]} />
      <Card position={[-3.15, 0.05, 3.5]} />
      <Card position={[-2.15, 0.05, 3.5]} /> 
      <Card position={[-1.15, 0.05, 3.5]} />

      <Card position={[3, 0.05, 3.5]} size={[0.8, 0.01, 1.2]} />
      <Card position={[4.05, 0.05, 3.5]} size={[0.8, 0.01, 1.2]} />
      <Card position={[5.1, 0.05, 3.5]} size={[0.8, 0.01, 1.2]} />

      <Coin position={[-0.75+0.5, 0.08, 3.1]} color="#000000" />
      <Coin position={[-0.75+0.5, 0.08, 3.9]} color="#f8fafc" />
      <Coin position={[-0.75+1.25, 0.08, 3.1]} color="#ef4444" />
      <Coin position={[-0.75+1.25, 0.08, 3.9]} color="#3b82f6" />
      <Coin position={[-0.75+2, 0.08, 3.1]} color="#22c55e" />
      <Coin position={[-0.75+2, 0.08, 3.9]} color="#f086af" />
      <Coin position={[-0.75+2.75, 0.08, 3.1]} color="#f7c335" />


      <Scroll position={[2,0.08,3.9]} color="#fad5a4"/>
      <GemBoard position={[-3.75, 0.05, -0.5]} color="#afafaf" />

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={14}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0, 0]}
      />
    </Canvas>

    <div className="absolute bottom-4 left-4 z-50 bg-black/70 text-white text-sm p-3 rounded">
        <div>x: {pos[0].toFixed(2)}</div>
        <div>y: {pos[1].toFixed(2)}</div>
        <div>z: {pos[2].toFixed(2)}</div>
      </div>
    </div>
  );
}