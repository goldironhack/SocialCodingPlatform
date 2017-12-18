module.exports = ctx => {
	const projectHash = ctx.params.projectHash
	    , url = Bloggify.services.crypto.decrypt(projectHash)

	return Promise.resolve({
		code_url: `${url}/edit?readonly=on`,
		view_url: `${url}/preview/index.html`
	})
}