# nodebb-plugin-seo-deduplicate

A NodeBB plugin to sanitize and deduplicate og:url and canonical meta tags for better SEO.

In particular, it removes query parameters from canonical and og:url tags on all pages and removes page offset from topic page canonical and og:url tags.

Install:
```bash
cd $NODEBB_HOME
./nodebb stop
npm install nodebb-plugin-seo-deduplicate
./nodebb start

# Then enable the plugin via admin panel
```

To see if it works, go to any public page of your forum and add query parameter to the url E.g. https://community.example.com/user/foobar?hello=world . Then, open up page source. Without this plugin, you would see the query parameter in both canonical meta and og:url. With the plugin, the query paramaters won't be there.
