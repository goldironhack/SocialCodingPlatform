const path = require("path")

const ProjectSchema = new Bloggify.db.Schema({
    username: {
        type: String,
        index: true
    },
    name: {
        type: String,
        index: true
    },
    description: String,
    fork: String,
    phase: String
}, {
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
})


ProjectSchema.statics.getGitHubRepoName = (username, projectName, year) => {
    return `IH-Project-${year}-${username}_${projectName}`
}

ProjectSchema.methods.syncGitHubRepository = function (commitMessage) {
    return Bloggify.models.User.findOne({
        username: this.username
    }).then(user => {
        this.user = user
        return Bloggify.services.projects.syncGitHubRepository(this, commitMessage)
    })
}


ProjectSchema.methods.createGitHubRepository = function (commitMessage) {
    return Bloggify.services.projects.createGitHubRepository(this)
}

ProjectSchema.methods.downloadFiles = function (projectPath) {
    return Bloggify.services.projects.downloadFiles(this, projectPath)
}

ProjectSchema.methods.destroyProject = function () {
    return Bloggify.services.projects.destroyProject(this)
}

ProjectSchema.virtual("url").get(function () {
   return `/users/${this.username}/projects/${this.name}`
})


ProjectSchema.virtual("readonly_url").get(function () {
   return `/view-project/${Bloggify.services.crypto.encrypt(this.url)}`
})

ProjectSchema.virtual("local_path").get(function () {
   return path.resolve(Bloggify.options.root, "repos", this.github_repo_name)
})




ProjectSchema.virtual("github_repo_name").get(function () {
   return Project.getGitHubRepoName(this.username, this.name, this.created_at.getFullYear())
})


ProjectSchema.virtual("github_repo_url").get(function () {
   return `https://${process.env.GITHUB_ADMIN_TOKEN}@github.com/${process.env.GITHUB_PROJECTS_ORGANIZATION}/${this.github_repo_name}`
})

const Project = module.exports = Bloggify.db.model("Project", ProjectSchema)
