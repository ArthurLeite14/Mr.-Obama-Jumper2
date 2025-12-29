/* ======================
   DETECÇÃO DE DISPOSITIVO
====================== */
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

/* ======================
   ELEMENTOS
====================== */
const bo = document.querySelector('.bo');
const tg = document.querySelector('.tg');
const scoreElement = document.querySelector('.score');
const scare = document.getElementById('jumpscare');
const startBtn = document.getElementById('startButton');

/* ======================
   ESTADO
====================== */
let running = false;
let started = false;
let scareTriggered = false;
let score = 0;
let lastTime = null;

/* ======================
   ÁUDIO NORMAL
====================== */
const musica = new Audio('./audios/musica de fundo.mp3');
musica.loop = true;
musica.volume = 0.5;

/* ======================
   ÁUDIO WEB
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
   FULLSCREEN
====================== */
function goFullScreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) elem.requestFullscreen();
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
}

/* ======================
   PULO
====================== */
function jump() {
  if (!running) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (!bo.classList.contains('jump')) {
    bo.classList.add('jump');
    setTimeout(() => bo.classList.remove('jump'), 900);
  }
}

/* ======================
   INICIAR JOGO
====================== */
startBtn.addEventListener('click', () => {
  startBtn.style.display = 'none';

  if (isMobile && !document.fullscreenElement) goFullScreen();
  if (!started) { musica.play(); started = true; }

  // Eventos de pulo
  if (isMobile) document.body.addEventListener('touchstart', jump, { passive: false });
  else document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
  });

  running = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});

/* ======================
   LOOP PRINCIPAL
====================== */
function gameLoop(timestamp) {
  if (!running) return;

  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  // Score
  score += deltaTime / 1000;
  scoreElement.innerText = `Score: ${Math.floor(score)}`;

  if (score >= 15 && !scareTriggered) {
    scareTriggered = true;
    running = false;
    jumpScareFinal();
    return;
  }

  // Colisão
  const tgRect = tg.getBoundingClientRect();
  const boRect = bo.getBoundingClientRect();

  if (tgRect.left < boRect.right &&
      tgRect.right > boRect.left &&
      tgRect.bottom > boRect.top) {
    gameOver();
    return;
  }

  requestAnimationFrame(gameLoop);
}

/* ======================
   GAME OVER
====================== */
function gameOver() {
  running = false;

  tg.style.animation = 'none';
  tg.style.display = 'none';

  bo.style.animation = 'none';
  bo.src = './issets/morri.png';
  bo.style.width = '100px';

  musica.pause();
  musica.currentTime = 0;

  setTimeout(() => { alert('BOOM MORREU ACABOU'); }, 100);
}

/* ======================
   JUMPSCARE FINAL
====================== */
function jumpScareFinal() {
  musica.pause();
  musica.currentTime = 0;

  scare.style.transition = 'none';
  scare.style.transform = 'translate(-50%, -50%) scale(0.1)';
  scare.offsetHeight;

  scare.style.transition = 'transform 0.2s';
  scare.style.transform = 'translate(-50%, -50%) scale(2.2)';

  audioCtx.resume();
  playLowQuality(preScareBuffer);
  setTimeout(() => playLowQuality(scareBuffer), 450);

  document.body.style.animation = 'violentShake 0.35s';

  setTimeout(() => { alert('I CAN ACTUALLY SEE YOU'); }, 200);
}

/* ======================
   SOM ESTOURADO
====================== */
function playLowQuality(buffer) {
  if (!buffer) return;

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const distortion = audioCtx.createWaveShaper();
  distortion.curve = makeDistortionCurve(900);

  const gain = audioCtx.createGain();
  gain.gain.value = 3.8;

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
function makeDistortionCurve(amount) {
  const k = amount;
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;

  for (let i = 0; i < n; i++) {
    const x = (i*2)/n - 1;
    curve[i] = ((3 + k) * x * 20 * deg)/(Math.PI + k * Math.abs(x));
  }
  return curve;
}
