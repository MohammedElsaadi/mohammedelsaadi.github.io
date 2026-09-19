import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowLeft,
  LuCheck,
  LuEraser,
  LuPenLine,
  LuRedo2,
  LuRotateCcw,
  LuTrash2,
  LuUndo2,
} from 'react-icons/lu';
import scoreSheet from '../assets/sonora-score-sheet.png';
import './sonora-whiteboard.css';

type Tool = 'pen' | 'eraser';

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  tool: Tool;
  color: string;
  width: number;
  points: Point[];
};

type SaveState = 'saved' | 'saving' | 'limited';

type Quadrant = {
  id: string;
  label: string;
  originX: 0 | 0.5;
  originY: 0 | 0.5;
};

const COLORS = ['#29242f', '#d94b4b', '#176879'] as const;
const COOKIE_META = 'sonora_board_chunks';
const COOKIE_PREFIX = 'sonora_board_';
const COOKIE_CHUNK_SIZE = 3000;
const MAX_COOKIE_CHUNKS = 12;
const QUADRANTS: Quadrant[] = [
  { id: 'top-left', label: 'Top left', originX: 0, originY: 0 },
  { id: 'top-right', label: 'Top right', originX: 0.5, originY: 0 },
  { id: 'bottom-left', label: 'Bottom left', originX: 0, originY: 0.5 },
  { id: 'bottom-right', label: 'Bottom right', originX: 0.5, originY: 0.5 },
];

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;

  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

function setCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 365) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function serializeStrokes(strokes: Stroke[]) {
  const serialized = strokes.map((stroke) => {
    const tool = stroke.tool === 'pen' ? 'p' : 'e';
    const colorIndex = Math.max(0, COLORS.indexOf(stroke.color as (typeof COLORS)[number]));
    const width = Math.round(stroke.width).toString(36);
    const points = stroke.points
      .map((point) => {
        const x = Math.round(point.x * 4095).toString(36);
        const y = Math.round(point.y * 4095).toString(36);
        return `${x}.${y}`;
      })
      .join('-');

    return `${tool}${colorIndex}${width}:${points}`;
  });

  return `v1!${serialized.join('!')}`;
}

function parseStrokes(value: string): Stroke[] {
  if (!value.startsWith('v1!')) return [];

  return value
    .slice(3)
    .split('!')
    .filter(Boolean)
    .map<Stroke | null>((encoded) => {
      const [header, encodedPoints] = encoded.split(':');
      if (!header || !encodedPoints || header.length < 3) return null;

      const tool: Tool = header[0] === 'e' ? 'eraser' : 'pen';
      const color: string = COLORS[Number(header[1])] ?? COLORS[0];
      const width = Number.parseInt(header.slice(2), 36);
      const points = encodedPoints
        .split('-')
        .map((point) => {
          const [x, y] = point.split('.').map((coordinate) => Number.parseInt(coordinate, 36));
          if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
          return { x: x / 4095, y: y / 4095 };
        })
        .filter((point): point is Point => point !== null);

      if (!Number.isFinite(width) || points.length === 0) return null;
      return { tool, color, width, points };
    })
    .filter((stroke): stroke is Stroke => stroke !== null);
}

function loadStrokesFromCookies() {
  try {
    const chunkCount = Number.parseInt(getCookie(COOKIE_META) ?? '0', 10);
    if (!Number.isFinite(chunkCount) || chunkCount < 1 || chunkCount > MAX_COOKIE_CHUNKS) return [];

    let value = '';
    for (let index = 0; index < chunkCount; index += 1) {
      const chunk = getCookie(`${COOKIE_PREFIX}${index}`);
      if (chunk === undefined) return [];
      value += chunk;
    }

    return parseStrokes(value);
  } catch {
    return [];
  }
}

function saveStrokesToCookies(strokes: Stroke[]) {
  try {
    const value = serializeStrokes(strokes);
    const chunks = Array.from(
      { length: Math.ceil(value.length / COOKIE_CHUNK_SIZE) },
      (_, index) => value.slice(index * COOKIE_CHUNK_SIZE, (index + 1) * COOKIE_CHUNK_SIZE),
    );

    if (chunks.length > MAX_COOKIE_CHUNKS) return false;

    const previousCount = Number.parseInt(getCookie(COOKIE_META) ?? '0', 10) || 0;
    chunks.forEach((chunk, index) => setCookie(`${COOKIE_PREFIX}${index}`, chunk));
    for (let index = chunks.length; index < previousCount; index += 1) {
      setCookie(`${COOKIE_PREFIX}${index}`, '', 0);
    }
    setCookie(COOKIE_META, String(chunks.length));
    return true;
  } catch {
    return false;
  }
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);

  const position = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(point.x - (start.x + position * dx), point.y - (start.y + position * dy));
}

function simplifyPoints(points: Point[], tolerance = 0.0025): Point[] {
  if (points.length <= 2) return points;

  let largestDistance = 0;
  let splitIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(points[index], first, last);
    if (distance > largestDistance) {
      largestDistance = distance;
      splitIndex = index;
    }
  }

  if (largestDistance <= tolerance) return [first, last];

  const left = simplifyPoints(points.slice(0, splitIndex + 1), tolerance);
  const right = simplifyPoints(points.slice(splitIndex), tolerance);
  return [...left.slice(0, -1), ...right];
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: Stroke,
  canvasWidth: number,
  canvasHeight: number,
  quadrant: Quadrant,
) {
  const scale = Math.min(canvasWidth, canvasHeight) / 300;
  const visiblePoints = stroke.points.map((point) => ({
    x: (point.x - quadrant.originX) * 2,
    y: (point.y - quadrant.originY) * 2,
  }));
  context.save();
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
  context.strokeStyle = stroke.color;
  context.fillStyle = stroke.color;
  context.lineWidth = stroke.width * scale;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  const first = visiblePoints[0];
  if (!first) {
    context.restore();
    return;
  }

  if (visiblePoints.length === 1) {
    context.beginPath();
    context.arc(first.x * canvasWidth, first.y * canvasHeight, (stroke.width * scale) / 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.beginPath();
  context.moveTo(first.x * canvasWidth, first.y * canvasHeight);
  visiblePoints.slice(1).forEach((point) => context.lineTo(point.x * canvasWidth, point.y * canvasHeight));
  context.stroke();
  context.restore();
}

function SonoraWhiteboard() {
  const [strokes, setStrokes] = useState<Stroke[]>(loadStrokesFromCookies);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [activeQuadrantIndex, setActiveQuadrantIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [confirmClear, setConfirmClear] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const strokesRef = useRef(strokes);
  const quadrantRef = useRef<Quadrant>(QUADRANTS[0]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const activeQuadrant = QUADRANTS[activeQuadrantIndex];

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);
    strokesRef.current.forEach((stroke) => drawStroke(context, stroke, width, height, quadrantRef.current));
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return undefined;

    const resizeCanvas = () => {
      const rectangle = board.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rectangle.width * pixelRatio);
      canvas.height = Math.round(rectangle.height * pixelRatio);
      canvas.style.width = `${rectangle.width}px`;
      canvas.style.height = `${rectangle.height}px`;
      const context = canvas.getContext('2d');
      context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawAll();
    };

    resizeCanvas();
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(board);
    return () => observer.disconnect();
  }, [drawAll]);

  useEffect(() => {
    strokesRef.current = strokes;
    drawAll();
    const timeout = window.setTimeout(() => {
      setSaveState(saveStrokesToCookies(strokes) ? 'saved' : 'limited');
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [drawAll, strokes]);

  useEffect(() => {
    quadrantRef.current = activeQuadrant;
    drawAll();
  }, [activeQuadrant, drawAll]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (confirmClear && !dialog.open) dialog.showModal();
    if (!confirmClear && dialog.open) dialog.close();
  }, [confirmClear]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const rectangle = event.currentTarget.getBoundingClientRect();
    const quadrant = quadrantRef.current;
    const localX = Math.max(0, Math.min(1, (event.clientX - rectangle.left) / rectangle.width));
    const localY = Math.max(0, Math.min(1, (event.clientY - rectangle.top) / rectangle.height));
    return {
      x: quadrant.originX + localX / 2,
      y: quadrant.originY + localY / 2,
    };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke: Stroke = {
      tool,
      color,
      width: tool === 'eraser' ? 28 : 4.5,
      points: [pointFromEvent(event)],
    };
    activeStrokeRef.current = stroke;
    const context = event.currentTarget.getContext('2d');
    if (context) {
      drawStroke(
        context,
        stroke,
        event.currentTarget.clientWidth,
        event.currentTarget.clientHeight,
        quadrantRef.current,
      );
    }
  };

  const continueDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStrokeRef.current;
    if (!stroke || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    const previous = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 0.0015) return;

    stroke.points.push(point);
    const context = event.currentTarget.getContext('2d');
    if (context) {
      drawStroke(
        context,
        { ...stroke, points: [previous, point] },
        event.currentTarget.clientWidth,
        event.currentTarget.clientHeight,
        quadrantRef.current,
      );
    }
  };

  const finishDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStrokeRef.current;
    if (!stroke) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    activeStrokeRef.current = null;
    const finishedStroke = { ...stroke, points: simplifyPoints(stroke.points) };
    setSaveState('saving');
    setStrokes((current) => [...current, finishedStroke]);
    setRedoStack([]);
  };

  const undo = () => {
    setSaveState('saving');
    setStrokes((current) => {
      const removed = current[current.length - 1];
      if (!removed) return current;
      setRedoStack((redo) => [...redo, removed]);
      return current.slice(0, -1);
    });
  };

  const redo = () => {
    setSaveState('saving');
    setRedoStack((current) => {
      const restored = current[current.length - 1];
      if (!restored) return current;
      setStrokes((visible) => [...visible, restored]);
      return current.slice(0, -1);
    });
  };

  const clearBoard = () => {
    setSaveState('saving');
    setStrokes([]);
    setRedoStack([]);
    setConfirmClear(false);
  };

  const saveMessage =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'limited'
        ? 'Cookie storage is full'
        : 'Saved in this browser';

  return (
    <main className="sonora-page">
      <header className="sonora-header">
        <Link className="sonora-back" to="/games">
          <LuArrowLeft aria-hidden="true" />
          Games
        </Link>
        <div className="sonora-heading">
          <p className="sonora-kicker">Score sheet</p>
          <h1>Sonora whiteboard</h1>
          <p>Choose a quadrant, then draw with a mouse, finger, or pen. Your marks return automatically.</p>
        </div>
        <div className={`sonora-save-status sonora-save-status--${saveState}`} aria-live="polite">
          {saveState === 'saved' ? <LuCheck aria-hidden="true" /> : <LuRotateCcw aria-hidden="true" />}
          {saveMessage}
        </div>
      </header>

      <section className="sonora-workspace" aria-label="Sonora score sheet whiteboard">
        <div className="sonora-toolbar" role="toolbar" aria-label="Drawing tools">
          <div className="sonora-tool-group">
            <button
              className="sonora-tool-button"
              type="button"
              aria-label="Marker"
              aria-pressed={tool === 'pen'}
              onClick={() => setTool('pen')}
            >
              <LuPenLine aria-hidden="true" />
              <span>Marker</span>
            </button>
            <button
              className="sonora-tool-button"
              type="button"
              aria-label="Eraser"
              aria-pressed={tool === 'eraser'}
              onClick={() => setTool('eraser')}
            >
              <LuEraser aria-hidden="true" />
              <span>Eraser</span>
            </button>
          </div>

          <div className="sonora-color-group" role="group" aria-label="Marker color">
            {COLORS.map((swatch, index) => (
              <button
                className="sonora-swatch"
                key={swatch}
                type="button"
                aria-label={['Charcoal marker', 'Coral marker', 'Teal marker'][index]}
                aria-pressed={tool === 'pen' && color === swatch}
                style={{ '--swatch-color': swatch } as React.CSSProperties}
                onClick={() => {
                  setColor(swatch);
                  setTool('pen');
                }}
              />
            ))}
          </div>

          <div className="sonora-tool-group sonora-tool-group--history">
            <button className="sonora-icon-button" type="button" onClick={undo} disabled={strokes.length === 0}>
              <LuUndo2 aria-hidden="true" />
              <span>Undo</span>
            </button>
            <button className="sonora-icon-button" type="button" onClick={redo} disabled={redoStack.length === 0}>
              <LuRedo2 aria-hidden="true" />
              <span>Redo</span>
            </button>
          </div>

          <button
            className="sonora-clear-button"
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={strokes.length === 0}
          >
            <LuTrash2 aria-hidden="true" />
            Clear
          </button>
        </div>

        <nav className="sonora-quadrant-nav" aria-label="Score sheet quadrants">
          <div className="sonora-quadrant-copy">
            <span>Zoomed drawing area</span>
            <strong>{activeQuadrant.label}</strong>
          </div>
          <div className="sonora-quadrant-buttons" role="group" aria-label="Choose a quadrant">
            {QUADRANTS.map((quadrant, index) => (
              <button
                key={quadrant.id}
                type="button"
                aria-pressed={activeQuadrantIndex === index}
                onClick={() => setActiveQuadrantIndex(index)}
              >
                <span className="sonora-quadrant-number" aria-hidden="true">{index + 1}</span>
                {quadrant.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="sonora-board-frame">
          <div className="sonora-board" ref={boardRef}>
            <img
              className="sonora-sheet-image"
              src={scoreSheet}
              alt="Blank Sonora board game score sheet"
              draggable="false"
              style={{
                left: `${activeQuadrant.originX * -200}%`,
                top: `${activeQuadrant.originY * -200}%`,
              }}
            />
            <canvas
              ref={canvasRef}
              className={`sonora-canvas sonora-canvas--${tool}`}
              aria-label="Drawing surface over the Sonora score sheet"
              onPointerDown={startDrawing}
              onPointerMove={continueDrawing}
              onPointerUp={finishDrawing}
              onPointerCancel={finishDrawing}
            />
          </div>
        </div>
      </section>

      <dialog
        className="sonora-dialog"
        ref={dialogRef}
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
        onCancel={(event) => {
          event.preventDefault();
          setConfirmClear(false);
        }}
        onClose={() => setConfirmClear(false)}
      >
        <div className="sonora-dialog-icon" aria-hidden="true">
          <LuTrash2 />
        </div>
        <h2 id="clear-dialog-title">Clear every mark?</h2>
        <p id="clear-dialog-description">This removes all marks from the score sheet. It can’t be undone.</p>
        <div className="sonora-dialog-actions">
          <button type="button" onClick={() => setConfirmClear(false)} autoFocus>
            Keep marks
          </button>
          <button className="sonora-dialog-confirm" type="button" onClick={clearBoard}>
            Clear sheet
          </button>
        </div>
      </dialog>
    </main>
  );
}

export default SonoraWhiteboard;
