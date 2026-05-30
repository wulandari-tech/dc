const { createCanvas } = require('@napi-rs/canvas');
const GIFEncoder = require('gifencoder');

const WIDTH = 900;
const HEIGHT = 900;
const CENTER = 450;
const RADIUS = 310;
const SEGMENT_COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#0ea5e9', '#eab308'];
const SEGMENTS = [
    { icon: '🍀', label: 'SMALL' },
    { icon: '⚡', label: 'BOOST' },
    { icon: '💎', label: 'BIG' },
    { icon: '👑', label: 'JACKPOT' },
    { icon: '❌', label: 'MISS' },
    { icon: '🎁', label: 'BONUS' }
];

function collectGifBuffer(encoder) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = encoder.createReadStream();
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

function drawBackground(ctx) {
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS + 28, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
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
    drawBackground(ctx);
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

async function renderWheelGif({ title, selectedLabel, rewardText, modeLabel }) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    const encoder = new GIFEncoder(WIDTH, HEIGHT);
    const bufferPromise = collectGifBuffer(encoder);
    const anglePerSegment = (Math.PI * 2) / SEGMENTS.length;
    const segmentIndex = Math.max(0, SEGMENTS.findIndex((segment) => segment.label === selectedLabel));
    const targetCenterAngle = -Math.PI / 2 + (segmentIndex * anglePerSegment) + anglePerSegment / 2;
    const finalRotation = -targetCenterAngle;
    const totalRotation = finalRotation + Math.PI * 6.5;
    const frames = 26;

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(55);
    encoder.setQuality(10);

    for (let frame = 0; frame < frames; frame += 1) {
        const progress = frame / (frames - 1);
        const eased = 1 - ((1 - progress) ** 3);
        const rotation = totalRotation * eased;
        drawWheelBase(ctx, rotation, title, selectedLabel, rewardText, modeLabel);
        encoder.addFrame(ctx);
    }

    for (let hold = 0; hold < 6; hold += 1) {
        drawWheelBase(ctx, totalRotation, title, selectedLabel, rewardText, modeLabel);
        encoder.addFrame(ctx);
    }

    encoder.finish();
    return bufferPromise;
}

async function renderCoinflipGif({ result, choice, rewardText }) {
    const width = 700;
    const height = 420;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const encoder = new GIFEncoder(width, height);
    const bufferPromise = collectGifBuffer(encoder);
    const frames = 22;

    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(60);
    encoder.setQuality(10);

    for (let frame = 0; frame < frames; frame += 1) {
        const progress = frame / (frames - 1);
        const spin = Math.sin(progress * Math.PI * 8);
        const scaleX = Math.max(0.08, Math.abs(spin));
        const face = frame < frames - 4 ? (frame % 2 === 0 ? 'HEADS' : 'TAILS') : result.toUpperCase();
        const faceEmoji = face === 'HEADS' ? '🪙' : '💿';

        ctx.fillStyle = '#08111f';
        ctx.fillRect(0, 0, width, height);

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
        ctx.fillText(faceEmoji, 0, 12);
        ctx.restore();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '28px Arial';
        ctx.fillText(`Pilihan: ${choice.toUpperCase()}`, width / 2, 320);
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(rewardText, width / 2, 362);

        encoder.addFrame(ctx);
    }

    encoder.finish();
    return bufferPromise;
}

module.exports = {
    renderWheelGif,
    renderCoinflipGif
};
