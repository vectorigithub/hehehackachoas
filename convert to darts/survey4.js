// survey4.js — Step 4: What alerts matter to you? (Final step)
document.addEventListener('DOMContentLoaded', function () {

  const optionCards     = document.querySelectorAll('.option-card');
  const progressBar     = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');
  const progressStep    = document.getElementById('progress-step');
  const continueBtn     = document.getElementById('survey-continue-btn');
  const skipBtn         = document.getElementById('survey-skip-btn');
  const backBtn         = document.getElementById('survey-back-btn');

  const STEP         = 4;
  const TOTAL_STEPS  = 4;
  const BASE_PERCENT = 75;
  const DONE_PERCENT = 100;
  const STORAGE_KEY  = 'alert_preferences';
  const NEXT_PAGE    = 'explore.html';

  optionCards.forEach(function (card) {
    applyCardVisual(card, card.querySelector('input[type="checkbox"]').checked);
  });
  updateProgress();

  optionCards.forEach(function (card) {
    const checkbox = card.querySelector('input[type="checkbox"]');
    card.addEventListener('click', function (e) {
      if (e.target.closest('label')) return;
      checkbox.checked = !checkbox.checked;
      applyCardVisual(card, checkbox.checked);
      updateProgress();
    });
    card.querySelector('label').addEventListener('click', function () {
      setTimeout(function () {
        applyCardVisual(card, checkbox.checked);
        updateProgress();
      }, 0);
    });
  });

  function applyCardVisual(card, isChecked) {
    const toggle = card.querySelector('label');
    if (isChecked) {
      card.classList.add('border-primary');
      card.classList.remove('border-slate-200', 'dark:border-slate-800');
      toggle.classList.add('bg-primary', 'justify-end');
      toggle.classList.remove('bg-slate-300', 'dark:bg-slate-700');
    } else {
      card.classList.remove('border-primary');
      card.classList.add('border-slate-200', 'dark:border-slate-800');
      toggle.classList.remove('bg-primary', 'justify-end');
      toggle.classList.add('bg-slate-300', 'dark:bg-slate-700');
    }
  }

  function countSelected() {
    let count = 0;
    optionCards.forEach(function (c) { if (c.querySelector('input').checked) count++; });
    return count;
  }

  function updateProgress() {
    const selected = countSelected();
    const ratio    = optionCards.length > 0 ? selected / optionCards.length : 0;
    const percent  = Math.round(BASE_PERCENT + (DONE_PERCENT - BASE_PERCENT) * ratio);
    progressBar.style.transition = 'width 0.4s cubic-bezier(0.4,0,0.2,1)';
    progressBar.style.width      = percent + '%';
    progressPercent.textContent  = percent + '% COMPLETE';
    progressStep.textContent     = 'Step ' + STEP + ' of ' + TOTAL_STEPS;
    continueBtn.classList.toggle('opacity-60', selected === 0);
  }

  function getSelected() {
    const out = [];
    optionCards.forEach(function (c) {
      if (c.querySelector('input').checked)
        out.push(c.querySelector('p.text-base.font-semibold').textContent.trim());
    });
    return out;
  }

  continueBtn.addEventListener('click', async function () {
    const selected = getSelected();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));

    // Bundle all 4 steps and send as one complete profile to the backend
    const token = localStorage.getItem('auth_token');
    if (token) {
      const fullProfile = {
        commuter_profile:   JSON.parse(localStorage.getItem('commuter_profile')  || '[]'),
        commute_modes:      JSON.parse(localStorage.getItem('commute_modes')      || '[]'),
        commute_schedule:   JSON.parse(localStorage.getItem('commute_schedule')   || '[]'),
        alert_preferences:  selected,
      };
      try {
        await fetch('/api/user/profile/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(fullProfile),
        });
      } catch (e) { console.warn(e); }
    }

    window.location.href = NEXT_PAGE;
  });

  skipBtn.addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.location.href = NEXT_PAGE;
  });

  backBtn.addEventListener('click', function () { window.history.back(); });
});
