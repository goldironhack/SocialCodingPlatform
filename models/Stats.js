const StatsSchema = new Bloggify.db.Schema({
    actor: String,
    metadata: Object,
    event: String,
    created_at: Date
})

StatsSchema.statics.record = data => {
    data.created_at = new Date()
    return Stats(data).save()
}

const Stats = module.exports = Bloggify.db.model("Stats", StatsSchema)
