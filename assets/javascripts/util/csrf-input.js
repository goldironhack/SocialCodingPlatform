import React from "react";

export default class CsrfInput extends React.Component {
    render () {
        return <input value={window._pageData.csrfToken} name="_csrf" type="hidden" />
    }
}
