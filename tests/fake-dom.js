'use strict';
/*
 * A very small stand-in for a browser page, just enough to run workbook.js under
 * Node: it reads the elements of index.html that have an id or a data- attribute,
 * supports the few DOM calls the workbook makes, and lets a test click buttons,
 * type into boxes and choose options. It is not a browser: it does no layout,
 * runs no CSS and knows nothing of accessibility. It catches mistakes in the
 * page's logic, not in how the page looks.
 */

class FakeText {
  constructor(t) { this.textContent = String(t); this.parentNode = null; }
}

class FakeElement {
  constructor(doc, tag, attrs, isStatic) {
    this.ownerDocument = doc;
    this.tagName = tag.toUpperCase();
    this.attrs = Object.assign({}, attrs || {});
    this.children = [];
    this.listeners = {};
    this.parentNode = null;
    this._text = '';
    this._static = !!isStatic;
    this.value = this.attrs.value || '';
    this.checked = 'checked' in this.attrs;
    this.hidden = 'hidden' in this.attrs;
    doc._all.push(this);
  }
  get id() { return this.attrs.id || ''; }
  get name() { return this.attrs.name || ''; }
  get type() { return this.attrs.type || ''; }
  get className() { return this.attrs.class || ''; }
  set className(v) { this.attrs.class = v; }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k === 'value') { this.value = String(v); }
  }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  hasAttribute(k) { return k in this.attrs; }
  appendChild(c) {
    if (c.parentNode && c.parentNode.removeChild) { c.parentNode.removeChild(c); }
    this.children.push(c);
    c.parentNode = this;
    if (this.tagName === 'SELECT' && c.tagName === 'OPTION' && !this.value) { this.value = c.attrs.value; }
    return c;
  }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); c.parentNode = null; return c; }
  get textContent() { return this._text + this.children.map((c) => c.textContent).join(''); }
  set textContent(v) { this._text = String(v); this.children.forEach((c) => { c.parentNode = null; }); this.children = []; }
  get isConnected() {
    let e = this;
    while (e) { if (e._static) { return true; } e = e.parentNode; }
    return false;
  }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  dispatch(type) {
    const ev = { type, target: this };
    (this.listeners[type] || []).forEach((fn) => fn.call(this, ev));
    if (type === 'input' || type === 'change') { this.ownerDocument._dispatch(type, ev); }
  }
  click() { this.dispatch('click'); }
  focus() { this.ownerDocument.activeElement = this; }
  select() { /* nothing to select in a fake page */ }
}

function parseAttrs(s) {
  const attrs = {};
  const re = /([A-Za-z_:][\w:.-]*)(?:\s*=\s*"([^"]*)")?/g;
  let m;
  while ((m = re.exec(s))) { attrs[m[1]] = m[2] === undefined ? '' : m[2]; }
  return attrs;
}

class FakeDocument {
  constructor(html) {
    this._all = [];
    this._listeners = {};
    this.readyState = 'complete';
    this.activeElement = null;
    this.body = new FakeElement(this, 'body', {}, true);
    const tag = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
    let m;
    while ((m = tag.exec(html))) {
      const attrs = parseAttrs(m[2]);
      if (attrs.id || Object.keys(attrs).some((k) => k.startsWith('data-'))) { new FakeElement(this, m[1], attrs, true); }
    }
  }
  _dispatch(type, ev) { (this._listeners[type] || []).forEach((fn) => fn(ev)); }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  getElementById(id) { return this._all.find((e) => e.id === id && e.isConnected) || null; }
  createElement(tag) { return new FakeElement(this, tag, {}, false); }
  createTextNode(t) { return new FakeText(t); }
  execCommand() { return true; }
  querySelectorAll(sel) {
    const m = sel.match(/^([a-z]+)?(?:\[([\w-]+)(?:="([^"]*)")?\])?(?:\.([\w-]+))?(:checked)?$/i);
    if (!m) { throw new Error('The fake page does not understand the selector: ' + sel); }
    const [, tag, attr, val, cls, checked] = m;
    return this._all.filter((e) => e.isConnected &&
      (!tag || e.tagName === tag.toUpperCase()) &&
      (!attr || (e.hasAttribute(attr) && (val === undefined || e.getAttribute(attr) === val))) &&
      (!cls || e.className.split(/\s+/).includes(cls)) &&
      (!checked || e.checked));
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

function fakeStorage() {
  const data = {};
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; }
  };
}

/** Puts a fake page in place and loads workbook.js into it, as a browser would. */
function openPage(html, storage) {
  const path = require('path');
  const doc = new FakeDocument(html);
  const win = { localStorage: storage || fakeStorage(), confirm: () => true };
  globalThis.document = doc;
  globalThis.window = win;
  const file = path.join(__dirname, '..', 'participant', 'workbook', 'workbook.js');
  delete require.cache[require.resolve(file)];
  const page = require(file);
  return { doc, win, page, $: (id) => doc.getElementById(id) };
}
function closePage() { delete globalThis.document; delete globalThis.window; }

/** Types text into a box, as a person would: the page hears an input event. */
function type(el, text) { el.value = text; el.dispatch('input'); }
/** Chooses one radio of a group, or an option of a select. */
function choose(doc, name, value) {
  const radios = doc.querySelectorAll('input[name="' + name + '"]');
  if (radios.length) {
    radios.forEach((r) => { r.checked = r.value === value; });
    const r = radios.find((x) => x.value === value);
    if (!r) { throw new Error('No option ' + value + ' in ' + name); }
    r.dispatch('change');
    return;
  }
  const sel = doc.getElementById(name);
  sel.value = value;
  sel.dispatch('change');
}

module.exports = { openPage, closePage, fakeStorage, type, choose };
