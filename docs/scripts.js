var UNITS;
var HERO;

const map = document.createElement('div');
map.style.width = '100vw';
map.style.height = '100vh';
map.style.margin = 'none';
map.style.backgroundSize = 'contain';
map.style.backgroundImage = 'url("assets/background.png")';
document.body.appendChild(map);


function makeId(str){
	let id = str+Math.round(Math.random()*10000);
	while(Object.keys(UNITS).includes(id.toString())){
		id = str+Math.round(Math.random()*10000);
	}
	return id;
}


class Handler{
	constructor(){
		this.units = {};
	}

	animate(){
		for(let unit of Object.values(this.units)){
			unit.animate();
			this.collide(unit);
		}
	}


	collide(me){
				for(let unit of Object.values(this.units)){
					if (unit.x < me.x + me.w && unit.x + unit.w > me.x &&	unit.y < me.y + me.h &&	unit.h + unit.y > me.y){me.contact(unit)};
				}
	}

}

class Menu{
	constructor(x, y, w, h, onclick = undefined, parent = document.body){
			this.dom = document.createElement('div');
			this.dom.style.position = 'absolute';
			this.dom.style.left = x+'px';
			this.dom.style.top = y+'px';
			this.dom.style.height = h+'px';
			this.dom.style.width = w+'px';
			this.dom.className = 'menu';
			this.dom.style.backgroundColor = 'grey';

			this.dom.onclick = onclick;

			parent.appendChild(this.dom);
	}

	updateOnclick(func){
		this.dom.onclick = func;
	}

	clear(){
		this.dom.remove();
	}
}



class Unit{
	constructor(x, y, w, h, img, dx = 0, dy = 0){
			this.x = x;
			this.y = y;
			this.w = w;
			this.h = h;
			this.img = 'url("assets/'+img+'.png")';
			this.id = makeId(this.constructor.name);
			this.dx = dx;
			this.dy = dy;

			UNITS.units[this.id] = this;

			this.div = document.createElement('div');
			this.div.style.position = 'absolute';
			this.div.id = this.id;
			map.appendChild(this.div);

			this.xbind = [100, 800];
			this.ybind = [0, 300-this.h];

	}

	animate(){
		this.move();
		this.render();
	}

	move(){
		this.x += this.dx;
		if(this.x < this.xbind[0]){this.x = this.xbind[0]}else if(this.x+this.w > this.xbind[1]){this.x = this.xbind[1]-this.w};
		this.y += this.dy;
		if(this.y < this.ybind[0]){this.y = this.ybind[0]}else if(this.y > this.ybind[1]){this.y = this.ybind[1]};
	}

	render(){
		this.div.style.left = this.x+'px';
		this.div.style.top = this.y+'px';
		this.div.style.width = this.w+'px';
		this.div.style.height = this.h+'px';
		this.div.style.backgroundImage = this.img;
	}

	contact(unit){
		if(unit.id == this.id){return}
	}

	damage(amt){
		this.hp -= amt;
		if(this.hp <= 0){this.destroy()}
	}

	destroy(){
		this.div.remove();
		if(this.alive){clearInterval(this.alive)};
		delete UNITS[this.id];
	}

}



class HpBar{
	constructor(max, hp){
		this.div = document.createElement('div');

		this.div.style.position = 'absolute';
		this.div.style.left = '270px';
		this.div.style.top = '320px';
		this.div.style.width = '400px';
		this.div.style.height = '50px';
		this.div.style.backgroundColor = 'red';
		this.div.style.borderRadius = '10px';
		this.div.style.borderStyle = 'solid';
		document.body.appendChild(this.div);

		this.amt = document.createElement('div');
		this.amt.style.width = '400px';
		this.amt.style.height = '50px';
		this.amt.style.backgroundColor = 'green';
		this.amt.style.borderRadius = '10px';
		this.div.appendChild(this.amt);

		this.max = max;
		this.hp = hp;

	}

	update(hp){
		let w = hp/this.max;
		w*=100;
		this.amt.style.width = w+'%';
	}

	gain(amt){

	}
}


class Hero extends Unit{
	constructor(x, y, w, h, img, dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.ybind = [0,180];

		this.sword = new MeleeAttack(this, this.x+this.w, 280, 50, 20, 'test');
		this.sword.ybind = [h/2, 210];

		this.hp = 20;
		this.spd = 2;
		this.damageCD = 2000;
		this.unhitable = false;
		this.hpbar = new HpBar(this.hp, this.hp);
	}

	left(){
		this.dx = this.spd*-1;
		this.sword.x = this.x-this.sword.w;
	}
	right(){
		this.dx = this.spd;
		this.sword.x = this.x+this.w;
	}
	jump(){
		let me = this;
		me.dy = -2;
		setTimeout(function(){me.fall(me)}, 600);
	}
	hop(){
		let me = this;
		this.dy = -2;
		setTimeout(function(){me.fall(me)}, 300);
	}
	fall(me){
		me.dy = 2;
	}

	contact(unit){
		if(unit.id == this.id){return}
		if(unit.enemy){this.damage(unit)}
	}

	damage(unit){
		if(this.unhitable){return};
		this.hp-=unit.dmg;
		this.hpbar.update(this.hp);
		if(this.hp < 0){gameOver()}
		this.unhitable = true;
		this.resetState(this.damageCD);
	}

	resetState(time){
		let me = this;
		setTimeout(function(){
			me.unhitable = false;
		}, time)
	}
}


class Enemy extends Unit{
	constructor(x, y, w, h, img, dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.spawn();
		GAME.Ecount++;
		this.enemy = true;
		this.ybind = [-200, 800]


	}
	contact(unit){
		if(unit.id == this.id){return}
		if(unit.enemy){return}
		if(unit.constructor.name.includes('Attack')){
			this.destroy(); return;
		}
	}

	activate(me){
		me.dy = 0;
		me.ybind = [0, this.y]
		me.seekPlayer(me);
		me.ready = true;
	}

	activateFlying(me){
		me.dy = 0;
		me.ybind = [this.y, 350]
		me.seekPlayer(me);
		me.ready = true;
	}

	activateSide(me){
		me.dx = 0;
		console.log(me.dx);
		me.ybind = [0, this.y];
		me.ready = true;
		me.xbind = [100, 800];
	}


	animate(){
		this.ability();
		this.move();
		this.render();
	}

	ability(){
	if(this.ready){
			if(this.constructor.name == 'Turret'){console.log(this)}
			this.ready = false;
			let me = this;
			setTimeout(function(){me.ready = true}, this.abilityCD);
			this.seekPlayer();
			let action = Math.round(Math.random()*this.abilities.length)-1;
			if(action <= 0){action = 1};
			this.abilities[action]();
	}}

	seekPlayer(){
		if(this.x < HERO.x){this.dx = this.spd}
		if(this.x > HERO.x){this.dx = this.spd*-1}
	}

	nothing(){

	}

	stop(){
		let me = this[0];
		me.dx = 0;
		setTimeout(function(){me.ready = true}, 1000);
	}

	grab(){
		let me = this[0];
		this[0].dy = -2;
		setTimeout(function(){me.dy = 2}, 3000);
		setTimeout(function(){me.dy = 0}, 300);
	}
	jump(){
		let me = this[0];
		this[0].dy = -2;
		setTimeout(function(){me.fall(me)}, 600);
	}
	fall(me){
		me.dy = 2;
	}

	crash(){
		let me = this[0];
		me.dy = 2;
		me.dx = 0;
		setTimeout(function(){me.rise(me)}, 600);
	}
	swoop(){
		let me = this[0];
		this[0].dy = 2;
		setTimeout(function(){me.rise(me)}, 600);
	}
	rise(me){
		me.dy = -2;
	}

	hop(){
		let me = this[0];
		this[0].dy = -2;
		setTimeout(function(){me.fall(me)}, 300);
	}

	swap(){
		let me = this[0];
		me.dx*=(-1);
	}

	fire(){
		let me = this[0];
		let fix = 0;
		if(me.dir > 0){fix = me.w+me.dir}else{fix = me.dir};
		me.atk = new RangedAttack(me.x+fix, me.y, me.dir);
		me.atk.enemy = true;
		me.atk.dmg = me.dmg;
	}

	destroy(){
		this.div.remove();
		if(this.alive){clearInterval(this.alive)};
		delete UNITS[this.id];
		this.x = undefined;
		GAME.kill();

	}

}

class Slime extends Enemy{
	constructor(x, y = 300, w = 50, h = 50, img = 'normalSlime', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 1;
		this.dmg = 5;
		this.abilityCD = 3000;
		this.abilities = [this, this.nothing, this.nothing, this.stop, this.jump];
	}

	spawn(){
		let me = this;
		me.dy = -1;
		setTimeout(function(){me.activate(me)}, 700)
	}
}

class SlimeB extends Enemy{
	constructor(x, y = 380, w = 70, h = 50, img = 'largeSlime', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 1;
		this.dmg = 5;
		this.abilityCD = 3000;
		this.abilities = [this, this.nothing, this.nothing, this.stop, this.jump, this.hop];
	}

	spawn(){
		let me = this;
		me.dy = -1;
		setTimeout(function(){me.activate(me)}, 700)
	}
}

class SlimeC extends Enemy{
	constructor(x, y = 380, w = 50, h = 50, img = 'eliteSlime', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 2;
		this.dmg = 5;
		this.abilityCD = 2000;
		this.abilities = [this, this.nothing, this.nothing, this.stop, this.jump];
	}

	spawn(){
		let me = this;
		me.dy = -1;
		setTimeout(function(){me.activate(me)}, 700)
	}
}

class SlimeD extends Enemy{
	constructor(x, y = 380, w = 50, h = 50, img = 'slimeSupreme', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 2;
		this.dmg = 5;
		this.abilityCD = 2000;
		this.abilities = [this, this.nothing, this.nothing, this.stop, this.jump, this.hop, this.swap];
	}

	spawn(){
		let me = this;
		me.dy = -1;
		setTimeout(function(){me.activate(me)}, 700)
	}
}

class Floater extends Enemy{
	constructor(x, y = -50, w = 50, h = 50, img = 'skull', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 0;
		this.dmg = 3;
		this.abilityCD = 3000;
		this.abilities = [this, this.nothing, this.crash];
	}

	spawn(){
		let me = this;
		me.dy = 1;
		setTimeout(function(){me.activateFlying(me)}, 1000)
	}
}

class FloaterB extends Enemy{
	constructor(x, y = -50, w = 75, h = 50, img = 'flathead', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 0;
		this.dmg = 5;
		this.abilityCD = 2000;
		this.abilities = [this, this.nothing, this.crash];
	}

	spawn(){
		let me = this;
		me.dy = 1;
		setTimeout(function(){me.activateFlying(me)}, 1000)
	}
}

class FloaterC extends Enemy{
	constructor(x, y = -50, w = 50, h = 50, img = 'eliteSkull', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 1;
		this.dmg = 5;
		this.abilityCD = 3000;
		this.abilities = [this, this.nothing, this.crash];
	}

	spawn(){
		let me = this;
		me.dy = 1;
		setTimeout(function(){me.activateFlying(me)}, 1000)
	}
}

class Grabber extends Enemy{
	constructor(x, y = 450, w = 50, h = 75, img = 'spear', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 0;
		this.dmg = 5;
		this.abilityCD = 4000;
		this.abilities = [this, this.nothing, this.grab];
	}

	spawn(){
		let me = this;
		me.dy = -1;
		setTimeout(function(){me.activate(me)}, 500)
	}
}

class GrabberB extends Enemy{
	constructor(x, y = 450, w = 50, h = 75, img = 'claw', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 1;
		this.dmg = 5;
		this.abilityCD = 4000;
		this.abilities = [this, this.nothing, this.grab];
	}

	spawn(){
		let me = this;
		me.dy = -1;
		setTimeout(function(){me.activate(me)}, 500)
	}
}

class Flyer extends Enemy{
	constructor(x, y = -50, w = 50, h = 50, img = 'ghost', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 2;
		this.dmg = 3;
		this.abilityCD = 2000;
		this.abilities = [this, this.nothing, this.swoop, this.stop];
	}

	spawn(){
		let me = this;
		me.dy = 1;
		setTimeout(function(){me.activateFlying(me)}, 1000)
	}
}

class FlyerB extends Enemy{
	constructor(x, y = -50, w = 50, h = 50, img = 'eliteGhost', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.hp = 5;
		this.spd = 3;
		this.dmg = 3;
		this.abilityCD = 2000;
		this.abilities = [this, this.nothing, this.swoop, this.swap];
	}

	spawn(){
		let me = this;
		me.dy = 1;
		setTimeout(function(){me.activateFlying(me)}, 1000)
	}
}

class Turret extends Enemy{
	constructor(x, y = 250, w = 75, h = 50, img = 'turret', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.xbind = [-1000, 2000];

		this.hp = 5;
		this.dmg = 5;
		this.spd = 0;
		this.abilityCD = 4000;
		this.abilities = [this, this.fire];
		console.log(this);
	}

	spawn(){
		let me = this;
		if(this.x%2){this.x = 1100; this.dir = -4}else{this.x = -100; this.dir = 4};
		if(me.x < 0){me.dx = 1};
		if(me.x > 1000){me.dx = -1};
		setTimeout(function(){me.activateSide(me)}, 2000)
	}
}

class TurretB extends Enemy{
	constructor(x, y = 250, w = 75, h = 50, img = 'eliteTurret', dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.xbind = [-1000, 2000];

		this.hp = 5;
		this.dmg = 5;
		this.spd = 0;
		this.abilityCD = 3000;
		this.abilities = [this, this.fire];
		console.log(this);
	}

	spawn(){
		let me = this;
		if(this.x%2){this.x = 1100; this.dir = -4}else{this.x = -100; this.dir = 4};
		if(me.x < 0){me.dx = 1};
		if(me.x > 1000){me.dx = -1};
		setTimeout(function(){me.activateSide(me)}, 2000)
	}
}






class MeleeAttack extends Unit{
	constructor(parent, x, y, w, h, img, dx = 0, dy = 0){
		super(x, y, w, h, img, dx, dy);
		this.parent = parent;
		this.xbind = [parent.xbind[0]-this.w, parent.xbind[1]+this.w];
		this.dmg = 5;
	}

	move(){
		this.dx = this.parent.dx;
		this.dy = this.parent.dy;
		this.x += this.dx;
		if(this.x < this.xbind[0]){this.x = this.xbind[0]}else if(this.x+this.w > this.xbind[1]){this.x = this.xbind[1]-this.w};
		this.y += this.dy;
		if(this.y < this.ybind[0]){this.y = this.ybind[0]}else if(this.y > this.ybind[1]){this.y = this.ybind[1]};
	}

}

class RangedAttack extends Unit{
	constructor(x, y, dx, dy = 0, w = 20, h = 20, img = 'test'){
		super(x, y, w, h, img, dx, dy);
		let me = this;
		setTimeout(function(){
			me.div.remove();
			delete UNITS[me.id];
		}, 700);

	}
}



class Game{
	constructor(){
		this.Ecount = 0;
		this.progress = 1;
		this.score = 0;
		this.combo = 0;
		this.turret = false;

		this.enemies = new Object();
		this.enemies[1] = [Slime, Floater, SlimeB, Turret];
		this.enemies[2] = [SlimeB, Flyer, Grabber, Turret];
		this.enemies[3] = [SlimeC, FloaterB, Flyer, Turret];
		this.enemies[4] = [FloaterC, GrabberB, SlimeB, Turret];
		this.enemies[5] = [SlimeD, FlyerB, GrabberB, TurretB];

	}

	spawn(){
		let pool = Math.ceil(GAME.progress/50);
		console.log(GAME.progress)
		GAME.pool = GAME.enemies[pool];

		let E = GAME.Ecount;
		if(E >= 15){return};
		if(E >= 10){new GAME.pool[1](Math.round(Math.random()*800)+100);};
		if(E >= 5){new GAME.pool[2](Math.round(Math.random()*800)+100);};
		if(E <= 5){new GAME.pool[0](Math.round(Math.random()*800)+100);};
	}

	kill(){
		this.Ecount--;
		this.progress++;
	}
}



function makeEnemy(){
	let E = Math.round(Math.random()*(ENEMIES.length-1));
	new ENEMIES[E](Math.round(Math.random()*800)+100);
}



function animateGame(){
	UNITS.animate();
	window.requestAnimationFrame(animateGame);
}

function newgame(){
	this.remove();

	GAME = new Game();
	UNITS = new Handler();
	HERO = new Hero(450, 250, 30, 80, 'test', 2);

  window.requestAnimationFrame(animateGame);

	new Menu(30, 300, 100, 100, function(){HERO.left()});
	new Menu(150, 300, 100, 100, function(){HERO.right()});
	new Menu(770, 300, 100, 100, function(){HERO.jump()});
	new Menu(640, 300, 100, 100, function(){HERO.hop()});

	setInterval(GAME.spawn, 1000);

}

new Menu(50, 50, 100, 50, newgame);
