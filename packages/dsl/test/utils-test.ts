import { Nested, flatten } from '../src/utils';

QUnit.module('Utils');

QUnit.test('flatten', assert => {
  assert.deepEqual([...flatten(1)], [1], 'single item');

  assert.deepEqual([...flatten([1, 2, 3])], [1, 2, 3], 'simple array');

  assert.deepEqual([...flatten([])], [], 'empty array');

  let deeplyNested: Nested<number> = [
    1,
    [
      2, 3, [
        4, 5, 6,
        [7, []]
      ],
      [[[[[8]]]]],
      []
    ],
    9,
    [10]
  ];

  assert.deepEqual([...flatten(deeplyNested)], [1,2,3,4,5,6,7,8,9,10], 'deeply nested');
});
