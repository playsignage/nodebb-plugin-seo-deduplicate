'use strict';

const path = require('path');
const fs = require('fs');

module.exports = {
    // we are not using filter:meta.getMetaTags and filter:meta.getLinkTags because those hooks are
    // fire too early and og:url and canonical aren't available. And in case of canonical if we try to create an entry
    // the final result contains two canonical links (og:url seems to work fine)
    async filterMiddlewareRenderHeader(hookData) {

        hookData.templateData.metaTags.map((tag) => {
            if (tag.property == 'og:url') {
                tag.content = fixOgUrl(stripQueryString(tag.content));
            }
        });

        hookData.templateData.linkTags.map((tag) => {
            if (tag.rel == 'canonical') {
                tag.href = stripQueryString(tag.href);
            }
        });

        // Return hookData unmodified for now
        return hookData;
    }
};

/**
 * Function to strip query string from a URL.
 * @param {string} url - The original URL.
 * @returns {string} - The URL without the query string.
 */
function stripQueryString(url) {
    try {
        // Remove everything after the question mark, including the question mark
        return url.split('?')[0];
    } catch (error) {
        console.error('[seo-unduplicate] Error stripping query string:', error);
        return url; // Return the unmodified URL if an error occurs
    }
}

/**
 * Fix og:url for topic pages by removing the offset.
 * @param {string} url - The original URL.
 * @returns {string} - The fixed URL without the page offset.
 */
function fixOgUrl(url) {
    try {
        const parsedUrl = new URL(url);
        const topicRegex = /\/topic\/\d+\/[^/]+(\/\d+)?$/;

        // Check if the URL matches a topic page pattern
        if (topicRegex.test(parsedUrl.pathname)) {
            // Remove the trailing page offset (e.g., /2)
            parsedUrl.pathname = parsedUrl.pathname.replace(/\/\d+$/, '');
        }

        return parsedUrl.toString();
    } catch (error) {
        console.error('[seo-unduplicate] Error fixing og:url:', error);
        return url; // Return the unmodified URL if an error occurs
    }
}
