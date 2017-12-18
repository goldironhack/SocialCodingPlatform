import React from "react";
import Item from "./item";

export default class ScoreList extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            showProjectColumn: this.props.hackers.some(c => (c.project_url || "").trim())
          , showGitHubRepoColumn: this.props.hackers.some(c => (c.github_repo_url || "").trim())
          , showScores: this.props.hackers.some(c => c.score_technical + c.score_info_viz + c.score_novelty + c.score_total)
        };
    }
    renderItems () {
        return this.props.hackers.map((c, i) => {
            return <Item hacker={c} user={this.props.user} key={i} showProjectColumn={this.state.showProjectColumn} showGitHubRepoColumn={this.state.showGitHubRepoColumn} showScores={this.state.showScores} />
        });
    }
    renderTheadRow () {
        const projectTh = this.state.showProjectColumn ? <th>Project</th> : null
        return <tr>
           <th>Name</th>
            { this.state.showScores ? <th>Total score</th> : null }
            { this.state.showScores ? <th>Toggle Scores</th> : null }
            { this.state.showScores ? <th>Technical Score</th> : null }
            { this.state.showScores ? <th>Info Viz Score</th> : null }
            { this.state.showScores ? <th>Novelty Score</th> : null }
            {projectTh}
        </tr>
            //{ this.state.showScores ? <th>User Requirements Score</th> : null }
    }
    render () {

        if (!this.props.hackers.length) {
            return <div>
                <div className="error-box text-center">
                    There are no scores to display yet.
                </div>
            </div>
        }

        return (
            <div>
                <table className="elm-centered">
                    <thead>
                        {this.renderTheadRow()}
                    </thead>
                    <tbody>
                        {this.renderItems()}
                    </tbody>
                </table>
            </div>
        );
    }
}
