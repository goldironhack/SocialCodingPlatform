import React from "react";

export default class TopicFilters extends React.Component {

    refreshTopics () {
        const hTypeValue = this.refs.hack_type.value;
        const hackIdValue = this.refs.hack_id.value;
        this.props.updateTopics(this.props.topics.filter(topic => {
            return (topic.metadata.hack_type === hTypeValue || "All" === hTypeValue)
                && (+topic.metadata.hack_id === +hackIdValue || "All" === hackIdValue)
                ;
        }));
    }

    render () {
        let hackTypeOptions = ["All"]
          , hackIdOptions = ["All"]
          ;

        this.props.topics.forEach(topic => {
            if (!hackTypeOptions.includes(topic.metadata.hack_type)) {
                hackTypeOptions.push(topic.metadata.hack_type);
            }
            if (!hackIdOptions.includes(+topic.metadata.hack_id)) {
                hackIdOptions.push(+topic.metadata.hack_id);
            }
        });

        hackTypeOptions = hackTypeOptions.map((c, i) => {
            return <option key={i} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
        });

        hackIdOptions = hackIdOptions.map((c, i) => {
            return <option key={i} value={c}>{c}</option>
        });

        const hackTypeSelect = <select defaultValue="All" ref="hack_type" onChange={this.refreshTopics.bind(this)}>
            {hackTypeOptions}
        </select>;

        const hackIdSelect = <select defaultValue="All" ref="hack_id" onChange={this.refreshTopics.bind(this)}>
            {hackIdOptions}
        </select>;

        return <span className="admin-filters">
            {hackTypeSelect}
            {hackIdSelect}
        </span>;
    }
}
