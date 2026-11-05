'use strict';

// Template for a new section. Copy it to src/sections/<name>.js, add the file
// to manifest.json (content_scripts[0].js, before content/content.js), and
// delete what you don't need: only `id`, `title` and `forumIds` are required.

// Give your constants and functions a section prefix: all files share one scope.
const MYSECTION_FIELD = /^[^\p{L}\p{N}]*Название\s+поля\s*:\s*(.+)$/iu;

registerSection({
  id: 'my-section',
  // Shown as the card title in the settings
  title: 'Мой раздел',
  // The f= of viewforum.php?f=… (subforums are separate forums)
  forumIds: ['123', '456'],

  // Optional: settings, shown in the settings page automatically.
  // type: 'toggle' (on/off), 'select' (options: {value: 'Подпись'}) or 'number'
  settings: [
    { key: 'showMySection', label: 'Моя метка', type: 'toggle', default: true },
  ],
  // Optional: a line under the settings card
  hint: (settings) => '',

  // Optional: facts from the first post: `lines` are its text lines, `post`
  // its element (for links), `settings` the user's (own words, see switch.js).
  // Kept as topic.extra; the cache keeps the post and parses it anew each time.
  parse(lines, title, post, settings) {
    const line = lines.find((l) => MYSECTION_FIELD.test(l));
    return { value: line ? MYSECTION_FIELD.exec(line)[1] : null, source: line };
  },

  // Optional: data from another site, see windows.js (Steam Deck). It goes
  // through background.js; the site goes to optional_host_permissions in the
  // manifest and to the setting's `permissions`, so the user agrees first.
  // lookup(topic, settings, { title }) { return ext.runtime.sendMessage({...}); },

  // Optional: the colors of this section's badges, editable on the "Внешний
  // вид" settings tab. `cls` is what the badge carries, `selector` matches it.
  styles: [{
    id: 'my-section.value',
    cls: 'rts-my-value',
    selector: '.rts-my-value',
    sample: () => 'Значение: 42',
    colors: { text: '#ffffff', background: '#1565c0', border: '#1565c0' },
  }],

  // Optional: badges after the common ones. cls is one of the styles above;
  // title is the tooltip; href makes it a link. ctx.lookup is what lookup() returned.
  badges(topic, settings, { forumId, lookup }) {
    const value = topic.extra?.value;
    if (!settings.showMySection || !value) return [];
    return [{ text: `Значение: ${value}`, cls: 'rts-my-value', title: topic.extra.source }];
  },

  // Optional: chips on the filter bar; only this section's rows are judged
  filters: [{
    id: 'mySectionHasValue',
    label: (settings) => 'Есть значение',
    test: (topic, settings, { forumId }) => !!topic.extra?.value,
  }],
});
