module.exports = ctx => {
	if (new Date() < Bloggify.models.Settings.HACK_TYPES[ctx.user.profile.hack_type].start_date) {
		ctx.redirect("/timeline")
		return false
	}
}