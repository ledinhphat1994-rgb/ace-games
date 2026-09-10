-- S\u1eeda \u0111\u1ecba ch\u1ec9 tr\u01b0\u1eddng: 'Ph\u00e2n khu 2' \u2192 'Ph\u00e2n hi\u1ec7u 2' (\u0111\u00fang t\u00ean ch\u00ednh th\u1ee9c)
UPDATE lop
SET truong = REPLACE(truong, 'Ph\u00e2n khu 2', 'Ph\u00e2n hi\u1ec7u 2')
WHERE truong LIKE '%Ph\u00e2n khu 2%';
