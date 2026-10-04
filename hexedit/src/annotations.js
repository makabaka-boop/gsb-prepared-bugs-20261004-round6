import { mapThrough } from "./mapping.js";

export class AnnotationSet {
  constructor() {
    this.items = [];
    this.nextId = 1;
  }
  add(label, start, end, length) {
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end <= start ||
      end > length
    )
      throw new RangeError("annotation must cover existing bytes");
    const item = { id: this.nextId++, label: String(label), start, end };
    this.items = [...this.items, item];
    return item.id;
  }
  snapshot() {
    return this.items.map((x) => ({ ...x }));
  }
  restore(items) {
    this.items = items.map((x) => ({ ...x }));
  }
  project(edits) {
    this.items = projectRanges(this.items, edits);
  }
}

export function sequentialDescriptors(edits) {
  let delta = 0;
  return edits.map((e) => {
    const d = {
      pos: e.pos + delta,
      deleteLen: e.deleteLen,
      insertLen: e.insertLen ?? e.insert.length,
    };
    delta += d.insertLen - d.deleteLen;
    return d;
  });
}

export function projectRanges(items, edits) {
  const descs = edits.map((e) => ({
    pos: e.pos,
    deleteLen: e.deleteLen,
    insertLen: e.insertLen ?? e.insert.length,
  }));
  return items.map((x) => ({
    ...x,
    start: mapThrough(x.start, descs),
    end: mapThrough(x.end, descs),
  }));
}
