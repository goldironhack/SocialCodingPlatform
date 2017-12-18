const Email = Bloggify.require("sendgrid");
const uniq = require("array-unique");
const User = Bloggify.models.User;
const Entities = require("html-entities").XmlEntities;
const entities = new Entities();

const FROM_EMAIL = "noreply@ironhacks.com";
const FROM_NAME = "IronHacks";

const EMAIL_TEMPLATES = {
    NEW_COMMENT: "90584722-937c-4298-8168-66b1f281df41",
    NEW_TOPIC: "7d42ff32-0196-40d2-a444-71a5d3635810"
};

const log = (err, data) => {
    if (err) { return Bloggify.log(err); }
    if (process.env.NODE_ENV !== "production") {
        console.log(err, data);
    }
};

exports.commentPosted = comment => {
    const emails = uniq(comment.topic.comments.map(c => c.author.email).concat(comment.topic.author.email));
    const authorEmail = comment.author.email;
    uniq(emails);
    const authorIndex = emails.indexOf(authorEmail);
    if (~authorIndex) {
        emails.splice(authorIndex, 1);
    }

    if (!Bloggify.production) {
        return;
    }

    Email.send({
        bcc_email: emails
      , to_email: "purdue@bloggify.org"
      , from_email: FROM_EMAIL
      , from_name: FROM_NAME
      , subject: "A new comment was posted on ‘" + comment.topic.title + "’"
      , template_id: EMAIL_TEMPLATES.NEW_COMMENT
      , substitutions: {
            "-message-": entities.encode(comment.body),
            "-commentAuthorUsername-": comment.author.username,
            "-commentAuthorUrl-": `${Bloggify.options.domain}/users/${comment.author.username}`,
            "-topicUrl-": `${Bloggify.options.domain}${comment.topic.url}`,
            "-topicTitle-": entities.encode(comment.topic.title)
        }
    }, log);
};

exports.topicCreated = topic => {
    User.find({
        "profile.hack_type": topic.metadata.hack_type
      , "profile.hack_id": topic.metadata.hack_id
    }, {
        email: 1
    }, (err, docs) => {
        const emails = docs.map(c => c.email);
        const authorEmail = topic.author.email;
        uniq(emails);
        const authorIndex = emails.indexOf(authorEmail);

        if (~authorIndex) {
            emails.splice(authorIndex, 1);
        }

        if (!Bloggify.production) {
            return;
        }

        Email.send({
            bcc_email: emails
          , to_email: "purdue@bloggify.org"
          , from_email: FROM_EMAIL
          , from_name: FROM_NAME
          , subject: "A new topic was posted: ‘" + topic.title + "’"
          , template_id: EMAIL_TEMPLATES.NEW_TOPIC
          , substitutions: {
                "-topicUrl-": `${Bloggify.options.domain}${topic.url}`,
                "-topicTitle-": entities.encode(topic.title)
            }
        }, log);
    });
};

const Notifications = exports

Bloggify.on("topic:updated", topic => {
    TopicWS.emit("updated", topic)
})

Bloggify.on("topic:created", topic => {
    TopicWS.emit("created", topic)
    Notifications.topicCreated(topic)
})

Bloggify.on("comment:posted", comment => {
    Notifications.commentPosted(comment)
})

Bloggify.on("comment:created", comment => {
    Bloggify.models.Topic.getPopulated(comment.topic, {
        userFields: {}
    }).then(topic => {
        return User.getUser({
            filters: {
                _id: comment.author
            }
        }).then(author => {
            comment = comment.toObject()
            comment.author = author.toObject()
            comment.topic = topic
            Bloggify.emit("comment:posted", comment)
        })
    }).catch(err => Bloggify.log(err))
})

const TopicWS = Bloggify.actions.ws("topic", [
    (socket, next) => {
        Bloggify.server.session(socket.handshake, {}, next)
    },
    (socket, next) => {
        if (!Object(socket.handshake.session._sessionData).user) {
            return next(new Error("You are not authenticated."))
        }
        next()
    }
])
