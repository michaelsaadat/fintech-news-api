const express = require("express");
const axios = require("axios");
const Parser = require("rss-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser();

// Regulatory news sources (RSS feeds)
const REGULATORY_SOURCES = {
    "Australia": "https://asic.gov.au/rss-feed",
    "New Zealand": "https://www.rbnz.govt.nz/rss-feed",
    "UK": "https://www.fca.org.uk/rss.xml",
    "EU": "https://www.esma.europa.eu/rss.xml",
    "Japan": "https://www.fsa.go.jp/en/news.xml",
    "France": "https://www.amf-france.org/rss.xml",
    "Spain": "https://www.cnmv.es/rss.xml",
    "Ireland": "https://www.centralbank.ie/rss.xml"
};

// TheNewsAPI credentials
const NEWS_API_URL = "https://api.thenewsapi.com/v1/news/all";
const NEWS_API_KEY = "p76liIUyYNcz1p1xzuGmT5y9WQXfBvmY7DVxbm89";  // Your API Key

app.get("/fintech-news", async (req, res) => {
    const { country, topic } = req.query;
    let articles = [];

    try {
        // Fetch from TheNewsAPI
        if (topic) {
            const response = await axios.get(NEWS_API_URL, {
                params: {
                    api_token: NEWS_API_KEY,
                    language: "en",
                    search: topic,
                    categories: "business,finance"
                }
            });
            articles = response.data.data.map(article => ({
                title: article.title,
                source: article.source || "Unknown",
                url: article.url,
                publishedAt: article.published_at
            }));
        }

        // Fetch from Regulatory RSS Feeds
        if (country && REGULATORY_SOURCES[country]) {
            const rssFeed = await parser.parseURL(REGULATORY_SOURCES[country]);
            rssFeed.items.slice(0, 10).forEach(entry => {
                articles.push({
                    title: entry.title,
                    source: `${country} Regulator`,
                    url: entry.link,
                    publishedAt: entry.pubDate || "Unknown"
                });
            });
        }

        res.json(articles.length > 0 ? articles : { error: "No articles found." });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch news", details: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
