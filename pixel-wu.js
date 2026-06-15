/**
 * @schema 2.11
 */
const P = { '.': null, K: '#2C2017', W: '#FFFFFF', O: '#F5A031', o: '#FFC15E', B: '#7FC4E3', b: '#DCEFF8', R: '#D97B17' };
const ART = [
  "....O..O....",
  "....o..o....",
  "...KKKKKK...",
  "..KooooooK..",
  ".KooooooooK.",
  ".KoBBooBBoK.",
  ".KoBWooBWoK.",
  ".KooooooooK.",
  ".KoKKKKKKoK.",
  ".KooooooooK.",
  "..KKKKKKKK..",
  "...KK..KK..."
];
const cols = ART[0].length;
const rows = ART.length;
const cell = Math.floor(Math.min(pencil.width / cols, pencil.height / rows));
const nodes = [];
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const color = P[ART[r][c]];
    if (!color) continue;
    nodes.push({ type: "rectangle", name: "px", x: c * cell, y: r * cell, width: cell, height: cell, fill: color });
  }
}
return nodes;
