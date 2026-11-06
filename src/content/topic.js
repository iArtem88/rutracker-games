'use strict';

// A release's own topic, in the sections the extension knows: the spoilers
// with screenshots open by themselves, and the screenshots open in our viewer
// (see viewer.js), as in the list. Only the release's post, not the comments.

let settings = null;

(() => {
  const crumbs = document.querySelectorAll('.t-breadcrumb-top a[href*="viewforum.php?f="]');
  const forumId = /[?&]f=(\d+)/.exec(crumbs[crumbs.length - 1]?.getAttribute('href') || '')?.[1];
  if (!forumId || !sectionForForum(forumId)) return;
  // The post with the torrent (a guest sees a notice in its place), or else
  // the first one on the topic's first page
  const posts = [...document.querySelectorAll('.post_body')];
  const post = posts.find((body) => body.closest('tbody')?.querySelector('.attach, .attach_link, a.dl-link, a.magnet-link'))
    || (/[?&](?:start=[1-9]|p=)/.test(location.search) ? null : posts[0]);
  if (!post) return;
  const spoilers = [...post.querySelectorAll('.sp-wrap')].filter((wrap) => SHOTS_HEAD.test(wrap.querySelector(':scope > .sp-head')?.textContent || ''));
  if (!spoilers.length) return;
  const bodies = spoilers.map((wrap) => wrap.querySelector(':scope > .sp-body')).filter(Boolean);
  const bodyOf = (node) => bodies.find((body) => body.contains(node));

  // The site makes <img> of the <var> once a spoiler opens
  const pictures = (body) => [...body.querySelectorAll('var.postImg, img.postImg')]
    .filter((picture) => !IMAGEBAM.test(picture.getAttribute('title') || picture.getAttribute('src') || ''));
  // The site swaps an outside link for its out.php?url=… at the first press
  // of a mouse button on it
  const linkOf = (anchor) => {
    const href = anchor?.getAttribute('href') || '';
    return (/^(?:\.?\/)?(?:forum\/)?out\.php\?/.test(href) && new URL(href, location.href).searchParams.get('url')) || href;
  };
  const shotOf = (picture) => {
    const shot = makeShot(picture.getAttribute('title') || picture.getAttribute('src'), linkOf(picture.closest('a.postLink')));
    if (!viewable(shot) && picture.tagName === 'IMG' && Math.max(picture.naturalWidth, picture.naturalHeight) >= FULL_SIZE_MIN) {
      shot.full = shot.thumb;
    }
    return shot;
  };

  // A magnifier on the ones that open in the viewer (on the link around, or
  // just the cursor on a picture with none)
  const mark = (img) => {
    if (!img.matches?.('img.postImg') || !bodyOf(img)) return;
    const on = settings?.enabled && viewable(shotOf(img));
    (img.closest('a.postLink') || img).classList.toggle('rts-topic-zoom', Boolean(on));
  };
  const markAll = () => bodies.forEach((body) => body.querySelectorAll('img.postImg').forEach(mark));
  // load doesn't bubble: caught on the way down
  post.addEventListener('load', (event) => mark(event.target), true);

  // A plain click shows the screenshots of that spoiler in our viewer; Ctrl,
  // Shift or the middle button open the link as before
  document.addEventListener('click', (event) => {
    if (!settings?.enabled || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const picture = event.target.closest?.('img.postImg');
    const body = picture && bodyOf(picture);
    if (!body) return;
    // Not the ones a dead image host never gave
    const all = pictures(body).filter((node) => node === picture || !(node.tagName === 'IMG' && node.complete && !node.naturalWidth));
    const shots = all.map(shotOf);
    const shot = shots[all.indexOf(picture)];
    if (!shot || !viewable(shot)) return;
    event.preventDefault();
    event.stopPropagation();
    const shown = shots.filter(viewable);
    openViewer(shown, shown.indexOf(shot), picture.closest('a.postLink') || picture);
  }, true);

  // The site's own handler opens a spoiler and loads its pictures. It's there
  // a moment after the page is parsed: a click that changes nothing is tried
  // again (a changed one never, not to close it back)
  const open = (heads, tries = 50) => {
    const waiting = heads.filter((head) => {
      const before = head.className;
      head.click();
      return head.className === before;
    });
    if (waiting.length && tries > 1) setTimeout(() => open(waiting, tries - 1), 100);
  };

  // Once a page: turned off later, they stay as they are
  let opened = false;
  const apply = (next) => {
    settings = next;
    if (settings.enabled && settings.openShotSpoilers && !opened) {
      opened = true;
      open(spoilers.map((wrap) => wrap.querySelector(':scope > .sp-head')).filter((head) => head && !head.classList.contains('unfolded')));
    }
    markAll();
  };
  loadSettings().then((loaded) => {
    apply(loaded);
    onSettingsChanged(apply);
  });
})();
