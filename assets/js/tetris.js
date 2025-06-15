// Simple Tetris implementation
// Controls: arrows to move, Q/W to rotate


(function(global){
  let gameActive = false;
  let animationId;
  let handleKey;

  global.startTetris = function(){
    if (gameActive) global.stopTetris();
    gameActive = true;
    init();
  };

global.stopTetris = function(){
    gameActive = false;
    if (animationId) cancelAnimationFrame(animationId);
    if (handleKey) {
      document.removeEventListener('keydown', handleKey);
      handleKey = null;
    }
  };



  function init(){
    const canvas = document.getElementById('tetris-canvas');
    if(!canvas) return;
    const context = canvas.getContext('2d');
    const grid = 20;
    const cols = canvas.width / grid;
    const rows = canvas.height / grid;

    const colors = [null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
    const pieces = 'TJLOSZI';

    function arenaSweep() {
      outer: for (let y = rows - 1; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          if (!arena[y][x]) continue outer;
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y++;
        player.score += 10;
        updateScore();
      }
    }

    function collide(arena, player) {
      const m = player.matrix;
      const o = player.pos;
      for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
          if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
            return true;
          }
        }
      }
      return false;
    }

    function createMatrix(w, h) {
      const matrix = [];
      while (h--) {
        matrix.push(new Array(w).fill(0));
      }
      return matrix;
    }

    function createPiece(type) {
      switch (type) {
        case 'T': return [
          [0, 0, 0],
          [1, 1, 1],
          [0, 1, 0],
        ];
        case 'O': return [
          [2, 2],
          [2, 2],
        ];
        case 'L': return [
          [0, 3, 0],
          [0, 3, 0],
          [0, 3, 3],
        ];
        case 'J': return [
          [0, 4, 0],
          [0, 4, 0],
          [4, 4, 0],
        ];
        case 'I': return [
          [0, 5, 0, 0],
          [0, 5, 0, 0],
          [0, 5, 0, 0],
          [0, 5, 0, 0],
        ];
        case 'S': return [
          [0, 6, 6],
          [6, 6, 0],
          [0, 0, 0],
        ];
        case 'Z': return [
          [7, 7, 0],
          [0, 7, 7],
          [0, 0, 0],
        ];
      }
    }

    function drawMatrix(matrix, offset) {
      matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            context.fillStyle = colors[value];
            context.fillRect((x + offset.x) * grid, (y + offset.y) * grid, grid, grid);
          }
        });
      });
    }

    function draw() {
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);

      drawMatrix(arena, {x:0, y:0});
      drawMatrix(player.matrix, player.pos);
    }

    function merge(arena, player) {
      player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            arena[y + player.pos.y][x + player.pos.x] = value;
          }
        });
      });
    }

    function rotate(matrix, dir) {
      for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
          [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
      }
      if (dir > 0) matrix.forEach(row => row.reverse());
      else { matrix.reverse(); }
    }

    function playerDrop() {
      player.pos.y++;
      if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
      }
      dropCounter = 0;
    }

    function playerMove(dir) {
      player.pos.x += dir;
      if (collide(arena, player)) {
        player.pos.x -= dir;
      }
    }

    function playerReset() {
      const type = pieces[pieces.length * Math.random() | 0];
      player.matrix = createPiece(type);
      player.pos.y = 0;
      player.pos.x = (cols / 2 | 0) - (player.matrix[0].length / 2 | 0);
      if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
      }
    }

    function playerRotate(dir) {
      const pos = player.pos.x;
      let offset = 1;
      rotate(player.matrix, dir);
      while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
          rotate(player.matrix, -dir);
          player.pos.x = pos;
          return;
        }
      }
    }

    let dropCounter = 0;
    let dropInterval = 600;
    let lastTime = 0;

    function update(time = 0) {
      const delta = time - lastTime;
      lastTime = time;
      dropCounter += delta;
      if (dropCounter > dropInterval) {
        playerDrop();
      }
      draw();
      animationId = requestAnimationFrame(update);
    }

    function updateScore() {
      const el = document.getElementById('tetris-score');
      if (el) el.textContent = 'Score: ' + player.score;
    }

    handleKey = function(event){
      if (!gameActive) return;
      const code = event.keyCode;
      if ([37,38,39,40].includes(code)) event.preventDefault();
      if (code === 37) {
        playerMove(-1);
      } else if (code === 39) {
        playerMove(1);
      } else if (code === 40) {
        playerDrop();
      } else if (code === 81) {
        playerRotate(-1);
      } else if (code === 87) {
        playerRotate(1);
      }
    };
    document.addEventListener('keydown', handleKey);

    const arena = createMatrix(cols, rows);
    const player = {pos: {x:0, y:0}, matrix: null, score:0};
    playerReset();
    updateScore();
    update();
  }
})(window);