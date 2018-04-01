SECRET_DIR  =secret #

index.html: collect.html index.js utils.js build.js info.js
	@./build.js $@

collect.html: collect.jade
	@pug -P < $< > $@


info.js: $(SECRET_DIR) build.js
	@./build.js $@

.PHONY: test clean

test:
	@open index.html

clean:
	-rm index.html collect.html info.js