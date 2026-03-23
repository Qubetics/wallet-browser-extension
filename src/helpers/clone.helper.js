export function cloneArrayOfObjects(originalArray) {
  return originalArray.map((obj) => ({ ...obj }));
}
