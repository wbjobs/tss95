export class SpatialHash {
  private cellSize: number;
  private cells: Map<number, number[]>;
  private cols: number;
  private _version: number = 0;

  constructor(cellSize: number = 100, cols: number = 200) {
    this.cellSize = cellSize;
    this.cols = cols;
    this.cells = new Map();
  }

  clear(): void {
    this.cells.clear();
    this._version++;
  }

  private key(cx: number, cy: number): number {
    return cy * this.cols + cx;
  }

  insert(x: number, y: number, id: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const k = this.key(cx, cy);
    let cell = this.cells.get(k);
    if (!cell) {
      cell = [];
      this.cells.set(k, cell);
    }
    cell.push(id);
  }

  query(x: number, y: number, radius: number, out: number[]): number {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    let count = 0;
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const cell = this.cells.get(this.key(cx, cy));
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            out[count++] = cell[i];
          }
        }
      }
    }
    return count;
  }
}
