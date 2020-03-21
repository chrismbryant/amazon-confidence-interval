/** 
 * Get exact binomial confidence interval based on the Beta distribution,
 * given a desired level of confidence.
 * 
 * @param {number} n - number of trials.
 * @param {number} x - number of successes (x <= n).
 * @param {number} conf - confidence level (between 0 and 1).
 * 
 * @returns {[number, number, number]} - [
 *     proportion - proportion of trials which succeeded,
 *     lower - lower bound on confidence interval,
 *     upper - upper bound on confidence interval 
 * ]
 */
function getBetaConfidenceInterval(n, x, conf=0.95) {
    const p = 1 - conf;
    const proportion = x/n;
    var lower = stdlib.base.dists.beta.quantile(p/2, x, n - x + 1);
    var upper = stdlib.base.dists.beta.quantile(1 - p/2, x + 1, n - x);
    if (x == 0) {lower = 0.0};
    if (x == n) {upper = 1.0};
    return [proportion, lower, upper];
}

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
 * @returns {[number, number, number]} - [
 *     proportion - proportion of ratings which were positive,
 *     lower - lower bound on confidence interval,
 *     upper - upper bound on confidence interval 
 * ]
 */
function evaluateRatings(ratingDistribution, numRatings) {
    const fracPositive = ratingDistribution[3] + ratingDistribution[4];
    const numPositive = Math.floor(fracPositive * numRatings);
    return getBetaConfidenceInterval(numRatings, numPositive, 0.95);
}

const ratingDistribution = [0.05, 0.04, 0.01, 0.10, 0.80];
console.log(ratingDistribution);
console.log(evaluateRatings(ratingDistribution, 1000));
