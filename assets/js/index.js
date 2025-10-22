const preloadImages = [
  "./assets/img/roc-min.png",
  "./assets/img/win-min.png",
  "./assets/img/crash-min.png",
];

preloadImages.forEach((src) => {
  const img = new Image();
  img.src = src;
});
let balance = 100000;
let betAmount = 0;
let multiplier = 2;
let isRolling = false;
let recentWins = [];
let historyItems = [];
let RecentCount = 10;

const balanceEl = document.getElementById("balance");
const betAmountEl = document.getElementById("betAmount");
const multiplierEl = document.getElementById("multiplier");
const errorEl = document.getElementById("error");
const betBtn = document.getElementById("betBtn");
const halfBtn = document.getElementById("halfBtn");
const doubleBtn = document.getElementById("doubleBtn");
const recentWinsEl = document.getElementById("recentWins");
const multiplierDisplayEl = document.getElementById("multiplierDisplay");
const historyListEl = document.getElementById("historyList");

function handleResize() {
  if (window.innerWidth >= 992) {
    RecentCount = 10;
  } else {
    RecentCount = 4;
  }
}

handleResize();

window.addEventListener("resize", handleResize);

// For Animation

const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
canvas.width = document.getElementById("conAnimation").offsetWidth;
canvas.height = document.getElementById("conAnimation").offsetHeight;

const rocket = document.getElementById("rocket");
const launchBtn = document.getElementById("launchBtn");

const sndLaunch = document.getElementById("sndLaunch");
const sndExplosion = document.getElementById("sndExplosion");
const sndReset = document.getElementById("sndReset");
const sndWin = document.getElementById("sndwin");

let rocketY = 0;
let isLaunching = false;

let maxHeight = canvas.height * 0.55;
if (window.innerWidth < 992) {
  maxHeight = canvas.height * 0.5;
}
let explosionShown = false;
let bgY = 0;

function updateUI() {
  balanceEl.textContent = "$" + balance.toFixed(2);
  betBtn.disabled =
    !betAmount ||
    betAmount <= 0 ||
    betAmount > balance ||
    isRolling ||
    errorEl.textContent !== "";
  halfBtn.disabled = betAmount <= 0;
  doubleBtn.disabled = betAmount <= 0 || betAmount * 2 > balance;
  renderRecentWins();
  renderHistory();
}

function renderRecentWins() {
  recentWinsEl.innerHTML = "";
  recentWins.slice(-RecentCount).forEach((item) => {
    const div = document.createElement("div");
    div.className = "chip " + (item.isWin ? "win" : "lose");
    div.textContent = item.randomNumber.toFixed(2);
    recentWinsEl.prepend(div);
  });
}

function renderHistory() {
  historyListEl.innerHTML = "";

  if (historyItems.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-history";
    emptyDiv.textContent = "Empty History";
    historyListEl.appendChild(emptyDiv);
    return;
  }

  historyItems
    .slice(-50)
    .reverse()
    .forEach((item) => {
      const div = document.createElement("div");
      div.className = "history-item " + (item.isWin ? "win" : "lose");
      div.innerHTML = `
        <div><strong>Odds:</strong> ${item.multiplier}x</div>
        <div><strong>Bet Amount:</strong> $${item.bet.toFixed(2)}</div>
        <div><strong class='lose-text' >${
          item.isWin ? "Win Amount" : "Win Amount"
        }:</strong> ${item.isWin ? "$" + item.winAmount.toFixed(2) : "-"}</div>
        <div class="time">${new Date(item.time).toLocaleTimeString()}</div>
      `;
      historyListEl.appendChild(div);
    });
}

betAmountEl.addEventListener("input", (e) => {
  betAmount = parseFloat(e.target.value);
  if (isNaN(betAmount)) betAmount = 0;
  if (betAmount > balance) {
    errorEl.textContent = "Bet amount cannot exceed your balance";
  } else {
    errorEl.textContent = "";
  }
  updateUI();
});

multiplierEl.addEventListener("input", (e) => {
  multiplier = parseFloat(e.target.value);
  if (multiplier >= 100 || multiplier <= 1) {
    errorEl.textContent = "Multiplier should be between 1 and 100";
  } else {
    errorEl.textContent = "";
  }
  updateUI();
});

halfBtn.addEventListener("click", () => {
  if (betAmount > 0) {
    betAmount = betAmount / 2;
    betAmountEl.value = betAmount.toFixed(2);
    updateUI();
  }
});

doubleBtn.addEventListener("click", () => {
  if (betAmount > 0 && betAmount * 2 <= balance) {
    betAmount = betAmount * 2;
    betAmountEl.value = betAmount.toFixed(2);
    updateUI();
  }
});

betBtn.addEventListener("click", () => {
  if (betAmount <= 0 || betAmount > balance) return;

  balance -= betAmount;
  isRolling = true;
  updateUI();

  const randomMultiplier = generateWeightedRandom();
  if (!isLaunching && !explosionShown) {
    isLaunching = true;
    sndLaunch.play();
  }

  animateMultiplier(randomMultiplier, () => {
    if (randomMultiplier >= multiplier) {
      // rocket.src = "./assets/img/win-min.png";
      document.getElementById("multiplierDisplay").style.color = "#00e701";
      const winnings = betAmount * multiplier;
      balance += winnings;
      recentWins.push({ isWin: true, randomNumber: randomMultiplier });
      historyItems.push({
        isWin: true,
        bet: betAmount,
        multiplier: multiplier,
        winAmount: winnings,
        time: Date.now(),
      });
      sndWin.play();
      rocket.classList.add("winend");
    } else {
      // rocket.src = "./assets/img/crash-min.png";
      document.getElementById("multiplierDisplay").style.color = "#dc2626";

      recentWins.push({ isWin: false, randomNumber: randomMultiplier });
      historyItems.push({
        isWin: false,
        bet: betAmount,
        multiplier: multiplier,
        winAmount: 0,
        time: Date.now(),
      });
      sndExplosion.play();
      rocket.classList.add("boomb");
    }
    isRolling = false;
    updateUI();
  });
});

function animateMultiplier(target, onDone) {
  multiplierDisplayEl.textContent = "0.00X";
  multiplierDisplayEl.classList.add("pulsing");

  let startTime = Date.now();
  const interval = setInterval(() => {
    let elapsed = Date.now() - startTime;
    let progress = Math.min(elapsed / 1000, 1);
    let eased = progress < 1 ? progress * progress : progress;
    let nextVal = eased * target;

    if (progress >= 1 && nextVal >= target - 0.1) {
      clearInterval(interval);
      multiplierDisplayEl.textContent = target.toFixed(2) + "X";
      multiplierDisplayEl.classList.remove("pulsing");
      onDone();

      if (rocketY > maxHeight) {
        isLaunching = false;
      } else {
        isLaunching = false;
        triggerExplosion();
      }
    } else {
      multiplierDisplayEl.textContent = nextVal.toFixed(2) + "X";
    }
  }, 100);
}
function generateWeightedRandom() {
  const r = Math.random();
  if (r < 0.6) return 1 + Math.random() * 1;
  if (r < 0.95) return 2 + Math.random() * 1.5;
  if (r < 0.98) return 3.5 + Math.random() * 6.5;
  if (r < 0.999) return 10 + Math.random() * 40;
  return 50 + Math.random() * 50;
}

updateUI();

function ShowHistory() {
  const element = document.getElementById("m-con-history");
  element.classList.add("m-show");
}

function HideHistory() {
  const element = document.getElementById("m-con-history");
  element.classList.remove("m-show");
}

const starCount = 200;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 1 + 0.5,
    twinkle: Math.random() * 0.05 + 0.01,
  });
}

function resetRocketAnimation() {
  rocketY = -60;
  rocket.style.bottom = rocketY + "px";
  const animInterval = setInterval(() => {
    rocketY += 5;

    if (rocketY >= 0) {
      rocketY = 0;
      clearInterval(animInterval);
      sndReset.play();
    }
    rocket.style.bottom = rocketY + "px";
    document.getElementById("multiplierDisplay").style.color = "#eeedfb";
    document.getElementById("multiplierDisplay").textContent = "0.00X";
  }, 16);
}

function triggerExplosion() {
  explosionShown = true;

  document.getElementById("conAnimation").classList.add("shake");
  setTimeout(
    () => document.getElementById("conAnimation").classList.remove("shake"),
    300
  );

  betBtn.disabled = true;
  setTimeout(() => {
    // rocket.src = "./assets/img/roc-min.png";
    explosionShown = false;
    resetRocketAnimation();
    if (rocket.classList.contains("boomb")) {
      rocket.classList.remove("boomb");
    } else if (rocket.classList.contains("winend")) {
      rocket.classList.remove("winend");
    }

    betBtn.disabled = false;
  }, 800);
}

let frame = 0;
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  stars.forEach((s) => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(49,85,99,${0.5 + Math.sin(frame * s.twinkle) / 2})`;
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    if (isLaunching) {
      s.y = s.y + s.speed + 15;
      if (s.y > canvas.height) s.y = 0;
    }
  });

  if (isLaunching) {
    rocketY += 6;
    if (rocketY > maxHeight) {
      rocketY = maxHeight;
    }
    rocket.style.bottom = rocketY + "px";

    bgY += 35;
    document.getElementById("conAnimation").style.backgroundPositionY =
      bgY + "px";
  } else if (!explosionShown) {
  }

  frame++;
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  canvas.width = document.getElementById("conAnimation").offsetWidth;
  canvas.height = document.getElementById("conAnimation").offsetHeight;
  maxHeight = canvas.height * 0.55;
});

document.addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("keydown", (e) => {
  if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    e.preventDefault();
  }
});
