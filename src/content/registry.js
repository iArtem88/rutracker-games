'use strict';

// Forum sections the extension works in. Each file in src/sections/ registers
// one with registerSection(); on any other forum the extension stays idle and
// sends no requests. A section is
// {
//   id, title,
//   forumIds: ['1605'],                    // the f= of viewforum.php / tracker.php
//   settings: [{key, label, type, default, options, placeholder, permissions, builtIn}],  // optional;
//     type 'words': the user's words on top of `builtIn` ("Свои слова"), see switch.js
//   hint(settings) => text,                // optional, under the settings card
//   styles: [{id, cls, selector, sample(), colors}],  // optional, badge colors, see lib/badges.js
//   parse(lines, title, post, settings) => extra,  // optional, as topic.extra
//   lookup(topic, settings, ctx) => Promise,  // optional, data from elsewhere: ctx.lookup
//   badges(topic, settings, ctx) => [{text, cls|color, title, href}],  // optional
//   filters: [{id, label(settings), test(topic, settings, ctx), group}],  // optional; filters of one
//     group are levels of one choice, broadest first: one is on at a time
// }
// ctx is {forumId, title, lookup}.
// See docs/section-template.js.
const SECTIONS = [];

function registerSection(section) {
  SECTIONS.push(section);
}

function sectionForForum(forumId) {
  return SECTIONS.find((section) => section.forumIds.includes(String(forumId))) || null;
}
