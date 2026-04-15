import {
    Canvas,
    Circle,
    FabricText,
    Group,
    Rect,
} from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
});

const jsonOutput = document.getElementById('jsonOutput');
const logEl = document.getElementById('log');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const resetBtn = document.getElementById('resetBtn');
const addRectBtn = document.getElementById('addRectBtn');
const selectedInfo = document.getElementById('selectedInfo');

const STORAGE_KEY = 'fabric_bai3_json';

function log(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  logEl.textContent = `[${time}] ${message}\n` + logEl.textContent;
}

function getObjectName(obj) {
  return obj?.name || obj?.type || 'unknown';
}

function updateSelectedInfo(obj) {
  selectedInfo.textContent = obj
    ? `Đang chọn: ${getObjectName(obj)}`
    : 'Chưa chọn object nào';
}

function autoSaveToStorage() {
  const json = JSON.stringify(canvas.toJSON(['name']));
  localStorage.setItem(STORAGE_KEY, json);
  log('Auto-save JSON vào localStorage.');
}

let rectCounter = 0;

function attachObjectEvents(obj) {
  obj.on('selected', () => {
    log(`${getObjectName(obj)} đã được chọn (object event)`);
  });
  obj.on('deselected', () => {
    log(`${getObjectName(obj)} đã bỏ chọn (object event)`);
  });
}

function createInitialScene() {
  canvas.clear();
  canvas.backgroundColor = '#ffffff';

  const rect = new Rect({
    left: 80,
    top: 80,
    width: 170,
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
    top: 80,
    radius: 56,
    fill: '#f97316',
    stroke: '#c2410c',
    strokeWidth: 3,
    name: 'OrangeCircle',
  });

  const cardRect = new Rect({
    left: 0,
    top: 0,
    width: 220,
    height: 90,
    rx: 16,
    ry: 16,
    fill: '#10b981',
    stroke: '#047857',
    strokeWidth: 2,
  });

  const title = new FabricText('Fabric Events', {
    left: 18,
    top: 18,
    fontSize: 24,
    fontWeight: '700',
    fill: '#ffffff',
  });

  const subtitle = new FabricText('Select / Move / Save JSON', {
    left: 18,
    top: 54,
    fontSize: 15,
    fill: '#ecfdf5',
  });

  const cardGroup = new Group([cardRect, title, subtitle], {
    left: 180,
    top: 250,
    name: 'InfoCard',
  });

  attachObjectEvents(rect);
  attachObjectEvents(circle);
  attachObjectEvents(cardGroup);

  canvas.add(rect, circle, cardGroup);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();

  log('Scene ban đầu đã được tạo.');
}

canvas.on('selection:created', (e) => {
  const target = e.selected?.[0];
  if (!target) return;
  updateSelectedInfo(target);
  log(`selection:created -> ${getObjectName(target)}`);
});

canvas.on('selection:updated', (e) => {
  const target = e.selected?.[0];
  if (!target) return;
  updateSelectedInfo(target);
  log(`selection:updated -> ${getObjectName(target)}`);
});

canvas.on('selection:cleared', () => {
  updateSelectedInfo(null);
  log('selection:cleared');
});

canvas.on('object:modified', (e) => {
  if (!e.target) return;
  log(`object:modified -> ${getObjectName(e.target)}`);
  autoSaveToStorage();
});

canvas.on('mouse:down', (e) => {
  if (e.target) {
    log(`mouse:down trên object -> ${e.target.type}`);
  } else {
    log('mouse:down trên vùng trống');
  }
});

saveBtn.addEventListener('click', () => {
  const json = JSON.stringify(canvas.toJSON(['name']), null, 2);
  jsonOutput.value = json;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvas.toJSON(['name'])));
  log('Đã save JSON từ canvas.');
});

loadBtn.addEventListener('click', async () => {
  const raw = jsonOutput.value.trim() || localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    log('Chưa có JSON để load.');
    return;
  }

  try {
    await canvas.loadFromJSON(raw);
    canvas.getObjects().forEach((obj) => attachObjectEvents(obj));
    canvas.requestRenderAll();
    log('Đã load lại scene từ JSON.');
  } catch (error) {
    console.error(error);
    log('JSON không hợp lệ hoặc load thất bại.');
  }
});

addRectBtn.addEventListener('click', () => {
  rectCounter++;
  const colors = ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#fb923c'];
  const fill = colors[rectCounter % colors.length];
  const newRect = new Rect({
    left: 60 + Math.random() * 400,
    top: 60 + Math.random() * 300,
    width: 100 + Math.random() * 80,
    height: 60 + Math.random() * 60,
    rx: 12,
    ry: 12,
    fill,
    stroke: '#334155',
    strokeWidth: 2,
    name: `Rect_${rectCounter}`,
  });

  attachObjectEvents(newRect);
  canvas.add(newRect);
  canvas.setActiveObject(newRect);
  canvas.requestRenderAll();
  autoSaveToStorage();
  log(`Đã thêm ${newRect.name}`);
});

resetBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  createInitialScene();
});

// Khởi tạo: load từ localStorage nếu có, không thì tạo scene mới
const saved = localStorage.getItem(STORAGE_KEY);
if (saved) {
  canvas.loadFromJSON(saved).then(() => {
    canvas.getObjects().forEach((obj) => attachObjectEvents(obj));
    canvas.requestRenderAll();
    log('Đã khôi phục scene từ localStorage.');
  });
} else {
  createInitialScene();
}