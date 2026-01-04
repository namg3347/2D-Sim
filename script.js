const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.font = "16px Arial";

let RIGHT, LEFT, UP, DOWN; //direction booleans
const Balls = [];

let ballnum = 0; // ball number
let density = 1; // density...is assumed same for every ball
let fricCoeff = 0.1;
let staticCoeff = 0.2; // larger than kinetic
let gravity = 10;

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v) {
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mult(n) {
        return new Vector(this.x * n, this.y * n);
    }

    div(n) {
        return new Vector(this.x / n, this.y / n);
    }
    mag() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    unit() {
        let m = this.mag();
        if (m == 0) {
            return new Vector(0, 0);
        }
        else return this.div(m);
    }

    normal() {
        return new Vector(-this.y, this.x);
    }

    static dot(v1, v2) {
        return (v1.x * v2.x) + (v1.y * v2.y);
    }

    static angle(v1, v2) {
        return Math.acos(Vector.dot(v1, v2) / (v1.mag() * v2.mag()));
    }

    drawVec(start_x, start_y, n, colour) {
        ctx.beginPath();
        ctx.moveTo(start_x, start_y);
        ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
        ctx.strokeStyle = colour;
        ctx.fillText(
            this.mag().toFixed(2), start_x + (this.x * n) + 5, start_y + (this.y * n) - 5
        );
        ctx.fillStyle = "white";
        ctx.stroke();
    }

}

class Ball {
    constructor(x, y, r, colour) {
        this.position = new Vector(x, y)//position vector
        this.r = r;//radius of ball
        this.vel = new Vector(0, 0)//velocity vector
        this.force = new Vector(0, 0);//force vector
        this.acc = 2;//acceleration magnitude
        this.m = density * Math.PI * (Math.pow(r, 2)); //mass
        this.fk = fricCoeff * this.m * gravity;//max kinetic friction
        this.fs = staticCoeff * this.m * gravity;// static friction
        this.colour = colour;
        Balls.push(this);
    }
    drawBall() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.r, 0, 2 * Math.PI);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = this.colour;
        ctx.fill();
    }

    move() { //moving

        this.force = new Vector(0, 0);

        if (LEFT) this.force.x = -this.acc * this.m;
        if (RIGHT) this.force.x = this.acc * this.m;
        if (UP) this.force.y = -this.acc * this.m;
        if (DOWN) this.force.y = this.acc * this.m;

        //net force
        let netForce = this.force.mag();

        //speed
        let speed = this.vel.mag();

        //static friction
        if (speed < 0.1 && netForce < this.fs) {
            this.force = new Vector(0, 0);
            this.vel = new Vector(0, 0);
        }
        //kinetic friction
        else if (speed > 0.1) {
            let friction = this.vel.div(speed).mult(-this.fk)

            let maxFriction = this.vel.mag() * this.m;

            // to ensure friction can't reverse velocity (clamp)
            if (friction.mag() > maxFriction) {
                friction = this.vel.mult(-this.m);
            }

            this.force = this.force.add(friction);
        }

        //calc velocity
        this.vel = this.vel.add(this.force.div(this.m));

        // snap tiny velocities to 0
        //epsilon cutoff
        if (Math.abs(this.vel.x) < 0.01) this.vel.x = 0;
        if (Math.abs(this.vel.y) < 0.01) this.vel.y = 0;

        //calc position
        this.position = this.position.add(this.vel);

        //boundary
        if (this.position.x - this.r < 0) this.position.x = this.r;
        if (this.position.x + this.r > canvas.width) this.position.x = canvas.width - this.r;
        if (this.position.y - this.r < 0) this.position.y = this.r;
        if (this.position.y + this.r > canvas.height) this.position.y = canvas.height - this.r;
    }

    display() {
        //acceleration vector
        this.force.div(this.m).drawVec(this.position.x, this.position.y, 20, "green");

        //velocity vector
        this.vel.drawVec(this.position.x, this.position.y, 10, "white");
    }
}

//collision detection
function coll_det_bb(b1, b2) {
    return (b1.r + b2.r >= b2.position.sub(b1.position).mag());
}

//penetration response 
function pen_res_bb(b1, b2) {
    let dist = b1.position.sub(b2.position);
    console.log("cal dist");
    let pen_depth = b1.r + b2.r - dist.mag();
    let pen_res = dist.unit().mult(pen_depth / 2);
    b1.position = b1.position.add(pen_res);
    b2.position = b2.position.add(pen_res.mult(-1));
}

//elastic collision
function coll_res_bb(b1,b2) {
    let normal = b1.position.sub(b2.position).unit();
    let relVel = b1.vel.sub(b2.vel);
    let sepVel = Vector.dot(relVel,dist);
    let new_sepVel = -sepVel;

    let sepVelVec = normal.mult(new_sepVel);

    b1.vel = b1.vel.add(sepVelVec);
    b2.vel = b2.vel.add(sepVelVec.mult(-1));


}

canvas.addEventListener("keydown", function (e) { //when arrow keys are pressed
    if (e.code === "ArrowLeft") {
        LEFT = true;
    }
    if (e.code === "ArrowUp") {
        UP = true;
    }
    if (e.code === "ArrowRight") {
        RIGHT = true;
    }
    if (e.code === "ArrowDown") {
        DOWN = true;
    }
});
canvas.addEventListener("keyup", function (e) { //when arrow keys are released
    if (e.code === "ArrowLeft") {
        LEFT = false;
    }
    if (e.code === "ArrowUp") {
        UP = false;
    }
    if (e.code === "ArrowRight") {
        RIGHT = false;
    }
    if (e.code === "ArrowDown") {
        DOWN = false;
    }
});

canvas.addEventListener("keydown", function (e) {//ball selection
    if (e.code.startsWith("Digit")) {
        let index = parseInt(e.code.charAt(5)) - 1;
        if (Balls[index]) ballnum = index;
    }
});

const ball1 = new Ball(100, 100, 20, "red");
const ball2 = new Ball(150, 150, 40, "blue");
const ball3 = new Ball(200, 200, 30, "aqua");
function mainLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); //clear old frame
    Balls[ballnum].move();//move selected ball (update)
    Balls.forEach((b,index) => {
        b.drawBall();//draw updated ball
        b.display();//display vectors
        //collision
        for(let i =  index+ 1; i < Balls.length; i++) {
            if (coll_det_bb(Balls[index], Balls[i])) {
                pen_res_bb(Balls[index], Balls[i]);
            }
        }

    });
    requestAnimationFrame(mainLoop); //repeat
}
requestAnimationFrame(mainLoop);

