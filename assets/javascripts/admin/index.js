import React from "react";
import util from "../util";
import setOrGet from "set-or-get";
import AdminHackTypes from "./hack-types";
import $ from "elly";
import { $$ } from "elly";
import forEach from "iterate-object";
import moment from "moment";
import HackTypeAndIdSelector from "./hack-type-and-id-selector";

const PHASES = [
    ["Phase 1", "phase1"]
  , ["Phase 2", "phase2"]
  , ["Phase 3", "phase3"]
  , ["Phase 4", "phase4"]
];

export default class App extends React.Component {

    constructor (props) {
        super(props);

        const users = window._pageData.users;
        const hackTypes = {};

        users.forEach(c => {
            const cHackType = setOrGet(hackTypes, c.profile.hack_type, {});
            setOrGet(cHackType, c.profile.hack_id, []).push(c);
        });

        const phases = {};
        forEach(_pageData.settings.hack_types, (hType, name) => {
            phases[name] = hType.phase;
        });

        this.state = {
            user: window._pageData.user
          , users: users
          , HackTypes: hackTypes
          , phases: phases
        };
    }

    onPhaseChange (e) {
        this.state.phases[e.target.dataset.hackType] = e.target.value;
        this.setState({
            phases: this.state.phases
        });
    }

    saveUsers () {
        const users = $$(".user-item").map(c => {
            return {
                _id: c.dataset.id
              , hack_type: $("[name='user-hack-type']", c).value
              , update: {
                    project_url: $("[name='project_url']", c).value
                  , github_repo_url: $("[name='github_repo_url']", c).value
                  , score_technical: $("[name='score_technical']", c).value
                  , score_info_viz: $("[name='score_info_viz']", c).value
                  , score_novelty: $("[name='score_novelty']", c).value
                  , score_custom: $("[name='score_custom']", c).value
                  , score_total: $("[name='score_total']", c).value
                  , role: $("[name='role']", c).value
                }
            };
        });

        const hackTypes = {};
        $$(".hack-type-start-date").forEach(c => {
            let inputs = $$("input", c);
            hackTypes[inputs[0].dataset.hackType] = {
                start_date: inputs[0].value
              , hack_start_date: inputs[1].value
              , next_phase_date: inputs[2].value
              , show_results_date: inputs[3].value
            };
        });

        $$(".hack-type-subgroup").forEach(c => {
            let input = $("input", c);
            hackTypes[input.dataset.hackType].subforums_count = (input.value - 1) || 0;
        });

        $$(".hack-type-phase-selector").forEach(c => {
            const select = $("select", c);
            hackTypes[select.dataset.hackType].phase = select.value;
        });

        this.setState({ loading: true });
        util.post(location.pathname, {
            users,
            hack_types: hackTypes
        }).then(c => {
            if (c.status > 400) { throw new Error("Cannot save the data."); }
            location.reload();
            //this.setState({ loading: false });
        }).catch(e => {
            this.setState({ loading: false });
            alert(e.message);
        });
    }

    renderLoader () {
        if (this.state.loading) {
            return <div className="loader-wrapper">
                <div className="loader">Saving...</div>
            </div>
        }
        return "";
    }

    renderPhaseSelector () {
        const hackTypes = [];
        let index = -1;

        forEach(window._pageData.settings.hack_types, (hackType, name) => {
            const options = PHASES.map((c, i) => <option key={i} value={c[1]}>{c[0]}</option>);
            hackTypes.push(
                <div className="hack-type-phase-selector" key={++index} >
                    <strong className="hack-type-name">{_pageData.hackTypes[name].label}</strong>: <br/>
                    <div className="phase-select-wrapper">
                        <select data-hack-type={name} value={this.state.phases[name]} className="phase-select" onChange={this.onPhaseChange.bind(this)}>
                            {options}
                        </select>
                    </div>
                </div>
            );
        });

        return hackTypes;
    }

    render () {
        const hackTypesStartDates = []
        const hackTypesSubforums = []
        let index = -1;

        forEach(window._pageData.settings.hack_types, (hackType, name) => {

            hackType.start_date = moment(new Date(hackType.start_date));
            hackType.hack_start_date = moment(hackType.hack_start_date);
            hackType.next_phase_date = moment(hackType.next_phase_date);
            hackType.show_results_date = moment(hackType.show_results_date);

            hackType.subforums_count = hackType.subforums_count || 0;
            hackTypesStartDates.push(
                <div className="hack-type-start-date" key={++index} >
                    <strong>{_pageData.hackTypes[name].label}</strong>: <br/>
                    Start of <strong>forum</strong>: <input data-hack-type={name} type="text" defaultValue={hackType.start_date.format("YYYY-MM-DD HH:mm:ss")} /><br/>
                    Start of <strong>hack</strong>: <input data-hack-type={name} type="text" defaultValue={hackType.hack_start_date.format("YYYY-MM-DD HH:mm:ss")} /><br/>
                    Time until <strong>submission</strong>: <input data-hack-type={name} type="text" defaultValue={hackType.next_phase_date.format("YYYY-MM-DD HH:mm:ss")} /><br/>
                    Time when <strong>results become visible</strong>: <input data-hack-type={name} type="text" defaultValue={hackType.show_results_date.format("YYYY-MM-DD HH:mm:ss")} /><br/>
                </div>
            );
            hackTypesSubforums.push(
                <div className="hack-type-subgroup" key={++index} >
                    <strong className="hack-type-name">{_pageData.hackTypes[name].label}</strong> ({_pageData.users.filter(c => c.profile.hack_type === name).length} students): <br/>
                    <input data-hack-type={name} type="number" defaultValue={hackType.subforums_count + 1} />
                </div>
            );
        });

        return (
            <div className="admin-view">
                <div className="row">
                    <div className="col">
                        <h2>Select Phase</h2>
                        <p>Select the phase for each hack type and then click the save button.</p>
                        {this.renderPhaseSelector()}
                        <h2>Start Dates</h2>
                        <p><strong>Tip:</strong> Use a past date to force starting of the contest.</p>
                        {hackTypesStartDates}
                        <h2>Forum subgroups</h2>
                        <p>Decide how many subforums you want for each hack type.</p>
                        {hackTypesSubforums}
                    </div>
                    <div className="col">
                        <h2>Download CSV Stats</h2>
                        <a className="btn" href="/admin/csv/topics">Topics</a>
                        {" "}
                        <a className="btn" href="/admin/csv/scores">Scores</a>
                        <h2>Export users</h2>
                        <form action="/admin/csv/export-users">
                            <HackTypeAndIdSelector show_export_type={true} users={this.state.users}/> <br />
                            <button className="btn" type="submit">Export</button>
                        </form>
                    </div>
                </div>

                <h1>Users</h1>
                <p>You can update the scores and then click the save button. The custom score, if provided, will override the total.</p>
                {this.renderLoader()}
                <AdminHackTypes phases={this.state.phases} hackTypes={this.state.HackTypes} />
                <button onClick={this.saveUsers.bind(this)} className="save-btn btn btn-big full-width">Save</button>
                <button onClick={this.saveUsers.bind(this)} className="circle-save-btn btn btn-big" title="Save changes"><i className="fa fa-check" aria-hidden="true"></i></button>
            </div>
        );
    }
}
