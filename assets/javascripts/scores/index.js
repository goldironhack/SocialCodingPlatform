import React from "react";
import List from "./list";

export default class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            user: window._pageData.user
          , hackers:  window._pageData.hackers
        };
    }
    render () {
        const hackers = this.state.hackers.filter(c => {
            return c.score_total || c.github_repo_url || c.project_url
        });
        return (
            <div>
                <List hackers={hackers} user={this.state.user} />
            </div>
        );
    }
}
