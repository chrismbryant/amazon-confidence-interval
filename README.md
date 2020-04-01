# amazon-confidence-interval
A browser extension which adds confidence intervals to Amazon ratings.

## Notes

* Inspired by this video by [@3b1b](https://github.com/3b1b): https://youtu.be/8idr1WZ1A7Q
* If the ratings were binary, we could just use the Beta distribution to estimate the lower and upper bounds of a 95% confidence interval, but Amazon ratings are out of 5 stars.
* Maybe we can generalize the problem from binomial to multinomial, and use a Dirichlet distribution instead to get our confidence interval (see: https://stats.stackexchange.com/questions/15979/how-to-find-confidence-intervals-for-ratings)? But would that assume independence of each of the star ratings? Is that a fair assumption?
* Maybe bootstrapping would be easier, but it's computationally expensive when there are a very large number of ratings and ineffective when there are a very small number of ratings.
* This also doesn't take into account fake ratings; we should ignore that concern for now.
* Amazon groups seller ratings into positive (4 or 5 starts), neutral (3 stars), and negative (1 or 2 stars) ratings (see: https://www.amazon.com/sp?seller=A3EPIN8KW1GGQX), so as a workaround, we can treat "probability of positive experience" as probability of having a 4 or 5 star rating, and just get a binomial confidence interval on that.


## How To Build

First, make sure you have Node.js and either NPM or Yarn. Then install the dependencies.
```bash
npm install
yarn install
```

Right now, we are working on the Chrome extension. We welcome pull requests for other platforms!

To build the Chrome extension, simply run the build command. The extension will appear in `dist/chrome`.
```bash
npm run build:chrome
yarn run build:chrome
```

If you would like to automatically rebuild the extension each time files are modified, run the watch command.
```bash
npm run watch:chrome
yarn run watch:chrome
```

To build a production-ready extension (for end users), add `--env.production` to the build command.
```bash
npm run build:chrome --env.production
yarn run build:chrome --env.production
```
