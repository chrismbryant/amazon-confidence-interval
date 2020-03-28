import stdlib from "@stdlib/stdlib/dist/stdlib-stats-base-dists-flat";


/** @typedef ConfidenceInterval
 *  @property {number} proportion  proportion of ratings which were positive
 *  @property {number} lower  lower bound on confidence interval
 *  @property {number} upper  upper bound on confidence interval
 */


export default {
    /**
     * Get a "positive experience rating" based on a distribution of ratings
     * from a 5-star rating scale, treating 4 and 5-star ratings as "positive",
     * and all others as "not positive". This recasts the 5-star rating confidence
     * problem as a binomial confidence interval problem, assuming that each rating
     * is an independent Bernoulli trial with fixed (but unknown) probability of
     * success.
     *
     * @param {[number, ..., number]} ratingDistribution - 5-element array, where the
     *     first element represents the fraction of all ratings which were 1 star, the
     *     second element represents the fraction of all ratings which were 2 stars,
     *     and so on.
     * @param {number} numRatings - total number of ratings given.
     *
     * @returns {ConfidenceInterval}
     */
    evaluateRatings(ratingDistribution, numRatings) {
        const fracPositive = ratingDistribution[3] + ratingDistribution[4];
        const numPositive = Math.floor(fracPositive * numRatings);
        return getBetaConfidenceInterval(numRatings, numPositive, 0.95);
    },

    /**
     * Get a "positive experience rating" confidence interval based only on the
     * average star rating and the total number of ratings. Scale ratings in the
     * domain [1, 5] to the range [0, 1], then treat the result like the average
     * success rate of a series of independent Bernoulli trials with fixed (but
     * unknown) probability of success.

     * @param {number} avgRating - average value of all star ratings.
     * @param {number} numRatings - total number of ratings given.
     *
     * @returns {ConfidenceInterval}
     */
    evaluateAverageRating(avgRating, numRatings) {
        const avgProb = (avgRating - 1) / 4;
        const numPositive = Math.floor(avgProb * numRatings);
        return getBetaConfidenceInterval(numRatings, numPositive, 0.95);
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
    let lower = stdlib.base.dists.beta.quantile(p / 2, x, n - x + 1);
    let upper = stdlib.base.dists.beta.quantile(1 - p / 2, x + 1, n - x);
    if (x == 0) {
        lower = 0.0
    }
    if (x == n) {
        upper = 1.0
    }
    return {proportion, lower, upper};
}
