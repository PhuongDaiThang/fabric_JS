import { Canvas, Circle, Line, Point, Rect } from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
  preserveObjectStacking: true,
});

const GRID_SIZE = 50;
const GRID_MIN = -2000;
const GRID_MAX = 2000;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 4;
const SNAP_ANGLE = 15;

// Pan limits — prevent viewport from drifting too far from the grid area
const PAN_LIMIT = 600; // px beyond canvas edge

const els = {
  addRectBtn: document.getElementById('addRectBtn'),
  addCircleBtn: document.getElementById('addCircleBtn'),
  zoomInBtn: document.getElementById('zoomInBtn'),
  zoomOutBtn: document.getElementById('zoomOutBtn'),
  resetViewBtn: document.getElementById('resetViewBtn'),
  snapToggle: document.getElementById('snapToggle'),
  snapAngleToggle: document.getElementById('snapAngleToggle'),
  metrics: document.getElementById('metrics'),
  status: document.getElementById('status'),
};

let rectCount = 0;
let circleCount = 0;

let isPanning = false;
let lastPosX = 0;
let lastPosY = 0;

function log(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  els.status.textContent = `[${time}] ${message}\n` + els.status.textContent;
}

function isGridObject(obj) {
  return obj?.name?.startsWith('__grid__') || obj?.name?.startsWith('__axis__');
}

function updateMetrics(scenePoint = new Point(0, 0)) {
  const zoom = Math.round(canvas.getZoom() * 100);
  els.metrics.innerHTML = `
    Zoom: ${zoom}%
    <br />
    Scene mouse: (${Math.round(scenePoint.x)}, ${Math.round(scenePoint.y)})
  `;
}

function addGrid() {
  for (let x = GRID_MIN; x <= GRID_MAX; x += GRID_SIZE) {
    const isAxis = x === 0;
    const line = new Line([x, GRID_MIN, x, GRID_MAX], {
      stroke: isAxis ? '#94a3b8' : '#e2e8f0',
      strokeWidth: isAxis ? 2 : 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      name: isAxis ? '__axis_x__' : `__grid_v_${x}__`,
    });
    canvas.add(line);
  }

  for (let y = GRID_MIN; y <= GRID_MAX; y += GRID_SIZE) {
    const isAxis = y === 0;
    const line = new Line([GRID_MIN, y, GRID_MAX, y], {
      stroke: isAxis ? '#94a3b8' : '#e2e8f0',
      strokeWidth: isAxis ? 2 : 1,
      selectable: false,
      evented: false,
      excludeFromExport: true,
      name: isAxis ? '__axis_y__' : `__grid_h_${y}__`,
    });
    canvas.add(line);
  }
}

function createStarterObjects() {
  const rect = new Rect({
    left: 100,
    top: 100,
    width: 180,
    height: 120,
    rx: 16,
    ry: 16,
    fill: '#60a5fa',
    stroke: '#1d4ed8',
    strokeWidth: 2,
    name: 'BlueRect',
  });

  const circle = new Circle({
    left: 380,
    top: 180,
    radius: 60,
    fill: '#f97316',
    stroke: '#c2410c',
    strokeWidth: 3,
    name: 'OrangeCircle',
  });

  canvas.add(rect, circle);
  canvas.setActiveObject(rect);
}

function initScene() {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';
  addGrid();
  createStarterObjects();
  resetView();
  canvas.requestRenderAll();
  log('Đã tạo scene có grid.');
}

function addRect() {
  rectCount += 1;

  const rect = new Rect({
    left: 100 + rectCount * 30,
    top: 100 + rectCount * 20,
    width: 140,
    height: 90,
    rx: 14,
    ry: 14,
    fill: '#a78bfa',
    stroke: '#6d28d9',
    strokeWidth: 2,
    name: `Rect_${rectCount}`,
  });

  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
  log(`Đã thêm ${rect.name}`);
}

function addCircle() {
  circleCount += 1;

  const circle = new Circle({
    left: 220 + circleCount * 30,
    top: 220 + circleCount * 20,
    radius: 45,
    fill: '#f472b6',
    stroke: '#be185d',
    strokeWidth: 2,
    name: `Circle_${circleCount}`,
  });

  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
  log(`Đã thêm ${circle.name}`);
}

function resetView() {
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.setZoom(1);
  canvas.requestRenderAll();
  updateMetrics(new Point(0, 0));
  log('Đã reset camera.');
}

function clampPan() {
  const vpt = canvas.viewportTransform;
  const zoom = canvas.getZoom();
  const canvasW = canvas.getWidth();
  const canvasH = canvas.getHeight();

  // Limit how far the viewport origin can move
  const minX = -(GRID_MAX * zoom) - PAN_LIMIT + canvasW;
  const maxX = -(GRID_MIN * zoom) + PAN_LIMIT;
  const minY = -(GRID_MAX * zoom) - PAN_LIMIT + canvasH;
  const maxY = -(GRID_MIN * zoom) + PAN_LIMIT;

  vpt[4] = Math.max(minX, Math.min(maxX, vpt[4]));
  vpt[5] = Math.max(minY, Math.min(maxY, vpt[5]));
}

function applyZoom(newZoom, centerX, centerY) {
  const zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
  canvas.zoomToPoint(new Point(centerX, centerY), zoom);
  clampPan();
  canvas.requestRenderAll();
  updateMetrics(new Point(0, 0));
}

function zoomIn() {
  const cx = canvas.getWidth() / 2;
  const cy = canvas.getHeight() / 2;
  applyZoom(canvas.getZoom() * 1.2, cx, cy);
  log(`Zoom In → ${Math.round(canvas.getZoom() * 100)}%`);
}

function zoomOut() {
  const cx = canvas.getWidth() / 2;
  const cy = canvas.getHeight() / 2;
  applyZoom(canvas.getZoom() / 1.2, cx, cy);
  log(`Zoom Out → ${Math.round(canvas.getZoom() * 100)}%`);
}

function snapObjectToGrid(obj) {
  if (!obj || isGridObject(obj) || !els.snapToggle.checked) {
    return;
  }

  obj.set({
    left: Math.round((obj.left || 0) / GRID_SIZE) * GRID_SIZE,
    top: Math.round((obj.top || 0) / GRID_SIZE) * GRID_SIZE,
  });
  obj.setCoords();
}

canvas.on('mouse:wheel', (opt) => {
  // Only zoom when Ctrl is held; otherwise let the page scroll normally
  if (!opt.e.ctrlKey) return;

  const delta = opt.e.deltaY;
  let zoom = canvas.getZoom();

  zoom *= 0.999 ** delta;
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));

  canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
  clampPan();
  opt.e.preventDefault();
  opt.e.stopPropagation();

  const scenePoint = canvas.getScenePoint(opt.e);
  updateMetrics(scenePoint);
});

canvas.on('mouse:down', (opt) => {
  if (opt.e.altKey) {
    isPanning = true;
    lastPosX = opt.e.clientX;
    lastPosY = opt.e.clientY;
    canvas.selection = false;
  }
});

canvas.on('mouse:move', (opt) => {
  const scenePoint = canvas.getScenePoint(opt.e);
  updateMetrics(scenePoint);

  if (!isPanning) {
    return;
  }

  const vpt = canvas.viewportTransform;
  vpt[4] += opt.e.clientX - lastPosX;
  vpt[5] += opt.e.clientY - lastPosY;

  clampPan();

  lastPosX = opt.e.clientX;
  lastPosY = opt.e.clientY;

  canvas.requestRenderAll();
});

canvas.on('mouse:up', () => {
  if (isPanning) {
    canvas.setViewportTransform(canvas.viewportTransform);
    isPanning = false;
    canvas.selection = true;
    log('Đã pan viewport.');
  }
});

canvas.on('object:moving', (e) => {
  const target = e.target;
  snapObjectToGrid(target);
});

canvas.on('object:rotating', (e) => {
  if (!els.snapAngleToggle.checked) return;
  const target = e.target;
  if (!target || isGridObject(target)) return;
  target.set({ angle: Math.round(target.angle / SNAP_ANGLE) * SNAP_ANGLE });
});

canvas.on('object:modified', (e) => {
  const target = e.target;
  snapObjectToGrid(target);
  if (target) {
    log(`Đã đặt ${target.name || target.type} vào lưới.`);
  }
});

els.addRectBtn.addEventListener('click', addRect);
els.addCircleBtn.addEventListener('click', addCircle);
els.zoomInBtn.addEventListener('click', zoomIn);
els.zoomOutBtn.addEventListener('click', zoomOut);
els.resetViewBtn.addEventListener('click', resetView);
els.snapToggle.addEventListener('change', () => {
  log(els.snapToggle.checked ? 'Đã bật snap to grid.' : 'Đã tắt snap to grid.');
});
els.snapAngleToggle.addEventListener('change', () => {
  log(els.snapAngleToggle.checked ? 'Đã bật snap angle 15°.' : 'Đã tắt snap angle.');
});

initScene();