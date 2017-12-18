import moment from "moment";
import "whatwg-fetch";

export default {

    /**
     * normalizeTopic
     * Normalizes the topic object.
     *
     * @name normalizeTopic
     * @function
     * @param {Object} topic The topic object
     * @returns {Object} The normalized topic object.
     */
    normalizeTopic (topic) {
        topic.created_at = moment(topic.created_at);
        return topic;
    }

    /**
     * topicUrl
     * Gets the topic url.
     *
     * @name topicUrl
     * @function
     * @param {String|Object} topicId The topic object or id.
     * @returns {String} The topic url.
     */
  , topicUrl (topicId) {
        if (topicId._id) {
            topicId = topicId._id;
        }
        return `/posts/${topicId}-topic`;
    }

    /**
     * post
     * Posts the data to the server.
     *
     * @name post
     * @function
     * @param {String} url The endpoint url.
     * @param {Object} data The post data.
     * @returns {Promise} The `fetch` promise.
     */
  , post (url, data) {
        data._csrf = data._csrf || _pageData.csrfToken;
        return fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify(data)
        });
    }

    /**
     * getJSON
     * Fetches from the server JSON data.
     *
     * @name getJSON
     * @function
     * @param {String} url The endpoint url.
     * @returns {Promise} The `fetch` promise.
     */
  , getJSON (url) {
        return fetch(url, {
            credentials: "same-origin"
        }).then(c => c.json())
    }
};
