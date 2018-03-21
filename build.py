#!/usr/bin/env python3

import numpy as np, pandas as pd, hashlib, json

df = pd.read_csv('secret/info.csv');
d = df.values.tolist()
h = list(map(lambda x:hashlib.sha256(
	(x[1]+', '+x[0]+';'+str(x[2])+';'+str(int(x[4]*100))).encode('utf-8')
	).hexdigest()[:8], d))

s = list(map(lambda x: x[1]+', '+x[0], d))

j = {
	'name': s,
	'hash': h
}

json.dump(j, open('secret/hash.json', 'w'), ensure_ascii=False)