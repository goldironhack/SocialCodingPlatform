import React from "react";
import AdminHackTypeItem from "./hack-type";
import forEach from "iterate-object";

export default class AdminHackTypes extends React.Component {

    renderItems () {
        const items = [];
        let index = -1;
        forEach(this.props.hackTypes, (hType, name) => {
            hType.name = name;
            items.push(<AdminHackTypeItem hackType={hType} key={++index} phases={this.props.phases} />);
        });
        return items;
    }

    render () {
        return (
            <div>
                {this.renderItems()}
            </div>
        );
    }
}
