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

// Full-screen forms, opened by call-to-action links that would otherwise email hello@.
// Two separate paths: "Let's talk" project inquiries, and Careers (candidates, from any
// link whose subject is "Careers"). Without JS the links still work as plain mailto links.
(function () {
  var EMAIL = 'hello@controlvideo.com';
  var PHONE = '(301) 277-3429';
  // The form API runs on Netlify. On GitHub Pages, post across to the Netlify site.
  var API_ROOT = (window.CV_API || (location.hostname.endsWith('github.io') ? 'https://control-video-review.netlify.app' : '')) + '/api/';
  var MAX_BYTES = 5 * 1024 * 1024;
  var MAX_FILES = 10;
  var ACCEPT = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.heic,.svg,.tif,.tiff,.dwg,.dxf,.vwx,.skp,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.key,.pages,.numbers,.txt,.rtf,.zip,.mp4,.mov';
  var isLed = document.body.classList.contains('light');
  if (!window.HTMLDialogElement) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function select(id, name, label, list) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '" name="' + name + '"><option value="">Choose…</option>' +
      list.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('') + '</select></div>';
  }
  function input(id, name, label, type, extra) {
    return '<div class="field' + (extra && extra.full ? ' full' : '') + '"><label for="' + id + '">' + label + (extra && extra.req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' +
      '<input id="' + id + '" name="' + name + '" type="' + type + '"' + (extra && extra.ac ? ' autocomplete="' + extra.ac + '"' : '') + (extra && extra.req ? ' required' : '') + (extra && extra.ph ? ' placeholder="' + esc(extra.ph) + '"' : '') + '></div>';
  }
  function checks(id, name, label, list) {
    return '<div class="field full" role="group" aria-labelledby="' + id + '"><span class="label" id="' + id + '">' + label + ' <span class="hint">— pick any</span></span><div class="checks">' +
      list.map(function (v) { return '<label><input type="checkbox" name="' + name + '" value="' + esc(v) + '">' + esc(v) + '</label>'; }).join('') + '</div></div>';
  }
  function textarea(id, name, label, ph, rows) {
    return '<div class="field full"><label for="' + id + '">' + label + '</label><textarea id="' + id + '" name="' + name + '"' + (rows ? ' rows="' + rows + '" style="min-height:96px"' : '') + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></textarea></div>';
  }
  function legend(n, text) { return '<legend><span class="num">0' + n + '</span>' + text + '</legend>'; }

  var FORMS = {
    inquiry: {
      eyebrow: isLed ? 'LED Truck Co.' : 'Control Video',
      title: 'Let’s talk.',
      lede: 'Send us what you have — drawings, a run of show, a floor plan, photos of the room. The people who will plan and run it will reply, usually within one business day.',
      done: 'Thanks — it’s with our team.',
      sections: function (p) {
        return '<fieldset>' + legend(1, 'About you') + '<div class="fields">' +
            input(p + 'name', 'name', 'Name', 'text', { req: 1, ac: 'name' }) + input(p + 'email', 'email', 'Email', 'email', { req: 1, ac: 'email' }) +
            input(p + 'phone', 'phone', 'Phone', 'tel', { ac: 'tel' }) + input(p + 'org', 'organization', 'Organization', 'text', { ac: 'organization' }) +
          '</div></fieldset>' +
          '<fieldset>' + legend(2, 'The event') + '<div class="fields">' +
            select(p + 'type', 'eventType', 'Event type', ['Gala / conference', 'Corporate / forum', 'Festival / concert', 'Sporting / activation', 'Government / civic', 'LED truck rental', 'Other']) +
            input(p + 'date', 'eventDate', 'Event date', 'date') +
            input(p + 'venue', 'venue', 'Venue or location', 'text', { full: 1, ph: 'e.g. National Building Museum, or “outdoor field, Fairfax”' }) +
            select(p + 'aud', 'audience', 'Audience size', ['Under 100', '100–500', '500–2,000', '2,000–10,000', '10,000+', 'Not sure yet']) +
            select(p + 'budget', 'budget', 'Budget', ['Under $10k', '$10k–$25k', '$25k–$75k', '$75k–$150k', '$150k+', 'Not sure yet']) +
            checks(p + 'svc', 'services', 'What you need', ['LED walls', 'Projection', 'Cameras / IMAG', 'Livestream / webcast', 'Audio', 'Lighting', 'LED truck or trailer', 'Show calling / crew']) +
            textarea(p + 'details', 'details', 'Tell us about the show', 'Schedule, rooms, content, who’s on stage, what worries you…') +
          '</div></fieldset>';
      },
      filesHint: 'Drawings, run of show, floor plans, renders, content.',
      linksLabel: 'Shared links <span class="hint">— Dropbox, Drive, WeTransfer for anything bigger</span>',
      payload: function (fd) {
        return {
          organization: fd.get('organization'), site: isLed ? 'LED Truck Co.' : 'Control Video',
          eventType: fd.get('eventType'), eventDate: fd.get('eventDate'), venue: fd.get('venue'),
          audience: fd.get('audience'), budget: fd.get('budget'), services: fd.getAll('services')
        };
      }
    },
    careers: {
      eyebrow: 'Careers',
      title: 'Join the crew.',
      lede: 'We hire full-time staff and build a bench of freelancers for show days. Tell us what you do and send your résumé — someone who runs shows will read it.',
      done: 'Thanks — we’ve got your application.',
      sections: function (p) {
        return '<fieldset>' + legend(1, 'About you') + '<div class="fields">' +
            input(p + 'name', 'name', 'Name', 'text', { req: 1, ac: 'name' }) + input(p + 'email', 'email', 'Email', 'email', { req: 1, ac: 'email' }) +
            input(p + 'phone', 'phone', 'Phone', 'tel', { ac: 'tel' }) + input(p + 'loc', 'location', 'Where you’re based', 'text', { ac: 'address-level2', ph: 'e.g. Silver Spring, MD' }) +
          '</div></fieldset>' +
          '<fieldset>' + legend(2, 'Your work') + '<div class="fields">' +
            checks(p + 'roles', 'roles', 'Roles', ['Video engineer', 'LED technician', 'Camera operator', 'Audio', 'Lighting', 'Project / production manager', 'Driver / rigger (LED trucks)', 'Other']) +
            select(p + 'avail', 'availability', 'Looking for', ['Full-time', 'Freelance / crew call', 'Either']) +
            select(p + 'exp', 'experience', 'Years in live events', ['Under 1', '1–3', '3–7', '7+']) +
            textarea(p + 'details', 'details', 'About you', 'Shows you’ve worked, gear you know, certifications, when you can start…') +
          '</div></fieldset>';
      },
      filesHint: 'Résumé, certifications, stills from your work.',
      linksLabel: 'Portfolio, reel or LinkedIn',
      payload: function (fd) {
        return { location: fd.get('location'), roles: fd.getAll('roles'), availability: fd.get('availability'), experience: fd.get('experience') };
      }
    }
  };

  var dialogs = {};

  function build(kind) {
    var cfg = FORMS[kind];
    var p = kind.charAt(0) + '-';
    var api = API_ROOT + kind;
    var dlg = document.createElement('dialog');
    dlg.className = 'talk';
    dlg.setAttribute('aria-labelledby', p + 'title');
    dlg.innerHTML =
      '<div class="talk-bar"><div class="wrap"><span class="eyebrow">' + cfg.eyebrow + '</span>' +
      '<button type="button" class="talk-close" aria-label="Close"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="2"/></svg></button></div></div>' +
      '<div class="wrap talk-body">' +
        '<div class="talk-aside"><h2 id="' + p + 'title">' + cfg.title + '</h2><p class="lede">' + cfg.lede + '</p>' +
          '<div class="alt">Rather talk now?<a href="tel:+13012773429">Call ' + PHONE + '</a><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></div></div>' +
        '<div class="talk-main">' +
        '<form class="talk-form" novalidate>' + cfg.sections(p) +
          '<fieldset>' + legend(3, 'Files and links') +
            '<div class="drop"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 21V5M9 12l7-7 7 7M5 21v5h22v-5" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>' +
              '<strong>Drop files here or browse</strong><span class="hint">' + cfg.filesHint + ' Up to ' + MAX_FILES + ' files, 5 MB each.</span>' +
              '<input type="file" multiple accept="' + ACCEPT + '" aria-label="Add files"></div>' +
            '<ul class="file-list" aria-live="polite"></ul>' +
            '<div class="field"><label for="' + p + 'links">' + cfg.linksLabel + '</label><textarea id="' + p + 'links" name="links" rows="3" style="min-height:96px"></textarea></div>' +
          '</fieldset>' +
          '<fieldset>' + legend(4, 'Quick check') +
            '<div class="check-row"><div class="field"><label for="' + p + 'answer" class="t-q">Loading question…</label><input id="' + p + 'answer" name="answer" type="number" inputmode="numeric" autocomplete="off" required></div>' +
            '<span class="hint">Keeps the robots out.</span></div>' +
            '<div class="hp" aria-hidden="true"><label for="' + p + 'website">Website</label><input id="' + p + 'website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
          '</fieldset>' +
          '<div class="form-error" role="alert" hidden></div>' +
          '<div class="submit-row"><button type="submit" class="btn btn-primary">Send it</button><p class="fine">We only use this to reply to you.</p></div>' +
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

    function fmt(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }

    function loadChallenge() {
      var q = dlg.querySelector('.t-q');
      q.textContent = 'Loading question…';
      return fetch(api + '/challenge', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (c) { challenge = c; q.textContent = c.question; })
        .catch(function () { challenge = null; q.textContent = 'Quick check unavailable'; });
    }

    function renderFiles() {
      list.innerHTML = '';
      files.forEach(function (f, i) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="fname"></span><span class="fsize"></span><span class="fstate"></span><button type="button">×</button>';
        li.querySelector('.fname').textContent = f.file.name;
        li.querySelector('.fsize').textContent = fmt(f.file.size);
        var st = li.querySelector('.fstate');
        st.textContent = f.state || '';
        if (f.error) st.classList.add('err');
        var b = li.querySelector('button');
        b.setAttribute('aria-label', 'Remove ' + f.file.name);
        b.addEventListener('click', function () { files.splice(i, 1); renderFiles(); });
        list.appendChild(li);
      });
    }

    function addFiles(fileList) {
      Array.prototype.forEach.call(fileList, function (file) {
        if (files.length >= MAX_FILES) return;
        var ext = (file.name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
        var entry = { file: file };
        if (ACCEPT.split(',').indexOf(ext) === -1) { entry.error = true; entry.state = 'Unsupported type'; }
        else if (file.size > MAX_BYTES) { entry.error = true; entry.state = 'Over 5 MB — add a link instead'; }
        files.push(entry);
      });
      renderFiles();
    }

    picker.addEventListener('change', function () { addFiles(picker.files); picker.value = ''; });
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer) addFiles(e.dataTransfer.files); });

    function showError(msg, field) {
      errBox.textContent = msg;
      errBox.hidden = false;
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); } else errBox.scrollIntoView({ block: 'nearest' });
    }

    function post(path, body, headers) {
      return fetch(api + path, { method: 'POST', headers: headers || { 'Content-Type': 'application/json' }, body: body })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Something went wrong.'); return j; }); });
    }

    form.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox.hidden = true;
      var fd = new FormData(form);
      var name = form.elements.name, email = form.elements.email, answer = form.elements.answer;
      if (!name.value.trim()) return showError('Please add your name.', name);
      if (!email.value.trim() || !email.validity.valid) return showError('Please add a valid email address.', email);
      if (!answer.value.trim()) return showError('Please answer the quick check.', answer);
      if (!challenge) return showError('We couldn’t load the quick check. Email ' + EMAIL + ' or call ' + PHONE + ' instead.');

      var payload = cfg.payload(fd);
      payload.name = fd.get('name'); payload.email = fd.get('email'); payload.phone = fd.get('phone');
      payload.details = fd.get('details'); payload.links = fd.get('links'); payload.page = location.href;
      payload.website = fd.get('website'); payload.answer = fd.get('answer'); payload.ts = challenge.ts; payload.token = challenge.token;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      post('', JSON.stringify(payload)).then(function (rec) {
        var failed = [];
        var queue = files.filter(function (f) { if (f.error) failed.push(f.file.name); return !f.error; });
        var i = 0;
        function next() {
          if (i >= queue.length) return Promise.resolve();
          var f = queue[i++];
          f.state = 'Uploading…'; renderFiles();
          return post('/file', f.file, {
            'Content-Type': f.file.type || 'application/octet-stream',
            'X-Record': rec.id, 'X-Upload-Token': rec.uploadToken, 'X-Filename': encodeURIComponent(f.file.name)
          }).then(function () { f.state = 'Uploaded'; }, function (err) { f.state = err.message; f.error = true; failed.push(f.file.name); })
            .then(function () { renderFiles(); return next(); });
        }
        return next().then(function () {
          return post('/finalize', JSON.stringify({ id: rec.id, uploadToken: rec.uploadToken, failedFiles: failed }));
        });
      }).then(function () {
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
      form.reset(); files = []; renderFiles();
      form.hidden = false; done.hidden = true; errBox.hidden = true;
    }

    dlg.addEventListener('close', function () {
      document.documentElement.classList.remove('talk-open');
      if (location.hash === '#' + kind) history.replaceState(null, '', location.pathname + location.search);
      if (opener) opener.focus();
    });
    dlg.querySelector('.talk-close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.talk-finish').addEventListener('click', function () { dlg.close(); reset(); });

    return {
      open: function (from, prefill) {
        opener = from || null;
        if (!done.hidden) reset();
        prefill = prefill || {};
        if (prefill.eventType) form.elements.eventType.value = prefill.eventType;
        if (prefill.service) { var box = form.querySelector('input[name=services][value="' + prefill.service + '"]'); if (box) box.checked = true; }
        if (prefill.details && !form.elements.details.value) form.elements.details.value = prefill.details;
        document.documentElement.classList.add('talk-open');
        dlg.showModal();
        form.elements.name.focus();
        loadChallenge();
      }
    };
  }

  function get(kind) { return dialogs[kind] || (dialogs[kind] = build(kind)); }

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
      if (careers) return get('careers').open(a);
      var prefill = {};
      if (isLed || /LED|truck|booking/i.test(subject)) {
        prefill.eventType = 'LED truck rental';
        prefill.service = 'LED truck or trailer';
        var rig = subject.replace(/\s*booking$/i, '');
        if (rig && !/^LED truck$/i.test(rig)) prefill.details = 'Interested in: ' + rig + '\n\n';
      }
      get('inquiry').open(a, prefill);
    });
  });

  if (location.hash === '#talk' || location.hash === '#inquiry') get('inquiry').open();
  if (location.hash === '#careers') get('careers').open();
})();
