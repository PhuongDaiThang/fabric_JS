import {
  Canvas,
  StaticCanvas,
  Circle,
  Rect,
  Group,
  FabricText,
  FabricImage,
} from 'fabric';

function loadDemoImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="260" height="150" viewBox="0 0 260 150">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="55%" stop-color="#1d4ed8" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="260" height="150" rx="24" fill="url(#sky)" />
      <circle cx="205" cy="42" r="21" fill="#facc15" opacity="0.95" />
      <path d="M0 104C26 88 51 82 76 88C104 94 121 110 149 111C181 114 211 96 237 78C244 73 252 70 260 68V150H0Z" fill="#bfdbfe" />
      <path d="M0 120C32 112 62 116 92 128C118 138 146 142 176 138C204 134 232 124 260 112V150H0Z" fill="#10b981" />
      <path d="M10 150L84 58L141 150Z" fill="#0f172a" />
      <path d="M84 150L158 78L220 150Z" fill="#1e293b" />
      <text x="24" y="34" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">
        SVG Landscape
      </text>
      <text x="24" y="54" font-size="12" font-family="Arial, sans-serif" fill="#dbeafe">
        Demo image moi cho bai 2
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

function createCircle({ left, top, fill, stroke }) {
  return new Circle({
    left,
    top,
    radius: 44,
    fill,
    stroke,
    strokeWidth: 3,
  });
}

function createLabelGroup({ left, top, label, fill, stroke }) {
  const rect = new Rect({
    left: 0,
    top: 0,
    width: 190,
    height: 70,
    rx: 16,
    ry: 16,
    fill,
    stroke,
    strokeWidth: 2,
  });

  const text = new FabricText(label, {
    left: 24,
    top: 21,
    fontSize: 24,
    fontWeight: '700',
    fill: '#ffffff',
  });

  return new Group([rect, text], {
    left,
    top,
  });
}

function createInfoGroup({
  left,
  top,
  title,
  subtitle,
  fill,
  stroke,
  titleColor,
  subtitleColor,
}) {
  const panel = new Rect({
    left: 0,
    top: 0,
    width: 230,
    height: 92,
    rx: 16,
    ry: 16,
    fill,
    stroke,
    strokeWidth: 2,
  });

  const titleText = new FabricText(title, {
    left: 18,
    top: 18,
    fontSize: 22,
    fontWeight: '700',
    fill: titleColor,
  });

  const subtitleText = new FabricText(subtitle, {
    left: 18,
    top: 56,
    fontSize: 15,
    fill: subtitleColor,
  });

  return new Group([panel, titleText, subtitleText], {
    left,
    top,
  });
}

function createDemoImage(imgEl, { left, top, angle = 0 }) {
  return new FabricImage(imgEl, {
    left,
    top,
    scaleX: 0.84,
    scaleY: 0.84,
    angle,
  });
}

async function main() {
  const interactive = new Canvas('interactiveCanvas', {
    backgroundColor: '#ffffff',
  });

  const staticCanvas = new StaticCanvas('staticCanvas', {
    backgroundColor: '#ffffff',
  });

  const imgEl = await loadDemoImage();

  const interactiveCircle = createCircle({
    left: 56,
    top: 54,
    fill: '#14b8a6',
    stroke: '#0f766e',
  });

  const interactiveLabelGroup = createLabelGroup({
    left: 188,
    top: 42,
    label: 'Interactive',
    fill: '#8b5cf6',
    stroke: '#6d28d9',
  });

  const interactiveInfoGroup = createInfoGroup({
    left: 26,
    top: 176,
    title: 'Fabric Group',
    subtitle: 'Rect + 2 dong text',
    fill: '#fee2e2',
    stroke: '#ef4444',
    titleColor: '#991b1b',
    subtitleColor: '#7f1d1d',
  });

  const interactiveImage = createDemoImage(imgEl, {
    left: 300,
    top: 162,
    angle: -4,
  });

  interactive.add(
    interactiveCircle,
    interactiveLabelGroup,
    interactiveInfoGroup,
    interactiveImage,
  );
  interactive.setActiveObject(interactiveCircle);
  interactive.requestRenderAll();

  interactive.on('selection:created', () => {
    console.log('Da chon object');
  });

  interactive.on('object:modified', (e) => {
    if (!e.target) return;
    console.log('Da thay doi object:', e.target.type);
  });

  const staticCircle = createCircle({
    left: 56,
    top: 54,
    fill: '#f59e0b',
    stroke: '#b45309',
  });

  const staticLabelGroup = createLabelGroup({
    left: 188,
    top: 42,
    label: 'StaticCanvas',
    fill: '#06b6d4',
    stroke: '#0e7490',
  });

  const staticInfoGroup = createInfoGroup({
    left: 26,
    top: 176,
    title: 'Chi de render',
    subtitle: 'Khong keo tha truc tiep',
    fill: '#dcfce7',
    stroke: '#22c55e',
    titleColor: '#166534',
    subtitleColor: '#15803d',
  });

  const staticImage = createDemoImage(imgEl, {
    left: 300,
    top: 162,
  });

  staticCanvas.add(
    staticCircle,
    staticLabelGroup,
    staticInfoGroup,
    staticImage,
  );
  staticCanvas.renderAll();
}

main().catch((err) => {
  console.error('Loi khi khoi tao bai 2:', err);
});
