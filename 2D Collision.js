// T. Morgan Locks (feat. Lawrence Hook)

// This is my first javascript application ever!

$(document).ready(function() {

	var canvas_base = $('#canvas_one');
	var canvas_two_base = $('#canvas_two');
	var canvas_three_base = $('#canvas_three');
	var canvas = canvas_base.get(0);
	var canvas_two = canvas_two_base.get(0);
	var canvas_three = canvas_three_base.get(0);
	var canvas_context = canvas.getContext("2d");
	var canvas_two_context = canvas_two.getContext("2d");
	var canvas_three_context = canvas_three.getContext("2d");

	var mouse = utils.captureMouse(canvas);

	var windowWidth = canvas_base.width();
	var windowHeight = canvas_base.height();
	
	var const_separation = 0;
	var max_mass_ratio = 2; // add 1 to this; goes from 3:1 to 1:3
	var cp1 = 1;
	var cp2 = 1;

	var rxo = .02; // relative x offset
	var ryo = .02; // relative y offset

	var soxs = rxo; // static_one_x_start
	var soys = ryo; // static_one_y_start
	var soxe = rxo + ((1/3) * (1 - (2 * rxo))); // static_one_x_end
	var soye = soys + .25;

	var aoxs = soxe; // active_one_x_start
	var aoys = soys;
	var aoxe = 1 - rxo;
	var aoye = soye;

	var stxs = rxo; // static_two_x_start
	var stys = soye + ryo;
	var stxe = soxe;
	var stye = stys + .25;

	var atxs = stxe; // active_two_x_start
	var atys = stys;
	var atxe = aoxe;
	var atye = stye;

	var ball_two_y = atys + (atye - atys)/2;
	var ball_two_x = atxs + (atxe - atxs)/2;

	var cvx = windowWidth;
	var canvas_y = cvx * (stye + .01);

	var isRunning = false;

	var step = 0;
	var timeout = null;

	var ball_1 = null;
	var ball_2 = null;	
	var ball_3 = null;
	var ball_4 = null;

	var ball_distance_scaling_factor = .5;

	var fasttimestep = 1;
	var slowtimestep = 150;
	var active_static_is_1 = true;

	$(window).resize(resizing);

	var startButton = $("#startAnimation");
    var stopButton = $("#stopAnimation");
    var comButton = $("#centerofmass");
    var resetButton = $("#reset");
    var slider = $("#mass_ratio");
    var angleSlider = $("#angle");
    var playSlider = $("#play_slider");

    var shouldStopPlaying = true;
    var displayCenter = false;
	var max_step = 400;
	playSlider.prop({'max': max_step});
	slider.prop({'min': (-1 * max_mass_ratio)});
	slider.prop({'max': max_mass_ratio});

	var main_color = "rgb(0, 120, 0)";//"rgb(80, 80, 80)";
	var text_color = "white";
	var b1_color = "orange";
	var b2_color = "white";
	var com_color = "red"; // change this

	function resizing(){

		windowWidth = canvas_base.width();
		windowHeight = canvas_base.height();

		cvx = windowWidth;

		//recalculate_relative_positions();
	
		canvas_y = cvx * (stye + ryo);

		const_active_radius = 15;
		const_static_radius = 33;

		canvas.width = cvx;
    	canvas.height = canvas_y;

    	div0 = $("#div0");
    	div0.css({"margin-top": canvas_y});
    	canvas_two.width = (aoxe - aoxs) * cvx;
    	canvas_three.width = (aoxe - aoxs) * cvx;
    	canvas_two.height = (aoye - aoys) * cvx;
    	canvas_three.height = (aoye - aoys) * cvx;

    	canvas_two_base.css({"left": aoxs * cvx});
    	canvas_two_base.css({"top": aoys * cvx});
    	canvas_three_base.css({"left": atxs * cvx});
    	canvas_three_base.css({"top": atys * cvx});

		step = 0;
		isRunning = false;

		begin();
	};

	resizing();

	function drawBackground(){

		canvas_context.beginPath();
		canvas_context.rect(0, 0, cvx, canvas_y);
		canvas_context.fillStyle = "rgb(249, 249, 249)";
		canvas_context.fill();

	}
	function drawFullState(){

		drawBackground();

		drawStaticBalls();

		drawBallsInArea(ball_1, ball_2, main_color, canvas_two, canvas_two_context);
		drawBallsInArea(ball_3, ball_4, main_color, canvas_three, canvas_three_context);
		
		drawBorders();
		drawLabels();
		drawStaticLabel();
	};

	function drawLabels(){
		canvas_two_context.fillStyle = text_color;
		canvas_two_context.font = "bold 14px Arial";

		canvas_three_context.fillStyle = text_color;
		canvas_three_context.font = "bold 14px Arial";

		canvas_two_context.fillText("Center of Mass Frame", canvas_two.width / 2 - 75, 18);

		canvas_three_context.fillText("Lab Frame", canvas_three.width / 2 - 36, 18);
	}

	function drawStaticLabel(){
		// needs to be separate from DrawLabels, or it overlaps itself and looks ugly
		canvas_context.fillStyle = text_color;
		canvas_context.font = "bold 14px Arial";

		canvas_context.fillText("(Click and Drag orange ball)", cvx * (soxs + (soxe - soxs)/2) - 95, 
			cvx * stye - 8);
	}

	function drawBorders(){
		drawBorder(cvx * soxs, cvx * soys, cvx * (aoxe - soxs), cvx * (aoye - soys), 1, "black");
		drawBorder(cvx * aoxs, cvx * soys, cvx * (aoxe - aoxs), cvx * (aoye - aoys), 1, "black");

		drawBorder(cvx * stxs, cvx * stys, cvx * (atxe - stxs), cvx * (atye - stys), 1, "black");
		drawBorder(cvx * atxs, cvx * stys, cvx * (atxe - atxs), cvx * (atye - atys), 1, "black");
	}

	function drawTracks(b1, b2, canv, context){	
		var axe = 0;
		var why = 0;

		var tracksA = [];
		var tracksB = [];

		var adj_factor = max_step / 12;
		for (var i = 0; i < step / adj_factor; i++) {
			var ist = i * adj_factor;
			if(ist > max_step/3){
				axe = b1.original_x + Math.cos(b1.post_a) * b1.post_v * ((ist - max_step/3) / (max_step)) * ball_distance_scaling_factor * cvx;
				why = b1.original_y + Math.sin(b1.post_a) * b1.post_v * ((ist - max_step/3) / (max_step)) * ball_distance_scaling_factor * cvx;
			} else {
				axe = b1.original_x - Math.cos(b1.pre_a) * b1.pre_v * ((max_step/3 - ist) / max_step) * ball_distance_scaling_factor * cvx;
				why = b1.original_y - Math.sin(b1.pre_a) * b1.pre_v * ((max_step/3 - ist) / max_step) * ball_distance_scaling_factor * cvx;
			}
			drawDot(axe, why, b1, context);
			tracksA.push(axe);
			tracksA.push(why);
		}

		for (var i = 0; i < step / adj_factor; i++) {
			var ist = i * adj_factor;
			if(ist > max_step/3){
				axe = b2.original_x + Math.cos(b2.post_a) * b2.post_v * ((ist - max_step/3) / (max_step)) * ball_distance_scaling_factor * cvx;
				why = b2.original_y + Math.sin(b2.post_a) * b2.post_v * ((ist - max_step/3) / (max_step)) * ball_distance_scaling_factor * cvx;
			} else {
				axe = b2.original_x - Math.cos(b2.pre_a) * b2.pre_v * ((max_step/3 - ist) / max_step) * ball_distance_scaling_factor * cvx;
				why = b2.original_y - Math.sin(b2.pre_a) * b2.pre_v * ((max_step/3 - ist) / max_step) * ball_distance_scaling_factor * cvx;
			}
			drawDot(axe, why, b2, context);
			tracksB.push(axe);
			tracksB.push(why);
		}

		if(displayCenter){
			// also draw the center of mass tracks of these balls
			for (var i = 0; i < tracksA.length; i+=2){
				axe = (b1.m * tracksA[i] + b2.m * tracksB[i])/(b1.m + b2.m);
				why = (b1.m * tracksA[i + 1] + b2.m * tracksB[i + 1])/(b1.m + b2.m); // ha ha; the height of the centerofmass never changes
				context.beginPath();
				context.arc(axe, why, 2, 0, Math.PI * 2);
				context.fillStyle = com_color;
				context.fill();
				context.closePath();
			}
		}
	}

	function drawDot(axe, why, b, c){
		c.beginPath();
		c.arc(axe, why, 2, 0, Math.PI * 2);
		c.fillStyle = b.color;
		c.fill();
		c.closePath();
	}

	function run(b1, b2, b3, b4){
		if(!(b1 instanceof ball) || !(b2 instanceof ball)){
			console.log(typeof b1);
			console.log(typeof b2);
			console.log("Invalid parameter types (run)");
			return;
		}

		if(step >= max_step){
			halt();
			return;
		}

		if(isRunning){
			step++;
			shouldStopPlaying = false;
			playSlider.val(step);
			playSlider.slider("refresh");
			shouldStopPlaying = true;

			updatePosition(b1);
			updatePosition(b2);
			updatePosition(b3);
			updatePosition(b4);

			drawFullState();
		}

		if(isRunning){
			timeout = setTimeout(function(){ run(b1, b2, b3, b4) }, fasttimestep);
		} else {
			timeout = setTimeout(function(){ run(b1, b2, b3, b4) }, slowtimestep);
		}
	}

	function halt(){
		isRunning = false;
		drawFullState();
		stopButton.hide();
		startButton.show();
	}

	function drawBorder(xmin, ymin, xwid, ywid, rad, color){
		canvas_context.fillStyle = color;

		canvas_context.beginPath();
		canvas_context.rect(xmin - rad, ymin - rad, xwid + 2*rad, rad);		
		canvas_context.fill();
		canvas_context.closePath();

		canvas_context.beginPath();
		canvas_context.rect(xmin - rad, ymin - rad, rad, ywid + 2*rad);
		canvas_context.fill();
		canvas_context.closePath();

		canvas_context.beginPath();
		canvas_context.rect(xmin + xwid, ymin - rad, rad, ywid + 2*rad);
		canvas_context.fill();
		canvas_context.closePath();

		canvas_context.beginPath();
		canvas_context.rect(xmin - rad, ymin + ywid, xwid + 2*rad, rad);
		canvas_context.fill();
		canvas_context.closePath();
	}

	function drawStaticBalls(){

		canvas_context.beginPath();
		canvas_context.rect(cvx * soxs, cvx * soys, cvx * (soxe - soxs), cvx * (soye - soys));
		canvas_context.fillStyle = main_color;
		canvas_context.fill();
		canvas_context.closePath();

		canvas_context.beginPath();
		canvas_context.rect(cvx * stxs, cvx * stys, cvx * (stxe - stxs), cvx * (stye - stys));
		canvas_context.fillStyle = main_color;
		canvas_context.fill();
		canvas_context.closePath();

		drawStaticPair(ball_1, ball_2, cvx * soxs, cvx * soys, cvx * (soxe - soxs), cvx * (soye - soys));
		drawStaticPair(ball_3, ball_4, cvx * stxs, cvx * stys, cvx * (stxe - stxs), cvx * (stye - stys));

	}

	function findStaticLocations(b1, b2, xmin, ymin, xwid, ywid){
		var cx = xmin + (xwid/2);
		var cy = ymin + (ywid/2);

		var h = b2.original_y - b1.original_y;
		var c = const_static_radius * 2 / (const_static_radius / const_active_radius);

		if(Math.abs(h) > Math.abs(c)){
			h = c * Math.abs(h) / h; // accounts for small floating point rounding errors
		}

		var angler = Math.asin(h / c);
		var a1 = Math.PI + angler;
		var a2 = angler;

		b1.static_x = cx + const_static_radius * Math.cos(a1);
		b1.static_y = cy + const_static_radius * Math.sin(a1);

		b2.static_x = cx + const_static_radius * Math.cos(a2);
		b2.static_y = cy + const_static_radius * Math.sin(a2);

	}

	function drawStaticPair(b1, b2, xmin, ymin, xwid, ywid){
		//draw the relative collision position of two balls in the middle of the given area
		findStaticLocations(b1, b2, xmin, ymin, xwid, ywid);

		drawBall(b1.color, b1.static_x, b1.static_y, const_static_radius, canvas_context);
		drawBall(b2.color, b2.static_x, b2.static_y, const_static_radius, canvas_context);

		//TODO: draw arrows
	}

	function drawBallsInArea(b1, b2, color, canv, context){
		context.beginPath();
		context.rect(0, 0, canv.width, canv.height);
		context.fillStyle = color;
		context.fill();

		drawTracks(b1, b2, canv, context);
		if(displayCenter){
			drawCOM(b1, b2, context);
		}

		drawBall(b1.color, b1.x, b1.y, b1.r, context);
		drawBall(b2.color, b2.x, b2.y, b1.r, context);
	}

	function drawCOM(b1, b2, context){
		var axe = (b1.m * b1.x + b2.m * b2.x)/(b1.m + b2.m);
		var why = (b1.m * b1.y + b2.m * b2.y)/(b1.m + b2.m);
		drawBall(com_color, axe, why, 5, context);
	}

	function drawBall(col, tarx, tary, rad, context){
		context.beginPath();
		context.arc(tarx, tary, rad+1, 0, Math.PI * 2);
		context.fillStyle = "black";
		context.fill();
		context.closePath();

		context.beginPath();
		context.arc(tarx, tary, rad, 0, Math.PI * 2);
		context.fillStyle = col;
		context.fill();
		context.closePath();
	}

	function overlaps(x, y, xp, yp){
		return ((x - xp) * (x - xp) + (y - yp) * (y - yp) < const_active_radius * const_active_radius);
	}

	function ball(x_, y_, v_, a_, m_, r_, c_){
		//ball(x, y, velocity, angle, mass, radius, color)
		this.x = x_;
		this.y = y_;
		this.original_x = x_;
		this.original_y = y_;
		this.pre_v = v_;
		this.pre_a = a_;
		this.post_v = 0;
		this.post_a = 0;
		this.m = m_;
		this.r = r_;
		this.color = c_;
		this.hasCollided = false;
		this.static_x;// the location of the static drawing of this ball
		this.static_y;
	}

	function colliding(b1, b2){
		if(Math.sqrt((b1.x - b2.x) * (b1.x - b2.x) + (b1.y - b2.y) * (b1.y - b2.y)) < (b1.r + b2.r)){
			return true;
		}
		return false;
	}

	function calculateCollision(b1, b2){
		if(b1.hasCollided && b2.hasCollided){
				// do nothing (if only one has collided, something is wrong)
			} else {
				if(Math.sin(b1.pre_a) > 0.00001 || Math.sin(b1.pre_a) < -0.00001 || Math.sin(b2.pre_a) > 0.00001 || Math.sin(b2.pre_a) < -0.00001){
					console.log("Vertical movement when colliding is illegal!");
					console.log(Math.sin(b1.a));
					console.log(Math.sin(b2.a));
					return;
				}
				// first, determine adjustment vectors so that center of mass is "stationary"
				// this will always be strictly horizontal, because balls don't start in non-horizontal directions
				var mom_center = (b1.m * b1.pre_v * Math.cos(b1.pre_a) + b2.m * b2.pre_v * Math.cos(b2.pre_a))/(b1.m + b2.m);	

				b1.post_v = b1.pre_v;
				b1.post_a = b1.pre_a;
				b2.post_v = b2.pre_v;
				b2.post_a = b2.pre_a;

				adjustMotionByVector(b1, -1 * mom_center, 0);
				adjustMotionByVector(b2, -1 * mom_center, 0);
				// we have now normalized the motion of the balls; the center of mass is not moving.
				// so calculate the new angles of deflection
				var h = b2.y - b1.y;
				var c = b1.r + b2.r;
				var angler = Math.asin(h / c);
				// time to make the changes!
				// because these are perfectly elastic collisions with special conditions, velocity stays the same (makes it easy)
				// and we don't need to add angles or anything because we already know balls move only horizontally.
				b1.post_a = Math.PI + 2 * angler;
				b2.post_a = 2 * angler;
				
				adjustMotionByVector(b1, mom_center, 0);
				adjustMotionByVector(b2, mom_center, 0);
				
			}
	}

	function stepCollision(b1, b2){
		if(b1.hasCollided && b2.hasCollided){
			b1.x += b1.post_v * Math.cos(b1.post_a);
			b1.y += b1.post_v * Math.sin(b1.post_a);

			b2.x += b2.post_v * Math.cos(b2.post_a);
			b2.y += b2.post_v * Math.sin(b2.post_a);
		} else {
			b1.x += b1.pre_v * Math.cos(b1.pre_a);
			b1.y += b1.pre_v * Math.sin(b1.pre_a);

			b2.x += b2.pre_v * Math.cos(b2.pre_a);
			b2.y += b2.pre_v * Math.sin(b2.pre_a);
		}

		if(colliding(b1, b2)){
			// swap to post_collision properties
			b1.hasCollided = true;
			b2.hasCollided = true;
		}
	}

	function adjustMotionByVector(b1, xadj, yadj){
		// units? What units? Haven't got any of those around here!
		xv = Math.cos(b1.post_a) * b1.post_v;
		yv = Math.sin(b1.post_a) * b1.post_v;

		xvn = xv + xadj;
		yvn = yv + yadj;
		an = Math.atan(yvn / xvn);
		if (xvn < 0){
			an += Math.PI;
		}

		vn = Math.sqrt(xvn *  xvn + yvn * yvn);
		b1.post_a = an;
		b1.post_v = vn;
	}

	stopButton.hide();
    startButton.click(function () {
        $(this).hide();
        stopButton.show();

        if(step >= max_step){
        	shouldStopPlaying = false;
        	isRunning = true;
        	begin();
        } else {
	        isRunning = true;
	        begin_dirty();
	    }
    });

    stopButton.click(function () {
		halt();
    });

    resetButton.click(function () {
    	// const_separation = 0; // do not reset the alignment of the balls; we could, but you could also just refresh the page. It feels wrong.
		begin();
    });

    comButton.click(function () {
    	if(displayCenter){
    		// stop displaying center, change text
    		document.getElementById("comlabel").innerHTML = "Display Center of Mass";
    		displayCenter = false;
    		drawFullState();
    	} else {
    		//start displaying center, change text
    		document.getElementById("comlabel").innerHTML = "Hide Center of Mass";
    		displayCenter = true;
    		drawFullState();
    	}

    });

    slider.change(function () {
        var tmr = Number($(this).val());

        // calculate the actual masses from this
        if(tmr == 0){
        	cp1 = 1;
        	cp2 = 1;
        } else if (tmr < 0){
        	cp1 = 1;
        	cp2 = tmr * -1 + 1;
        } else {
        	cp1 = tmr + 1;
        	cp2 = 1;
        }
		// write those to the screen
		document.getElementById("bmass").innerHTML = "(Orange) " + cp2 + " : " + cp1 + " (White)";
        begin();
    });

    angleSlider.change(function () {
    	if(isDragging){ // if this method is being called because the balls are being dragged, we don't need to do anything else

    	} else {
	    	var degrees = Number($(this).val());
	    	var angle = ((degrees) / 180) * Math.PI + Math.PI;

			const_separation =  -2 * const_static_radius * Math.sin(angle) / (const_static_radius / const_active_radius);
			document.getElementById("bangle").innerHTML = degrees + "&#176;";
			halt();		
			begin();
		}
    });

    playSlider.change(function () {
    	// this is called every tick of "run" when we refresh the playSlider
    	if(shouldStopPlaying){
    		halt();
    	}
    	shouldStopPlaying = true;
        step = Number($(this).val());
        begin_filthy();
    });

    function mouseX(){
    	var rect = canvas_base.offset();//canvas.getBoundingClientRect();
    	return mouse.x - rect.left;
    }

    function mouseY(){
    	var rect = canvas_base.offset();//canvas.getBoundingClientRect();
    	return mouse.y - rect.top;
    }

	canvas.addEventListener('mousedown', function () {

		var dx1 = (mouseX() - ball_1.static_x);
		var dy1 = (mouseY() - ball_1.static_y);

		var dx2 = (mouseX() - ball_3.static_x);
		var dy2 = (mouseY() - ball_3.static_y);

		var distance1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var distance2 = Math.sqrt(dx2*dx2 + dy2*dy2);

		// Moving shotBall
		if (distance1 < const_static_radius) {
			active_static_is_1 = true;
			canvas.addEventListener('mouseup', onMouseUp, false);
			canvas.addEventListener('mousemove', dragBall, false);
		} else if (distance2 < const_static_radius) {
			active_static_is_1 = false;
			canvas.addEventListener('mouseup', onMouseUp, false);
			canvas.addEventListener('mousemove', dragBall, false);
		}
	}, false);

	function onMouseUp () {
		canvas.removeEventListener('mouseup', onMouseUp, false);
		canvas.removeEventListener('mousemove', dragBall, false);
		canvas.removeEventListener('touchend', onMouseUp, false);
		canvas.removeEventListener('touchmove', dragBallTouch, false);
		drawFullState();
	}

	var isDragging = false;

	function dragBall(event){

		var xdiff = 0;
		var ydiff = 0;
		var cx = 0;
		var cy = 0;

		if(active_static_is_1){
			cx = cvx * ((soxs + soxe)/2);
			cy = cvx * ((soys + soye)/2);
			xdiff = mouseX() - cx;
			ydiff = mouseY() - cy;
		} else {
			cx = cvx * ((stxs + stxe)/2);
			cy = cvx * ((stys + stye)/2);
			xdiff = mouseX() - cx;
			ydiff = mouseY() - cy;
		}

		var angle = Math.atan(ydiff / xdiff);
		if (xdiff < 0){
			angle += Math.PI;
		} else {
			if(ydiff >= 0){
				angle = Math.PI/2;
			} else {
				angle = - Math.PI/2;
			}
		}

		// update the angle slider
		var degrees = ((angle * 180) / Math.PI) - 180;
		if(degrees == -270){
			degrees = 90;
		}
		isDragging = true;
		angleSlider.val(degrees);
		angleSlider.slider("refresh");
		isDragging = false;

		const_separation = -2 * const_static_radius * Math.sin(angle) / (const_static_radius / const_active_radius);
		document.getElementById("bangle").innerHTML = $(angleSlider).val() + "&#176;";
		halt();
		
		begin();
	}

	canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        touchWasMoved(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
    }, false);

	function touchWasMoved(x_, y_) {
		var dx1 = (x_ - ball_1.static_x);
		var dy1 = (y_ - ball_1.static_y);

		var dx2 = (x_ - ball_3.static_x);
		var dy2 = (y_ - ball_3.static_y);

		var distance1 = Math.sqrt(dx1*dx1 + dy1*dy1);
		var distance2 = Math.sqrt(dx2*dx2 + dy2*dy2);

		// Moving shotBall
		if (distance1 < const_static_radius * 2) {
			dragBallTouch(1, x_, y_);
		} else if (distance2 < const_static_radius * 2) {
			dragBallTouch(2, x_, y_);
		}
	}

	var count = 0;

	function dragBallTouch(group, x_, y_){

		canvas_context.clearRect(cvx * soxs, cvx * soys, cvx * (soxe - soxs), cvx * (soye - soys));
		canvas_context.clearRect(cvx * stxs, cvx * stys, cvx * (stxe - stxs), cvx * (stye - stys));

		var xdiff = 0;
		var ydiff = 0;
		var cx = 0;
		var cy = 0;

		if(group == 1){
			cx = cvx * ((soxs + soxe)/2);
			cy = cvx * ((soys + soye)/2);
			xdiff = x_ - cx;
			ydiff = y_ - cy;
		} else {
			cx = cvx * ((stxs + stxe)/2);
			cy = cvx * ((stys + stye)/2);
			xdiff = x_ - cx;
			ydiff = y_ - cy;
		}

		angle = Math.atan(ydiff / xdiff);
		if (xdiff < 0){
			angle += Math.PI;
		} else {
			if(ydiff >= 0){
				angle = Math.PI/2;
			} else {
				angle = - Math.PI/2;
			}
		}
		const_separation =  -2 * const_static_radius * Math.sin(angle) / (const_static_radius / const_active_radius);
		document.getElementById("bangle").innerHTML = $(angleSlider).val() + "&#176;";

		halt();		
		begin();
	}

	function begin(){
		// test collision

		var h = const_separation;
		var c = 2 * const_active_radius;
		var angler = Math.asin(h / c);

		var xoff = const_active_radius * Math.cos(angler);
		var yoff = const_active_radius * Math.sin(angler);

		ball_x = cvx * (aoxe - aoxs) / 2;
		ball_y = cvx * (aoye - aoys) / 2;

		// x, y, v, a, m, r, c
		ball_1 = new ball(ball_x - xoff, ball_y - yoff, 1 / cp2, 0, cp2, const_active_radius, b1_color);
		ball_2 = new ball(ball_x + xoff, ball_y + yoff, 1 / cp1, Math.PI, cp1, const_active_radius, b2_color);

		ball_3 = new ball(ball_x - xoff, ball_y - yoff, 1, 0, cp2, const_active_radius, b1_color);
		ball_4 = new ball(ball_x + xoff, ball_y + yoff, 0, 0, cp1, const_active_radius, b2_color);

		calculateCollision(ball_1, ball_2);
		calculateCollision(ball_3, ball_4);

		step = 0;
		playSlider.val(step);
		playSlider.slider("refresh"); // calls begin_filthy, no need to update beforehand

		clearTimeout(timeout);

		updatePosition(ball_1); // yes, these were just called by refreshing... unless the slider hasn't changed. Not doubling up is complicated.
		updatePosition(ball_2);
		updatePosition(ball_3);
		updatePosition(ball_4);
		
		drawFullState();
		run(ball_1, ball_2, ball_3, ball_4);
	}

	function begin_dirty(){
		updatePosition(ball_1);
		updatePosition(ball_2);
		updatePosition(ball_3);
		updatePosition(ball_4);

		clearTimeout(timeout);
		
		drawFullState();
		run(ball_1, ball_2, ball_3, ball_4);
	}

	function begin_filthy(){
		// Do NOT call run from here! This is to be used in the middle of run when a change is made to the playback slider
		updatePosition(ball_1);
		updatePosition(ball_2);
		updatePosition(ball_3);
		updatePosition(ball_4);
		drawFullState();
	}

	function updatePosition(b1){
		if(step > max_step/3){
			b1.x = b1.original_x + Math.cos(b1.post_a) * b1.post_v * ((step - max_step/3) / (max_step)) * ball_distance_scaling_factor * cvx;
			b1.y = b1.original_y + Math.sin(b1.post_a) * b1.post_v * ((step - max_step/3) / (max_step)) * ball_distance_scaling_factor * cvx;
		} else {
			b1.x = b1.original_x - Math.cos(b1.pre_a) * b1.pre_v * ((max_step/3 - step) / max_step) * ball_distance_scaling_factor * cvx;
			b1.y = b1.original_y - Math.sin(b1.pre_a) * b1.pre_v * ((max_step/3 - step) / max_step) * ball_distance_scaling_factor * cvx;
		}
	}

})