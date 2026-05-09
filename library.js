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

        // Ensure canonical exists and is correct on selected pages
        ensureCanonical(hookData);

        // Fix og:description for category pages
        fixCategoryOgDescription(hookData);

        return hookData;
    }
};

/**
 * Ensure canonical exists and is correct on key pages
 */
function ensureCanonical(hookData) {
    const reqPath = getRequestPath(hookData.req);

    const CANONICAL_PATHS = new Set([
        '/',
        '/categories',
        '/login',
        '/register'
    ]);

    if (!CANONICAL_PATHS.has(reqPath)) {
        return;
    }

    const linkTags = hookData.templateData?.linkTags;

    if (!Array.isArray(linkTags)) {
        return;
    }

    const canonicalHref = `https://community.playsignage.com${reqPath === '/' ? '' : reqPath}`;

    const canonicalTag = linkTags.find((tag) => tag.rel === 'canonical');

    if (canonicalTag) {
        canonicalTag.href = canonicalHref;
    } else {
        linkTags.push({
            rel: 'canonical',
            href: canonicalHref
        });
    }
}

/**
 * Get correct request path (handles NodeBB internal routing quirks)
 */
function getRequestPath(req) {
    const rawPath =
        req?.originalUrl ||
        req?.url ||
        req?.path ||
        '';

    return rawPath.split('?')[0] || '/';
}

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
 */
function fixOgUrl(url) {
    try {
        const parsedUrl = new URL(url);

        const topicRegex = /\/topic\/\d+\/[^/]+(\/\d+)?$/;

        if (topicRegex.test(parsedUrl.pathname)) {
            parsedUrl.pathname = parsedUrl.pathname.replace(/\/\d+$/, '');
        }

        // Normalize homepage og:url to no trailing slash
        if (parsedUrl.pathname === '/' && !parsedUrl.search && !parsedUrl.hash) {
            return parsedUrl.origin;
        }

        return parsedUrl.toString();
    } catch (error) {
        console.error('[seo-deduplicate] Error fixing og:url:', error);
        return url;
    }
}
