/**
 * Minimal binary min-heap, keyed by an externally-supplied priority rather
 * than the value's own ordering. Array-backed, 0-indexed, standard layout
 * (parent = (i-1)/2, children = 2i+1 and 2i+2).
 *
 * Dijkstra and A* both use this with **lazy deletion** instead of a
 * decrease-key operation: when a shorter distance to a node is found, we
 * just push a new entry rather than hunting down and updating the old one.
 * When an entry is popped, the caller checks whether that node has already
 * been finalized with a better distance and skips it if so. Same O(log V)
 * push/pop, same overall O((V + E) log V) complexity as decrease-key would
 * give — simpler to implement correctly, at the cost of a few harmless
 * stale entries sitting in the heap.
 */
export class MinPriorityQueue<T> {
  private heap: Array<{ value: T; priority: number }> = [];

  get size(): number {
    return this.heap.length;
  }

  push(value: T, priority: number): void {
    this.heap.push({ value, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top.value;
  }

  private bubbleUp(index: number): void {
    let i = index;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].priority <= this.heap[i].priority) break;
      this.swap(parent, i);
      i = parent;
    }
  }

  private bubbleDown(index: number): void {
    let i = index;
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
  }
}
