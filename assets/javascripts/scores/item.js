import React from "react"
import util from "../util"
import Actions from "bloggify/http-actions"

export default class ScoreItem extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            opened: false
        };
    }
    toggleScores () {
        if (!this.state.opened) {
            Actions.post("stats.insert", {
                event: "score-click",
                metadata: {
                    hacker_id: this.props.hacker._id
                }
            });
        }
        this.setState({
            opened: !this.state.opened
        });
    }
    onLinkClick (e) {
        Actions.post("stats.insert", {
            event: e.target.dataset.event,
            metadata: {
                hacker_id: this.props.hacker._id,
                url: e.target.href
            }
        });
    }
    renderViewButton () {
        if (!this.props.showScores) { return null; }
        const btn = <button className="btn btn-small" onClick={this.toggleScores.bind(this)}>
            {(this.state.opened ? "Hide" : "View") +  " scores"}
        </button>;
        return <td>{btn}</td>
    }
    render () {

        const scoreColumns = [
            [this.props.hacker.score_technical, "Technical Score"]
          , [this.props.hacker.score_info_viz, "Info Viz Score"]
          , [this.props.hacker.score_novelty, "Novelty Score"]
          //, [this.props.hacker.score_total, "User Requirements Score"]
        ].map((c, i) => {
            if (!this.props.showScores) { return null; }
            return <td key={i} data-label={`${c[1]}: `}>{this.state.opened ? `${(c[0] || 0).toFixed(2)}%` : ""}</td>
        });

        let totalScoreColumn = null;
        if (this.props.showScores) {
            totalScoreColumn = <td data-label="Total Score">{this.props.hacker.score_total}%</td>
        }

        const projectLinks = [
            this.props.showProjectColumn ? [this.props.hacker.project_url, "Project"] : null
        ].filter(Boolean).map((c, i) => {
            if (!c[0]) { return <td key={i} />; }
            return <td key={i} data-label={`${c[1]}: `}>
                <a target="_blank" href={c[0]} data-event={i ? "click-github-repo-url" : "click-project-url"} onClick={this.onLinkClick.bind(this)} data-label={c[1]}>
                    View
                </a>
            </td>
        });

        return (
            <tr className="score-item">
                <td data-label="Username: " className="username">{this.props.hacker.username}</td>
                {totalScoreColumn}
                {this.renderViewButton()}
                {scoreColumns}
                {projectLinks}
            </tr>
        );
    }
}
