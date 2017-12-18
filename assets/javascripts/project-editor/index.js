import React from "react"
import brace from "brace"
import AceEditor from "react-ace";
import BloggifyActions from "bloggify/http-actions"
import FolderTree from "react-folder-tree"
import {Treebeard, decorators} from "react-treebeard"
import Actions from "bloggify/http-actions"
import SweetAlert from "sweetalert2-react"
import { renderToStaticMarkup } from 'react-dom/server';

import 'brace/mode/javascript'
import 'brace/mode/html'
import 'brace/theme/monokai'

import 'brace/ext/searchbox'

const DEFAULT_FILEPATH = "index.html"

decorators.Header = ({style, node}) => {
    const iconType = node.children ? 'folder' : 'file-text';
    const iconClass = `fa fa-${iconType}`;
    const iconStyle = {marginRight: '5px'};

    style.title.width = style.base.width = "100%";
    style.deleteIcon = {
        marginLeft: "2px",
        marginTop: "2px",
        float: "right"
    }

    const deleteIcon = node.onDelete && <i onClick={node.onDelete} className="fa fa-trash" style={style.deleteIcon}/>

    return (
        <div style={style.base} data-type={iconType}>
            <div style={style.title} >
                <span onClick={node.onOpen}>
                    <i className={iconClass} style={iconStyle}/>
                    {node.name}
                </span>
                {deleteIcon}
            </div>
        </div>
    );
};

export default class App extends React.Component {
    constructor (props) {
        super(props);
        window.addEventListener("beforeunload", e => {
            if (!this.saved) {
                event.returnValue = "You may lose changes..."
            }
        })
        this.state = {
            page: window._pageData,
            filepath: DEFAULT_FILEPATH,
            file_content: "",
            reloading_preview: true,
            preview_filepath: "index.html",
            readonly: !!_pageData.query.readonly,
        }
        this.saved = true
        this.reloadFileTree()

        this.editor_content = "";
        this.openFile(this.state.filepath);

        window.addEventListener("keydown", event => {
            if (event.ctrlKey || event.metaKey) {
                switch (String.fromCharCode(event.which).toLowerCase()) {
                    case "s":
                        event.preventDefault();
                        this.saveFile()
                        break;
                }
            }
        })
    }

    _getEditorMode (filepath) {
        const extension = filepath.split(".").slice(-1)[0]
        const mappings = {
            js: "javascript"
        }
        const editorMode = mappings[extension] || extension
        return editorMode
    }

    maybeTriggerSave () {
        clearTimeout(this.saveTimeout)
        this.saveTimeout = setTimeout(() => this._saveFile(), 3 * 1000)
    }

    reloadFileTree () {
        return BloggifyActions.post("projects.listFiles", {
            project_name: this.state.page.project.name,
            username: _pageData.project.username
        }).then(files => {
            this.setState({ files });
        });
    }

    deleteFile (path) {
        BloggifyActions.post("projects.deleteFile", {
            project_name: this.state.page.project.name,
            filepath: path
        }).then(() => {
            return this.reloadFileTree()
        }).then(() => {
            if (this.state.filepath === path) {
                return this.openFile(DEFAULT_FILEPATH);
            }
        }).catch(err => {
            alert(err.message);
        });
    }

    openFile (path) {
        if (this.maybeNotSaved()) { return }
        if (this.state.readonly) {
            Actions.post("stats.insert", {
                event: `open-file`,
                metadata: {
                    url: location.href,
                    file_path: path
                }
            });
        }

        this.editor_content = ""
        const prom = BloggifyActions.post("projects.getFile", {
            project_name: this.state.page.project.name,
            filepath: path,
            username: _pageData.project.username
        }).then(data => {
            this.editor_content = data.Body
            this.setState({
                file_content: data.Body,
                filepath: path
            })
        })

        prom.catch(err => {
            alert(err.message)
        })

        return prom
    }

    _saveFile (opts = {}) {
        if (this.saved) {
            return Promise.resolve()
        }
        if (this.state.readonly) {
            return Promise.reject(new Error("You are in the read-only mode. Cannot save the file."));
        }
        return BloggifyActions.post("projects.saveFile", {
            project_name: this.state.page.project.name,
            filepath: opts.filepath || this.state.filepath,
            content: this.editor_content
        }).then(() => {
            this.saved = true
        })
    }

    saveFile (opts = {}) {
        this.setState({
            reloading_preview: true
          , file_content:this.editor_content
        })
        const prom = this._saveFile(opts).then(() => {
            this.reloadPreview()
        })
        prom.catch(err => {
            alert(err.message);
        });
        return prom
    }

    maybeNotSaved () {
        if (!this.saved) {
            alert("Please save your changes first.")
            return true
        }
    }

    newFile () {
        if (this.maybeNotSaved()) { return }
        const filepath = prompt("Enter the new file name. You can use slashes for creating files in directories.");
        if (!filepath) {
            return
        }
        this.saved = false
        this.editor_content = "";
        this.saveFile({
            filepath
        }).then(() => {
            return this.reloadFileTree()
        }).then(() => {
            return this.openFile(filepath)
        })
    }

    commitFile (commit_message) {
        BloggifyActions.post("projects.commit", {
            project_name: this.state.page.project.name,
            commit_message
        }).catch(err => alert(err.message))
    }

    commitProject () {
        if (this.maybeNotSaved()) { return }
        this.setState({ show_commit_prompt: true })
    }


    onEditorContentChange (content) {
        this.editor_content = content;
        this.maybeTriggerSave()
        this.saved = false
    }

    renderFolderTree () {
        if (this.state.files) {
            const walk = obj => {
                obj.active = false;
                obj._path = obj.path.split("/").slice(2).join("/");
                if (obj.clickable !== false) {
                    obj.onOpen = () => {
                        this.openFile(obj._path)
                    }
                }
                if (obj.deletable !== false) {
                    obj.onDelete = () => {
                        if (confirm(`Do you really want to delete ${obj._path}?`)) {
                            this.deleteFile(obj._path)

                        }
                   }
                }
                if (obj._path === this.state.filepath) {
                    obj.active = true
                }
                if (obj.children) {
                    for (let i = 0; i < obj.children.length; ++i) {
                        walk(obj.children[i])
                    }
                }
            }
            this.state.files.deletable = false;
            this.state.files.clickable = false;
            walk(this.state.files)

            return <Treebeard
                data={this.state.files}
            />
        }
        return <p>Loading...</p>;
    }

    reloadPreview () {
        const iframe = document.getElementById("preview-iframe")
        iframe.src = iframe.src
    }

    previewLoaded () {
        this.setState({
            reloading_preview: false
        })
    }

    renderSurveys () {
        const afterHackSurvey = `https://purdue.qualtrics.com/jfe/form/SV_bKmRJnCYfb9rRnn?redirect_to=${location.href}`;
        return <div>
            If this is your last commit for this phase, please provide the mandatory submission information <a href={afterHackSurvey} target="blank">here</a>!
        </div>
    }

    renderLeftBoottomControls () {
        return <div className="left-bottom-controls">
        </div>
    }

    render () {
        const previewFileUrl = `/users/${_pageData.project.username}/projects/${_pageData.project.name}/preview/${this.state.preview_filepath}`
        if (this.state.show_commit_prompt) {
            setTimeout(() => {
                document.getElementById("commit-message").focus()
            }, 10);
        }
        const commitPromptHtml = <div>
            <p>Enter the commit message below:</p>
            <p><input autoFocus="autofocus" id="commit-message" type="text" className="swal2-input" /></p>
            {this.renderSurveys()}
        </div>
        return (
            <div>
                <SweetAlert
                  show={this.state.show_commit_prompt}
                  title="Commit"
                  html={renderToStaticMarkup(commitPromptHtml)}
                  onConfirm={() => {
                    const message = document.getElementById("commit-message").value
                    if (message) {
                      this.commitFile(message)
                    }
                    this.setState({ show_commit_prompt: false });
                  }}
                />
                <div className="row editor-container">
                    <div className="readonly-badge">
                        Read-only
                    </div>
                    <div className="col file-tree-column">
                        <div className="editor-controls">
                            <button className="btn btn-small" onClick={this.saveFile.bind(this)}>Save (⌘ + S)</button>
                            <button className="btn btn-small" onClick={this.commitProject.bind(this)}>Commit</button>
                            <button className="btn btn-small" onClick={this.newFile.bind(this)}>New file</button>
                        </div>
                        {this.renderFolderTree()}
                        {this.renderLeftBoottomControls()}
                    </div>
                    <div className="col">
                        <div className="row">
                            <div className="col editor-column">
                                <AceEditor
                                    mode={this._getEditorMode(this.state.filepath)}
                                    theme="monokai"
                                    value={this.editor_content || this.state.file_content}
                                    onChange={this.onEditorContentChange.bind(this)}
                                    name="project-ace-editor"
                                    width="100%"
                                    height="100%"
                                    editorProps={{
                                        $blockScrolling: true
                                    }}
                                    readOnly={this.state.readonly}
                                />
                            </div>
                            <div className="col preview-column">
                                <div className={`editor-preview ${this.state.reloading_preview ? "reloading-preview" : "loaded-preview"}`}>
                                    <div className="open-in-new-tab">
                                        <a href={previewFileUrl} target="blank">Open in New Tab</a> |
                                        <span className="pull-right breadcrumbs">
                                            <a href={`/users/${_pageData.project.username}`}>
                                                @{_pageData.project.username}
                                            </a>
                                            /
                                            <a href={`/users/${_pageData.project.username}/projects`}>
                                                projects
                                            </a>
                                            /
                                            <a href={`/users/${_pageData.project.username}/projects/${_pageData.project.name}`}>
                                                {_pageData.project.name}
                                            </a>
                                            /edit
                                        </span>

                                    </div>
                                    <iframe src={previewFileUrl} id="preview-iframe" className="editor-preview-iframe" onLoad={this.previewLoaded.bind(this)} />
                                    <div className="iframe-spinner">
                                        Loading...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
