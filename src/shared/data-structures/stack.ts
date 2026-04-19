/**
 * A generic stack backed by a plain array.
 * Provides standard stack operations with O(1) push, pop, and peek.
 */
export class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T {
    if (this.isEmpty()) throw new Error("Cannot pop from an empty stack");

    return this.items.pop()!;
  }

  peek(): T {
    if (this.isEmpty()) throw new Error("Cannot peek at an empty stack");

    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}
