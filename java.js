/* ======================
   DETECÇÃO DE DISPOSITIVO
====================== */
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

/* ======================
   ELEMENTOS
====================== */
const player = document.getElementById('player');
const obstacle = document.querySelector('.tg');
const scoreEl = document.getElementById('score');
const scare = document.getElementById('jumpscare');
const startBtn = document.getElementById('startButton');

/* ======================
   ESTADO DO JOGO
====================== */
let running = false;
let started = false;
let scareTriggered = false;
let score = 0;

/* ======================
   ÁUDIO NORMAL
====================== */
const bgMusic = new Audio('./audios/musica de fundo.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

/* ======================
   WEB AUDIO (ESTOURADO)
====================== */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let screamBuffer = null;
let whisperBuffer = null;

fetch('./audios/jumpscare.mp3')
    .then(r => r.arrayBuffer())
    .then(b => audioCtx.decodeAudioData(b))
    .then(buf => screamBuffer = buf);

fetch('./audios/i-see-you.mp3')
    .then(r => r.arrayBuffer())
    .then(b => audioCtx.decodeAudioData(b))
    .then(buf => whisperBuffer = buf);

/* ======================
   PULO
====================== */
function jump() {
    if (!running) return;

    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!player.classList.contains('jump')) {
        player.classList.add('jump');
        setTimeout(() => player.classList.remove('jump'), 900);
    }
}

/* ======================
   FULLSCREEN
====================== */
function goFullScreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
}

/* ======================
   INICIAR JOGO
====================== */
startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';

    if (isMobile && !document.fullscreenElement) goFullScreen();

    if (!started) {
        bgMusic.play();
        started = true;
    }

    /* adiciona listeners de pulo */
    if (isMobile) {
        document.body.addEventListener('touchstart', jump, { passive: false });
    } else {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') jump();
        });
    }

    running = true;
});

/* ======================
   SCORE
====================== */
const scoreTimer = setInterval(() => {
    if (!running) return;

    score++;
    scoreEl.innerText = `Score: ${score}`;

    if (score >= 50 && !scareTriggered) {
        scareTriggered = true;
        running = false;
        finalScare();
    }
}, 1000);

/* ======================
   LOOP PRINCIPAL
====================== */
const loop = setInterval(() => {
    if (!running) return;

    const obsRect = obstacle.getBoundingClientRect();
    const plyRect = player.getBoundingClientRect();

    const collision =
        obsRect.left < plyRect.right &&
        obsRect.right > plyRect.left &&
        obsRect.bottom > plyRect.top;

    if (collision) gameOver();
}, 16);

/* ======================
   GAME OVER
====================== */
function gameOver() {
    running = false;

    obstacle.style.animation = 'none';
    obstacle.style.display = 'none';

    player.style.animation = 'none';
    player.src = './issets/morri.png';

    bgMusic.pause();
    bgMusic.currentTime = 0;

    clearInterval(loop);
    clearInterval(scoreTimer);

    setTimeout(() => {
        alert('BOOM MORREU ACABOU');
    }, 100);
}

/* ======================
   JUMPSCARE FINAL
====================== */
function finalScare() {
    clearInterval(loop);
    clearInterval(scoreTimer);

    bgMusic.pause();
    bgMusic.currentTime = 0;

    scare.style.transition = 'none';
    scare.style.transform = 'translate(-50%, -50%) scale(0.1)';
    scare.offsetHeight;

    scare.style.transition = 'transform 0.2s';
    scare.style.transform = 'translate(-50%, -50%) scale(2.2)';

    audioCtx.resume();

    playDistorted(whisperBuffer);
    setTimeout(() => playDistorted(screamBuffer), 450);

    document.body.style.animation = 'violentShake 0.35s';

    setTimeout(() => {
        alert('I CAN ACTUALLY SEE YOU');
    }, 200);
}

/* ======================
   SOM DISTORCIDO
====================== */
function playDistorted(buffer) {
    if (!buffer) return;

    const src = audioCtx.createBufferSource();
    src.buffer = buffer;

    const distortion = audioCtx.createWaveShaper();
    distortion.curve = makeCurve(900);

    const gain = audioCtx.createGain();
    gain.gain.value = 4;

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1100;

    src.connect(distortion);
    distortion.connect(gain);
    gain.connect(lowpass);
    lowpass.connect(audioCtx.destination);

    src.start();
}

/* ======================
   CURVA DE DISTORÇÃO
====================== */
function makeCurve(amount) {
    const n = 44100;
    const curve = new Float32Array(n);
    const k = amount;
    const deg = Math.PI / 180;

    for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
}
