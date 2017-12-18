exports.record = (user, ev) => {
	return Bloggify.models.Settings.getSettings().then(settings => {
        ev.metadata.phase = settings.settings.hack_types[user.profile.hack_type].phase
        return Bloggify.models.Stats.record(ev)
    }).then(() =>
        ({ success: true })
    )
}