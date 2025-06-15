(function(global){
  let gameActive = false;
  let canvas, ctx, animationId;
  let snake, apple, grid = 20, count = 0, dir = 'right';

  function randomPos(max){
    return Math.floor(Math.random() * (max / grid)) * grid;
  }

  function onKey(e){
    if(!gameActive) return;
    const code = e.keyCode;
    if([37,38,39,40].includes(code)) e.preventDefault();
    if(code === 37 && dir !== 'right') dir = 'left';
    else if(code === 38 && dir !== 'down') dir = 'up';
    else if(code === 39 && dir !== 'left') dir = 'right';
    else if(code === 40 && dir !== 'up') dir = 'down';
  }

  function loop(){
    animationId = requestAnimationFrame(loop);
    if(++count < 4) return;
    count = 0;
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    snake.x += dir==='left'? -grid : dir==='right'? grid : 0;
    snake.y += dir==='up'? -grid : dir==='down'? grid : 0;

    if(snake.x < 0) snake.x = canvas.width - grid;
    if(snake.x >= canvas.width) snake.x = 0;
    if(snake.y < 0) snake.y = canvas.height - grid;
    if(snake.y >= canvas.height) snake.y = 0;

    snake.cells.unshift({x: snake.x, y: snake.y});
    if(snake.cells.length > snake.maxCells) snake.cells.pop();

    ctx.fillStyle = 'red';
    ctx.fillRect(apple.x, apple.y, grid-1, grid-1);

    ctx.fillStyle = '#0f0';
    snake.cells.forEach(function(cell, index){
      ctx.fillRect(cell.x, cell.y, grid-1, grid-1);
      if(cell.x === apple.x && cell.y === apple.y){
        snake.maxCells++;
        apple.x = randomPos(canvas.width - grid);
        apple.y = randomPos(canvas.height - grid);
      }
      for(let i=index+1; i<snake.cells.length; i++){
        if(cell.x === snake.cells[i].x && cell.y === snake.cells[i].y){
          global.stopSnake();
        }
      }
    });
  }

  global.startSnake = function(){
    if(gameActive) global.stopSnake();
    canvas = document.getElementById('snake-canvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d');
    snake = {x:160, y:160, cells:[], maxCells:4};
    apple = {x:randomPos(canvas.width - grid), y:randomPos(canvas.height - grid)};
    dir = 'right';
    count = 0;
    gameActive = true;
    document.addEventListener('keydown', onKey);
    loop();
  };

  global.stopSnake = function(){
    gameActive = false;
    cancelAnimationFrame(animationId);
    document.removeEventListener('keydown', onKey);
  };
})(window);