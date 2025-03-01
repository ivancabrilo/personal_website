const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", function () {
  const previousHeight = canvas.height;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const scaleFactor = canvas.height / previousHeight;

  // adjustment the player's Y-position
  player.y *= scaleFactor;

  // adjustment to platforms' Y-positions
  platforms.forEach((platform) => {
    platform.y *= scaleFactor;

    // ensures that platform not go below the canvas
    if (platform.y + platform.height > canvas.height) {
      platform.y = canvas.height - platform.height;
    }
  });
});

canvas.addEventListener("click", toggleFullscreen);

function toggleFullscreen() {
  const previousHeight = canvas.height;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }

  setTimeout(function () {
    const scaleFactor = canvas.height / previousHeight;

    // changes to player's Y-position
    player.y *= scaleFactor;

    // Adjust to platforms' Y-positions
    platforms.forEach((platform) => {
      platform.y *= scaleFactor;

      // ---> platform doesn't go below the canvas
      if (platform.y + platform.height > canvas.height) {
        platform.y = canvas.height - platform.height;
      }
    });
  }, 100);
}

let player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  radius: 20,
  dy: 0,
  dx: 0,
  jumping: false,
  jumps: 0, // Jumps made
  maxJumps: 2,
  justLanded: false,
};

let platforms = [];

let score = 0;

function createPlatform() {
  if (platforms.length === 0) {
    // First platform
    platforms.push({
      x: canvas.width - 450, 
      y: canvas.height - 150,
      width: player.radius * 2 + Math.random() * (100 - player.radius * 2),
      height: 10,
      touched: false,
      jumpCount: 0,
    });
  } else if (platforms.length === 1) {
    platforms.push({
      x: canvas.width - 700, 
      y: canvas.height - 300,
      width: player.radius * 2 + Math.random() * (100 - player.radius * 2),
      height: 10,
      touched: false,
      jumpCount: 0,
    });
  } else if (platforms.length === 3) {
    platforms.push({
      x: canvas.width - 1000, 
      y: canvas.height - 400,
      width: player.radius * 2 + Math.random() * (100 - player.radius * 2),
      height: 10,
      touched: false,
      jumpCount: 0,
    });
  } else {
    // For all other platforms
    const lastPlatform = platforms[platforms.length - 1];
    const minDistance = 60; // Min dist from the last platform in y-axis
    const maxDistance = 110; // Max dist from the last platform in y-axis
    const minGapX = 87; // Min gap in x-axis between consecutive platforms

    // Randomly decide the Y position within the min and max range from the last platform
    const yPosition =
      lastPlatform.y -
      minDistance -
      Math.random() * (maxDistance - minDistance);
    let newX;

    do {
      newX = Math.random() * (canvas.width - 300);
    } while (Math.abs(newX - lastPlatform.x) < minGapX); // Ensure at least minGapX difference on the x-axis

    const platform = {
      x: newX,
      y: yPosition,
      width: player.radius * 2 + Math.random() * (100 - player.radius * 2),
      height: 15,
      touched: false,
      jumpCount: 0,
    };
    platforms.push(platform);
  }
}

function jump() {
  if (player.jumps < player.maxJumps) {
    if (player.jumps === 0) {
      player.dy = -14; // First jump
    } else {
      player.dy = -10 - Math.random() * 7; // Second jump
    }
    player.jumping = true;
    player.jumps++; // Increase the number of jumps to 2
  }
}
let flashDuration = 0;

function flashScoreboard() {
  flashDuration = 1;
}
platforms = platforms.filter((platform) => platform.y < canvas.height);

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  if (key === "w" && player.jumps < player.maxJumps) {
    jump();
  } else if (key === "a") {
    player.dx = -5.5;
  } else if (key === "d") {
    player.dx = 5.5;
  }
});
function drawPyramidPlatform(x, y, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width / 2, y - height * 1.3);
  ctx.lineTo(x + width, y);
  ctx.closePath();
  ctx.fillStyle = "#D2A679";
  ctx.fill();
  ctx.stroke();
}

function drawBackground() {
  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#74b9ff"); // Top color
  gradient.addColorStop(1, "#FFC300"); // Bottom color
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

document.addEventListener("keyup", function (event) {
  const key = event.key.toLowerCase();
  if (key === "a" || key === "d") {
    player.dx = 0;
  }
});

document.getElementById("aboutMeButton").addEventListener("click", function () {
  window.location.href = "projects.html";
});

function update() {
  player.y += player.dy;
  player.x += player.dx;
  player.dy += 0.5;

  // Prevent player from falling through the bottom
  if (player.y + player.radius > canvas.height) {
    player.y = canvas.height - player.radius;
    player.dy = 0;
    player.jumping = false;
    player.jumps = 0;
    if (score > 0) {
      score = 0;
      flashScoreboard();
    }
  }

  // Prevent player from moving out of canvas horizontally
  if (player.x - player.radius < 0) {
    player.x = player.radius;
  }
  if (player.x + player.radius > canvas.width) {
    player.x = canvas.width - player.radius;
  }

  // Collision detection with platforms
  for (let platform of platforms) {
    if (
      player.y + player.radius > platform.y &&
      player.y - player.radius < platform.y + platform.height &&
      player.x + player.radius > platform.x &&
      player.x - player.radius < platform.x + platform.width
    ) {
      if (player.dy > 0) {
        // Ball is moving downward
        player.y = platform.y - player.radius;
        player.dy = 0;
        player.jumping = false;
        player.jumps = 0;
        if (!platform.touched) {
          score += 1;
          platform.touched = true; // add score once per platform
          createPlatform();
          if (platforms.length > 6) {
            console.log("hi");
          } else {
            createPlatform();
          }
        }
      }
    }
  }

  if (player.y < canvas.height / 2) {
    for (let platform of platforms) {
      platform.y += 10;
    }
    player.y += 10;
  }
  platforms = platforms.filter((platform) => platform.y < canvas.height);
  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  //SVG for the player

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#FFD700";
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.fill();

  //  Triangle
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.radius + 10);
  ctx.lineTo(player.x + player.radius - 10, player.y + player.radius - 10);
  ctx.lineTo(player.x - player.radius + 10, player.y + player.radius - 10);
  ctx.closePath();
  ctx.fillStyle = "#D32F2F";
  ctx.fill();

  // Three smaller circles
  const offset = player.radius * 0.4;
  ctx.beginPath();
  ctx.arc(player.x, player.y - offset, offset / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#1976D2";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x - offset, player.y + offset, offset / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#388E3C";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(player.x + offset, player.y + offset, offset / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#8E24AA";
  ctx.fill();

  for (let platform of platforms) {
    drawPyramidPlatform(
      platform.x,
      platform.y,
      platform.width,
      platform.height
    );
  }

  if (flashDuration > 0) {
    ctx.fillStyle = "red";
    flashDuration -= 0.02;
  } else {
    ctx.fillStyle = "#50C878";
  }

  const BASE_SCREEN_WIDTH = 2560;
  const BASE_SCREEN_HEIGHT = 1600;
  const BASE_FONT_SIZE = 55;

  //  scale factors
  let widthScaleFactor = window.innerWidth / BASE_SCREEN_WIDTH;
  let heightScaleFactor = window.innerHeight / BASE_SCREEN_HEIGHT;

  // average of the width and height scale factors as the overall scale factor
  let overallScaleFactor = (widthScaleFactor + heightScaleFactor) / 2;

  // Calculate responsive font size
  let responsiveFontSize = BASE_FONT_SIZE * overallScaleFactor;

  // Set font, stroke, and shadow effects
  ctx.font = `${responsiveFontSize}px "Press Start 2P"`; // Responsive Font
  ctx.strokeStyle = "#FFC300"; // cool stroke effect 
  ctx.lineWidth = 2; // Define the width of the stroke

  // Add a glow effect (only when not flashing)
  if (flashDuration <= 0) {
    ctx.shadowColor = ""; // Choose a color for the glow
    ctx.shadowBlur = 10; // Define the size of the glow
    ctx.shadowOffsetX = 0; // Horizontal offset
    ctx.shadowOffsetY = 0; // Vertical offset
  }

  ctx.fillText(`Score: ${score}`, 15, 45);
  ctx.strokeText(`Score: ${score}`, 15, 45);

  ctx.shadowBlur = 0;
}

createPlatform();
update();

document
  .getElementById("closeInstructions")
  .addEventListener("click", function () {
    document.getElementById("instructions").style.display = "none";
  });
