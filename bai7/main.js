import {
    Canvas,
    Circle,
    CircleBrush,
    FabricImage,
    FabricText,
    Path,
    PatternBrush,
    PencilBrush,
    Rect,
} from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
});

const els = {
  selectModeBtn: document.getElementById('selectModeBtn'),
  drawModeBtn: document.getElementById('drawModeBtn'),
  brushType: document.getElementById('brushType'),
  brushColor: document.getElementById('brushColor'),
  brushWidth: document.getElementById('brushWidth'),
  addImageBtn: document.getElementById('addImageBtn'),
  clipBtn: document.getElementById('clipBtn'),
  clipRectBtn: document.getElementById('clipRectBtn'),
  clearClipBtn: document.getElementById('clearClipBtn'),
  clearPathsBtn: document.getElementById('clearPathsBtn'),
  info: document.getElementById('info'),
  status: document.getElementById('status'),
};

function log(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  els.status.textContent = `[${time}] ${message}\n` + els.status.textContent;
}

const BRUSH_NAMES = {
  pencil: 'PencilBrush',
  circle: 'CircleBrush',
  pattern: 'PatternBrush',
};

function updateInfo() {
  const brushName = BRUSH_NAMES[els.brushType.value] || els.brushType.value;

  els.info.innerHTML = `
    Mode: ${canvas.isDrawingMode ? 'Draw' : 'Select'}
    <br />
    Brush: ${brushName}
  `;
}

function createStarterScene() {
  const rect = new Rect({
    left: 80,
    top: 90,
    width: 180,
    height: 110,
    rx: 16,
    ry: 16,
    fill: '#60a5fa',
    stroke: '#1d4ed8',
    strokeWidth: 2,
    name: 'BlueRect',
  });

  const circle = new Circle({
    left: 330,
    top: 100,
    radius: 58,
    fill: '#f97316',
    stroke: '#c2410c',
    strokeWidth: 3,
    name: 'OrangeCircle',
  });

  const text = new FabricText('Draw on me ✏️', {
    left: 520,
    top: 120,
    fontSize: 32,
    fill: '#111827',
    name: 'TitleText',
  });

  canvas.add(rect, circle, text);
  canvas.setActiveObject(rect);
}

function createPatternBrush() {
  const brush = new PatternBrush(canvas);
  brush.getPatternSrc = function () {
    const size = 10;
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = size;
    patternCanvas.height = size;
    const ctx = patternCanvas.getContext('2d');
    ctx.fillStyle = els.brushColor.value;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    return patternCanvas;
  };
  return brush;
}

function createBrush() {
  let brush;
  const type = els.brushType.value;

  if (type === 'circle') {
    brush = new CircleBrush(canvas);
  } else if (type === 'pattern') {
    brush = createPatternBrush();
  } else {
    brush = new PencilBrush(canvas);
  }

  brush.color = els.brushColor.value;
  brush.width = Number(els.brushWidth.value);

  canvas.freeDrawingBrush = brush;
  updateInfo();
}

function enableDrawMode() {
  canvas.isDrawingMode = true;
  createBrush();
  log('Đã bật drawing mode.');
}

function enableSelectMode() {
  canvas.isDrawingMode = false;
  updateInfo();
  log('Đã bật select mode.');
}

function loadDemoImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="260" height="180" viewBox="0 0 260 180">
      <rect width="260" height="180" rx="20" fill="#dbeafe"/>
      <circle cx="70" cy="60" r="28" fill="#60a5fa"/>
      <rect x="120" y="35" width="90" height="18" rx="9" fill="#1d4ed8"/>
      <rect x="120" y="65" width="70" height="14" rx="7" fill="#93c5fd"/>
      <rect x="24" y="120" width="210" height="24" rx="12" fill="#bfdbfe"/>
      <text x="84" y="136" font-size="16" font-family="Arial" fill="#1e3a8a">
        Fabric Image Demo
      </text>
    </svg>
  `;

  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addDemoImage() {
  try {
    const imgEl = await loadDemoImage();

    const imageObj = new FabricImage(imgEl, {
      left: 300,
      top: 260,
      scaleX: 0.9,
      scaleY: 0.9,
      name: 'DemoImage',
    });

    canvas.add(imageObj);
    canvas.setActiveObject(imageObj);
    canvas.requestRenderAll();
    log('Đã thêm demo image.');
  } catch (error) {
    console.error(error);
    log('Không thể tạo demo image.');
  }
}

function applyCircleClipToActiveObject() {
  const active = canvas.getActiveObject();

  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  const radius = Math.max((active.getScaledWidth?.() || 120), (active.getScaledHeight?.() || 120)) / 2;

  active.clipPath = new Circle({
    radius,
    originX: 'center',
    originY: 'center',
  });

  canvas.requestRenderAll();
  log(`Đã apply circle clip cho ${active.name || active.type}.`);
}

function applyRoundedRectClipToActiveObject() {
  const active = canvas.getActiveObject();

  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  const w = active.getScaledWidth?.() || 120;
  const h = active.getScaledHeight?.() || 120;

  active.clipPath = new Rect({
    width: w,
    height: h,
    rx: 20,
    ry: 20,
    originX: 'center',
    originY: 'center',
  });

  canvas.requestRenderAll();
  log(`Đã apply rounded-rect clip cho ${active.name || active.type}.`);
}

function clearClipFromActiveObject() {
  const active = canvas.getActiveObject();

  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  active.clipPath = undefined;
  canvas.requestRenderAll();
  log(`Đã clear clipPath của ${active.name || active.type}.`);
}

function clearAllBrushPaths() {
  const paths = canvas.getObjects().filter(
    (obj) => obj instanceof Path || (obj.name && obj.name.startsWith('BrushPath_'))
  );

  if (paths.length === 0) {
    log('Không có brush path nào để xóa.');
    return;
  }

  paths.forEach((p) => canvas.remove(p));
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  log(`Đã xóa ${paths.length} brush path.`);
}

// Random colors for auto-coloring paths
const PATH_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
let pathColorIndex = 0;

canvas.on('path:created', (e) => {
  const path = e.path;
  if (!path) return;

  // Auto-change path color on creation
  const newColor = PATH_COLORS[pathColorIndex % PATH_COLORS.length];
  pathColorIndex++;
  path.set({
    stroke: newColor,
    name: `BrushPath_${Date.now()}`,
  });
  canvas.requestRenderAll();

  log(`Đã tạo path mới, đổi màu → ${newColor}`);
});

els.selectModeBtn.addEventListener('click', enableSelectMode);
els.drawModeBtn.addEventListener('click', enableDrawMode);

els.brushType.addEventListener('change', () => {
  if (canvas.isDrawingMode) {
    createBrush();
  } else {
    updateInfo();
  }
  log(`Đã đổi brush -> ${els.brushType.value}`);
});

els.brushColor.addEventListener('input', () => {
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.color = els.brushColor.value;
  }
});

els.brushWidth.addEventListener('input', () => {
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.width = Number(els.brushWidth.value);
  }
});

els.addImageBtn.addEventListener('click', addDemoImage);
els.clipBtn.addEventListener('click', applyCircleClipToActiveObject);
els.clipRectBtn.addEventListener('click', applyRoundedRectClipToActiveObject);
els.clearClipBtn.addEventListener('click', clearClipFromActiveObject);
els.clearPathsBtn.addEventListener('click', clearAllBrushPaths);

createStarterScene();
createBrush();
updateInfo();