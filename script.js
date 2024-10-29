const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 1200;  // 게임 화면 크기 설정
canvas.height = 700;

let score = 0;
let lives = 3;
let gameOver = false;
let isJumping = false;
let jumpHeight = 70;
let jumpSpeed = -18;
let groundY = canvas.height - 100; // 바닥 높이 조정
let obstacles = [];
let enemies = [];
let enemyKeys = [];
let enemyKeyCount = 0;
let enemyDirectionKeys = [];
let enemyImageIndex = -1;
let showingKeyImages = false;
let canSpawn = true;
let obstacleCooldown = 0;
let enemyCooldown = 0;
let gameStarted = false; // 게임 시작 여부

// 이미지 로드
const characterImages = [];
const obstacleImage = new Image();
const enemyImages = [];
const enemyDieImage = new Image();
const directionImages = [];

// 캐릭터 애니메이션 이미지 로드
for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `images/character_run${i}.png`; // 경로 수정
    characterImages.push(img);
}
obstacleImage.src = "images/obstacle.png";
enemyImages.push(new Image());
enemyImages[0].src = "images/enemy1.png";
enemyImages.push(new Image());
enemyImages[1].src = "images/enemy2.png";
enemyDieImage.src = "images/enemy_die.png"; // 적 죽는 이미지 로드

// 방향키 이미지 로드
const directions = ['W', 'A', 'S', 'D'];
directions.forEach((direction, index) => {
    const img = new Image();
    img.src = `images/${direction}.png`; // 경로 수정
    directionImages[index] = img;
});

const player = {
    x: 50,
    y: groundY,
    width: 50,
    height: 50,
    currentFrame: 0, // 현재 프레임 인덱스
    frameCount: 4,   // 총 프레임 수
    frameDelay: 10,  // 프레임 지연 수 (속도 조절을 위해 값 증가)
    frameTimer: 0,   // 프레임 타이머

    jump: function () {
        if (!isJumping) {
            isJumping = true;
            jumpSpeed = -15;
        }
    },
    update: function () {
        if (isJumping) {
            this.y += jumpSpeed;
            jumpSpeed += 1;
            if (this.y >= groundY) {
                this.y = groundY;
                isJumping = false;
            }
        } else {
            // 걷기 애니메이션 업데이트
            this.frameTimer++;
            if (this.frameTimer >= this.frameDelay) {
                this.frameTimer = 0;
                this.currentFrame = (this.currentFrame + 1) % this.frameCount; // 프레임 변경
            }
        }
    },
    draw: function () {
        ctx.drawImage(characterImages[this.currentFrame], this.x, this.y, this.width, this.height);
    }
};

// 장애물과 적 생성
function createObstacle() {
    const obstacle = {
        x: canvas.width,
        y: groundY,
        width: 40,
        height: 40,
    };
    obstacles.push(obstacle);
}

function createEnemy() {
    const enemy = {
        x: canvas.width,
        y: groundY,
        width: 50,
        height: 50,
        isAlive: true,
    };
    enemies.push(enemy);
    enemyImageIndex = Math.floor(Math.random() * enemyImages.length);
    enemyKeyCount = Math.floor(Math.random() * 3) + 3; // 3~5개
    enemyDirectionKeys = Array.from({ length: enemyKeyCount }, () => Math.floor(Math.random() * 4));
    showingKeyImages = true;
}

function startGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    obstacles = [];
    enemies = [];
    enemyKeys = [];
    enemyKeyCount = 0;
    enemyDirectionKeys = [];
    showingKeyImages = false;
    canSpawn = true;
    obstacleCooldown = 0;
    enemyCooldown = 0; // 적 재생성 쿨다운 초기화
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("pressStart").style.display = "none"; // 시작 화면 숨김
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    obstacleCooldown++;
    enemyCooldown++;

    // 장애물 생성
    if (canSpawn && obstacleCooldown >= 180) {
        createObstacle();
        obstacleCooldown = 0;
    }

    // 적 생성 (장애물보다 길게)
    if (canSpawn && enemyCooldown >= 400) {
        createEnemy();
        enemyCooldown = 0; // 재생성 후 쿨다운 초기화
    }

    // 장애물 처리
    obstacles.forEach(obstacle => {
        obstacle.x -= 4;
        ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // 충돌 검사
        if (obstacle.x < player.x + player.width - 10 && 
            obstacle.x + obstacle.width > player.x + 10 && 
            obstacle.y < player.y + player.height - 10 && 
            obstacle.y + obstacle.height > player.y + 10) {
            lives--;
            obstacles.splice(obstacles.indexOf(obstacle), 1);
            if (lives <= 0) {
                gameOver = true;
                drawGameOver();
            }
        }
    });

    // 적 처리
    enemies.forEach(enemy => {
        if (enemy.isAlive) {
            enemy.x -= 3;
            ctx.drawImage(enemyImages[enemyImageIndex], enemy.x, enemy.y, enemy.width, enemy.height);

            if (showingKeyImages) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
                enemyDirectionKeys.forEach((directionIndex, idx) => {
                    ctx.drawImage(directionImages[directionIndex], canvas.width / 2 - 70 + idx * 50, canvas.height / 2 - 30, 40, 40);
                });
            }

            // 적과 충돌한 경우
            if (enemy.x < player.x + player.width - 10 && 
                enemy.x + enemy.width > player.x + 10 && 
                enemy.y < player.y + player.height - 10 && 
                enemy.y + enemy.height > player.y + 10) {
                lives--;
                enemies.splice(enemies.indexOf(enemy), 1); // 적 제거
                showingKeyImages = false;
                if (lives <= 0) {
                    gameOver = true;
                    drawGameOver();
                }
            }
        } else {
            // 적이 죽었을 때
            ctx.drawImage(enemyDieImage, enemy.x, enemy.y, enemy.width, enemy.height);
            // 적 사라짐 처리
            setTimeout(() => {
                enemies.splice(enemies.indexOf(enemy), 1);
            }, 500); // 0.5초 후에 적 제거
        }
    });

    score += 1;
    document.getElementById("score").innerText = `점수: ${score}`;
    document.getElementById("lives").innerText = `목숨: ${lives}`;

    requestAnimationFrame(gameLoop);
}

function drawGameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "black"; // 모든 텍스트 색상 설정
    ctx.fillText("게임 오버!", canvas.width / 2 - 70, canvas.height / 2 - 40); // 위쪽 텍스트
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2 - 70, canvas.height / 2); // 중간 텍스트
    ctx.fillText("스페이스바를 누르면 다시 시작!", canvas.width / 2 - 150, canvas.height / 2 + 40); // 아래쪽 텍스트
    document.getElementById("gameOver").style.display = "block";
}

document.addEventListener("keydown", function (event) {
    if (event.key === " " && !gameStarted) { // 스페이스바로 게임 시작
        gameStarted = true;
        startGame();
    } else if (event.key === " " && gameOver) {
        startGame();
    } else if (event.key === " ") { // 스페이스바로 점프
        player.jump();
    } else if (showingKeyImages && !gameOver) {
        const directionKeys = ['W', 'A', 'S', 'D'];
        if (directionKeys.includes(event.key.toUpperCase())) {
            // 적 처치
            const keyIndex = directionKeys.indexOf(event.key.toUpperCase());
            if (enemyDirectionKeys.length > 0 && enemyDirectionKeys[0] === keyIndex) {
                enemyDirectionKeys.shift();
                if (enemyDirectionKeys.length === 0) {
                    enemies.forEach(enemy => {
                        enemy.isAlive = false; // 적 상태를 죽음으로 변경
                    });
                    showingKeyImages = false;
                }
            }
        }
    }
});
