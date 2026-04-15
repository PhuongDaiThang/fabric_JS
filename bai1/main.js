import { Canvas, FabricText, Rect } from 'fabric';

const canvas = new Canvas('c', {
  backgroundColor: '#ffffff',
});

const rect = new Rect({
  left: 120,
  top: 100,
  width: 180,
  height: 110,
  fill: '#f97316',
  rx: 12,
  ry: 12,
  stroke: '#c2410c',
  strokeWidth: 2,
});

const rect2 = new Rect({
  left: 350,
  top: 80,
  width: 140,
  height: 140,
  fill: '#a78bfa',
  rx: 8,
  ry: 8,
  stroke: '#7c3aed',
  strokeWidth: 2,
});

const rect3 = new Rect({
  left: 50,
  top: 300,
  width: 200,
  height: 90,
  fill: '#34d399',
  rx: 10,
  ry: 10,
  stroke: '#059669',
  strokeWidth: 2,
});

const text = new FabricText('Hello Fabric', {
  left: 140,
  top: 250,
  fontSize: 28,
  fill: '#111827',
});

const myName = new FabricText('Falcon Game Studio', {
  left: 300,
  top: 260,
  fontSize: 24,
  fill: '#1e40af',
});

canvas.add(rect, rect2, rect3, text, myName);
canvas.setActiveObject(rect);

canvas.on('object:added', () => {
  console.log('Da them object vao canvas');
});