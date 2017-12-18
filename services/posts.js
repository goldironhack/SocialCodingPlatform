module.exports = class Posts {
    static list (filters) {
        return Bloggify.models.Topic.getMore({
            filters
        })
    }
}
