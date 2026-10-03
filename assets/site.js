// Mobile menu and category filters, shared by every page.
(function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Filters: <div class="filters" data-filters="#grid-id"><button data-filter="all">…
  // Items in the grid carry data-cat="slug". ?filter=slug preselects one.
  document.querySelectorAll('[data-filters]').forEach(function (group) {
    var grid = document.querySelector(group.getAttribute('data-filters'));
    if (!grid) return;
    var buttons = group.querySelectorAll('button[data-filter]');
    var status = document.querySelector(group.getAttribute('data-status') || '#no-status');
    function apply(slug) {
      var shown = 0;
      buttons.forEach(function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-filter') === slug ? 'true' : 'false');
      });
      grid.querySelectorAll('[data-cat]').forEach(function (item) {
        var match = slug === 'all' || item.getAttribute('data-cat').split(' ').indexOf(slug) !== -1;
        item.hidden = !match;
        if (match) shown++;
      });
      if (status) status.textContent = shown + (shown === 1 ? ' item' : ' items') + ' shown';
    }
    buttons.forEach(function (b) {
      b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); });
    });
    var wanted = new URLSearchParams(location.search).get('filter');
    if (wanted && group.querySelector('button[data-filter="' + wanted + '"]')) apply(wanted);
  });
})();

// Sister-site switch: a two-position toggle beside the logo. Control Video is the dark site and
// LED Truck Co. the light one, so switching "flips the lights": the other site's color grows
// out of the switch in a circle, then the matching page fades in underneath.
(function () {
  var header = document.querySelector('.site-header .wrap');
  var brand = header && header.querySelector('.brand');
  if (!brand) return;
  var onLed = document.body.classList.contains('light');
  var page = location.pathname.split('/').pop() || 'index.html';
  // Where each page lands on the sister site.
  var TO_LED = { 'home.html': 'led.html', 'technology.html': 'led-fleet.html', 'events.html': 'led.html#events' };
  var TO_CV = { 'led.html': 'home.html', 'led-fleet.html': 'technology.html#mobile' };
  var target = onLed ? (TO_CV[page] || 'home.html') : (TO_LED[page] || 'led.html');
  if (onLed && location.hash === '#events') target = 'events.html';
  var CV_MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24.5 7.5 A12 12 0 1 0 24.5 24.5" fill="none" stroke="currentColor" stroke-width="4.6"/><path d="M14.1 12.1 L20.8 16 L14.1 19.9 Z" fill="#E3262B" stroke="#E3262B" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  var LED_MARK = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="5" width="26" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="3.2"/><path d="M14.1 10.95 L18.6 13.5 L14.1 16.05 Z" fill="#E3262B" stroke="#E3262B" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9" cy="27" r="2.4" fill="currentColor"/><circle cx="23" cy="27" r="2.4" fill="currentColor"/></svg>';

  var sw = document.createElement('nav');
  sw.className = 'brand-switch' + (onLed ? ' is-led' : '');
  sw.setAttribute('aria-label', 'Our companies');
  sw.innerHTML = '<span class="knob" aria-hidden="true"></span>' +
    '<a href="' + (onLed ? target : page) + '" aria-label="Control Video"' + (onLed ? '' : ' aria-current="true"') + '>' + CV_MARK + '</a>' +
    '<a href="' + (onLed ? page : target) + '" aria-label="LED Truck Co."' + (onLed ? ' aria-current="true"' : '') + '>' + LED_MARK + '</a>' +
    '<span class="hint" aria-hidden="true">' + (onLed ? 'Switch to Control Video' : 'Switch to LED Truck Co.') + '</span>';
  brand.insertAdjacentElement('afterend', sw);

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var other = sw.querySelector('a:not([aria-current])');
  var current = sw.querySelector('a[aria-current]');
  current.addEventListener('click', function (e) { e.preventDefault(); });
  other.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || reduce) return;
    e.preventDefault();
    var href = other.getAttribute('href');
    var color = onLed ? '#08080C' : '#FFFFFF';
    var r = other.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    sw.style.setProperty('--to', onLed ? '0px' : '40px');
    sw.classList.toggle('is-led');
    var veil = document.createElement('div');
    veil.className = 'flip-veil';
    veil.style.background = color;
    document.body.appendChild(veil);
    var anim = veil.animate(
      [{ clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)' }],
      { duration: 520, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' }
    );
    try { sessionStorage.setItem('cv-flip', color); } catch (err) {}
    anim.onfinish = function () { location.href = href; };
  });

  // Arriving from a flip: start covered in this site's color, then fade in.
  var arriving = null;
  try { arriving = sessionStorage.getItem('cv-flip'); sessionStorage.removeItem('cv-flip'); } catch (err) {}
  if (arriving && !reduce) {
    var veilIn = document.createElement('div');
    veilIn.className = 'flip-veil';
    veilIn.style.background = arriving;
    document.body.appendChild(veilIn);
    var gone = function () { if (veilIn.parentNode) veilIn.remove(); };
    if (veilIn.animate) veilIn.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: 60, easing: 'ease-out', fill: 'forwards' }).onfinish = gone;
    // Never leave the page covered, even if the animation doesn't run.
    setTimeout(gone, 900);
  }
  // Coming back with the browser's back button: drop any leftover veil.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) document.querySelectorAll('.flip-veil').forEach(function (v) { v.remove(); });
    sw.classList.toggle('is-led', onLed);
  });
})();

// Contact forms and the "5 things" bot. All three post to the Netlify function
// (netlify/functions/forms.mjs), which saves to Airtable:
//   - 5-things bot: every project call-to-action ("Start a project", "Start a booking", rig cards…)
//   - Simple contact form: reached from the bot ("Just send a message")
//   - Careers form: any link whose subject is "Careers"
// Without JS the CTA links still work as plain mailto links.
(function () {
  var EMAIL = 'hello@controlvideo.com';
  var PHONE = '(301) 277-3429';
  // The API runs on Netlify. On GitHub Pages, post across to the Netlify site.
  var API_ROOT = (window.CV_API || (location.hostname.endsWith('github.io') ? 'https://control-video-review.netlify.app' : '')) + '/api/';
  var MAX_BYTES = 5 * 1024 * 1024;
  var MAX_FILES = 10;
  var ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.heic,.svg,.tif,.tiff,.dwg,.dxf,.vwx,.skp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.key,.pages,.numbers,.txt,.rtf,.zip,.mp4,.mov';
  var SITE = document.body.classList.contains('light') ? 'LED Truck Co.' : 'Control Video';
  var isLed = SITE === 'LED Truck Co.';
  if (!window.HTMLDialogElement) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- shared: spam check, file checks, submit + upload + finalize ----------

  function getChallenge(kind) {
    return fetch(API_ROOT + kind + '/challenge', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); });
  }

  function post(kind, path, body, headers) {
    return fetch(API_ROOT + kind + path, { method: 'POST', headers: headers || { 'Content-Type': 'application/json' }, body: body })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Something went wrong.'); return j; }); });
  }

  function fileProblem(file) {
    var ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
    if (ACCEPT.split(',').indexOf(ext) === -1) return 'Unsupported type';
    if (file.size > MAX_BYTES) return 'Over 5 MB — add a link instead';
    return '';
  }

  // files: [{file, error?, state?}]; onChange re-renders file states as uploads progress.
  function submit(kind, payload, files, onChange) {
    return post(kind, '', JSON.stringify(payload)).then(function (rec) {
      var failed = [];
      var queue = files.filter(function (f) { if (f.error) failed.push(f.file.name); return !f.error; });
      var i = 0;
      function next() {
        if (i >= queue.length) return Promise.resolve();
        var f = queue[i++];
        f.state = 'Uploading…'; onChange();
        return post(kind, '/file', f.file, {
          'Content-Type': f.file.type || 'application/octet-stream',
          'X-Record': rec.id, 'X-Upload-Token': rec.uploadToken, 'X-Filename': encodeURIComponent(f.file.name)
        }).then(function () { f.state = 'Uploaded'; }, function (err) { f.state = err.message; f.error = true; failed.push(f.file.name); })
          .then(function () { onChange(); return next(); });
      }
      return next().then(function () {
        return post(kind, '/finalize', JSON.stringify({ id: rec.id, uploadToken: rec.uploadToken, failedFiles: failed }));
      });
    });
  }

  // Fallback when the form API can't be reached: open an email with everything filled in.
  function openEmail(subject, rows) {
    var body = rows.filter(function (r) { return r[1]; }).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
    location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function fmtSize(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }

  function renderFileList(list, files) {
    list.innerHTML = '';
    files.forEach(function (f, i) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="fname"></span><span class="fsize"></span><span class="fstate"></span><button type="button">×</button>';
      li.querySelector('.fname').textContent = f.file.name;
      li.querySelector('.fsize').textContent = fmtSize(f.file.size);
      var st = li.querySelector('.fstate');
      st.textContent = f.state || '';
      if (f.error) st.classList.add('err');
      var b = li.querySelector('button');
      b.setAttribute('aria-label', 'Remove ' + f.file.name);
      b.addEventListener('click', function () { files.splice(i, 1); renderFileList(list, files); });
      list.appendChild(li);
    });
  }

  function addFiles(files, fileList) {
    Array.prototype.forEach.call(fileList, function (file) {
      if (files.length >= MAX_FILES) return;
      var problem = fileProblem(file);
      files.push(problem ? { file: file, error: true, state: problem } : { file: file });
    });
  }

  // ---------- full-screen forms: "Let's talk" and Careers ----------

  function field(id, name, label, type, o) {
    o = o || {};
    return '<div class="field' + (o.full ? ' full' : '') + '"><label for="' + id + '">' + label + (o.req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' +
      (type === 'textarea'
        ? '<textarea id="' + id + '" name="' + name + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '></textarea>'
        : type === 'select'
          ? '<select id="' + id + '" name="' + name + '"><option value="">Choose…</option>' + o.list.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('') + '</select>'
          : '<input id="' + id + '" name="' + name + '" type="' + type + '"' + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.req ? ' required' : '') + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '>') +
      '</div>';
  }

  var FORMS = {
    inquiry: {
      eyebrow: SITE,
      title: 'Let’s talk.',
      lede: 'Tell us a little about your event. The people who will plan and run it will reply, usually within one business day.',
      done: 'Thanks — it’s with our team.',
      fields: function (p) {
        return field(p + 'name', 'name', 'Name', 'text', { req: 1, ac: 'name' }) + field(p + 'email', 'email', 'Email', 'email', { req: 1, ac: 'email' }) +
          field(p + 'phone', 'phone', 'Phone', 'tel', { ac: 'tel' }) + field(p + 'date', 'eventDate', 'Event date', 'date') +
          field(p + 'details', 'details', 'What’s the event?', 'textarea', { full: 1, ph: 'What, where, roughly how many people, and anything you already know you need.' }) +
          '<input type="hidden" name="eventType">';
      },
      filesHint: 'Drawings, run of show, floor plans — anything that helps.',
      linkPh: 'Or paste a Dropbox / Drive link',
      payload: function (fd) { return { site: SITE, channel: 'Contact form', eventType: fd.get('eventType'), eventDate: fd.get('eventDate') }; }
    },
    careers: {
      eyebrow: 'Careers',
      title: 'Join the crew.',
      lede: 'Full-time or freelance. Tell us what you do and send your résumé — someone who runs shows will read it.',
      done: 'Thanks — we’ve got your application.',
      fields: function (p) {
        return field(p + 'name', 'name', 'Name', 'text', { req: 1, ac: 'name' }) + field(p + 'email', 'email', 'Email', 'email', { req: 1, ac: 'email' }) +
          field(p + 'phone', 'phone', 'Phone', 'tel', { ac: 'tel' }) +
          field(p + 'role', 'role', 'Role', 'select', { list: ['Video engineer', 'LED technician', 'Camera operator', 'Audio', 'Lighting', 'Project / production manager', 'Driver / rigger (LED trucks)', 'Other'] }) +
          field(p + 'details', 'details', 'About you', 'textarea', { full: 1, ph: 'Shows you’ve worked, gear you know, full-time or freelance.' });
      },
      filesHint: 'Résumé, and anything else you’d like us to see.',
      linkPh: 'Portfolio, reel or LinkedIn link',
      payload: function (fd) { return { roles: fd.get('role') ? [fd.get('role')] : [] }; }
    }
  };

  var dialogs = {};

  function buildForm(kind) {
    var cfg = FORMS[kind];
    var p = kind.charAt(0) + '-';
    var dlg = document.createElement('dialog');
    dlg.className = 'talk';
    dlg.setAttribute('aria-labelledby', p + 'title');
    dlg.innerHTML =
      '<div class="talk-bar"><div class="wrap"><span class="eyebrow">' + cfg.eyebrow + '</span>' +
      '<button type="button" class="talk-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="2"/></svg></button></div></div>' +
      '<div class="wrap talk-body">' +
        '<div class="talk-aside"><h2 id="' + p + 'title">' + cfg.title + '</h2><p class="lede">' + cfg.lede + '</p>' +
          '<div class="alt">Rather talk now?<a href="tel:+13012773429">Call ' + PHONE + '</a><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></div>' +
          (kind === 'inquiry' ? '<div class="alt">Want a real number faster?<button type="button" class="linkish to-bot">Answer 5 quick questions →</button></div>' : '') +
        '</div>' +
        '<div class="talk-main">' +
        '<form class="talk-form" novalidate><div class="fields">' + cfg.fields(p) +
          '<div class="field full"><span class="label">Files <span class="hint">— optional</span></span>' +
            '<div class="drop"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 21V5M9 12l7-7 7 7M5 21v5h22v-5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>' +
              '<span><strong>Add files</strong> <span class="hint">or drop them here</span></span><span class="hint">' + cfg.filesHint + ' Up to 5 MB each.</span>' +
              '<input type="file" multiple accept="' + ACCEPT + '" aria-label="Add files"></div>' +
            '<ul class="file-list" aria-live="polite"></ul>' +
            '<input type="text" name="links" aria-label="Link to files" placeholder="' + esc(cfg.linkPh) + '">' +
          '</div>' +
        '</div>' +
          '<div class="hp" aria-hidden="true"><label for="' + p + 'website">Website</label><input id="' + p + 'website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
          '<div class="form-error" role="alert" hidden></div>' +
          '<div class="submit-row">' +
            '<div class="field quick"><label for="' + p + 'answer" class="t-q">Loading question…</label><input id="' + p + 'answer" name="answer" type="number" inputmode="numeric" autocomplete="off" required></div>' +
            '<button type="submit" class="btn btn-primary">Send it</button>' +
          '</div>' +
        '</form>' +
        '<div class="talk-done" hidden tabindex="-1"><span class="eyebrow">Received</span><h3>' + cfg.done + '</h3><p class="lede">We’ll reply to <strong class="done-email"></strong> soon. If it’s urgent, call ' + PHONE + '.</p><button type="button" class="btn btn-ghost talk-finish">Close</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dlg);

    var form = dlg.querySelector('form');
    var errBox = dlg.querySelector('.form-error');
    var done = dlg.querySelector('.talk-done');
    var list = dlg.querySelector('.file-list');
    var drop = dlg.querySelector('.drop');
    var picker = drop.querySelector('input');
    var submitBtn = form.querySelector('[type=submit]');
    var files = [];
    var challenge = null;
    var opener = null;

    function loadChallenge() {
      var q = dlg.querySelector('.t-q');
      q.textContent = 'Loading question…';
      q.closest('.field').hidden = false;
      submitBtn.textContent = 'Send it';
      getChallenge(kind).then(function (c) { challenge = c; q.textContent = c.question; }, function () {
        // Online sending isn't available: drop the check and send by email instead.
        challenge = null;
        q.closest('.field').hidden = true;
        submitBtn.textContent = 'Email it';
      });
    }
    function showError(msg, el) {
      errBox.textContent = msg;
      errBox.hidden = false;
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } else errBox.scrollIntoView({ block: 'nearest' });
    }

    picker.addEventListener('change', function () { addFiles(files, picker.files); renderFileList(list, files); picker.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer) { addFiles(files, e.dataTransfer.files); renderFileList(list, files); } });
    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      var fd = new FormData(form);
      var name = form.elements.name, email = form.elements.email, answer = form.elements.answer;
      if (!name.value.trim()) return showError('Please add your name.', name);
      if (!email.value.trim() || !email.validity.valid) return showError('Please add a valid email address.', email);
      if (!challenge) {
        openEmail((kind === 'careers' ? 'Careers: ' : 'Project inquiry: ') + fd.get('name'), [
          ['Name', fd.get('name')], ['Email', fd.get('email')], ['Phone', fd.get('phone')],
          ['Role', fd.get('role')], ['Event date', fd.get('eventDate')], ['Interested in', fd.get('eventType')],
          [kind === 'careers' ? 'About' : 'Message', fd.get('details')], ['Link', fd.get('links')], ['From page', location.href]
        ]);
        return showError('We’ve opened an email with your message — just hit send.' + (files.length ? ' Attach your files to that email.' : ''));
      }
      if (!answer.value.trim()) return showError('Please answer the quick check.', answer);

      var payload = cfg.payload(fd);
      payload.name = fd.get('name'); payload.email = fd.get('email'); payload.phone = fd.get('phone');
      payload.details = fd.get('details'); payload.links = fd.get('links'); payload.page = location.href;
      payload.website = fd.get('website'); payload.answer = fd.get('answer'); payload.ts = challenge.ts; payload.token = challenge.token;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      submit(kind, payload, files, function () { renderFileList(list, files); }).then(function () {
        dlg.querySelector('.done-email').textContent = payload.email;
        form.hidden = true;
        done.hidden = false;
        done.focus();
      }).catch(function (err) {
        showError((err && err.message ? err.message : 'Something went wrong.') + ' You can also email ' + EMAIL + '.');
        loadChallenge();
        form.elements.answer.value = '';
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send it';
      });
    });

    function reset() {
      form.reset(); files.length = 0; renderFileList(list, files);
      form.hidden = false; done.hidden = true; errBox.hidden = true;
    }

    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('talk-open');
      if (location.hash === '#' + kind || location.hash === '#message') history.replaceState(null, '', location.pathname + location.search);
      if (opener) opener.focus();
    });
    dlg.querySelector('.talk-close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.talk-finish').addEventListener('click', function () { dlg.close(); reset(); });
    var toBot = dlg.querySelector('.to-bot');
    if (toBot) toBot.addEventListener('click', function () { var from = opener; opener = null; dlg.close(); bot.open(from); });

    return {
      open: function (from, prefill) {
        opener = from || null;
        if (!done.hidden) reset();
        prefill = prefill || {};
        if (form.elements.eventType) form.elements.eventType.value = prefill.eventType || '';
        if (prefill.details && !form.elements.details.value) form.elements.details.value = prefill.details;
        document.documentElement.classList.add('talk-open');
        dlg.showModal();
        form.elements.name.focus();
        loadChallenge();
      }
    };
  }

  function getForm(kind) { return dialogs[kind] || (dialogs[kind] = buildForm(kind)); }

  // ---------- the "5 things" bot ----------
  // Asks the questions from the printed "5 things we need to know about your event" sheet,
  // one at a time, then files the answers as an inquiry.

  var bot = (function () {
    var panel, log, chips, entry, input, sendBtn, opener, prefillNow;
    var answers, files, challenge, step, busy, offline;

    // All wording lives in assets/bot-script.js (window.CV_BOT_SCRIPT) so it can be edited on its own.
    var T = window.CV_BOT_SCRIPT;
    var ST = T.steps;
    function fill(s, extra) {
      var vals = { site: SITE, name: first(answers && answers.name), phone: PHONE, email: EMAIL, question: challenge ? challenge.question : '…' };
      for (var k in extra) vals[k] = extra[k];
      return String(s).replace(/\{(\w+)\}/g, function (m, k) { return k in vals ? vals[k] : m; });
    }
    function lines(list) { return list.map(function (l) { return l === '{summary}' ? summary() : fill(l); }); }

    // The order of the conversation. Wording comes from bot-script.js.
    var SCRIPT = [
      { key: 'name', say: function () { return lines(ST.name.say); }, text: ST.name.placeholder, required: true },
      { key: 'contact', say: function () { return lines(ST.contact.say); }, text: ST.contact.placeholder, required: true,
        check: function (v) { return /@/.test(v) ? (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : fill(ST.contact.badEmail)) : ((v.match(/\d/g) || []).length >= 7 ? '' : fill(ST.contact.badPhone)); } },
      { key: 'organization', say: function () { return lines(ST.organization.say); }, text: ST.organization.placeholder, skip: ST.organization.skip },
      // Skipped when it's already known, e.g. the visitor clicked an LED truck booking link.
      { key: 'eventType', say: function () { return lines(ST.eventType.say); }, chips: ST.eventType.options, when: function () { return !answers.eventType; } },
      { key: 'headcount', say: function () { return lines(ST.headcount.say); }, text: ST.headcount.placeholder, skip: ST.headcount.skip },
      { key: 'headcountIs', say: function () { return lines(ST.headcountIs.say); }, chips: ST.headcountIs.options, when: function () { return !!answers.headcount; } },
      { key: 'venue', say: function () { return lines(ST.venue.say); }, text: ST.venue.placeholder, skip: ST.venue.skip },
      { key: 'setting', say: function () { return lines(ST.setting.say); }, chips: ST.setting.options },
      { key: 'showTime', say: function () { return lines(ST.showTime.say); }, text: ST.showTime.placeholder, skip: ST.showTime.skip },
      { key: 'loadIn', say: function () { return lines(ST.loadIn.say); }, text: ST.loadIn.placeholder, skip: ST.loadIn.skip },
      { key: 'outBy', say: function () { return lines(ST.outBy.say); }, text: ST.outBy.placeholder, skip: ST.outBy.skip },
      { key: 'seeHear', say: function () { return lines(ST.seeHear.say); }, multi: ST.seeHear.options },
      { key: 'mustLand', say: function () { return lines(ST.mustLand.say); }, text: ST.mustLand.placeholder, skip: ST.mustLand.skip },
      { key: 'budget', say: function () { return lines(ST.budget.say); }, chips: ST.budget.options },
      { key: 'files', say: function () { return lines(ST.files.say); }, upload: true },
      { key: 'answer', say: function () { return lines(ST.answer.say); }, text: ST.answer.placeholder, number: true, required: true },
      { key: 'confirm',
        say: function () {
          var l = lines(offline ? ST.confirm.sayEmail : ST.confirm.say);
          if (offline && files.length) l[l.length - 1] += ' ' + ST.confirm.attachNote;
          return l;
        },
        chips: function () { return [offline ? ST.confirm.emailButton : ST.confirm.sendButton, ST.confirm.restartButton]; } }
    ];

    function first(n) { return String(n || '').trim().split(/\s+/)[0]; }

    function summaryRows() {
      return [
        [T.summary.name, answers.name + (answers.organization ? ', ' + answers.organization : '')],
        [T.summary.contact, answers.contact],
        [T.summary.eventType, answers.eventType],
        [T.summary.people, [answers.headcount, answers.headcountIs && answers.headcountIs.toLowerCase()].filter(Boolean).join(' · ')],
        [T.summary.where, [answers.venue, answers.setting].filter(Boolean).join(' · ')],
        [T.summary.when, [answers.showTime, answers.loadIn && T.summary.loadIn + ' ' + answers.loadIn, answers.outBy && T.summary.outBy + ' ' + answers.outBy].filter(Boolean).join(' · ')],
        [T.summary.seeHear, (answers.seeHear || []).join(', ')],
        [T.summary.mustLand, answers.mustLand],
        [T.summary.budget, answers.budget],
        [T.summary.files, files.filter(function (f) { return !f.error; }).map(function (f) { return f.file.name; }).concat(answers.links ? [answers.links] : []).join(', ')],
        [T.summary.note, answers.details]
      ].filter(function (r) { return r[1]; });
    }

    function summary() {
      var rows = summaryRows();
      return { html: '<dl class="bot-summary">' + rows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' };
    }

    function build() {
      panel = document.createElement('dialog');
      panel.className = 'bot';
      panel.setAttribute('aria-label', fill(T.header.title));
      panel.innerHTML =
        '<div class="bot-head"><div><strong><span class="long">' + esc(fill(T.header.title)) + '</span><span class="short">' + esc(fill(T.header.shortTitle)) + '</span></strong><span class="sub">' + esc(fill(T.header.subtitle)) + '</span></div>' +
          '<button type="button" class="bot-message">' + esc(T.header.messageButton) + '</button>' +
          '<button type="button" class="bot-restart" aria-label="Start over"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>' +
          '<button type="button" class="bot-close" aria-label="Close"><svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="2"/></svg></button></div>' +
        '<div class="bot-log" role="log" aria-live="polite"></div>' +
        '<div class="bot-chips"></div>' +
        '<form class="bot-entry" novalidate><input type="text" aria-label="Your answer" autocomplete="off"><button type="submit" class="bot-send" aria-label="Send"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></button></form>' +
        '<input type="file" class="bot-file" multiple accept="' + ACCEPT + '" hidden>';
      document.body.appendChild(panel);
      log = panel.querySelector('.bot-log');
      chips = panel.querySelector('.bot-chips');
      entry = panel.querySelector('.bot-entry');
      input = entry.querySelector('input');
      sendBtn = entry.querySelector('.bot-send');

      panel.querySelector('.bot-close').addEventListener('click', function () { panel.close(); });
      panel.querySelector('.bot-restart').addEventListener('click', start);
      panel.addEventListener('close', function () {
        document.documentElement.classList.remove('bot-open');
        if (location.hash === '#talk' || location.hash === '#quote') history.replaceState(null, '', location.pathname + location.search);
        if (opener) opener.focus();
      });
      panel.querySelector('.bot-message').addEventListener('click', toMessage);
      entry.addEventListener('submit', function (e) { e.preventDefault(); if (!busy && input.value.trim()) reply(input.value.trim()); });
      panel.querySelector('.bot-file').addEventListener('change', function (e) {
        var before = files.length;
        addFiles(files, e.target.files);
        e.target.value = '';
        var added = files.slice(before);
        if (!added.length) return;
        userSays(added.map(function (f) { return '📎 ' + f.file.name + (f.error ? ' — ' + f.state : ''); }).join('\n'));
        var ok = added.filter(function (f) { return !f.error; }).length;
        botSays([fill(!ok ? ST.files.gotNone : ok === 1 ? ST.files.gotOne : ST.files.gotMany)], function () { showStepInputs(SCRIPT[step]); });
      });
    }

    function bubble(who, content) {
      var b = document.createElement('div');
      b.className = 'msg from-' + who;
      if (content && content.html) b.innerHTML = content.html; else b.textContent = content;
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      return b;
    }

    function userSays(text) { bubble('me', text); }

    // Switch to the simple contact form, keeping whatever the visitor clicked from.
    function toMessage() {
      var from = opener;
      opener = null;
      panel.close();
      getForm('inquiry').open(from, prefillNow);
    }

    // Bot lines appear one after another with a short typing pause.
    function botSays(lines, then) {
      busy = true;
      chips.innerHTML = '';
      var i = 0;
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      (function next() {
        if (i >= lines.length) { busy = false; if (then) then(); return; }
        var typing = bubble('bot typing', { html: '<span></span><span></span><span></span>' });
        setTimeout(function () { typing.remove(); bubble('bot', lines[i++]); next(); }, reduce ? 0 : 450);
      })();
    }

    // A button that opens a link (downloads, other pages) instead of answering.
    function linkChip(label, cls, href, download) {
      var a = document.createElement('a');
      a.className = 'chip-btn' + (cls ? ' ' + cls : '');
      a.href = href;
      a.textContent = label;
      if (download) a.setAttribute('download', '');
      else a.target = '_blank';
      chips.appendChild(a);
      return a;
    }

    // After sending: the capabilities deck (or fleet catalog) and work matching their event type.
    var WORK_FILTER = { 'Gala / conference': 'galas', 'Corporate / forum': 'corporate', 'Festival / concert': 'festivals', 'Sporting / activation': 'sporting', 'Government / civic': 'civic' };
    function followUp(then) {
      botSays([fill(T.messages.followUp)], function () {
        if (isLed || answers.eventType === 'LED truck rental') {
          linkChip(T.messages.fleetDeckButton, 'primary', 'assets/decks/led-truck-co-fleet.pdf', true);
          linkChip(T.messages.fleetButton, '', 'led-fleet.html');
        } else {
          var f = WORK_FILTER[answers.eventType];
          linkChip(T.messages.deckButton, 'primary', 'assets/decks/control-video-capabilities.pdf', true);
          linkChip(T.messages.similarWorkButton, '', 'work.html' + (f ? '?filter=' + f : ''));
        }
        then();
        log.scrollTop = log.scrollHeight;
      });
    }

    function chip(label, cls, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn' + (cls ? ' ' + cls : '');
      b.textContent = label;
      b.addEventListener('click', fn);
      chips.appendChild(b);
      return b;
    }

    function showStepInputs(s) {
      chips.innerHTML = '';
      var textMode = !!s.text;
      entry.hidden = !textMode && !s.upload;
      input.value = '';
      input.type = s.number ? 'number' : 'text';
      input.inputMode = s.number ? 'numeric' : 'text';
      input.placeholder = s.upload ? ST.files.placeholder : (s.text || '');
      if (s.chips) (typeof s.chips === 'function' ? s.chips() : s.chips).forEach(function (c) { chip(c, c === ST.confirm.sendButton || c === ST.confirm.emailButton ? 'primary' : '', function () { reply(c); }); });
      if (s.multi) {
        var picked = [];
        s.multi.forEach(function (c) {
          var b = chip(c, 'toggle', function () {
            var on = picked.indexOf(c) === -1;
            if (on) picked.push(c); else picked.splice(picked.indexOf(c), 1);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          b.setAttribute('aria-pressed', (answers.preSeeHear || []).indexOf(c) !== -1 ? (picked.push(c), 'true') : 'false');
        });
        chip(ST.seeHear.done, 'primary', function () { reply(picked.length ? picked.slice() : [s.multi[s.multi.length - 1]]); });
      }
      if (s.upload) {
        chip(ST.files.addButton, 'primary', function () { panel.querySelector('.bot-file').click(); });
        chip(files.length ? ST.files.doneButton : ST.files.noneButton, '', function () { reply(input.value.trim() || ''); });
      }
      if (s.skip) chip(s.skip, 'ghost', function () { reply(null); });
      if (step === 0) chip(ST.name.messageInstead, 'ghost', toMessage);
      if (textMode || s.upload) input.focus(); else { var firstChip = chips.querySelector('button'); if (firstChip) firstChip.focus(); }
    }

    function reply(value) {
      var s = SCRIPT[step];
      var shown = value === null ? s.skip : Array.isArray(value) ? value.join(', ') : value;
      if (s.upload && !value) shown = files.length ? ST.files.doneButton : ST.files.noneButton;
      if (shown) userSays(shown);
      if (s.check && value) {
        var problem = s.check(value);
        if (problem) return botSays([problem], function () { showStepInputs(s); });
      }
      if (s.key === 'confirm') return value === ST.confirm.sendButton ? send() : value === ST.confirm.emailButton ? emailIt() : start();
      if (s.upload) { if (value) answers.links = value; }
      else answers[s.key] = value === null ? '' : value;
      step++;
      ask();
    }

    function ask() {
      while (SCRIPT[step] && SCRIPT[step].when && !SCRIPT[step].when()) step++;
      var s = SCRIPT[step];
      // The quick check needs the online form. If it can't be reached, skip it and finish by email.
      if (s.key === 'answer' && !challenge && !offline) {
        busy = true;
        getChallenge('inquiry').then(function (c) { challenge = c; }, function () { offline = true; })
          .then(function () { busy = false; if (offline) step++; ask(); });
        return;
      }
      var lines = typeof s.say === 'function' ? s.say() : s.say;
      botSays(lines, function () { showStepInputs(s); });
    }

    function emailIt() {
      openEmail('Project inquiry: ' + answers.name, summaryRows().concat([['Came from', '5-things bot · ' + location.href]]));
      botSays(lines(T.messages.emailOpening), function () { followUp(function () {
        chip(T.messages.closeButton, '', function () { panel.close(); });
        chip(T.messages.emailAgainButton, '', emailIt);
      }); });
    }

    function send() {
      entry.hidden = true;
      var contact = answers.contact || '';
      var payload = {
        site: SITE, channel: '5-things bot', eventType: answers.eventType || '',
        name: answers.name, email: /@/.test(contact) ? contact : '', phone: /@/.test(contact) ? '' : contact,
        organization: answers.organization, headcount: answers.headcount, headcountIs: answers.headcountIs,
        venue: answers.venue, setting: answers.setting, showTime: answers.showTime, loadIn: answers.loadIn, outBy: answers.outBy,
        seeHear: answers.seeHear || [], mustLand: answers.mustLand, budget: answers.budget, links: answers.links || '',
        details: answers.details || '', page: location.href, website: '',
        answer: answers.answer, ts: challenge && challenge.ts, token: challenge && challenge.token
      };
      var status = null;
      botSays([fill(T.messages.sending)], function () {
        status = log.lastChild;
        submit('inquiry', payload, files, function () {
          var up = files.filter(function (f) { return f.state === 'Uploading…'; })[0];
          if (up && status) status.textContent = fill(T.messages.uploading, { file: up.file.name });
        }).then(function () {
          if (status) status.remove();
          botSays(lines(T.messages.sent), function () { followUp(function () {
            chip(T.messages.closeButton, '', function () { panel.close(); });
            chip(T.messages.anotherButton, '', start);
          }); });
        }).catch(function (err) {
          if (status) status.remove();
          var msg = err && err.message ? err.message : 'Something went wrong.';
          if (/answer|check|time/i.test(msg)) {
            // Wrong answer or timing: fetch a fresh question and ask again.
            getChallenge('inquiry').then(function (c) { challenge = c; }, function () {}).then(function () {
              step = SCRIPT.map(function (x) { return x.key; }).indexOf('answer');
              botSays([msg], ask);
            });
          } else {
            botSays([fill(T.messages.error, { error: msg })], function () {
              chip(T.messages.tryAgainButton, 'primary', send);
              chip(ST.confirm.emailButton, '', emailIt);
            });
          }
        });
      });
    }

    // Restarting (or "Start another") keeps what the visitor clicked from, e.g. a truck booking.
    function start(prefill) {
      prefill = prefill && prefill.eventType ? prefill : (prefillNow || {});
      prefillNow = prefill;
      answers = { eventType: prefill.eventType || '', details: prefill.details || '', preSeeHear: prefill.seeHear ? [prefill.seeHear] : [] };
      files = [];
      step = 0;
      log.innerHTML = '';
      challenge = null;
      offline = false;
      getChallenge('inquiry').then(function (c) { challenge = c; }, function () {});
      ask();
    }

    function open(from, prefill) {
      if (!panel) build();
      opener = from || null;
      document.documentElement.classList.add('bot-open');
      panel.showModal();
      if (!answers || (prefill && prefill.eventType)) { prefillNow = null; start(prefill); }
      else showStepInputs(SCRIPT[step]);
    }

    return { open: open };
  })();

  // ---------- wire up links ----------

  function subjectOf(a) {
    return decodeURIComponent(((a.getAttribute('href') || '').match(/subject=([^&]*)/) || [])[1] || '');
  }

  document.querySelectorAll('a[href^="mailto:' + EMAIL + '"], [data-talk]').forEach(function (a) {
    var subject = subjectOf(a);
    var careers = /careers/i.test(subject) || a.getAttribute('data-talk') === 'careers';
    // Plain email-address links (footer, contact lines) stay as mailto links.
    if (!careers && !a.hasAttribute('data-talk') && !a.classList.contains('btn') && !a.classList.contains('card')) return;
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (careers) return getForm('careers').open(a);
      var prefill = {};
      if (isLed || /LED|truck|booking/i.test(subject)) {
        prefill.eventType = 'LED truck rental';
        prefill.seeHear = 'LED truck or trailer';
        var rig = subject.replace(/\s*booking$/i, '');
        if (rig && !/^LED truck$/i.test(rig)) prefill.details = 'Interested in: ' + rig;
      }
      bot.open(a, prefill);
    });
  });

  if (location.hash === '#talk' || location.hash === '#quote') bot.open(null, isLed ? { eventType: 'LED truck rental', seeHear: 'LED truck or trailer' } : null);
  if (location.hash === '#message') getForm('inquiry').open();
  if (location.hash === '#careers') getForm('careers').open();
})();
