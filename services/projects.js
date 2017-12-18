const { buildFilePath, s3, S3_BUCKET, PATH_PPROJECTS } = require("../common/aws-s3")
    , forEach = require("iterate-object")
    , Project = Bloggify.models.Project
    , GitHubApi = require("gh.js")
    , promisfy = require("util-promisifyall")
    , execa = require("execa")
    , path = require("path")
    , streamp = require("streamp")
    , AwsFsCache = require("../common/s3-cache")
    , slug = require("slugo")

const GitHub = promisfy(new GitHubApi(process.env.GITHUB_ADMIN_TOKEN))

exports.streamFile = ctx => {
    const params = {
        Bucket: S3_BUCKET,
        Key: buildFilePath(ctx.params)
    };

    ctx.res.contentType(ctx.params.filepath);
    let shouldBeCached = false

    return AwsFsCache.getFile(params.Key).then(res => {
        if (res) {
            return res
        }
        shouldBeCached = true
        return s3.getObjectAsync(params).then(data => {
            return data.Body.toString("utf-8")
        })
    }).then(res => {
        if (shouldBeCached) {
            AwsFsCache.saveFile(params.Key, res).catch(err => Bloggify.log(err))
        }
        ctx.end(res)
    }).catch(err => {
        ctx.res.contentType("plain/text");
        if (err.code === "NoSuchKey") {
            ctx.end("404 — Not found", 404);
        } else {
            ctx.end(err.message, 400);
        }
    })
};

exports.createTemplateFiles = data => {

    data.project_name = data.name;

    const files = {
        "README.md": `## ${data.name}

${data.description}
`,
        "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Hello World!</h1>
        <button id="btn">Click me</button>
    </div>
    <script src="index.js"></script>
</body>
</html>`,
        "style.css": `body {
    color: #444;
    font-family: Arial, sans-serif;
}

.container {
    width: 100%;
    max-width: 960px;
}`,
        "index.js": `
(function () {
    document.getElementById("btn").addEventListener("click", function () {
        alert("Hi! :)");
    });
})();`
    }

    const promises = []

    forEach(files, (content, name) => {
        data.filepath = name
        const params = {
            Bucket: S3_BUCKET,
            Key: buildFilePath(data),
            Body: content
        };
        promises.push(s3.putObjectAsync(params));
    })

    return Promise.all(promises)
}


exports.createGitHubRepository = project => {
    const repoName = project.github_repo_name
    return GitHub.getAsync(`orgs/${process.env.GITHUB_PROJECTS_ORGANIZATION}/repos`, {
        data: {
            name: repoName,
            description: project.description,
            private: true
        }
    })
}

exports.downloadFiles = (project, projectPath) => {
    const repoPath = project.local_path

    const params = {
      Bucket: S3_BUCKET,
      Prefix: `${PATH_PPROJECTS}/${project.username}/${project.name}/`
    };

    return s3.listObjectsAsync(params).then(data => {
        return Promise.all(data.Contents.map(currentObject => {
            const currentFilePath = currentObject.Key.split("/").slice(3).join("/")
            const localFilePath = path.resolve(repoPath, currentFilePath)
            return new Promise(res => {
                const params = {
                    Bucket: S3_BUCKET,
                    Key: currentObject.Key
                };
                const stream = s3.getObject(params).createReadStream();
                const wStream = new streamp.writable(localFilePath)
                stream.pipe(wStream).on("close", res)
            })
        }))
    })
}

exports.syncGitHubRepository = (project, commitMessage) => {
    const repoPath = project.local_path

    // 1. Delete the projec path
    return execa("rm", ["-rf", repoPath]).then(() =>
        // 2. Clone the GitHub repo
        execa("git", ["clone", project.github_repo_url, repoPath])
    ).then(() =>
        // 3. Remove all the files
        execa.shell("rm -rf *", { cwd: repoPath })
    ).then(() =>
        // 4. Download the files from S3
        project.downloadFiles(repoPath)
    ).then(() =>
        // 5. Check if there are changes to commit
        execa("git", ["status", "--porcelain"], { cwd: repoPath })
    ).then(status => {
        status = status.stdout.trim();
        if (!status) {
            return
        }
        // 6. Set up the git commit details
        return Promise.all([
            execa("git", ["config", "user.email", project.user.email], { cwd: repoPath }),
            execa("git", ["config", "user.name", project.user.username], { cwd: repoPath })
        ]).then(() =>
            // 7. Add the files to commit
            execa("git", ["add", "-A", "."], { cwd: repoPath })
        ).then(() =>
            // 8. Create the commit
            execa("git", ["commit", "-m", commitMessage, "--author", `${project.user.username} <${project.user.email}>`], { cwd: repoPath })
        ).then(() =>
            // 9. Push the commit to GitHub
            execa("git", ["push", "--all"], { cwd: repoPath })
        ).then(() =>
            // 10. Delete the directory
            execa("rm", ["-rf", repoPath])
        )
    }).then(() => project)
}

exports.get = data => {
    const { name, username } = data
    return Project.findOne({
        name,
        username
    })
}

/**
 * create
 * Creates a new project for given data
 *
 * @name create
 * @param {Object} projectData An object containing the following fields:
 *    - `name` (String): The project name.
 *.   - `username` (String): The user username.
 *    - `phase` (String): The phase you want the project to belong to (default: current phase)
 * @return {Promise} The promise resolving when the task is done.
 */
exports.create = projectData => {
    projectData.name = slug(projectData.name).trim()

    if (!projectData.name) {
        throw Bloggify.errors.PROJECT_NAME_IS_EMPTY()
    }

    let settings = null
      , user = null
      , project = null

    return Bloggify.models.Settings.getSettings().then(_settings => {
        settings = _settings
        return Bloggify.models.User.findOne({
           username: projectData.username
        })
    }).then(_user => {
        user = _user
        if (!user) {
            throw Bloggify.errors.USER_DOES_NOT_EXIST()
        }
        projectData.phase = projectData.phase || settings.settings.hack_types[user.profile.hack_type].phase
        return exports.get(projectData)
    }).then(existingProject => {
        if (existingProject) {
            throw Bloggify.errors.PROJECT_NAME_IS_TAKEN(projectData.name)
        }
        return new Project(projectData).save()
    }).then(_project => {
        project = _project
        // Create the template files and the Github repo in parallel
        user.set(`profile.${projectData.phase}.project_url`, project.readonly_url)

        return exports.createTemplateFiles(projectData)
    }).then(() =>
        project.createGitHubRepository()
    ).then(() =>
        project.syncGitHubRepository("Inital commit.")
    ).then(() =>
        user.save()
    ).then(() => project)
}

exports.destroyProject = project => {
    const repoName = project.github_repo_name
    // TODO Maybe delete the GitHub repo and AWS S3 bucket
    //      But let's keep them for now.
    return project.remove()
}
