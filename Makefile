SECRET_DIR  =secret #
PORT =3030 #

index.html: collect.html index.js utils.js build.js info.js
	@./build.js $@

collect.html: collect.jade
	@pug -P < $< > $@


info.js: $(SECRET_DIR) build.js
	@./build.js $@

.PHONY: test clean serve

test:
	@open index.html

clean:
	-rm index.html collect.html info.js

serve:
	@http-server -p $(PORT) &
	@ps $$(pgrep node) |grep $(PORT)