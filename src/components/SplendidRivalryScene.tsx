import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box } from "@react-three/drei";
import { useState, useEffect, useRef} from "react";
import CameraDebugReader from "./CameraDebugReader";
import { Html } from "@react-three/drei";
import * as THREE from "three";


const redColor = "#ef4444";
const blueColor = "#3b82f6";
const greenColor = "#22c55e";
const yellowColor = "#f7c335";
const pinkColor = "#f086af";
const whiteColor = "#f8fafc";
const blackColor = "#000000";

function useIsPortraitMobile() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(mobile && portrait);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isPortraitMobile;
}


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
  opacity = 0.25,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
  size?: [number, number, number];
  opacity?: number;
  rotation?: [number, number, number];
}) {
  return (
    <Box
      args={size}
      position={position}
      rotation={rotation}
      // castShadow
      onClick={onClick}
    >
      <meshStandardMaterial color={color} opacity={opacity} transparent />
    </Box>
  );
}

function GemBoard({
  color = "#9e9886",
}: {
  color?: string;
}) {
  const gridSize = 5;
  const spacing = 0.75;

  // Centre of your original 5×5 grid
  const centerX = -3.75;
  const centerZ = 0.25;

  const generateSpiralCoordinates = (
    count: number
  ): Array<[number, number]> => {
    const coordinates: Array<[number, number]> = [[0, 0]];

    let x = 0;
    let z = 0;
    let stepLength = 1;

    while (coordinates.length < count) {
      // Right
      for (let step = 0; step < stepLength; step++) {
        x++;

        if (coordinates.length < count) {
          coordinates.push([x, z]);
        }
      }

      // Down / positive Z
      for (let step = 0; step < stepLength; step++) {
        z++;

        if (coordinates.length < count) {
          coordinates.push([x, z]);
        }
      }

      stepLength++;

      // Left
      for (let step = 0; step < stepLength; step++) {
        x--;

        if (coordinates.length < count) {
          coordinates.push([x, z]);
        }
      }

      // Up / negative Z
      for (let step = 0; step < stepLength; step++) {
        z--;

        if (coordinates.length < count) {
          coordinates.push([x, z]);
        }
      }

      stepLength++;
    }

    return coordinates;
  };

  const coordinates = generateSpiralCoordinates(gridSize * gridSize);

  return (
    <>
      {coordinates.map(([gridX, gridZ], index) => (
        <Box
          key={`${gridX}-${gridZ}`}
          position={[
            centerX + gridX * spacing,
            0.05,
            centerZ + gridZ * spacing,
          ]}
          args={[0.625, 0.02, 0.625]}
        >
          <meshStandardMaterial color={color} />

          <Html position={[0, 0.02, 0]} center>
            <p>{gridX},{gridZ}</p>
            <p>{index}</p>
          </Html>
        </Box>
      ))}
    </>
  );
}



function Coin({
  position,
  color,
  shape,
}: {
  position: [number, number, number];
  color: string;
  shape?: "cone" | "triangle" | "square" | "pentagon" | "hexagon" | "octagon" | "ring" | "sphere" | "ring1" | "ring2";
}) {

  function getGeometry() {
    switch (shape) {
      case "cone":
        return       <cylinderGeometry args={[0.15, 0.25, 0.16, 16]} />;
      case "triangle":
        return       <cylinderGeometry args={[0.25, 0.25, 0.08, 3]} />;
      case "square":
        return       <cylinderGeometry args={[0.25, 0.25, 0.08, 4]} />;
      case "pentagon":
        return       <cylinderGeometry args={[0.25, 0.25, 0.08, 5]} />;
      case "hexagon":
        return       <cylinderGeometry args={[0.25, 0.25, 0.08, 6]} />;
      case "octagon":
        return       <cylinderGeometry args={[0.25, 0.25, 0.08, 8]} />;
      case "ring":
        return       <torusGeometry args={[0.18, 0.07, 8, 8]} />;
      case "sphere":
        return             <sphereGeometry args={[0.25, 2, 3]} />;
      case "ring1":
        return             <torusGeometry args={[0.20, 0.07, 8, 3]} />;
      case "ring2":
        return             <torusGeometry args={[0.18, 0.05, 8, 8]} />;
      default:
        return       <cylinderGeometry args={[0.25, 0.25, 0.08, 24]} />;
    }
  }

  return (
    <mesh position={position} rotation={[shape === "ring1" || shape === "ring2"  ? Math.PI/2 : shape === "cone" ? 0 : Math.PI, 0, 0]} castShadow>
      {getGeometry()}
      <meshStandardMaterial color={color} roughness={0.4} />
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
    <mesh position={position} rotation={[Math.PI/2, 0, Math.PI/2]} castShadow>
      <cylinderGeometry args={[0.075, 0.075, 0.5, 24]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
    </mesh>
  );
}

function UI_Pocket({color, count, shape}: {color: string, count: number, shape?: "cone" | "triangle" | "square" | "pentagon" | "hexagon" | "octagon" | "ring1" | "ring2"}) {
  return (
    <div className="w-10 h-10 lg:w-20 lg:h-20 relative">
      <Canvas camera={{ position: [0, shape === "cone" ? 0.75 : shape === "triangle" ? 0.375 : 0.5, shape === "cone" ? 0.75 : shape === "triangle" ? 0.375 : 0.5], fov: 45 }}
          dpr={[1, 1.5]}
          >
        <ambientLight intensity={1} />
        <directionalLight position={[0, 2, 0.5]} />
        <Coin position={[0, shape === "cone" ? .08 : 0, 0]} color={color} shape={shape} />
      </Canvas>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="text-md lg:text-2xl font-bold text-white">{count}</span>
      </div>
    </div>
  )
};

function ScrollSlots() {
    const cardSlotBasePositionX = -1.75;
    const cardSlotBasePositionZ = -2;
  const cardSlotHorizontalSpacing = 1.0;
  return (
    <>
      <Scroll position={[cardSlotBasePositionX - cardSlotHorizontalSpacing * 0.9, 0.05, cardSlotBasePositionZ]} color="#fad5a4"/>
      <Scroll position={[cardSlotBasePositionX - cardSlotHorizontalSpacing * 2, 0.05, cardSlotBasePositionZ]} color="#fad5a4"/>
      <Scroll position={[cardSlotBasePositionX - cardSlotHorizontalSpacing * 3.1, 0.05, cardSlotBasePositionZ]} color="#fad5a4"/>
    </>
  )
}

function playerWalletSlots(transparencies: { [key: string]: number }){

  const cardSlotBasePositionX = -1.825;
  const cardSlotBasePositionZ = 3.25;
  const cardSlotHorizontalSpacing = 1.0;
  const cardSlotHorizontalSpacingAlt = 1.4;

  return (
    <>

      {/* Card slots */}
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 0.5, 0.05, cardSlotBasePositionZ]} color="#000000" opacity={transparencies.cardBlack} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 1.5, 0.05, cardSlotBasePositionZ]} color="#f8fafc" opacity={transparencies.cardWhite} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 2.5, 0.05, cardSlotBasePositionZ]} color="#ef4444" opacity={transparencies.cardRed} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 3.5, 0.05, cardSlotBasePositionZ]} color="#3b82f6" opacity={transparencies.cardBlue} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 4.5, 0.05, cardSlotBasePositionZ]} color="#22c55e" opacity={transparencies.cardGreen} />

      {/* Coin slots */}
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 0.5, 0.08, cardSlotBasePositionZ + 0.975]} color="#000000" shape="triangle"/>
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 1.5, 0.08, cardSlotBasePositionZ + 0.975]} color="#f8fafc" shape="square"/>
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 2.5, 0.08, cardSlotBasePositionZ + 0.975]} color="#ef4444" shape="pentagon"/>
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 3.5, 0.08, cardSlotBasePositionZ + 0.975]} color="#3b82f6" shape="hexagon"/>
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 4.5, 0.08, cardSlotBasePositionZ + 0.975]} color="#22c55e" shape="octagon"/>
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 5.5, 0.08, cardSlotBasePositionZ]} color="#f086af" shape="ring1"/>
      <Coin position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 5.5, 0.08, cardSlotBasePositionZ + 0.975]} color="#f7c335" shape="ring2"/>

      {/* Scroll slots */}
      <Scroll position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.75,0.08, cardSlotBasePositionZ + 0.975]} color="#fad5a4"/>
      <Scroll position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.75,0.08, cardSlotBasePositionZ + 0.4]} color="#fad5a4"/>
      <Scroll position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.75,0.08, cardSlotBasePositionZ - 0.175]} color="#fad5a4"/>

      {/* Reserve Slots */}
      <Card position={[cardSlotBasePositionX - cardSlotHorizontalSpacingAlt * 0.625, 0.05, cardSlotBasePositionZ + 0.25]} rotation={[0, Math.PI / 8, 0]} />
      <Card position={[cardSlotBasePositionX - cardSlotHorizontalSpacingAlt * 1.375, 0.05, cardSlotBasePositionZ + 0.25]} rotation={[0, Math.PI / 8, 0]} />
      <Card position={[cardSlotBasePositionX - cardSlotHorizontalSpacingAlt * 2.125, 0.05, cardSlotBasePositionZ + 0.25]} rotation={[0, Math.PI / 8, 0]} />
    </>
  )
}

function GallerySlots() {
  const cardSlotBasePositionX = -1.325;
  const cardSlotBasePositionZ = -1.25;
  const cardSlotBasePositionY = 0.05;
  const cardSlotHorizontalSpacing = 1.0;
  const cardSlotVerticalSpacing = 1.375;
  
  return (
    <>     
    //bottom row of 5 
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 1, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 2]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 2, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 2]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 3, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 2]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 4, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 2]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 5, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 2]} />

      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 1.5, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 2.5, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 3.5, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 4.5, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing]} />

      
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 2, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 0]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 3, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 0]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 4, cardSlotBasePositionY, cardSlotBasePositionZ + cardSlotVerticalSpacing * 0]} />

    //royals
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.25, 0.05, -1.45]} size={[1.2, 0.01, 0.8]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.25, 0.05, -0.4]} size={[1.2, 0.01, 0.8]}/>
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.25, 0.05, 0.65]} size={[1.2, 0.01, 0.8]} />
      <Card position={[cardSlotBasePositionX + cardSlotHorizontalSpacing * 6.25, 0.05, 1.7]} size={[1.2, 0.01, 0.8]} />

    //deck slots
      <Card position={[cardSlotBasePositionX, cardSlotBasePositionY, cardSlotBasePositionZ]} />
      <Card position={[cardSlotBasePositionX, cardSlotBasePositionY, cardSlotBasePositionZ+cardSlotVerticalSpacing]} />
      <Card position={[cardSlotBasePositionX, cardSlotBasePositionY, cardSlotBasePositionZ+cardSlotVerticalSpacing*2]} /></>
  )
}

export default function SplendidRivalryScene() {
  const [pos, setPos] = useState<[number, number, number]>([0, 0, 0]);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isPortraitMobile = useIsPortraitMobile();
  const [transparencies] = useState<{ [key: string]: number }>({
    cardBlack: 0.25,
    cardWhite: 0.25,
    cardRed: 0.25,
    cardBlue: 0.25,
    cardGreen: 0.25,
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === sceneRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await sceneRef.current?.requestFullscreen();
    }
  } catch (error) {
    console.error("Could not toggle fullscreen:", error);
  }
};

  return (
    <div ref={sceneRef} className="relative w-full h-screen">

    <button
  type="button"
  onClick={toggleFullscreen}
  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
  className="
    absolute top-4 right-4 z-[60]
    flex h-11 w-11 items-center justify-center
    rounded-lg bg-black/70 text-white
    backdrop-blur-sm transition
    hover:bg-black/90
    focus:outline-none focus:ring-2 focus:ring-white
  "
>
  {isFullscreen ? (
    // Minimize icon
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3v5H3" />
      <path d="M16 3v5h5" />
      <path d="M8 21v-5H3" />
      <path d="M16 21v-5h5" />
    </svg>
  ) : (
    // Maximize icon
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M8 21H3v-5" />
      <path d="M16 21h5v-5" />
    </svg>
  )}
</button>

    <Canvas
      shadows={{
    type: THREE.PCFShadowMap,
  }}
      camera={{ position: [0, 12.5, 3], fov: 45 }}
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
      <BoardDyanmic size={[11.5, 2]} color="#1e463b" position={[0, -0.01, 3.5]} />
      <BoardDyanmic size={[11.5, 2]} color="#b88c8c" position={[0, -0.01, -3.5]} />






      {GallerySlots()}

      {playerWalletSlots(transparencies)}

      <GemBoard color="#afafaf" />
      <ScrollSlots />

      <OrbitControls
        enablePan={false}
        minDistance={10.5}
        maxDistance={12}
        // Vertical rotation
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 4}

        // Horizontal rotation
        minAzimuthAngle={0}
        maxAzimuthAngle={0}
        target={[0, 0, 1]}
      />
    </Canvas>

    {isPortraitMobile && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-white p-6 text-center">
          <div>
            <p className="text-xl font-semibold mb-2">Rotate your phone</p>
            <p className="text-sm opacity-80">
              This experience works best in landscape mode.
            </p>
          </div>
        </div>
      )}


    <div className="absolute top-1/2 right-4 -translate-y-1/2 z-50 bg-black/20 text-white text-sm p-3 rounded">
        <div className="flex flex-col gap-1 top-1/2 left-0 transform">
              <UI_Pocket color={blackColor} count={0} shape="triangle"/>
              <UI_Pocket color={whiteColor} count={0} shape="square"/>
              <UI_Pocket color={redColor} count={3} shape="pentagon"/>
              <UI_Pocket color={blueColor} count={2} shape="hexagon"/>
              <UI_Pocket color={greenColor} count={1} shape="octagon"/>
              <UI_Pocket color={pinkColor} count={0} shape="ring1"/>
              <UI_Pocket color={yellowColor} count={0} shape="ring2"/>
      </div>
    </div>
        

    <div className="absolute bottom-4 left-4 z-50 bg-black/70 text-white text-sm p-3 rounded">
        <div>x: {pos[0].toFixed(2)}</div>
        <div>y: {pos[1].toFixed(2)}</div>
        <div>z: {pos[2].toFixed(2)}</div>
      </div>
    </div>
  );
}