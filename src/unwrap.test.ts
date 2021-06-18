import { unwrap } from './unwrap';

it('Verifying functionality of unwrap function keeping value null', () => {
  expect(() => {
    unwrap(null);
  }).toThrow('value must not be nullish');
});
it('Verifying functionality of unwrap function keeping value undefined', () => {
  expect(() => {
    unwrap(undefined);
  }).toThrow('value must not be nullish');
});
it(' Verifying functionality of unwrap function passing numeric value', () => {
  const result = unwrap(45);
  expect(result).toBe(45);
});
