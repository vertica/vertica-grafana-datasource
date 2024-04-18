import { toSelectableValue } from './toSelectableValue';

it('Checking working functionality of toSelectableValue function', () => {
  const result = toSelectableValue('TestString');

  expect(result).toStrictEqual({ label: 'TestString', value: 'TestString' });
});
