module.exports = ctx => {
	ctx.params.filepath = ctx.url.pathname.split("preview")[1].slice(1)
	Bloggify.services.projects.streamFile(ctx);
	return false
};
