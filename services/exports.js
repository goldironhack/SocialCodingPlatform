const csv = require("fast-csv");
const moment = require("moment");
const flatten = require("obj-flatten");

const { Topic, User, Stats } = Bloggify.models

exports.topics = () => {
    const csvStream = csv.format({
        headers: true
    });

    const readStream = Stats.find({
        event: "view-topic"
    }).stream();

    readStream.on("data", doc => {
        doc = doc.toObject()
        doc.created_at = moment(doc.created_at)
        readStream.pause();
        Promise.all([
            Topic.findOne({ _id: doc.metadata.topic_id })
          , User.findOne({ _id: doc.metadata.topic_author })
          , User.findOne({ _id: doc.actor })
        ]).then(response => {
            if (response[0] && response[1] && response[2]) {
                const topic = response[0].toObject()
                    , author = response[1].toObject()
                    , actor = response[2].toObject()
                    ;

                csvStream.write({
                    click_date: doc.created_at.format("YYYY-MM-DD"),
                    click_time: doc.created_at.format("hh:mm a"),
                    url: `${Bloggify.domain}${topic.url}`,
                    phase: doc.metadata.phase,
                    post_title: topic.title,
                    post_author: author.username,
                    post_author_email: author.email,
                    clicker_username: actor.username,
                    clicker_email: actor.email
                });
            }
            readStream.resume();
        }).catch(e => {
            console.error(e.stack);
        });
    }).on("close", () => {
        csvStream.end();
    });
    return csvStream;
};

exports.scores = () => {
    const csvStream = csv.format({
        headers: true
    });

    const readStream = Stats.find({
        $or: [{
            event: "click-github-repo-url",
        }, {
            event: "click-project-url"
        }, {
            event: "score-click"
        }, {
            event: "show-code"
        }, {
            event: "show-view"
        }, {
            event: "open-file"
        }, {
            event: "view-project-time"
        }]
    }).stream();

    readStream.on("data", doc => {
        doc = doc.toObject()
        doc.created_at = moment(doc.created_at)
        if (doc.metadata.url) {
            doc.project_username = (doc.metadata.url.match(/\/users\/([^/]*)\//) || [])[1]
        }

        readStream.pause();
        Promise.all([
            User.findOne(doc.project_username ? {
                username: doc.project_username
            } : {
                _id: doc.metadata.hacker_id
            })
          , User.findOne({ _id: doc.actor })
        ]).then(response => {
            const hacker = (response[0] && response[0].toObject()) || {}
                , actor = response[1].toObject()
                ;

            csvStream.write({
                click_date: doc.created_at.format("YYYY-MM-DD"),
                click_time: doc.created_at.format("hh:mm a"),
                time_open: doc.metadata.time_open || "",
                event_type: doc.event,
                url: doc.metadata.url || "",
                file_path: doc.metadata.file_path || "",
                phase: doc.metadata.phase,
                hacker_username: hacker.username || "",
                hacker_email: hacker.email || "",
                clicker_username: actor.username,
                clicker_email: actor.email
            });

            readStream.resume();
        }).catch(e => {
            console.error(e.stack);
        });
    }).on("close", () => {
        csvStream.end();
    });
    return csvStream;
};

exports.users = (filters, exportType) => {
    const csvStream = csv.format({
        headers: true
    });

    const query = {};

    if (filters.hackType && filters.hackType !== "All") {
        query["profile.hack_type"] = filters.hackType;
    }

    if (filters.hackId && filters.hackId !== "All") {
        query["profile.hack_id"] = filters.hackId;
    }

    const readStream = User.find(query, {
        password: 0,
        "profile.bio": 0,
        "profile.github_username": 0,
        "profile.picture": 0,
        "profile.website": 0,
        "role": 0,
    }).stream();

    readStream.on("data", doc => {
        doc = doc.toObject()
        delete doc.__v;
        if (exportType === "forum_details") {
            readStream.pause();
            const userId = doc._id.toString();
            const countCommentsReceived = () => {
                return Bloggify.models.Topic.find({
                    author: userId
                }, {
                    _id: 1
                }).then(topics => {
                    return Bloggify.models.Comment.count({
                        topic: {
                            $in: topics.map(c => c._id.toString())
                        }
                    })
                });
            };
            Promise.all([

                // #Posts
                Bloggify.models.Topic.count({ author: userId })

                // #Upvotes Received on Posts
              , Bloggify.models.Topic.aggregate([
                    { $match: { author: userId } }
                  , { $group: { _id: "_", count: { $sum: { $size: "$votes"} } } }
                ])

                // #Comments received on posts
              , countCommentsReceived()

                // #Views received on posts
              , Stats.count({ "metadata.topic_author": userId, event: "view-topic" })

                // #Comments
              , Bloggify.models.Comment.count({ author: userId })

                // #Upvotes Received on Comments
              , Bloggify.models.Comment.aggregate({ $match: { author: userId } }, { $group: {_id: "upvotes", count: { $sum: { $size: '$votes'} } } })
            ]).then(data => {
                const forumObj = {
                    "Username": doc.username
                  , "User Email": doc.email
                  , "#Posts": data[0]
                  , "#Upvotes Received on Posts": Object((data[1] || [])[0]).count || 0
                  , "#Comments received on posts": data[2]
                  , "#Views received on posts": data[3]
                  , "#Comments": data[4]
                  , "#Upvotes Received on Comments": Object((data[5] || [])[0]).count || 0
                };
                csvStream.write(flatten(forumObj));
                readStream.resume();
            });
        } else {
            if (doc.profile.hack_type === "bogota") {
                doc.profile.hack_type = "honors"
            }
            csvStream.write(flatten(doc));
        }
    }).on("close", () => {
        csvStream.end();
    });

   return csvStream;
};
