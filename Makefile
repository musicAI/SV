index.html: collect.html index.js utils.js
	@./build.py

collect.html: collect.jade
	@pug -P < $< > $@

.PHONY: test
test:
	@open index.html