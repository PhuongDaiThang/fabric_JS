import {
    Canvas,
    Circle,
    CircleBrush,
    FabricImage,
    FabricText,
    PatternBrush,
    PencilBrush,
    Point,
    Rect,
} from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
  preserveObjectStacking: true,
});

const STORAGE_KEY = 'fabric_capstone_editor_v1';
const SERIALIZE_PROPS = [
  'name',
  'locked',
  'lockMovementX',
  'lockMovementY',
  'lockScalingX',
  'lockScalingY',
  'lockRotation',
  'hasControls',
];

const els = {
  selectModeBtn: document.getElementById('selectModeBtn'),
  drawModeBtn: document.getElementById('drawModeBtn'),

  addRectBtn: document.getElementById('addRectBtn'),
  addCircleBtn: document.getElementById('addCircleBtn'),
  addTextBtn: document.getElementById('addTextBtn'),
  addImageBtn: document.getElementById('addImageBtn'),

  duplicateBtn: document.getElementById('duplicateBtn'),
  deleteBtn: document.getElementById('deleteBtn'),
  lockBtn: document.getElementById('lockBtn'),

  frontBtn: document.getElementById('frontBtn'),
  backBtn: document.getElementById('backBtn'),
  forwardBtn: document.getElementById('forwardBtn'),
  backwardBtn: document.getElementById('backwardBtn'),

  undoBtn: document.getElementById('undoBtn'),
  redoBtn: document.getElementById('redoBtn'),
  saveBtn: document.getElementById('saveBtn'),
  loadBtn: document.getElementById('loadBtn'),
  exportBtn: document.getElementById('exportBtn'),
  resetBtn: document.getElementById('resetBtn'),

  brushType: document.getElementById('brushType'),
  brushColor: document.getElementById('brushColor'),
  brushWidth: document.getElementById('brushWidth'),

  nameInput: document.getElementById('nameInput'),
  xInput: document.getElementById('xInput'),
  yInput: document.getElementById('yInput'),
  angleInput: document.getElementById('angleInput'),
  fillInput: document.getElementById('fillInput'),
  strokeInput: document.getElementById('strokeInput'),
  applyPropsBtn: document.getElementById('applyPropsBtn'),
  syncPropsBtn: document.getElementById('syncPropsBtn'),

  layers: document.getElementById('layers'),
  jsonOutput: document.getElementById('jsonOutput'),
  metrics: document.getElementById('metrics'),
  status: document.getElementById('status'),

  snapGridToggle: document.getElementById('snapGridToggle'),
  snapAngleToggle: document.getElementById('snapAngleToggle'),
  clipCircleBtn: document.getElementById('clipCircleBtn'),
  clipRectBtn: document.getElementById('clipRectBtn'),
  clearClipBtn: document.getElementById('clearClipBtn'),
  shortcutList: document.getElementById('shortcutList'),
  autosaveIndicator: document.getElementById('autosaveIndicator'),
};

let rectCount = 0;
let circleCount = 0;
let textCount = 0;
let history = [];
let historyIndex = -1;
let historyLock = false;

let isPanning = false;
let lastPosX = 0;
let lastPosY = 0;

const GRID_SIZE = 20;
const SNAP_ANGLE = 15;
const AUTOSAVE_INTERVAL = 15000; // 15 seconds

function log(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  els.status.textContent = `[${time}] ${message}\n` + els.status.textContent;
}

function getActiveObject() {
  return canvas.getActiveObject();
}

function getLabel(obj) {
  return obj?.name || obj?.type || 'unknown';
}

function serializeScene() {
  return JSON.stringify(canvas.toObject(SERIALIZE_PROPS), null, 2);
}

function updateMetrics(pointer = new Point(0, 0)) {
  els.metrics.innerHTML = `Zoom: ${Math.round(canvas.getZoom() * 100)}%<br />Scene mouse: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`;
}

function createPatternBrush() {
  const brush = new PatternBrush(canvas);
  brush.getPatternSrc = function () {
    const size = 12;
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
}

function setMode(mode) {
  canvas.isDrawingMode = mode === 'draw';
  createBrush();
  log(`Mode -> ${mode}`);
}

function clearPropertyPanel() {
  els.nameInput.value = '';
  els.xInput.value = '';
  els.yInput.value = '';
  els.angleInput.value = '';
}

function syncPropertyPanel() {
  const active = getActiveObject();

  if (!active) {
    clearPropertyPanel();
    els.lockBtn.textContent = 'Lock';
    return;
  }

  els.nameInput.value = active.name || '';
  els.xInput.value = Math.round(active.left || 0);
  els.yInput.value = Math.round(active.top || 0);
  els.angleInput.value = Math.round(active.angle || 0);

  if (typeof active.fill === 'string' && active.fill.startsWith('#')) {
    els.fillInput.value = active.fill;
  }
  if (typeof active.stroke === 'string' && active.stroke.startsWith('#')) {
    els.strokeInput.value = active.stroke;
  }

  els.lockBtn.textContent = active.locked ? 'Unlock' : 'Lock';
}

function renderLayers() {
  const objects = canvas.getObjects().slice().reverse();
  const active = getActiveObject();
  els.layers.innerHTML = '';

  objects.forEach((obj) => {
    const item = document.createElement('div');
    item.className = 'layer-item';
    if (obj === active) item.classList.add('active');

    const left = document.createElement('div');
    left.textContent = `${getLabel(obj)} (${obj.type})`;

    const right = document.createElement('div');
    right.className = 'badge';
    right.textContent = obj.locked ? 'locked' : 'free';

    item.append(left, right);

    item.addEventListener('click', () => {
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncPropertyPanel();
      renderLayers();
      log(`Đã chọn layer ${getLabel(obj)}`);
    });

    els.layers.appendChild(item);
  });
}

function saveToTextareaAndStorage() {
  const json = serializeScene();
  els.jsonOutput.value = json;
  localStorage.setItem(STORAGE_KEY, json);
}

function pushHistory(reason = 'change') {
  if (historyLock) return;

  const json = serializeScene();
  if (history[historyIndex] === json) return;

  history = history.slice(0, historyIndex + 1);
  history.push(json);
  historyIndex = history.length - 1;

  saveToTextareaAndStorage();
  renderLayers();
  syncPropertyPanel();
  log(`History saved -> ${reason}`);
}

async function loadScene(raw, resetHistory = true) {
  historyLock = true;
  await canvas.loadFromJSON(raw);
  canvas.requestRenderAll();
  historyLock = false;

  if (resetHistory) {
    history = [raw];
    historyIndex = 0;
  }

  renderLayers();
  syncPropertyPanel();
  saveToTextareaAndStorage();
}

async function undo() {
  if (historyIndex <= 0) {
    log('Không còn undo.');
    return;
  }
  historyIndex -= 1;
  await loadScene(history[historyIndex], false);
  log('Undo');
}

async function redo() {
  if (historyIndex >= history.length - 1) {
    log('Không còn redo.');
    return;
  }
  historyIndex += 1;
  await loadScene(history[historyIndex], false);
  log('Redo');
}

function addRect() {
  rectCount += 1;
  const rect = new Rect({
    left: 80 + rectCount * 24,
    top: 80 + rectCount * 18,
    width: 160,
    height: 100,
    rx: 14,
    ry: 14,
    fill: '#60a5fa',
    stroke: '#1d4ed8',
    strokeWidth: 2,
    name: `Rect_${rectCount}`,
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
}

function addCircle() {
  circleCount += 1;
  const circle = new Circle({
    left: 260 + circleCount * 18,
    top: 120 + circleCount * 20,
    radius: 52,
    fill: '#f97316',
    stroke: '#c2410c',
    strokeWidth: 2,
    name: `Circle_${circleCount}`,
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
}

function addText() {
  textCount += 1;
  const text = new FabricText(`Text_${textCount}`, {
    left: 480,
    top: 100 + textCount * 18,
    fontSize: 28,
    fill: '#111827',
    name: `Text_${textCount}`,
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.requestRenderAll();
}

function loadDemoImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="260" height="180" viewBox="0 0 260 180">
      <rect width="260" height="180" rx="20" fill="#dbeafe"/>
      <circle cx="65" cy="60" r="28" fill="#60a5fa"/>
      <rect x="114" y="34" width="94" height="18" rx="9" fill="#1d4ed8"/>
      <rect x="114" y="63" width="74" height="14" rx="7" fill="#93c5fd"/>
      <rect x="24" y="122" width="210" height="22" rx="11" fill="#bfdbfe"/>
      <text x="82" y="136" font-size="15" font-family="Arial" fill="#1e3a8a">Capstone Image</text>
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

async function addImage() {
  try {
    const imgEl = await loadDemoImage();
    const imageObj = new FabricImage(imgEl, {
      left: 330,
      top: 300,
      scaleX: 0.9,
      scaleY: 0.9,
      name: 'DemoImage',
    });
    canvas.add(imageObj);
    canvas.setActiveObject(imageObj);
    canvas.requestRenderAll();
  } catch (error) {
    console.error(error);
    log('Không thể tạo image.');
  }
}

async function duplicateActive() {
  const active = getActiveObject();
  if (!active || active.type === 'activeSelection') {
    log('Chưa có object hợp lệ để duplicate.');
    return;
  }

  const clone = await active.clone();
  clone.set({
    left: (active.left || 0) + 24,
    top: (active.top || 0) + 24,
    name: `${getLabel(active)}_copy`,
  });
  clone.setCoords();

  canvas.add(clone);
  canvas.setActiveObject(clone);
  canvas.requestRenderAll();
}

function deleteActive() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }
  canvas.remove(active);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}

function toggleLock() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  const locked = !active.locked;
  active.set({
    locked,
    lockMovementX: locked,
    lockMovementY: locked,
    lockScalingX: locked,
    lockScalingY: locked,
    lockRotation: locked,
    hasControls: !locked,
  });
  active.setCoords();
  canvas.requestRenderAll();
  syncPropertyPanel();
  renderLayers();
  log(`${getLabel(active)} -> ${locked ? 'locked' : 'unlocked'}`);
}

function bringFront() {
  const active = getActiveObject();
  if (!active) return;
  canvas.bringObjectToFront(active);
  canvas.requestRenderAll();
  renderLayers();
}

function sendBack() {
  const active = getActiveObject();
  if (!active) return;
  canvas.sendObjectToBack(active);
  canvas.requestRenderAll();
  renderLayers();
}

function bringForward() {
  const active = getActiveObject();
  if (!active) return;
  canvas.bringObjectForward(active);
  canvas.requestRenderAll();
  renderLayers();
}

function sendBackward() {
  const active = getActiveObject();
  if (!active) return;
  canvas.sendObjectBackwards(active);
  canvas.requestRenderAll();
  renderLayers();
}

function applyProperties() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  active.set({
    name: els.nameInput.value.trim() || getLabel(active),
    left: Number(els.xInput.value || 0),
    top: Number(els.yInput.value || 0),
    angle: Number(els.angleInput.value || 0),
    fill: els.fillInput.value,
    stroke: els.strokeInput.value,
    strokeWidth: active.strokeWidth || 2,
  });
  active.setCoords();
  canvas.requestRenderAll();
  renderLayers();
  syncPropertyPanel();
}

async function loadFromTextareaOrStorage() {
  const raw = els.jsonOutput.value.trim() || localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    log('Chưa có JSON để load.');
    return;
  }

  try {
    await loadScene(raw, true);
    log('Load JSON thành công.');
  } catch (error) {
    console.error(error);
    log('JSON không hợp lệ.');
  }
}

function exportPng() {
  const url = canvas.toDataURL({
    format: 'png',
    multiplier: 1,
  });

  const a = document.createElement('a');
  a.href = url;
  a.download = 'fabric-capstone.png';
  a.click();
  log('Đã export PNG.');
}

function resetScene() {
  historyLock = true;
  canvas.clear();
  canvas.backgroundColor = '#ffffff';

  const rect = new Rect({
    left: 90,
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
    strokeWidth: 2,
    name: 'OrangeCircle',
  });

  const text = new FabricText('Capstone Editor', {
    left: 520,
    top: 120,
    fontSize: 32,
    fill: '#111827',
    name: 'TitleText',
  });

  canvas.add(rect, circle, text);
  canvas.setActiveObject(rect);
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.setZoom(1);
  canvas.requestRenderAll();

  historyLock = false;
  history = [];
  historyIndex = -1;
  pushHistory('reset');
  log('Reset scene.');
}

canvas.on('selection:created', () => {
  syncPropertyPanel();
  renderLayers();
});

canvas.on('selection:updated', () => {
  syncPropertyPanel();
  renderLayers();
});

canvas.on('selection:cleared', () => {
  syncPropertyPanel();
  renderLayers();
});

canvas.on('object:modified', () => {
  syncPropertyPanel();
  renderLayers();
  pushHistory('object modified');
});

canvas.on('object:added', () => {
  renderLayers();
  syncPropertyPanel();
  pushHistory('object added');
});

canvas.on('object:removed', () => {
  renderLayers();
  syncPropertyPanel();
  pushHistory('object removed');
});

canvas.on('object:moving', (e) => {
  snapObjectToGrid(e.target);
});

canvas.on('object:rotating', (e) => {
  if (!els.snapAngleToggle.checked || !e.target) return;
  e.target.set({ angle: Math.round(e.target.angle / SNAP_ANGLE) * SNAP_ANGLE });
});

canvas.on('path:created', (e) => {
  const path = e.path;
  if (!path) return;
  path.set({
    name: `BrushPath_${Date.now()}`,
  });
  renderLayers();
  pushHistory('path created');
  log('Đã tạo brush path.');
});

// ---- Snap to grid ----
function snapObjectToGrid(obj) {
  if (!obj || !els.snapGridToggle.checked) return;
  obj.set({
    left: Math.round((obj.left || 0) / GRID_SIZE) * GRID_SIZE,
    top: Math.round((obj.top || 0) / GRID_SIZE) * GRID_SIZE,
  });
  obj.setCoords();
}

// ---- Clip / Crop tools ----
function applyCircleClip() {
  const active = getActiveObject();
  if (!active) { log('Chưa chọn object.'); return; }
  const r = Math.max(active.getScaledWidth?.() || 120, active.getScaledHeight?.() || 120) / 2;
  active.clipPath = new Circle({ radius: r, originX: 'center', originY: 'center' });
  canvas.requestRenderAll();
  pushHistory('clip circle');
  log(`Clip circle → ${getLabel(active)}`);
}

function applyRoundedRectClip() {
  const active = getActiveObject();
  if (!active) { log('Chưa chọn object.'); return; }
  const w = active.getScaledWidth?.() || 120;
  const h = active.getScaledHeight?.() || 120;
  active.clipPath = new Rect({ width: w, height: h, rx: 20, ry: 20, originX: 'center', originY: 'center' });
  canvas.requestRenderAll();
  pushHistory('clip rect');
  log(`Clip rounded-rect → ${getLabel(active)}`);
}

function clearClip() {
  const active = getActiveObject();
  if (!active) { log('Chưa chọn object.'); return; }
  active.clipPath = undefined;
  canvas.requestRenderAll();
  pushHistory('clear clip');
  log(`Clear clip → ${getLabel(active)}`);
}

// ---- Custom Shortcut Panel ----
const SHORTCUTS = [
  { key: 'Ctrl+Z', action: 'Undo', fn: undo },
  { key: 'Ctrl+Y', action: 'Redo', fn: redo },
  { key: 'Delete', action: 'Xóa object', fn: deleteActive },
  { key: 'Ctrl+D', action: 'Duplicate', fn: duplicateActive },
  { key: 'Ctrl+S', action: 'Save JSON', fn: () => { saveToTextareaAndStorage(); log('Saved.'); } },
  { key: 'Ctrl+E', action: 'Export PNG', fn: exportPng },
  { key: 'Ctrl+L', action: 'Lock / Unlock', fn: toggleLock },
];

function renderShortcutPanel() {
  els.shortcutList.innerHTML = SHORTCUTS
    .map((s) => `<div><kbd style="background:#e2e8f0;padding:2px 6px;border-radius:4px;">${s.key}</kbd> ${s.action}</div>`)
    .join('');
}

// ---- Autosave ----
function autoSave() {
  if (historyLock) return;
  saveToTextareaAndStorage();
  const time = new Date().toLocaleTimeString('vi-VN');
  els.autosaveIndicator.textContent = `Autosaved ${time}`;
}

canvas.on('mouse:wheel', (opt) => {
  if (!opt.e.ctrlKey) return;

  let zoom = canvas.getZoom();
  zoom *= 0.999 ** opt.e.deltaY;
  zoom = Math.max(0.2, Math.min(4, zoom));

  canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
  opt.e.preventDefault();
  opt.e.stopPropagation();

  updateMetrics(canvas.getScenePoint(opt.e));
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
  updateMetrics(canvas.getScenePoint(opt.e));

  if (!isPanning) return;

  const vpt = canvas.viewportTransform;
  vpt[4] += opt.e.clientX - lastPosX;
  vpt[5] += opt.e.clientY - lastPosY;

  lastPosX = opt.e.clientX;
  lastPosY = opt.e.clientY;
  canvas.requestRenderAll();
});

canvas.on('mouse:up', () => {
  if (isPanning) {
    canvas.setViewportTransform(canvas.viewportTransform);
    isPanning = false;
    canvas.selection = true;
    log('Pan viewport.');
  }
});

els.selectModeBtn.addEventListener('click', () => setMode('select'));
els.drawModeBtn.addEventListener('click', () => setMode('draw'));

els.addRectBtn.addEventListener('click', addRect);
els.addCircleBtn.addEventListener('click', addCircle);
els.addTextBtn.addEventListener('click', addText);
els.addImageBtn.addEventListener('click', addImage);

els.duplicateBtn.addEventListener('click', duplicateActive);
els.deleteBtn.addEventListener('click', deleteActive);
els.lockBtn.addEventListener('click', toggleLock);

els.frontBtn.addEventListener('click', bringFront);
els.backBtn.addEventListener('click', sendBack);
els.forwardBtn.addEventListener('click', bringForward);
els.backwardBtn.addEventListener('click', sendBackward);

els.undoBtn.addEventListener('click', undo);
els.redoBtn.addEventListener('click', redo);
els.saveBtn.addEventListener('click', () => {
  saveToTextareaAndStorage();
  log('Đã save JSON.');
});
els.loadBtn.addEventListener('click', loadFromTextareaOrStorage);
els.exportBtn.addEventListener('click', exportPng);
els.resetBtn.addEventListener('click', resetScene);

els.applyPropsBtn.addEventListener('click', applyProperties);
els.syncPropsBtn.addEventListener('click', syncPropertyPanel);

els.clipCircleBtn.addEventListener('click', applyCircleClip);
els.clipRectBtn.addEventListener('click', applyRoundedRectClip);
els.clearClipBtn.addEventListener('click', clearClip);

els.brushType.addEventListener('change', createBrush);
els.brushColor.addEventListener('input', () => {
  createBrush();
});
els.brushWidth.addEventListener('input', () => {
  if (canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush.width = Number(els.brushWidth.value);
  }
});

window.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();

  // Match shortcuts from table
  if (ctrl && key === 'z') { e.preventDefault(); undo(); return; }
  if (ctrl && key === 'y') { e.preventDefault(); redo(); return; }
  if (ctrl && key === 'd') { e.preventDefault(); duplicateActive(); pushHistory('duplicate'); return; }
  if (ctrl && key === 's') { e.preventDefault(); saveToTextareaAndStorage(); log('Saved.'); return; }
  if (ctrl && key === 'e') { e.preventDefault(); exportPng(); return; }
  if (ctrl && key === 'l') { e.preventDefault(); toggleLock(); return; }
  if (e.key === 'Delete') { deleteActive(); return; }
});

createBrush();
resetScene();
renderShortcutPanel();

// Autosave every 15s
setInterval(autoSave, AUTOSAVE_INTERVAL);

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  els.jsonOutput.value = saved;
}