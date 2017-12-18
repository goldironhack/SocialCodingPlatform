import React from "react"
import Actions from "bloggify/actions"

export default class ViewProject extends React.Component {
    constructor (props) {
        super(props);
        this.state = {}
        Actions.ws("tracking")
    }

    _setActiveUrl (urlType) {
        const active_url = _pageData[urlType + "_url"]

    	this.setState({
        	active_url
        })

        Actions.post("stats.insert", {
            event: `show-${urlType}`,
            metadata: {
                url: active_url
            }
        });
    }

    showCode () {
        this._setActiveUrl("code")
    }

	showApp () {
        this._setActiveUrl("view")
    }

    render () {
        return (
            <div>
            	<div className="view-project-header">
	            	<h1>View Project</h1>
	            	<button className="btn btn-small" onClick={this.showCode.bind(this)}>Show Code</button>
	                <button className="btn btn-small" onClick={this.showApp.bind(this)}>Show App</button>
                </div>
                <iframe src={this.state.active_url} id="view-project-iframe"/>
			</div>           	
        )
    }
}
