/* ======================
   ELEMENTOS
====================== */
const bo = document.querySelector('.bo');
const tg = document.querySelector('.tg');
const scoreElement = document.querySelector('.score');
const scare = document.getElementById('jumpscare');

/* ======================
   ESTADO DO JOGO
====================== */
let jogoAtivo = true;
let musicaIniciada = false;
let jumpScareAtivado = false;

/* ======================
   ÁUDIO NORMAL
====================== */
const musica = new Audio('./audios/musica de fundo.mp3');
musica.loop = true;
musica.volume = 0.5;

/* ======================
   WEB AUDIO (SOM PODRE)
====================== */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let scareBuffer = null;
let preScareBuffer = null;

fetch('./audios/jumpscare.mp3')
    .then(r => r.arrayBuffer())
    .then(b => audioCtx.decodeAudioData(b))
    .then(buf => scareBuffer = buf);

fetch('./audios/i-see-you.mp3')
    .then(r => r.arrayBuffer())
    .then(b => audioCtx.decodeAudioData(b))
    .then(buf => preScareBuffer = buf);

/* ======================
   SCORE
====================== */
let score = 0;
const scoreInterval = setInterval(() => {
    if (!jogoAtivo) return;
    score++;
    scoreElement.innerText = `Score: ${score}`;
    if (score >= 15 && !jumpScareAtivado) {
        jumpScareAtivado = true;
        jogoAtivo = false;
        jumpScareFinal();
    }
}, 1000);

/* ======================
   PULO
====================== */
const jump = () => {
    if (!jogoAtivo) return;
    if (!musicaIniciada) { musica.play(); musicaIniciada = true; }
    if (!bo.classList.contains('jump')) {
        bo.classList.add('jump');
        setTimeout(() => bo.classList.remove('jump'), 1000);
    }
};
document.addEventListener('keydown', jump);

/* ======================
   LOOP PRINCIPAL
====================== */
const loop = setInterval(() => {
    if (!jogoAtivo) return;
    const tgPosition = tg.offsetLeft;
    const boPosition = +window.getComputedStyle(bo).bottom.replace('px', '');
    if (tgPosition <= 140 && tgPosition > 0 && boPosition < 300) {
        gameOver();
    }
}, 10);

/* ======================
   GAME OVER
====================== */
function gameOver() {
    jogoAtivo = false;
    tg.style.animation = 'none';
    tg.style.display = 'none';
    bo.style.animation = 'none';
    bo.src = './issets/morri.png';
    bo.style.width = '100px';
    musica.pause();
    musica.currentTime = 0;
    clearInterval(loop);
    clearInterval(scoreInterval);
    alert('BOOM MORREU ACABOU');
}

/* ======================
   JUMPSCARE FINAL
====================== */
function jumpScareFinal() {
    clearInterval(loop);
    clearInterval(scoreInterval);
    musica.pause();
    musica.currentTime = 0;
    document.removeEventListener('keydown', jump);

    scare.style.transition = 'none';
    scare.style.transform = 'translate(-50%, -50%) scaleX(0.1) scaleY(0)';
    scare.offsetHeight;
    scare.style.transform = 'translate(-50%, -50%) scaleX(2.2) scaleY(1)';

    audioCtx.resume();
    playLowQuality(preScareBuffer);
    setTimeout(() => playLowQuality(scareBuffer), 450);

    document.body.style.animation = 'violentShake 0.35s';
    alert('I CAN ACTULLY SEE YOU');
}

/* ======================
   SOM LOW QUALITY
====================== */
function playLowQuality(buffer) {
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const distortion = audioCtx.createWaveShaper();
    distortion.curve = makeDistortionCurve(900);
    distortion.oversample = 'none';

    const gain = audioCtx.createGain();
    gain.gain.value = 3.8;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1100;

    source.connect(distortion);
    distortion.connect(gain);
    gain.connect(lowpass);
    lowpass.connect(audioCtx.destination);

    source.start(0);
}

function makeDistortionCurve(amount) {
    const k = amount;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}
