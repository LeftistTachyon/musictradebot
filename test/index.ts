const a = {};
if (false) {
  Object.assign(a, [0]);
}
console.log(a, Object.keys(a).length);
