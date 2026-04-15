import { Canvas, Circle, FabricText, Group, Rect } from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
});

const STORAGE_KEY = 'fabric_lesson_5_editor';

const els = {
  status: document.getElementById('status'),
  jsonOutput: document.getElementById('jsonOutput'),

  addRectBtn: document.getElementById('addRectBtn'),
  addCircleBtn: document.getElementById('addCircleBtn'),
  duplicateBtn: document.getElementById('duplicateBtn'),
  deleteBtn: document.getElementById('deleteBtn'),
  bringFrontBtn: document.getElementById('bringFrontBtn'),
  sendBackBtn: document.getElementById('sendBackBtn'),
  bringForwardBtn: document.getElementById('bringForwardBtn'),
  sendBackwardBtn: document.getElementById('sendBackwardBtn'),
  saveBtn: document.getElementById('saveBtn'),
  loadBtn: document.getElementById('loadBtn'),
  resetBtn: document.getElementById('resetBtn'),
  undoBtn: document.getElementById('undoBtn'),
  redoBtn: document.getElementById('redoBtn'),
  exportPngBtn: document.getElementById('exportPngBtn'),
  lockBtn: document.getElementById('lockBtn'),
  layerList: document.getElementById('layerList'),

  nameInput: document.getElementById('nameInput'),
  xInput: document.getElementById('xInput'),
  yInput: document.getElementById('yInput'),
  angleInput: document.getElementById('angleInput'),
  fillInput: document.getElementById('fillInput'),
  strokeInput: document.getElementById('strokeInput'),
  applyPropsBtn: document.getElementById('applyPropsBtn'),
  syncBtn: document.getElementById('syncBtn'),
};

let rectCount = 0;
let circleCount = 0;

// ---- History (Undo / Redo) ----
const history = [];
let historyIndex = -1;
let historyLock = false;

function saveHistory() {
  if (historyLock) return;
  const json = JSON.stringify(canvas.toObject(['name', 'lockMovementX', 'lockMovementY', 'lockRotation', 'lockScalingX', 'lockScalingY', 'selectable', 'evented']));
  // Trim future states
  history.length = historyIndex + 1;
  history.push(json);
  historyIndex = history.length - 1;
}

async function restoreHistory(index) {
  if (index < 0 || index >= history.length) return;
  historyIndex = index;
  historyLock = true;
  try {
    await canvas.loadFromJSON(history[historyIndex]);
    canvas.requestRenderAll();
    syncPropertyPanelFromSelection();
    renderLayerList();
  } finally {
    historyLock = false;
  }
}

function undo() {
  if (historyIndex <= 0) {
    log('Không có gì để undo.');
    return;
  }
  restoreHistory(historyIndex - 1);
  log('Undo.');
}

function redo() {
  if (historyIndex >= history.length - 1) {
    log('Không có gì để redo.');
    return;
  }
  restoreHistory(historyIndex + 1);
  log('Redo.');
}

// ---- Layer list ----
function renderLayerList() {
  const objects = canvas.getObjects();
  const active = getActiveObject();
  els.layerList.innerHTML = '';

  // Render top-down (last object = top layer)
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    const div = document.createElement('div');
    div.className = 'layer-item' + (obj === active ? ' active' : '');

    const label = getObjectLabel(obj);
    const locked = !obj.selectable;
    div.innerHTML = `<span>${i}: ${label}${locked ? '<span class="lock-badge">🔒</span>' : ''}</span><span style="color:#94a3b8">${obj.type}</span>`;

    div.addEventListener('click', () => {
      if (!obj.selectable) {
        log(`${label} đang bị lock.`);
        return;
      }
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncPropertyPanelFromSelection();
      renderLayerList();
    });

    els.layerList.appendChild(div);
  }
}

// ---- Export PNG ----
function exportPng() {
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = 'fabric-scene.png';
  link.click();
  log('Đã export PNG.');
}

// ---- Lock / Unlock ----
function toggleLock() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  const isLocked = !active.selectable;
  active.set({
    selectable: isLocked,
    evented: isLocked,
    lockMovementX: !isLocked,
    lockMovementY: !isLocked,
    lockRotation: !isLocked,
    lockScalingX: !isLocked,
    lockScalingY: !isLocked,
  });

  if (!isLocked) {
    canvas.discardActiveObject();
  }

  canvas.requestRenderAll();
  renderLayerList();
  saveHistory();
  log(`${getObjectLabel(active)} → ${isLocked ? 'Unlocked' : 'Locked'}`);
  els.lockBtn.textContent = isLocked ? '🔒 Lock' : '🔒 Lock';
}

function log(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  els.status.textContent = `[${time}] ${message}\n` + els.status.textContent;
}

function getActiveObject() {
  return canvas.getActiveObject();
}

function getObjectLabel(obj) {
  return obj?.name || obj?.type || 'unknown';
}

function objectToSerializableJson() {
  return JSON.stringify(canvas.toObject(['name']), null, 2);
}

function saveSceneToTextareaAndStorage() {
  const json = objectToSerializableJson();
  els.jsonOutput.value = json;
  localStorage.setItem(STORAGE_KEY, json);
  log('Đã save scene vào textarea và localStorage.');
}

function clearPropertyPanel() {
  els.nameInput.value = '';
  els.xInput.value = '';
  els.yInput.value = '';
  els.angleInput.value = '';
}

function syncPropertyPanelFromSelection() {
  const active = getActiveObject();

  if (!active) {
    clearPropertyPanel();
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
}

function makeStarterScene() {
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
    left: 360,
    top: 100,
    radius: 54,
    fill: '#f97316',
    stroke: '#c2410c',
    strokeWidth: 3,
    name: 'OrangeCircle',
  });

  const cardBg = new Rect({
    left: 0,
    top: 0,
    width: 250,
    height: 94,
    rx: 16,
    ry: 16,
    fill: '#10b981',
    stroke: '#047857',
    strokeWidth: 2,
  });

  const title = new FabricText('Mini Editor', {
    left: 18,
    top: 18,
    fontSize: 24,
    fontWeight: '700',
    fill: '#ffffff',
  });

  const sub = new FabricText('Save / Load / Property Panel', {
    left: 18,
    top: 54,
    fontSize: 15,
    fill: '#ecfdf5',
  });

  const group = new Group([cardBg, title, sub], {
    left: 190,
    top: 290,
    name: 'InfoCard',
  });

  canvas.add(rect, circle, group);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
  syncPropertyPanelFromSelection();
  renderLayerList();
  saveHistory();
  log('Đã tạo scene ban đầu.');
}

function addRect() {
  rectCount += 1;

  const rect = new Rect({
    left: 60 + Math.random() * 450,
    top: 60 + Math.random() * 280,
    width: 110 + Math.random() * 70,
    height: 70 + Math.random() * 50,
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
  syncPropertyPanelFromSelection();
  renderLayerList();
  saveHistory();
  log(`Đã thêm ${rect.name}`);
}

function addCircle() {
  circleCount += 1;

  const circle = new Circle({
    left: 80 + Math.random() * 450,
    top: 80 + Math.random() * 260,
    radius: 36 + Math.random() * 24,
    fill: '#f472b6',
    stroke: '#be185d',
    strokeWidth: 2,
    name: `Circle_${circleCount}`,
  });

  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.requestRenderAll();
  syncPropertyPanelFromSelection();
  renderLayerList();
  saveHistory();
  log(`Đã thêm ${circle.name}`);
}

async function duplicateActiveObject() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  const clone = await active.clone(['name']);
  clone.set({
    left: (active.left || 0) + 24,
    top: (active.top || 0) + 24,
    name: `${getObjectLabel(active)}_copy`,
  });
  clone.setCoords();

  canvas.add(clone);
  canvas.setActiveObject(clone);
  canvas.requestRenderAll();
  syncPropertyPanelFromSelection();
  renderLayerList();
  saveHistory();
  log(`Đã duplicate ${getObjectLabel(active)}`);
}

function deleteActiveObject() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  const label = getObjectLabel(active);
  canvas.remove(active);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  syncPropertyPanelFromSelection();
  renderLayerList();
  saveHistory();
  log(`Đã xóa ${label}`);
}

function bringFront() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  canvas.bringObjectToFront(active);
  canvas.setActiveObject(active);
  canvas.requestRenderAll();
  renderLayerList();
  saveHistory();
  log(`Đã đưa ${getObjectLabel(active)} lên trên cùng.`);
}

function sendBack() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  canvas.sendObjectToBack(active);
  canvas.setActiveObject(active);
  canvas.requestRenderAll();
  renderLayerList();
  saveHistory();
  log(`Đã đưa ${getObjectLabel(active)} xuống dưới cùng.`);
}

function bringForward() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  canvas.bringObjectForward(active);
  canvas.setActiveObject(active);
  canvas.requestRenderAll();
  renderLayerList();
  saveHistory();
  log(`Đã đưa ${getObjectLabel(active)} lên 1 bậc.`);
}

function sendBackward() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  canvas.sendObjectBackwards(active);
  canvas.setActiveObject(active);
  canvas.requestRenderAll();
  renderLayerList();
  saveHistory();
  log(`Đã đưa ${getObjectLabel(active)} xuống 1 bậc.`);
}

function applyPropertiesFromPanel() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  active.set({
    name: els.nameInput.value.trim() || active.name || active.type,
    left: Number(els.xInput.value || 0),
    top: Number(els.yInput.value || 0),
    angle: Number(els.angleInput.value || 0),
    fill: els.fillInput.value,
    stroke: els.strokeInput.value,
    strokeWidth: active.strokeWidth || 2,
  });

  active.setCoords();
  canvas.requestRenderAll();
  renderLayerList();
  saveHistory();
  log(`Đã apply properties cho ${getObjectLabel(active)}.`);
}

async function loadSceneFromTextareaOrStorage() {
  const raw = els.jsonOutput.value.trim() || localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    log('Chưa có JSON để load.');
    return;
  }

  try {
    await canvas.loadFromJSON(raw);
    canvas.requestRenderAll();
    syncPropertyPanelFromSelection();
    renderLayerList();
    saveHistory();
    log('Đã load scene từ JSON.');
  } catch (error) {
    console.error(error);
    log('JSON không hợp lệ hoặc load thất bại.');
  }
}

function resetScene() {
  localStorage.removeItem(STORAGE_KEY);
  els.jsonOutput.value = '';
  makeStarterScene();
}

canvas.on('selection:created', () => {
  syncPropertyPanelFromSelection();
  renderLayerList();
});

canvas.on('selection:updated', () => {
  syncPropertyPanelFromSelection();
  renderLayerList();
});

canvas.on('selection:cleared', () => {
  syncPropertyPanelFromSelection();
  renderLayerList();
});

canvas.on('object:modified', () => {
  syncPropertyPanelFromSelection();
  renderLayerList();
  saveHistory();
});

els.addRectBtn.addEventListener('click', addRect);
els.addCircleBtn.addEventListener('click', addCircle);
els.duplicateBtn.addEventListener('click', duplicateActiveObject);
els.deleteBtn.addEventListener('click', deleteActiveObject);
els.lockBtn.addEventListener('click', toggleLock);
els.bringFrontBtn.addEventListener('click', bringFront);
els.sendBackBtn.addEventListener('click', sendBack);
els.bringForwardBtn.addEventListener('click', bringForward);
els.sendBackwardBtn.addEventListener('click', sendBackward);
els.undoBtn.addEventListener('click', undo);
els.redoBtn.addEventListener('click', redo);
els.exportPngBtn.addEventListener('click', exportPng);
els.applyPropsBtn.addEventListener('click', applyPropertiesFromPanel);
els.syncBtn.addEventListener('click', syncPropertyPanelFromSelection);
els.saveBtn.addEventListener('click', saveSceneToTextareaAndStorage);
els.loadBtn.addEventListener('click', loadSceneFromTextareaOrStorage);
els.resetBtn.addEventListener('click', resetScene);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
});

const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  els.jsonOutput.value = saved;
  canvas.loadFromJSON(saved).then(() => {
    canvas.requestRenderAll();
    syncPropertyPanelFromSelection();
    renderLayerList();
    saveHistory();
    log('Đã khôi phục scene từ localStorage.');
  });
} else {
  makeStarterScene();
}