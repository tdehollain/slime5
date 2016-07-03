/*!
 * jsSimple v0.0.1
 * www.jssimple.com
 *
 * Copyright (c) Tobin Titus
 * Available under the BSD and MIT licenses: www.jssimple.com/license/
 */

var Animation = (function() {
    "use strict";
    var interval, moz, renderers = [];

// PRIVATE
	function __mozFix (val) {
		/* Mozilla fails to return interger per specification */
		if (!val) { 
			moz = true;
			val = Math.ceil(Math.random() * 10000);
		} 
		return val;
	}

    function __renderAll() {
        var r, length;

        // execute all renderers
        length = renderers.length;
        for (r = 0; r < length; ++r) {
            renderers[r]();
        }
		if (interval) {
			interval = __mozFix(window.requestAnimationFrame(__renderAll));
		}
	}

    function __registerAnimationEventHandlers() {
        var pre, prefixes = ['webkit', 'moz', 'o', 'ms'];

        // check vendor prefixes
        for (pre = prefixes.length - 1; pre >= 0 && !window.requestAnimationFrame; --pre) {
            window.requestAnimationFrame = window[prefixes[pre] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[prefixes[pre] + 'CancelAnimationFrame'] || window[prefixes[pre] + 'CancelRequestAnimationFrame'];
        }

        // downlevel support via setTimeout / clearTimeout
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback) {
                // could likely be an adaptive set timeout
                return window.setTimeout(callback, 16.7);
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }
    }
    __registerAnimationEventHandlers(); 

// PUBLIC
    function add(renderer) {
        if (renderer) {
            renderers.push(renderer);
        }
    }

    function isRunning() {
        return !!interval;
    }

    function start() {
        interval = __mozFix(window.requestAnimationFrame(__renderAll));
    }

    function stop() {
		if (!moz) {
			window.cancelAnimationFrame(interval);
        }
		interval = null;
    }

// OBJECT DEFINITION
    return {
        "add": add,
        "isRunning": isRunning,
        "start": start,
        "stop": stop
    };
}());