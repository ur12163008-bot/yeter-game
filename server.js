<!-- ЭКРАН ЗАГРУЗКИ -->
<div id="loadingScreen">
  <div class="loading-logo"></div>
</div>

<style>
/* ЭКРАН ЗАГРУЗКИ */
#loadingScreen {
  position: fixed;
  inset: 0;
  background: #07070e;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transition: opacity 0.6s ease, visibility 0.6s ease;
  opacity: 1;
  visibility: visible;
}
#loadingScreen.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
.loading-logo {
  width: 130px;
  height: 130px;
  border-radius: 30px;
  background: url('https://i.ibb.co/Q7LXwRXn/IMG-0299.png') center/cover;
  background-color: transparent;
  /* Убраны рамки */
  border: none;
  /* Анимация пульсации с синим свечением */
  animation: pulseGlow 2s ease-in-out infinite;
}
@keyframes pulseGlow {
  0%, 100% { 
    box-shadow: 0 0 30px rgba(138, 43, 226, 0.4), 0 0 60px rgba(72, 20, 140, 0.2);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 50px #3a1c71, 0 0 100px #2a0a5e, 0 0 150px rgba(88, 10, 148, 0.3);
    transform: scale(1.05);
  }
}
</style>

<script>
// Скрыть экран загрузки через 3 секунды
setTimeout(() => {
  document.getElementById('loadingScreen').classList.add('hidden');
}, 3000);
</script>
