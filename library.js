'use strict';

module.exports = {
    // we are not using filter:meta.getMetaTags and filter:meta.getLinkTags because those hooks are
    // fired too early and og:url and canonical aren't available. And in case of canonical if we try to create an entry
    // the final result contains two canonical links (og:url seems to work fine)
    async filterMiddlewareRenderHeader(hookData) {

        // Normalize og:url
        hookData.templateData.metaTags.forEach((tag) => {
            if (tag.property === 'og:url') {
                tag.content = fixOgUrl(stripQueryString(tag.content));
            }
        });

        // Normalize canonical
        hookData.templateData.linkTags.forEach((tag) => {
            if (tag.rel === 'canonical') {
                tag.href = stripQueryString(tag.href);
            }
        });

        // Fix og:description for category pages
        fixCategoryOgDescription(hookData);

        return hookData;
    },

    async filterSitemapCategories(data) {
        if (!Array.isArray(data.categories)) {
            return data;
        }

        data.categories = data.categories.filter((item) => {
            return !item?.url?.endsWith('/world');
        });

        return data;
    }
};

/**
 * Ensure og:description matches category description (not global site description)
 */
function fixCategoryOgDescription(hookData) {
    const reqPath = hookData.req?.path || hookData.req?.url?.split('?')[0];

    if (!reqPath?.startsWith('/category/')) {
        return;
    }

    const metaTags = hookData.templateData?.metaTags;

    if (!Array.isArray(metaTags)) {
        return;
    }

    const descriptionTag = metaTags.find((tag) => tag.name === 'description');

    if (!descriptionTag?.content) {
        return;
    }

    const ogDescriptionTag = metaTags.find((tag) => tag.property === 'og:description');

    if (ogDescriptionTag) {
        ogDescriptionTag.content = descriptionTag.content;
    } else {
        metaTags.push({
            property: 'og:description',
            content: descriptionTag.content
        });
    }
}

/**
 * Function to strip query string from a URL.
 * @param {string} url - The original URL.
 * @returns {string} - The URL without the query string.
 */
function stripQueryString(url) {
    try {
        return url.split('?')[0];
    } catch (error) {
        console.error('[seo-deduplicate] Error stripping query string:', error);
        return url;
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

        if (topicRegex.test(parsedUrl.pathname)) {
            parsedUrl.pathname = parsedUrl.pathname.replace(/\/\d+$/, '');
        }

        return parsedUrl.toString();
    } catch (error) {
        console.error('[seo-deduplicate] Error fixing og:url:', error);
        return url;
    }
}
