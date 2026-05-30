const { createCanvas } = require('@napi-rs/canvas');
const { GIFEncoder, quantize, applyPalette } = require('gifenc');

const WIDTH = 900;
const HEIGHT = 900;
const CENTER = 450;
const RADIUS = 310;
const SEGMENT_COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#0ea5e9', '#eab308'];
const SEGMENTS = [
    { icon: '\u{1F340}', label: 'SMALL' },
    { icon: '\u26A1', label: 'BOOST' },
    { icon: '\u{1F48E}', label: 'BIG' },
    { icon: '\u{1F451}', label: 'JACKPOT' },
    { icon: '\u274C', label: 'MISS' },
    { icon: '\u{1F381}', label: 'BONUS' }
];

function frameToIndexed(ctx, width, height) {
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const palette = quantize(rgba, 256);
    const index = applyPalette(rgba, palette);
    return { palette, index };
}

function buildGifFromFrames(width, height, frameDrawers, delay) {
    const gif = GIFEncoder();
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    frameDrawers.forEach((draw, index) => {
        draw(ctx);
        const { palette, index: indexedPixels } = frameToIndexed(ctx, width, height);
        gif.writeFrame(indexedPixels, width, height, {
            palette,
            delay,
            repeat: index === 0 ? 0 : undefined
        });
    });

    gif.finish();
    return Buffer.from(gif.bytes());
}

function drawBackground(ctx, width, height) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, width, height);
}

function drawPointer(ctx) {
    ctx.beginPath();
    ctx.moveTo(CENTER, 70);
    ctx.lineTo(CENTER - 32, 150);
    ctx.lineTo(CENTER + 32, 150);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
}

function drawWheelBase(ctx, rotation, title, selectedLabel, rewardText, modeLabel) {
    drawBackground(ctx, WIDTH, HEIGHT);

    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS + 28, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();

    const anglePerSegment = (Math.PI * 2) / SEGMENTS.length;
    for (let index = 0; index < SEGMENTS.length; index += 1) {
        const start = -Math.PI / 2 + rotation + index * anglePerSegment;
        const end = start + anglePerSegment;

        ctx.beginPath();
        ctx.moveTo(CENTER, CENTER);
        ctx.arc(CENTER, CENTER, RADIUS, start, end);
        ctx.closePath();
        ctx.fillStyle = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
        ctx.fill();

        ctx.save();
        ctx.translate(CENTER, CENTER);
        ctx.rotate(start + anglePerSegment / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(SEGMENTS[index].icon, RADIUS - 120, -12);
        ctx.font = 'bold 24px Arial';
        ctx.fillText(SEGMENTS[index].label, RADIUS - 120, 28);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 95, 0, Math.PI * 2);
    ctx.fillStyle = '#030712';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', CENTER, CENTER + 14);

    drawPointer(ctx);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Arial';
    ctx.fillText(title, CENTER, 825);

    ctx.font = '28px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(modeLabel, CENTER, 860);

    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`RESULT: ${selectedLabel}`, CENTER, 115);

    ctx.font = '26px Arial';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(rewardText, CENTER, 150);
}

function renderWheelGif({ title, selectedLabel, rewardText, modeLabel }) {
    const anglePerSegment = (Math.PI * 2) / SEGMENTS.length;
    const segmentIndex = Math.max(0, SEGMENTS.findIndex((segment) => segment.label === selectedLabel));
    const targetCenterAngle = -Math.PI / 2 + (segmentIndex * anglePerSegment) + anglePerSegment / 2;
    const finalRotation = -targetCenterAngle;
    const totalRotation = finalRotation + Math.PI * 6.5;
    const frames = [];

    for (let frame = 0; frame < 26; frame += 1) {
        const progress = frame / 25;
        const eased = 1 - ((1 - progress) ** 3);
        const rotation = totalRotation * eased;
        frames.push((ctx) => drawWheelBase(ctx, rotation, title, selectedLabel, rewardText, modeLabel));
    }

    for (let hold = 0; hold < 6; hold += 1) {
        frames.push((ctx) => drawWheelBase(ctx, totalRotation, title, selectedLabel, rewardText, modeLabel));
    }

    return buildGifFromFrames(WIDTH, HEIGHT, frames, 55);
}

function drawCoinFrame(ctx, width, height, scaleX, face, choice, rewardText) {
    drawBackground(ctx, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COINFLIP ARENA', width / 2, 56);

    ctx.save();
    ctx.translate(width / 2, 205);
    ctx.scale(scaleX, 1);
    ctx.beginPath();
    ctx.arc(0, 0, 92, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fef3c7';
    ctx.stroke();
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 42px Arial';
    ctx.fillText(face === 'HEADS' ? '\u{1FA99}' : '\u{1F4BF}', 0, 12);
    ctx.restore();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '28px Arial';
    ctx.fillText(`Pilihan: ${choice.toUpperCase()}`, width / 2, 320);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(rewardText, width / 2, 362);
}

function renderCoinflipGif({ result, choice, rewardText }) {
    const width = 700;
    const height = 420;
    const frames = [];

    for (let frame = 0; frame < 22; frame += 1) {
        const progress = frame / 21;
        const spin = Math.sin(progress * Math.PI * 8);
        const scaleX = Math.max(0.08, Math.abs(spin));
        const face = frame < 18 ? (frame % 2 === 0 ? 'HEADS' : 'TAILS') : result.toUpperCase();
        frames.push((ctx) => drawCoinFrame(ctx, width, height, scaleX, face, choice, rewardText));
    }

    return buildGifFromFrames(width, height, frames, 60);
}

module.exports = {
    renderWheelGif,
    renderCoinflipGif
};
