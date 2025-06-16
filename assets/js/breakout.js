(function(global){
  let gameActive = false;
  let canvas, ctx, animationId;
  let paddle, ball;
  let keyLeft = false, keyRight = false;

  function draw(){
    animationId = requestAnimationFrame(draw);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(paddle.x, canvas.height - paddle.h, paddle.w, paddle.h);
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fillStyle = 'red';
    ctx.fill();
    if(ball.x + ball.dx < ball.r || ball.x + ball.dx > canvas.width - ball.r) ball.dx = -ball.dx;
    if(ball.y + ball.dy < ball.r) ball.dy = -ball.dy;
    else if(ball.y + ball.dy > canvas.height - paddle.h - ball.r){
      if(ball.x > paddle.x && ball.x < paddle.x + paddle.w) ball.dy = -ball.dy;
      else global.stopBreakout();
    }
    ball.x += ball.dx;
    ball.y += ball.dy;
    if(keyLeft) paddle.x = Math.max(0, paddle.x - paddle.speed);
    if(keyRight) paddle.x = Math.min(canvas.width - paddle.w, paddle.x + paddle.speed);
  }

  function handleKey(e){
    if(!gameActive) return;
    const code = e.keyCode || e.which;
    if(code === 37){ keyLeft = e.type==='keydown'; e.preventDefault(); }
    if(code === 39){ keyRight = e.type==='keydown'; e.preventDefault(); }
  }

  global.startBreakout = function(){
    if(gameActive) global.stopBreakout();
    canvas = document.getElementById('breakout-canvas');
    if(!canvas) return;
    ctx = canvas.getContext('2d');
    paddle = {w:60,h:10,x:(canvas.width-60)/2,speed:4};
    ball = {x:canvas.width/2,y:canvas.height-30,dx:2,dy:-2,r:5};
    gameActive = true;
    document.addEventListener('keydown', handleKey);
    document.addEventListener('keyup', handleKey);
    draw();
  };

  global.stopBreakout = function(){
    gameActive = false;
    cancelAnimationFrame(animationId);
    document.removeEventListener('keydown', handleKey);
    document.removeEventListener('keyup', handleKey);
  };
})(window);