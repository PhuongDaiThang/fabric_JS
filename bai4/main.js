import { Canvas, Circle, FabricText, Group, Rect } from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
});

const statusEl = document.getElementById('status');
const addRectBtn = document.getElementById('addRectBtn');
const addCircleBtn = document.getElementById('addCircleBtn');
const duplicateBtn = document.getElementById('duplicateBtn');
const applyColorBtn = document.getElementById('applyColorBtn');
const applyStrokeBtn = document.getElementById('applyStrokeBtn');
const bringFrontBtn = document.getElementById('bringFrontBtn');
const sendBackBtn = document.getElementById('sendBackBtn');
const bringForwardBtn = document.getElementById('bringForwardBtn');
const sendBackwardBtn = document.getElementById('sendBackwardBtn');
const deleteBtn = document.getElementById('deleteBtn');
const fillColorInput = document.getElementById('fillColor');
const strokeColorInput = document.getElementById('strokeColor');
const objInfoEl = document.getElementById('objInfo');

let rectCount = 0;
let circleCount = 0;

function log(message) {
  const time = new Date().toLocaleTimeString('vi-VN');
  statusEl.textContent = `[${time}] ${message}\n` + statusEl.textContent;
}

function getActiveObject() {
  return canvas.getActiveObject();
}

function getObjectLabel(obj) {
  return obj?.name || obj?.type || 'unknown';
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
    left: 340,
    top: 100,
    radius: 52,
    fill: '#f97316',
    stroke: '#c2410c',
    strokeWidth: 3,
    name: 'OrangeCircle',
  });

  const cardBg = new Rect({
    left: 0,
    top: 0,
    width: 240,
    height: 92,
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

  const sub = new FabricText('Toolbar + Layer + Color', {
    left: 18,
    top: 54,
    fontSize: 15,
    fill: '#ecfdf5',
  });

  const group = new Group([cardBg, title, sub], {
    left: 180,
    top: 270,
    name: 'InfoCard',
  });

  canvas.add(rect, circle, group);
  canvas.setActiveObject(rect);
  canvas.requestRenderAll();
  log('Đã tạo scene ban đầu.');
}

function addRect() {
  rectCount += 1;

  const rect = new Rect({
    left: 60 + Math.random() * 420,
    top: 60 + Math.random() * 260,
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
  log(`Đã thêm ${rect.name}`);
}

function addCircle() {
  circleCount += 1;

  const circle = new Circle({
    left: 80 + Math.random() * 420,
    top: 80 + Math.random() * 240,
    radius: 35 + Math.random() * 25,
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

function applyColorToActiveObject() {
  const active = getActiveObject();

  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  active.set({
    fill: fillColorInput.value,
  });

  canvas.requestRenderAll();
  log(`Đã đổi màu ${getObjectLabel(active)} -> ${fillColorInput.value}`);
}

function bringActiveToFront() {
  const active = getActiveObject();

  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  canvas.bringObjectToFront(active);
  canvas.setActiveObject(active);
  canvas.requestRenderAll();
  log(`Đã đưa ${getObjectLabel(active)} lên trên cùng.`);
}

function sendActiveToBack() {
  const active = getActiveObject();

  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  canvas.sendObjectToBack(active);
  canvas.setActiveObject(active);
  canvas.requestRenderAll();
  log(`Đã đưa ${getObjectLabel(active)} xuống dưới cùng.`);
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
  updateObjInfo(null);
  log(`Đã xóa ${label}`);
}

function updateObjInfo(obj) {
  if (!obj) {
    objInfoEl.textContent = 'Chưa chọn object nào';
    return;
  }
  const name = obj.name || '(chưa đặt tên)';
  const type = obj.type || 'unknown';
  const fill = obj.fill || 'none';
  objInfoEl.innerHTML =
    `<strong>Name:</strong> ${name}<br>` +
    `<strong>Type:</strong> ${type}<br>` +
    `<strong>Fill:</strong> <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${fill};vertical-align:middle;border:1px solid #94a3b8;"></span> ${fill}`;
}

function duplicateActiveObject() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }

  active.clone().then((cloned) => {
    cloned.set({
      left: (active.left || 0) + 20,
      top: (active.top || 0) + 20,
      name: getObjectLabel(active) + '_copy',
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
    log(`Đã duplicate ${getObjectLabel(active)}`);
  });
}

function applyStrokeToActiveObject() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }
  active.set({ stroke: strokeColorInput.value });
  canvas.requestRenderAll();
  log(`Đã đổi stroke ${getObjectLabel(active)} -> ${strokeColorInput.value}`);
}

function bringActiveForward() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }
  canvas.bringObjectForward(active);
  canvas.requestRenderAll();
  log(`Đã đưa ${getObjectLabel(active)} lên 1 bậc.`);
}

function sendActiveBackward() {
  const active = getActiveObject();
  if (!active) {
    log('Chưa có object nào được chọn.');
    return;
  }
  canvas.sendObjectBackwards(active);
  canvas.requestRenderAll();
  log(`Đã đưa ${getObjectLabel(active)} xuống 1 bậc.`);
}

canvas.on('selection:created', (e) => {
  const target = e.selected?.[0];
  if (!target) return;
  updateObjInfo(target);
  log(`Đang chọn: ${getObjectLabel(target)}`);
});

canvas.on('selection:updated', (e) => {
  const target = e.selected?.[0];
  if (!target) return;
  updateObjInfo(target);
  log(`Đổi selection sang: ${getObjectLabel(target)}`);
});

canvas.on('selection:cleared', () => {
  updateObjInfo(null);
  log('Đã bỏ chọn object.');
});

canvas.on('object:modified', (e) => {
  if (e.target) updateObjInfo(e.target);
});

addRectBtn.addEventListener('click', addRect);
addCircleBtn.addEventListener('click', addCircle);
duplicateBtn.addEventListener('click', duplicateActiveObject);
applyColorBtn.addEventListener('click', applyColorToActiveObject);
applyStrokeBtn.addEventListener('click', applyStrokeToActiveObject);
bringForwardBtn.addEventListener('click', bringActiveForward);
sendBackwardBtn.addEventListener('click', sendActiveBackward);
bringFrontBtn.addEventListener('click', bringActiveToFront);
sendBackBtn.addEventListener('click', sendActiveToBack);
deleteBtn.addEventListener('click', deleteActiveObject);

createStarterScene();