index.html: collect.html index.js utils.js build.py build.js
	@./build.js
	@./build.py

collect.html: collect.jade
	@pug -P < $< > $@

.PHONY: test clean
test:
	@open index.html

clean:
	-rm index.html collect.html info.js