#!/usr/bin/env python3

import numpy as np, pandas as pd, hashlib, json
from Crypto.Cipher import AES

def encrypt(msg, passphrase):

	pass


def decrypt(enc_msg, passphrase):

	pass

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

with open('collect.html', 'r') as f:
	html = f.read()
for s in ['utils', 'info', 'index']:
	with open(s + '.js', 'r') as f:
		script = f.read();
	html = html.replace(f'<script src="{s}.js"></script>', f'<script>\n{script}\n</script>');

with open('index.html', 'w') as f:
	f.write(html)
