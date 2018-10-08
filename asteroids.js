const HEIGHT = 480;
const WIDTH = 540;


//putting canvas on the screen
var screen = document.createElement('canvas');
var screenCtx = screen.getContext('2d');
screen.height = HEIGHT;
screen.width = WIDTH;
document.body.appendChild(screen);
var sfx = document.getElementById("sfx");

//Creating a back buffer
var backBuffer = document.createElement('canvas');
var backBufferCtx = screen.getContext('2d');
backBuffer.height = HEIGHT;
backBuffer.width = WIDTH;

//public game state variables
var start = null;
var level = 1;
var lives = 3;
var gameover = false;
var score = 0;

//list that holds asteroids
var asteroids = [];

//list of bullets
var bullets = [];

//spaceship
var ship = {
  //spaceship should start around the center of the screen
  color: "red",
  x: WIDTH / 2 ,
  y: HEIGHT / 2,
  height: 20,
  half: 10,
  dir: 90 / 180 * Math.PI, // direction in radians
  rot: 0,
  boosting: false,
  recentlyhit: false,
  explosion: 0,
  warp: 0,
  canwarp: true,
  reload: true,
  thrust: {
    x: 0,
    y: 0
  }
}

var currentInput = {
  space: false,
  left: false,
  right: false,
  up: false,
  r: false,
  warp: false
}

var priorInput = {
  space: false,
  left: false,
  right: false,
  up: false,
  r: false,
  warp: false
}

/** @function handleKeydown
  * Event handler for keydown events
  * @param {KeyEvent} event - the keydown event
  */
function handleKeydown(event) {
  switch(event.key) {
    case ' ':
    case 'Space':
      currentInput.space = true;
      break;
    case 'ArrowLeft':
    case 'a':
      currentInput.left = true;
      break;
    case 'ArrowRight':
    case 'd':
      currentInput.right = true;
      break;
    case 'ArrowUp':
    case 'w':
        currentInput.up = true;
        break;
    case 'r':
      currentInput.r = true;
      break;
    case 'f':
      currentInput.warp = true;
      break;
  }
}

//attach keydown evend to the window
window.addEventListener('keydown', handleKeydown);


/** @function handleKeyup
  * Event handler for keyup events
  * @param {KeyEvent} event - the keyup event
  */
function handleKeyup(event) {
  switch(event.key) {
    case ' ':
    case 'Space':
      currentInput.space = false;
      ship.reload = true;
      break;
    case 'ArrowLeft':
    case 'a':
      currentInput.left = false;
      break;
    case 'ArrowRight':
    case 'd':
      currentInput.right = false;
      break;
    case 'ArrowUp':
    case 'w':
      currentInput.up = false;
      break;
    case 'r':
      currentInput.r = false;
      break;
    case 'f':
      currentInput.warp = false;
      break;
  }
}

// Attach keyup event handler to the window
window.addEventListener('keyup', handleKeyup);

/** @function loop
  * The main game loop
  * @param {DomHighResTimestamp} timestamp - the current system time,
  * in milliseconds, expressed as a double.
  */
function loop(timestamp) {
  if(!gameover){
    if(!start) start = timestamp;
    var elapsedTime = timestamp - start;
    start = timestamp;
    pollInput();
    update(elapsedTime, backBufferCtx);
    render(backBufferCtx,elapsedTime);
    screenCtx.drawImage(backBuffer,0,0);
    window.requestAnimationFrame(loop);
  }else{
    //if game is over then display gave over message
    screenCtx.drawImage(backBuffer,0,0);

    window.requestAnimationFrame(loop);
    //if player wants to play again, reset all game state variables
    if(currentInput.r){

      score = 0;
      level = 1;
      lives = 3;
      ship = {
        //spaceship should start around the center of the screen
        color: "red",
        x: WIDTH / 2 ,
        y: HEIGHT / 2,
        height: 20,
        half: 10,
        dir: 90 / 180 * Math.PI, // direction in radians
        rot: 0,
        boosting: false,
        recentlyhit: false,
        explosion: 0,
        warp: 0,
        canwarp: true,
        reload: true,
        thrust: {
          x: 0,
          y: 0
        }
      }
      asteroids = [];
      bullets = [];
      gameover = false;
      spawnAsteroids(3);
    }
  }
}

/** @function pollInput
  * Copies the current input into the previous input
  */
function pollInput() {
  priorInput = JSON.parse(JSON.stringify(currentInput));
}

/** @function update
  * Updates the game's state
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function update(elapsedTime, ctx) {
  //warp ship to random location if f is presed, gives some invulcnaribilty frames
  if(currentInput.warp && ship.canwarp){
    ship.x = Math.floor(Math.random() * (WIDTH - 20)) + 20;
    ship.y = Math.floor(Math.random() * (HEIGHT - 20)) + 20;
    ship.explosion = 50;
    ship.warp = 500;
    ship.canwarp = false;
    currentInput.warp = false;
  }


  // shoot when spacebar is pressed
  if(currentInput.space && ship.reload) {
    //push bullet into list
    ship.reload = false;
    var bullet = {
      x: ship.x + (4/3) * ship.half * Math.cos(ship.dir),
      y: ship.y - (4/3) * ship.half * Math.sin(ship.dir),
      xvel: 600 * Math.cos(ship.dir) / 60,
      yvel: -600 * Math.sin(ship.dir) / 60
    }
    bullets.push(bullet);

    //add shooting sound
    //play explosion sound
    var sound = document.createElement("audio");
    sound.src = "shoot.wav";
    sound.type = "audio/wav";
    sound.autoplay = "true";
    sfx.innerHTML = '';
    sfx.appendChild(sound);

  }

  //stop boosting
  if(!currentInput.up){
    ship.boosting = false;
  }
  //add velocity forward when up arrow is pressed
  if(currentInput.up){
    ship.boosting = true;
    ship.thrust.x += 4 * Math.cos(ship.dir) / 60;
    ship.thrust.y -= 4 * Math.sin(ship.dir) / 60;

    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    //warp ship if it hits sides
    if(ship.x < 0) ship.x = WIDTH;
    if(ship.x > WIDTH) ship.x = 0;
    if(ship.y < 0) ship.y = HEIGHT;
    if(ship.y > HEIGHT) ship.y = 0;

  }else{
    ship.boosting = false;
    //friction
    ship.thrust.x -= .8 * ship.thrust.x / 60;
    ship.thrust.y -= .8 * ship.thrust.y / 60;
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    //warp ship if it hits sides
    if(ship.x < 0) ship.x = WIDTH;
    if(ship.x > WIDTH) ship.x = 0;
    if(ship.y < 0) ship.y = HEIGHT;
    if(ship.y > HEIGHT) ship.y = 0;
  }
  //move angle counterclockwise when left is pressed
  if(currentInput.left) {
      ship.rot = 360 / 180 * Math.PI /60;
      ship.dir += ship.rot;
  }
  //move angel clockwise when right is pressed
  if(currentInput.right) {
      ship.rot = -360 / 180 * Math.PI /60;
      ship.dir += ship.rot;
  }
}

/** @function render
  * Renders the game into the canvas
  * @param {double} elapsedTime - the amount of time
  * elapsed between frames
  */
function render(ctx, elapsedTime) {
  //clears the screen
  ctx.clearRect(0, 0, WIDTH, HEIGHT);



  //renders the Asteroids
  ctx.fillStyle = "darkgrey";
  asteroids.forEach(function (element){
    //redraw
    ctx.beginPath();
    ctx.moveTo(element.x + element.half * (Math.cos(element.dir)), element.y + element.half * Math.sin(element.dir));
    for(var k =0;k< element.poly;k++){
      ctx.lineTo(element.x + element.half * Math.cos(element.dir + k * Math.PI * 2 / element.poly), element.y + element.half * Math.sin(element.dir + k * Math.PI * 2 / element.poly));
    }
    ctx.fill();
    //move the asteroid based on its velocity
    element.x += element.xvel;
    element.y += element.yvel;

    //check to see collision with spaceship
    if(Math.pow(element.half + ship.half + 2,2) > Math.pow(element.x - ship.x ,2) + Math.pow(element.y - ship.y,2) && ship.recentlyhit == false && ship.explosion <= 0){
      //start invincibility timer && lose a life && make exlposion circle around ship
      ship.explosion = 50;
      if(lives > 0)lives--;
      if(lives == 0) gameover = true;
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.half + 5, Math.PI * 2, false);
      ctx.fill();

      //play explosion sound
      var sound = document.createElement("audio");
      sound.src = "explode.wav";
      sound.type = "audio/wav";
      sound.autoplay = "true";
      sfx.innerHTML = '';
      sfx.appendChild(sound);



      ctx.fillStyle = "darkgrey";
    }

    //check to see collision with other Asteroids


    //if ship is exploding, only worry about explosion
    if(ship.explosion >= 0){
      ship.explosion -= .1 / asteroids.length;
      ship.color = "gold";


    }
    if(ship.explosion <= 0){
       ship.recentlyhit = false;
       ship.color = "red";
       ship.warp -=.1 / asteroids.length;
       if(ship.warp <= 0) ship.canwarp = true;
    }

    //warp asterioid over if it moves to edge
    if(element.x < 0 - element.half) element.x = WIDTH + element.half;
    if(element.x > WIDTH + element.half) element.x = 0 - element.half;
    if(element.y < 0 - element.half) element.y = HEIGHT + element.half;
    if(element.y > HEIGHT + element.half) element.y = 0 - element.half;
  })

  //players space ship
  ctx.fillStyle = ship.color;
  ctx.shadowColor = "#7a2ce0";
  ctx.shadowBlur = "500";
  ctx.beginPath();
  ctx.moveTo(ship.x + (4/3) * ship.half * Math.cos(ship.dir), ship.y - (4/3) * ship.half * Math.sin(ship.dir));
  ctx.lineTo(ship.x - ship.half * ((2/3)*Math.cos(ship.dir) + .75 * Math.sin(ship.dir)), ship.y + ship.half * ((2/3)*Math.sin(ship.dir) - .75 * Math.cos(ship.dir)));
  ctx.lineTo(ship.x - ship.half * ((2/3)*Math.cos(ship.dir) - .75 * Math.sin(ship.dir)), ship.y + ship.half *((2/3)*Math.sin(ship.dir) + .75 * Math.cos(ship.dir)));
  ctx.fill();

  //adds trail behind ship if player is boosting
  if(ship.boosting){
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.half  *((2/3)*Math.cos(ship.dir) + .25 * Math.sin(ship.dir)), ship.y + ship.half * ((2/3)*Math.sin(ship.dir) - .25*Math.cos(ship.dir)));
    ctx.lineTo(ship.x - ship.half *((5/3)*Math.cos(ship.dir)), ship.y + ship.half * ((5/3)*Math.sin(ship.dir)));
    ctx.lineTo(ship.x - ship.half * ((2/3)*Math.cos(ship.dir) - .25 * Math.sin(ship.dir)), ship.y + ship.half *((2/3)*Math.sin(ship.dir) + .25*Math.cos(ship.dir)));
    ctx.fill();
  }

  //renders bullets
  bullets.forEach(function (element){
    //draw the the circle

    ctx.fillStyle = "yellow"
    ctx.beginPath();
    ctx.arc(element.x, element.y, 3, 0, Math.PI * 2, false);
    ctx.fill();

    //update the locations
    element.x += element.xvel;
    element.y += element.yvel;

    //check for collison or hit edge of screen
    if(element.x <= 0 || element.x >= WIDTH)bullets.splice(bullets.indexOf(element), 1 );
    if(element.y <= 0 || element.y >= HEIGHT)bullets.splice(bullets.indexOf(element), 1 );

    asteroids.forEach(function(aster){
        if(Math.pow(aster.half + 4, 2) > Math.pow(element.x - aster.x ,2) + Math.pow(element.y - aster.y,2)){
          if(aster.mass <= 20){
            asteroids.splice(asteroids.indexOf(aster),1);
            score+= 35;
          }else{
            asteroids.push(Asteroid(aster.x + aster.mass/ 4,aster.y - aster.mass/ 4,aster.mass / 2));
            asteroids[asteroids.length - 1].xvel = element.xvel / Math.abs(element.xvel) * -4* 300 / asteroids[asteroids.length - 1].mass / 60;
            asteroids[asteroids.length - 1].yvel = element.yvel / Math.abs(element.yvel) * 4* 300 / asteroids[asteroids.length - 1].mass / 60;
            asteroids.push(Asteroid(aster.x - aster.mass /4,aster.y + aster.mass /4,aster.mass / 2));
            asteroids[asteroids.length - 1].xvel = element.xvel / Math.abs(element.xvel)* 4* 300 / asteroids[asteroids.length - 1].mass / 60;
            asteroids[asteroids.length - 1].yvel = element.yvel / Math.abs(element.yvel)* -4* 300 / asteroids[asteroids.length - 1].mass/ 60;
            asteroids.splice(asteroids.indexOf(aster),1);
            score+=15;
          }
          if(asteroids.length === 0){
            ship.canwarp = true;
            score+= 100 * level;
            level++;
            spawnAsteroids(2 + level);
          }
          bullets.splice(bullets.indexOf(element), 1);
        }
    }, element)

  })

  //updates the ui
  if(!gameover){
  ctx.font = '16pt Segoe UI';
  ctx.fillStyle = "green";
  ctx.strokeStyle = "white";
  ctx.fillText("Lives: " + lives + " ---- Level: " + level + "---- Score: " + score, 20, 20);
  ctx.strokeText("Lives: " + lives + " ---- Level: " + level + "---- Score: " + score, 20, 20);
  ctx.strokeText("Warp( F ): " + (ship.canwarp ? "Ready!":"Not Ready!"), WIDTH / 2 - 70, HEIGHT - 20);
}else{
  ctx.font = '16pt Segoe UI';
  ctx.fillStyle = 'white';
  ctx.strokeStyle = "white"
  ctx.fillText("GAME OVER! (Press R to restart) --- Score: " + score, 20, 20);
}
}

//Asteroid object
function Asteroid(ax, ay, m){
  var aster = {
    x: ax,
    y: ay,
    mass: m,
    xvel: 4* 300 / m / 60 * (Math.random() > .5 ? 1: -1),
    yvel: 4* 300 / m / 60 * (Math.random() > .5 ? 1: -1),
    half: m,
    dir: Math.random() * 2 * Math.PI,
    poly: Math.floor(Math.random() * 5) + 5 // random number of sides
  }
  return aster;
}

//spawns x number of asteroids
function spawnAsteroids(n){
  asteroids = [];
  var x,y;
  for(var i =0; i<n;i++){
    do{
      x = Math.floor(Math.random() * WIDTH);
      y = Math.floor(Math.random() * HEIGHT);
    }while(50000 > Math.pow(x - ship.x ,2) + Math.pow(y - ship.y,2))
    aster = Asteroid(x, y, (120*Math.random()) + 20);
    asteroids.push(aster);
  }
}

// Start the game loop
spawnAsteroids(3);
window.requestAnimationFrame(loop);
