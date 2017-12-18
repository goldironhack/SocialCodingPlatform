const aws = require("aws-sdk")
	, promisfy = require("util-promisifyall")
	, path = require("path")
	, isValidPath = require("is-valid-path")

const S3_BUCKET = process.env.S3_BUCKET
    , PATH_PPROJECTS = "projects"

const s3 = Bloggify.options.s3 = new aws.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_ACCESS_SECRET,
    signatureVersion: "v4"
});

promisfy(s3)

const buildFilePath = data => {

	if (!isValidPath(data.filepath)) {
		throw Bloggify.errors.INVALID_PATH()
	}

	// projects/user/project/file/path
	const username = data.user || data.username
		, projectName = data.projectName || data.project_name
	    , createdPath = path.resolve(
	    	"/"
		  , PATH_PPROJECTS
		  , username
		  , projectName
		  , data.filepath
		  ).slice(1)

	const splits = createdPath.split("/")
		, expected = [PATH_PPROJECTS, username, projectName]

	for (var i = 0; i < expected.length; ++i) {
		if (expected[i] !== splits[i]) {
			throw Bloggify.errors.INVALID_PATH()
		}
	}

	return createdPath
}

module.exports = {
	s3, S3_BUCKET, PATH_PPROJECTS, buildFilePath
}