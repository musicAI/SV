#!/usr/bin/env python3

import numpy as np, pandas as pd, hashlib, json
from Crypto.Cipher import AES

def hash8(data, n=8):
    return hashlib.sha256(data.encode('utf-8')).hexdigest()[:n]




with open('collect.html', 'r') as f:
	html = f.read()
for s in ['utils', 'info', 'index']:
	with open(s + '.js', 'r') as f:
		script = f.read();
	html = html.replace(f'<script src="{s}.js"></script>', f'<script>\n{script}\n</script>');

with open('index.html', 'w') as f:
	f.write(html)
