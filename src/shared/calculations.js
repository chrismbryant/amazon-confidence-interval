import quantile from "@stdlib/stats/base/dists/beta/quantile";
import pdf from "@stdlib/stats/base/dists/beta/pdf";
import linspace from "@stdlib/math/utils/linspace";

/** @typedef ConfidenceInterval
 *  @property {number} proportion  proportion of ratings which were positive
 *  @property {number} lower  lower bound on confidence interval
 *  @property {number} upper  upper bound on confidence interval
 */


export default {

    /**
     * By scaling a product's average star rating from the range [1, 5] to the range 
     * [0, 1], compute a proxy measure for the proportion of ratings which were 
     * "positive". 
     *
     * @param {number} avgRating - average value of all star ratings
     * @returns {number} proportion - proportion of ratings which were positive
     */
    getProportionPositiveFromAvg(avgRating) {
        const proportion = (avgRating - 1) / 4;
        return proportion;
    },

    /**
     * By finding the number of ratings which were 4 or 5 stars, compute the proportion 
     * of reviews which gave a product a "positive" rating. Since Amazon provides a 
     * histogram showing the percentage of reviews which fell in each star category, we 
     * just need to sum the 4 and 5 star percentages.
     *
     * @param {number[]} ratingDistribution - 5-element array, where the first element 
     *     represents the fraction of all ratings which were 1 star, the second element 
     *     represents the fraction of all ratings which were 2 stars, and so on.
     * @returns {number} proportion - proportion of ratings which were positive
     */
    getProportionPositiveFromDist(ratingDistribution) {
        const proportion = ratingDistribution[3] + ratingDistribution[4];
        return proportion;
    },

    /**
     * Compute the proportion of reviews which gave a product a "positive" rating,
     * either using the "avg" method (where the input is the average star rating) 
     * or "dist" method (where the input is the 5-element discrete distribution
     * from the Amazon rating percentage histogram).
     *
     * @param {Object.<string, (number|number[])>} ratingData - object containing
     *     the average rating under key "avg" and/or the 5-element rating
     *     distribution (fraction of ratings at each star value) under key "dist".
     * @param {string} method - which method to use to compute proportion of
     *     reviews which were positive; must be either "avg" or "dist".
     * @returns {number} proportion - proportion of ratings which were positive.
     */
    getProportionPositive(ratingData, method = "avg") {
        if (method == "avg") {
            return this.getProportionPositiveFromAvg(ratingData["avg"]);
        } else if (method == "dist") {
            return this.getProportionPositiveFromDist(ratingData["dist"]);
        } else {
            throw `'method' must be either 'dist' or 'avg', not '${method}'`;
        }
    },

    /**
     * Recast Amazon product ratings as a binomial distribution by converting the
     * star ratings into positive/negative (binary) ratings. Assume that each
     * converted binary rating is the result of an independent Bernoulli trial with
     * fixed (but unknown) probability of success. By framing the problem this way,
     * we can use a beta distribution (the conjugate prior distribution of the
     * Bernoulli distribution) to quantify our knowledge of the underlying probability
     * of success (i.e. the probability of having a "positive" experience with the
     * Amazon product).
     *
     * In this function, we use the rating data to compute the "alpha" and "beta"
     * parameters for the beta distribution described above.
     *
     * @param {Object.<string, (number|number[])>} ratingData - object containing
     *     the average rating under key "avg" and/or the 5-element rating
     *     distribution (fraction of ratings at each star value) under key "dist".
     * @param {number} numRatings - total number of ratings for this product.
     * @param {string} method - which method to use to compute proportion of
     *     reviews which were positive; must be either "avg" or "dist".
     * @returns {Object.<string, number>} betaParams - object containing "alpha"
     *     and "beta" parameters for the beta distribution, as well as the
     *     estimated "proportion" and number "numPositive" of ratings which were 
     *     positve, and the total number of ratings "numRatings".
     */
    getBetaParams(ratingData, numRatings, method = "avg") {
        const proportion = this.getProportionPositive(ratingData, method);
        const numPositive = Math.floor(proportion * numRatings);
        const betaParams = {
            "alpha": numPositive + 1,
            "beta": numRatings - numPositive + 1,
            "proportion": proportion,
            "numPositive": numPositive,
            "numRatings": numRatings
        };
        return betaParams
    },

    /**
     * Use Amazon rating data and a beta distribution to create a 95% confidence 
     * interval on the probability of having a "positive" experience with the product.
     * (See `getBetaParams` for details.)
     *
     * @param {Object.<string, (number|number[])>} ratingData - object containing
     *     the average rating under key "avg" and/or the 5-element rating
     *     distribution (fraction of ratings at each star value) under key "dist".
     * @param {number} numRatings - total number of ratings for this product.
     * @param {string} method - which method to use to compute proportion of
     *     reviews which were positive; must be either "avg" or "dist".
     * @returns {ConfidenceInterval}
     */
    evaluateRatings(ratingData, numRatings, method = "avg") {
        const proportion = this.getProportionPositive(ratingData, method);
        const numPositive = Math.floor(proportion * numRatings);
        return getBetaConfidenceInterval(numRatings, numPositive, 0.95);
    },

    /**
     * Get [x, y] coordinates of a beta distribution.
     * @param {number} alpha - "alpha" parameter of beta distribution
     * @param {number} beta - "beta" parameter of beta distribution
     * @param {number} resolution - number of steps to split the domain [0, 1] into
     * @returns {number[][]} dist - array of [x, y] coordinate pairs
     */
    getBetaPDF(alpha, beta, resolution = 200) {
        var dist = [];
        const xs = linspace(0, 1, resolution);
        for (var i = 0; i < xs.length; i++) {
            const x = xs[i] * 1.0;
            const y = pdf(x, alpha, beta);
            dist.push([x, y]);
        }
        return dist;
    }
}


/**
 * Get exact binomial confidence interval based on the Beta distribution,
 * given a desired level of confidence.
 *
 * @param {number} n - number of trials.
 * @param {number} x - number of successes (x <= n).
 * @param {number} conf - confidence level (between 0 and 1).
 *
 * @returns {ConfidenceInterval}
 */
function getBetaConfidenceInterval(n, x, conf = 0.95){
    const p = 1 - conf;
    const proportion = x / n;
    let lower = quantile(p / 2, x, n - x + 1);
    let upper = quantile(1 - p / 2, x + 1, n - x);
    if (x == 0) {
        lower = 0.0
    }
    if (x == n) {
        upper = 1.0
    }
    return {proportion, lower, upper};
}
