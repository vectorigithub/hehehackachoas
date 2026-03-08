// splash.js — JeepneySafe splash animation
// Jeep drives in from left → parks at centre → drives off right near 100% → redirect

(function () {

  // ── Timing ──────────────────────────────────────────────
  var TOTAL_MS  = 3200;   // total splash duration
  var ENTER_MS  = 1000;   // time for jeep to drive in
  var EXIT_AT   = 85;     // % at which jeep starts leaving
  var EXIT_MS   = 700;    // time for jeep to drive out

  // ── Elements ─────────────────────────────────────────────
  var wrap   = document.getElementById('jeepney-wrap');
  var bar    = document.getElementById('progress-bar');
  var label  = document.getElementById('progress-label');
  var status = document.getElementById('status-text');
  var wheels = document.querySelectorAll('.wheel');
  var mline1 = document.querySelector('.motion-line-1');
  var mline2 = document.querySelector('.motion-line-2');
  var flash  = document.getElementById('exit-flash');

  // ── Positions (px, relative to #jeep-track left edge) ───
  // Phone is 390px wide. Jeep is 256px wide.
  // Centre = (390 - 256) / 2 = 67px
  var POS_OFF_LEFT  = -300;   // fully off screen left
  var POS_CENTRE    = 67;     // visually centred
  var POS_OFF_RIGHT = 400;    // fully off screen right

  // ── State ────────────────────────────────────────────────
  var startTime     = null;
  var enterStart    = null;
  var exitStart     = null;
  var phase         = 'enter';   // 'enter' | 'idle' | 'exit'
  var exitTriggered = false;
  var done          = false;

  var statusMsgs = [
    { at: 0,  text: 'Synchronizing routes...' },
    { at: 30, text: 'Loading safety data...' },
    { at: 60, text: 'Mapping jeepney lanes...' },
    { at: 85, text: 'Almost ready...' },
  ];

  // ── Easing ───────────────────────────────────────────────
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInCubic(t)  { return t * t * t; }

  // ── Helpers ──────────────────────────────────────────────
  function setJeepX(x) {
    wrap.style.left = x + 'px';
  }

  function spinWheels(on) {
    var state = on ? 'running' : 'paused';
    for (var i = 0; i < wheels.length; i++) {
      wheels[i].style.animationPlayState = state;
    }
  }

  function showMotionLines(on) {
    mline1.style.opacity = on ? '1'   : '0';
    mline2.style.opacity = on ? '0.5' : '0';
  }

  function updateStatus(pct) {
    for (var i = statusMsgs.length - 1; i >= 0; i--) {
      if (pct >= statusMsgs[i].at) {
        status.textContent = statusMsgs[i].text;
        break;
      }
    }
  }

  // ── Main animation loop ───────────────────────────────────
  function tick(now) {
    if (done) return;
    if (!startTime) startTime = now;

    var elapsed   = now - startTime;
    var totalFrac = Math.min(elapsed / TOTAL_MS, 1);
    var easedFrac = easeOutCubic(totalFrac);
    var pct       = Math.round(easedFrac * 100);

    // Always keep bar and label in sync
    bar.style.width    = (easedFrac * 100) + '%';
    label.textContent  = pct + '%';
    updateStatus(pct);

    // ── PHASE: ENTER ── jeep drives in from left and brakes to centre ──
    if (phase === 'enter') {
      if (!enterStart) enterStart = now;
      var et = Math.min((now - enterStart) / ENTER_MS, 1);
      var ex = easeOutCubic(et);
      setJeepX(POS_OFF_LEFT + ex * (POS_CENTRE - POS_OFF_LEFT));
      spinWheels(true);
      showMotionLines(et < 0.7);  // hide lines as jeep slows to a stop

      if (et >= 1) {
        phase = 'idle';
        setJeepX(POS_CENTRE);
        spinWheels(false);
        showMotionLines(false);
      }
    }

    // ── PHASE: IDLE ── jeep is parked, waiting ──
    // (nothing to do, bar keeps filling)

    // ── Trigger EXIT when progress hits EXIT_AT% ──
    if (!exitTriggered && pct >= EXIT_AT) {
      exitTriggered = true;
      phase         = 'exit';
      exitStart     = now;
      spinWheels(true);
    }

    // ── PHASE: EXIT ── jeep accelerates off to the right ──
    if (phase === 'exit' && exitStart) {
      var xt = Math.min((now - exitStart) / EXIT_MS, 1);
      var xx = easeInCubic(xt);
      setJeepX(POS_CENTRE + xx * (POS_OFF_RIGHT - POS_CENTRE));

      if (xt >= 1) {
        done = true;
        spinWheels(false);
        // Flash white then redirect
        flash.style.opacity = '1';
        setTimeout(function () {
          window.location.href = 'log_reg.html';
        }, 350);
        return;
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

})();
