const forEach = require("iterate-object")

const HACK_TYPES = Bloggify.models.Settings.HACK_TYPES
forEach(HACK_TYPES, (c, name) => {
    c.name = name
})


// Update settings
Bloggify.models.Settings.updateSettingsInternally()

function generateGetHackId(hType, name) {
    return () => {
        return Bloggify.models.User.aggregate([{
            $match: {
                "profile.hack_id": { $ne: null },
                "profile.hack_type": name
            }
        }, {
            $group: {
                _id: "$profile.hack_id",
                total: { $sum: 1 }
            }
        }]).then(docs => {
            const ids = Array(hType.subforums_count + 1).fill(0)
            docs.forEach(c => {
                ids[c._id] = c.total
            })
            let minId = 0
            let min = ids[minId]
            ids.forEach((count, index) => {
                if (count < min) {
                    minId = index
                    min = ids[minId]
                }
            })
            return minId
        })
    }
}

forEach(HACK_TYPES, (c, name) => {
    c.getHackId = generateGetHackId(c, name)
})

module.exports = HACK_TYPES
