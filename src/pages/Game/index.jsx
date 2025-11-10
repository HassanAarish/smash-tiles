import React, { useEffect, useRef, useState, useCallback } from "react";

const Game = () => {
  // Canvas refs
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const containerRef = useRef(null);

  // Game state refs for performance
  const gameStateRef = useRef({
    score: 0,
    lives: 3,
    maxLives: 3,
    level: 1,
    balls: [],
    bricks: [],
    particles: [],
    powerUps: [],
    portals: [],
    paddleX: 400,
    paddleWidth: 100,
    gameState: "menu",
    coins: 0,
    combo: 0,
    maxCombo: 0,
    isDragging: false,
    dragStartX: 0,
    activePowerUps: new Set(),
    powerUpTimers: new Map(),
    lastTime: 0,
    deltaTime: 0,
    speedMultiplier: 1.0,
  });
  // UI state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState("menu");
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [starRating, setStarRating] = useState(0);
  const [activePowerUps, setActivePowerUps] = useState(new Set());
  const [speedIncrease, setSpeedIncrease] = useState(0);
  // Constants
  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 600;
  const PADDLE_HEIGHT = 15;
  const BRICK_WIDTH = 75;
  const BRICK_HEIGHT = 25;
  const BRICK_PADDING = 5;
  const BRICK_ROWS = 6;
  const BRICK_COLS = 10;
  const BASE_BALL_SPEED = 5;
  const SPEED_INCREMENT = 0.015; // 1.5% increase per bounce
  const MAX_SPEED_MULTIPLIER = 3.0; // Maximum speed increase
  // Initialize game
  const initGame = useCallback(() => {
    const gameState = gameStateRef.current;

    // Reset game state
    gameState.score = 0;
    gameState.lives = 3;
    gameState.maxLives = 3;
    gameState.level = 1;
    gameState.coins = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.balls = [];
    gameState.bricks = [];
    gameState.particles = [];
    gameState.powerUps = [];
    gameState.portals = [];
    gameState.paddleX = CANVAS_WIDTH / 2 - gameState.paddleWidth / 2;
    gameState.activePowerUps.clear();
    gameState.powerUpTimers.clear();
    gameState.speedMultiplier = 1.0;

    // Create initial ball
    gameState.balls.push({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      dx: 0,
      dy: 0,
      radius: 8,
      baseSpeed: BASE_BALL_SPEED,
      currentSpeed: BASE_BALL_SPEED,
      bounceCount: 0,
      trail: [],
      sticky: false,
      attached: true,
      color: "#00ff88",
    });

    // Create initial level
    createLevel(1);

    // Update UI state
    setScore(0);
    setLives(3);
    setLevel(1);
    setCoins(0);
    setCombo(0);
    setMaxCombo(0);
    setSpeedIncrease(0);
    setActivePowerUps(new Set());
    setGameState("menu");
  }, []);
  // Create level with bricks
  const createLevel = useCallback((levelNum) => {
    const gameState = gameStateRef.current;
    gameState.bricks = [];

    // Create portals for higher levels
    if (levelNum >= 3) {
      gameState.portals = [
        {
          x: 100,
          y: CANVAS_HEIGHT / 2,
          radius: 30,
          color: "#ff00ff",
          cooldown: 0,
          particles: Array.from({ length: 12 }, (_, i) => ({
            angle: (i * Math.PI * 2) / 12,
            radius: 20 + Math.random() * 10,
            speed: 0.02 + Math.random() * 0.03,
            alpha: Math.random(),
          })),
        },
        {
          x: CANVAS_WIDTH - 100,
          y: CANVAS_HEIGHT / 2,
          radius: 30,
          color: "#00ffff",
          cooldown: 0,
          particles: Array.from({ length: 12 }, (_, i) => ({
            angle: (i * Math.PI * 2) / 12,
            radius: 20 + Math.random() * 10,
            speed: 0.02 + Math.random() * 0.03,
            alpha: Math.random(),
          })),
        },
      ];
    }

    // Different brick patterns for each level
    const patterns = {
      1: "full", // All bricks
      2: "diamond", // Diamond shape
      3: "pyramid", // Pyramid
      4: "cross", // Cross shape
      5: "spiral", // Spiral pattern
    };

    const pattern = patterns[levelNum] || "full";
    const colors = [
      "#ff6b6b",
      "#4ecdc4",
      "#45b7d1",
      "#96ceb4",
      "#feca57",
      "#ff9ff3",
    ];

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        let shouldCreate = false;

        switch (pattern) {
          case "full":
            shouldCreate = true;
            break;
          case "diamond":
            const centerRow = BRICK_ROWS / 2;
            const centerCol = BRICK_COLS / 2;
            const distance =
              Math.abs(row - centerRow) + Math.abs(col - centerCol);
            shouldCreate = distance <= 3;
            break;
          case "pyramid":
            shouldCreate =
              row >= BRICK_ROWS - 3 &&
              col >= row - (BRICK_ROWS - 3) &&
              col <= BRICK_COLS - row + (BRICK_ROWS - 4);
            break;
          case "cross":
            shouldCreate = (row >= 2 && row <= 3) || (col >= 4 && col <= 5);
            break;
          case "spiral":
            shouldCreate = (row + col) % 2 === 0;
            break;
        }

        if (shouldCreate) {
          const health = Math.min(1 + Math.floor(levelNum / 2), 3);
          const hasPowerUp = Math.random() < 0.15;
          const powerUpTypes = [
            "multiball",
            "widePaddle",
            "slowBall",
            "stickyPaddle",
            "extraLife",
            "coins",
          ];

          gameState.bricks.push({
            x: col * (BRICK_WIDTH + BRICK_PADDING) + 50,
            y: row * (BRICK_HEIGHT + BRICK_PADDING) + 80,
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            health: health,
            maxHealth: health,
            color: colors[Math.floor(Math.random() * colors.length)],
            powerUp: hasPowerUp
              ? powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
              : null,
            hit: false,
            hitAnimation: 0,
          });
        }
      }
    }
  }, []);
  // Create particle effect
  const createParticles = useCallback((x, y, color, count = 10) => {
    const gameState = gameStateRef.current;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2 + Math.random() * 3;
      gameState.particles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 1,
      });
    }
  }, []);
  // Handle power-up activation
  const activatePowerUp = useCallback((type) => {
    const gameState = gameStateRef.current;

    switch (type) {
      case "multiball":
        const currentBall = gameState.balls[0];
        if (currentBall) {
          for (let i = 0; i < 2; i++) {
            gameState.balls.push({
              x: currentBall.x,
              y: currentBall.y,
              dx: (Math.random() - 0.5) * 8,
              dy: -Math.abs(currentBall.dy || 5),
              radius: 8,
              baseSpeed: BASE_BALL_SPEED,
              currentSpeed: currentBall.currentSpeed,
              bounceCount: currentBall.bounceCount,
              trail: [],
              sticky: false,
              attached: false,
              color: ["#ff6b6b", "#4ecdc4", "#45b7d1"][i],
            });
          }
        }
        break;
      case "widePaddle":
        gameState.paddleWidth = 150;
        gameState.activePowerUps.add(type);
        gameState.powerUpTimers.set(type, 10000); // 10 seconds
        break;
      case "slowBall":
        gameState.activePowerUps.add(type);
        gameState.powerUpTimers.set(type, 8000); // 8 seconds
        break;
      case "stickyPaddle":
        gameState.activePowerUps.add(type);
        gameState.powerUpTimers.set(type, 12000); // 12 seconds
        break;
      case "extraLife":
        gameState.lives++;
        gameState.maxLives = Math.max(gameState.maxLives, gameState.lives);
        setLives(gameState.lives);
        break;
      case "coins":
        gameState.coins += 50;
        setCoins(gameState.coins);
        break;
    }

    setActivePowerUps(new Set(gameState.activePowerUps));
  }, []);
  // Reset ball speed after life loss
  const resetBallSpeed = useCallback(() => {
    const gameState = gameStateRef.current;
    gameState.speedMultiplier = 1.0;
    gameState.balls.forEach((ball) => {
      ball.currentSpeed = ball.baseSpeed;
      ball.bounceCount = 0;
      // Update velocity to match new speed
      const currentMagnitude = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      if (currentMagnitude > 0) {
        const ratio = ball.currentSpeed / currentMagnitude;
        ball.dx *= ratio;
        ball.dy *= ratio;
      }
    });
    setSpeedIncrease(0);
  }, []);
  // Update game state
  const update = useCallback(
    (deltaTime) => {
      const gameState = gameStateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Update power-up timers
      gameState.powerUpTimers.forEach((time, type) => {
        const newTime = time - deltaTime;
        if (newTime <= 0) {
          gameState.powerUpTimers.delete(type);
          gameState.activePowerUps.delete(type);

          // Reset power-up effects
          switch (type) {
            case "widePaddle":
              gameState.paddleWidth = 100;
              break;
          }
        } else {
          gameState.powerUpTimers.set(type, newTime);
        }
      });

      // Update active power-ups in UI
      setActivePowerUps(new Set(gameState.activePowerUps));

      // Update balls
      gameState.balls.forEach((ball, ballIndex) => {
        // Update trail
        ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
        if (ball.trail.length > 10) {
          ball.trail.shift();
        }
        ball.trail.forEach((point) => {
          point.alpha *= 0.9;
        });

        // Skip physics for attached ball
        if (ball.attached) {
          ball.x = gameState.paddleX + gameState.paddleWidth / 2;
          ball.y = CANVAS_HEIGHT - 100;
          return;
        }

        // Apply slow motion power-up
        let speedMultiplier = gameState.speedMultiplier;
        if (gameState.activePowerUps.has("slowBall")) {
          speedMultiplier *= 0.5;
        }

        // Update position
        ball.x += ball.dx * speedMultiplier;
        ball.y += ball.dy * speedMultiplier;

        // Wall collisions
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= CANVAS_WIDTH) {
          ball.dx = -ball.dx;
          // Keep ball in bounds
          if (ball.x - ball.radius <= 0) {
            ball.x = ball.radius;
          } else {
            ball.x = CANVAS_WIDTH - ball.radius;
          }
          createParticles(ball.x, ball.y, ball.color, 5);
        }

        if (ball.y - ball.radius <= 0) {
          ball.dy = -ball.dy;
          ball.y = ball.radius;
          createParticles(ball.x, ball.y, ball.color, 5);
        }

        // Bottom boundary - lose ball
        if (ball.y - ball.radius > CANVAS_HEIGHT) {
          gameState.balls.splice(ballIndex, 1);
          createParticles(ball.x, CANVAS_HEIGHT, "#ff0000", 20);
        }

        // Paddle collision with improved physics
        const paddleTop = CANVAS_HEIGHT - PADDLE_HEIGHT - 20;
        const paddleBottom = CANVAS_HEIGHT - 20;

        if (
          ball.y + ball.radius >= paddleTop &&
          ball.y - ball.radius <= paddleBottom &&
          ball.x >= gameState.paddleX &&
          ball.x <= gameState.paddleX + gameState.paddleWidth
        ) {
          // Calculate hit position (-1 to 1)
          const hitPos =
            (ball.x - gameState.paddleX) / gameState.paddleWidth - 0.5;
          const normalizedHitPos = hitPos * 2;

          // Set new velocity based on hit position
          const maxAngle = Math.PI / 3; // 60 degrees max angle
          const angle = normalizedHitPos * maxAngle;

          // Apply current speed to new velocity
          const currentMagnitude = ball.currentSpeed * speedMultiplier;
          ball.dx = currentMagnitude * Math.sin(angle);
          ball.dy = -Math.abs(currentMagnitude * Math.cos(angle));

          // Sticky paddle effect
          if (gameState.activePowerUps.has("stickyPaddle")) {
            ball.attached = true;
            ball.sticky = true;
          }

          // Prevent ball from getting stuck in paddle
          ball.y = paddleTop - ball.radius;

          createParticles(ball.x, ball.y, "#00ff88", 8);
        }

        // Brick collisions with improved detection
        gameState.bricks.forEach((brick, brickIndex) => {
          // Check if ball intersects with brick
          const closestX = Math.max(
            brick.x,
            Math.min(ball.x, brick.x + brick.width)
          );
          const closestY = Math.max(
            brick.y,
            Math.min(ball.y, brick.y + brick.height)
          );

          const distanceX = ball.x - closestX;
          const distanceY = ball.y - closestY;
          const distance = Math.sqrt(
            distanceX * distanceX + distanceY * distanceY
          );

          if (distance < ball.radius) {
            // Increase speed for this bounce
            ball.bounceCount++;
            const speedIncreaseFactor = 1 + SPEED_INCREMENT * ball.bounceCount;
            const newSpeed = Math.min(
              ball.baseSpeed * speedIncreaseFactor,
              ball.baseSpeed * MAX_SPEED_MULTIPLIER
            );

            // Determine collision side
            let hitSide = "none";

            // Calculate overlap for each side
            const overlapLeft = ball.x + ball.radius - brick.x;
            const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
            const overlapTop = ball.y + ball.radius - brick.y;
            const overlapBottom =
              brick.y + brick.height - (ball.y - ball.radius);

            const minOverlap = Math.min(
              overlapLeft,
              overlapRight,
              overlapTop,
              overlapBottom
            );

            // Determine which side had the minimum overlap
            if (minOverlap === overlapLeft) hitSide = "left";
            else if (minOverlap === overlapRight) hitSide = "right";
            else if (minOverlap === overlapTop) hitSide = "top";
            else if (minOverlap === overlapBottom) hitSide = "bottom";

            // Get current velocity magnitude
            const currentMagnitude = Math.sqrt(
              ball.dx * ball.dx + ball.dy * ball.dy
            );

            // Reflect ball based on hit side and apply new speed
            if (hitSide === "left" || hitSide === "right") {
              ball.dx = -ball.dx;
              // Apply new speed
              ball.dx = (ball.dx / currentMagnitude) * newSpeed;
              ball.dy = (ball.dy / currentMagnitude) * newSpeed;
              // Push ball out of brick
              if (hitSide === "left") {
                ball.x = brick.x - ball.radius;
              } else {
                ball.x = brick.x + brick.width + ball.radius;
              }
            } else if (hitSide === "top" || hitSide === "bottom") {
              ball.dy = -ball.dy;
              // Apply new speed
              ball.dx = (ball.dx / currentMagnitude) * newSpeed;
              ball.dy = (ball.dy / currentMagnitude) * newSpeed;
              // Push ball out of brick
              if (hitSide === "top") {
                ball.y = brick.y - ball.radius;
              } else {
                ball.y = brick.y + brick.height + ball.radius;
              }
            }

            // Update ball's current speed
            ball.currentSpeed = newSpeed;

            brick.health--;
            brick.hit = true;
            brick.hitAnimation = 1;

            if (brick.health <= 0) {
              gameState.bricks.splice(brickIndex, 1);
              gameState.score += 100 * (gameState.combo + 1);
              gameState.combo++;
              gameState.maxCombo = Math.max(
                gameState.maxCombo,
                gameState.combo
              );
              gameState.coins += 10;

              // Create particles
              createParticles(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                brick.color,
                15
              );

              // Drop power-up
              if (brick.powerUp) {
                gameState.powerUps.push({
                  x: brick.x + brick.width / 2,
                  y: brick.y + brick.height / 2,
                  dy: 2,
                  type: brick.powerUp,
                  color: brick.color,
                  icon: brick.powerUp[0].toUpperCase(),
                });
              }
            } else {
              createParticles(ball.x, ball.y, brick.color, 5);
            }
          }
        });

        // Portal collisions
        gameState.portals.forEach((portal, index) => {
          const dist = Math.sqrt(
            (ball.x - portal.x) ** 2 + (ball.y - portal.y) ** 2
          );
          if (dist < portal.radius + ball.radius && portal.cooldown <= 0) {
            // Teleport to other portal
            const otherPortal = gameState.portals[1 - index];
            ball.x = otherPortal.x;
            ball.y = otherPortal.y;
            portal.cooldown = 60;
            otherPortal.cooldown = 60;

            createParticles(portal.x, portal.y, portal.color, 20);
            createParticles(
              otherPortal.x,
              otherPortal.y,
              otherPortal.color,
              20
            );
          }
        });
      });

      // Update particles
      gameState.particles = gameState.particles.filter((particle) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.dy += 0.1;
        particle.life -= 0.02;
        particle.alpha = particle.life;
        particle.radius *= 0.98;
        return particle.life > 0;
      });

      // Update power-ups
      gameState.powerUps = gameState.powerUps.filter((powerUp) => {
        powerUp.y += powerUp.dy;

        // Check paddle collision
        const paddleTop = CANVAS_HEIGHT - PADDLE_HEIGHT - 20;
        const paddleBottom = CANVAS_HEIGHT - 20;

        if (
          powerUp.y + 10 >= paddleTop &&
          powerUp.y - 10 <= paddleBottom &&
          powerUp.x >= gameState.paddleX &&
          powerUp.x <= gameState.paddleX + gameState.paddleWidth
        ) {
          activatePowerUp(powerUp.type);
          createParticles(powerUp.x, powerUp.y, powerUp.color, 15);
          return false;
        }

        return powerUp.y < CANVAS_HEIGHT;
      });

      // Update portals
      gameState.portals.forEach((portal) => {
        if (portal.cooldown > 0) portal.cooldown--;

        portal.particles.forEach((particle) => {
          particle.angle += particle.speed;
          particle.alpha = 0.5 + Math.sin(particle.angle * 3) * 0.3;
        });
      });

      // Update UI
      setScore(gameState.score);
      setLives(gameState.lives);
      setCoins(gameState.coins);
      setCombo(gameState.combo);
      setMaxCombo(gameState.maxCombo);
      setSpeedIncrease(
        Math.round(
          ((gameState.balls[0]?.currentSpeed || BASE_BALL_SPEED) /
            BASE_BALL_SPEED -
            1) *
            100
        )
      );

      // Check win/lose conditions
      if (gameState.balls.length === 0) {
        gameState.lives--;
        gameState.combo = 0;

        if (gameState.lives <= 0) {
          gameState.gameState = "gameOver";
          setGameState("gameOver");
        } else {
          // Reset speed on life loss
          resetBallSpeed();

          // Create new ball
          gameState.balls.push({
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 100,
            dx: 0,
            dy: 0,
            radius: 8,
            baseSpeed: BASE_BALL_SPEED,
            currentSpeed: BASE_BALL_SPEED,
            bounceCount: 0,
            trail: [],
            sticky: false,
            attached: true,
            color: "#00ff88",
          });
        }
      }

      if (gameState.bricks.length === 0) {
        gameState.gameState = "levelComplete";
        // Star rating based on remaining lives
        gameState.starRating = gameState.lives;
        setStarRating(gameState.starRating);
        setGameState("levelComplete");
      }
    },
    [activatePowerUp, createParticles, resetBallSpeed]
  );
  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const gameState = gameStateRef.current;

    if (!canvas || !ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#0f0f23");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw particles
    gameState.particles.forEach((particle) => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw portals
    gameState.portals.forEach((portal) => {
      // Draw portal particles
      portal.particles.forEach((particle) => {
        const x = portal.x + Math.cos(particle.angle) * particle.radius;
        const y = portal.y + Math.sin(particle.angle) * particle.radius;

        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = portal.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw portal center
      ctx.globalAlpha = portal.cooldown > 0 ? 0.3 : 0.8;
      const portalGradient = ctx.createRadialGradient(
        portal.x,
        portal.y,
        0,
        portal.x,
        portal.y,
        portal.radius
      );
      portalGradient.addColorStop(0, portal.color);
      portalGradient.addColorStop(1, "transparent");
      ctx.fillStyle = portalGradient;
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw bricks
    gameState.bricks.forEach((brick) => {
      if (brick.hitAnimation > 0) {
        brick.hitAnimation -= 0.1;
        ctx.save();
        ctx.translate(brick.x + brick.width / 2, brick.y + brick.height / 2);
        ctx.scale(1 + brick.hitAnimation * 0.1, 1 + brick.hitAnimation * 0.1);
        ctx.translate(
          -(brick.x + brick.width / 2),
          -(brick.y + brick.height / 2)
        );
      }

      const healthPercent = brick.health / brick.maxHealth;
      ctx.fillStyle = brick.color;
      ctx.globalAlpha = 0.5 + healthPercent * 0.5;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      // Draw crack effect for damaged bricks
      if (brick.health < brick.maxHealth) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(brick.x + brick.width * 0.3, brick.y);
        ctx.lineTo(brick.x + brick.width * 0.7, brick.y + brick.height);
        ctx.stroke();
      }

      if (brick.hitAnimation > 0) {
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;

    // Draw power-ups
    gameState.powerUps.forEach((powerUp) => {
      ctx.fillStyle = powerUp.color;
      ctx.globalAlpha = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
      ctx.fillRect(powerUp.x - 15, powerUp.y - 10, 30, 20);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(powerUp.icon, powerUp.x, powerUp.y + 4);
    });
    ctx.globalAlpha = 1;

    // Draw balls with trails
    gameState.balls.forEach((ball) => {
      // Draw trail
      ball.trail.forEach((point, index) => {
        ctx.globalAlpha = point.alpha * 0.3;
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(
          point.x,
          point.y,
          ball.radius * (index / ball.trail.length),
          0,
          Math.PI * 2
        );
        ctx.fill();
      });

      // Draw ball with glow effect
      ctx.globalAlpha = 1;
      const ballGradient = ctx.createRadialGradient(
        ball.x,
        ball.y,
        0,
        ball.x,
        ball.y,
        ball.radius * 2
      );
      ballGradient.addColorStop(0, ball.color);
      ballGradient.addColorStop(0.5, ball.color);
      ballGradient.addColorStop(1, "transparent");
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw ball core
      ctx.fillStyle = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw ball highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Draw paddle with gradient
    const paddleGradient = ctx.createLinearGradient(
      gameState.paddleX,
      0,
      gameState.paddleX + gameState.paddleWidth,
      0
    );
    paddleGradient.addColorStop(0, "#00ff88");
    paddleGradient.addColorStop(0.5, "#00ffff");
    paddleGradient.addColorStop(1, "#00ff88");
    ctx.fillStyle = paddleGradient;
    ctx.fillRect(
      gameState.paddleX,
      CANVAS_HEIGHT - PADDLE_HEIGHT - 20,
      gameState.paddleWidth,
      PADDLE_HEIGHT
    );

    // Draw paddle highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(
      gameState.paddleX,
      CANVAS_HEIGHT - PADDLE_HEIGHT - 20,
      gameState.paddleWidth,
      3
    );
  }, []);
  // Game loop
  const gameLoop = useCallback(
    (currentTime) => {
      const gameState = gameStateRef.current;

      if (gameState.lastTime === 0) {
        gameState.lastTime = currentTime;
      }

      gameState.deltaTime = currentTime - gameState.lastTime;
      gameState.lastTime = currentTime;

      if (gameState.gameState === "playing") {
        update(gameState.deltaTime);
      }

      render();
      requestRef.current = requestAnimationFrame(gameLoop);
    },
    [update, render]
  );
  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    const gameState = gameStateRef.current;

    switch (e.key) {
      case " ":
      case "Space":
        e.preventDefault();
        if (gameState.gameState === "menu") {
          gameState.gameState = "playing";
          setGameState("playing");
        } else if (gameState.gameState === "playing") {
          // Launch ball
          gameState.balls.forEach((ball) => {
            if (ball.attached) {
              ball.attached = false;
              ball.dx = (Math.random() - 0.5) * 6;
              ball.dy = -BASE_BALL_SPEED;
            }
          });
        }
        break;
      case "ArrowLeft":
        if (gameState.gameState === "playing") {
          gameState.paddleX = Math.max(0, gameState.paddleX - 20);
        }
        break;
      case "ArrowRight":
        if (gameState.gameState === "playing") {
          gameState.paddleX = Math.min(
            CANVAS_WIDTH - gameState.paddleWidth,
            gameState.paddleX + 20
          );
        }
        break;
      case "p":
      case "P":
        if (gameState.gameState === "playing") {
          gameState.gameState = "paused";
          setGameState("paused");
        } else if (gameState.gameState === "paused") {
          gameState.gameState = "playing";
          setGameState("playing");
        }
        break;
    }
  }, []);
  // Handle mouse input
  const handleMouseMove = useCallback((e) => {
    const gameState = gameStateRef.current;
    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const scaleX = CANVAS_WIDTH / rect.width;

    if (gameState.gameState === "playing") {
      gameState.paddleX = Math.max(
        0,
        Math.min(
          CANVAS_WIDTH - gameState.paddleWidth,
          mouseX * scaleX - gameState.paddleWidth / 2
        )
      );
    }
  }, []);
  // Initialize canvas and start game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    initGame();
    requestRef.current = requestAnimationFrame(gameLoop);

    // Event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [initGame, gameLoop, handleKeyDown, handleMouseMove]);
  // Handle restart
  const handleRestart = () => {
    initGame();
  };
  // Handle next level
  const handleNextLevel = () => {
    const gameState = gameStateRef.current;
    gameState.level++;
    gameState.balls = [];
    gameState.particles = [];
    gameState.powerUps = [];

    // Create new ball
    gameState.balls.push({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 100,
      dx: 0,
      dy: 0,
      radius: 8,
      baseSpeed: BASE_BALL_SPEED,
      currentSpeed: BASE_BALL_SPEED,
      bounceCount: 0,
      trail: [],
      sticky: false,
      attached: true,
      color: "#00ff88",
    });

    createLevel(gameState.level);
    gameState.gameState = "playing";
    setLevel(gameState.level);
    setGameState("playing");
  };
  // Handle back to home
  const handleBackToHome = () => {
    window.location.href = "#/";
  };
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4"
    >
      <div className="bg-black/50 backdrop-blur-lg rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2">
            🎮 Smash Tiles
          </h1>
          <p className="text-gray-300">Level {level}</p>
        </div>

        <div className="flex gap-8 items-start">
          {/* Game Canvas */}
          <div className="flex-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                className="border-4 border-purple-500/50 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  width: `${CANVAS_WIDTH}px`,
                  height: `${CANVAS_HEIGHT}px`,
                  maxWidth: "100%",
                  height: "auto",
                }}
              />

              {/* Game Overlays */}
              {gameState === "menu" && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                      🎮 Ready to Play?
                    </h2>
                    <p className="text-xl text-gray-300 mb-6">
                      Press SPACE to start
                    </p>
                    <div className="text-gray-400 space-y-2">
                      <p>🖱️ Move mouse or use ← → arrows to control paddle</p>
                      <p>⬆️ Launch ball with SPACE</p>
                      <p>⏸️ Press P to pause</p>
                      <p>
                        📈 Speed increases {SPEED_INCREMENT * 100}% per bounce!
                      </p>
                    </div>
                    <button
                      onClick={handleBackToHome}
                      className="mt-6 px-6 py-2 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all"
                    >
                      ← Back to Home
                    </button>
                  </div>
                </div>
              )}

              {gameState === "paused" && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                      ⏸️ Game Paused
                    </h2>
                    <p className="text-xl text-gray-300 mb-4">
                      Press P to resume
                    </p>
                    <div className="text-yellow-400 text-lg">
                      Speed Boost: +{speedIncrease}%
                    </div>
                  </div>
                </div>
              )}

              {gameState === "gameOver" && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-red-500 mb-4">
                      💥 Game Over!
                    </h2>
                    <p className="text-2xl text-white mb-2">
                      Final Score: {score}
                    </p>
                    <p className="text-xl text-gray-300 mb-2">
                      Max Combo: {maxCombo}x
                    </p>
                    <p className="text-lg text-yellow-400 mb-6">
                      Max Speed Boost: +{speedIncrease}%
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleRestart}
                        className="px-8 py-3 bg-linear-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
                      >
                        🔄 Play Again
                      </button>
                      <button
                        onClick={handleBackToHome}
                        className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all"
                      >
                        ← Home
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {gameState === "levelComplete" && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-green-500 mb-4">
                      🎉 Level Complete!
                    </h2>
                    <div className="flex justify-center gap-2 mb-4">
                      {[1, 2, 3].map((star) => (
                        <span
                          key={star}
                          className={`text-4xl ${
                            star <= starRating
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <p className="text-xl text-white mb-2">Score: {score}</p>
                    <p className="text-lg text-gray-300 mb-2">
                      Coins Earned: {coins}
                    </p>
                    <p className="text-lg text-yellow-400 mb-6">
                      Final Speed Boost: +{speedIncrease}%
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleNextLevel}
                        className="px-8 py-3 bg-linear-to-r from-green-500 to-blue-500 text-white rounded-full font-semibold hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                      >
                        ➡️ Next Level
                      </button>
                      <button
                        onClick={handleBackToHome}
                        className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-all"
                      >
                        ← Home
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Game Stats */}
          <div className="w-80">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Score</span>
                <span className="text-2xl font-bold text-white">
                  {score.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Level</span>
                <span className="text-2xl font-bold text-white">{level}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Lives</span>
                <div className="flex gap-1">
                  {Array.from({ length: gameStateRef.current.maxLives }).map(
                    (_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < lives ? "text-red-500" : "text-gray-600"
                        }`}
                      >
                        ❤️
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Combo</span>
                <span
                  className={`text-2xl font-bold ${
                    combo > 5 ? "text-orange-400" : "text-white"
                  }`}
                >
                  {combo}x
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Coins</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {coins} 🪙
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Speed Boost</span>
                <span
                  className={`text-xl font-bold ${
                    speedIncrease > 50
                      ? "text-red-400"
                      : speedIncrease > 20
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  +{speedIncrease}%
                </span>
              </div>

              {/* Active Power-ups */}
              {activePowerUps.size > 0 && (
                <div className="border-t border-white/20 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Active Power-ups
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(activePowerUps).map((powerUp) => (
                      <span
                        key={powerUp}
                        className="px-3 py-1 bg-purple-500/30 border border-purple-400/50 rounded-full text-xs text-purple-300"
                      >
                        {powerUp.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
