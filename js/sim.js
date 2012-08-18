

function main_sim() {

	var MPS = 2;

	var FPS = 40;
	var SCALE = 1;

    Number.prototype.clamp = function(min, max) {
        return Math.min(Math.max(this, min), max);
    };

    var CANVAS_WIDTH = 800;   // cm
    var CANVAS_HEIGHT = 600;  // cm
    
	var canvasThing = $("<canvas class='box' width='" + CANVAS_WIDTH + 
        "' height='" + CANVAS_HEIGHT + "'></canvas>");
    
    var canvasElement = canvasThing.get(0);
    
    canvasThing.appendTo('#canvascont');
    
    var canvas = canvasElement.getContext("2d");

    

    
    var sc = function(raw) {
    	return raw * SCALE;
    }



	var rect = function() {
        this.color = "#333";
        this.x = 200;
        this.y = 100;
        this.wi = 4;
        this.hi = 10;

        this.draw = function(th) {
        	
        	
            canvas.fillStyle = this.color;
            // canvas.fillRect(sc(this.x), sc(this.y), sc(this.wi), sc(this.hi));

            var bl = {
            	x: this.x,
            	y: this.y
            };

            var ox = this.wi * Math.cos(th);
            var oy = this.wi * Math.sin(th);

            var tl = {
            	x: bl.x - this.hi * Math.sin(th),
            	y: bl.y - this.hi * Math.cos(th)
            };

            var br = {
            	x: bl.x + ox,
            	y: bl.y - oy
            };

            var tr = {
            	x: tl.x + ox,
            	y: tl.y - oy
            };

            canvas.beginPath();
			canvas.moveTo(sc(bl.x), sc(bl.y));
			canvas.lineTo(sc(tl.x), sc(tl.y));
			canvas.lineTo(sc(tr.x), sc(tr.y));
			canvas.lineTo(sc(br.x), sc(br.y));
			canvas.lineTo(sc(bl.x), sc(bl.y));
			canvas.fill();
			canvas.closePath(); 

        }
    };

	var car = function() {
    	this.wl = new rect();
	    this.wr = new rect();
	    this.wheel_base = 9;
	    this.theta = 0;

	    this.pwml = 0;
	    this.pwmr = 0;

	    this.dirl = 1;
	    this.dirr = 1;

	    var wlTop = 100;  // cm/s
	    var wrTop = 110;
	    
	    this.get_ir = function() {
	    	var ir_err_range = 3;
	    	var ir_range = 40;

	    	if (this.ir > ir_range + ir_err_range) {
	    		return ir_range + ir_err_range;
	    	} 

	    	var ir = this.ir.clamp(0, ir_range);

	    	return Math.round(ir + ir_err_range - Math.random() * 2 * ir_err_range); // +- ir_err_range randomly
	    }

	    this.get_us = function() {
	    	var us_err_range = 7;
	    	var us_range = 200;

	    	if (this.us > us_range + us_err_range) {
	    		return us_range + us_err_range;
	    	} 

	    	var us = this.us.clamp(0, us_range);

	    	return Math.round(us + us_err_range - Math.random() * 2 * us_err_range); // +- us_range randomly
	    }

	    this.pwmToSpeedl = function() {
	    	var p = this.pwml - 80;

	    	if ( p < 0 ) {
	    		p = 0;
	    	}

	    	var grad = wlTop / (255 - 80);

	    	var s = p * grad; 
	    	if (s > wlTop) {
	    		s = wlTop;
	    	}
	    	return s * this.dirl;

	    };

	    this.pwmToSpeedr = function() {
			var p = this.pwmr - 80;

	    	if ( p < 0 ) {
	    		p = 0;
	    	}

	    	var grad = wrTop / (255 - 80);

	    	var s = p * grad; 
	    	if (s > wrTop) {
	    		s = wrTop;
	    	}
	    	return s * this.dirr;
	    };

	    this.draw = function() {
	    	
	    	this.wl.draw(this.theta);
	    	this.wr.draw(this.theta);

	    	// draw ir

	    	canvas.strokeStyle = "#e11";
	    	canvas.fillStyle = '#922';
	    	if (last_ir > 40) {
	    		canvas.strokeStyle = "#ccc";
	    		canvas.fillStyle = '#aaa';
	    	}

	    	
	    	canvas.lineWidth = sc(1);
	    	canvas.beginPath();
			canvas.moveTo(sc(this.wl.x), sc(this.wl.y));
			
			var ir_int = sc(this.wl.y + this.wl.x * Math.tan(this.theta));

			canvas.lineTo(sc(0), ir_int);
			canvas.closePath(); 
	    	canvas.stroke();


	    	
			canvas.font = 'italic 10px sans-serif';
			canvas.textBaseline = 'bottom';
			canvas.fillText( Math.round(this.ir) + 'cm', this.wl.x / 2, (ir_int + this.wl.y)/2 + 30);


	    	// draw us
	    	canvas.strokeStyle = "#1e1";
	    	canvas.fillStyle = '#292';

	    	if (last_us > 200) {
	    		canvas.strokeStyle = "#ccc";
	    		canvas.fillStyle = '#aaa';
	    	}

	    	canvas.lineWidth = sc(1);
	    	canvas.beginPath();
			canvas.moveTo(sc(this.wl.x), sc(this.wl.y));
			
			var us_int = sc(this.wl.x - this.wl.y * Math.tan(this.theta));

			canvas.lineTo(us_int, sc(0) );
			canvas.closePath(); 
	    	canvas.stroke();


	    	
			canvas.font = 'italic 10px sans-serif';
			canvas.textBaseline = 'bottom';
			canvas.fillText( Math.round(this.us) + 'cm', (us_int + this.wl.x)/2 + 30, this.wl.y / 2 );
	    };

	    this.update = function(t_delta) {

	    	// get our wheel speed from the pwm
	    	var sl = this.pwmToSpeedl();
	    	var sr = this.pwmToSpeedr();

	    	// work out the distance each wheel moved
	    	var dl = sl * t_delta;
	    	var dr = sr * t_delta;

	    	var delta_theta = (dr - dl) / this.wheel_base;

	    	var ox = 0;
	    	var oy = 0;

	    	// dead straight 
	    	if (delta_theta == 0) {
	    		this.wl.x = this.wl.x - dl * Math.sin(this.theta);
	    		this.wl.y = this.wl.y - dl * Math.cos(this.theta);
	    	}
	    	else {

	    		var radiusl = dl / delta_theta;
	    		var x0 = this.wl.x - radiusl * Math.cos(this.theta);
	    		var y0 = this.wl.y + radiusl * Math.sin(this.theta);

	    		this.theta = this.theta + delta_theta;

	    		if  (this.theta > 2 * Math.PI)  {
	    			this.theta = this.theta - 2 * Math.PI; 
	    		}

	    		this.wl.x = x0 + radiusl * Math.cos(this.theta);
	    		this.wl.y = y0 - radiusl * Math.sin(this.theta);

	    	}
	    	

	    	// adjust the right hand wheel position
	    	this.wr.x = this.wl.x + this.wheel_base * Math.cos(this.theta);
	    	this.wr.y = this.wl.y - this.wheel_base * Math.sin(this.theta);


	    	// now get the ensor measurements
	    	if (this.theta == Math.PI/2 || this.theta == 3*Math.PI/2) {
	    		this.ir = 600;
	    	}
	    	else {
	    		this.ir = this.wl.x / Math.cos(this.theta);
	    	}

	    	if (this.theta == 0 || this.theta == Math.PI) {
	    		this.us = 600;
	    	}
	    	else {
	    		this.us = this.wl.y / Math.cos(this.theta);
	    	}

	    };

    };

    var sam = new car();

    var  lastTime = new Date().getTime();
    var  lastSampleTime = new Date().getTime();
    
    function update() {
    	var  thisTime = new Date().getTime();
        var timeDelta = (thisTime-lastTime)/1000;
        lastTime = thisTime;

        sam.update(timeDelta);

    }


    var state = "get_par";   // "starting"
    var state_loop = 0;
    var sub_state = "fwd";  // "back";
    var sub_time;

    var last_state_change_time = new Date().getTime();

    var get_par_top_ir = 0;
    var get_par_mid_ir = 0;
    var get_par_bot_ir = 0;


    var pwm_dif = 0.00;		// +ve goes right

    var ave_pwm = 120;

    function state_change(new_state, new_sub, new_time) {
    	
    	console.log("State CHANGE ---> " + new_state + " : " + new_sub);

    	if (new_state == "starting") {
    		sam.pwml = sam.pwmr = 0;
    	}
    	
    	if (new_state == "get_par") {
    		var speed = 120;
    		if (new_sub == "fwd") {

    			if (state ="starting") {   // transition from starting to fwd so set motor speed
    				
				    sam.pwml = ave_pwm * (1 + pwm_dif);
				    sam.pwmr = ave_pwm * (1 - pwm_dif);
    			}
    			
    			sam.dirl = sam.dirr = 1;
    			get_par_bot_ir = sam.get_ir();
    			
    		}
    		if (new_sub == "mid") {
    			
    			sam.dirl = sam.dirr = 1;
    			get_par_mid_ir = sam.get_ir();
    		}
    		if (new_sub == "rev") {			// we are just reversing so must be at the top
    			
    			sam.dirl = sam.dirr = -1;
    			get_par_top_ir = sam.get_ir();
    			
    		}
    		if (new_sub == "rev_lim") {
    			
    			sam.dirl = sam.dirr = -1;
    			
    		}
    		if (new_sub == "fwd_lim") {
    			
    			sam.dirl = sam.dirr = 1;
    			
    		}
    	}

    	if (new_state == "got_par") {
    		sam.pwml = sam.pwmr = 0;
    	}
    	
    	
    	sub_time = new_time;
    	state = new_state;
    	sub_state = new_sub;
    	last_state_change_time = new Date().getTime();
    }

    function state_timeout() {
    	var time = new Date().getTime();
    	var state_duration = time - last_state_change_time;

    	if(state_duration > sub_time) {
    		console.log("state_timeout");
    		return true;
    	}
    	return false;
    }


    var grad_count = 0;
    var good_grad_count = 0;
    var cave_vex_tot = 0;

    function calc_grad() {

    	console.log("cavevextot: " + cave_vex_tot);
		console.log("grad_count: " + good_grad_count);
		
		var ave_change = cave_vex_tot / (good_grad_count - 1);
		console.log("ave grad change: " + ave_change);

		var calibrated = false;
		if (ave_change < -0.1) {
			console.log("CAVE");
			pwm_dif += .005;
		}
		else if (ave_change < -0.05) {
			console.log("CAVE a BIT");
			pwm_dif += .001;
		}
		else if (ave_change > 0.1) {
			console.log("VEX");
			pwm_dif -= .005;
		}
		else if (ave_change > 0.05) {
			console.log("VEX a BIT");
			pwm_dif -= .001;
		}
		else {
			console.log("CALIBRATED diff: " + pwm_dif);
			calibrated = true;
		}

		if (calibrated) {
			console.log("state_loop: " + state_loop);
		}
		else {
			sam.pwml = ave_pwm * (1 + pwm_dif);
			sam.pwmr = ave_pwm * (1 - pwm_dif);;
		}
    	
    	// reset the counters
    	good_grad_count = 0;
    	cave_vex_tot = 0;
    	grad_count = 0;

    }


    function check_state() {

    	var  thisTime = new Date().getTime();
        var timeDelta = (thisTime-lastSampleTime)/1000;
        lastSampleTime = thisTime;
        

    	var par_time = 4000;
    	var cur_ir = sam.get_ir();
    	var cur_us = sam.get_ir();

    	var limit = false;


    	if (last_ir > 0 && last_ir < 100) {
	    	var grad; 

			if (sam.dirl -1) {
				grad = ( last_ir - cur_ir) ;	
			}
			else {
	    		grad = (cur_ir - last_ir) ;
	    	}

	    	// got a prev grad?
	    	if (grad_count > 0) {

	    		var grad_change; 

				if (sam.dirl -1) {
					grad_change = last_grad - grad;
				}
				else {
					grad_change = grad - last_grad;	
				}
	    		
	    		console.log("lir: " + last_ir + " tir: " + cur_ir + " count: " + grad_count + " last_grad: " + last_grad + " this grad: " + grad + " grad change: " + grad_change);
	    		
	    		
	    		cave_vex_tot += grad_change;
	    		good_grad_count++;
	    		
	    	}

	    	grad_count++;

	    	last_grad = grad;
	    }

    	if (state == "get_par") {
    		//if (sub_state == "fwd") {
    			if (cur_ir < 5) {
    				limit = true;
    			}

    			if (cur_ir > 30) {
    				limit = true;
    			}
    		//}

    		// if we did hit a limit wd or reverse then sneek back a bit so we dont trigger the limit next time
    		if (limit) {
	    		if (sub_state == "rev") {
	    			calc_grad();
	    			state_change("get_par", "fwd_lim", 500);
	    		}
	    		// could hit a limit in mid or fwd states
	    		if (sub_state == "fwd" || sub_state == "mid") {
	    			state_change("get_par", "rev_lim", 500);
	    			grad_count = 0;
	    		}
	    	}
    	}


    	if (state_timeout() && !limit) {
    		if (state == "starting") {
    			state_change("get_par", "fwd", par_time);
    			state_loop = 0;
    		}
    		else if (state == "get_par") {

				if (sub_state == "fwd") {
    				state_change("get_par", "mid", par_time);
    			}
    			else if (sub_state == "mid") {
    				
    				state_change("get_par", "rev", par_time * 2);

    				grad_count = 0;

    			}
    			else if (sub_state == "rev") {
    				if (state_loop >= 10) {
    					state_change("got_par", "", 5000);
    				}
    				else {

    					// first loop - so decide if go more forward or more back
    					if (state_loop >= 0) {

							calc_grad();

    					}

    					state_change("get_par", "fwd", par_time );
    					state_loop++;

    					grad_count = 0;
    				}
    			}
    			// if we where reversing or advancing out of the ir limit range
    			else if (sub_state == "rev_lim") {
    				state_change("get_par", "rev", par_time);
    			}
    			// the ir reached a limit
    			else if (sub_state == "fwd_lim") {
    				state_change("get_par", "fwd", par_time);
    			}
    		}
    		else if (state = "got_par") {
    			state_change("got_par", "", 5000);
    		}
    	}

    	last_ir = cur_ir;
        last_us = cur_us;
    }

    function update_sample() {
        // now alter his pwm on each wheel based on the measurements

        // total spead dependant on the ultrasonics

        var us_raw = sam.get_us();
        var ir = sam.get_ir();

        var pwm = 190;

        if (us_raw < 150) {
        			// pwm range  /  us range
        	var grad = (200 - 90) / (150 - 30)
        	var us = us_raw - 30 
        	pwm = grad * us + 90;

        	if (pwm < 90) {
        		pwm = 90;
        	}
    		
        }
        if (us_raw < 30) {
        	pwm = sam.pwml = sam.pwmr = 0;
        }
        else {

	        
	        if (last_ir > 0) {
	        	var d_ir = ir - last_ir;

	        	var dif = 0;
	         	// getting further away
	        	if (d_ir > 0) {
					dif = pwm * 0.02;
	        	}
	        	else {
					dif = pwm * -0.02;
	        	}

	    		sam.pwml = pwm * 1.03 - dif;
	        	sam.pwmr = pwm * 0.97 + dif;
	        }
	        else {
	        	sam.pwml = pwm * 1.03;
	        	sam.pwmr = pwm * 0.97;
	        }


	        if (sam.pwml > 255) {
	        	console.error("left too fast");
	        }

	        if (sam.pwmr > 255) {
	        	console.error("right too fast");
	        }
	    }

		$("#ir").text(Math.round(ir) + "cm");
    	$("#us").text(Math.round(us_raw) + "cm");
        
        last_ir = ir;
        last_us = us_raw;

    };

    var last_ir = 1000;
    var last_us = 10000;

    var last_grad = 0;

    function draw() {
    	canvas.fillStyle = "#eee";
        canvas.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
    	sam.draw();

    };

    sam.theta = 0.2;

    sam.wl.x = 20;
    sam.wl.y = 500;
    
    setInterval( function() {
        
        update();
        draw();
        
    }, 1000/FPS);

    state_change("starting", "", 1000);
    setInterval( function() {
        
        update_sample();

        // check_state();

        
    }, 1000/MPS);

};